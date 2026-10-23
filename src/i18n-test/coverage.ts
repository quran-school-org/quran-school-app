/**
 * Couverture du dictionnaire de test FR (D79) : part des chaînes arabes de
 * l'interface (src/ et messages des Cloud Functions, hors src/print) qui ont
 * une traduction exacte ou un motif. Outil Node, jamais importé par l'application.
 *
 *   npx tsx src/i18n-test/coverage.ts            # résumé + chaînes manquantes
 *   npx tsx src/i18n-test/coverage.ts --json     # détail JSON
 *
 * Pour un gabarit `${…}`, la chaîne est couverte si un motif du dictionnaire
 * reconnaît le gabarit dont chaque {n} est remplacé par une valeur témoin.
 */
import { pathToFileURL } from "node:url";
import { KEEP_ARABIC, NOT_DISPLAYED } from "./exclusions";
import { extractArabicStrings, type ExtractedString } from "./extract";
import { FR } from "./fr";
import { createTranslator, normalize } from "./translate";

export interface CoverageReport {
  total: number;
  covered: number;
  kept: number;
  notDisplayed: number;
  ratio: number;
  missing: ExtractedString[];
}

/** Valeur témoin, sans arabe, pour éprouver un motif sur un gabarit. */
const SAMPLE = "X9";

export function computeCoverage(root = process.cwd()): CoverageReport {
  const t = createTranslator(FR);
  const unique = new Map<string, ExtractedString>();
  for (const e of extractArabicStrings(root)) if (!unique.has(e.text)) unique.set(e.text, e);
  const keep = new Set(Object.keys(KEEP_ARABIC).map(normalize));
  const skip = new Set(Object.keys(NOT_DISPLAYED).map(normalize));
  let covered = 0, kept = 0, notDisplayed = 0;
  const missing: ExtractedString[] = [];
  for (const e of unique.values()) {
    if (keep.has(e.text)) { kept++; continue; }
    if (skip.has(e.text)) { notDisplayed++; continue; }
    const probe = e.kind === "template" ? e.text.replace(/\{\d+\}/g, SAMPLE) : e.text;
    if (t.translate(probe) !== null || t.translate(e.text) !== null) covered++;
    else missing.push(e);
  }
  const total = unique.size - notDisplayed;
  return { total, covered, kept, notDisplayed, ratio: total ? (covered + kept) / total : 1, missing };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const r = computeCoverage();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Chaînes affichées : ${r.total} (hors ${r.notDisplayed} jamais affichées)`);
    console.log(`Traduites : ${r.covered} ; laissées en arabe volontairement : ${r.kept}`);
    console.log(`Couverture : ${(r.ratio * 100).toFixed(1)} %`);
    if (r.missing.length) {
      console.log(`\nManquantes (${r.missing.length}) :`);
      for (const m of r.missing) console.log(`  ${m.file}:${m.line}\t${m.text}`);
    }
  }
}
