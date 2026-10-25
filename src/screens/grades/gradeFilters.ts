/**
 * Attestations d'examen : tri et filtres (module pur, D83).
 *
 * - Tri du plus récent au plus ancien (`examDate`, ISO « AAAA-MM-JJ ») ; à date
 *   égale, la saisie la plus récente (plus loin dans la liste) d'abord.
 * - Filtres : texte (nom de l'élève, partie examinée — le modèle n'a pas de
 *   « type d'examen » distinct, `testedPortion` en tient lieu —, remarque),
 *   halaqa ACTUELLE de l'élève, mention (`overallGrade`), période (saison
 *   scolaire ou mois).
 * - Saison : même règle que les paramètres d'une nouvelle école
 *   (`defaultSchoolSettings`) : à partir d'août, saison « A/A+1 ».
 */
import type { Grade, Student } from "../../types";
import { MONTHS_AR } from "../../school/businessRules";
import { foldForSearch } from "../../ui/textSearch";

export const ALL = "all";

export interface GradeFilters {
  query: string;
  classId: string;
  overall: string;
  /** `all`, `season:2025` (saison 2025/2026) ou `month:2026-10`. */
  period: string;
}

export const EMPTY_GRADE_FILTERS: GradeFilters = { query: "", classId: ALL, overall: ALL, period: ALL };

export const OVERALL_GRADES = ["ممتاز", "جيد جداً", "جيد", "مقبول"] as const;

const ISO = /^(\d{4})-(\d{2})(?:-(\d{2}))?/;

/** Année de début de la saison scolaire d'une date ISO (août → nouvelle saison), ou null. */
export function seasonStartYear(isoDate: string | undefined | null): number | null {
  const m = ISO.exec(isoDate || "");
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!(month >= 1 && month <= 12)) return null;
  return month >= 8 ? year : year - 1;
}

/** « AAAA-MM » d'une date ISO, ou null. */
export function monthKey(isoDate: string | undefined | null): string | null {
  const m = ISO.exec(isoDate || "");
  if (!m || !(Number(m[2]) >= 1 && Number(m[2]) <= 12)) return null;
  return `${m[1]}-${m[2]}`;
}

/** Du plus récent au plus ancien ; dates absentes ou invalides en dernier. Ne modifie pas la liste reçue. */
export function sortGradesRecentFirst<T extends Pick<Grade, "examDate">>(grades: readonly T[]): T[] {
  return grades
    .map((g, i) => ({ g, i, d: ISO.test(g.examDate || "") ? g.examDate : "" }))
    .sort((a, b) => (a.d === b.d ? b.i - a.i : a.d < b.d ? 1 : -1))
    .map((x) => x.g);
}

export interface PeriodOption {
  value: string;
  label: string;
}

/** Périodes présentes dans les résultats : saisons puis mois, du plus récent au plus ancien. */
export function periodOptions(grades: readonly Pick<Grade, "examDate">[]): PeriodOption[] {
  const seasons = new Set<number>();
  const months = new Set<string>();
  for (const g of grades) {
    const s = seasonStartYear(g.examDate);
    const m = monthKey(g.examDate);
    if (s !== null) seasons.add(s);
    if (m) months.add(m);
  }
  const out: PeriodOption[] = [...seasons].sort((a, b) => b - a).map((y) => ({ value: `season:${y}`, label: `الموسم الدراسي ${y}/${y + 1}` }));
  for (const m of [...months].sort().reverse()) {
    const [y, mm] = m.split("-");
    out.push({ value: `month:${m}`, label: `${MONTHS_AR[Number(mm) - 1]} ${y}` });
  }
  return out;
}

export function matchesPeriod(examDate: string, period: string): boolean {
  if (!period || period === ALL) return true;
  if (period.startsWith("season:")) return seasonStartYear(examDate) === Number(period.slice(7));
  if (period.startsWith("month:")) return monthKey(examDate) === period.slice(6);
  return true;
}

export function isFiltered(f: GradeFilters): boolean {
  return f.query.trim() !== "" || f.classId !== ALL || f.overall !== ALL || f.period !== ALL;
}

/** Applique les filtres puis trie du plus récent au plus ancien. */
export function filterGrades<T extends Grade>(grades: readonly T[], students: readonly Pick<Student, "id" | "fullName" | "classId">[], f: GradeFilters): T[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  const q = foldForSearch(f.query);
  const kept = grades.filter((g) => {
    const st = byId.get(g.studentId);
    if (f.classId !== ALL && st?.classId !== f.classId) return false;
    if (f.overall !== ALL && g.overallGrade !== f.overall) return false;
    if (!matchesPeriod(g.examDate, f.period)) return false;
    if (q) {
      const hay = [st?.fullName, g.testedPortion, g.notes].map((x) => foldForSearch(String(x || "")));
      if (!hay.some((h) => h.includes(q))) return false;
    }
    return true;
  });
  return sortGradesRecentFirst(kept);
}
