/**
 * Import d'élèves depuis un fichier CSV dans une école (Admin SDK).
 * Runbook : docs/runbooks/NOUVELLE-ECOLE.md (§5). Décision : D73.
 *
 * Garde-fous (scripts/admin/lib/cli.ts) :
 * - `--project` obligatoire ; simulation (`--dry-run`) PAR DÉFAUT, `--apply` pour écrire ;
 * - un vrai projet exige `--database` et `--confirm-prod=<projectId>` ;
 * - l'école (`--school`) et ses paramètres doivent exister ;
 * - écritures par `create` uniquement : aucun document existant n'est jamais modifié ;
 * - toute anomalie BLOQUANTE (ligne invalide, halaqa inconnue, doublon) arrête
 *   l'application tant qu'elle n'est pas corrigée dans le fichier
 *   (`--skip-invalid` pour importer seulement les lignes valides) ;
 * - relance idempotente : un élève déjà présent (même nom complet et même date
 *   de naissance) est ignoré, jamais recréé.
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/admin/import-students.ts --project=demo-quran-school --school=annour --file=eleves.csv"
 *
 * Colonnes (en-tête obligatoire, séparateur « , » ou « ; », UTF-8) :
 *   fullName*, gender* (ذكر/أنثى), birthDate (AAAA-MM-JJ), parentName, parentPhone,
 *   parentEmail, registrationDate (AAAA-MM-JJ, défaut : aujourd'hui), className
 *   (nom EXACT d'une halaqa existante) ou classId, hizbCount (0-60),
 *   currentSurah, tajweedLevel (ممتاز/متوسط/ضعيف), notes.
 * Modèle : scripts/admin/templates/eleves-modele.csv (données fictives).
 *
 * Rapport : <out>/import-<école>-<horodatage>/rapport.csv (numéros de ligne,
 * identifiants attribués, codes d'anomalie ; AUCUN nom ni téléphone) et
 * resume.json. Ne pas commiter (scripts/**\/out/ est ignoré par git).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs, timestamp } from "./lib/cli";
import { toCsv } from "./lib/csv";
import { getMonthsToGenerate, getSubscriptionAmount } from "../../src/school/businessRules";

export const MAX_ROWS = 2000;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

export const KNOWN_COLUMNS = [
  "fullName", "gender", "birthDate", "parentName", "parentPhone", "parentEmail", "registrationDate",
  "className", "classId", "hizbCount", "currentSurah", "tajweedLevel", "notes",
] as const;
type Column = (typeof KNOWN_COLUMNS)[number];

const GENDERS: Record<string, "ذكر" | "أنثى"> = { "ذكر": "ذكر", "أنثى": "أنثى", "انثى": "أنثى", m: "ذكر", f: "أنثى", h: "ذكر" };
const TAJWEED = ["ممتاز", "متوسط", "ضعيف"];
const MAX_LEN: Partial<Record<Column, number>> = { fullName: 120, parentName: 120, parentPhone: 30, parentEmail: 120, currentSurah: 60, notes: 1000, className: 120, classId: 128 };

export type PaymentsMode = "none" | "ui";

export interface ImportOptions {
  schoolId: string;
  csv: string;
  apply: boolean;
  /** Importer les lignes valides même si d'autres sont en anomalie. */
  skipInvalid?: boolean;
  /** "ui" : créer les cotisations « غير مدفوع » comme l'interface (depuis la date d'inscription). */
  payments?: PaymentsMode;
  now?: Date;
  outDir?: string | null;
  log?: (m: string) => void;
}

export interface ImportRow {
  line: number;
  status: "à créer" | "créé" | "déjà présent" | "rejeté";
  studentId: string;
  codes: string;
}

export interface ImportSummary {
  mode: "simulation" | "application";
  schoolId: string;
  rows: number;
  valid: number;
  rejected: number;
  alreadyPresent: number;
  created: number;
  paymentsCreated: number;
  blocked: boolean;
  reportDir: string | null;
}

/** Analyse CSV (RFC 4180) : guillemets, retours à la ligne dans un champ, BOM, séparateur « , » ou « ; ». */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (quoted) throw new Error("CSV invalide : guillemet non fermé.");
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

/** Date AAAA-MM-JJ réelle (le 30 février est refusé, pas reporté au 2 mars). */
const isDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
// Caractères de contrôle (hors tabulation) : refusés.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export const studentKey = (fullName: string, birthDate: string) => `${fullName.replace(/\s+/g, " ").trim()}|${birthDate || ""}`;

/** Prochain identifiant S-<n>, même règle que l'interface (S-101 au minimum). */
export function nextStudentNumber(existingIds: Iterable<string>): number {
  let max = 0;
  for (const id of existingIds) {
    const m = id.toLowerCase().match(/^(s[-_]?)(\d+)$/);
    if (m) {
      const n = parseInt(m[2], 10);
      if (n < 1_000_000_000 && n > max) max = n;
    }
  }
  return Math.max(max + 1, 101);
}

interface Parsed {
  line: number;
  codes: string[];
  data: Record<Column, string>;
}

/** Valide les lignes ; renvoie les lignes et les colonnes inconnues. */
export function validateRows(table: string[][], classes: { id: string; name: string; isArchived?: boolean }[]): { rows: Parsed[]; unknownColumns: string[] } {
  if (table.length === 0) throw new Error("Fichier vide.");
  const header = table[0].map((h) => h.trim());
  if (header.some((h) => /password|motdepasse|كلمة/i.test(h))) throw new Error("Colonne de mot de passe interdite : aucun mot de passe ne s'importe.");
  if (!header.includes("fullName") || !header.includes("gender")) throw new Error("En-tête : colonnes fullName et gender obligatoires (voir le modèle).");
  const unknownColumns = header.filter((h) => !(KNOWN_COLUMNS as readonly string[]).includes(h));
  if (table.length - 1 > MAX_ROWS) throw new Error(`Plus de ${MAX_ROWS} lignes : découper le fichier.`);
  const byName = new Map<string, { id: string; name: string; isArchived?: boolean }[]>();
  for (const c of classes) byName.set(c.name.trim(), [...(byName.get(c.name.trim()) || []), c]);
  const classIds = new Set(classes.map((c) => c.id));

  const rows: Parsed[] = [];
  const seen = new Map<string, number>();
  for (let r = 1; r < table.length; r++) {
    const codes: string[] = [];
    const data = Object.fromEntries(KNOWN_COLUMNS.map((k) => [k, ""])) as Record<Column, string>;
    header.forEach((h, i) => {
      if ((KNOWN_COLUMNS as readonly string[]).includes(h)) data[h as Column] = (table[r][i] ?? "").trim();
    });
    for (const k of KNOWN_COLUMNS) {
      const max = MAX_LEN[k];
      if (max && data[k].length > max) codes.push(`TROP_LONG:${k}`);
      if (CONTROL.test(data[k])) codes.push(`CARACTERE_INTERDIT:${k}`);
    }
    data.fullName = data.fullName.replace(/\s+/g, " ");
    if (!data.fullName) codes.push("NOM_MANQUANT");
    const gender = GENDERS[data.gender.toLowerCase()];
    if (!gender) codes.push("GENRE_INVALIDE");
    else data.gender = gender;
    if (data.birthDate && !isDate(data.birthDate)) codes.push("DATE_NAISSANCE_INVALIDE");
    if (data.registrationDate && !isDate(data.registrationDate)) codes.push("DATE_INSCRIPTION_INVALIDE");
    if (data.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail)) codes.push("EMAIL_INVALIDE");
    if (data.parentPhone && !/^[0-9+ ().-]{6,30}$/.test(data.parentPhone)) codes.push("TELEPHONE_INVALIDE");
    if (data.hizbCount) {
      const n = Number(data.hizbCount);
      if (!Number.isInteger(n) || n < 0 || n > 60) codes.push("HIZB_INVALIDE");
    }
    if (data.tajweedLevel && !TAJWEED.includes(data.tajweedLevel)) codes.push("TAJWID_INVALIDE");
    // Halaqa : identifiant existant, ou nom EXACT et unique (jamais de correspondance approximative).
    if (data.classId) {
      if (!classIds.has(data.classId)) codes.push("HALAQA_INCONNUE");
    } else if (data.className) {
      const matches = byName.get(data.className) || [];
      if (matches.length === 1) data.classId = matches[0].id;
      else codes.push(matches.length === 0 ? "HALAQA_INCONNUE" : "HALAQA_AMBIGUE");
    }
    if (data.fullName) {
      const key = studentKey(data.fullName, data.birthDate);
      if (seen.has(key)) codes.push(`DOUBLON_FICHIER:ligne_${seen.get(key)}`);
      else seen.set(key, r + 1);
    }
    rows.push({ line: r + 1, codes, data });
  }
  return { rows, unknownColumns };
}

export async function runStudentImport(db: Firestore, opts: ImportOptions): Promise<{ summary: ImportSummary; report: ImportRow[] }> {
  const log = opts.log ?? (() => undefined);
  const s = opts.schoolId;
  const now = opts.now ?? new Date();
  const school = db.collection("schools").doc(s);
  if (!(await school.get()).exists) throw new Error(`École inconnue : ${s} (la créer d'abord : createSchool).`);
  const settings = (await school.collection("settings").doc("system").get()).data();
  if (!settings) throw new Error(`Paramètres absents : schools/${s}/settings/system.`);

  const classes = (await school.collection("classes").get()).docs.map((d) => ({ id: d.id, name: String(d.data().name || ""), isArchived: d.data().isArchived }));
  const existing = (await school.collection("students").get()).docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; fullName?: string; birthDate?: string }));
  const existingKeys = new Set(existing.map((e) => studentKey(String(e.fullName || ""), String(e.birthDate || ""))));

  const { rows, unknownColumns } = validateRows(parseCsv(opts.csv), classes);
  if (unknownColumns.length) log(`[import] colonnes ignorées : ${unknownColumns.join(", ")}`);

  let next = nextStudentNumber(existing.map((e) => e.id));
  const report: ImportRow[] = [];
  const toCreate: { row: Parsed; id: string }[] = [];
  for (const row of rows) {
    if (row.codes.length) { report.push({ line: row.line, status: "rejeté", studentId: "", codes: row.codes.join(" ") }); continue; }
    if (existingKeys.has(studentKey(row.data.fullName, row.data.birthDate))) {
      report.push({ line: row.line, status: "déjà présent", studentId: "", codes: "DEJA_PRESENT" });
      continue;
    }
    const id = `S-${next++}`;
    toCreate.push({ row, id });
    report.push({ line: row.line, status: "à créer", studentId: id, codes: "" });
  }
  const rejected = report.filter((r) => r.status === "rejeté").length;
  const blocked = rejected > 0 && !opts.skipInvalid;

  let created = 0;
  let paymentsCreated = 0;
  const today = now.toISOString().slice(0, 10);
  const batchId = `import-${timestamp(now)}`;
  if (opts.apply && !blocked && toCreate.length) {
    let batch = db.batch();
    let ops = 0;
    const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };
    for (const { row, id } of toCreate) {
      const d = row.data;
      const registrationDate = d.registrationDate || today;
      batch.create(school.collection("students").doc(id), {
        id, schoolId: s, fullName: d.fullName,
        photo: "", photoUrl: "", photoURL: "", avatar: "",
        birthDate: d.birthDate, gender: d.gender, registrationDate,
        parentName: d.parentName, parentPhone: d.parentPhone, parentEmail: d.parentEmail,
        docParentId: false, docBirthCert: false, docPhotos: false,
        hizbCount: d.hizbCount ? Number(d.hizbCount) : 0,
        currentSurah: d.currentSurah || "سورة النبأ",
        tajweedLevel: d.tajweedLevel || "متوسط",
        notes: d.notes, classId: d.classId, isArchived: false,
        importedAt: now.toISOString(), importBatch: batchId,
      });
      ops++;
      if (opts.payments === "ui") {
        getMonthsToGenerate(settings, registrationDate, now).forEach((m, idx) => {
          batch.create(school.collection("payments").doc(`p_new_${id}_${idx}`), {
            id: `p_new_${id}_${idx}`, schoolId: s, studentId: id, year: m.year, month: m.month,
            amount: getSubscriptionAmount(settings, m.month, m.year), paymentDate: "", status: "غير مدفوع",
          });
          ops++;
          paymentsCreated++;
        });
      }
      if (ops >= 400) await flush();
      created++;
      report.find((r) => r.studentId === id)!.status = "créé";
    }
    await flush();
  }

  let reportDir: string | null = null;
  if (opts.outDir) {
    reportDir = join(opts.outDir, `import-${s}-${timestamp(now)}`);
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(join(reportDir, "rapport.csv"), toCsv(report as unknown as Record<string, unknown>[], ["line", "status", "studentId", "codes"]));
  }
  const summary: ImportSummary = {
    mode: opts.apply ? "application" : "simulation",
    schoolId: s,
    rows: rows.length,
    valid: rows.length - rejected,
    rejected,
    alreadyPresent: report.filter((r) => r.status === "déjà présent").length,
    created,
    paymentsCreated,
    blocked,
    reportDir,
  };
  if (reportDir) writeFileSync(join(reportDir, "resume.json"), JSON.stringify(summary, null, 2));
  log(`[import] ${rows.length} lignes : ${summary.valid} valides, ${rejected} rejetées, ${summary.alreadyPresent} déjà présentes, ${created} créées.`);
  return { summary, report };
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2), process.env, "scripts/admin/out");
  const school = args.flags.get("school");
  const file = args.flags.get("file");
  if (typeof school !== "string" || !school) throw new Error("--school=<id> est obligatoire.");
  if (typeof file !== "string" || !file) throw new Error("--file=<chemin du CSV> est obligatoire.");
  const payments = args.flags.get("payments") ?? "none";
  if (payments !== "none" && payments !== "ui") throw new Error("--payments=none|ui");
  const buf = readFileSync(file);
  if (buf.length > MAX_FILE_BYTES) throw new Error("Fichier trop gros (2 Mo au plus).");
  console.log(`[import] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} → schools/${school}/students — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator);
  try {
    const { summary } = await runStudentImport(admin.db, {
      schoolId: school, csv: buf.toString("utf8"), apply: args.apply,
      skipInvalid: args.flags.has("skip-invalid"), payments, outDir: args.outDir,
      log: (m) => console.log(m),
    });
    console.log(JSON.stringify(summary, null, 2));
    console.log("[import] Rapport (ne pas commiter) :", summary.reportDir);
    if (summary.blocked) {
      console.error("[import] Lignes en anomalie : rien n'a été écrit. Corriger le fichier (voir rapport.csv) ou relancer avec --skip-invalid.");
      process.exitCode = 2;
    } else if (!args.apply) {
      console.log("[import] Simulation terminée : aucune écriture. Relancer avec --apply pour importer.");
    }
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[import] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
