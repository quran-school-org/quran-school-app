#!/usr/bin/env tsx
/**
 * Lot 0 — provisionnement des comptes Firebase Auth et des liens d'autorisation.
 *
 * Pour chaque document `appUsers` :
 *   1. crée le compte Firebase Auth manquant `{username}@alfajr.local` avec le
 *      mot de passe connu (complété par `_secure_fajr` s'il fait < 6 caractères),
 *      ou réaligne le mot de passe d'un compte Auth existant sur le mot de passe
 *      connu (les anciens clients ne mettaient pas Auth à jour) ;
 *   2. écrit `authLinks/{uid}` = { appUserId, role, isActive, linkedStudentIds, linkedTeacherId } ;
 *   3. retire le champ `password` du document et marque `mustChangePassword: true` ;
 *   4. calcule les liens explicites (parents → enfants, élève → dossier,
 *      personnel → fiche) et produit des rapports à faire valider par l'école.
 *
 * Mode `--dry-run` PAR DÉFAUT (aucune écriture ; lectures seules).
 *
 * Usage (émulateurs uniquement pour un agent) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/admin/lot0-provision-auth.ts --project=demo-quran-school [--apply]"
 *
 * Usage en production (PAR UN HUMAIN, voir docs/runbooks/LOT0-DEPLOIEMENT.md) :
 *   npx tsx scripts/admin/lot0-provision-auth.ts --project=<id> --database=<base> [--apply --confirm-prod=<id>]
 *
 * Options :
 *   --project=<id>          obligatoire
 *   --database=<id>         obligatoire hors émulateur
 *   --apply                 écrit réellement (sinon simulation)
 *   --confirm-prod=<id>     obligatoire pour écrire sur un vrai projet
 *   --accept-critical       passe outre les anomalies critiques (compte u1)
 *   --no-sync-passwords     ne réaligne pas le mot de passe des comptes Auth existants
 *   --out=<dossier>         dossier des rapports (défaut scripts/admin/out, ignoré par git)
 *
 * ATTENTION : les rapports contiennent des données personnelles (noms, téléphones).
 * Ils ne doivent jamais être commités ni partagés hors de l'école.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { Auth, UserRecord } from "firebase-admin/auth";

import { initAdmin, parseCommonArgs, timestamp } from "./lib/cli";
import { toCsv } from "./lib/csv";
import {
  computeParentLinks,
  computeStudentSelfLink,
  computeTeacherLink,
  type LinkIssue,
  type StudentLike,
  type TeacherLike,
} from "./lib/linking";
import { isValidUsername, normalizeAuthPassword, normalizeUsername, usernameToEmail } from "../../src/security/accounts";
import { generateUniqueUsername } from "../../src/utils/usernames";

const ROLES = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر"];
const FAMILY = ["طالب", "ولي أمر"];
const LEGACY_DEFAULT_PASSWORD = "123"; // valeur utilisée par l'ancien client quand le champ manquait

export interface Anomaly {
  severity: "critique" | "avertissement" | "info";
  code: string;
  appUserId: string;
  username: string;
  detail: string;
}

export interface PlannedAccount {
  appUserId: string;
  fullName: string;
  role: string;
  isActive: boolean;
  originalUsername: string;
  username: string;
  renamed: boolean;
  email: string;
  knownPassword: string | null; // null : mot de passe déjà retiré (provisionnement antérieur)
  passwordIsLegacyDefault: boolean;
  existingAuthUid: string | null;
  linkedStudentIds: string[];
  linkedTeacherId: string | null;
  linkIssues: LinkIssue[];
}

export interface ProvisionPlan {
  accounts: PlannedAccount[];
  anomalies: Anomaly[];
  critical: boolean;
}

interface RawUser {
  id: string;
  [key: string]: any;
}

/** Choix du compte qui garde un nom d'utilisateur partagé par plusieurs comptes. */
function duplicatePriority(u: RawUser): [number, number, string, string] {
  return [u.id === "u1" ? 0 : 1, u.isActive === false ? 1 : 0, String(u.lastLogin || ""), u.id];
}

function compareDuplicates(a: RawUser, b: RawUser): number {
  const pa = duplicatePriority(a);
  const pb = duplicatePriority(b);
  if (pa[0] !== pb[0]) return pa[0] - pb[0];
  if (pa[1] !== pb[1]) return pa[1] - pb[1];
  if (pa[2] !== pb[2]) return pa[2] > pb[2] ? -1 : 1; // connexion la plus récente d'abord
  return pa[3] < pb[3] ? -1 : 1;
}

/** Étape pure : audit, noms d'utilisateur, liens. Aucune E/S. */
export function computeProvisionPlan(users: RawUser[], students: StudentLike[], teachers: TeacherLike[]): ProvisionPlan {
  const anomalies: Anomaly[] = [];
  const add = (severity: Anomaly["severity"], code: string, u: RawUser, detail: string) =>
    anomalies.push({ severity, code, appUserId: u.id, username: String(u.username ?? ""), detail });

  // --- Audit du compte directeur principal
  const u1 = users.find((u) => u.id === "u1");
  if (!u1) {
    anomalies.push({ severity: "critique", code: "U1_MISSING", appUserId: "u1", username: "", detail: "compte directeur principal absent" });
  } else {
    if (u1.role !== "مدير") add("critique", "U1_NOT_DIRECTOR", u1, `le compte u1 a le rôle « ${u1.role} » (écrasement probable par un autre compte) : à corriger à la main`);
    if (normalizeUsername(u1.username) !== "admin_alfajr") add("avertissement", "U1_USERNAME_CHANGED", u1, `nom d'utilisateur de u1 : « ${u1.username} »`);
    if (u1.isActive === false) add("critique", "U1_INACTIVE", u1, "le compte directeur principal est désactivé");
  }

  // --- Noms d'utilisateur : validité et unicité globale
  const sorted = [...users].sort(compareDuplicates);
  const taken = new Set<string>();
  const finalUsername = new Map<string, { username: string; renamed: boolean }>();
  for (const u of sorted) {
    const original = normalizeUsername(String(u.username ?? ""));
    let username = original;
    let renamed = false;
    if (!username || !isValidUsername(username)) {
      add("avertissement", !username ? "EMPTY_USERNAME" : "INVALID_USERNAME", u, `nom d'utilisateur « ${u.username ?? ""} » inutilisable comme identifiant de connexion`);
      username = generateUniqueUsername(String(u.fullName || "user"), Array.from(taken));
      if (!isValidUsername(username)) username = generateUniqueUsername("user", Array.from(taken));
      renamed = true;
    }
    if (taken.has(username)) {
      add("avertissement", "DUPLICATE_USERNAME", u, `nom d'utilisateur « ${username} » déjà attribué à un autre compte`);
      const base = username;
      let n = 2;
      while (taken.has(`${base}_${n}`)) n++;
      username = `${base}_${n}`;
      renamed = true;
    }
    taken.add(username);
    finalUsername.set(u.id, { username, renamed });
    if (renamed) add("avertissement", "USERNAME_RENAMED", u, `nouvel identifiant de connexion : ${username} (à communiquer à la personne)`);
  }

  // --- Rôles, liens, mots de passe
  const accounts: PlannedAccount[] = [];
  const studentToParents = new Map<string, string[]>();
  for (const u of users) {
    const role = String(u.role ?? "");
    if (!ROLES.includes(role)) add("critique", "UNKNOWN_ROLE", u, `rôle inconnu « ${role} »`);
    if (u.id.startsWith("t_") && FAMILY.includes(role)) add("avertissement", "ROLE_PREFIX_MISMATCH", u, `compte du personnel avec le rôle « ${role} »`);
    if (u.id.startsWith("p_") && role !== "ولي أمر") add("avertissement", "ROLE_PREFIX_MISMATCH", u, `compte parent avec le rôle « ${role} »`);
    if (u.id.startsWith("s_") && role !== "طالب") add("avertissement", "ROLE_PREFIX_MISMATCH", u, `compte élève avec le rôle « ${role} »`);

    let linkedStudentIds: string[] = [];
    let linkedTeacherId: string | null = null;
    let linkIssues: LinkIssue[] = [];
    const accountLike = { id: u.id, role, fullName: u.fullName, phone: u.phone };
    if (role === "ولي أمر") {
      const r = computeParentLinks(accountLike, students);
      linkedStudentIds = r.studentIds;
      linkIssues = r.issues;
    } else if (role === "طالب") {
      const r = computeStudentSelfLink(accountLike, students);
      linkedStudentIds = r.studentIds;
      linkIssues = r.issues;
    } else {
      const r = computeTeacherLink(accountLike, teachers);
      linkedTeacherId = r.teacherId;
      linkIssues = r.issues;
    }
    if (Array.isArray(u.linkedStudentIds) && u.linkedStudentIds.length > 0) {
      linkedStudentIds = Array.from(new Set([...u.linkedStudentIds, ...linkedStudentIds]));
    }
    if (typeof u.linkedTeacherId === "string" && u.linkedTeacherId) linkedTeacherId = u.linkedTeacherId;
    if (linkedStudentIds.length > 30) {
      linkIssues.push({ code: "TOO_MANY_STUDENTS", detail: `${linkedStudentIds.length} élèves liés (30 maximum) : liste tronquée` });
      linkedStudentIds = linkedStudentIds.slice(0, 30);
    }
    if (role === "ولي أمر") {
      for (const sid of linkedStudentIds) studentToParents.set(sid, [...(studentToParents.get(sid) || []), u.id]);
    }

    const hasPassword = typeof u.password === "string" && u.password.length > 0;
    const alreadyProvisioned = typeof u.authUid === "string" && u.authUid.length > 0;
    if (!hasPassword && !alreadyProvisioned) add("avertissement", "NO_PASSWORD", u, `aucun mot de passe enregistré : l'ancien mot de passe par défaut « ${LEGACY_DEFAULT_PASSWORD} » sera utilisé`);
    if (hasPassword && String(u.password).length < 6) add("info", "SHORT_PASSWORD", u, "mot de passe court (complété par _secure_fajr dans Firebase Auth)");

    const fu = finalUsername.get(u.id)!;
    accounts.push({
      appUserId: u.id,
      fullName: String(u.fullName ?? ""),
      role,
      isActive: u.isActive !== false,
      originalUsername: String(u.username ?? ""),
      username: fu.username,
      renamed: fu.renamed,
      email: usernameToEmail(fu.username),
      knownPassword: hasPassword ? String(u.password) : alreadyProvisioned ? null : LEGACY_DEFAULT_PASSWORD,
      passwordIsLegacyDefault: !hasPassword && !alreadyProvisioned,
      existingAuthUid: alreadyProvisioned ? u.authUid : null,
      linkedStudentIds,
      linkedTeacherId,
      linkIssues,
    });
  }

  for (const [sid, parents] of studentToParents) {
    if (parents.length > 1) {
      for (const pid of parents) {
        const acc = accounts.find((a) => a.appUserId === pid)!;
        acc.linkIssues.push({ code: "STUDENT_IN_SEVERAL_PARENT_ACCOUNTS", studentId: sid, detail: `élève rattaché à ${parents.length} comptes parents (${parents.join(", ")})` });
      }
    }
  }

  return { accounts, anomalies, critical: anomalies.some((a) => a.severity === "critique") };
}

export interface ProvisionOptions {
  apply: boolean;
  syncExistingPasswords: boolean;
  acceptCritical: boolean;
  outDir: string | null;
  log?: (msg: string) => void;
  now?: Date;
}

export interface ProvisionSummary {
  mode: "simulation" | "application";
  appUsers: number;
  authCreated: number;
  authExisting: number;
  authPasswordSynced: number;
  authEmailUpdated: number;
  linksWritten: number;
  passwordsRemoved: number;
  mustChangePasswordSet: number;
  renamedUsernames: number;
  linksToReview: number;
  anomalies: Record<string, number>;
  critical: boolean;
  reportDir: string | null;
}

async function findAuthUser(auth: Auth, acc: PlannedAccount): Promise<UserRecord | null> {
  if (acc.existingAuthUid) {
    try {
      return await auth.getUser(acc.existingAuthUid);
    } catch (e: any) {
      if (e?.code !== "auth/user-not-found") throw e;
    }
  }
  try {
    return await auth.getUserByEmail(acc.email);
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") return null;
    throw e;
  }
}

/** Exécute le provisionnement (simulation par défaut). */
export async function runLot0Provision(db: Firestore, auth: Auth, opts: ProvisionOptions): Promise<{ summary: ProvisionSummary; plan: ProvisionPlan }> {
  const log = opts.log ?? (() => undefined);
  const [usersSnap, studentsSnap, teachersSnap] = await Promise.all([
    db.collection("appUsers").get(),
    db.collection("students").get(),
    db.collection("teachers").get(),
  ]);
  const users: RawUser[] = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const students: StudentLike[] = studentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const teachers: TeacherLike[] = teachersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const plan = computeProvisionPlan(users, students, teachers);

  const summary: ProvisionSummary = {
    mode: opts.apply ? "application" : "simulation",
    appUsers: users.length,
    authCreated: 0,
    authExisting: 0,
    authPasswordSynced: 0,
    authEmailUpdated: 0,
    linksWritten: 0,
    passwordsRemoved: 0,
    mustChangePasswordSet: 0,
    renamedUsernames: plan.accounts.filter((a) => a.renamed).length,
    linksToReview: plan.accounts.reduce((n, a) => n + a.linkIssues.length, 0),
    anomalies: plan.anomalies.reduce<Record<string, number>>((m, a) => ({ ...m, [a.code]: (m[a.code] || 0) + 1 }), {}),
    critical: plan.critical,
    reportDir: null,
  };

  if (opts.apply && plan.critical && !opts.acceptCritical) {
    throw new Error("Anomalies critiques détectées (voir le rapport en simulation) : corrigez-les ou relancez avec --accept-critical.");
  }

  const nowIso = (opts.now ?? new Date()).toISOString();
  const results: Record<string, unknown>[] = [];
  for (const acc of plan.accounts) {
    const existing = await findAuthUser(auth, acc);
    let uid = existing?.uid ?? null;
    let action = existing ? "existant" : "à créer";
    const authPassword = acc.knownPassword !== null ? normalizeAuthPassword(acc.knownPassword) : null;

    if (existing) summary.authExisting++;
    if (opts.apply) {
      if (!existing) {
        if (authPassword === null) {
          action = "IMPOSSIBLE (aucun mot de passe connu)";
        } else {
          const created = await auth.createUser({ email: acc.email, password: authPassword, displayName: acc.fullName || undefined, disabled: !acc.isActive });
          uid = created.uid;
          summary.authCreated++;
          action = "créé";
        }
      } else {
        const update: Record<string, unknown> = { disabled: !acc.isActive };
        if (existing.email !== acc.email) {
          update.email = acc.email;
          summary.authEmailUpdated++;
        }
        if (authPassword !== null && opts.syncExistingPasswords) {
          update.password = authPassword;
          summary.authPasswordSynced++;
          action = "existant, mot de passe réaligné";
        }
        await auth.updateUser(existing.uid, update);
      }

      if (uid) {
        await db.collection("authLinks").doc(uid).set({
          appUserId: acc.appUserId,
          role: acc.role,
          isActive: acc.isActive,
          username: acc.username,
          linkedStudentIds: acc.linkedStudentIds,
          linkedTeacherId: acc.linkedTeacherId,
          updatedAt: nowIso,
          updatedBy: "lot0-provision-auth",
        }, { merge: true });
        summary.linksWritten++;

        const userUpdate: Record<string, unknown> = {
          authUid: uid,
          authEmail: acc.email,
          username: acc.username,
          linkedStudentIds: acc.linkedStudentIds,
          linkedTeacherId: acc.linkedTeacherId,
          provisionedAt: nowIso,
          password: FieldValue.delete(),
        };
        // Un mot de passe vient d'être (re)défini à partir d'une valeur exposée :
        // changement obligatoire. Sinon (relance), on ne réimpose rien.
        if (action === "créé" || action.includes("réaligné")) {
          userUpdate.mustChangePassword = true;
          summary.mustChangePasswordSet++;
        }
        if (acc.knownPassword !== null && !acc.passwordIsLegacyDefault) summary.passwordsRemoved++;
        await db.collection("appUsers").doc(acc.appUserId).set(userUpdate, { merge: true });
      }
    }

    results.push({
      appUserId: acc.appUserId,
      fullName: acc.fullName,
      role: acc.role,
      isActive: acc.isActive,
      ancienIdentifiant: acc.originalUsername,
      identifiant: acc.username,
      renomme: acc.renamed ? "oui" : "",
      email: acc.email,
      auth: action,
      uid: uid ?? "",
      elevesLies: acc.linkedStudentIds,
      ficheLiee: acc.linkedTeacherId ?? "",
    });
    log(`${acc.appUserId.padEnd(24)} ${acc.username.padEnd(28)} ${action}`);
  }

  if (opts.outDir) {
    const dir = join(opts.outDir, `lot0-${summary.mode}-${timestamp(opts.now)}`);
    mkdirSync(dir, { recursive: true });
    summary.reportDir = dir;
    writeFileSync(join(dir, "resume.json"), JSON.stringify(summary, null, 2));
    writeFileSync(join(dir, "comptes.csv"), toCsv(results));
    writeFileSync(join(dir, "anomalies.csv"), toCsv(plan.anomalies as unknown as Record<string, unknown>[], ["severity", "code", "appUserId", "username", "detail"]));
    const studentNames = new Map(students.map((s) => [s.id, s.fullName ?? ""]));
    const review = plan.accounts.flatMap((a) =>
      a.linkIssues.map((i) => ({
        appUserId: a.appUserId,
        compte: a.fullName,
        role: a.role,
        identifiant: a.username,
        code: i.code,
        eleveId: i.studentId ?? "",
        eleve: i.studentId ? studentNames.get(i.studentId) ?? "" : "",
        detail: i.detail,
        elevesLies: a.linkedStudentIds,
        decisionEcole: "",
      }))
    );
    writeFileSync(join(dir, "liens-a-valider.csv"), toCsv(review, ["appUserId", "compte", "role", "identifiant", "code", "eleveId", "eleve", "detail", "elevesLies", "decisionEcole"]));
    writeFileSync(join(dir, "identifiants-renommes.csv"), toCsv(plan.accounts.filter((a) => a.renamed).map((a) => ({ appUserId: a.appUserId, compte: a.fullName, ancien: a.originalUsername, nouveau: a.username }))));
  }
  return { summary, plan };
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));
  const target = args.emulator ? "ÉMULATEURS" : "PROJET RÉEL";
  console.log(`[lot0] ${target} ${args.projectId} / base ${args.databaseId} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator);
  try {
    const { summary } = await runLot0Provision(admin.db, admin.auth, {
      apply: args.apply,
      syncExistingPasswords: !args.flags.has("no-sync-passwords"),
      acceptCritical: args.flags.has("accept-critical"),
      outDir: args.outDir,
      log: (m) => console.log(m),
    });
    console.log(JSON.stringify(summary, null, 2));
    console.log("[lot0] Rapports (données personnelles, ne pas commiter) :", summary.reportDir);
    if (!args.apply) console.log("[lot0] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[lot0] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
