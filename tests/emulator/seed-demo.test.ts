/**
 * scripts/dev/seed-demo.ts (action seed-demo d'ops.yml, D77) sur les émulateurs :
 * données fictives de l'école demo, un compte par rôle, isolation (aucun accès
 * à une autre école, aucun claim superAdmin), idempotence, suppression, refus
 * du projet de prod et des bases qui contiennent d'autres données.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, type Firestore as ClientFirestore } from "firebase/firestore";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth as ClientAuth } from "firebase/auth";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import {
  DEMO_ACCOUNTS,
  DEMO_SCHOOL_ID,
  DEMO_SCHOOL_NAME,
  findOtherData,
  parseSeedDemoArgs,
  runRemoveDemo,
  runSeedDemo,
  type DemoCredential,
} from "../../scripts/dev/seed-demo";

const PROJECT = "demo-quran-school";
const PROD = "gen-lang-client-0481880143";
const DOMAIN = "comptes.kuttab.local";
const OTHER_COLLECTIONS = ["students", "teachers", "classes", "attendance", "grades", "payments", "staffPrivate", "members", "notifications", "activities"];
let admin: AdminHandles;
let env: RulesTestEnvironment;
let app: FirebaseApp;
let clientAuth: ClientAuth;
let credentials: DemoCredential[] = [];
const uids = new Map<string, string>();

async function clearAll() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

async function canSignIn(username: string, password: string): Promise<boolean> {
  await signOut(clientAuth).catch(() => undefined);
  try {
    await signInWithEmailAndPassword(clientAuth, `${username}@${DOMAIN}`, password);
    return true;
  } catch {
    return false;
  }
}

const pw = (username: string) => credentials.find((c) => c.username === username)!.password;
const dbAs = (username: string) => env.authenticatedContext(uids.get(username)!).firestore() as unknown as ClientFirestore;
const count = async (path: string) => (await admin.db.collection(path).count().get()).data().count;

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "seed-demo-test");
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `seed-demo-${Date.now()}`);
  clientAuth = getAuth(app);
  connectAuthEmulator(clientAuth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  // Deux autres écoles FICTIVES (alfajr migrée, annour) pour vérifier l'isolation.
  await clearAll();
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, superAdminUsername: "admin_alfajr", rotatePasswords: "none" });
  await seedSecondSchool(admin.db, admin.auth);
});

afterAll(async () => {
  await signOut(clientAuth).catch(() => undefined);
  if (app) await deleteApp(app);
  await env?.cleanup();
  await admin?.close();
});

describe("arguments : projet de prod refusé, --project obligatoire", () => {
  const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };
  it("refuse la prod dans tous les cas, même avec --force, --apply et la confirmation", () => {
    for (const e of [{}, emuEnv]) {
      expect(() => parseSeedDemoArgs([`--project=${PROD}`], e)).toThrow(/PRODUCTION/);
      expect(() => parseSeedDemoArgs([`--project=${PROD}`, "--force", "--apply", `--confirm-prod=${PROD}`, "--database=x"], e)).toThrow(/PRODUCTION/);
      expect(() => parseSeedDemoArgs([` --project=${PROD.toUpperCase()}`.trim(), "--force"], e)).toThrow(/PRODUCTION/);
      // La base du dev porte le même identifiant que celle de la prod : seul le projet compte.
      expect(() => parseSeedDemoArgs(["--project=fajr-c4c6e", "--database=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec"], e)).not.toThrow();
    }
  });

  it("exige --project, refuse les options inconnues ; vrai projet : --database et --confirm-prod", () => {
    expect(() => parseSeedDemoArgs([], emuEnv)).toThrow(/--project/);
    expect(() => parseSeedDemoArgs(["--apply"], emuEnv)).toThrow(/--project/);
    expect(() => parseSeedDemoArgs([`--project=${PROJECT}`, "--force"], emuEnv)).toThrow(/inconnue/);
    expect(() => parseSeedDemoArgs([`--project=${PROJECT}`], {})).toThrow(/émulateurs/);
    expect(() => parseSeedDemoArgs(["--project=fajr-c4c6e", "--apply"], {})).toThrow(/--database/);
    expect(() => parseSeedDemoArgs(["--project=fajr-c4c6e", "--database=base-dev", "--apply"], {})).toThrow(/--confirm-prod=fajr-c4c6e/);
    expect(() => parseSeedDemoArgs(["--project=fajr-c4c6e", "--apply"], emuEnv)).toThrow(/mélange/);
    const ok = parseSeedDemoArgs(["--project=fajr-c4c6e", "--database=base-dev", "--apply", "--confirm-prod=fajr-c4c6e"], {});
    expect(ok).toMatchObject({ projectId: "fajr-c4c6e", databaseId: "base-dev", apply: true, emulator: false, remove: false });
    expect(parseSeedDemoArgs([`--project=${PROJECT}`, "--remove"], emuEnv)).toMatchObject({ remove: true, apply: false });
  });

  it("le script lancé sur la prod s'arrête avant toute connexion (code 1)", () => {
    const r = spawnSync("npx", ["tsx", "scripts/dev/seed-demo.ts", `--project=${PROD}`, "--force", "--apply"], { encoding: "utf8", env: { ...process.env } });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/\[seed-demo\] ÉCHEC : Projet de PRODUCTION/);
    expect(r.stdout).not.toMatch(/ÉMULATEURS|PROJET RÉEL/);
  });
});

describe("école demo et comptes par rôle", () => {
  it("vrai projet (refuseIfOtherData) : refus si la base contient d'autres écoles ou des données racine, sans rien écrire", async () => {
    const markers = await findOtherData(admin.db);
    expect(markers).toEqual(expect.arrayContaining(["racine:appUsers", "racine:students", "autres écoles:2"]));
    await expect(runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: true, outDir: null })).rejects.toThrow(/REAL_DATA/);
    expect((await admin.db.doc(`schools/${DEMO_SCHOOL_ID}`).get()).exists).toBe(false);
    await expect(admin.auth.getUserByEmail(`demo_directeur@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
  });

  it("simulation : aucune écriture", async () => {
    const { summary, credentials: c } = await runSeedDemo(admin.db, admin.auth, { apply: false, refuseIfOtherData: false, outDir: null });
    expect(summary).toMatchObject({ mode: "simulation", accounts: { created: 5, reset: 0 } });
    expect(c).toEqual([]);
    expect((await admin.db.collection(`schools/${DEMO_SCHOOL_ID}/students`).get()).empty).toBe(true);
  });

  it("crée l'école demo (données fictives, schoolId, fiches RH séparées) et les 5 comptes", async () => {
    const { summary, credentials: c } = await runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: false, outDir: null });
    credentials = c;
    expect(summary).toMatchObject({ mode: "application", schoolId: "demo", accounts: { created: 5, reset: 0 }, superAdminClaims: 0, otherSchoolMemberships: 0 });
    expect(summary.collections).toMatchObject({ students: 10, teachers: 5, staffPrivate: 3, classes: 2, attendance: 10, grades: 10, payments: 10, dailyProgress: 10, activities: 1, notifications: 1 });

    const school = (await admin.db.doc("schools/demo").get()).data()!;
    expect(school).toMatchObject({ name: DEMO_SCHOOL_NAME, status: "active", demo: true });
    expect((await admin.db.doc("schools/demo/settings/system").get()).data()).toMatchObject({ associationName: DEMO_SCHOOL_NAME, schoolId: "demo", subscriptionFee: 100 });
    for (const [col, n] of Object.entries(summary.collections)) {
      const snap = await admin.db.collection(`schools/demo/${col}`).get();
      expect(snap.size, col).toBe(n);
      for (const d of snap.docs) expect(d.data().schoolId, `${col}/${d.id}`).toBe("demo");
    }
    // Pas de photo lourde ni de référence orpheline ; aucune donnée RH dans la fiche publique.
    expect((await admin.db.doc("schools/demo/students/S-111").get()).exists).toBe(false);
    for (const d of (await admin.db.collection("schools/demo/teachers").get()).docs) {
      expect(d.data()).not.toHaveProperty("monthlySalary");
      expect(d.data()).not.toHaveProperty("cinNumber");
    }
    expect((await admin.db.doc("schools/demo/staffPrivate/t1").get()).data()).toMatchObject({ monthlySalary: 2500, teacherId: "t1" });

    expect(credentials.map((x) => [x.username, x.role])).toEqual(DEMO_ACCOUNTS.map((a) => [a.username, a.role]));
    expect(new Set(credentials.map((x) => x.password)).size).toBe(5);
    for (const a of DEMO_ACCOUNTS) {
      const p = pw(a.username);
      expect(p.length).toBeGreaterThanOrEqual(16);
      const user = await admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`);
      uids.set(a.username, user.uid);
      expect(user.customClaims?.superAdmin).toBeUndefined();
      expect(user.disabled).toBe(false);
      expect((await admin.db.doc(`usernames/${a.username}`).get()).data()).toMatchObject({ uid: user.uid });
      expect((await admin.db.doc(`users/${user.uid}`).get()).data()).toMatchObject({ username: a.username, schoolIds: ["demo"], lastSchoolId: "demo", mustChangePassword: false });
      expect((await admin.db.doc(`schools/demo/members/${user.uid}`).get()).data()).toMatchObject({ role: a.role, isActive: true, schoolId: "demo" });
      for (const other of ["alfajr", "annour"]) expect((await admin.db.doc(`schools/${other}/members/${user.uid}`).get()).exists).toBe(false);
      expect(await canSignIn(a.username, p), a.username).toBe(true);
      const token = await clientAuth.currentUser!.getIdTokenResult(true);
      expect(token.claims.superAdmin).toBeUndefined();
      // Aucun mot de passe dans Firestore.
      const blobs = JSON.stringify([(await admin.db.doc(`users/${user.uid}`).get()).data(), (await admin.db.doc(`schools/demo/members/${user.uid}`).get()).data()]);
      expect(blobs).not.toContain(p);
    }
    expect((await admin.db.doc("schools/demo/members/" + uids.get("demo_parent")).get()).data()?.linkedStudentIds).toEqual(["S-101", "S-102"]);
    expect((await admin.db.doc("schools/demo/members/" + uids.get("demo_eleve")).get()).data()?.linkedStudentIds).toEqual(["S-109"]);
  });

  it("règles : chaque rôle voit l'école demo selon ses droits, et RIEN des autres écoles", async () => {
    const dir = dbAs("demo_directeur");
    await assertSucceeds(getDoc(doc(dir, "schools", "demo")));
    await assertSucceeds(getDocs(collection(dir, "schools", "demo", "students")));
    await assertSucceeds(getDocs(collection(dir, "schools", "demo", "staffPrivate")));
    await assertSucceeds(getDocs(collection(dir, "schools", "demo", "members")));
    const adm = dbAs("demo_admin");
    await assertSucceeds(getDocs(collection(adm, "schools", "demo", "payments")));
    await assertSucceeds(getDocs(collection(adm, "schools", "demo", "staffPrivate")));
    const prof = dbAs("demo_enseignant");
    await assertSucceeds(getDocs(collection(prof, "schools", "demo", "students")));
    await assertFails(getDocs(collection(prof, "schools", "demo", "staffPrivate")));
    const parent = dbAs("demo_parent");
    await assertSucceeds(getDoc(doc(parent, "schools", "demo", "students", "S-101")));
    await assertFails(getDoc(doc(parent, "schools", "demo", "students", "S-103")));
    await assertFails(getDocs(collection(parent, "schools", "demo", "students")));
    const eleve = dbAs("demo_eleve");
    await assertSucceeds(getDoc(doc(eleve, "schools", "demo", "students", "S-109")));
    await assertFails(getDoc(doc(eleve, "schools", "demo", "students", "S-101")));

    for (const a of DEMO_ACCOUNTS) {
      const db = dbAs(a.username);
      for (const other of ["alfajr", "annour"]) {
        await assertFails(getDoc(doc(db, "schools", other)));
        await assertFails(getDoc(doc(db, "schools", other, "settings", "system")));
        await assertFails(getDoc(doc(db, "schools", other, "students", "S-101")));
        for (const col of OTHER_COLLECTIONS) await assertFails(getDocs(collection(db, "schools", other, col)));
      }
      await assertFails(getDocs(collection(db, "schools")));
      await assertFails(getDocs(collection(db, "appUsers")));
    }
  });

  it("relance : données de demo remplacées, nouveaux mots de passe, anciens refusés, claim superAdmin retiré", async () => {
    const before = new Map(credentials.map((c) => [c.username, c.password]));
    await admin.db.doc("schools/demo/students/S-intrus").set({ fullName: "ajout manuel", schoolId: "demo" });
    await admin.db.doc("schools/demo/students/S-101").update({ hizbCount: 60 });
    await admin.auth.setCustomUserClaims(uids.get("demo_directeur")!, { superAdmin: true });
    await admin.auth.updateUser(uids.get("demo_eleve")!, { disabled: true });
    const alfajrStudents = await count("schools/alfajr/students");

    const { summary, credentials: c } = await runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: false, outDir: null });
    credentials = c;
    expect(summary.accounts).toMatchObject({ created: 0, reset: 5 });
    expect(summary.superAdminClaims).toBe(0);
    expect((await admin.db.doc("schools/demo/students/S-intrus").get()).exists).toBe(false);
    expect((await admin.db.doc("schools/demo/students/S-101").get()).data()?.hizbCount).toBe(5);
    expect(await count("schools/demo/students")).toBe(10);
    expect(await count("schools/demo/members")).toBe(5);
    expect(await count("schools/alfajr/students")).toBe(alfajrStudents);
    for (const a of DEMO_ACCOUNTS) {
      const user = await admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`);
      expect(user.uid).toBe(uids.get(a.username));
      expect(user.customClaims?.superAdmin).toBeUndefined();
      expect(user.disabled).toBe(false);
      expect(pw(a.username)).not.toBe(before.get(a.username));
      expect(await canSignIn(a.username, before.get(a.username)!), `${a.username} (ancien)`).toBe(false);
      expect(await canSignIn(a.username, pw(a.username)), `${a.username} (nouveau)`).toBe(true);
    }
  });

  it("refus si un compte demo_* est membre d'une autre école ou si son nom désigne un autre compte (rien n'est modifié)", async () => {
    const parentUid = uids.get("demo_parent")!;
    await admin.db.doc(`schools/annour/members/${parentUid}`).set({ uid: parentUid, role: "ولي أمر", isActive: true, schoolId: "annour" });
    await expect(runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: false, outDir: null })).rejects.toThrow(/ACCOUNT_CONFLICT demo_parent/);
    await expect(runRemoveDemo(admin.db, admin.auth, { apply: true, outDir: null })).rejects.toThrow(/ACCOUNT_CONFLICT demo_parent/);
    expect(await canSignIn("demo_directeur", pw("demo_directeur"))).toBe(true);
    expect(await count("schools/demo/students")).toBe(10);
    await admin.db.doc(`schools/annour/members/${parentUid}`).delete();

    const reg = await admin.db.doc("usernames/demo_eleve").get();
    const intruder = (await admin.auth.getUserByEmail("dir_annour@comptes.kuttab.local")).uid;
    await reg.ref.set({ uid: intruder });
    await expect(runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: false, outDir: null })).rejects.toThrow(/ACCOUNT_CONFLICT demo_eleve/);
    await reg.ref.set(reg.data()!);
  });

  it("CLI sur les émulateurs : mots de passe dans le seul fichier secret (mode 600), jamais dans la sortie", () => {
    const out = mkdtempSync(join(tmpdir(), "seed-demo-"));
    const r = spawnSync("npx", ["tsx", "scripts/dev/seed-demo.ts", `--project=${PROJECT}`, "--apply", `--out=${out}`], { encoding: "utf8", env: { ...process.env } });
    expect(r.status, r.stderr).toBe(0);
    const dirs = readdirSync(out);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toMatch(/^seed-demo-/);
    const dir = join(out, dirs[0]);
    expect(readdirSync(dir).sort()).toEqual(["mots-de-passe-temporaires.csv", "resume.json"]);
    const csvPath = join(dir, "mots-de-passe-temporaires.csv");
    expect(statSync(csvPath).mode & 0o777).toBe(0o600);
    const rows = readFileSync(csvPath, "utf8").replace(/^﻿/, "").trim().split("\r\n");
    expect(rows[0]).toBe("compte,role,identifiant,motDePasseTemporaire");
    expect(rows).toHaveLength(6);
    const resume = readFileSync(join(dir, "resume.json"), "utf8");
    expect(JSON.parse(resume)).toMatchObject({ mode: "application", superAdminClaims: 0, otherSchoolMemberships: 0, passwordsFile: true, accounts: { reset: 5 } });
    for (const row of rows.slice(1)) {
      const password = row.split(",")[3];
      expect(password.length).toBeGreaterThanOrEqual(16);
      expect(r.stdout).not.toContain(password);
      expect(r.stderr).not.toContain(password);
      expect(resume).not.toContain(password);
    }
  });
});

describe("suppression de l'école demo (avant toute copie des données réelles)", () => {
  it("supprime schools/demo et les comptes demo_*, sans toucher aux autres écoles", async () => {
    const alfajr = await Promise.all(["students", "members", "payments"].map((c) => count(`schools/alfajr/${c}`)));
    const sim = await runRemoveDemo(admin.db, admin.auth, { apply: false, outDir: null });
    expect(sim).toMatchObject({ mode: "simulation", schoolExisted: true, accountsRemoved: 5 });
    expect(await count("schools/demo/students")).toBe(10);

    const res = await runRemoveDemo(admin.db, admin.auth, { apply: true, outDir: null });
    expect(res).toMatchObject({ mode: "application", accountsRemoved: 5 });
    expect((await admin.db.doc("schools/demo").get()).exists).toBe(false);
    expect((await admin.db.doc("schools/demo").listCollections()).length).toBe(0);
    for (const a of DEMO_ACCOUNTS) {
      await expect(admin.auth.getUserByEmail(`${a.username}@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
      expect((await admin.db.doc(`usernames/${a.username}`).get()).exists).toBe(false);
      expect((await admin.db.doc(`users/${uids.get(a.username)}`).get()).exists).toBe(false);
    }
    expect(await Promise.all(["students", "members", "payments"].map((c) => count(`schools/alfajr/${c}`)))).toEqual(alfajr);
    expect((await admin.auth.getUserByEmail("admin_alfajr@alfajr.local")).customClaims?.superAdmin).toBe(true);
    // Relance sans rien à supprimer : sans erreur.
    expect(await runRemoveDemo(admin.db, admin.auth, { apply: true, outDir: null })).toMatchObject({ schoolExisted: false, accountsRemoved: 0 });
  });

  it("base vide (cas du dev avant la copie) : accepté avec refuseIfOtherData, puis relance acceptée", async () => {
    await clearAll();
    expect(await findOtherData(admin.db)).toEqual([]);
    await runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: true, outDir: null });
    expect(await findOtherData(admin.db)).toEqual([]);
    const { summary } = await runSeedDemo(admin.db, admin.auth, { apply: true, refuseIfOtherData: true, outDir: null });
    expect(summary.accounts).toMatchObject({ created: 0, reset: 5 });
  });
});
