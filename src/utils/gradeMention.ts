/**
 * Mention (« التقدير الإجمالي ») proposée à partir des deux notes sur 20 (UI-11, D92).
 * Seuils sur la MOYENNE des deux notes : les mêmes que ceux des données de démo
 * (`scripts/dev/fixtures/school-fixtures.ts`) :
 *   >= 17 ممتاز · >= 15 جيد جداً · >= 12 جيد · sinon مقبول.
 * La mention reste modifiable par l'enseignant : c'est une proposition.
 */
import type { Grade } from "../types";

export type Mention = Grade["overallGrade"];

export const MENTIONS: readonly Mention[] = ["ممتاز", "جيد جداً", "جيد", "مقبول"];

export const MENTION_THRESHOLDS = { excellent: 17, veryGood: 15, good: 12 } as const;

/** Note valide : nombre entre 0 et 20 (une saisie vide n'est pas une note). */
export function parseGrade(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? n : null;
}

/** Mention proposée, ou `null` tant qu'une des deux notes manque ou est hors de 0-20. */
export function suggestMention(memorization: string | number | null | undefined, tajweed: string | number | null | undefined): Mention | null {
  const m = parseGrade(memorization);
  const t = parseGrade(tajweed);
  if (m === null || t === null) return null;
  const avg = (m + t) / 2;
  if (avg >= MENTION_THRESHOLDS.excellent) return "ممتاز";
  if (avg >= MENTION_THRESHOLDS.veryGood) return "جيد جداً";
  if (avg >= MENTION_THRESHOLDS.good) return "جيد";
  return "مقبول";
}
