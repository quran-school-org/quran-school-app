/**
 * Cloud Functions multi-écoles de bout en bout, appelées par le SDK client à
 * travers l'émulateur Functions, sur des données migrées (fixture fictive).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from "firebase/functions";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { DEMO_PASSWORDS, legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { SECOND_SCHOOL, seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import { normalizeAuthPassword } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const REGION = "europe-west1";
let admin: AdminHandles;
let app: FirebaseApp;
let auth: Auth;
let functions: Functions;

async function login(email: string, password: string) {
  await signOut(auth).catch(() => undefined);
  await signInWithEmailAndPassword(auth, email, normalizeAuthPassword(password));
  await auth.currentUser!.getIdToken(true);
}

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "tenant-functions-test");
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, superAdminUsername: "admin_alfajr" });
  await seedSecondSchool(admin.db, admin.auth);

  app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `tf-${Date.now()}`);
  auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
});

afterAll(async () => {
  await signOut(auth).catch(() => undefined);
  if (app) await deleteApp(app);
  await admin?.close();
});

describe("callables multi-écoles", () => {
  it("seul le super-admin crée une école", async () => {
    await login(`${SECOND_SCHOOL.director.username}@comptes.kuttab.local`, SECOND_SCHOOL.director.password);
    await expect(httpsCallable(functions, "createSchool")({ schoolId: "pirate", name: "x" })).rejects.toMatchObject({ code: "functions/permission-denied" });

    await login("admin_alfajr@alfajr.local", DEMO_PASSWORDS.director);
    await httpsCallable(functions, "createSchool")({ schoolId: "essai", name: "مدرسة التجربة", makeMeDirector: true });
    const uid = auth.currentUser!.uid;
    expect((await admin.db.doc(`schools/essai/members/${uid}`).get()).data()?.role).toBe("مدير");
  });

  it("un directeur crée un compte dans SON école seulement", async () => {
    await login(`${SECOND_SCHOOL.director.username}@comptes.kuttab.local`, SECOND_SCHOOL.director.password);
    const create = httpsCallable<any, { uid: string; username: string }>(functions, "createSchoolUser");
    const res = await create({ schoolId: "annour", username: "parent_annour", password: "motdepasse-2026", fullName: "ولي أمر", role: "ولي أمر", linkedStudentIds: ["S-101"] });
    expect(res.data.username).toBe("parent_annour");
    await expect(create({ schoolId: "alfajr", username: "intrus", password: "motdepasse-2026", fullName: "x", role: "مدير" })).rejects.toMatchObject({ code: "functions/permission-denied" });
    // Nom déjà pris dans l'autre école (unicité sur toute la plateforme)
    await expect(create({ schoolId: "annour", username: "mohammed_alami", password: "motdepasse-2026", fullName: "x", role: "مدرس" })).rejects.toMatchObject({ code: "functions/already-exists" });
    await login("parent_annour@comptes.kuttab.local", "motdepasse-2026");
  });

  it("réinitialisation : interdite sur un compte partagé avec une autre école", async () => {
    await login(`${SECOND_SCHOOL.director.username}@comptes.kuttab.local`, SECOND_SCHOOL.director.password);
    const khalid = (await admin.db.doc("usernames/khalid_tazi").get()).data()!.uid;
    await expect(httpsCallable(functions, "resetUserPassword")({ schoolId: "annour", uid: khalid, newPassword: "piratage-2026" }))
      .rejects.toMatchObject({ code: "functions/permission-denied" });
  });

  it("setMemberRole : le directeur change un rôle, pas le sien", async () => {
    await login(`${SECOND_SCHOOL.director.username}@comptes.kuttab.local`, SECOND_SCHOOL.director.password);
    const prof = (await admin.db.doc(`usernames/${SECOND_SCHOOL.teacher.username}`).get()).data()!.uid;
    await httpsCallable(functions, "setMemberRole")({ schoolId: "annour", uid: prof, patch: { role: "مؤطر" } });
    expect((await admin.db.doc(`schools/annour/members/${prof}`).get()).data()?.role).toBe("مؤطر");
    await expect(httpsCallable(functions, "setMemberRole")({ schoolId: "annour", uid: auth.currentUser!.uid, patch: { role: "مدرس" } }))
      .rejects.toMatchObject({ code: "functions/failed-precondition" });
  });
});

describe("fonction api (HTTP)", () => {
  const url = `http://127.0.0.1:5001/${PROJECT}/${REGION}/api/api/gemini/analyze`;
  const body = { schoolId: "alfajr", studentName: "ياسين العلمي", hizbCount: 5, attendanceRate: 95 };

  it("401 sans jeton, 403 pour un parent, rapport (ou repli) pour un enseignant", async () => {
    expect((await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).status).toBe(401);

    await login("mohammed_alami@alfajr.local", "123");
    let token = await auth.currentUser!.getIdToken();
    expect((await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })).status).toBe(403);

    await login("youssef_baqali@alfajr.local", "123");
    token = await auth.currentUser!.getIdToken();
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.summary).toBe("string"); // sans clé Gemini sur l'émulateur : rapport de repli
    expect(json.errorInfo).toBeUndefined();
  });
});

// Ignoré quand l'émulateur ne peut pas enregistrer les triggers (voir
// functions/src/index.ts) ; la logique est alors couverte par functions/test.
const triggersDisabled = process.env.EMULATOR_SKIP_FIRESTORE_TRIGGERS === "true";

describe.skipIf(triggersDisabled)("archivage = compte suspendu (triggers, de bout en bout)", () => {
  async function waitFor(check: () => Promise<boolean>, timeoutMs = 20_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await check()) return;
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error("Délai dépassé en attendant le trigger");
  }

  it("archiver une fiche suspend le membre lié dans cette école seulement", async () => {
    const youssef = (await admin.db.doc("usernames/youssef_baqali").get()).data()!.uid;
    const member = () => admin.db.doc(`schools/alfajr/members/${youssef}`).get().then((d) => d.data()!);
    await admin.db.doc("schools/alfajr/teachers/t1").update({ isArchived: true });
    await waitFor(async () => (await member()).isActive === false);
    await waitFor(async () => (await admin.auth.getUser(youssef)).disabled === true);

    await admin.db.doc("schools/alfajr/teachers/t1").update({ isArchived: false });
    await waitFor(async () => (await member()).isActive === true);
    expect((await admin.auth.getUser(youssef)).disabled).toBe(false);
  });

  it("un compte actif dans une autre école garde son accès Firebase Auth", async () => {
    const khalid = (await admin.db.doc("usernames/khalid_tazi").get()).data()!.uid;
    await admin.db.doc("schools/alfajr/teachers/t2").update({ isArchived: true });
    await waitFor(async () => (await admin.db.doc(`schools/alfajr/members/${khalid}`).get()).data()!.isActive === false);
    expect((await admin.auth.getUser(khalid)).disabled).toBe(false);
    expect((await admin.db.doc(`schools/annour/members/${khalid}`).get()).data()!.isActive).toBe(true);
  });
});
