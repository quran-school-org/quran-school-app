#!/usr/bin/env tsx
/**
 * École de DÉMONSTRATION `demo` sur le projet de DEV (D77) : le propriétaire
 * essaie le nouveau design dans un navigateur, avec un compte par rôle.
 *
 * - Données ENTIÈREMENT FICTIVES : le jeu des émulateurs
 *   (scripts/dev/fixtures/legacy-alfajr.ts), réduit à l'utile et écrit
 *   directement au format multi-écoles sous schools/demo (élèves, halaqas,
 *   présences, examens, suivi, paiements, finances, activités, notifications,
 *   personnel + staffPrivate, paramètres).
 * - Comptes `demo_directeur` (مدير), `demo_admin` (إداري), `demo_enseignant`
 *   (مدرس), `demo_parent` (ولي أمر, lié à deux élèves fictifs), `demo_eleve`
 *   (طالب) : membres de l'école `demo` SEULEMENT, jamais de claim `superAdmin`.
 * - Mots de passe ALÉATOIRES (19 caractères, CSPRNG), écrits uniquement dans
 *   le fichier SECRET <out>/seed-demo-<horodatage>/mots-de-passe-temporaires.csv
 *   (mode 600), jamais dans Firestore ni dans la sortie du script.
 * - Idempotent : une relance supprime puis réécrit schools/demo et donne de
 *   nouveaux mots de passe aux comptes demo_* (sessions révoquées).
 * - `--remove` : supprime l'école `demo` et les comptes demo_* (à faire AVANT
 *   toute copie des données réelles sur le dev, D77).
 *
 * Garde-fous :
 * - REFUS ABSOLU du projet de prod (et de sa base), avant toute autre
 *   vérification, quelle que soit l'option passée ;
 * - `--project` obligatoire, simulation par défaut, `--apply` pour écrire ;
 *   sur un vrai projet : `--database` et `--confirm-prod=<projet>` (lib/cli.ts) ;
 * - sur un vrai projet, refus si la base contient autre chose que l'école
 *   `demo` (collections racine, autre école, autres comptes) : la démo ne
 *   cohabite jamais avec une copie des données réelles ;
 * - refus si un compte demo_* appartient à une autre école, ou si son nom est
 *   déjà pris par un autre compte.
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/dev/seed-demo.ts --project=demo-quran-school --apply"
 * Projet de dev : uniquement par le workflow ops.yml (action seed-demo, D77).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, parseFlags, timestamp, type CommonArgs } from "../admin/lib/cli";
import { toCsv } from "../admin/lib/csv";
import { generateTemporaryPassword } from "../admin/lib/passwords";
import { LEGACY_BUSINESS_DEFAULTS, TENANT_COLLECTIONS } from "../migration/migrate-to-tenants";
import { LEGACY_EMAIL_DOMAIN, NEW_ACCOUNTS_EMAIL_DOMAIN, usernameToEmail } from "../../src/security/accounts";
import { STAFF_PRIVATE_COLLECTION, hasStaffPrivateFields, splitStaffRecord } from "../../src/security/staffPrivate";
import { defaultSchoolSettings } from "../../src/school/businessRules";
import { legacyFixture } from "./fixtures/legacy-alfajr";

/** Projet et base de PRODUCTION : jamais visés par ce script (liste de refus, pas une configuration). */
export const FORBIDDEN_PROJECT_IDS = ["gen-lang-client-0481880143"];
export const FORBIDDEN_DATABASE_IDS = ["ai-studio-a6572431-c7db-4071-82bf-a922d18511ec"];

export const DEMO_SCHOOL_ID = "demo";
export const DEMO_SCHOOL_NAME = "مدرسة تجريبية (بيانات وهمية)";
/** 4 groupes de 4 caractères : 19 caractères (≥ 16 exigés, D77). */
export const DEMO_PASSWORD_GROUPS = 4;

export interface DemoAccount {
  username: string;
  role: string;
  fullName: string;
  member: Record<string, unknown>;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "demo_directeur", role: "مدير", fullName: "المدير (حساب تجريبي)",
    member: { canEditStudents: true, canEditTeachers: true, canEditGrades: true, canEditPayments: true },
  },
  {
    username: "demo_admin", role: "إداري", fullName: "خالد التازي (حساب تجريبي)",
    member: { linkedTeacherId: "t2", canEditStudents: true, canEditPayments: true },
  },
  {
    username: "demo_enseignant", role: "مدرس", fullName: "يوسف البقالي (حساب تجريبي)",
    member: { linkedTeacherId: "t1", teacherTakeAttendance: true, teacherRecordGrades: true, teacherWriteBehaviorReports: true },
  },
  {
    username: "demo_parent", role: "ولي أمر", fullName: "محمد العلمي (حساب تجريبي)",
    member: {
      linkedStudentIds: ["S-101", "S-102"], phone: "0661000001",
      parentViewOwnStats: true, parentViewOwnAttendance: true, parentViewCertificates: true, parentViewOwnPayments: true,
    },
  },
  {
    username: "demo_eleve", role: "طالب", fullName: "علي الرباطي (حساب تجريبي)",
    member: { linkedStudentIds: ["S-109"] },
  },
];

export const DEMO_USERNAMES = DEMO_ACCOUNTS.map((a) => a.username);

/** Refus du projet ou de la base de prod : premier contrôle, sans exception. */
export function assertNotProduction(projectId: unknown, databaseId?: unknown): void {
  const p = typeof projectId === "string" ? projectId.trim().toLowerCase() : "";
  const d = typeof databaseId === "string" ? databaseId.trim().toLowerCase() : "";
  if (FORBIDDEN_PROJECT_IDS.includes(p) || FORBIDDEN_DATABASE_IDS.includes(d)) {
    throw new Error("Projet de PRODUCTION : refus définitif (l'école de démonstration ne va que sur le dev ou les émulateurs, D77).");
  }
}

export interface SeedDemoArgs extends CommonArgs {
  remove: boolean;
}

const KNOWN_FLAGS = new Set(["project", "database", "apply", "dry-run", "confirm-prod", "out", "remove"]);

export function parseSeedDemoArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): SeedDemoArgs {
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) {
    throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  }
  assertNotProduction(project, flags.get("database"));
  for (const k of flags.keys()) if (!KNOWN_FLAGS.has(k)) throw new Error(`Option inconnue : --${k}`);
  const common = parseCommonArgs(argv, env, "scripts/dev/out");
  assertNotProduction(common.projectId, common.databaseId);
  return { ...common, remove: flags.has("remove") };
}

type Doc = Record<string, unknown>;

/** Élèves exclus du jeu des émulateurs : photo de ~950 Ko et halaqa orpheline (S-111), élève supprimé (S-999). */
const EXCLUDED_STUDENTS = new Set(["S-111", "S-999"]);

/** Documents de l'école de démonstration, par collection (chemins relatifs à schools/demo). */
export function demoSchoolData(now: Date = new Date()): { collections: Record<string, Record<string, Doc>>; settings: Doc; school: Doc } {
  const fixture = legacyFixture();
  const s = DEMO_SCHOOL_ID;
  const nowIso = now.toISOString();
  const collections: Record<string, Record<string, Doc>> = {};
  for (const col of TENANT_COLLECTIONS) {
    const out: Record<string, Doc> = {};
    for (const [id, data] of Object.entries(fixture.collections[col] || {})) {
      if (EXCLUDED_STUDENTS.has(id) || EXCLUDED_STUDENTS.has(String(data.studentId ?? data.referenceId ?? ""))) continue;
      const body = col === "teachers" ? splitStaffRecord(data).publicData : data;
      out[id] = { ...body, id, schoolId: s };
    }
    collections[col] = out;
  }
  const staff: Record<string, Doc> = {};
  for (const [id, t] of Object.entries(fixture.collections.teachers)) {
    if (!hasStaffPrivateFields(t)) continue;
    staff[id] = { ...splitStaffRecord(t).privateData, teacherId: id, schoolId: s, updatedAt: nowIso };
  }
  collections[STAFF_PRIVATE_COLLECTION] = staff;
  const settings: Doc = {
    ...defaultSchoolSettings(DEMO_SCHOOL_NAME, now),
    ...fixture.settings,
    associationName: DEMO_SCHOOL_NAME,
    directorName: "المدير (حساب تجريبي)",
    subscriptionFee: LEGACY_BUSINESS_DEFAULTS.subscriptionFee,
    feeOverrides: LEGACY_BUSINESS_DEFAULTS.feeOverrides,
    openingYear: LEGACY_BUSINESS_DEFAULTS.openingYear,
    openingMonth: LEGACY_BUSINESS_DEFAULTS.openingMonth,
    studentAccountMinAge: LEGACY_BUSINESS_DEFAULTS.studentAccountMinAge,
    schoolId: s,
  };
  const school: Doc = { name: DEMO_SCHOOL_NAME, slug: s, status: "active", demo: true, createdAt: nowIso, createdBy: "seed-demo" };
  return { collections, settings, school };
}

/**
 * Ce que la base contient en dehors de l'école `demo` (marqueurs sans contenu
 * de document) : collections racine non vides, autres écoles, autres comptes.
 */
export async function findOtherData(db: Firestore): Promise<string[]> {
  const markers: string[] = [];
  for (const col of ["appUsers", "settings", ...TENANT_COLLECTIONS]) {
    if (!(await db.collection(col).limit(1).get()).empty) markers.push(`racine:${col}`);
  }
  const otherSchools = (await db.collection("schools").listDocuments()).filter((r) => r.id !== DEMO_SCHOOL_ID);
  if (otherSchools.length) markers.push(`autres écoles:${otherSchools.length}`);
  const otherNames = (await db.collection("usernames").listDocuments()).filter((r) => !DEMO_USERNAMES.includes(r.id));
  if (otherNames.length) markers.push(`autres comptes:${otherNames.length}`);
  return markers;
}

async function authUidByEmail(auth: Auth, email: string): Promise<string | null> {
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") return null;
    throw e;
  }
}

async function authExists(auth: Auth, uid: string): Promise<boolean> {
  try {
    await auth.getUser(uid);
    return true;
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") return false;
    throw e;
  }
}

/** Autres écoles où le compte est membre (lecture directe par uid, sans index). */
async function otherMemberships(db: Firestore, uid: string): Promise<string[]> {
  const out: string[] = [];
  for (const ref of await db.collection("schools").listDocuments()) {
    if (ref.id === DEMO_SCHOOL_ID) continue;
    if ((await ref.collection("members").doc(uid).get()).exists) out.push(ref.id);
  }
  return out;
}

/**
 * Contrôle d'un compte demo_* avant écriture ou suppression. Renvoie son uid
 * (null s'il n'existe pas) ; lève une erreur ACCOUNT_CONFLICT si le nom est pris
 * par un autre compte ou si le compte appartient à une autre école.
 */
export async function inspectDemoAccount(db: Firestore, auth: Auth, username: string): Promise<string | null> {
  const conflict = (why: string) => new Error(`ACCOUNT_CONFLICT ${username} : ${why}. Rien n'a été modifié.`);
  if (await authUidByEmail(auth, usernameToEmail(username, LEGACY_EMAIL_DOMAIN))) throw conflict("un compte historique porte ce nom");
  const uid = await authUidByEmail(auth, usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN));
  const reg = await db.collection("usernames").doc(username).get();
  const regUid = reg.exists && typeof reg.data()?.uid === "string" ? (reg.data()!.uid as string) : null;
  if (regUid && regUid !== uid && (await authExists(auth, regUid))) throw conflict("le registre des noms désigne un autre compte");
  if (!uid) return null;
  const schoolIds = (await db.collection("users").doc(uid).get()).data()?.schoolIds;
  if (Array.isArray(schoolIds) && schoolIds.some((x) => x !== DEMO_SCHOOL_ID)) throw conflict("le profil est rattaché à une autre école");
  if ((await otherMemberships(db, uid)).length) throw conflict("membre d'une autre école");
  return uid;
}

export interface SeedDemoOptions {
  apply: boolean;
  /** Vrai sur un vrai projet : refus si la base contient autre chose que l'école demo. */
  refuseIfOtherData: boolean;
  outDir: string | null;
  now?: Date;
}

export interface SeedDemoSummary {
  mode: "simulation" | "application";
  schoolId: string;
  collections: Record<string, number>;
  accounts: { created: number; reset: number; roles: Record<string, string> };
  superAdminClaims: number;
  otherSchoolMemberships: number;
  passwordsFile: boolean;
  reportDir: string | null;
}

export interface DemoCredential {
  username: string;
  role: string;
  password: string;
}

async function writeCollections(db: Firestore, base: string, collections: Record<string, Record<string, Doc>>) {
  const ops = Object.entries(collections).flatMap(([col, docs]) => Object.entries(docs).map(([id, data]) => ({ path: `${base}/${col}/${id}`, data })));
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 400)) batch.set(db.doc(op.path), op.data);
    await batch.commit();
  }
}

export async function runSeedDemo(db: Firestore, auth: Auth, opts: SeedDemoOptions): Promise<{ summary: SeedDemoSummary; credentials: DemoCredential[] }> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const s = DEMO_SCHOOL_ID;
  if (opts.refuseIfOtherData) {
    const markers = await findOtherData(db);
    if (markers.length) {
      throw new Error(`REAL_DATA la base contient d'autres données (${markers.join(", ")}) : la démo ne cohabite pas avec une copie des données réelles (D77). Rien n'a été modifié.`);
    }
  }
  // Tous les comptes sont contrôlés AVANT la première écriture.
  const existing = new Map<string, string | null>();
  for (const a of DEMO_ACCOUNTS) existing.set(a.username, await inspectDemoAccount(db, auth, a.username));

  const data = demoSchoolData(now);
  const collections = Object.fromEntries(Object.entries(data.collections).map(([c, docs]) => [c, Object.keys(docs).length]));
  const summary: SeedDemoSummary = {
    mode: opts.apply ? "application" : "simulation",
    schoolId: s,
    collections,
    accounts: { created: 0, reset: 0, roles: Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.username, a.role])) },
    superAdminClaims: 0,
    otherSchoolMemberships: 0,
    passwordsFile: false,
    reportDir: null,
  };
  const credentials: DemoCredential[] = [];
  if (!opts.apply) {
    for (const a of DEMO_ACCOUNTS) {
      if (existing.get(a.username)) summary.accounts.reset++;
      else summary.accounts.created++;
    }
    return { summary, credentials };
  }

  // 1. École : suppression complète (relance), puis réécriture.
  const schoolRef = db.collection("schools").doc(s);
  await db.recursiveDelete(schoolRef);
  await schoolRef.set(data.school);
  await schoolRef.collection("settings").doc("system").set(data.settings);
  await writeCollections(db, `schools/${s}`, data.collections);

  // 2. Comptes : mot de passe neuf, aucun claim, membre de demo seulement.
  for (const a of DEMO_ACCOUNTS) {
    const email = usernameToEmail(a.username, NEW_ACCOUNTS_EMAIL_DOMAIN);
    const password = generateTemporaryPassword(DEMO_PASSWORD_GROUPS);
    let uid = existing.get(a.username) ?? null;
    if (uid) {
      await auth.updateUser(uid, { password, displayName: a.fullName, disabled: false });
      await auth.revokeRefreshTokens(uid);
      summary.accounts.reset++;
    } else {
      uid = (await auth.createUser({ email, password, displayName: a.fullName })).uid;
      summary.accounts.created++;
    }
    await auth.setCustomUserClaims(uid, null);
    await db.collection("usernames").doc(a.username).set({ uid, email, createdAt: nowIso, source: "seed-demo" });
    await db.collection("users").doc(uid).set({
      username: a.username, displayName: a.fullName, schoolIds: [s], lastSchoolId: s,
      mustChangePassword: false, demoAccount: true, updatedAt: nowIso,
    });
    await schoolRef.collection("members").doc(uid).set({
      uid, schoolId: s, username: a.username, fullName: a.fullName, role: a.role,
      isActive: true, isArchived: false, permissions: null, linkedTeacherId: null, linkedStudentIds: [],
      createdAt: nowIso, createdBy: "seed-demo", ...a.member,
    });
    credentials.push({ username: a.username, role: a.role, password });
  }

  // 3. Contrôle après écriture : aucun claim superAdmin, aucune autre école.
  for (const a of DEMO_ACCOUNTS) {
    const uid = (await auth.getUserByEmail(usernameToEmail(a.username, NEW_ACCOUNTS_EMAIL_DOMAIN))).uid;
    if ((await auth.getUser(uid)).customClaims?.superAdmin) summary.superAdminClaims++;
    summary.otherSchoolMemberships += (await otherMemberships(db, uid)).length;
  }
  if (summary.superAdminClaims || summary.otherSchoolMemberships) {
    throw new Error(`ISOLATION_FAILED claims superAdmin ${summary.superAdminClaims}, autres écoles ${summary.otherSchoolMemberships}.`);
  }

  if (opts.outDir) {
    const dir = join(opts.outDir, `seed-demo-${timestamp(now)}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    // SECRET : seul fichier qui contient les mots de passe.
    writeFileSync(join(dir, "mots-de-passe-temporaires.csv"), toCsv(credentials.map((c) => ({ compte: c.username, role: c.role, identifiant: c.username, motDePasseTemporaire: c.password })), ["compte", "role", "identifiant", "motDePasseTemporaire"]), { mode: 0o600 });
    summary.passwordsFile = true;
    summary.reportDir = dir;
    writeFileSync(join(dir, "resume.json"), JSON.stringify(summary, null, 2));
  }
  return { summary, credentials };
}

export interface RemoveDemoSummary {
  mode: "simulation" | "application";
  schoolId: string;
  schoolExisted: boolean;
  accountsRemoved: number;
  reportDir: string | null;
}

/** Suppression de l'école demo et des comptes demo_* (jamais d'un compte membre d'une autre école). */
export async function runRemoveDemo(db: Firestore, auth: Auth, opts: { apply: boolean; outDir: string | null; now?: Date }): Promise<RemoveDemoSummary> {
  const now = opts.now ?? new Date();
  const schoolRef = db.collection("schools").doc(DEMO_SCHOOL_ID);
  const schoolExisted = (await schoolRef.get()).exists || (await schoolRef.listCollections()).length > 0;
  const uids = new Map<string, string | null>();
  for (const u of DEMO_USERNAMES) uids.set(u, await inspectDemoAccount(db, auth, u));
  const summary: RemoveDemoSummary = {
    mode: opts.apply ? "application" : "simulation",
    schoolId: DEMO_SCHOOL_ID,
    schoolExisted,
    accountsRemoved: [...uids.values()].filter(Boolean).length,
    reportDir: null,
  };
  if (opts.apply) {
    await db.recursiveDelete(schoolRef);
    for (const [username, uid] of uids) {
      const reg = await db.collection("usernames").doc(username).get();
      if (reg.exists && (reg.data()?.uid === uid || !(await authExists(auth, String(reg.data()?.uid))))) await reg.ref.delete();
      if (!uid) continue;
      await db.collection("users").doc(uid).delete();
      await auth.deleteUser(uid);
    }
  }
  if (opts.outDir) {
    const dir = join(opts.outDir, `seed-demo-${timestamp(now)}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    summary.reportDir = dir;
    writeFileSync(join(dir, "resume.json"), JSON.stringify({ ...summary, removed: true }, null, 2));
  }
  return summary;
}

async function main() {
  const args = parseSeedDemoArgs(process.argv.slice(2));
  const what = args.remove ? "SUPPRESSION de schools/demo et des comptes demo_*" : "école de démonstration schools/demo";
  console.log(`[seed-demo] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} : ${what} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, "seed-demo");
  try {
    if (args.remove) {
      const summary = await runRemoveDemo(admin.db, admin.auth, { apply: args.apply, outDir: args.outDir });
      console.log(JSON.stringify(summary, null, 2));
    } else {
      // La sortie ne contient jamais les mots de passe (credentials n'est pas affiché).
      const { summary } = await runSeedDemo(admin.db, admin.auth, { apply: args.apply, refuseIfOtherData: !args.emulator, outDir: args.outDir });
      console.log(JSON.stringify(summary, null, 2));
      if (summary.passwordsFile) console.log("[seed-demo] Mots de passe : fichier SECRET mots-de-passe-temporaires.csv du dossier du rapport (ne pas commiter, supprimer après usage).");
    }
    if (!args.apply) console.log("[seed-demo] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[seed-demo] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
