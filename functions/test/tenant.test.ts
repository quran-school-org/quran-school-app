/**
 * Cloud Functions multi-écoles : logique métier testée par appel direct contre
 * les émulateurs Firestore et Auth (createSchool, createSchoolUser,
 * resetUserPassword, setMemberRole, triggers d'archivage, route de santé de api).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let accounts: typeof import("../src/tenant/accounts.js");
let archive: typeof import("../src/tenant/archiveSync.js");
let api: typeof import("../src/tenant/api.js");

const PROJECT = () => process.env.GCLOUD_PROJECT!;

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

async function makeUser(username: string, password = "motdepasse-2026", claims?: Record<string, unknown>) {
  const rec = await admin.adminAuth().createUser({ email: `${username}@alfajr.local`, password, displayName: username });
  if (claims) await admin.adminAuth().setCustomUserClaims(rec.uid, claims);
  await admin.adminDb().collection("usernames").doc(username).set({ uid: rec.uid });
  return rec.uid;
}

async function addMember(schoolId: string, uid: string, role: string, extra: Record<string, unknown> = {}) {
  const db = admin.adminDb();
  await db.doc(`schools/${schoolId}`).set({ name: schoolId }, { merge: true });
  await db.doc(`schools/${schoolId}/members/${uid}`).set({ uid, schoolId, role, isActive: true, isArchived: false, linkedStudentIds: [], linkedTeacherId: null, ...extra });
  const { FieldValue } = await import("firebase-admin/firestore");
  await db.doc(`users/${uid}`).set({ schoolIds: FieldValue.arrayUnion(schoolId) }, { merge: true });
}

async function idToken(email: string, password: string): Promise<string> {
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return (await res.json()).idToken;
}

function fakeRes() {
  const out: { status: number; body: any } = { status: 200, body: null };
  const res: any = { status(code: number) { out.status = code; return res; }, json(b: unknown) { out.body = b; } };
  return { res, out };
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  accounts = await import("../src/tenant/accounts.js");
  archive = await import("../src/tenant/archiveSync.js");
  api = await import("../src/tenant/api.js");
});

beforeEach(clear);

describe("createSchool", () => {
  it("crée l'école, ses paramètres par défaut et fait de l'appelant le directeur", async () => {
    const uid = await makeUser("super_admin", "motdepasse-2026", { superAdmin: true });
    await accounts.createSchoolCore(uid, { schoolId: "annour", name: "مدرسة النور", makeMeDirector: true });
    const db = admin.adminDb();
    expect((await db.doc("schools/annour").get()).data()).toMatchObject({ name: "مدرسة النور", status: "active" });
    expect((await db.doc("schools/annour/settings/system").get()).data()).toMatchObject({ associationName: "مدرسة النور", subscriptionFee: 100, schoolId: "annour" });
    expect((await db.doc(`schools/annour/members/${uid}`).get()).data()).toMatchObject({ role: "مدير", isActive: true });
    expect((await db.doc(`users/${uid}`).get()).data()?.schoolIds).toEqual(["annour"]);
    await expect(accounts.createSchoolCore(uid, { schoolId: "annour", name: "x" })).rejects.toMatchObject({ code: "already-exists" });
    await expect(accounts.createSchoolCore(uid, { schoolId: "Pas Valide", name: "x" })).rejects.toMatchObject({ code: "invalid-argument" });
  });
});

describe("createSchoolUser", () => {
  it("crée un compte sur le nouveau domaine, unique sur toute la plateforme", async () => {
    const dir = await makeUser("dir_a");
    await addMember("alfajr", dir, "مدير");
    const res = await accounts.createSchoolUserCore(dir, { schoolId: "alfajr", username: "Nouvelle_Prof", password: "motdepasse-2026", fullName: "أستاذة", role: "مدرس", linkedTeacherId: "t1", linkedStudentIds: ["S-1"] });
    expect(res.username).toBe("nouvelle_prof");
    const rec = await admin.adminAuth().getUser(res.uid);
    expect(rec.email).toBe("nouvelle_prof@comptes.kuttab.local");
    const db = admin.adminDb();
    expect((await db.doc(`usernames/nouvelle_prof`).get()).data()?.uid).toBe(res.uid);
    expect((await db.doc(`users/${res.uid}`).get()).data()).toMatchObject({ schoolIds: ["alfajr"], mustChangePassword: true });
    const member = (await db.doc(`schools/alfajr/members/${res.uid}`).get()).data()!;
    expect(member).toMatchObject({ role: "مدرس", linkedTeacherId: "t1", linkedStudentIds: [] });
    expect(member.password).toBeUndefined();
    // Un identifiant historique (@alfajr.local) bloque aussi le nom.
    await expect(accounts.createSchoolUserCore(dir, { schoolId: "alfajr", username: "dir_a", password: "motdepasse-2026", fullName: "x", role: "مدرس" })).rejects.toMatchObject({ code: "already-exists" });
  });

  it("rattache un compte existant à une seconde école", async () => {
    const dirB = await makeUser("dir_b");
    await addMember("annour", dirB, "مدير");
    const prof = await makeUser("prof_a");
    await addMember("alfajr", prof, "مدرس");
    await accounts.createSchoolUserCore(dirB, { schoolId: "annour", username: "prof_a", attachExisting: true, fullName: "Prof", role: "مؤطر" });
    const db = admin.adminDb();
    expect((await db.doc(`schools/annour/members/${prof}`).get()).data()?.role).toBe("مؤطر");
    expect((await db.doc(`users/${prof}`).get()).data()?.schoolIds.sort()).toEqual(["alfajr", "annour"]);
    await expect(accounts.createSchoolUserCore(dirB, { schoolId: "annour", username: "prof_a", attachExisting: true, fullName: "Prof", role: "مؤطر" })).rejects.toMatchObject({ code: "already-exists" });
  });
});

describe("resetUserPassword", () => {
  it("refuse de réinitialiser un compte partagé avec une école que l'appelant ne dirige pas", async () => {
    const dirA = await makeUser("dir_a");
    await addMember("alfajr", dirA, "مدير");
    const shared = await makeUser("partage");
    await addMember("alfajr", shared, "مدرس");
    await addMember("annour", shared, "مدير");
    await expect(accounts.resetUserPasswordCore({ uid: dirA, superAdmin: false }, "alfajr", shared, "nouveau-2026")).rejects.toMatchObject({ code: "permission-denied" });

    const local = await makeUser("local");
    await addMember("alfajr", local, "مدرس");
    await accounts.resetUserPasswordCore({ uid: dirA, superAdmin: false }, "alfajr", local, "nouveau-2026");
    expect((await admin.adminDb().doc(`users/${local}`).get()).data()?.mustChangePassword).toBe(true);
    expect(await idToken("local@alfajr.local", "nouveau-2026")).toBeTruthy();

    // Le super-admin peut tout réinitialiser.
    await accounts.resetUserPasswordCore({ uid: "super", superAdmin: true }, "alfajr", shared, "super-reset-2026");
  });
});

describe("setMemberRole", () => {
  it("modifie rôle, statut et liens ; interdit l'auto-rétrogradation et protège u1", async () => {
    const dir = await makeUser("dir_a");
    await addMember("alfajr", dir, "مدير");
    const p = await makeUser("parent_a");
    await addMember("alfajr", p, "ولي أمر");
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "alfajr", p, { linkedStudentIds: ["S-1", "S-2"], linkedTeacherId: "t9" }, false);
    const m = (await admin.adminDb().doc(`schools/alfajr/members/${p}`).get()).data()!;
    expect(m.linkedStudentIds).toEqual(["S-1", "S-2"]);
    expect(m.linkedTeacherId).toBeNull(); // un compte famille n'a pas de fiche du personnel

    await expect(accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "alfajr", dir, { role: "مدرس" }, false)).rejects.toMatchObject({ code: "failed-precondition" });
    await expect(accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "alfajr", dir, { isActive: false }, false)).rejects.toMatchObject({ code: "failed-precondition" });

    const u1 = await makeUser("admin_alfajr");
    await addMember("alfajr", u1, "مدير", { legacyAppUserId: "u1" });
    await expect(accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "alfajr", u1, { role: "إداري" }, false)).rejects.toMatchObject({ code: "failed-precondition" });
    await accounts.setMemberRoleCore({ uid: "super", superAdmin: true }, "alfajr", u1, { role: "إداري" }, false);
  });

  it("retirer le dernier rattachement désactive le compte Auth", async () => {
    const dir = await makeUser("dir_a");
    await addMember("alfajr", dir, "مدير");
    const t = await makeUser("prof_a");
    await addMember("alfajr", t, "مدرس");
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "alfajr", t, {}, true);
    expect((await admin.adminDb().doc(`schools/alfajr/members/${t}`).get()).exists).toBe(false);
    expect((await admin.adminDb().doc(`users/${t}`).get()).data()?.schoolIds).toEqual([]);
    expect((await admin.adminAuth().getUser(t)).disabled).toBe(true);
  });
});

describe("archivage = compte suspendu (par école)", () => {
  const snap = (data: Record<string, unknown>) => ({ data: () => data });
  const ev = (params: Record<string, string>, before: Record<string, unknown>, after: Record<string, unknown>) =>
    ({ params, data: { before: snap(before), after: snap(after) } }) as any;

  it("suspend le membre de cette école ; Auth reste actif s'il exerce ailleurs", async () => {
    const multi = await makeUser("multi");
    await addMember("alfajr", multi, "مدرس", { linkedTeacherId: "t1" });
    await addMember("annour", multi, "مدرس");
    const solo = await makeUser("solo");
    await addMember("alfajr", solo, "مدرس", { linkedTeacherId: "t1" });

    await archive.syncAccountsOnTeacherArchive.run(ev({ schoolId: "alfajr", teacherId: "t1" }, { isArchived: false }, { isArchived: true }));
    const db = admin.adminDb();
    expect((await db.doc(`schools/alfajr/members/${multi}`).get()).data()).toMatchObject({ isActive: false, isArchived: true });
    expect((await db.doc(`schools/annour/members/${multi}`).get()).data()?.isActive).toBe(true);
    expect((await admin.adminAuth().getUser(multi)).disabled).toBe(false);
    expect((await admin.adminAuth().getUser(solo)).disabled).toBe(true);

    await archive.syncAccountsOnTeacherArchive.run(ev({ schoolId: "alfajr", teacherId: "t1" }, { isArchived: true }, { isArchived: false }));
    expect((await admin.adminAuth().getUser(solo)).disabled).toBe(false);
    expect((await db.doc(`schools/alfajr/members/${solo}`).get()).data()?.isActive).toBe(true);
  });

  it("parent suspendu seulement quand tous ses enfants liés sont archivés", async () => {
    const db = admin.adminDb();
    await db.doc("schools/alfajr/students/S-1").set({ isArchived: true });
    await db.doc("schools/alfajr/students/S-2").set({ isArchived: false });
    const parent = await makeUser("parent_a");
    await addMember("alfajr", parent, "ولي أمر", { linkedStudentIds: ["S-1", "S-2"] });
    await archive.syncAccountsOnStudentArchive.run(ev({ schoolId: "alfajr", studentId: "S-1" }, { isArchived: false }, { isArchived: true }));
    expect((await db.doc(`schools/alfajr/members/${parent}`).get()).data()?.isActive).toBe(true);
    await db.doc("schools/alfajr/students/S-2").set({ isArchived: true });
    await archive.syncAccountsOnStudentArchive.run(ev({ schoolId: "alfajr", studentId: "S-2" }, { isArchived: false }, { isArchived: true }));
    expect((await db.doc(`schools/alfajr/members/${parent}`).get()).data()?.isActive).toBe(false);
  });
});

describe("fonction api (santé seulement, D76)", () => {
  it("route de santé", async () => {
    const { res, out } = fakeRes();
    api.handleApi({ method: "GET", path: "/api/health" }, res);
    expect(out.body.status).toBe("ok");
  });

  it("l'ancienne route du rapport IA n'existe plus : 404, aucun traitement", async () => {
    for (const method of ["POST", "GET"]) {
      const { res, out } = fakeRes();
      api.handleApi({ method, path: "/api/gemini/analyze" }, res);
      expect(out.status, method).toBe(404);
      expect(out.body).toEqual({ error: "not-found" });
    }
  });
});


describe("App Check (préparé, désactivé par défaut, D44)", () => {
  it("APPCHECK_ENFORCE vaut false par défaut (callables)", async () => {
    const ac = await import("../src/appCheck.js");
    expect(ac.appCheckEnforced()).toBe(false);
  });
});
