#!/usr/bin/env tsx
/**
 * Purge de la COPIE DES DONNÉES RÉELLES de l'école `alfajr` sur le projet de DEV
 * (D103) : élèves mineurs, paiements, salaires… copiés pour les répétitions de
 * bascule. Elle doit disparaître avant l'ouverture du code.
 *
 * PRODUCTION : REFUSÉE, sans exception. Le projet de prod est lu dans le
 * `.env.production` versionné (lib/prodProject.ts), jamais codé en dur ; le
 * refus passe AVANT toute autre vérification, quelle que soit l'option
 * (--apply, --confirm-prod, --database…). Le critère est le PROJET seul : la
 * base du dev porte le même identifiant que celle de la prod.
 *
 * Simulation (défaut) : compte les documents et les comptes, n'écrit rien.
 * `--apply` supprime :
 *   - l'arbre `schools/alfajr`, sous-collections comprises (members, settings,
 *     staffPrivate, students…) ;
 *   - les collections racine héritées de l'ancienne application (les 14
 *     collections de migrate-to-tenants, `appUsers`, `authLinks`, `settings`) ;
 *   - les comptes Firebase Auth, documents `users/` et `usernames/` qui
 *     n'appartiennent plus à aucune école.
 * Sont CONSERVÉS : les comptes super-admin (claim `superAdmin`) et les comptes
 * membres d'une autre école (fixtures, annour…), dont on retire seulement
 * `alfajr` de `schoolIds` (et de `lastSchoolId`). Les autres écoles ne sont pas
 * touchées. Une collection racine inconnue (hors users, usernames, schools et
 * liste héritée) n'est PAS supprimée : son nom est signalé dans le résumé.
 *
 * Rien n'est lu ni écrit ailleurs ; aucun mot de passe n'est produit. Le
 * résumé (resume.json) ne contient que des nombres, des noms de collections et
 * l'identifiant de l'école : aucune donnée personnelle.
 *
 * Idempotent : après une interruption, relancer la même commande ; le plan est
 * recalculé sur l'état courant. Les comptes Auth supprimés ne sont PAS dans
 * l'export Firestore : retour arrière = D103 (import de l'export puis
 * migrate-to-tenants, qui recrée les comptes).
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/admin/purge-dev-real-copy.ts --project=demo-quran-school [--apply]"
 * Projet de dev : uniquement par ops.yml (action purge-dev-real-copy, D103).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Auth } from "firebase-admin/auth";
import { FieldValue, type CollectionReference, type DocumentReference, type Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, parseFlags, timestamp, type CommonArgs } from "./lib/cli";
import { FORBIDDEN_PROJECT_IDS, isProductionProject } from "./lib/prodProject";
import { TENANT_COLLECTIONS } from "../migration/migrate-to-tenants";

export { FORBIDDEN_PROJECT_IDS };

/** École dont la copie réelle est purgée (école n°1, la seule copiée sur le dev). */
export const PURGE_SCHOOL_ID = "alfajr";
/** Collections racine de l'ancienne application : liste de migrate-to-tenants + comptes et paramètres hérités. */
export const LEGACY_ROOT_COLLECTIONS: string[] = [...TENANT_COLLECTIONS, "appUsers", "authLinks", "settings"];
/** Collections racine du schéma multi-écoles : jamais supprimées en bloc. */
export const CURRENT_ROOT_COLLECTIONS = ["users", "usernames", "schools"];
const BATCH_SIZE = 400;
const CONCURRENCY = 20;

/** Refus du projet de prod : premier contrôle, sans exception. */
export function assertNotProduction(projectId: unknown): void {
  if (isProductionProject(projectId)) {
    throw new Error("Projet de PRODUCTION : refus définitif (la purge de la copie réelle ne concerne que le dev, D103).");
  }
}

export interface PurgeArgs extends CommonArgs {}

const KNOWN_FLAGS = new Set(["project", "database", "apply", "dry-run", "confirm-prod", "out"]);

export function parsePurgeArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): PurgeArgs {
  // Refus de la prod AVANT toute autre analyse (même avec des arguments mal formés).
  for (const arg of argv) {
    const m = /^\s*--project=(.*)$/.exec(arg);
    if (m) assertNotProduction(m[1]);
  }
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  assertNotProduction(project);
  for (const k of flags.keys()) if (!KNOWN_FLAGS.has(k)) throw new Error(`Option inconnue : --${k}`);
  const common = parseCommonArgs(argv, env);
  assertNotProduction(common.projectId);
  return common;
}

export interface PurgeOptions {
  apply: boolean;
  /** null : aucun fichier écrit (tests). */
  outDir: string | null;
  now?: Date;
}

export interface PurgeSummary {
  mode: "simulation" | "application";
  school: string;
  /** Documents à supprimer (simulation) ou comptés avant suppression (application). */
  documents: {
    school: number;
    schoolByCollection: Record<string, number>;
    legacyRoot: number;
    legacyByCollection: Record<string, number>;
    /** Noms de collections racine inattendues : signalées, jamais supprimées. */
    unknownRootCollections: string[];
  };
  accounts: {
    authScanned: number;
    keptSuperAdmin: number;
    keptOtherSchool: number;
    /** Comptes membres d'une autre école dont `alfajr` est retiré de `schoolIds` / `lastSchoolId`. */
    profilesCleaned: number;
    authToDelete: number;
    usersDocsToDelete: number;
    usernamesToDelete: number;
  };
  /** Application seulement : suppressions effectives. */
  deleted: { authAccounts: number; usersDocs: number; usernamesDocs: number; authFailures: number } | null;
  /** Application seulement : ce qui reste après la purge (tout à 0 attendu). */
  remaining: { school: number; legacyRoot: number; authToDelete: number; usersDocsToDelete: number; usernamesToDelete: number } | null;
  reportDir: string | null;
}

// --------------------------------------------------------------------- comptage

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) out.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  return out;
}

/** Documents existants d'une collection et de toutes ses sous-collections (les documents « fantômes » ne comptent pas). */
export async function countCollection(col: CollectionReference): Promise<number> {
  const refs = await col.listDocuments();
  let n = 0;
  for (let i = 0; i < refs.length; i += 300) {
    const snaps = await col.firestore.getAll(...refs.slice(i, i + 300), { fieldMask: [] });
    n += snaps.filter((s) => s.exists).length;
  }
  const nested = await mapLimit(refs, CONCURRENCY, async (ref) => {
    let sub = 0;
    for (const c of await ref.listCollections()) sub += await countCollection(c);
    return sub;
  });
  return n + nested.reduce((a, b) => a + b, 0);
}

async function countSchoolTree(db: Firestore): Promise<{ total: number; byCollection: Record<string, number> }> {
  const ref = db.collection("schools").doc(PURGE_SCHOOL_ID);
  const byCollection: Record<string, number> = {};
  let total = (await ref.get()).exists ? 1 : 0;
  for (const c of await ref.listCollections()) {
    const n = await countCollection(c);
    byCollection[c.id] = n;
    total += n;
  }
  return { total, byCollection };
}

async function countLegacyRoot(db: Firestore): Promise<{ total: number; byCollection: Record<string, number>; unknown: string[] }> {
  const byCollection: Record<string, number> = {};
  const unknown: string[] = [];
  let total = 0;
  for (const c of await db.listCollections()) {
    if (CURRENT_ROOT_COLLECTIONS.includes(c.id)) continue;
    if (!LEGACY_ROOT_COLLECTIONS.includes(c.id)) { unknown.push(c.id); continue; }
    const n = await countCollection(c);
    if (n > 0) byCollection[c.id] = n;
    total += n;
  }
  return { total, byCollection, unknown: unknown.sort() };
}

// ------------------------------------------------------------------ plan comptes

interface AccountPlan {
  authScanned: number;
  keptSuperAdmin: number;
  keptOtherSchool: number;
  /** uid → { lastSchoolId à corriger } pour les comptes conservés qui référencent alfajr. */
  toClean: Map<string, { clearLast: boolean }>;
  authToDelete: string[];
  usersDocsToDelete: DocumentReference[];
  usernamesToDelete: DocumentReference[];
}

/** uid des membres des écoles AUTRES que celle purgée (documents `members` existants). */
async function otherSchoolMembers(db: Firestore): Promise<Set<string>> {
  const uids = new Set<string>();
  for (const school of await db.collection("schools").listDocuments()) {
    if (school.id === PURGE_SCHOOL_ID) continue;
    const members = await school.collection("members").select().get(); // aucun champ lu : seulement les identifiants
    for (const m of members.docs) uids.add(m.id);
  }
  return uids;
}

export async function planAccounts(db: Firestore, auth: Auth): Promise<AccountPlan> {
  const members = await otherSchoolMembers(db);
  const keep = new Set<string>();
  const plan: AccountPlan = { authScanned: 0, keptSuperAdmin: 0, keptOtherSchool: 0, toClean: new Map(), authToDelete: [], usersDocsToDelete: [], usernamesToDelete: [] };
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      plan.authScanned++;
      if (u.customClaims?.superAdmin === true) { plan.keptSuperAdmin++; keep.add(u.uid); }
      else if (members.has(u.uid)) { plan.keptOtherSchool++; keep.add(u.uid); }
      else plan.authToDelete.push(u.uid);
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const users = await db.collection("users").select("schoolIds", "lastSchoolId").get();
  for (const d of users.docs) {
    if (!keep.has(d.id)) { plan.usersDocsToDelete.push(d.ref); continue; }
    const data = d.data();
    const refsSchool = Array.isArray(data.schoolIds) && data.schoolIds.includes(PURGE_SCHOOL_ID);
    const refsLast = data.lastSchoolId === PURGE_SCHOOL_ID;
    if (refsSchool || refsLast) plan.toClean.set(d.id, { clearLast: refsLast });
  }
  const usernames = await db.collection("usernames").select("uid").get();
  for (const d of usernames.docs) {
    const uid = d.data().uid;
    if (typeof uid !== "string" || !keep.has(uid)) plan.usernamesToDelete.push(d.ref);
  }
  return plan;
}

async function deleteDocs(db: Firestore, refs: DocumentReference[]): Promise<number> {
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const ref of refs.slice(i, i + BATCH_SIZE)) batch.delete(ref);
    await batch.commit();
  }
  return refs.length;
}

// -------------------------------------------------------------------- exécution

export async function runPurgeDevRealCopy(db: Firestore, auth: Auth, opts: PurgeOptions): Promise<{ summary: PurgeSummary }> {
  const now = opts.now ?? new Date();
  const school = await countSchoolTree(db);
  const legacy = await countLegacyRoot(db);
  const plan = await planAccounts(db, auth);
  const summary: PurgeSummary = {
    mode: opts.apply ? "application" : "simulation",
    school: PURGE_SCHOOL_ID,
    documents: {
      school: school.total, schoolByCollection: school.byCollection,
      legacyRoot: legacy.total, legacyByCollection: legacy.byCollection, unknownRootCollections: legacy.unknown,
    },
    accounts: {
      authScanned: plan.authScanned, keptSuperAdmin: plan.keptSuperAdmin, keptOtherSchool: plan.keptOtherSchool,
      profilesCleaned: plan.toClean.size, authToDelete: plan.authToDelete.length,
      usersDocsToDelete: plan.usersDocsToDelete.length, usernamesToDelete: plan.usernamesToDelete.length,
    },
    deleted: null,
    remaining: null,
    reportDir: null,
  };

  if (opts.apply) {
    // 1. Données de l'école et collections héritées (les plus sensibles d'abord).
    await db.recursiveDelete(db.collection("schools").doc(PURGE_SCHOOL_ID));
    for (const c of await db.listCollections()) {
      if (LEGACY_ROOT_COLLECTIONS.includes(c.id)) await db.recursiveDelete(c);
    }
    // 2. Profils et registre des comptes qui n'appartiennent plus à aucune école.
    const usersDocs = await deleteDocs(db, plan.usersDocsToDelete);
    const usernamesDocs = await deleteDocs(db, plan.usernamesToDelete);
    // 3. Comptes Firebase Auth.
    let authAccounts = 0;
    let authFailures = 0;
    for (let i = 0; i < plan.authToDelete.length; i += 1000) {
      const res = await auth.deleteUsers(plan.authToDelete.slice(i, i + 1000));
      authAccounts += res.successCount;
      authFailures += res.failureCount;
    }
    // 4. Comptes conservés : seule la référence à l'école supprimée disparaît.
    for (const [uid, fix] of plan.toClean) {
      await db.collection("users").doc(uid).update({
        schoolIds: FieldValue.arrayRemove(PURGE_SCHOOL_ID),
        ...(fix.clearLast ? { lastSchoolId: null } : {}),
      });
    }
    summary.deleted = { authAccounts, usersDocs, usernamesDocs, authFailures };
    // 5. Contrôle : tout doit être à zéro.
    const schoolAfter = await countSchoolTree(db);
    const legacyAfter = await countLegacyRoot(db);
    const planAfter = await planAccounts(db, auth);
    summary.remaining = {
      school: schoolAfter.total, legacyRoot: legacyAfter.total, authToDelete: planAfter.authToDelete.length,
      usersDocsToDelete: planAfter.usersDocsToDelete.length, usernamesToDelete: planAfter.usernamesToDelete.length,
    };
  }

  if (opts.outDir) {
    const dir = join(opts.outDir, `purge-dev-real-copy-${timestamp(now)}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    summary.reportDir = dir;
    writeFileSync(join(dir, "resume.json"), JSON.stringify(summary, null, 2));
  }
  return { summary };
}

export function purgeIncomplete(s: PurgeSummary): boolean {
  if (!s.deleted || !s.remaining) return false;
  const r = s.remaining;
  return s.deleted.authFailures > 0 || r.school + r.legacyRoot + r.authToDelete + r.usersDocsToDelete + r.usernamesToDelete > 0;
}

async function main() {
  const args = parsePurgeArgs(process.argv.slice(2));
  console.log(`[purge-dev-real-copy] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} : purge de la copie réelle de ${PURGE_SCHOOL_ID} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, "purge-dev-real-copy");
  try {
    const { summary } = await runPurgeDevRealCopy(admin.db, admin.auth, { apply: args.apply, outDir: args.outDir });
    console.log(JSON.stringify(summary, null, 2));
    if (!args.apply) console.log("[purge-dev-real-copy] Simulation terminée : aucune écriture. Relancer avec --apply pour supprimer.");
    if (purgeIncomplete(summary)) {
      console.error("[purge-dev-real-copy] Purge incomplète (reste à supprimer ou comptes en échec) : relancer la même commande.");
      process.exitCode = 2;
    }
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[purge-dev-real-copy] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
