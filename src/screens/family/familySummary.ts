/**
 * Calculs de l'accueil famille (UI-01, D89) : fonctions pures, sans React,
 * testées dans tests/unit/familySummary.test.ts. Les données viennent des
 * abonnements déjà filtrés sur les enfants du compte (firestore.rules).
 */
import type { Attendance, Grade, Payment } from "../../types";
import { MONTHS_AR } from "../../school/businessRules";

export const ABSENCE_WINDOW_DAYS = 30;

/** Date locale au format YYYY-MM-DD (les séances sont enregistrées dans ce format). */
export function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Séances de l'élève, de la plus récente à la plus ancienne. */
export function sessionsOf(attendance: Attendance[], studentId: string): Attendance[] {
  return attendance
    .filter((a) => a.studentId === studentId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export interface AttendanceCounts { present: number; late: number; absent: number }

export function countStatuses(sessions: Attendance[]): AttendanceCounts {
  return {
    present: sessions.filter((s) => s.status === "حاضر").length,
    late: sessions.filter((s) => s.status === "متأخر").length,
    absent: sessions.filter((s) => s.status === "غائب").length,
  };
}

/** Séances des `days` derniers jours (aujourd'hui compris). */
export function recentSessions(sessions: Attendance[], now: Date, days = ABSENCE_WINDOW_DAYS): Attendance[] {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const fromIso = isoDay(from);
  const toIso = isoDay(now);
  return sessions.filter((s) => s.date >= fromIso && s.date <= toIso);
}

/** Dernier examen de l'élève (date la plus récente). */
export function lastGradeOf(grades: Grade[], studentId: string): Grade | null {
  const own = grades.filter((g) => g.studentId === studentId);
  if (own.length === 0) return null;
  return own.reduce((best, g) => (g.examDate > best.examDate ? g : best));
}

export type FeeState =
  | { kind: "paid"; payment: Payment }
  | { kind: "unpaid"; payment: Payment }
  | { kind: "none" };

/** Cotisation du mois de `now` pour l'élève. */
export function feeOfMonth(payments: Payment[], studentId: string, now: Date): FeeState {
  const month = MONTHS_AR[now.getMonth()];
  const year = now.getFullYear();
  const p = payments.find((x) => x.studentId === studentId && x.month === month && Number(x.year) === year);
  if (!p) return { kind: "none" };
  return p.status === "مدفوع" ? { kind: "paid", payment: p } : { kind: "unpaid", payment: p };
}

export const monthLabel = (now: Date) => `${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;
