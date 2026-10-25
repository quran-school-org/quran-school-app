/**
 * Audit de sécurité d'octobre 2026 (docs/revues/REVUE-SECURITE-2026-10.md),
 * sur émulateurs, données FICTIVES. Correctifs A-01, A-02 et A-04 (D86) :
 * ces tests vérifient que les abus démontrés par l'audit sont refusés.
 * A-03 est reporté (décision du 24/10/2026) : son test décrit le comportement
 * actuel et devra être inversé quand il sera corrigé.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from "firebase/firestore";
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
const notif = (id: string, audience: string | null, message: string) => ({
  schoolId: S, id, title: "t", message, type: audience === "office" ? "مالي" : "تنبيه", isRead: false,
  ...(audience ? { audience } : {}),
});

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
      await member("prof", "مدرس");
      await member("admin", "إداري");
      await member("parent", "ولي أمر", { linkedStudentIds: ["S-1"] });
      await setDoc(doc(db, "schools", S, "salaryPayments", "sal1"), { schoolId: S, personName: "أستاذ وهمي", amount: 1800 });
      // Copie automatique écrite par useFinanceActions.handleSaveSalaryPayment (bureau).
      await setDoc(doc(db, "schools", S, "notifications", "n_sal"), notif("n_sal", "office", "تم تسجيل مستحق أستاذ وهمي لمبلغ 1800 د.م."));
      // Notification héritée, sans destinataires : bureau seulement.
      await setDoc(doc(db, "schools", S, "notifications", "n_old"), notif("n_old", null, "مبلغ 500 د.م."));
      await setDoc(doc(db, "schools", S, "notifications", "n_note"), notif("n_note", "educators", "نتيجة اختبار جديدة"));
      await setDoc(doc(db, "schools", S, "notifications", "n_tous"), notif("n_tous", "staff", "اجتماع الطاقم"));
      await setDoc(doc(db, "schools", S, "teachers", "t_dir"), { schoolId: S, fullName: "مدير وهمي", isArchived: false });
    });
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  describe("A-01 corrigé : notifications par destinataires", () => {
    const ids = (snap: { docs: { id: string }[] }) => snap.docs.map((d) => d.id).sort();

    it("entretien et bénévole : ni salaires ni notifications du bureau, seulement « tout le personnel »", async () => {
      for (const uid of ["menage", "benevole"]) {
        const db = as(uid);
        await assertFails(getDocs(collection(db, "schools", S, "salaryPayments")));
        await assertFails(getDocs(collection(db, "schools", S, "notifications")));
        for (const id of ["n_sal", "n_old", "n_note"]) await assertFails(getDoc(doc(db, "schools", S, "notifications", id)));
        const mine = await assertSucceeds(getDocs(query(collection(db, "schools", S, "notifications"), where("audience", "in", ["staff"]))));
        expect(ids(mine)).toEqual(["n_tous"]);
        await assertFails(getDocs(query(collection(db, "schools", S, "notifications"), where("audience", "in", ["educators", "staff"]))));
      }
    });

    it("enseignant : notifications pédagogiques et générales, jamais celles du bureau", async () => {
      const db = as("prof");
      await assertFails(getDocs(collection(db, "schools", S, "notifications")));
      await assertFails(getDoc(doc(db, "schools", S, "notifications", "n_sal")));
      const mine = await assertSucceeds(getDocs(query(collection(db, "schools", S, "notifications"), where("audience", "in", ["educators", "staff"]))));
      expect(ids(mine)).toEqual(["n_note", "n_tous"]);
    });

    it("le bureau lit tout, y compris les notifications héritées", async () => {
      const all = await assertSucceeds(getDocs(collection(as("admin"), "schools", S, "notifications")));
      expect(ids(all)).toEqual(["n_note", "n_old", "n_sal", "n_tous"]);
    });

    it("personne ne crée une notification pour des destinataires qu'il ne voit pas", async () => {
      await assertFails(setDoc(doc(as("prof"), "schools", S, "notifications", "n_x1"), notif("n_x1", "office", "faux")));
      await assertFails(setDoc(doc(as("prof"), "schools", S, "notifications", "n_x2"), notif("n_x2", null, "faux")));
      await assertSucceeds(setDoc(doc(as("prof"), "schools", S, "notifications", "n_x3"), notif("n_x3", "educators", "absence")));
      await assertFails(setDoc(doc(as("benevole"), "schools", S, "notifications", "n_x4"), notif("n_x4", "educators", "faux")));
      await assertSucceeds(setDoc(doc(as("benevole"), "schools", S, "notifications", "n_x5"), notif("n_x5", "staff", "info")));
      await assertSucceeds(setDoc(doc(as("admin"), "schools", S, "notifications", "n_x6"), notif("n_x6", "office", "recette")));
    });

    it("hors bureau, on ne marque comme lue qu'une notification qu'on peut lire", async () => {
      await assertFails(updateDoc(doc(as("benevole"), "schools", S, "notifications", "n_sal"), { readBy: arrayUnion("benevole") }));
      await assertSucceeds(updateDoc(doc(as("benevole"), "schools", S, "notifications", "n_tous"), { readBy: arrayUnion("benevole") }));
    });
  });

  it("A-02 (étape règles, inchangée) : un إداري peut archiver une fiche du personnel ; le trigger protège le directeur", async () => {
    await assertSucceeds(updateDoc(doc(as("admin"), "schools", S, "teachers", "t_dir"), { isArchived: true }));
  });

  describe("A-04 corrigé : nom et téléphone de son profil bornés", () => {
    const self = () => doc(as("parent"), "schools", S, "members", "parent");

    it("objet, texte de 900 Ko ou téléphone non textuel : refusés", async () => {
      await assertFails(setDoc(self(), { fullName: { piege: 1 } }, { merge: true }));
      await assertFails(setDoc(self(), { fullName: "x".repeat(900_000) }, { merge: true }));
      await assertFails(setDoc(self(), { fullName: "x".repeat(121) }, { merge: true }));
      await assertFails(setDoc(self(), { phone: 612345678 }, { merge: true }));
      await assertFails(setDoc(self(), { lastLogin: { t: 1 } }, { merge: true }));
    });

    it("un nom et un téléphone normaux passent toujours", async () => {
      await assertSucceeds(setDoc(self(), { fullName: "محمد العلمي", phone: "0661000001", lastLogin: new Date().toISOString() }, { merge: true }));
      await assertSucceeds(setDoc(self(), { phone: null }, { merge: true }));
    });
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

/** Second directeur, sans la protection « u1 » ni le claim super-admin. */
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

async function removeSecondDirector(uid: string, schoolId: string) {
  await admin.auth.deleteUser(uid);
  await admin.db.doc(`usernames/${DIR2.username}`).delete();
  await admin.db.doc(`schools/${schoolId}/members/${uid}`).delete();
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

  it("A-02 corrigé : archiver la fiche liée à un directeur ne le suspend pas ; un enseignant lié reste suspendu", async () => {
    const dirUid = await addSecondDirector("annour", { linkedTeacherId: "t_dir" });
    await admin.db.doc("schools/annour/teachers/t_dir").set({ schoolId: "annour", fullName: "مدير ثان", isArchived: false });
    const profUid = await uidOf(SECOND_SCHOOL.teacher.username); // مدرس lié à la fiche t1 d'annour
    await admin.db.doc("schools/annour/teachers/t_dir").update({ isArchived: true });
    await admin.db.doc("schools/annour/teachers/t1").update({ isArchived: true });

    // Témoin : l'enseignant lié est bien suspendu par le même trigger.
    expect(await waitFor(async () => (await admin.db.doc(`schools/annour/members/${profUid}`).get()).data()?.isActive === false)).toBe(true);
    // Laisse au trigger de la fiche t_dir (écrite avant t1) le temps de passer.
    await new Promise((r) => setTimeout(r, 2000));
    const director = (await admin.db.doc(`schools/annour/members/${dirUid}`).get()).data();
    expect(director?.isActive).toBe(true);
    expect((await admin.auth.getUser(dirUid)).disabled).toBe(false);

    await admin.db.doc("schools/annour/teachers/t1").update({ isArchived: false });
    await waitFor(async () => (await admin.db.doc(`schools/annour/members/${profUid}`).get()).data()?.isActive === true);
    await removeSecondDirector(dirUid, "annour");
  });

  it("A-03 (reporté, comportement actuel) : un rattachement par une autre école retire au directeur d'origine la réinitialisation", async () => {
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
