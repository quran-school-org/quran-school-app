/**
 * scripts/admin/rotate-stale-passwords.ts (action rotate-stale-passwords d'ops.yml,
 * D103) sur les émulateurs : comptes qui n'ont jamais changé leur ancien mot de
 * passe (`mustChangePassword` toujours vrai) remplacés par des mots de passe
 * temporaires. Simulation sans écriture, ancien mot de passe refusé et nouveau
 * accepté, super-admins / comptes désactivés / réinitialisations récentes
 * ignorés, filtre --school, relance sans effet sur les mots de passe déjà
 * remis, résumé sans donnée personnelle, CSV secret, refus de la prod hors ops.yml.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut, type Auth as ClientAuth } from "firebase/auth";

import { POSIX_MODES, runScript } from "./runScript";
import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import {
  CSV_COLUMNS,
  RECENT_RESET_DAYS,
  SOURCE,
  isRecentlyReset,
  parseRotateStaleArgs,
  runRotateStalePasswords,
} from "../../scripts/admin/rotate-stale-passwords";
import { FORBIDDEN_PROJECT_IDS } from "../../scripts/admin/lib/prodProject";
import { NEW_ACCOUNTS_EMAIL_DOMAIN, usernameToEmail } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const PROD = "gen-lang-client-0481880143";
const PROD_DB = "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec";
const OLD = "123_secure_fajr";
const RECENT_PASSWORD = "mot-de-passe-du-directeur-7";
const DAY = 24 * 60 * 60 * 1000;
/** Code renvoyé pour un mauvais mot de passe : selon la version de l'émulateur. */
const WRONG_PASSWORD = /^auth\/(invalid-credential|wrong-password)$/;
const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };

let admin: AdminHandles;
let app: FirebaseApp;
let clientAuth: ClientAuth;
const uids: Record<string, string> = {};
const FULL_NAMES: Record<string, string> = {};

async function signIn(username: string, password: string): Promise<string> {
  await signOut(clientAuth).catch(() => undefined);
  try {
    await signInWithEmailAndPassword(clientAuth, usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN), password);
    return "ok";
  } catch (e: any) {
    return e?.code || String(e);
  }
}

interface Fixture {
  username: string;
  role: string;
  schools: string[];
  mustChange?: boolean;
  disabled?: boolean;
  superAdmin?: boolean;
  resetDaysAgo?: number;
  password?: string;
  noAuth?: boolean;
}

const FIXTURES: Fixture[] = [
  { username: "dir_a", role: "مدير", schools: ["alfajr"] },
  { username: "prof_a", role: "مدرس", schools: ["alfajr"] },
  { username: "par_a", role: "ولي أمر", schools: ["alfajr"], resetDaysAgo: RECENT_RESET_DAYS + 3 }, // ancienne réinitialisation : ciblé
  { username: "multi", role: "إداري", schools: ["alfajr", "annour"] },
  { username: "prof_n", role: "مدرس", schools: ["annour"] },
  { username: "super_x", role: "", schools: [], superAdmin: true },
  { username: "super_member", role: "مدير", schools: ["alfajr"], superAdmin: true },
  { username: "off_a", role: "متطوع", schools: ["alfajr"], disabled: true },
  { username: "rec_a", role: "إداري", schools: ["alfajr"], resetDaysAgo: 3, password: RECENT_PASSWORD },
  { username: "lone", role: "", schools: [] },
  { username: "ghost", role: "مدرس", schools: ["alfajr"], noAuth: true },
  { username: "done_a", role: "مدرس", schools: ["alfajr"], mustChange: false, password: "choisi-par-la-personne-1" },
];

async function seed() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  for (const s of ["alfajr", "annour"]) await admin.db.doc(`schools/${s}`).set({ name: s, slug: s, status: "active" });
  for (const f of FIXTURES) {
    const fullName = `اسم ${f.username} (اختبار)`;
    FULL_NAMES[f.username] = fullName;
    let uid = `uid-${f.username}`;
    if (!f.noAuth) {
      const rec = await admin.auth.createUser({
        uid, email: usernameToEmail(f.username, NEW_ACCOUNTS_EMAIL_DOMAIN), password: f.password ?? OLD,
        displayName: fullName, disabled: f.disabled === true,
      });
      uid = rec.uid;
      if (f.superAdmin) await admin.auth.setCustomUserClaims(uid, { superAdmin: true });
    }
    uids[f.username] = uid;
    await admin.db.doc(`users/${uid}`).set({
      username: f.username, displayName: fullName, schoolIds: f.schools, lastSchoolId: f.schools[0] ?? null,
      mustChangePassword: f.mustChange ?? true,
      ...(f.resetDaysAgo !== undefined ? { passwordResetAt: new Date(Date.now() - f.resetDaysAgo * DAY).toISOString(), passwordResetBy: "un-directeur" } : {}),
    });
    for (const s of f.schools) {
      await admin.db.doc(`schools/${s}/members/${uid}`).set({ uid, schoolId: s, username: f.username, fullName, role: f.role, isActive: true });
    }
  }
}

/** État comparable de tous les comptes et profils (détecte la moindre écriture). */
async function snapshot() {
  const auth = (await admin.auth.listUsers(1000)).users.map((u) => ({ uid: u.uid, hash: u.passwordHash, salt: u.passwordSalt, valid: u.tokensValidAfterTime, disabled: u.disabled, claims: u.customClaims ?? null }));
  const users = (await admin.db.collection("users").get()).docs.map((d) => ({ id: d.id, data: d.data() }));
  const sort = <T extends { uid?: string; id?: string }>(a: T[]) => [...a].sort((x, y) => String(x.uid ?? x.id).localeCompare(String(y.uid ?? y.id)));
  return JSON.stringify({ auth: sort(auth), users: sort(users) });
}

const userDoc = async (username: string) => (await admin.db.doc(`users/${uids[username]}`).get()).data();

function readCsv(dir: string): Record<string, string>[] {
  const text = readFileSync(join(dir, "mots-de-passe-temporaires.csv"), "utf8").replace(/^﻿/, "").trim();
  const [head, ...rows] = text.split("\r\n");
  expect(head.split(",")).toEqual(CSV_COLUMNS);
  return rows.map((r) => Object.fromEntries(r.split(",").map((v, i) => [CSV_COLUMNS[i], v])));
}

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "rotate-stale-test");
  await seed();
  app = initializeApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `rsp-${Date.now()}`);
  clientAuth = getAuth(app);
  connectAuthEmulator(clientAuth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
});

afterAll(async () => {
  await signOut(clientAuth).catch(() => undefined);
  if (app) await deleteApp(app);
  await admin?.close();
});

describe("arguments et garde-fous", () => {
  it("lit le projet de prod dans .env.production", () => {
    expect(FORBIDDEN_PROJECT_IDS).toEqual([PROD]);
  });

  it("la prod n'est servie que depuis ops.yml (GITHUB_ACTIONS), jamais depuis un poste ou un conteneur", () => {
    for (const e of [{}, emuEnv, { GITHUB_ACTIONS: "false" }, { ...emuEnv, GITHUB_ACTIONS: "1" }]) {
      expect(() => parseRotateStaleArgs([`--project=${PROD}`, `--database=${PROD_DB}`], e)).toThrow(/hors du workflow ops\.yml/);
      expect(() => parseRotateStaleArgs([`--project=${PROD.toUpperCase()}`, `--database=${PROD_DB}`, "--apply", `--confirm-prod=${PROD}`], e)).toThrow(/hors du workflow ops\.yml/);
    }
    // Depuis ops.yml : accepté, mais seulement avec la base, et l'écriture exige la confirmation.
    const ops = { GITHUB_ACTIONS: "true" };
    expect(parseRotateStaleArgs([`--project=${PROD}`, `--database=${PROD_DB}`], ops)).toMatchObject({ projectId: PROD, apply: false, schoolId: null, emulator: false });
    expect(() => parseRotateStaleArgs([`--project=${PROD}`], ops)).toThrow(/--database/);
    expect(() => parseRotateStaleArgs([`--project=${PROD}`, `--database=${PROD_DB}`, "--apply"], ops)).toThrow(/--confirm-prod/);
    expect(parseRotateStaleArgs([`--project=${PROD}`, `--database=${PROD_DB}`, "--apply", `--confirm-prod=${PROD}`, "--school=alfajr"], ops)).toMatchObject({ apply: true, schoolId: "alfajr" });
    // Jamais de mélange d'émulateurs avec un vrai projet.
    expect(() => parseRotateStaleArgs([`--project=${PROD}`, `--database=${PROD_DB}`], { ...ops, ...emuEnv })).toThrow(/mélange/);
  });

  it("--project obligatoire, simulation par défaut, options et école validées", () => {
    expect(() => parseRotateStaleArgs([], emuEnv)).toThrow(/--project/);
    expect(() => parseRotateStaleArgs([`--project=${PROJECT}`], {})).toThrow(/émulateurs/);
    expect(parseRotateStaleArgs([`--project=${PROJECT}`], emuEnv)).toMatchObject({ apply: false, schoolId: null });
    expect(parseRotateStaleArgs([`--project=${PROJECT}`, "--school=annour", "--apply"], emuEnv)).toMatchObject({ apply: true, schoolId: "annour" });
    for (const bad of ["", "a", "Alfajr", "../x", "x".repeat(41), "a b"]) {
      expect(() => parseRotateStaleArgs([`--project=${PROJECT}`, `--school=${bad}`], emuEnv), bad).toThrow(/--school invalide/);
    }
    expect(() => parseRotateStaleArgs([`--project=${PROJECT}`, "--school"], emuEnv)).toThrow(/--school invalide/);
    expect(() => parseRotateStaleArgs([`--project=${PROJECT}`, "--force"], emuEnv)).toThrow(/inconnue/);
    expect(() => parseRotateStaleArgs([`--project=${PROJECT}`, "--apply", "--dry-run"], emuEnv)).toThrow(/incompatibles/);
  });

  it("le script lancé sur la prod s'arrête avant toute connexion (code 1)", () => {
    const env = { ...process.env };
    delete env.GITHUB_ACTIONS;
    for (const extra of [[], ["--apply", `--confirm-prod=${PROD}`, `--database=${PROD_DB}`]]) {
      const r = runScript(["scripts/admin/rotate-stale-passwords.ts", `--project=${PROD}`, ...extra], { encoding: "utf8", env });
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/\[rotate-stale-passwords\] ÉCHEC : Projet de PRODUCTION hors du workflow ops\.yml/);
      expect(r.stdout).not.toMatch(/ÉMULATEURS|PROJET RÉEL/);
    }
  });

  it("réinitialisation récente : moins de 7 jours seulement", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
    expect(isRecentlyReset(ago(DAY), now)).toBe(true);
    expect(isRecentlyReset(ago(RECENT_RESET_DAYS * DAY - 1000), now)).toBe(true);
    expect(isRecentlyReset(ago(RECENT_RESET_DAYS * DAY), now)).toBe(false);
    expect(isRecentlyReset(ago(30 * DAY), now)).toBe(false);
    expect(isRecentlyReset(ago(-30 * DAY), now)).toBe(false); // date future : falsifiée ou erronée, pas une protection
    for (const bad of [undefined, null, "", "pas une date", 12345]) expect(isRecentlyReset(bad, now)).toBe(false);
  });
});

describe("simulation", () => {
  it("n'écrit rien : ni Auth, ni Firestore, ni fichier de mots de passe ; l'ancien mot de passe marche encore", async () => {
    const before = await snapshot();
    const out = mkdtempSync(join(tmpdir(), "rotate-sim-"));
    const { summary } = await runRotateStalePasswords(admin.db, admin.auth, { schoolId: null, apply: false, outDir: out });
    expect(await snapshot()).toBe(before);
    expect(summary).toMatchObject({
      mode: "simulation", school: null, scanned: 11, targeted: 5, rotated: 0, failures: 0, recentlyReset: 1, passwordsFile: false,
      ignored: { superAdmin: 2, disabled: 1, authMissing: 1, noSchool: 1, otherSchool: 0 },
      bySchool: { alfajr: { targeted: 4, rotated: 0 }, annour: { targeted: 2, rotated: 0 } },
    });
    const dirs = readdirSync(out);
    expect(dirs).toHaveLength(1);
    expect(readdirSync(join(out, dirs[0]))).toEqual(["resume.json"]);
    expect(await signIn("dir_a", OLD)).toBe("ok");
    expect(await signIn("multi", OLD)).toBe("ok");
  });
});

describe("application", () => {
  let annourPasswords: Record<string, string> = {};

  it("--school : seuls les comptes de cette école sont traités ; mot de passe par école, ligne limitée à l'école", async () => {
    const out = mkdtempSync(join(tmpdir(), "rotate-school-"));
    const t0 = Date.now();
    const { summary } = await runRotateStalePasswords(admin.db, admin.auth, { schoolId: "annour", apply: true, outDir: out });
    expect(summary).toMatchObject({
      mode: "application", school: "annour", scanned: 11, targeted: 2, rotated: 2, failures: 0, recentlyReset: 1, passwordsFile: true,
      ignored: { superAdmin: 2, disabled: 1, authMissing: 1, noSchool: 1, otherSchool: 3 },
      bySchool: { annour: { targeted: 2, rotated: 2 } },
    });
    const dir = join(out, readdirSync(out)[0]);
    const rows = readCsv(dir);
    expect(rows.map((r) => r.identifiant).sort()).toEqual(["multi", "prof_n"]);
    for (const r of rows) {
      expect(r.ecole).toBe("annour");
      expect(r.motDePasseTemporaire).toMatch(/^[a-z2-9]{4}(-[a-z2-9]{4}){2}$/);
    }
    expect(rows.find((r) => r.identifiant === "multi")).toMatchObject({ nomComplet: FULL_NAMES.multi, role: "إداري" });
    expect(rows.find((r) => r.identifiant === "prof_n")).toMatchObject({ nomComplet: FULL_NAMES.prof_n, role: "مدرس" });
    annourPasswords = Object.fromEntries(rows.map((r) => [r.identifiant, r.motDePasseTemporaire]));

    // Ancien mot de passe refusé, nouveau accepté ; sessions révoquées ; mustChangePassword gardé.
    for (const u of ["multi", "prof_n"]) {
      expect(await signIn(u, OLD), u).toMatch(WRONG_PASSWORD);
      expect(await signIn(u, annourPasswords[u]), u).toBe("ok");
      const doc = await userDoc(u);
      expect(doc).toMatchObject({ mustChangePassword: true, passwordResetBy: SOURCE });
      expect(Date.parse(doc!.passwordResetAt)).toBeGreaterThanOrEqual(t0 - 1000);
      expect(JSON.stringify(doc)).not.toContain(annourPasswords[u]);
      expect(Date.parse((await admin.auth.getUser(uids[u])).tokensValidAfterTime!)).toBeGreaterThanOrEqual(Math.floor(t0 / 1000) * 1000 - 1000);
    }
    // Les autres écoles ne sont pas touchées.
    for (const u of ["dir_a", "prof_a", "par_a"]) {
      expect(await signIn(u, OLD), u).toBe("ok");
      expect(await userDoc(u)).not.toHaveProperty("passwordResetBy", SOURCE);
    }
  });

  it("toutes les écoles (CLI) : ignorés intacts, déjà traités non recassés, CSV secret mode 600, rien dans la sortie", async () => {
    const protectedBefore = {
      super_x: JSON.stringify(await userDoc("super_x")), super_member: JSON.stringify(await userDoc("super_member")),
      off_a: JSON.stringify(await userDoc("off_a")), rec_a: JSON.stringify(await userDoc("rec_a")),
      lone: JSON.stringify(await userDoc("lone")), ghost: JSON.stringify(await userDoc("ghost")), done_a: JSON.stringify(await userDoc("done_a")),
    };
    const hashesBefore = Object.fromEntries(await Promise.all(["super_x", "super_member", "off_a", "rec_a", "lone", "done_a"].map(async (u) => [u, (await admin.auth.getUser(uids[u])).passwordHash])));

    const out = mkdtempSync(join(tmpdir(), "rotate-all-"));
    const env = { ...process.env };
    delete env.GITHUB_ACTIONS;
    const r = runScript(["scripts/admin/rotate-stale-passwords.ts", `--project=${PROJECT}`, "--apply", `--out=${out}`], { encoding: "utf8", env });
    expect(r.status, r.stderr).toBe(0);
    const dirs = readdirSync(out);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toMatch(/^rotate-stale-passwords-/);
    const dir = join(out, dirs[0]);
    expect(readdirSync(dir).sort()).toEqual(["mots-de-passe-temporaires.csv", "resume.json"]);
    if (POSIX_MODES) expect(statSync(join(dir, "mots-de-passe-temporaires.csv")).mode & 0o777).toBe(0o600);

    const resume = JSON.parse(readFileSync(join(dir, "resume.json"), "utf8"));
    expect(resume).toMatchObject({
      mode: "application", school: null, scanned: 11, targeted: 3, rotated: 3, failures: 0,
      recentlyReset: 3, // rec_a + les deux comptes d'annour traités à l'étape précédente
      ignored: { superAdmin: 2, disabled: 1, authMissing: 1, noSchool: 1, otherSchool: 0 },
      bySchool: { alfajr: { targeted: 3, rotated: 3 } },
      passwordsFile: true,
    });

    const rows = readCsv(dir);
    expect(rows.map((x) => x.identifiant).sort()).toEqual(["dir_a", "par_a", "prof_a"]);
    const roles: Record<string, string> = { dir_a: "مدير", prof_a: "مدرس", par_a: "ولي أمر" };
    for (const row of rows) {
      expect(row).toMatchObject({ ecole: "alfajr", nomComplet: FULL_NAMES[row.identifiant], role: roles[row.identifiant] });
      expect(await signIn(row.identifiant, OLD), row.identifiant).toMatch(WRONG_PASSWORD);
      expect(await signIn(row.identifiant, row.motDePasseTemporaire), row.identifiant).toBe("ok");
      expect(await userDoc(row.identifiant)).toMatchObject({ mustChangePassword: true, passwordResetBy: SOURCE });
    }

    // Aucun mot de passe, nom ou identifiant dans la sortie ni dans le résumé.
    const secrets = [...rows.map((x) => x.motDePasseTemporaire), ...Object.values(annourPasswords)];
    const names = [...Object.values(FULL_NAMES), ...FIXTURES.map((f) => f.username)];
    for (const text of [r.stdout, r.stderr, JSON.stringify(resume)]) {
      for (const s of secrets) expect(text).not.toContain(s);
      for (const n of names) expect(text, n).not.toContain(n);
      for (const uid of Object.values(uids)) expect(text).not.toContain(uid);
      expect(text).not.toContain(OLD);
    }

    // Ignorés : ni mot de passe, ni profil, ni jeton touchés.
    for (const u of ["super_x", "super_member", "off_a", "rec_a", "lone", "ghost", "done_a"]) {
      expect(JSON.stringify(await userDoc(u)), u).toBe(protectedBefore[u as keyof typeof protectedBefore]);
    }
    for (const [u, hash] of Object.entries(hashesBefore)) expect((await admin.auth.getUser(uids[u])).passwordHash, u).toBe(hash);
    expect(await signIn("rec_a", RECENT_PASSWORD)).toBe("ok");
    expect(await signIn("done_a", "choisi-par-la-personne-1")).toBe("ok");
    expect(await signIn("super_x", OLD)).toBe("ok");
    expect(await signIn("off_a", OLD)).toBe("auth/user-disabled");
    expect((await admin.auth.getUser(uids.off_a)).disabled).toBe(true);
    // Les mots de passe déjà remis à annour restent valables (compte réinitialisé récemment).
    for (const [u, pw] of Object.entries(annourPasswords)) expect(await signIn(u, pw), u).toBe("ok");
  });

  it("relance : plus rien à traiter, aucun mot de passe recassé, pas de fichier de mots de passe", async () => {
    const before = await snapshot();
    const out = mkdtempSync(join(tmpdir(), "rotate-again-"));
    const { summary } = await runRotateStalePasswords(admin.db, admin.auth, { schoolId: null, apply: true, outDir: out });
    expect(summary).toMatchObject({ targeted: 0, rotated: 0, failures: 0, recentlyReset: 6, passwordsFile: false, bySchool: {} });
    expect(await snapshot()).toBe(before);
    expect(readdirSync(join(out, readdirSync(out)[0]))).toEqual(["resume.json"]);
  });

  it("un compte réinitialisé il y a plus de 7 jours est de nouveau ciblé", async () => {
    await admin.db.doc(`users/${uids.rec_a}`).update({ passwordResetAt: new Date(Date.now() - (RECENT_RESET_DAYS + 1) * DAY).toISOString() });
    const { summary } = await runRotateStalePasswords(admin.db, admin.auth, { schoolId: null, apply: false, outDir: null });
    expect(summary).toMatchObject({ targeted: 1, recentlyReset: 5, bySchool: { alfajr: { targeted: 1, rotated: 0 } } });
  });
});
