#!/usr/bin/env tsx
/**
 * Compte SUPER-ADMIN de la plateforme sur le projet de DEV (D80) : le
 * propriétaire teste la création d'écoles sur le dev, qui contient une copie
 * des données réelles (D77 : traité comme la prod pour la confidentialité).
 *
 * En PRODUCTION, le super-admin vient de `migrate-to-tenants --super-admin`
 * (variable PROD_SUPER_ADMIN_USERNAME) : ce script y est REFUSÉ, sans exception.
 *
 * Ce que fait le script (compte `--username`) :
 * - compte Firebase Auth créé, ou réutilisé s'il est déjà inscrit au registre
 *   `usernames/{username}` ; email technique `<username>@comptes.kuttab.local`,
 *   exactement comme `createSchoolUser` (functions/src/tenant/accounts.ts :
 *   `usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN)`), que la connexion
 *   de l'application essaie après le domaine historique (`loginEmailCandidates`) ;
 * - profil `users/{uid}` de la forme écrite par `createSchoolUser`, avec
 *   `schoolIds: []` (AUCUNE appartenance d'école : le super-admin n'a pas
 *   d'accès implicite aux données, D25) et `mustChangePassword: true` ;
 * - registre `usernames/{username}` ;
 * - claim `superAdmin: true`, ajouté aux claims existants (jamais écrasés) ;
 * - mot de passe temporaire ALÉATOIRE de 19 caractères (CSPRNG,
 *   `generateTemporaryPassword(4)`), écrit dans le seul fichier SECRET
 *   <out>/dev-super-admin-<horodatage>/mots-de-passe-temporaires.csv (mode 600),
 *   jamais dans Firestore ni dans la sortie du script.
 * - Relance : nouveau mot de passe, sessions révoquées, compte réactivé, claim gardé.
 * - `--revoke` : retire le claim `superAdmin` (les autres claims restent),
 *   révoque les sessions, désactive le compte s'il n'appartient à aucune école.
 *   Rien n'est supprimé.
 *
 * Garde-fous :
 * - REFUS ABSOLU du projet de prod, avant toute autre vérification et quelle
 *   que soit l'option passée. Le critère est le PROJET seul : la base du dev
 *   porte le même identifiant que celle de la prod ;
 * - `--project` obligatoire, simulation par défaut, `--apply` pour écrire ;
 *   sur un vrai projet : `--database` et `--confirm-prod=<projet>` (lib/cli.ts) ;
 * - refus (ACCOUNT_CONFLICT, rien n'est modifié) si l'identifiant est inscrit
 *   au registre pour un autre compte, si un compte Auth porte ce nom sans être
 *   inscrit au registre (inscription libre : jamais promu super-admin), ou si
 *   les deux domaines désignent deux comptes différents ;
 * - refus (MEMBER_ACCOUNT) si le compte appartient déjà à une ou plusieurs
 *   écoles, sauf `--allow-existing-member` (signalé dans le résumé).
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/admin/dev-super-admin.ts --project=demo-quran-school --username=superadmin_melik --apply"
 * Projet de dev : uniquement par le workflow ops.yml (action dev-super-admin, D80).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, parseFlags, timestamp, type CommonArgs } from "./lib/cli";
import { toCsv } from "./lib/csv";
import { generateTemporaryPassword } from "./lib/passwords";
import { NEW_ACCOUNTS_EMAIL_DOMAIN, isValidUsername, loginEmailCandidates, normalizeUsername, usernameToEmail } from "../../src/security/accounts";

/**
 * Projet de PRODUCTION : jamais visé par ce script (liste de refus, pas une configuration).
 * Le refus porte sur le projet seul : une base appartient à son projet, et la base
 * du dev porte volontairement le même identifiant que celle de la prod.
 */
export const FORBIDDEN_PROJECT_IDS = ["gen-lang-client-0481880143"];

/** Nom complet par défaut (compte du propriétaire sur le dev, D80). */
export const DEFAULT_FULL_NAME = "Melik Zaanouni";
/** 4 groupes de 4 caractères : 19 caractères (≥ 16 exigés). */
export const SUPER_ADMIN_PASSWORD_GROUPS = 4;
const SOURCE = "dev-super-admin";

/** Refus du projet de prod : premier contrôle, sans exception. */
export function assertNotProduction(projectId: unknown): void {
  const p = typeof projectId === "string" ? projectId.trim().toLowerCase() : "";
  if (FORBIDDEN_PROJECT_IDS.includes(p)) {
    throw new Error("Projet de PRODUCTION : refus définitif (en prod, le super-admin vient de migrate-to-tenants --super-admin, D80).");
  }
}

export interface DevSuperAdminArgs extends CommonArgs {
  username: string;
  /** null : nom par défaut à la création, nom existant conservé à la relance. */
  fullName: string | null;
  revoke: boolean;
  allowExistingMember: boolean;
}

const KNOWN_FLAGS = new Set(["project", "database", "apply", "dry-run", "confirm-prod", "out", "username", "full-name", "revoke", "allow-existing-member"]);

/** Même validation que createSchoolUser : normalisation puis isValidUsername. */
export function parseUsername(value: unknown): string {
  if (typeof value !== "string") throw new Error("--username=<identifiant> est obligatoire.");
  const username = normalizeUsername(value);
  if (!isValidUsername(username)) {
    throw new Error("--username invalide (lettres latines minuscules, chiffres et . _ - ; 2 à 40 caractères, commence par une lettre ou un chiffre).");
  }
  return username;
}

export function parseFullName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error("--full-name invalide (1 à 120 caractères imprimables).");
  return name;
}

export function parseDevSuperAdminArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): DevSuperAdminArgs {
  // Refus de la prod AVANT toute autre analyse (même avec des arguments mal formés).
  for (const arg of argv) {
    const m = /^\s*--project=(.*)$/.exec(arg);
    if (m) assertNotProduction(m[1]);
  }
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) {
    throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  }
  assertNotProduction(project);
  for (const k of flags.keys()) if (!KNOWN_FLAGS.has(k)) throw new Error(`Option inconnue : --${k}`);
  const common = parseCommonArgs(argv, env);
  assertNotProduction(common.projectId);
  const username = parseUsername(flags.get("username"));
  const revoke = flags.has("revoke");
  const allowExistingMember = flags.has("allow-existing-member");
  const fullName = flags.has("full-name") ? parseFullName(flags.get("full-name")) : null;
  if (revoke && (fullName !== null || allowExistingMember)) {
    throw new Error("--revoke ne se combine ni avec --full-name ni avec --allow-existing-member.");
  }
  return { ...common, username, fullName, revoke, allowExistingMember };
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

/**
 * uid du compte désigné par l'identifiant (null s'il n'existe pas), avec les
 * contrôles de conflit. Un compte est réutilisé seulement s'il est inscrit au
 * registre ET que les emails techniques de connexion désignent ce même compte
 * (même règle que le rattachement de createSchoolUser : jamais un compte Auth
 * créé hors des Functions).
 */
export async function resolveAccount(db: Firestore, auth: Auth, username: string): Promise<string | null> {
  const conflict = (why: string) => new Error(`ACCOUNT_CONFLICT ${username} : ${why}. Rien n'a été modifié.`);
  const reg = await db.collection("usernames").doc(username).get();
  const regUid = reg.exists && typeof reg.data()?.uid === "string" ? (reg.data()!.uid as string) : null;
  if (reg.exists && !regUid) throw conflict("entrée du registre des noms illisible");
  const found = new Set<string>();
  for (const email of loginEmailCandidates(username)) {
    const uid = await authUidByEmail(auth, email);
    if (uid) found.add(uid);
  }
  if (found.size > 1) throw conflict("les deux domaines de connexion désignent deux comptes différents");
  const authUid = found.size ? [...found][0] : null;
  if (regUid) {
    if (!(await authExists(auth, regUid))) throw conflict("le registre des noms désigne un compte absent d'Auth");
    if (authUid !== regUid) throw conflict("l'identifiant est déjà enregistré pour un autre compte");
    return regUid;
  }
  if (authUid) throw conflict("un compte Auth porte ce nom sans être inscrit au registre (inscription libre ?) : à examiner et supprimer à la main");
  return null;
}

/** Écoles dont le compte est membre (profil `schoolIds` et lecture directe des appartenances). */
export async function schoolMembershipsOf(db: Firestore, uid: string): Promise<string[]> {
  const out = new Set<string>();
  const schoolIds = (await db.collection("users").doc(uid).get()).data()?.schoolIds;
  if (Array.isArray(schoolIds)) for (const s of schoolIds) if (typeof s === "string") out.add(s);
  for (const ref of await db.collection("schools").listDocuments()) {
    if ((await ref.collection("members").doc(uid).get()).exists) out.add(ref.id);
  }
  return [...out].sort();
}

export interface DevSuperAdminOptions {
  username: string;
  fullName: string | null;
  apply: boolean;
  revoke: boolean;
  allowExistingMember: boolean;
  outDir: string | null;
  now?: Date;
}

export interface DevSuperAdminSummary {
  mode: "simulation" | "application";
  operation: "grant" | "revoke";
  username: string;
  accountFound: boolean;
  created: boolean;
  reset: boolean;
  superAdmin: boolean;
  schoolMemberships: number;
  disabled: boolean;
  sessionsRevoked: boolean;
  passwordsFile: boolean;
  reportDir: string | null;
}

export interface SuperAdminCredential {
  username: string;
  password: string;
}

function writeReport(opts: DevSuperAdminOptions, now: Date, summary: DevSuperAdminSummary, credential: SuperAdminCredential | null) {
  if (!opts.outDir) return;
  const dir = join(opts.outDir, `dev-super-admin-${timestamp(now)}`);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (credential) {
    // SECRET : seul fichier qui contient le mot de passe.
    writeFileSync(
      join(dir, "mots-de-passe-temporaires.csv"),
      toCsv([{ compte: credential.username, role: "superAdmin", identifiant: credential.username, motDePasseTemporaire: credential.password }], ["compte", "role", "identifiant", "motDePasseTemporaire"]),
      { mode: 0o600 },
    );
    summary.passwordsFile = true;
  }
  summary.reportDir = dir;
  writeFileSync(join(dir, "resume.json"), JSON.stringify(summary, null, 2));
}

export async function runDevSuperAdmin(db: Firestore, auth: Auth, opts: DevSuperAdminOptions): Promise<{ summary: DevSuperAdminSummary; credential: SuperAdminCredential | null }> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const username = parseUsername(opts.username);
  // Tous les contrôles AVANT la première écriture.
  const uid = await resolveAccount(db, auth, username);
  const memberships = uid ? await schoolMembershipsOf(db, uid) : [];
  const record = uid ? await auth.getUser(uid) : null;
  const summary: DevSuperAdminSummary = {
    mode: opts.apply ? "application" : "simulation",
    operation: opts.revoke ? "revoke" : "grant",
    username,
    accountFound: Boolean(uid),
    created: false,
    reset: false,
    superAdmin: record?.customClaims?.superAdmin === true,
    schoolMemberships: memberships.length,
    disabled: record?.disabled ?? false,
    sessionsRevoked: false,
    passwordsFile: false,
    reportDir: null,
  };

  // ----------------------------------------------------------- retrait (--revoke)
  if (opts.revoke) {
    if (uid && record) {
      summary.superAdmin = false;
      summary.sessionsRevoked = true;
      if (memberships.length === 0) summary.disabled = true;
      if (opts.apply) {
        const { superAdmin: _removed, ...others } = record.customClaims || {};
        await auth.setCustomUserClaims(uid, others);
        if (memberships.length === 0) await auth.updateUser(uid, { disabled: true });
        await auth.revokeRefreshTokens(uid);
      }
    }
    writeReport(opts, now, summary, null);
    return { summary, credential: null };
  }

  // ------------------------------------------------------- création ou relance
  if (memberships.length && !opts.allowExistingMember) {
    throw new Error(`MEMBER_ACCOUNT ${username} : le compte appartient à ${memberships.length} école(s) ; un super-admin n'a pas d'appartenance (D25). Relancer avec --allow-existing-member pour le promouvoir quand même. Rien n'a été modifié.`);
  }
  summary.superAdmin = true;
  summary.disabled = false;
  if (uid) {
    summary.reset = true;
    summary.sessionsRevoked = true;
  } else {
    summary.created = true;
  }
  if (!opts.apply) {
    writeReport(opts, now, summary, null);
    return { summary, credential: null };
  }

  const password = generateTemporaryPassword(SUPER_ADMIN_PASSWORD_GROUPS);
  let targetUid: string;
  if (uid && record) {
    targetUid = uid;
    await auth.updateUser(uid, { password, disabled: false, ...(opts.fullName ? { displayName: opts.fullName } : {}) });
    await auth.revokeRefreshTokens(uid);
    await auth.setCustomUserClaims(uid, { ...(record.customClaims || {}), superAdmin: true });
    const userRef = db.collection("users").doc(uid);
    const profile = (await userRef.get()).data();
    await userRef.set({
      username,
      ...(opts.fullName ? { displayName: opts.fullName } : profile?.displayName ? {} : { displayName: record.displayName || username }),
      ...(Array.isArray(profile?.schoolIds) ? {} : { schoolIds: [], lastSchoolId: null }),
      mustChangePassword: true,
      passwordResetAt: nowIso,
      passwordResetBy: SOURCE,
    }, { merge: true });
  } else {
    // Création : même forme que createSchoolUser (Auth, puis registre et profil en transaction).
    const fullName = opts.fullName ?? DEFAULT_FULL_NAME;
    const email = usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN);
    const created = await auth.createUser({ email, password, displayName: fullName });
    targetUid = created.uid;
    try {
      await auth.setCustomUserClaims(created.uid, { superAdmin: true });
      await db.runTransaction(async (tx) => {
        const regRef = db.collection("usernames").doc(username);
        if ((await tx.get(regRef)).exists) throw new Error(`ACCOUNT_CONFLICT ${username} : identifiant enregistré pendant l'exécution.`);
        tx.set(regRef, { uid: created.uid, email, createdAt: nowIso, source: SOURCE });
        tx.set(db.collection("users").doc(created.uid), {
          username, displayName: fullName, schoolIds: [], lastSchoolId: null,
          mustChangePassword: true, createdAt: nowIso, createdBy: SOURCE,
        });
      });
    } catch (error) {
      await auth.deleteUser(created.uid).catch(() => undefined); // pas de compte Auth orphelin
      throw error;
    }
  }

  // Contrôle après écriture : claim présent, compte actif, appartenances inchangées.
  const after = await auth.getUser(targetUid);
  const membershipsAfter = await schoolMembershipsOf(db, targetUid);
  if (after.customClaims?.superAdmin !== true || after.disabled || membershipsAfter.length !== memberships.length) {
    throw new Error(`CHECK_FAILED claim ${after.customClaims?.superAdmin === true}, désactivé ${after.disabled}, écoles ${membershipsAfter.length}.`);
  }
  const credential = { username, password };
  writeReport(opts, now, summary, credential);
  return { summary, credential };
}

async function main() {
  const args = parseDevSuperAdminArgs(process.argv.slice(2));
  const what = args.revoke ? `RETRAIT du claim superAdmin de ${args.username}` : `compte super-admin ${args.username}`;
  console.log(`[dev-super-admin] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} : ${what} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, "dev-super-admin");
  try {
    // La sortie ne contient jamais le mot de passe (credential n'est pas affiché).
    const { summary } = await runDevSuperAdmin(admin.db, admin.auth, {
      username: args.username,
      fullName: args.fullName,
      apply: args.apply,
      revoke: args.revoke,
      allowExistingMember: args.allowExistingMember,
      outDir: args.outDir,
    });
    console.log(JSON.stringify(summary, null, 2));
    if (summary.schoolMemberships > 0) console.log(`[dev-super-admin] ATTENTION : compte membre de ${summary.schoolMemberships} école(s).`);
    if (summary.passwordsFile) console.log("[dev-super-admin] Mot de passe : fichier SECRET mots-de-passe-temporaires.csv du dossier du rapport (ne pas commiter, supprimer après usage).");
    if (!args.apply) console.log("[dev-super-admin] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[dev-super-admin] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
