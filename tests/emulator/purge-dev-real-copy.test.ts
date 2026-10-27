/**
 * scripts/admin/purge-dev-real-copy.ts (action purge-dev-real-copy d'ops.yml,
 * D103) sur les émulateurs, avec une copie FICTIVE de l'école alfajr (jeu
 * historique migré) : simulation sans écriture, apply qui supprime l'arbre
 * schools/alfajr, les collections racine héritées et les comptes sans école,
 * en gardant les autres écoles, les super-admins et les membres d'une autre
 * école (dont alfajr est retiré de schoolIds), refus d'un projet de prod.
 */
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CollectionReference, DocumentReference } from "firebase-admin/firestore";

import { runScript } from "./runScript";
import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { FORBIDDEN_PROJECT_IDS } from "../../scripts/admin/lib/prodProject";
import {
  LEGACY_ROOT_COLLECTIONS,
  PURGE_SCHOOL_ID,
  parsePurgeArgs,
  purgeIncomplete,
  runPurgeDevRealCopy,
  countCollection,
} from "../../scripts/admin/purge-dev-real-copy";
import { runMigration, TENANT_COLLECTIONS } from "../../scripts/migration/migrate-to-tenants";
import { legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { seedSecondSchool } from "../../scripts/dev/lib/seedTenants";
import { NEW_ACCOUNTS_EMAIL_DOMAIN, usernameToEmail } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const PROD = "gen-lang-client-0481880143";
const PROD_DB = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";
const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };

let admin: AdminHandles;
const uidOf: Record<string, string> = {};

/** Contenu complet d'un document et de ses sous-collections (comparaison avant / après). */
async function dump(ref: DocumentReference): Promise<unknown> {
  const snap = await ref.get();
  const subs: Record<string, unknown> = {};
  for (const c of (await ref.listCollections()).sort((a, b) => a.id.localeCompare(b.id))) subs[c.id] = await dumpCollection(c);
  return { exists: snap.exists, data: snap.data() ?? null, subs };
}
async function dumpCollection(col: CollectionReference): Promise<unknown> {
  const out: Record<string, unknown> = {};
  for (const ref of (await col.listDocuments()).sort((a, b) => a.id.localeCompare(b.id))) out[ref.id] = await dump(ref);
  return out;
}
/** Tout le Firestore et tout Auth : détecte la moindre écriture. */
async function everything(): Promise<string> {
  const roots: Record<string, unknown> = {};
  for (const c of (await admin.db.listCollections()).sort((a, b) => a.id.localeCompare(b.id))) roots[c.id] = await dumpCollection(c);
  const auth = (await admin.auth.listUsers(1000)).users.map((u) => ({ uid: u.uid, email: u.email, claims: u.customClaims ?? null, valid: u.tokensValidAfterTime })).sort((a, b) => a.uid.localeCompare(b.uid));
  return JSON.stringify({ roots, auth });
}
/** uid d'un compte d'après le registre des noms (les comptes migrés gardent l'ancien domaine de connexion). */
const authUid = async (username: string): Promise<string> => (await admin.db.doc(`usernames/${username}`).get()).data()!.uid;
const authExists = async (uid: string) => admin.auth.getUser(uid).then(() => true, () => false);

async function extraAccount(username: string, opts: { claim?: boolean; schools?: string[]; lastSchoolId?: string | null; usersDoc?: boolean; registry?: boolean; auth?: boolean }) {
  const o = { usersDoc: true, registry: true, auth: true, schools: [], lastSchoolId: null, ...opts };
  const uid = o.auth
    ? (await admin.auth.createUser({ email: usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN), password: "mot-de-passe-test-1", displayName: username })).uid
    : `sans-auth-${username}`;
  if (o.claim) await admin.auth.setCustomUserClaims(uid, { superAdmin: true });
  if (o.usersDoc) await admin.db.doc(`users/${uid}`).set({ username, displayName: username, schoolIds: o.schools, lastSchoolId: o.lastSchoolId, mustChangePassword: false });
  if (o.registry) await admin.db.doc(`usernames/${username}`).set({ uid, email: usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN) });
  for (const s of o.schools) await admin.db.doc(`schools/${s}/members/${uid}`).set({ uid, schoolId: s, username, fullName: username, role: "مدير", isActive: true });
  uidOf[username] = uid;
  return uid;
}

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "purge-dev-real-copy-test");
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  // Copie FICTIVE du dev : alfajr migrée (racine héritée gardée), annour, et des comptes particuliers.
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runMigration(admin.db, admin.auth, { schoolId: PURGE_SCHOOL_ID, apply: true, outDir: null, rotatePasswords: "none" });
  await seedSecondSchool(admin.db, admin.auth); // khalid_tazi : alfajr ET annour
  await admin.db.doc(`users/${await authUid("khalid_tazi")}`).set({ lastSchoolId: PURGE_SCHOOL_ID }, { merge: true });

  await admin.db.doc("schools/test1234").set({ name: "école de test (fixtures)", slug: "test1234", status: "active" });
  await admin.db.doc("schools/test1234/students/DEMO-1").set({ schoolId: "test1234", fullName: "طالب تجريبي", demoData: true });
  await extraAccount("test_admin", { schools: ["test1234"], lastSchoolId: "test1234" });
  await extraAccount("superadmin_demo", { claim: true });
  await extraAccount("super_alfajr", { claim: true, schools: [PURGE_SCHOOL_ID], lastSchoolId: PURGE_SCHOOL_ID });
  await extraAccount("orphan_auth", { usersDoc: false, registry: false });
  await extraAccount("orphan_doc", { auth: false });
  // Sous-collection imbriquée et collection racine inattendue.
  await admin.db.doc(`schools/${PURGE_SCHOOL_ID}/students/S-101/notes/n1`).set({ text: "note fictive" });
  await admin.db.doc("mystery/x").set({ a: 1 });
});

afterAll(async () => {
  await admin?.close();
});

describe("arguments : prod refusée, quoi qu'on passe", () => {
  it("lit le projet de prod dans .env.production", () => {
    expect(FORBIDDEN_PROJECT_IDS).toEqual([PROD]);
  });

  it("refuse la prod dans tous les cas : --apply, confirmation, GITHUB_ACTIONS, majuscules, arguments invalides", () => {
    for (const e of [{}, emuEnv, { GITHUB_ACTIONS: "true" }, { ...emuEnv, GITHUB_ACTIONS: "true" }]) {
      expect(() => parsePurgeArgs([`--project=${PROD}`], e)).toThrow(/PRODUCTION/);
      expect(() => parsePurgeArgs([`--project=${PROD}`, "--apply", `--confirm-prod=${PROD}`, `--database=${PROD_DB}`], e)).toThrow(/PRODUCTION/);
      expect(() => parsePurgeArgs([`--project=${PROD.toUpperCase()}`, "--force"], e)).toThrow(/PRODUCTION/);
      expect(() => parsePurgeArgs(["argument-libre", `--project= ${PROD} `, "--school=x"], e)).toThrow(/PRODUCTION/);
    }
  });

  it("le script lancé sur la prod s'arrête avant toute connexion (code 1), avec ou sans GITHUB_ACTIONS", () => {
    for (const ga of [undefined, "true"]) {
      const env = { ...process.env };
      delete env.GITHUB_ACTIONS;
      if (ga) env.GITHUB_ACTIONS = ga;
      for (const extra of [[], ["--apply", `--confirm-prod=${PROD}`, `--database=${PROD_DB}`]]) {
        const r = runScript(["scripts/admin/purge-dev-real-copy.ts", `--project=${PROD}`, ...extra], { encoding: "utf8", env });
        expect(r.status).toBe(1);
        expect(r.stderr).toMatch(/\[purge-dev-real-copy\] ÉCHEC : Projet de PRODUCTION/);
        expect(r.stdout).not.toMatch(/ÉMULATEURS|PROJET RÉEL/);
      }
    }
  });

  it("accepte le dev (base du même nom que celle de la prod) ; --project obligatoire, options inconnues refusées, école non paramétrable", () => {
    expect(parsePurgeArgs(["--project=fajr-c4c6e", `--database=${PROD_DB}`], {})).toMatchObject({ projectId: "fajr-c4c6e", apply: false });
    expect(parsePurgeArgs(["--project=fajr-c4c6e", `--database=${PROD_DB}`, "--apply", "--confirm-prod=fajr-c4c6e"], {})).toMatchObject({ apply: true });
    expect(() => parsePurgeArgs([], emuEnv)).toThrow(/--project/);
    expect(() => parsePurgeArgs([`--project=${PROJECT}`], {})).toThrow(/émulateurs/);
    expect(() => parsePurgeArgs(["--project=fajr-c4c6e", "--apply"], {})).toThrow(/--database/);
    expect(() => parsePurgeArgs(["--project=fajr-c4c6e", "--database=base-dev", "--apply"], {})).toThrow(/--confirm-prod=fajr-c4c6e/);
    expect(() => parsePurgeArgs(["--project=fajr-c4c6e"], emuEnv)).toThrow(/mélange/);
    expect(() => parsePurgeArgs([`--project=${PROJECT}`, "--school=annour"], emuEnv)).toThrow(/inconnue/);
    expect(() => parsePurgeArgs([`--project=${PROJECT}`, "--force"], emuEnv)).toThrow(/inconnue/);
  });
});

describe("purge", () => {
  let annourBefore: unknown;
  let test1234Before: unknown;
  let kept: string[] = [];
  let removed: string[] = [];
  let usersBefore = 0;

  it("simulation : compte les documents et les comptes, n'écrit rien", async () => {
    const before = await everything();
    const out = mkdtempSync(join(tmpdir(), "purge-sim-"));
    const { summary } = await runPurgeDevRealCopy(admin.db, admin.auth, { apply: false, outDir: out });
    expect(await everything()).toBe(before);

    expect(summary.mode).toBe("simulation");
    expect(summary.school).toBe("alfajr");
    expect(summary.deleted).toBeNull();
    expect(summary.remaining).toBeNull();
    // Arbre de l'école : documents et sous-collections, imbriquées comprises.
    expect(summary.documents.schoolByCollection.students).toBeGreaterThanOrEqual(10);
    expect(summary.documents.schoolByCollection.members).toBeGreaterThan(0);
    expect(summary.documents.schoolByCollection.staffPrivate).toBeGreaterThan(0);
    expect(summary.documents.schoolByCollection.settings).toBe(1);
    const alfajrDocs = await countCollection(admin.db.collection("schools").doc(PURGE_SCHOOL_ID).collection("students"));
    expect(alfajrDocs).toBe(summary.documents.schoolByCollection.students);
    const bySub = Object.values(summary.documents.schoolByCollection).reduce((a, b) => a + b, 0);
    expect(summary.documents.school).toBe(bySub + 1); // + le document de l'école
    // Collections héritées de la racine.
    for (const c of Object.keys(summary.documents.legacyByCollection)) expect(LEGACY_ROOT_COLLECTIONS).toContain(c);
    expect(summary.documents.legacyByCollection.students).toBeGreaterThan(0);
    expect(summary.documents.legacyByCollection.appUsers).toBeGreaterThan(0);
    expect(summary.documents.legacyRoot).toBe(Object.values(summary.documents.legacyByCollection).reduce((a, b) => a + b, 0));
    expect(summary.documents.unknownRootCollections).toEqual(["mystery"]);
    // Comptes.
    expect(summary.accounts).toMatchObject({ keptSuperAdmin: 2, keptOtherSchool: 4, profilesCleaned: 2 });
    expect(summary.accounts.authToDelete).toBe(summary.accounts.authScanned - 6);
    expect(summary.accounts.authToDelete).toBeGreaterThan(3);
    expect(summary.accounts.usersDocsToDelete).toBeGreaterThanOrEqual(summary.accounts.authToDelete - 1); // orphan_auth n'a pas de profil
    // Rapport : resume.json seul, sans mot de passe ni nom.
    const dir = join(out, readdirSync(out)[0]);
    expect(readdirSync(dir)).toEqual(["resume.json"]);
    expect(readFileSync(join(dir, "resume.json"), "utf8")).not.toMatch(/orphan_|khalid|superadmin_demo/);
    expect(TENANT_COLLECTIONS.every((c) => LEGACY_ROOT_COLLECTIONS.includes(c))).toBe(true);
  });

  it("apply : supprime l'école alfajr, la racine héritée et les comptes sans école, garde le reste", async () => {
    annourBefore = await dump(admin.db.doc("schools/annour"));
    test1234Before = await dump(admin.db.doc("schools/test1234"));
    usersBefore = (await admin.db.collection("users").get()).size;
    const all = (await admin.auth.listUsers(1000)).users.map((u) => u.uid);
    kept = [uidOf.superadmin_demo, uidOf.super_alfajr, uidOf.test_admin, await authUid("khalid_tazi"), await authUid("dir_annour"), await authUid("prof_annour")];
    removed = all.filter((u) => !kept.includes(u));
    expect(removed.length).toBeGreaterThan(3);
    const registryKeptBefore = await Promise.all(["khalid_tazi", "dir_annour", "prof_annour", "test_admin", "superadmin_demo", "super_alfajr"].map(async (n) => JSON.stringify((await admin.db.doc(`usernames/${n}`).get()).data())));

    const out = mkdtempSync(join(tmpdir(), "purge-apply-"));
    const { summary } = await runPurgeDevRealCopy(admin.db, admin.auth, { apply: true, outDir: out });
    expect(purgeIncomplete(summary)).toBe(false);
    expect(summary.mode).toBe("application");
    expect(summary.deleted).toMatchObject({ authAccounts: removed.length, authFailures: 0 });
    expect(summary.remaining).toEqual({ school: 0, legacyRoot: 0, authToDelete: 0, usersDocsToDelete: 0, usernamesToDelete: 0 });

    // L'arbre alfajr a disparu, imbriqué compris ; la racine héritée aussi.
    const school = admin.db.doc(`schools/${PURGE_SCHOOL_ID}`);
    expect((await school.get()).exists).toBe(false);
    expect(await school.listCollections()).toHaveLength(0);
    expect((await admin.db.doc(`schools/${PURGE_SCHOOL_ID}/students/S-101/notes/n1`).get()).exists).toBe(false);
    const roots = (await admin.db.listCollections()).map((c) => c.id).sort();
    expect(roots).toEqual(["mystery", "schools", "usernames", "users"]);
    for (const c of LEGACY_ROOT_COLLECTIONS) expect((await admin.db.collection(c).limit(1).get()).empty, c).toBe(true);
    expect((await admin.db.doc("mystery/x").get()).data()).toEqual({ a: 1 }); // inconnue : jamais supprimée

    // Les autres écoles sont intactes, octet pour octet.
    expect(await dump(admin.db.doc("schools/annour"))).toEqual(annourBefore);
    expect(await dump(admin.db.doc("schools/test1234"))).toEqual(test1234Before);
    expect((await admin.db.collection("schools").listDocuments()).map((r) => r.id).sort()).toEqual(["annour", "test1234"]);

    // Comptes : conservés (super-admins, membres d'une autre école) et supprimés (Auth, profil, registre).
    for (const uid of kept) expect(await authExists(uid), uid).toBe(true);
    for (const uid of removed) {
      expect(await authExists(uid), uid).toBe(false);
      expect((await admin.db.doc(`users/${uid}`).get()).exists, uid).toBe(false);
    }
    expect((await admin.auth.getUser(uidOf.superadmin_demo)).customClaims).toEqual({ superAdmin: true });
    expect((await admin.auth.getUser(uidOf.super_alfajr)).customClaims).toEqual({ superAdmin: true });
    const regs = (await admin.db.collection("usernames").get()).docs;
    expect(regs.map((d) => d.data().uid).sort()).toEqual([...kept].sort());
    expect((await admin.db.doc("usernames/orphan_doc").get()).exists).toBe(false);
    expect((await admin.db.collection("users").get()).size).toBe(kept.length);
    expect(usersBefore).toBeGreaterThan(kept.length);
    expect(await Promise.all(["khalid_tazi", "dir_annour", "prof_annour", "test_admin", "superadmin_demo", "super_alfajr"].map(async (n) => JSON.stringify((await admin.db.doc(`usernames/${n}`).get()).data())))).toEqual(registryKeptBefore);

    // Membre d'une autre école : seul alfajr disparaît de son profil.
    const khalid = (await admin.db.doc(`users/${await authUid("khalid_tazi")}`).get()).data()!;
    expect(khalid.schoolIds).toEqual(["annour"]);
    expect(khalid.lastSchoolId).toBeNull();
    expect((await admin.db.doc(`users/${uidOf.test_admin}`).get()).data()).toMatchObject({ schoolIds: ["test1234"], lastSchoolId: "test1234" });
    expect((await admin.db.doc(`schools/annour/members/${await authUid("khalid_tazi")}`).get()).exists).toBe(true);
    // Super-admin membre d'alfajr : conservé, sans référence à l'école supprimée.
    expect((await admin.db.doc(`users/${uidOf.super_alfajr}`).get()).data()).toMatchObject({ schoolIds: [], lastSchoolId: null });
    expect((await admin.db.doc(`users/${uidOf.superadmin_demo}`).get()).data()).toMatchObject({ schoolIds: [] });

    const dir = join(out, readdirSync(out)[0]);
    expect(readdirSync(dir)).toEqual(["resume.json"]);
    expect(readFileSync(join(dir, "resume.json"), "utf8")).not.toMatch(/orphan_|khalid|superadmin_demo|test_admin/);
  });

  it("relance : plus rien à supprimer, rien ne change", async () => {
    const before = await everything();
    const { summary } = await runPurgeDevRealCopy(admin.db, admin.auth, { apply: true, outDir: null });
    expect(summary.documents.school).toBe(0);
    expect(summary.documents.legacyRoot).toBe(0);
    expect(summary.accounts).toMatchObject({ authScanned: kept.length, keptSuperAdmin: 2, keptOtherSchool: 4, profilesCleaned: 0, authToDelete: 0, usersDocsToDelete: 0, usernamesToDelete: 0 });
    expect(summary.deleted).toEqual({ authAccounts: 0, usersDocs: 0, usernamesDocs: 0, authFailures: 0 });
    expect(purgeIncomplete(summary)).toBe(false);
    expect(await everything()).toBe(before);
  });

  it("CLI sur les émulateurs : résumé affiché sans donnée personnelle, code 0", async () => {
    await admin.db.doc(`schools/${PURGE_SCHOOL_ID}/students/S-900`).set({ schoolId: PURGE_SCHOOL_ID, fullName: "اسم حقيقي مفترض", parentPhone: "0600000000" });
    await admin.db.doc("students/S-900").set({ fullName: "اسم حقيقي مفترض" });
    const env = { ...process.env };
    delete env.GITHUB_ACTIONS;
    const sim = runScript(["scripts/admin/purge-dev-real-copy.ts", `--project=${PROJECT}`], { encoding: "utf8", env });
    expect(sim.status, sim.stderr).toBe(0);
    expect(sim.stdout).toMatch(/SIMULATION/);
    expect(sim.stdout).toMatch(/"school": 1/); // l'élève S-900 seul : le document de l'école n'existe plus (parent fantôme, non compté)
    expect((await admin.db.doc(`schools/${PURGE_SCHOOL_ID}/students/S-900`).get()).exists).toBe(true);
    const r = runScript(["scripts/admin/purge-dev-real-copy.ts", `--project=${PROJECT}`, "--apply"], { encoding: "utf8", env });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/APPLICATION/);
    expect(r.stdout + r.stderr).not.toMatch(/اسم حقيقي|0600000000/);
    expect((await admin.db.doc(`schools/${PURGE_SCHOOL_ID}/students/S-900`).get()).exists).toBe(false);
    expect((await admin.db.doc("students/S-900").get()).exists).toBe(false);
  });
});
