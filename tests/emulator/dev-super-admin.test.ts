/**
 * scripts/admin/dev-super-admin.ts (action dev-super-admin d'ops.yml, D80) sur
 * les émulateurs : compte super-admin créé avec la convention de createSchoolUser
 * (connexion de l'application), claim sans appartenance (D25), createSchool par
 * l'émulateur Functions, relance (nouveau mot de passe, sessions révoquées,
 * réactivation, claims gardés), conflits, --revoke, refus de la prod, aucun
 * mot de passe dans la sortie.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { POSIX_MODES, runScript } from "./runScript";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, type Firestore as ClientFirestore } from "firebase/firestore";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth as ClientAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from "firebase/functions";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { SECOND_SCHOOL, seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import { loginEmailCandidates, normalizeAuthPassword, normalizeUsername } from "../../src/security/accounts";
import {
  DEFAULT_FULL_NAME,
  parseDevSuperAdminArgs,
  runDevSuperAdmin,
  type DevSuperAdminOptions,
} from "../../scripts/admin/dev-super-admin";

const PROJECT = "demo-quran-school";
const PROD = "gen-lang-client-0481880143";
const PROD_DB = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";
const DOMAIN = "comptes.kuttab.local";
const USER = "superadmin_demo";
const REGION = "europe-west1";
let admin: AdminHandles;
let env: RulesTestEnvironment;
let app: FirebaseApp;
let clientAuth: ClientAuth;
let functions: Functions;
let uid = "";
let password = "";

const opts = (o: Partial<DevSuperAdminOptions> = {}): DevSuperAdminOptions => ({
  username: USER, fullName: null, apply: true, revoke: false, allowExistingMember: false, outDir: null, ...o,
});

/** Connexion exactement comme l'application (src/firebase.ts › signInWithUsername). */
async function signInLikeApp(username: string, pw: string): Promise<string> {
  await signOut(clientAuth).catch(() => undefined);
  let last = "aucun";
  for (const email of loginEmailCandidates(normalizeUsername(username))) {
    try {
      await signInWithEmailAndPassword(clientAuth, email, normalizeAuthPassword(pw));
      return "ok";
    } catch (e: any) {
      last = e?.code || String(e);
      if (!["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(last)) return last;
    }
  }
  return last;
}

const createSchool = (data: Record<string, unknown>) => httpsCallable(functions, "createSchool")(data);
const userDoc = async (id: string) => (await admin.db.doc(`users/${id}`).get()).data();

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "dev-super-admin-test");
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  // Copie FICTIVE du dev : école alfajr migrée (sans super-admin) et école annour.
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
  await seedSecondSchool(admin.db, admin.auth);

  app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `dsa-${Date.now()}`);
  clientAuth = getAuth(app);
  connectAuthEmulator(clientAuth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
});

afterAll(async () => {
  await signOut(clientAuth).catch(() => undefined);
  if (app) await deleteApp(app);
  await env?.cleanup();
  await admin?.close();
});

describe("arguments : prod refusée, identifiant validé comme dans les Functions", () => {
  const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };

  it("refuse la prod dans tous les cas : --force, --apply, confirmation, majuscules, arguments invalides, --revoke", () => {
    for (const e of [{}, emuEnv]) {
      expect(() => parseDevSuperAdminArgs([`--project=${PROD}`], e)).toThrow(/PRODUCTION/);
      expect(() => parseDevSuperAdminArgs([`--project=${PROD}`, `--username=${USER}`, "--force", "--apply", `--confirm-prod=${PROD}`, `--database=${PROD_DB}`], e)).toThrow(/PRODUCTION/);
      expect(() => parseDevSuperAdminArgs([`--project=${PROD.toUpperCase()}`, "--force"], e)).toThrow(/PRODUCTION/);
      expect(() => parseDevSuperAdminArgs(["argument-libre", `--project= ${PROD} `, "--username=!!"], e)).toThrow(/PRODUCTION/);
      expect(() => parseDevSuperAdminArgs([`--project=${PROD}`, `--username=${USER}`, "--revoke", "--apply"], e)).toThrow(/PRODUCTION/);
    }
  });

  it("accepte le dev, dont la base porte le même identifiant que celle de la prod (seul le projet compte)", () => {
    const a = parseDevSuperAdminArgs(["--project=fajr-c4c6e", `--database=${PROD_DB}`, `--username=${USER}`], {});
    expect(a).toMatchObject({ projectId: "fajr-c4c6e", apply: false, username: USER, fullName: null, revoke: false, allowExistingMember: false });
  });

  it("--project et --username obligatoires ; identifiant normalisé puis validé ; options inconnues refusées", () => {
    expect(() => parseDevSuperAdminArgs([`--username=${USER}`], emuEnv)).toThrow(/--project/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`], emuEnv)).toThrow(/--username/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, "--username"], emuEnv)).toThrow(/--username/);
    for (const bad of ["a", "-demo", "super admin demo", "démo", "x".repeat(41), "demo@x", "../etc", "_demo"]) {
      expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${bad}`], emuEnv), bad).toThrow(/--username invalide/);
    }
    expect(parseDevSuperAdminArgs([`--project=${PROJECT}`, "--username= SuperAdmin_Demo "], emuEnv).username).toBe(USER);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`, "--force"], emuEnv)).toThrow(/inconnue/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`], {})).toThrow(/émulateurs/);
    expect(() => parseDevSuperAdminArgs(["--project=fajr-c4c6e", `--username=${USER}`, "--apply"], {})).toThrow(/--database/);
    expect(() => parseDevSuperAdminArgs(["--project=fajr-c4c6e", "--database=base-dev", `--username=${USER}`, "--apply"], {})).toThrow(/--confirm-prod=fajr-c4c6e/);
    expect(() => parseDevSuperAdminArgs(["--project=fajr-c4c6e", `--username=${USER}`], emuEnv)).toThrow(/mélange/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`, "--full-name="], emuEnv)).toThrow(/--full-name/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`, "--full-name=a\nb"], emuEnv)).toThrow(/--full-name/);
    expect(() => parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`, "--revoke", "--allow-existing-member"], emuEnv)).toThrow(/--revoke/);
    expect(parseDevSuperAdminArgs([`--project=${PROJECT}`, `--username=${USER}`, "--full-name=Super Admin Z.", "--allow-existing-member"], emuEnv))
      .toMatchObject({ fullName: "Super Admin Z.", allowExistingMember: true });
  });

  it("le script lancé sur la prod s'arrête avant toute connexion (code 1), --force compris", () => {
    for (const extra of [["--force", "--apply"], ["--revoke", "--apply", `--confirm-prod=${PROD}`, `--database=${PROD_DB}`]]) {
      const r = runScript(["scripts/admin/dev-super-admin.ts", `--project=${PROD}`, `--username=${USER}`, ...extra], { encoding: "utf8", env: { ...process.env } });
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/\[dev-super-admin\] ÉCHEC : Projet de PRODUCTION/);
      expect(r.stdout).not.toMatch(/ÉMULATEURS|PROJET RÉEL/);
    }
  });
});

describe("compte super-admin", () => {
  it("simulation : aucune écriture", async () => {
    const { summary, credential } = await runDevSuperAdmin(admin.db, admin.auth, opts({ apply: false }));
    expect(summary).toMatchObject({ mode: "simulation", operation: "grant", username: USER, accountFound: false, created: true, reset: false, superAdmin: true, schoolMemberships: 0, passwordsFile: false });
    expect(credential).toBeNull();
    await expect(admin.auth.getUserByEmail(`${USER}@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await admin.db.doc(`usernames/${USER}`).get()).exists).toBe(false);
  });

  it("crée le compte (convention de createSchoolUser), claim superAdmin, AUCUNE appartenance, connexion comme l'application", async () => {
    const { summary, credential } = await runDevSuperAdmin(admin.db, admin.auth, opts());
    expect(summary).toMatchObject({ mode: "application", accountFound: false, created: true, reset: false, superAdmin: true, schoolMemberships: 0, disabled: false });
    password = credential!.password;
    expect(password.length).toBeGreaterThanOrEqual(16);
    expect(password).toMatch(/^[a-z2-9]{4}(-[a-z2-9]{4}){3}$/);

    const user = await admin.auth.getUserByEmail(`${USER}@${DOMAIN}`);
    uid = user.uid;
    expect(user.customClaims).toEqual({ superAdmin: true });
    expect(user.disabled).toBe(false);
    expect(user.displayName).toBe(DEFAULT_FULL_NAME);
    await expect(admin.auth.getUserByEmail(`${USER}@alfajr.local`)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await admin.db.doc(`usernames/${USER}`).get()).data()).toMatchObject({ uid, email: `${USER}@${DOMAIN}` });
    const profile = await userDoc(uid);
    expect(profile).toEqual({
      username: USER, displayName: DEFAULT_FULL_NAME, schoolIds: [], lastSchoolId: null,
      mustChangePassword: true, createdAt: expect.any(String), createdBy: "dev-super-admin",
    });
    for (const s of await admin.db.collection("schools").listDocuments()) {
      expect((await s.collection("members").doc(uid).get()).exists, s.id).toBe(false);
    }
    expect(JSON.stringify(profile)).not.toContain(password);

    expect(await signInLikeApp(USER, password)).toBe("ok");
    expect(clientAuth.currentUser!.uid).toBe(uid);
    expect((await clientAuth.currentUser!.getIdTokenResult(true)).claims.superAdmin).toBe(true);
  });

  it("règles (D25) : le super-admin liste les écoles, mais ne lit aucune donnée d'école", async () => {
    const db = env.authenticatedContext(uid, { superAdmin: true }).firestore() as unknown as ClientFirestore;
    await assertSucceeds(getDocs(collection(db, "schools")));
    await assertSucceeds(getDoc(doc(db, "users", uid)));
    for (const s of ["alfajr", "annour"]) {
      await assertFails(getDocs(collection(db, "schools", s, "students")));
      await assertFails(getDocs(collection(db, "schools", s, "payments")));
      await assertFails(getDocs(collection(db, "schools", s, "staffPrivate")));
    }
  });

  it("relance : nouveau mot de passe, ancien refusé, sessions révoquées, compte réactivé, claims gardés", async () => {
    await admin.auth.setCustomUserClaims(uid, { superAdmin: true, autreClaim: "conservé" });
    await admin.auth.updateUser(uid, { disabled: true });
    const before = (await admin.auth.getUser(uid)).tokensValidAfterTime;
    await new Promise((r) => setTimeout(r, 1100));

    const { summary, credential } = await runDevSuperAdmin(admin.db, admin.auth, opts());
    expect(summary).toMatchObject({ accountFound: true, created: false, reset: true, superAdmin: true, disabled: false, sessionsRevoked: true, schoolMemberships: 0 });
    expect(credential!.password).not.toBe(password);
    const user = await admin.auth.getUser(uid);
    expect(user.disabled).toBe(false);
    expect(user.customClaims).toEqual({ superAdmin: true, autreClaim: "conservé" });
    expect(new Date(user.tokensValidAfterTime!).getTime()).toBeGreaterThan(new Date(before!).getTime());
    expect(await signInLikeApp(USER, password)).toMatch(/invalid-credential|wrong-password/);
    password = credential!.password;
    expect(await signInLikeApp(USER, password)).toBe("ok");
    expect(await userDoc(uid)).toMatchObject({ schoolIds: [], mustChangePassword: true, passwordResetBy: "dev-super-admin", displayName: DEFAULT_FULL_NAME });
    expect((await admin.auth.getUserByEmail(`${USER}@${DOMAIN}`)).uid).toBe(uid);
  });

  it("avec ce compte, createSchool (émulateur Functions) réussit ; un directeur ordinaire est refusé", async () => {
    expect(await signInLikeApp(SECOND_SCHOOL.director.username, SECOND_SCHOOL.director.password)).toBe("ok");
    await expect(createSchool({ schoolId: "pirate", name: "x" })).rejects.toMatchObject({ code: "functions/permission-denied" });

    expect(await signInLikeApp(USER, password)).toBe("ok");
    await clientAuth.currentUser!.getIdToken(true);
    await createSchool({ schoolId: "essai-sa", name: "مدرسة تجربة المشرف" });
    expect((await admin.db.doc("schools/essai-sa").get()).data()).toMatchObject({ createdBy: uid, status: "active" });
    expect((await admin.db.doc(`schools/essai-sa/members/${uid}`).get()).exists).toBe(false);
    // Comme l'interface (makeMeDirector) : il devient directeur de l'école créée.
    await createSchool({ schoolId: "essai-sa2", name: "مدرسة تجربة ثانية", makeMeDirector: true });
    expect((await admin.db.doc(`schools/essai-sa2/members/${uid}`).get()).data()?.role).toBe("مدير");
    expect((await userDoc(uid))?.schoolIds).toEqual(["essai-sa2"]);
  });

  it("compte membre d'une école : refusé sans --allow-existing-member (rien n'est modifié), signalé avec", async () => {
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts())).rejects.toThrow(/MEMBER_ACCOUNT superadmin_demo : le compte appartient à 1 école/);
    expect(await signInLikeApp(USER, password)).toBe("ok");

    const { summary, credential } = await runDevSuperAdmin(admin.db, admin.auth, opts({ allowExistingMember: true }));
    expect(summary).toMatchObject({ reset: true, superAdmin: true, schoolMemberships: 1 });
    password = credential!.password;
    expect((await userDoc(uid))?.schoolIds).toEqual(["essai-sa2"]);
    expect((await admin.db.doc(`schools/essai-sa2/members/${uid}`).get()).exists).toBe(true);

    // Un compte réel d'une école (copie du dev) n'est jamais promu par mégarde.
    const dir = (await admin.auth.getUserByEmail(`${SECOND_SCHOOL.director.username}@${DOMAIN}`)).uid;
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts({ username: SECOND_SCHOOL.director.username }))).rejects.toThrow(/MEMBER_ACCOUNT/);
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts({ username: "mohammed_alami" }))).rejects.toThrow(/MEMBER_ACCOUNT/);
    expect((await admin.auth.getUser(dir)).customClaims?.superAdmin).toBeUndefined();
    expect(await signInLikeApp(SECOND_SCHOOL.director.username, SECOND_SCHOOL.director.password)).toBe("ok");
  });

  it("conflits d'identifiant : registre vers un autre uid, compte Auth hors registre (rien n'est modifié)", async () => {
    const dir = (await admin.auth.getUserByEmail(`${SECOND_SCHOOL.director.username}@${DOMAIN}`)).uid;
    await admin.db.doc("usernames/conflit_registre").set({ uid: dir, email: `${SECOND_SCHOOL.director.username}@${DOMAIN}` });
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts({ username: "conflit_registre" }))).rejects.toThrow(/ACCOUNT_CONFLICT conflit_registre : l'identifiant est déjà enregistré pour un autre compte/);
    await expect(admin.auth.getUserByEmail(`conflit_registre@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await admin.auth.getUser(dir)).customClaims?.superAdmin).toBeUndefined();

    // Inscription libre sous un identifiant anticipé : jamais promue.
    const squat = await admin.auth.createUser({ email: `inscription_libre@${DOMAIN}`, password: "mot-de-passe-tiers" });
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts({ username: "inscription_libre" }))).rejects.toThrow(/ACCOUNT_CONFLICT inscription_libre : un compte Auth porte ce nom sans être inscrit/);
    expect((await admin.auth.getUser(squat.uid)).customClaims).toBeUndefined();
    expect((await admin.db.doc("usernames/inscription_libre").get()).exists).toBe(false);

    // Deux domaines, deux comptes : connexion ambiguë.
    await admin.auth.createUser({ email: `${USER}@alfajr.local`, password: "mot-de-passe-tiers" });
    await expect(runDevSuperAdmin(admin.db, admin.auth, opts({ allowExistingMember: true }))).rejects.toThrow(/ACCOUNT_CONFLICT superadmin_demo : les deux domaines/);
    await admin.auth.deleteUser((await admin.auth.getUserByEmail(`${USER}@alfajr.local`)).uid);
    expect(await signInLikeApp(USER, password)).toBe("ok");
  });

  it("--revoke : claim retiré (autres claims gardés), compte actif s'il a une école, désactivé sinon, rien de supprimé", async () => {
    const sim = await runDevSuperAdmin(admin.db, admin.auth, opts({ revoke: true, apply: false }));
    expect(sim.summary).toMatchObject({ mode: "simulation", operation: "revoke", accountFound: true, superAdmin: false, disabled: false, schoolMemberships: 1 });
    expect((await admin.auth.getUser(uid)).customClaims?.superAdmin).toBe(true);

    const { summary, credential } = await runDevSuperAdmin(admin.db, admin.auth, opts({ revoke: true }));
    expect(credential).toBeNull();
    expect(summary).toMatchObject({ mode: "application", operation: "revoke", superAdmin: false, disabled: false, sessionsRevoked: true, schoolMemberships: 1, passwordsFile: false });
    const user = await admin.auth.getUser(uid);
    expect(user.customClaims).toEqual({ autreClaim: "conservé" });
    expect(user.disabled).toBe(false);
    expect((await admin.db.doc(`usernames/${USER}`).get()).exists).toBe(true);
    expect((await admin.db.doc(`users/${uid}`).get()).exists).toBe(true);
    expect((await admin.db.doc(`schools/essai-sa2/members/${uid}`).get()).exists).toBe(true);
    expect((await admin.db.doc("schools/essai-sa").get()).exists).toBe(true);
    expect(await signInLikeApp(USER, password)).toBe("ok");
    expect((await clientAuth.currentUser!.getIdTokenResult(true)).claims.superAdmin).toBeUndefined();
    await expect(createSchool({ schoolId: "apres-retrait", name: "x" })).rejects.toMatchObject({ code: "functions/permission-denied" });

    // Compte sans école : désactivé, jamais supprimé.
    const { credential: c2 } = await runDevSuperAdmin(admin.db, admin.auth, opts({ username: "superadmin_temp" }));
    const tempUid = (await admin.auth.getUserByEmail(`superadmin_temp@${DOMAIN}`)).uid;
    const r2 = await runDevSuperAdmin(admin.db, admin.auth, opts({ username: "superadmin_temp", revoke: true }));
    expect(r2.summary).toMatchObject({ superAdmin: false, disabled: true, schoolMemberships: 0 });
    expect((await admin.auth.getUser(tempUid)).disabled).toBe(true);
    expect((await admin.auth.getUser(tempUid)).customClaims?.superAdmin).toBeUndefined();
    expect(await signInLikeApp("superadmin_temp", c2!.password)).toBe("auth/user-disabled");
    expect((await admin.db.doc("usernames/superadmin_temp").get()).exists).toBe(true);
    expect((await userDoc(tempUid))?.schoolIds).toEqual([]);

    // Remise en place : réactivé avec un nouveau mot de passe et le claim.
    const r3 = await runDevSuperAdmin(admin.db, admin.auth, opts({ username: "superadmin_temp" }));
    expect(r3.summary).toMatchObject({ reset: true, disabled: false, superAdmin: true });
    expect(await signInLikeApp("superadmin_temp", r3.credential!.password)).toBe("ok");

    // Compte inexistant : rien à faire, sans erreur.
    expect((await runDevSuperAdmin(admin.db, admin.auth, opts({ username: "inconnu_total", revoke: true }))).summary)
      .toMatchObject({ accountFound: false, superAdmin: false, disabled: false });
    await expect(admin.auth.getUserByEmail(`inconnu_total@${DOMAIN}`)).rejects.toMatchObject({ code: "auth/user-not-found" });
  });

  it("CLI sur les émulateurs : mot de passe dans le seul fichier secret (mode 600), jamais dans la sortie ni le résumé", () => {
    const out = mkdtempSync(join(tmpdir(), "dev-super-admin-"));
    const r = runScript(["scripts/admin/dev-super-admin.ts", `--project=${PROJECT}`, "--username=superadmin_cli", "--full-name=Compte CLI", "--apply", `--out=${out}`], { encoding: "utf8", env: { ...process.env } });
    expect(r.status, r.stderr).toBe(0);
    const dirs = readdirSync(out);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toMatch(/^dev-super-admin-/);
    const dir = join(out, dirs[0]);
    expect(readdirSync(dir).sort()).toEqual(["mots-de-passe-temporaires.csv", "resume.json"]);
    const csvPath = join(dir, "mots-de-passe-temporaires.csv");
    if (POSIX_MODES) expect(statSync(csvPath).mode & 0o777).toBe(0o600);
    const rows = readFileSync(csvPath, "utf8").replace(/^﻿/, "").trim().split("\r\n");
    expect(rows[0]).toBe("compte,role,identifiant,motDePasseTemporaire");
    expect(rows).toHaveLength(2);
    const pw = rows[1].split(",")[3];
    expect(pw.length).toBeGreaterThanOrEqual(16);
    const resume = readFileSync(join(dir, "resume.json"), "utf8");
    expect(JSON.parse(resume)).toMatchObject({ mode: "application", operation: "grant", username: "superadmin_cli", created: true, reset: false, superAdmin: true, schoolMemberships: 0, passwordsFile: true });
    for (const text of [r.stdout, r.stderr, resume]) expect(text).not.toContain(pw);

    // Relance et retrait par la CLI : toujours aucun mot de passe affiché.
    const again = runScript(["scripts/admin/dev-super-admin.ts", `--project=${PROJECT}`, "--username=superadmin_cli", "--apply", `--out=${out}`], { encoding: "utf8", env: { ...process.env } });
    expect(again.status, again.stderr).toBe(0);
    expect(again.stdout).toMatch(/"reset": true/);
    expect(again.stdout + again.stderr).not.toMatch(/[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}/);
    const revoke = runScript(["scripts/admin/dev-super-admin.ts", `--project=${PROJECT}`, "--username=superadmin_cli", "--revoke", "--apply", `--out=${out}`], { encoding: "utf8", env: { ...process.env } });
    expect(revoke.status, revoke.stderr).toBe(0);
    expect(revoke.stdout).toMatch(/"operation": "revoke"/);
    expect(revoke.stdout).toMatch(/"disabled": true/);
  });
});
