#!/usr/bin/env tsx
/**
 * Données FICTIVES en volume dans UNE école de test existante (D82) : le
 * propriétaire essaie l'application multi-écoles sur le dev avec une école
 * créée depuis l'interface (ex. `test1234`), en gardant ce qu'il y a saisi.
 *
 * - Jeu : scripts/dev/fixtures/school-fixtures.ts (`--size=large`, défaut :
 *   ~150 élèves, 12 halaqas, 15 membres du personnel, 3 mois de présences… ;
 *   `--size=small` : environ dix fois moins), au format de l'application,
 *   `schoolId` dénormalisé, fiches RH dans `staffPrivate` (D42).
 * - Marquage : `demoData: true` et identifiant `DEMO-…` (exceptions
 *   `staffPrivate` et `attendance`, voir le module du jeu). La relance et
 *   `--remove` ne réécrivent et ne suppriment QUE des documents marqués ;
 *   un document non marqué de même identifiant est laissé tel quel (compté).
 * - Relance idempotente : documents marqués réécrits (même contenu le même
 *   jour), documents marqués qui ne font plus partie du jeu supprimés.
 * - Comptes `test_admin` (إداري), `test_enseignant` (مدرس, fiche DEMO-T-01 et
 *   ses halaqas), `test_parent` (ولي أمر, deux élèves frères ou sœurs),
 *   `test_eleve` (طالب) : convention de `createSchoolUser`, membres de
 *   l'école visée SEULEMENT, jamais de claim `superAdmin`, marqués
 *   (`users.demoAccount`, `usernames.source`, `members.demoData`). Mots de
 *   passe aléatoires (19 caractères) dans le seul fichier SECRET
 *   <out>/seed-school-fixtures-<horodatage>/mots-de-passe-temporaires.csv (mode 600).
 *
 * Refus, contrôlés EN PREMIER et sans option pour les lever :
 * - le projet de prod (critère : le projet seul, comme seed-demo) ;
 * - l'école `alfajr` (copie des données réelles sur le dev) ;
 * - une école absente (`schools/{id}` est créé par `createSchool`) ;
 * - une école qui contient plus de 20 élèves non générés (vraie école).
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/dev/seed-school-fixtures.ts --project=demo-quran-school --school=annour --apply"
 * Projet de dev : uniquement par le workflow ops.yml (action seed-school-fixtures, D82).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Auth } from "firebase-admin/auth";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, parseFlags, timestamp, type CommonArgs } from "../admin/lib/cli";
import { toCsv } from "../admin/lib/csv";
import { generateTemporaryPassword } from "../admin/lib/passwords";
import { LEGACY_EMAIL_DOMAIN, NEW_ACCOUNTS_EMAIL_DOMAIN, usernameToEmail } from "../../src/security/accounts";
import { STAFF_PRIVATE_COLLECTION } from "../../src/security/staffPrivate";
import type { SystemSettings } from "../../src/types";
import {
  FIXTURE_COLLECTIONS,
  FIXTURE_SIZES,
  buildSchoolFixtures,
  countFixtures,
  isGeneratedDoc,
  referencesGenerated,
  type FixtureLinks,
  type FixtureSize,
} from "./fixtures/school-fixtures";

/** Projet de PRODUCTION : jamais visé (liste de refus, pas une configuration). Le refus porte sur le projet seul. */
export const FORBIDDEN_PROJECT_IDS = ["gen-lang-client-0481880143"];
/** École `alfajr` : copie des données réelles d'élèves mineurs sur le dev (D77, D80). */
export const FORBIDDEN_SCHOOL_IDS = ["alfajr"];
export const SCHOOL_ID_PATTERN = /^[a-z0-9-]{3,40}$/;
/** Au-delà, l'école est traitée comme une vraie école : refus. */
export const MAX_UNMARKED_STUDENTS = 20;
export const BATCH_SIZE = 400;
export const SOURCE = "seed-school-fixtures";
/** 4 groupes de 4 caractères : 19 caractères (≥ 16 exigés). */
export const PASSWORD_GROUPS = 4;

export interface TestAccount {
  username: string;
  role: string;
  fullName: string;
  member: (links: FixtureLinks) => Record<string, unknown>;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    username: "test_admin", role: "إداري", fullName: "عبد الإله الصقلي (حساب تجريبي)",
    member: (l) => ({ linkedTeacherId: l.officeTeacherId, canEditStudents: true, canEditPayments: true }),
  },
  {
    username: "test_enseignant", role: "مدرس", fullName: "عبد الرحيم الوزاني (حساب تجريبي)",
    member: (l) => ({ linkedTeacherId: l.teacherId, teacherTakeAttendance: true, teacherRecordGrades: true, teacherWriteBehaviorReports: true }),
  },
  {
    username: "test_parent", role: "ولي أمر", fullName: "ولي أمر (حساب تجريبي)",
    member: (l) => ({
      linkedStudentIds: [...l.parentStudentIds], phone: l.parentPhone,
      parentViewOwnStats: true, parentViewOwnAttendance: true, parentViewCertificates: true, parentViewOwnPayments: true,
    }),
  },
  {
    username: "test_eleve", role: "طالب", fullName: "طالب (حساب تجريبي)",
    member: (l) => ({ linkedStudentIds: [l.studentId] }),
  },
];
export const TEST_USERNAMES = TEST_ACCOUNTS.map((a) => a.username);

/** Refus du projet de prod : premier contrôle, sans exception. */
export function assertNotProduction(projectId: unknown): void {
  const p = typeof projectId === "string" ? projectId.trim().toLowerCase() : "";
  if (FORBIDDEN_PROJECT_IDS.includes(p)) {
    throw new Error("Projet de PRODUCTION : refus définitif (données fictives sur le dev ou les émulateurs seulement, D82).");
  }
}

/** Refus de l'école `alfajr` et des identifiants mal formés (avant toute connexion). */
export function assertAllowedSchool(schoolId: unknown): string {
  if (typeof schoolId !== "string" || !schoolId) throw new Error("--school=<id> est obligatoire (aucune école par défaut).");
  if (FORBIDDEN_SCHOOL_IDS.includes(schoolId.trim().toLowerCase())) {
    throw new Error("FORBIDDEN_SCHOOL école alfajr : refus définitif (copie des données réelles, D82). Rien n'a été modifié.");
  }
  if (!SCHOOL_ID_PATTERN.test(schoolId)) throw new Error(`--school invalide : attendu ${SCHOOL_ID_PATTERN.source}.`);
  return schoolId;
}

export interface SeedSchoolFixturesArgs extends CommonArgs {
  schoolId: string;
  size: FixtureSize;
  remove: boolean;
}

const KNOWN_FLAGS = new Set(["project", "database", "apply", "dry-run", "confirm-prod", "out", "remove", "school", "size"]);

export function parseSeedSchoolFixturesArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): SeedSchoolFixturesArgs {
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  assertNotProduction(project);
  const schoolId = assertAllowedSchool(flags.get("school"));
  for (const k of flags.keys()) if (!KNOWN_FLAGS.has(k)) throw new Error(`Option inconnue : --${k}`);
  const sizeFlag = flags.get("size");
  const size = sizeFlag === undefined ? "large" : sizeFlag;
  if (typeof size !== "string" || !(FIXTURE_SIZES as string[]).includes(size)) throw new Error("--size doit valoir small ou large.");
  const common = parseCommonArgs(argv, env, "scripts/dev/out");
  assertNotProduction(common.projectId);
  return { ...common, schoolId, size: size as FixtureSize, remove: flags.has("remove") };
}

type Doc = Record<string, unknown>;

/**
 * École visée : refus si elle n'existe pas ou si elle contient plus de
 * MAX_UNMARKED_STUDENTS élèves non générés. Lecture des seuls identifiants et
 * marqueurs (aucun contenu d'élève).
 */
export async function assertTargetSchool(db: Firestore, schoolId: string): Promise<void> {
  assertAllowedSchool(schoolId);
  const school = await db.collection("schools").doc(schoolId).get();
  if (!school.exists) {
    throw new Error(`SCHOOL_NOT_FOUND schools/${schoolId} n'existe pas (créer l'école depuis l'interface, createSchool). Rien n'a été modifié.`);
  }
  const snap = await db.collection(`schools/${schoolId}/students`).select("demoData").get();
  const unmarked = snap.docs.filter((d) => !isGeneratedDoc("students", d.id, d.data())).length;
  if (unmarked > MAX_UNMARKED_STUDENTS) {
    throw new Error(`REAL_SCHOOL schools/${schoolId} contient ${unmarked} élèves non générés (> ${MAX_UNMARKED_STUDENTS}) : vraie école, refus. Rien n'a été modifié.`);
  }
}

/** Marqueurs de chaque document d'une collection de l'école (aucun contenu métier). */
async function readMarkers(db: Firestore, schoolId: string, col: string): Promise<Map<string, Doc>> {
  const fields = col === STAFF_PRIVATE_COLLECTION ? ["teacherId"] : ["demoData", "studentId", "referenceId", "teacherId", "personId", "activityId"];
  const snap = await db.collection(`schools/${schoolId}/${col}`).select(...fields).get();
  return new Map(snap.docs.map((d) => [d.id, d.data()]));
}

// ------------------------------------------------------------------ comptes

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

async function otherMemberships(db: Firestore, uid: string, schoolId: string): Promise<string[]> {
  const out: string[] = [];
  for (const ref of await db.collection("schools").listDocuments()) {
    if (ref.id === schoolId) continue;
    if ((await ref.collection("members").doc(uid).get()).exists) out.push(ref.id);
  }
  return out;
}

export type AccountState = { kind: "absent" } | { kind: "ours"; uid: string } | { kind: "foreign"; why: string };

/**
 * État d'un compte de test : absent, créé par ce script pour CETTE école
 * (`ours`), ou autre (`foreign` : nom pris par un autre compte, compte
 * historique, compte non marqué ou marqué pour une autre école). Un compte
 * marqué pour cette école mais membre d'une autre école lève ACCOUNT_CONFLICT.
 */
export async function inspectTestAccount(db: Firestore, auth: Auth, username: string, schoolId: string): Promise<AccountState> {
  if (await authUidByEmail(auth, usernameToEmail(username, LEGACY_EMAIL_DOMAIN))) return { kind: "foreign", why: "un compte historique porte ce nom" };
  const uid = await authUidByEmail(auth, usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN));
  const reg = await db.collection("usernames").doc(username).get();
  const regData = reg.data();
  const regUid = typeof regData?.uid === "string" ? regData.uid : null;
  if (reg.exists && regData?.source !== SOURCE) return { kind: "foreign", why: "nom inscrit au registre pour un autre compte" };
  if (regUid && regUid !== uid && (await authExists(auth, regUid))) return { kind: "foreign", why: "le registre désigne un autre compte" };
  if (!uid) return { kind: "absent" };
  const profile = (await db.collection("users").doc(uid).get()).data();
  if (profile?.demoAccount !== true || profile?.demoSchoolId !== schoolId) return { kind: "foreign", why: "compte existant non créé par ce script pour cette école" };
  const schoolIds = profile.schoolIds;
  if ((Array.isArray(schoolIds) && schoolIds.some((x) => x !== schoolId)) || (await otherMemberships(db, uid, schoolId)).length) {
    throw new Error(`ACCOUNT_CONFLICT ${username} : compte de test rattaché à une autre école. Rien n'a été modifié.`);
  }
  return { kind: "ours", uid };
}

// ------------------------------------------------------------------ écritures

type Op = { ref: DocumentReference; data?: Doc };

async function commitOps(db: Firestore, ops: Op[]): Promise<void> {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_SIZE)) {
      if (op.data) batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    }
    await batch.commit();
  }
}

function writeReport(outDir: string, now: Date, summary: object, credentials: Credential[] = []): string {
  const dir = join(outDir, `${SOURCE}-${timestamp(now)}`);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (credentials.length) {
    // SECRET : seul fichier qui contient les mots de passe.
    writeFileSync(join(dir, "mots-de-passe-temporaires.csv"), toCsv(credentials.map((c) => ({ compte: c.username, role: c.role, identifiant: c.username, motDePasseTemporaire: c.password })), ["compte", "role", "identifiant", "motDePasseTemporaire"]), { mode: 0o600 });
  }
  writeFileSync(join(dir, "resume.json"), JSON.stringify({ ...summary, reportDir: dir }, null, 2));
  return dir;
}

export interface Credential {
  username: string;
  role: string;
  password: string;
}

export interface SeedSummary {
  mode: "simulation" | "application";
  operation: "seed";
  schoolId: string;
  size: FixtureSize;
  /** Documents du jeu, par collection. */
  collections: Record<string, number>;
  writes: { set: number; deleted: number; total: number };
  /** Documents NON marqués portant un identifiant du jeu : laissés tels quels. */
  skippedUnmarked: number;
  /** Documents non marqués de l'école, gardés (par collection, membres compris). */
  unmarkedKept: Record<string, number>;
  paymentMonths: string[];
  accounts: { created: number; reset: number; roles: Record<string, string> };
  superAdminClaims: number;
  otherSchoolMemberships: number;
  passwordsFile: boolean;
  reportDir: string | null;
}

export interface SeedOptions {
  schoolId: string;
  size: FixtureSize;
  apply: boolean;
  outDir: string | null;
  now?: Date;
}

export async function runSeedSchoolFixtures(db: Firestore, auth: Auth, opts: SeedOptions): Promise<{ summary: SeedSummary; credentials: Credential[] }> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const s = assertAllowedSchool(opts.schoolId);
  await assertTargetSchool(db, s);

  // Tous les comptes sont contrôlés AVANT la première écriture.
  const states = new Map<string, AccountState>();
  for (const a of TEST_ACCOUNTS) {
    const st = await inspectTestAccount(db, auth, a.username, s);
    if (st.kind === "foreign") throw new Error(`ACCOUNT_CONFLICT ${a.username} : ${st.why}. Rien n'a été modifié.`);
    states.set(a.username, st);
  }

  const settings = ((await db.doc(`schools/${s}/settings/system`).get()).data() ?? null) as Partial<SystemSettings> | null;
  const fixtures = buildSchoolFixtures({ schoolId: s, size: opts.size, now, settings });

  // Plan : réécriture des documents marqués ou absents, suppression des marqués hors du jeu.
  const ops: Op[] = [];
  let skippedUnmarked = 0;
  let deleted = 0;
  const unmarkedKept: Record<string, number> = {};
  for (const col of FIXTURE_COLLECTIONS) {
    const existing = await readMarkers(db, s, col);
    const wanted = fixtures.collections[col];
    for (const [id, data] of Object.entries(wanted)) {
      const cur = existing.get(id);
      if (cur && !isGeneratedDoc(col, id, cur)) {
        skippedUnmarked++;
        continue;
      }
      ops.push({ ref: db.doc(`schools/${s}/${col}/${id}`), data });
    }
    let kept = 0;
    for (const [id, cur] of existing) {
      if (!isGeneratedDoc(col, id, cur)) kept++;
      else if (!wanted[id]) {
        ops.push({ ref: db.doc(`schools/${s}/${col}/${id}`) });
        deleted++;
      }
    }
    unmarkedKept[col] = kept;
  }
  const members = await db.collection(`schools/${s}/members`).select("demoData").get();
  unmarkedKept.members = members.docs.filter((d) => d.data().demoData !== true).length;

  const summary: SeedSummary = {
    mode: opts.apply ? "application" : "simulation",
    operation: "seed",
    schoolId: s,
    size: opts.size,
    collections: countFixtures(fixtures),
    writes: { set: ops.length - deleted, deleted, total: ops.length },
    skippedUnmarked,
    unmarkedKept,
    paymentMonths: fixtures.paymentMonths,
    accounts: { created: 0, reset: 0, roles: Object.fromEntries(TEST_ACCOUNTS.map((a) => [a.username, a.role])) },
    superAdminClaims: 0,
    otherSchoolMemberships: 0,
    passwordsFile: false,
    reportDir: null,
  };
  const credentials: Credential[] = [];
  if (!opts.apply) {
    for (const st of states.values()) st.kind === "ours" ? summary.accounts.reset++ : summary.accounts.created++;
    summary.writes.total += TEST_ACCOUNTS.length * 3;
    if (opts.outDir) summary.reportDir = writeReport(opts.outDir, now, summary);
    return { summary, credentials };
  }

  await commitOps(db, ops);

  // Comptes de test : convention de createSchoolUser, aucun claim, école visée seulement.
  const schoolRef = db.collection("schools").doc(s);
  for (const a of TEST_ACCOUNTS) {
    const email = usernameToEmail(a.username, NEW_ACCOUNTS_EMAIL_DOMAIN);
    const password = generateTemporaryPassword(PASSWORD_GROUPS);
    const st = states.get(a.username)!;
    let uid: string;
    let created = false;
    if (st.kind === "ours") {
      uid = st.uid;
      await auth.updateUser(uid, { password, displayName: a.fullName, disabled: false });
      await auth.revokeRefreshTokens(uid);
      summary.accounts.reset++;
    } else {
      uid = (await auth.createUser({ email, password, displayName: a.fullName })).uid;
      created = true;
      summary.accounts.created++;
    }
    try {
      await auth.setCustomUserClaims(uid, null);
      const batch = db.batch();
      batch.set(db.collection("users").doc(uid), {
        username: a.username, displayName: a.fullName, schoolIds: [s], lastSchoolId: s, mustChangePassword: false,
        demoAccount: true, demoSchoolId: s, createdBy: SOURCE, updatedAt: nowIso,
      });
      batch.set(db.collection("usernames").doc(a.username), { uid, email, createdAt: nowIso, source: SOURCE, schoolId: s });
      batch.set(schoolRef.collection("members").doc(uid), {
        uid, schoolId: s, username: a.username, fullName: a.fullName, role: a.role, isActive: true, isArchived: false,
        phone: null, email: null, permissions: null, linkedTeacherId: null, linkedStudentIds: [],
        createdAt: nowIso, createdBy: SOURCE, demoData: true, ...a.member(fixtures.links),
      });
      await batch.commit();
    } catch (error) {
      if (created) await auth.deleteUser(uid).catch(() => undefined); // pas de compte Auth orphelin
      throw error;
    }
    credentials.push({ username: a.username, role: a.role, password });
  }
  summary.writes.total += TEST_ACCOUNTS.length * 3;

  // Contrôle après écriture : aucun claim superAdmin, aucune autre école.
  for (const a of TEST_ACCOUNTS) {
    const user = await auth.getUserByEmail(usernameToEmail(a.username, NEW_ACCOUNTS_EMAIL_DOMAIN));
    if (user.customClaims?.superAdmin) summary.superAdminClaims++;
    summary.otherSchoolMemberships += (await otherMemberships(db, user.uid, s)).length;
  }
  if (summary.superAdminClaims || summary.otherSchoolMemberships) {
    throw new Error(`ISOLATION_FAILED claims superAdmin ${summary.superAdminClaims}, autres écoles ${summary.otherSchoolMemberships}.`);
  }
  if (opts.outDir) {
    summary.passwordsFile = true;
    summary.reportDir = writeReport(opts.outDir, now, summary, credentials);
  }
  return { summary, credentials };
}

export interface RemoveSummary {
  mode: "simulation" | "application";
  operation: "remove";
  schoolId: string;
  /** Documents marqués supprimés, par collection. */
  removed: Record<string, number>;
  writes: { deleted: number; total: number };
  unmarkedKept: Record<string, number>;
  /** Documents NON marqués créés par l'interface pour un élève ou une fiche DEMO- : gardés. */
  orphansLeft: number;
  accounts: { removed: number; skipped: number };
  reportDir: string | null;
}

/** Suppression des seuls documents marqués et des comptes de test créés pour cette école. */
export async function runRemoveSchoolFixtures(db: Firestore, auth: Auth, opts: { schoolId: string; apply: boolean; outDir: string | null; now?: Date }): Promise<RemoveSummary> {
  const now = opts.now ?? new Date();
  const s = assertAllowedSchool(opts.schoolId);
  await assertTargetSchool(db, s);
  const states = new Map<string, AccountState>();
  for (const u of TEST_USERNAMES) states.set(u, await inspectTestAccount(db, auth, u, s));

  const ops: Op[] = [];
  const removed: Record<string, number> = {};
  const unmarkedKept: Record<string, number> = {};
  let orphansLeft = 0;
  for (const col of FIXTURE_COLLECTIONS) {
    const existing = await readMarkers(db, s, col);
    let n = 0;
    let kept = 0;
    for (const [id, cur] of existing) {
      if (isGeneratedDoc(col, id, cur)) {
        ops.push({ ref: db.doc(`schools/${s}/${col}/${id}`) });
        n++;
      } else {
        kept++;
        if (referencesGenerated(id, cur)) orphansLeft++;
      }
    }
    removed[col] = n;
    unmarkedKept[col] = kept;
  }
  const ours = [...states.values()].filter((x): x is { kind: "ours"; uid: string } => x.kind === "ours").map((x) => x.uid);
  const members = await db.collection(`schools/${s}/members`).select("demoData").get();
  unmarkedKept.members = members.docs.filter((d) => d.data().demoData !== true).length;

  const summary: RemoveSummary = {
    mode: opts.apply ? "application" : "simulation",
    operation: "remove",
    schoolId: s,
    removed,
    writes: { deleted: ops.length, total: ops.length + ours.length * 3 },
    unmarkedKept,
    orphansLeft,
    accounts: { removed: ours.length, skipped: [...states.values()].filter((x) => x.kind === "foreign").length },
    reportDir: null,
  };
  if (opts.apply) {
    await commitOps(db, ops);
    for (const [username, st] of states) {
      if (st.kind !== "ours") continue;
      const member = await db.doc(`schools/${s}/members/${st.uid}`).get();
      if (member.exists && member.data()?.demoData === true) await member.ref.delete();
      const reg = await db.collection("usernames").doc(username).get();
      if (reg.exists && reg.data()?.source === SOURCE) await reg.ref.delete();
      await db.collection("users").doc(st.uid).delete();
      await auth.deleteUser(st.uid);
    }
  }
  if (opts.outDir) summary.reportDir = writeReport(opts.outDir, now, summary);
  return summary;
}

async function main() {
  const args = parseSeedSchoolFixturesArgs(process.argv.slice(2));
  const what = args.remove ? `SUPPRESSION des données DEMO- de schools/${args.schoolId} et des comptes test_*` : `données fictives (${args.size}) dans schools/${args.schoolId}`;
  console.log(`[seed-school-fixtures] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} : ${what} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, SOURCE);
  try {
    if (args.remove) {
      const summary = await runRemoveSchoolFixtures(admin.db, admin.auth, { schoolId: args.schoolId, apply: args.apply, outDir: args.outDir });
      console.log(JSON.stringify(summary, null, 2));
    } else {
      // La sortie ne contient jamais les mots de passe (credentials n'est pas affiché).
      const { summary } = await runSeedSchoolFixtures(admin.db, admin.auth, { schoolId: args.schoolId, size: args.size, apply: args.apply, outDir: args.outDir });
      console.log(JSON.stringify(summary, null, 2));
      if (summary.passwordsFile) console.log("[seed-school-fixtures] Mots de passe : fichier SECRET mots-de-passe-temporaires.csv du dossier du rapport (ne pas commiter, supprimer après usage).");
    }
    if (!args.apply) console.log("[seed-school-fixtures] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[seed-school-fixtures] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
