/**
 * Attestations d'examen (D83) : tri du plus récent au plus ancien et filtres
 * (élève, halaqa, mention, période) — src/screens/grades/gradeFilters.ts.
 */
import { describe, expect, it } from "vitest";
import type { Grade } from "../../src/types";
import {
  EMPTY_GRADE_FILTERS, filterGrades, isFiltered, matchesPeriod, monthKey, periodOptions, seasonStartYear, sortGradesRecentFirst,
} from "../../src/screens/grades/gradeFilters";

const g = (id: string, studentId: string, examDate: string, overallGrade: Grade["overallGrade"], testedPortion = "الحزب 1"): Grade => ({
  id, studentId, examDate, overallGrade, testedPortion, memorizationGrade: 15, tajweedGrade: 14, examinerId: "t1",
});
const students = [
  { id: "s1", fullName: "ياسين العلمي", classId: "c1" },
  { id: "s2", fullName: "مريم العلمي", classId: "c1" },
  { id: "s3", fullName: "أيوب العلوي", classId: "c2" },
];
// Ordre de saisie : du plus ancien au plus récent (cas signalé par le propriétaire).
const grades = [
  g("g1", "s1", "2025-06-10", "جيد"),
  g("g2", "s2", "2025-09-02", "ممتاز", "سورة البقرة"),
  g("g3", "s3", "2026-01-15", "مقبول"),
  g("g4", "s1", "2026-10-01", "جيد جداً"),
  g("g5", "s3", "2026-10-01", "ممتاز"),
];
const ids = (xs: Grade[]) => xs.map((x) => x.id);

describe("attestations : tri", () => {
  it("du plus récent au plus ancien ; à date égale, la dernière saisie d'abord", () => {
    expect(ids(sortGradesRecentFirst(grades))).toEqual(["g5", "g4", "g3", "g2", "g1"]);
  });

  it("dates absentes ou invalides en dernier ; liste d'origine intacte", () => {
    const xs = [g("a", "s1", "", "جيد"), g("b", "s1", "2026-01-01", "جيد"), g("c", "s1", "n/a", "جيد")];
    expect(ids(sortGradesRecentFirst(xs))).toEqual(["b", "c", "a"]);
    expect(ids(xs)).toEqual(["a", "b", "c"]);
  });
});

describe("attestations : périodes", () => {
  it("saison scolaire : à partir d'août, saison A/A+1", () => {
    expect(seasonStartYear("2025-07-31")).toBe(2024);
    expect(seasonStartYear("2025-08-01")).toBe(2025);
    expect(seasonStartYear("2026-01-15")).toBe(2025);
    expect(seasonStartYear("")).toBeNull();
    expect(seasonStartYear("2026-13-01")).toBeNull();
    expect(monthKey("2026-10-01")).toBe("2026-10");
  });

  it("options : saisons puis mois, du plus récent au plus ancien, libellés en arabe", () => {
    expect(periodOptions(grades)).toEqual([
      { value: "season:2026", label: "الموسم الدراسي 2026/2027" },
      { value: "season:2025", label: "الموسم الدراسي 2025/2026" },
      { value: "season:2024", label: "الموسم الدراسي 2024/2025" },
      { value: "month:2026-10", label: "أكتوبر 2026" },
      { value: "month:2026-01", label: "يناير 2026" },
      { value: "month:2025-09", label: "شتمبر 2025" },
      { value: "month:2025-06", label: "يونيو 2025" },
    ]);
  });

  it("appartenance à une période", () => {
    expect(matchesPeriod("2026-01-15", "season:2025")).toBe(true);
    expect(matchesPeriod("2026-10-01", "season:2025")).toBe(false);
    expect(matchesPeriod("2026-10-01", "month:2026-10")).toBe(true);
    expect(matchesPeriod("2026-10-01", "all")).toBe(true);
  });
});

describe("attestations : filtres", () => {
  it("sans filtre : tout, trié", () => {
    expect(isFiltered(EMPTY_GRADE_FILTERS)).toBe(false);
    expect(ids(filterGrades(grades, students, EMPTY_GRADE_FILTERS))).toEqual(["g5", "g4", "g3", "g2", "g1"]);
  });

  it("nom d'élève (voyelles et formes d'alif ignorées) ou partie examinée", () => {
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, query: "العلمي" }))).toEqual(["g4", "g2", "g1"]);
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, query: "ايوب" }))).toEqual(["g5", "g3"]);
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, query: "البقرة" }))).toEqual(["g2"]);
  });

  it("halaqa, mention, période, et leur combinaison", () => {
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, classId: "c2" }))).toEqual(["g5", "g3"]);
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, overall: "ممتاز" }))).toEqual(["g5", "g2"]);
    expect(ids(filterGrades(grades, students, { ...EMPTY_GRADE_FILTERS, period: "season:2025" }))).toEqual(["g3", "g2"]);
    const f = { query: "", classId: "c1", overall: "ممتاز", period: "month:2025-09" };
    expect(isFiltered(f)).toBe(true);
    expect(ids(filterGrades(grades, students, f))).toEqual(["g2"]);
    expect(ids(filterGrades(grades, students, { ...f, period: "month:2026-10" }))).toEqual([]);
  });

  it("élève inconnu : exclu dès qu'on filtre par halaqa, gardé sinon", () => {
    const xs = [...grades, g("g6", "absent", "2026-10-02", "جيد")];
    expect(ids(filterGrades(xs, students, EMPTY_GRADE_FILTERS))[0]).toBe("g6");
    expect(ids(filterGrades(xs, students, { ...EMPTY_GRADE_FILTERS, classId: "c1" }))).not.toContain("g6");
  });
});
