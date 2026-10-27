#!/usr/bin/env tsx
/**
 * Remplacement des mots de passe des comptes qui ne se sont JAMAIS reconnectés
 * depuis le Lot 0 (D103).
 *
 * Le Lot 0 a créé les comptes Firebase Auth avec l'ancien mot de passe de
 * l'application (« 123 » stocké `123_secure_fajr`, ou un mot de passe choisi
 * par la personne, parfois faible), sans rotation (D53), et a posé
 * `users/{uid}.mustChangePassword = true`. Un compte qui l'a encore à `true`
 * n'a donc jamais changé son mot de passe : il garde l'ancien, devinable.
 * Avant l'ouverture du code, ces mots de passe sont remplacés par des mots de
 * passe temporaires aléatoires, remis par le directeur de chaque école.
 *
 * Comptes ciblés : tous les `users/{uid}` dont `mustChangePassword === true`
 * (ceux d'une seule école avec `--school=<id>`), SAUF, comptés à part :
 *   - claim `superAdmin` ;
 *   - compte Auth désactivé ;
 *   - compte réinitialisé depuis moins de 7 jours (`passwordResetAt`) : le
 *     directeur lui a déjà remis un mot de passe neuf, il n'est pas cassé ;
 *   - (comptés aussi) compte absent d'Auth, ou sans école.
 *
 * En `--apply`, pour chaque compte ciblé : mot de passe temporaire aléatoire
 * (`generateTemporaryPassword`), sessions révoquées (`revokeRefreshTokens`),
 * `mustChangePassword` reste `true`, `passwordResetAt` = maintenant et
 * `passwordResetBy` = "ops:rotate-stale-passwords". Ce dernier point rend la
 * relance sûre : un compte déjà traité est « réinitialisé récemment » et n'est
 * PAS recassé (les mots de passe déjà remis restent valables).
 *
 * Sorties (dossier <out>/rotate-stale-passwords-<horodatage>/) :
 *   - resume.json : nombres seulement, aucune donnée personnelle (nombres par
 *     école, comptes ignorés par raison) ;
 *   - mots-de-passe-temporaires.csv (SECRET, mode 600, application seulement) :
 *     ecole, identifiant, nomComplet, role, motDePasseTemporaire. Une ligne par
 *     école d'appartenance. Écrit au fur et à mesure (un arrêt en cours de route
 *     ne perd aucun mot de passe déjà changé). Jamais affiché ni journalisé.
 *
 * Une erreur sur un compte n'interrompt pas les autres : elle est comptée
 * (`failures`, code de sortie 2) ; relancer la même commande reprend les
 * comptes restants.
 *
 * Garde-fous : `--project` obligatoire, simulation par défaut ; sur un vrai
 * projet : `--database`, `--apply` avec `--confirm-prod=<projet>` (lib/cli.ts) ;
 * la PRODUCTION (projet lu dans `.env.production`) n'est servie que depuis le
 * workflow ops.yml (GITHUB_ACTIONS) : jamais depuis un poste ou un conteneur.
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/admin/rotate-stale-passwords.ts --project=demo-quran-school [--school=alfajr] [--apply]"
 * Prod et dev : uniquement par ops.yml (action rotate-stale-passwords, D103).
 */
import { appendFileSync, chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Auth, UserRecord } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, parseFlags, timestamp, type CommonArgs } from "./lib/cli";
import { toCsv } from "./lib/csv";
import { generateTemporaryPassword } from "./lib/passwords";
import { isProductionProject } from "./lib/prodProject";

export const SOURCE = "ops:rotate-stale-passwords";
/** Une réinitialisation plus récente que cela (jours) protège le compte. */
export const RECENT_RESET_DAYS = 7;
export const SCHOOL_ID_PATTERN = /^[a-z0-9-]{3,40}$/;
export const CSV_COLUMNS = ["ecole", "identifiant", "nomComplet", "role", "motDePasseTemporaire"];

const DAY_MS = 24 * 60 * 60 * 1000;
/** Tolérance d'horloge pour une date de réinitialisation « dans le futur ». */
const CLOCK_SKEW_MS = 60 * 60 * 1000;

export interface RotateStaleArgs extends CommonArgs {
  /** null : toutes les écoles. */
  schoolId: string | null;
}

const KNOWN_FLAGS = new Set(["project", "database", "apply", "dry-run", "confirm-prod", "out", "school"]);

/** La prod ne se sert que depuis ops.yml (le runner GitHub positionne GITHUB_ACTIONS). */
export function assertProductionOnlyFromOps(projectId: unknown, env: NodeJS.ProcessEnv): void {
  if (isProductionProject(projectId) && env.GITHUB_ACTIONS !== "true") {
    throw new Error("Projet de PRODUCTION hors du workflow ops.yml : refus (D103). La prod se traite uniquement par `gh workflow run ops.yml`.");
  }
}

export function parseRotateStaleArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): RotateStaleArgs {
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  assertProductionOnlyFromOps(project, env);
  for (const k of flags.keys()) if (!KNOWN_FLAGS.has(k)) throw new Error(`Option inconnue : --${k}`);
  let schoolId: string | null = null;
  if (flags.has("school")) {
    const s = flags.get("school");
    if (typeof s !== "string" || !SCHOOL_ID_PATTERN.test(s)) throw new Error(`--school invalide : attendu ${SCHOOL_ID_PATTERN.source}.`);
    schoolId = s;
  }
  const common = parseCommonArgs(argv, env);
  assertProductionOnlyFromOps(common.projectId, env);
  return { ...common, schoolId };
}

export interface RotateStaleOptions {
  /** null : toutes les écoles. */
  schoolId: string | null;
  apply: boolean;
  /** null : aucun fichier écrit (tests) ; sinon dossier parent du rapport. */
  outDir: string | null;
  now?: Date;
}

export interface IgnoredCounts {
  superAdmin: number;
  disabled: number;
  /** Compte absent de Firebase Auth. */
  authMissing: number;
  /** Aucune école (hors du filtre `--school`) : personne ne peut lui remettre un mot de passe. */
  noSchool: number;
  /** Autre école que celle de `--school`. */
  otherSchool: number;
}

export interface RotateStaleSummary {
  mode: "simulation" | "application";
  /** Filtre `--school` (identifiant d'école, pas une donnée personnelle) ; null : toutes. */
  school: string | null;
  /** Comptes dont `mustChangePassword === true`. */
  scanned: number;
  targeted: number;
  rotated: number;
  failures: number;
  /** Réinitialisés depuis moins de 7 jours : non recassés, comptés à part. */
  recentlyReset: number;
  ignored: IgnoredCounts;
  /** Par école d'appartenance (un compte de deux écoles compte dans chacune). */
  bySchool: Record<string, { targeted: number; rotated: number }>;
  passwordsFile: boolean;
  reportDir: string | null;
}

interface Candidate {
  uid: string;
  username: string;
  displayName: string;
  schoolIds: string[];
}

export function isRecentlyReset(value: unknown, now: Date): boolean {
  if (typeof value !== "string") return false;
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return false;
  const age = now.getTime() - at;
  return age > -CLOCK_SKEW_MS && age < RECENT_RESET_DAYS * DAY_MS;
}

/** Cellule de tableur : pas de formule (=, +, -, @) ni de caractère de contrôle en tête. */
function safeCell(value: string): string {
  const v = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return /^[=+\-@]/.test(v) ? `'${v}` : v;
}

async function authRecords(auth: Auth, uids: string[]): Promise<Map<string, UserRecord>> {
  const out = new Map<string, UserRecord>();
  for (let i = 0; i < uids.length; i += 100) {
    const res = await auth.getUsers(uids.slice(i, i + 100).map((uid) => ({ uid })));
    for (const u of res.users) out.set(u.uid, u);
  }
  return out;
}

export async function runRotateStalePasswords(db: Firestore, auth: Auth, opts: RotateStaleOptions): Promise<{ summary: RotateStaleSummary }> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const filter = opts.schoolId;
  const summary: RotateStaleSummary = {
    mode: opts.apply ? "application" : "simulation",
    school: filter,
    scanned: 0, targeted: 0, rotated: 0, failures: 0, recentlyReset: 0,
    ignored: { superAdmin: 0, disabled: 0, authMissing: 0, noSchool: 0, otherSchool: 0 },
    bySchool: {},
    passwordsFile: false,
    reportDir: null,
  };

  // ---- Inventaire (lectures seules) : tout est décidé AVANT la première écriture.
  const snap = await db.collection("users").where("mustChangePassword", "==", true).get();
  summary.scanned = snap.size;
  const records = await authRecords(auth, snap.docs.map((d) => d.id));
  const targets: Candidate[] = [];
  const reasonSchools = (ids: string[]) => ids.filter((s) => !filter || s === filter);
  for (const d of snap.docs) {
    const data = d.data();
    const schoolIds: string[] = Array.isArray(data.schoolIds) ? data.schoolIds.filter((s: unknown): s is string => typeof s === "string" && s !== "") : [];
    const record = records.get(d.id);
    if (!record) { summary.ignored.authMissing++; continue; }
    if (record.customClaims?.superAdmin === true) { summary.ignored.superAdmin++; continue; }
    if (record.disabled) { summary.ignored.disabled++; continue; }
    if (isRecentlyReset(data.passwordResetAt, now)) { summary.recentlyReset++; continue; }
    if (filter && !schoolIds.includes(filter)) {
      if (schoolIds.length === 0) summary.ignored.noSchool++; else summary.ignored.otherSchool++;
      continue;
    }
    if (schoolIds.length === 0) { summary.ignored.noSchool++; continue; }
    targets.push({
      uid: d.id,
      username: typeof data.username === "string" ? data.username : "",
      displayName: typeof data.displayName === "string" ? data.displayName : "",
      schoolIds,
    });
  }
  summary.targeted = targets.length;
  for (const t of targets) {
    for (const s of reasonSchools(t.schoolIds)) {
      summary.bySchool[s] ??= { targeted: 0, rotated: 0 };
      summary.bySchool[s].targeted++;
    }
  }

  // ---- Rapport.
  let dir: string | null = null;
  let csvPath: string | null = null;
  if (opts.outDir) {
    dir = join(opts.outDir, `rotate-stale-passwords-${timestamp(now)}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    summary.reportDir = dir;
  }
  const writeSummary = () => {
    if (dir) writeFileSync(join(dir, "resume.json"), JSON.stringify(summary, null, 2));
  };
  if (!opts.apply || targets.length === 0) {
    writeSummary();
    return { summary };
  }
  if (dir) {
    csvPath = join(dir, "mots-de-passe-temporaires.csv");
    writeFileSync(csvPath, toCsv([], CSV_COLUMNS), { mode: 0o600 });
    chmodSync(csvPath, 0o600);
    summary.passwordsFile = true;
  }

  // ---- Application, compte par compte.
  for (const t of targets) {
    try {
      const password = generateTemporaryPassword();
      await auth.updateUser(t.uid, { password });
      // Le mot de passe est changé : sa ligne est écrite AVANT toute autre étape.
      if (csvPath) {
        const rows: Record<string, string>[] = [];
        for (const s of reasonSchools(t.schoolIds)) {
          const member = (await db.collection("schools").doc(s).collection("members").doc(t.uid).get()).data();
          rows.push({
            ecole: s,
            identifiant: safeCell(t.username || String(member?.username ?? "")),
            nomComplet: safeCell(String(member?.fullName ?? t.displayName)),
            role: safeCell(String(member?.role ?? "")),
            motDePasseTemporaire: password,
          });
        }
        const csv = toCsv(rows, CSV_COLUMNS);
        appendFileSync(csvPath, csv.slice(csv.indexOf("\r\n") + 2));
      }
      await auth.revokeRefreshTokens(t.uid);
      await db.collection("users").doc(t.uid).set({ mustChangePassword: true, passwordResetAt: nowIso, passwordResetBy: SOURCE }, { merge: true });
      summary.rotated++;
      for (const s of reasonSchools(t.schoolIds)) summary.bySchool[s].rotated++;
    } catch {
      // Ni uid, ni nom, ni message d'erreur : compteur seulement (le détail passe par le journal d'Auth).
      summary.failures++;
    }
  }
  writeSummary();
  return { summary };
}

async function main() {
  const args = parseRotateStaleArgs(process.argv.slice(2));
  console.log(`[rotate-stale-passwords] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} : école ${args.schoolId ?? "toutes"} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, "rotate-stale-passwords");
  try {
    const { summary } = await runRotateStalePasswords(admin.db, admin.auth, { schoolId: args.schoolId, apply: args.apply, outDir: args.outDir });
    // Le résumé ne contient que des nombres et des identifiants d'école.
    console.log(JSON.stringify(summary, null, 2));
    if (summary.passwordsFile) console.log("[rotate-stale-passwords] Mots de passe : fichier SECRET mots-de-passe-temporaires.csv du dossier du rapport (ne pas commiter, supprimer après remise).");
    if (!args.apply) console.log("[rotate-stale-passwords] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
    if (summary.failures > 0) {
      console.error(`[rotate-stale-passwords] ${summary.failures} compte(s) en échec : relancer la même commande (seuls les comptes restants sont traités).`);
      process.exitCode = 2;
    }
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[rotate-stale-passwords] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
