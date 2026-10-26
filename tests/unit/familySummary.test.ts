/**
 * Accueil famille (UI-01, D89) : calculs purs sur les présences, examens et
 * cotisations d'un enfant (src/screens/family/familySummary.ts).
 */
import { describe, expect, it } from "vitest";
import type { Attendance, Grade, Payment } from "../../src/types";
import { ABSENCE_WINDOW_DAYS, countStatuses, feeOfMonth, isoDay, lastGradeOf, monthLabel, recentSessions, sessionsOf } from "../../src/screens/family/familySummary";
import { canOpenAttendance, navLabel } from "../../src/shell/navModel";

const NOW = new Date(2026, 9, 26, 10, 0, 0); // 26 octobre 2026

const att = (id: string, studentId: string, date: string, status: Attendance["status"]): Attendance => ({ id, studentId, date, status });
const ATT: Attendance[] = [
  att("a1", "S1", "2026-10-24", "حاضر"),
  att("a2", "S1", "2026-10-17", "غائب"),
  att("a3", "S1", "2026-09-26", "غائب"), // 30 jours pile : compté
  att("a4", "S1", "2026-09-25", "غائب"), // 31 jours : hors fenêtre
  att("a5", "S1", "2026-10-10", "متأخر"),
  att("a6", "S2", "2026-10-24", "غائب"),
  att("a7", "S1", "2026-10-27", "غائب"), // dans le futur : ignorée
];

describe("séances d'un enfant", () => {
  it("de la plus récente à la plus ancienne, un seul enfant", () => {
    expect(sessionsOf(ATT, "S1").map((a) => a.id)).toEqual(["a7", "a1", "a2", "a5", "a3", "a4"]);
    expect(sessionsOf(ATT, "S2").map((a) => a.id)).toEqual(["a6"]);
    expect(sessionsOf(ATT, "S9")).toEqual([]);
  });

  it(`fenêtre des ${ABSENCE_WINDOW_DAYS} derniers jours, bornes comprises, sans le futur`, () => {
    const recent = recentSessions(sessionsOf(ATT, "S1"), NOW);
    expect(recent.map((a) => a.id)).toEqual(["a1", "a2", "a5", "a3"]);
    expect(countStatuses(recent)).toEqual({ present: 1, late: 1, absent: 2 });
  });

  it("jour local au format ISO", () => {
    expect(isoDay(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoDay(NOW)).toBe("2026-10-26");
  });
});

describe("dernier examen", () => {
  const g = (id: string, studentId: string, examDate: string): Grade => ({
    id, studentId, examDate, testedPortion: "x", memorizationGrade: 15, tajweedGrade: 16, overallGrade: "جيد", examinerId: "t1",
  });
  it("le plus récent de l'enfant, ou rien", () => {
    const list = [g("g1", "S1", "2026-03-01"), g("g2", "S1", "2026-09-01"), g("g3", "S2", "2026-10-01")];
    expect(lastGradeOf(list, "S1")?.id).toBe("g2");
    expect(lastGradeOf(list, "S3")).toBeNull();
  });
});

describe("cotisation du mois", () => {
  const pay = (studentId: string, month: string, year: number, status: Payment["status"]): Payment => ({
    id: `${studentId}-${month}-${year}`, studentId, month, year, amount: 100, paymentDate: "", status,
  });
  const list = [pay("S1", "أكتوبر", 2026, "مدفوع"), pay("S2", "أكتوبر", 2026, "غير مدفوع"), pay("S3", "شتمبر", 2026, "مدفوع"), pay("S1", "أكتوبر", 2025, "غير مدفوع")];
  it("payée, impayée, ou aucune ligne pour ce mois", () => {
    expect(feeOfMonth(list, "S1", NOW).kind).toBe("paid");
    expect(feeOfMonth(list, "S2", NOW).kind).toBe("unpaid");
    expect(feeOfMonth(list, "S3", NOW).kind).toBe("none");
    expect(monthLabel(NOW)).toBe("أكتوبر 2026");
  });
});

describe("menu famille (navModel)", () => {
  it("libellés par rôle, repris comme titres de page", () => {
    expect(navLabel("ولي أمر", "home")).toBe("ملخص");
    expect(navLabel("ولي أمر", "students")).toBe("متابعة أبنائي");
    expect(navLabel("طالب", "students")).toBe("ملفي وسجل الحفظ");
    expect(navLabel("مدرس", "students")).toBe("طلاب حلقاتي");
    expect(navLabel("ولي أمر", "attendance")).toBe("متابعة الحضور");
    expect(navLabel("إداري", "attendance")).toBe("الحضور والغياب");
  });

  it("présences : seuls les rôles que les règles autorisent à lire ont l'entrée (UI-02)", () => {
    for (const r of ["مدير", "إداري", "مؤطر", "مدرس", "ولي أمر", "طالب"] as const) expect(canOpenAttendance(r), r).toBe(true);
    for (const r of ["متطوع", "عامل نظافة / صيانة", "أخرى"] as const) expect(canOpenAttendance(r), r).toBe(false);
  });
});
