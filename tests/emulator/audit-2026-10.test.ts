/**
 * Audit de sécurité d'octobre 2026 : preuves sur émulateurs (données FICTIVES)
 * des constats A-01 à A-04 (docs/revues/REVUE-SECURITE-2026-10.md).
 * Chaque test décrit le comportement ACTUEL : il échouera une fois le constat
 * corrigé, et devra alors être inversé en test de non-régression.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from "firebase/functions";
import { FieldValue } from "firebase-admin/firestore";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { SECOND_SCHOOL, seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import { normalizeAuthPassword } from "../../src/security/accounts";

// ------------------------------------------------------------------ règles
// Projet distinct : les règles sont évaluées sans toucher aux données du
// projet des Functions.
const RULES_PROJECT = "demo-audit-rules";
const S = "ecole";
let env: RulesTestEnvironment;

const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

describe("règles", () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({ projectId: RULES_PROJECT, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      const member = (uid: string, role: string, extra: Record<string, unknown> = {}) =>
        setDoc(doc(db, "schools", S, "members", uid), { uid, schoolId: S, role, isActive: true, linkedStudentIds: [], ...extra });
      await setDoc(doc(db, "schools", S), { name: "École fictive" });
      await member("menage", "عامل نظافة / صيانة");
      await member("benevole", "متطوع");
      await member("admin", "إداري");
      await member("parent", "ولي أمر", { linkedStudentIds: ["S-1"] });
      await setDoc(doc(db, "schools", S, "salaryPayments", "sal1"), { schoolId: S, personName: "أستاذ وهمي", amount: 1800 });
      // Copie automatique écrite par useFinanceActions.handleSaveSalaryPayment.
      await setDoc(doc(db, "schools", S, "notifications", "n_sal"), {
        schoolId: S, id: "n_sal", title: "إصدار مستحق راتب", message: "تم تسجيل مستحق أستاذ وهمي لمبلغ 1800 د.م.", type: "مالي", isRead: false,
      });
      await setDoc(doc(db, "schools", S, "teachers", "t_dir"), { schoolId: S, fullName: "مدير وهمي", isArchived: false });
    });
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  it("A-01 : l'agent d'entretien et le bénévole lisent les salaires recopiés dans les notifications", async () => {
    for (const uid of ["menage", "benevole"]) {
      await assertFails(getDocs(collection(as(uid), "schools", S, "salaryPayments")));
      const notes = await assertSucceeds(getDocs(collection(as(uid), "schools", S, "notifications")));
      expect(notes.docs.map((d) => d.data().message).join(" ")).toContain("1800");
    }
  });

  it("A-02 (étape règles) : un إداري peut archiver n'importe quelle fiche du personnel", async () => {
    await assertSucceeds(updateDoc(doc(as("admin"), "schools", S, "teachers", "t_dir"), { isArchived: true }));
  });

  it("A-04 : un parent écrit dans son propre nom un objet ou un texte de 900 Ko", async () => {
    const self = doc(as("parent"), "schools", S, "members", "parent");
    await assertSucceeds(setDoc(self, { fullName: { piege: 1 } }, { merge: true }));
    await assertSucceeds(setDoc(self, { fullName: "x".repeat(900_000) }, { merge: true }));
  });
});

// --------------------------------------------------------------- Functions
const PROJECT = "demo-quran-school";
const DIR2 = { username: "dir2_alfajr", password: "demo-dir2-2026" };
let admin: AdminHandles;
let app: FirebaseApp;
let auth: Auth;
let functions: Functions;

async function login(username: string, password: string) {
  await signOut(auth).catch(() => undefined);
  await signInWithEmailAndPassword(auth, `${username}@comptes.kuttab.local`, normalizeAuthPassword(password));
  await auth.currentUser!.getIdToken(true);
}

async function uidOf(username: string) {
  return (await admin.db.doc(`usernames/${username}`).get()).data()!.uid as string;
}

async function waitFor(check: () => Promise<boolean>, ms = 15_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/** Second directeur d'alfajr, sans la protection « u1 » ni le claim super-admin. */
async function addSecondDirector(schoolId: string, extra: Record<string, unknown> = {}) {
  const email = `${DIR2.username}@comptes.kuttab.local`;
  const uid = (await admin.auth.createUser({ email, password: normalizeAuthPassword(DIR2.password) })).uid;
  await admin.db.doc(`usernames/${DIR2.username}`).set({ uid, email });
  await admin.db.doc(`schools/${schoolId}/members/${uid}`).set({
    uid, schoolId, username: DIR2.username, fullName: "مدير ثان", role: "مدير", isActive: true, isArchived: false,
    linkedTeacherId: null, linkedStudentIds: [], ...extra,
  });
  await admin.db.doc(`users/${uid}`).set({ username: DIR2.username, schoolIds: FieldValue.arrayUnion(schoolId), mustChangePassword: false }, { merge: true });
  return uid;
}

describe("Cloud Functions", () => {
  beforeAll(async () => {
    admin = initAdmin(PROJECT, "(default)", true, "audit-2026-10");
    await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
    await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
    await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
    await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, superAdminUsername: "admin_alfajr", rotatePasswords: "none" });
    await seedSecondSchool(admin.db, admin.auth);

    app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `audit-${Date.now()}`);
    auth = getAuth(app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    functions = getFunctions(app, "europe-west1");
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  });

  afterAll(async () => {
    await signOut(auth).catch(() => undefined);
    if (app) await deleteApp(app);
    await admin?.close();
  });

  it("A-02 : archiver la fiche liée à un directeur (non u1) suspend son appartenance et désactive son compte", async () => {
    const dirUid = await addSecondDirector("annour", { linkedTeacherId: "t_dir" });
    await admin.db.doc("schools/annour/teachers/t_dir").set({ schoolId: "annour", fullName: "مدير ثان", isArchived: false });
    // Écriture permise à un إداري par les règles (test « A-02 (étape règles) »).
    await admin.db.doc("schools/annour/teachers/t_dir").update({ isArchived: true });

    const suspended = await waitFor(async () => (await admin.db.doc(`schools/annour/members/${dirUid}`).get()).data()?.isActive === false);
    expect(suspended).toBe(true);
    expect(await waitFor(async () => (await admin.auth.getUser(dirUid)).disabled === true)).toBe(true);
    // Remise en état pour les tests suivants.
    await admin.auth.deleteUser(dirUid);
    await admin.db.doc(`usernames/${DIR2.username}`).delete();
    await admin.db.doc(`schools/annour/members/${dirUid}`).delete();
  });

  it("A-03 : le directeur d'une autre école rattache un compte d'alfajr ; le directeur d'alfajr ne peut plus réinitialiser son mot de passe ni le désactiver en le retirant", async () => {
    await addSecondDirector("alfajr");
    const victim = await uidOf("youssef_baqali");
    const reset = httpsCallable(functions, "resetUserPassword");

    await login(DIR2.username, DIR2.password);
    await reset({ schoolId: "alfajr", uid: victim, newPassword: "avant-rattachement-1" });

    await login(SECOND_SCHOOL.director.username, SECOND_SCHOOL.director.password);
    await httpsCallable(functions, "createSchoolUser")({ schoolId: "annour", username: "youssef_baqali", attachExisting: true, fullName: "x", role: "طالب" });

    await login(DIR2.username, DIR2.password);
    await expect(reset({ schoolId: "alfajr", uid: victim, newPassword: "apres-rattachement-1" })).rejects.toMatchObject({ code: "functions/permission-denied" });
    await httpsCallable(functions, "setMemberRole")({ schoolId: "alfajr", uid: victim, remove: true });
    expect((await admin.auth.getUser(victim)).disabled).toBe(false);
  });
});
