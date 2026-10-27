/**
 * scripts/dev/seed-school-fixtures.ts (actions seed-school-fixtures et
 * remove-school-fixtures d'ops.yml, D82) sur les émulateurs : volumes du jeu,
 * documents non marqués intacts (avant, après le seed et après --remove),
 * refus (prod, alfajr, école absente, vraie école), idempotence, comptes de
 * test (connexion comme l'application, droits par rôle selon les règles,
 * marquage compatible avec les écritures de l'interface), aucun mot de passe
 * dans la sortie.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { POSIX_MODES, runScript } from "./runScript";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore as ClientFirestore } from "firebase/firestore";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth as ClientAuth } from "firebase/auth";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import { defaultSchoolSettings } from "../../src/school/businessRules";
import { loginEmailCandidates, normalizeAuthPassword } from "../../src/security/accounts";
import { STAFF_PRIVATE_FIELDS, STAFF_PRIVATE_META_FIELDS } from "../../src/security/staffPrivate";
import { FIXTURE_COLLECTIONS, buildSchoolFixtures, countFixtures, isGeneratedDoc } from "../../scripts/dev/fixtures/school-fixtures";
import {
  TEST_ACCOUNTS,
  parseSeedSchoolFixturesArgs,
  runRemoveSchoolFixtures,
  runSeedSchoolFixtures,
  type Credential,
} from "../../scripts/dev/seed-school-fixtures";

const PROJECT = "demo-quran-school";
const PROD = "gen-lang-client-0481880143";
const DEV = "fajr-c4c6e";
const DOMAIN = "comptes.kuttab.local";
const S = "test1234";
const NOW = new Date("2026-10-24T10:00:00.000Z");
const TODAY = "2026-10-24";
const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };
let admin: AdminHandles;
let env: RulesTestEnvironment;
let app: FirebaseApp;
let clientAuth: ClientAuth;
let credentials: Credential[] = [];
const uids = new Map<string, string>();
/** Documents saisis « à la main » dans test1234 avant le seed : chemin → contenu. */
let manual = new Map<string, string>();

async function clearAll() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

/** Connexion exactement comme l'application (src/firebase.ts › signInWithUsername). */
async function canSignIn(username: string, password: string): Promise<boolean> {
  await signOut(clientAuth).catch(() => undefined);
  for (const email of loginEmailCandidates(username)) {
    try {
      await signInWithEmailAndPassword(clientAuth, email, normalizeAuthPassword(password));
      return true;
    } catch {
      /* domaine suivant */
    }
  }
  return false;
}

const pw = (username: string) => credentials.find((c) => c.username === username)!.password;
const dbAs = (username: string) => env.authenticatedContext(uids.get(username)!).firestore() as unknown as ClientFirestore;
const count = async (path: string) => (await admin.db.collection(path).count().get()).data().count;
const seed = (o: Partial<Parameters<typeof runSeedSchoolFixtures>[2]> = {}) =>
  runSeedSchoolFixtures(admin.db, admin.auth, { schoolId: S, size: "large", apply: true, outDir: null, now: NOW, ...o });

/** Tous les documents (chemin → contenu JSON) des sous-collections d'une école. */
async function dumpSchool(schoolId: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const col of await admin.db.doc(`schools/${schoolId}`).listCollections()) {
    for (const d of (await col.get()).docs) out.set(`${col.id}/${d.id}`, JSON.stringify(d.data()));
  }
  return out;
}

async function expectManualIntact() {
  const now = await dumpSchool(S);
  for (const [path, data] of manual) expect(now.get(path), path).toBe(data);
  expect((await admin.db.doc(`schools/${S}`).get()).data()).toMatchObject({ name: "مدرسة الاختبار", createdBy: "owner-uid" });
}

async function createSchool(id: string, name: string, students = 0) {
  await admin.db.doc(`schools/${id}`).set({ name, slug: id, status: "active", createdAt: "2026-10-20T08:00:00.000Z", createdBy: "owner-uid" });
  await admin.db.doc(`schools/${id}/settings/system`).set({ ...defaultSchoolSettings(name, new Date("2026-10-20T08:00:00Z")), schoolId: id });
  for (let i = 1; i <= students; i++) {
    await admin.db.doc(`schools/${id}/students/S-${i}`).set({ schoolId: id, fullName: `élève ${i}`, classId: "c1", isArchived: false });
  }
}

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "seed-school-fixtures-test");
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `seed-school-fixtures-${Date.now()}`);
  clientAuth = getAuth(app);
  connectAuthEmulator(clientAuth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  await clearAll();
  // École alfajr (copie fictive des données réelles, migrée) et école annour.
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, superAdminUsername: "admin_alfajr", rotatePasswords: "none" });
  await seedSecondSchool(admin.db, admin.auth);
  // École de test créée depuis l'interface (createSchool), avec quelques saisies à la main.
  await createSchool(S, "مدرسة الاختبار");
  const w = (path: string, data: Record<string, unknown>) => admin.db.doc(`schools/${S}/${path}`).set({ schoolId: S, ...data });
  await w("members/owner-uid", { uid: "owner-uid", username: "superadmin_demo", fullName: "مشرف عام", role: "مدير", isActive: true, permissions: null });
  await w("members/autre-uid", { uid: "autre-uid", username: "prof_test", fullName: "أستاذ", role: "مدرس", isActive: true, linkedTeacherId: "t_manuel" });
  await w("teachers/t_manuel", { id: "t_manuel", fullName: "أستاذ مضاف يدويا", category: "أستاذ / محفظ", phone: "0600000099", isArchived: false });
  await w("staffPrivate/t_manuel", { teacherId: "t_manuel", monthlySalary: 1000 });
  await w("notifications/n1", { id: "n1", title: "إشعار يدوي", message: "اختبار", date: "2026-10-20", type: "إداري", isRead: false });
  await w("notifications/n2", { id: "n2", title: "إشعار ثان", message: "اختبار", date: "2026-10-21", type: "نجاح", isRead: true });
  // Identifiant DEMO- sans le champ demoData : jamais touché.
  await w("notifications/DEMO-N-manuel", { id: "DEMO-N-manuel", title: "سجل يدوي بمعرف شبيه", message: "x", date: "2026-10-22", type: "إداري", isRead: false });
  manual = await dumpSchool(S);
  // Écoles pour les refus.
  await createSchool("vraie-ecole", "مدرسة حقيقية", 21);
  await createSchool("ecole-vingt", "مدرسة صغيرة", 20);
  await createSchool("autre-test", "مدرسة اختبار أخرى");
}, 120_000);

afterAll(async () => {
  await signOut(clientAuth).catch(() => undefined);
  if (app) await deleteApp(app);
  await env?.cleanup();
  await admin?.close();
});

describe("arguments : refus de la prod et d'alfajr, --school obligatoire", () => {
  it("refuse la prod dans tous les cas, même avec --apply, la confirmation et une école valide", () => {
    for (const e of [{}, emuEnv]) {
      expect(() => parseSeedSchoolFixturesArgs([`--project=${PROD}`], e)).toThrow(/PRODUCTION/);
      expect(() => parseSeedSchoolFixturesArgs([`--project=${PROD}`, `--school=${S}`, "--apply", `--confirm-prod=${PROD}`, "--database=x"], e)).toThrow(/PRODUCTION/);
      expect(() => parseSeedSchoolFixturesArgs([`--project=${PROD.toUpperCase()}`, "--school=alfajr", "--force"], e)).toThrow(/PRODUCTION/);
      expect(() => parseSeedSchoolFixturesArgs([`--project=${PROD}`, `--school=${S}`, "--remove"], e)).toThrow(/PRODUCTION/);
    }
  }, 300_000);

  it("refuse alfajr (toutes graphies), un identifiant invalide ou absent", () => {
    for (const e of [{}, emuEnv]) {
      for (const school of ["alfajr", "ALFAJR", " alfajr", "alfajr "]) {
        expect(() => parseSeedSchoolFixturesArgs([`--project=${DEV}`, `--school=${school}`, "--database=b"], e), school).toThrow(/alfajr/);
        expect(() => parseSeedSchoolFixturesArgs([`--project=${DEV}`, `--school=${school}`, "--remove", "--database=b"], e), school).toThrow(/alfajr/);
      }
    }
    for (const bad of ["ab", "Test1234", "test_1234", "a".repeat(41), "../x", "test 1234", "école", ""]) {
      expect(() => parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, `--school=${bad}`], emuEnv), bad).toThrow(/--school/);
    }
    expect(() => parseSeedSchoolFixturesArgs([`--project=${PROJECT}`], emuEnv)).toThrow(/--school=<id> est obligatoire/);
    expect(() => parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, "--school"], emuEnv)).toThrow(/--school/);
  }, 300_000);

  it("dev accepté (base de même identifiant que la prod) ; options inconnues, taille, --database et --confirm-prod", () => {
    const db = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";
    expect(parseSeedSchoolFixturesArgs([`--project=${DEV}`, `--database=${db}`, `--school=${S}`], {})).toMatchObject({ projectId: DEV, schoolId: S, size: "large", apply: false, remove: false });
    expect(() => parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, `--school=${S}`, "--force"], emuEnv)).toThrow(/inconnue/);
    expect(() => parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, `--school=${S}`, "--size=huge"], emuEnv)).toThrow(/--size/);
    expect(parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, `--school=${S}`, "--size=small"], emuEnv).size).toBe("small");
    expect(() => parseSeedSchoolFixturesArgs([`--project=${DEV}`, `--school=${S}`, "--apply"], {})).toThrow(/--database/);
    expect(() => parseSeedSchoolFixturesArgs([`--project=${DEV}`, "--database=b", `--school=${S}`, "--apply"], {})).toThrow(/--confirm-prod=fajr-c4c6e/);
    expect(() => parseSeedSchoolFixturesArgs([`--project=${DEV}`, `--school=${S}`], emuEnv)).toThrow(/mélange/);
    expect(parseSeedSchoolFixturesArgs([`--project=${PROJECT}`, `--school=${S}`, "--remove"], emuEnv)).toMatchObject({ remove: true, apply: false });
  }, 300_000);

  it("le script lancé sur la prod ou sur alfajr s'arrête avant toute connexion (code 1)", () => {
    for (const [args, msg] of [
      [[`--project=${PROD}`, `--school=${S}`, "--apply", "--force"], /PRODUCTION/],
      [[`--project=${PROJECT}`, "--school=alfajr", "--apply"], /alfajr/],
      [[`--project=${PROJECT}`, "--school=alfajr", "--remove", "--apply"], /alfajr/],
    ] as const) {
      const r = runScript(["scripts/dev/seed-school-fixtures.ts", ...args], { encoding: "utf8", env: { ...process.env } });
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/\[seed-school-fixtures\] ÉCHEC :/);
      expect(r.stderr).toMatch(msg);
      expect(r.stdout).not.toMatch(/ÉMULATEURS|PROJET RÉEL/);
    }
  }, 300_000);
});

describe("refus sur les émulateurs (rien n'est écrit)", () => {
  it("alfajr, école absente, école de plus de 20 vrais élèves ; 20 élèves acceptés", async () => {
    const alfajr = await dumpSchool("alfajr");
    for (const apply of [false, true]) {
      await expect(seed({ schoolId: "alfajr", apply })).rejects.toThrow(/FORBIDDEN_SCHOOL/);
      await expect(runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: "alfajr", apply, outDir: null })).rejects.toThrow(/FORBIDDEN_SCHOOL/);
      await expect(seed({ schoolId: "ecole-absente", apply })).rejects.toThrow(/SCHOOL_NOT_FOUND/);
      await expect(runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: "ecole-absente", apply, outDir: null })).rejects.toThrow(/SCHOOL_NOT_FOUND/);
      await expect(seed({ schoolId: "vraie-ecole", apply })).rejects.toThrow(/REAL_SCHOOL.*21 élèves/);
      await expect(runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: "vraie-ecole", apply, outDir: null })).rejects.toThrow(/REAL_SCHOOL/);
    }
    expect(await dumpSchool("alfajr")).toEqual(alfajr);
    expect((await admin.db.doc("schools/ecole-absente").listCollections()).length).toBe(0);
    expect(await count("schools/vraie-ecole/students")).toBe(21);
    expect(await count("schools/vraie-ecole/classes")).toBe(0);
    await expect(admin.auth.getUserByEmail(`test_admin@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
    const { summary } = await seed({ schoolId: "ecole-vingt", apply: false });
    expect(summary).toMatchObject({ mode: "simulation", schoolId: "ecole-vingt", unmarkedKept: { students: 20 } });
  }, 300_000);
});

describe("école test1234 : seed large, droits, idempotence", () => {
  it("simulation : aucune écriture, volumes annoncés", async () => {
    const { summary, credentials: c } = await seed({ apply: false });
    expect(c).toEqual([]);
    expect(summary).toMatchObject({ mode: "simulation", size: "large", skippedUnmarked: 0, accounts: { created: 4, reset: 0 } });
    expect(summary.writes.deleted).toBe(0);
    expect(summary.writes.total).toBeLessThan(20_000);
    expect(summary.unmarkedKept).toMatchObject({ teachers: 1, staffPrivate: 1, notifications: 3, members: 2, students: 0 });
    expect(await count(`schools/${S}/students`)).toBe(0);
    await expectManualIntact();
  }, 300_000);

  it("écrit le jeu large : volumes, schoolId, marquage, fiches RH séparées ; saisies manuelles intactes", async () => {
    const others = await Promise.all(["alfajr", "annour"].map(dumpSchool));
    const { summary, credentials: c } = await seed();
    credentials = c;
    const expected = countFixtures(buildSchoolFixtures({ schoolId: S, size: "large", now: NOW, settings: (await admin.db.doc(`schools/${S}/settings/system`).get()).data() }));
    expect(summary.collections).toEqual(expected);
    expect(summary.collections).toMatchObject({ students: 150, classes: 12, teachers: 15, staffPrivate: 15, activities: 4, notifications: 30 });
    expect(summary.collections.attendance).toBeGreaterThan(4000);
    expect(summary.collections.dailyProgress).toBeGreaterThan(1000);
    expect(summary.collections.grades).toBeGreaterThan(200);
    expect(summary.collections.payments).toBeGreaterThan(100);
    expect(summary.paymentMonths).toEqual(["2026-10"]); // ouverture : mois de création de l'école
    expect(summary).toMatchObject({ mode: "application", skippedUnmarked: 0, accounts: { created: 4, reset: 0 }, superAdminClaims: 0, otherSchoolMemberships: 0 });
    expect(summary.writes.total).toBeLessThan(20_000);

    for (const col of FIXTURE_COLLECTIONS) {
      const snap = await admin.db.collection(`schools/${S}/${col}`).get();
      const generated = snap.docs.filter((d) => isGeneratedDoc(col, d.id, d.data()));
      expect(generated.length, col).toBe(expected[col]);
      for (const d of generated) {
        const data = d.data();
        expect(data.schoolId, `${col}/${d.id}`).toBe(S);
        if (col === "staffPrivate") {
          expect(data).not.toHaveProperty("demoData");
          expect(Object.keys(data).every((k) => [...STAFF_PRIVATE_FIELDS, ...STAFF_PRIVATE_META_FIELDS].includes(k as never)), d.id).toBe(true);
        } else {
          expect(data.demoData).toBe(true);
          expect(col === "attendance" ? d.id.includes("_DEMO-S-") : d.id.startsWith("DEMO-"), d.id).toBe(true);
        }
        if (col === "teachers") for (const f of STAFF_PRIVATE_FIELDS) expect(data, d.id).not.toHaveProperty(f);
      }
    }
    const st = (await admin.db.doc(`schools/${S}/students/DEMO-S-001`).get()).data()!;
    expect(st).toMatchObject({ classId: "DEMO-C-01", gender: expect.stringMatching(/^(ذكر|أنثى)$/), parentPhone: expect.stringMatching(/^06 00 \d{2} \d{2} \d{2}$/) });
    expect(st.hizbCount).toBeGreaterThanOrEqual(0);
    expect(st.hizbCount).toBeLessThanOrEqual(60);
    await expectManualIntact();
    expect(await Promise.all(["alfajr", "annour"].map(dumpSchool))).toEqual(others);

    for (const a of TEST_ACCOUNTS) {
      const p = pw(a.username);
      expect(p.length).toBeGreaterThanOrEqual(16);
      const user = await admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`);
      uids.set(a.username, user.uid);
      expect(user.customClaims?.superAdmin).toBeUndefined();
      expect((await admin.db.doc(`usernames/${a.username}`).get()).data()).toMatchObject({ uid: user.uid, source: "seed-school-fixtures", schoolId: S });
      expect((await admin.db.doc(`users/${user.uid}`).get()).data()).toMatchObject({ username: a.username, schoolIds: [S], lastSchoolId: S, demoAccount: true, demoSchoolId: S });
      expect((await admin.db.doc(`schools/${S}/members/${user.uid}`).get()).data()).toMatchObject({ role: a.role, isActive: true, schoolId: S, demoData: true });
      expect(await canSignIn(a.username, p), a.username).toBe(true);
      expect((await clientAuth.currentUser!.getIdTokenResult(true)).claims.superAdmin).toBeUndefined();
      const blobs = JSON.stringify([(await admin.db.doc(`users/${user.uid}`).get()).data(), (await admin.db.doc(`schools/${S}/members/${user.uid}`).get()).data(), (await admin.db.doc(`usernames/${a.username}`).get()).data()]);
      expect(blobs).not.toContain(p);
    }
    expect(new Set(credentials.map((x) => x.password)).size).toBe(4);
    const member = async (u: string) => (await admin.db.doc(`schools/${S}/members/${uids.get(u)}`).get()).data()!;
    expect((await member("test_enseignant")).linkedTeacherId).toBe("DEMO-T-01");
    expect((await admin.db.collection(`schools/${S}/classes`).where("teacherId", "==", "DEMO-T-01").get()).size).toBe(2);
    const kids = (await member("test_parent")).linkedStudentIds as string[];
    expect(kids).toHaveLength(2);
    const [k1, k2] = await Promise.all(kids.map(async (k) => (await admin.db.doc(`schools/${S}/students/${k}`).get()).data()!));
    expect(k1.parentPhone).toBe(k2.parentPhone);
    expect((await member("test_eleve")).linkedStudentIds).toHaveLength(1);
    expect((await member("test_admin")).linkedTeacherId).toBe("DEMO-T-10");
  }, 300_000);

  it("règles : chaque compte de test lit selon son rôle, rien des autres écoles", async () => {
    const adm = dbAs("test_admin");
    for (const col of ["students", "payments", "staffPrivate", "salaryPayments", "expenses", "members", "notifications"]) await assertSucceeds(getDocs(collection(adm, "schools", S, col)));
    const prof = dbAs("test_enseignant");
    for (const col of ["students", "attendance", "dailyProgress", "grades", "classes", "teachers"]) await assertSucceeds(getDocs(collection(prof, "schools", S, col)));
    for (const col of ["staffPrivate", "payments", "expenses", "members"]) await assertFails(getDocs(collection(prof, "schools", S, col)));
    const parentUid = uids.get("test_parent")!;
    const kids = (await admin.db.doc(`schools/${S}/members/${parentUid}`).get()).data()!.linkedStudentIds as string[];
    const parent = dbAs("test_parent");
    for (const k of kids) await assertSucceeds(getDoc(doc(parent, "schools", S, "students", k)));
    await assertFails(getDoc(doc(parent, "schools", S, "students", "DEMO-S-150")));
    await assertFails(getDocs(collection(parent, "schools", S, "students")));
    const pay = await assertSucceeds(getDocs(query(collection(parent, "schools", S, "payments"), where("studentId", "in", kids))));
    expect(pay.size).toBeGreaterThan(0);
    await assertSucceeds(getDocs(query(collection(parent, "schools", S, "attendance"), where("studentId", "in", kids))));
    await assertFails(getDocs(collection(parent, "schools", S, "notifications")));
    const eleveId = ((await admin.db.doc(`schools/${S}/members/${uids.get("test_eleve")}`).get()).data()!.linkedStudentIds as string[])[0];
    const eleve = dbAs("test_eleve");
    await assertSucceeds(getDoc(doc(eleve, "schools", S, "students", eleveId)));
    await assertFails(getDoc(doc(eleve, "schools", S, "students", kids.find((k) => k !== eleveId)!)));
    await assertFails(getDocs(query(collection(eleve, "schools", S, "payments"), where("studentId", "in", [eleveId]))));
    for (const a of TEST_ACCOUNTS) {
      const db = dbAs(a.username);
      for (const other of ["alfajr", "annour", "autre-test"]) {
        await assertFails(getDoc(doc(db, "schools", other)));
        for (const col of ["students", "members", "staffPrivate", "payments"]) await assertFails(getDocs(collection(db, "schools", other, col)));
      }
      await assertFails(getDocs(collection(db, "schools")));
    }
  }, 300_000);

  it("marquage compatible avec les écritures de l'interface (fusion), et refusé dans staffPrivate", async () => {
    const adm = dbAs("test_admin");
    const prof = dbAs("test_enseignant");
    // Élève modifié comme saveToFirestore (setDoc en fusion du document complet).
    const st = (await admin.db.doc(`schools/${S}/students/DEMO-S-003`).get()).data()!;
    await assertSucceeds(setDoc(doc(prof, "schools", S, "students", "DEMO-S-003"), { ...st, hizbCount: 9, schoolId: S }, { merge: true }));
    // Fiche du personnel comme saveStaffToFirestore : fiche publique (garde demoData) + fiche RH sans demoData.
    const t = (await admin.db.doc(`schools/${S}/teachers/DEMO-T-05`).get()).data()!;
    await assertSucceeds(setDoc(doc(adm, "schools", S, "teachers", "DEMO-T-05"), { ...t, phone: "06 00 11 22 33", schoolId: S }, { merge: true }));
    await assertSucceeds(setDoc(doc(adm, "schools", S, "staffPrivate", "DEMO-T-05"), { monthlySalary: 2300, teacherId: "DEMO-T-05", schoolId: S, updatedAt: NOW.toISOString() }, { merge: true }));
    // Le même champ demoData dans staffPrivate serait refusé (liste fermée) : d'où l'exception de marquage.
    await assertFails(setDoc(doc(adm, "schools", S, "staffPrivate", "DEMO-T-05"), { demoData: true, teacherId: "DEMO-T-05", schoolId: S }, { merge: true }));
    // Présence modifiée par l'interface : même identifiant a_<date>_<élève>, pas de doublon.
    const attId = (await admin.db.collection(`schools/${S}/attendance`).where("date", "==", TODAY).limit(1).get()).docs[0].id;
    const att = (await admin.db.doc(`schools/${S}/attendance/${attId}`).get()).data()!;
    expect(attId).toBe(`a_${TODAY}_${att.studentId}`);
    await assertSucceeds(setDoc(doc(prof, "schools", S, "attendance", attId), { id: attId, date: TODAY, studentId: att.studentId, status: "متأخر", schoolId: S }, { merge: true }));
    // Notification de la pédagogie marquée comme lue par un enseignant, pour lui seul (D87).
    await assertSucceeds(updateDoc(doc(prof, "schools", S, "notifications", "DEMO-N-002"), { readBy: arrayUnion(uids.get("test_enseignant")!) }));
    // Les notifications du bureau (inscriptions, finances) lui restent invisibles (D86).
    await assertFails(getDoc(doc(prof, "schools", S, "notifications", "DEMO-N-001")));
    // Le compte se met à jour lui-même (dernière connexion).
    await assertSucceeds(setDoc(doc(prof, "schools", S, "members", uids.get("test_enseignant")!), { lastLogin: NOW.toISOString() }, { merge: true }));
    for (const [path, flag] of [[`students/DEMO-S-003`, true], [`teachers/DEMO-T-05`, true], [`attendance/${attId}`, true], [`notifications/DEMO-N-002`, true]] as const) {
      expect((await admin.db.doc(`schools/${S}/${path}`).get()).data()?.demoData, path).toBe(flag);
    }
    expect((await admin.db.doc(`schools/${S}/staffPrivate/DEMO-T-05`).get()).data()).toMatchObject({ monthlySalary: 2300, teacherId: "DEMO-T-05" });
  }, 300_000);

  it("relance : jeu remis à l'identique, documents non marqués jamais réécrits, marqués hors jeu supprimés, nouveaux mots de passe", async () => {
    const before = new Map(credentials.map((c) => [c.username, c.password]));
    const fixtures = buildSchoolFixtures({ schoolId: S, size: "large", now: NOW, settings: (await admin.db.doc(`schools/${S}/settings/system`).get()).data() });
    // Un document NON marqué qui porte un identifiant du jeu (ex. créé par l'interface).
    const collide = Object.keys(fixtures.collections.attendance)[0];
    await admin.db.doc(`schools/${S}/attendance/${collide}`).set({ id: collide, date: "2026-07-25", studentId: "x", status: "حاضر", schoolId: S });
    // Un document marqué qui ne fait plus partie du jeu.
    await admin.db.doc(`schools/${S}/students/DEMO-S-999`).set({ id: "DEMO-S-999", fullName: "زائد", schoolId: S, demoData: true });
    await admin.auth.setCustomUserClaims(uids.get("test_admin")!, { superAdmin: true });
    await admin.auth.updateUser(uids.get("test_eleve")!, { disabled: true });

    const { summary, credentials: c } = await seed();
    credentials = c;
    expect(summary).toMatchObject({ skippedUnmarked: 1, accounts: { created: 0, reset: 4 }, superAdminClaims: 0 });
    expect(summary.writes.deleted).toBe(1);
    expect(summary.writes.total).toBeLessThan(20_000);
    expect((await admin.db.doc(`schools/${S}/students/DEMO-S-999`).get()).exists).toBe(false);
    expect((await admin.db.doc(`schools/${S}/attendance/${collide}`).get()).data()).toMatchObject({ studentId: "x", status: "حاضر" });
    expect((await admin.db.doc(`schools/${S}/attendance/${collide}`).get()).data()).not.toHaveProperty("demoData");
    // Contenu identique au jeu (y compris les documents modifiés par l'interface).
    for (const col of ["students", "teachers", "staffPrivate", "notifications", "payments"]) {
      for (const [id, data] of Object.entries(fixtures.collections[col])) {
        const got = (await admin.db.doc(`schools/${S}/${col}/${id}`).get()).data()!;
        if (col === "staffPrivate") expect({ ...got, updatedAt: null }, `${col}/${id}`).toEqual({ ...data, updatedAt: null });
        else expect(got, `${col}/${id}`).toEqual(data);
      }
    }
    expect(await count(`schools/${S}/students`)).toBe(150);
    expect(await count(`schools/${S}/members`)).toBe(6);
    await expectManualIntact();
    for (const a of TEST_ACCOUNTS) {
      const user = await admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`);
      expect(user.uid).toBe(uids.get(a.username));
      expect(user.customClaims?.superAdmin).toBeUndefined();
      expect(user.disabled).toBe(false);
      expect(await canSignIn(a.username, before.get(a.username)!), `${a.username} (ancien)`).toBe(false);
      expect(await canSignIn(a.username, pw(a.username)), `${a.username} (nouveau)`).toBe(true);
    }
    // Deuxième relance immédiate : rien à supprimer, même volume.
    const again = await seed();
    credentials = again.credentials;
    expect(again.summary.writes.deleted).toBe(0);
    expect(again.summary.collections).toEqual(summary.collections);
  }, 300_000);

  it("comptes : refus si un identifiant de test appartient à un autre compte ou à une autre école (rien n'est modifié)", async () => {
    // Les comptes test_* appartiennent à test1234 : une autre école est refusée.
    await expect(seed({ schoolId: "autre-test" })).rejects.toThrow(/ACCOUNT_CONFLICT test_admin/);
    expect(await count("schools/autre-test/students")).toBe(0);
    // Nom inscrit au registre pour un autre compte.
    const reg = await admin.db.doc("usernames/test_parent").get();
    await reg.ref.set({ uid: (await admin.auth.getUserByEmail("dir_annour@comptes.kuttab.local")).uid, email: "dir_annour@comptes.kuttab.local" });
    await expect(seed()).rejects.toThrow(/ACCOUNT_CONFLICT test_parent/);
    expect(await canSignIn("test_admin", pw("test_admin"))).toBe(true);
    await reg.ref.set(reg.data()!);
    // Compte de test devenu membre d'une autre école.
    const eleve = uids.get("test_eleve")!;
    await admin.db.doc(`schools/annour/members/${eleve}`).set({ uid: eleve, role: "طالب", isActive: true, schoolId: "annour" });
    await expect(seed()).rejects.toThrow(/ACCOUNT_CONFLICT test_eleve/);
    await expect(runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null })).rejects.toThrow(/ACCOUNT_CONFLICT test_eleve/);
    expect(await count(`schools/${S}/students`)).toBe(150);
    await admin.db.doc(`schools/annour/members/${eleve}`).delete();
  }, 300_000);

  it("CLI (small) : volumes réduits, mots de passe dans le seul fichier secret (mode 600), jamais dans la sortie", () => {
    const out = mkdtempSync(join(tmpdir(), "seed-school-fixtures-"));
    const r = runScript(["scripts/dev/seed-school-fixtures.ts", `--project=${PROJECT}`, `--school=${S}`, "--size=small", "--apply", `--out=${out}`], { encoding: "utf8", env: { ...process.env } });
    expect(r.status, r.stderr).toBe(0);
    const dirs = readdirSync(out);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toMatch(/^seed-school-fixtures-/);
    const dir = join(out, dirs[0]);
    expect(readdirSync(dir).sort()).toEqual(["mots-de-passe-temporaires.csv", "resume.json"]);
    const csvPath = join(dir, "mots-de-passe-temporaires.csv");
    if (POSIX_MODES) expect(statSync(csvPath).mode & 0o777).toBe(0o600);
    const rows = readFileSync(csvPath, "utf8").replace(/^﻿/, "").trim().split("\r\n");
    expect(rows[0]).toBe("compte,role,identifiant,motDePasseTemporaire");
    expect(rows).toHaveLength(5);
    const resume = readFileSync(join(dir, "resume.json"), "utf8");
    const parsed = JSON.parse(resume);
    expect(parsed).toMatchObject({ mode: "application", operation: "seed", size: "small", superAdminClaims: 0, passwordsFile: true, accounts: { reset: 4 } });
    expect(parsed.collections).toMatchObject({ students: 15, classes: 2, teachers: 6 });
    expect(parsed.writes.deleted).toBeGreaterThan(5000);
    for (const row of rows.slice(1)) {
      const password = row.split(",")[3];
      credentials = credentials.map((c) => (c.username === row.split(",")[0] ? { ...c, password } : c));
      expect(password.length).toBeGreaterThanOrEqual(16);
      expect(r.stdout).not.toContain(password);
      expect(r.stderr).not.toContain(password);
      expect(resume).not.toContain(password);
    }
    expect(r.stdout).not.toMatch(/motDePasse|password"/i);
  }, 300_000);

  it("small : volumes, saisies manuelles intactes, comptes liés au nouveau jeu", async () => {
    expect(await count(`schools/${S}/students`)).toBe(15);
    expect(await count(`schools/${S}/classes`)).toBe(2);
    await expectManualIntact();
    const kids = (await admin.db.doc(`schools/${S}/members/${uids.get("test_parent")}`).get()).data()!.linkedStudentIds as string[];
    for (const k of kids) expect((await admin.db.doc(`schools/${S}/students/${k}`).get()).exists).toBe(true);
    expect(await canSignIn("test_parent", pw("test_parent"))).toBe(true);
  }, 300_000);
});

describe("--remove : seuls les documents et comptes générés", () => {
  it("supprime les documents DEMO- et les comptes test_*, garde le reste (orphelins de l'interface comptés)", async () => {
    // Document créé par l'interface pour un élève DEMO- (cotisation d'ouverture), non marqué.
    await admin.db.doc(`schools/${S}/payments/p_init_DEMO-S-001`).set({ id: "p_init_DEMO-S-001", studentId: "DEMO-S-001", year: 2026, month: "أكتوبر", amount: 100, paymentDate: "", status: "غير مدفوع", schoolId: S });
    const others = await Promise.all(["alfajr", "annour"].map(dumpSchool));
    const sim = await runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: S, apply: false, outDir: null });
    expect(sim).toMatchObject({ mode: "simulation", operation: "remove", accounts: { removed: 4, skipped: 0 }, orphansLeft: 2 });
    expect(sim.removed.students).toBe(15);
    expect(await count(`schools/${S}/students`)).toBe(15);

    const res = await runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null });
    expect(res).toMatchObject({ mode: "application", accounts: { removed: 4 }, orphansLeft: 2 });
    for (const col of FIXTURE_COLLECTIONS) {
      const snap = await admin.db.collection(`schools/${S}/${col}`).get();
      expect(snap.docs.filter((d) => isGeneratedDoc(col, d.id, d.data())).length, col).toBe(0);
    }
    await expectManualIntact();
    expect((await admin.db.doc(`schools/${S}/payments/p_init_DEMO-S-001`).get()).exists).toBe(true);
    expect(await count(`schools/${S}/members`)).toBe(2);
    for (const a of TEST_ACCOUNTS) {
      await expect(admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
      expect((await admin.db.doc(`usernames/${a.username}`).get()).exists).toBe(false);
      expect((await admin.db.doc(`users/${uids.get(a.username)}`).get()).exists).toBe(false);
    }
    expect(await Promise.all(["alfajr", "annour"].map(dumpSchool))).toEqual(others);
    expect((await admin.auth.getUserByEmail("admin_alfajr@alfajr.local")).customClaims?.superAdmin).toBe(true);
    // Relance sans rien à supprimer.
    const again = await runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null });
    expect(again.writes.deleted).toBe(0);
    expect(again.accounts).toEqual({ removed: 0, skipped: 0 });
  }, 300_000);

  it("un compte test_* qui n'est pas celui du script est ignoré par --remove et refusé par le seed", async () => {
    await admin.auth.createUser({ email: `test_admin@${DOMAIN}`, password: "autre-mot-de-passe-1234" });
    const res = await runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null });
    expect(res.accounts).toEqual({ removed: 0, skipped: 1 });
    expect((await admin.auth.getUserByEmail(`test_admin@${DOMAIN}`)).uid).toBeTruthy();
    await expect(seed()).rejects.toThrow(/ACCOUNT_CONFLICT test_admin/);
    expect(await count(`schools/${S}/students`)).toBe(0);
  }, 300_000);
});
