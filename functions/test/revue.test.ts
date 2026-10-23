/**
 * Revue de sécurité (étape 2) — Cloud Functions multi-écoles.
 * Chaque test démontrait une faille avant correctif (voir
 * docs/revues/REVUE-SECURITE-ETAPE-2.md) et sert de non-régression.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let accounts: typeof import("../src/tenant/accounts.js");

const PROJECT = () => process.env.GCLOUD_PROJECT!;

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

async function makeUser(username: string, opts: { claims?: Record<string, unknown>; register?: boolean; domain?: string } = {}) {
  const rec = await admin.adminAuth().createUser({ email: `${username}@${opts.domain ?? "alfajr.local"}`, password: "motdepasse-2026", displayName: username });
  if (opts.claims) await admin.adminAuth().setCustomUserClaims(rec.uid, opts.claims);
  if (opts.register !== false) await admin.adminDb().collection("usernames").doc(username).set({ uid: rec.uid });
  return rec.uid;
}

async function addMember(schoolId: string, uid: string, role: string, extra: Record<string, unknown> = {}) {
  const db = admin.adminDb();
  await db.doc(`schools/${schoolId}`).set({ name: schoolId }, { merge: true });
  await db.doc(`schools/${schoolId}/members/${uid}`).set({ uid, schoolId, role, isActive: true, isArchived: false, linkedStudentIds: [], linkedTeacherId: null, ...extra });
  const { FieldValue } = await import("firebase-admin/firestore");
  await db.doc(`users/${uid}`).set({ schoolIds: FieldValue.arrayUnion(schoolId) }, { merge: true });
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  accounts = await import("../src/tenant/accounts.js");
});

beforeEach(clear);

describe("F-01 rattachement d'un compte existant (attachExisting)", () => {
  it("un compte créé par l'inscription libre (absent du registre) n'est jamais rattaché", async () => {
    const dirB = await makeUser("dir_b");
    await addMember("annour", dirB, "مدير");
    // Un tiers anticipe un identifiant et crée lui-même le compte Auth (inscription libre).
    const squatter = await makeUser("nouvelle_prof", { register: false, domain: "comptes.kuttab.local" });
    await expect(accounts.createSchoolUserCore(dirB, { schoolId: "annour", username: "nouvelle_prof", attachExisting: true, fullName: "Prof", role: "مدرس" }))
      .rejects.toMatchObject({ code: "not-found" });
    expect((await admin.adminDb().doc(`schools/annour/members/${squatter}`).get()).exists).toBe(false);
  });

  it("un compte désactivé (suspendu, retiré) n'est pas réactivé par le directeur d'une autre école", async () => {
    const dirB = await makeUser("dir_b");
    await addMember("annour", dirB, "مدير");
    const fired = await makeUser("prof_suspendu");
    await addMember("alfajr", fired, "مدرس", { isActive: false, isArchived: true });
    await admin.adminAuth().updateUser(fired, { disabled: true });
    await expect(accounts.createSchoolUserCore(dirB, { schoolId: "annour", username: "prof_suspendu", attachExisting: true, fullName: "Prof", role: "مدير" }))
      .rejects.toMatchObject({ code: "failed-precondition" });
    expect((await admin.adminAuth().getUser(fired)).disabled).toBe(true);
    expect((await admin.adminDb().doc(`schools/annour/members/${fired}`).get()).exists).toBe(false);
  });

  it("le super-admin peut rattacher (et réactiver) un compte désactivé", async () => {
    const fired = await makeUser("prof_suspendu");
    await addMember("alfajr", fired, "مدرس", { isActive: false });
    await admin.adminAuth().updateUser(fired, { disabled: true });
    await accounts.createSchoolUserCore("super", { schoolId: "annour", username: "prof_suspendu", attachExisting: true, fullName: "Prof", role: "مدرس" }, { superAdmin: true });
    expect((await admin.adminAuth().getUser(fired)).disabled).toBe(false);
  });
});

describe("F-02 réinitialisation du mot de passe du directeur historique", () => {
  it("un autre directeur de l'école ne peut pas prendre le compte protégé (u1)", async () => {
    const u1 = await makeUser("admin_alfajr");
    await addMember("alfajr", u1, "مدير", { legacyAppUserId: "u1" });
    const coDirector = await makeUser("co_directeur");
    await addMember("alfajr", coDirector, "مدير");
    await expect(accounts.resetUserPasswordCore({ uid: coDirector, superAdmin: false }, "alfajr", u1, "prise-de-compte-2026"))
      .rejects.toMatchObject({ code: "permission-denied" });
    // Le super-admin le peut (récupération du compte).
    await accounts.resetUserPasswordCore({ uid: "super", superAdmin: true }, "alfajr", u1, "recuperation-2026");
  });
});

describe("hypothèse réfutée : course à la création de comptes", () => {
  it("deux créations simultanées du même identifiant : une seule réussit, un seul compte Auth, registre cohérent", async () => {
    const dir = await makeUser("dir_a");
    await addMember("alfajr", dir, "مدير");
    const input = { schoolId: "alfajr", username: "meme_nom", password: "motdepasse-2026", fullName: "x", role: "مدرس" };
    const results = await Promise.allSettled([accounts.createSchoolUserCore(dir, input), accounts.createSchoolUserCore(dir, input), accounts.createSchoolUserCore(dir, input)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const winner = (results.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ uid: string }>).value.uid;
    const users = (await admin.adminAuth().listUsers(100)).users.filter((u) => u.email?.startsWith("meme_nom@"));
    expect(users.map((u) => u.uid)).toEqual([winner]);
    expect((await admin.adminDb().doc("usernames/meme_nom").get()).data()?.uid).toBe(winner);
    expect((await admin.adminDb().collection("schools/alfajr/members").where("username", "==", "meme_nom").get()).size).toBe(1);
  });
});
