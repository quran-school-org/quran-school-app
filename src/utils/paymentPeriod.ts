/**
 * Période d'un paiement : filtre « شهر الرصد » (chaîne « AAAA-MM », vide = tous
 * les mois) et ordre du plus récent au plus ancien (UI-08, UI-09, D92).
 */
import { MONTHS_AR, monthIndex } from "../school/businessRules";
import type { Payment } from "../types";

/** « 2026 », « أكتوبر » -> « 2026-10 ». */
export function toPeriodFilter(year: number, month: string): string {
  const i = monthIndex(month);
  return i < 0 ? "" : `${year}-${String(i + 1).padStart(2, "0")}`;
}

/** « 2026-10 » -> { year: 2026, month: "أكتوبر" } ; chaîne vide ou invalide : null. */
export function fromPeriodFilter(filter: string): { year: number; month: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(filter || "");
  if (!m) return null;
  const idx = Number(m[2]) - 1;
  return idx >= 0 && idx < 12 ? { year: Number(m[1]), month: MONTHS_AR[idx] } : null;
}

/** Années proposées par le filtre : celles des paiements et l'année courante, de la plus récente à la plus ancienne. */
export function periodYears(payments: Pick<Payment, "year">[], currentYear: number): number[] {
  const set = new Set<number>([currentYear]);
  for (const p of payments) if (Number.isFinite(Number(p.year)) && Number(p.year) > 0) set.add(Number(p.year));
  return [...set].sort((a, b) => b - a);
}

/** Comparateur : période la plus récente d'abord, puis date de paiement, puis identifiant. */
export function comparePaymentsRecentFirst(a: Payment, b: Payment): number {
  const ka = Number(a.year) * 12 + monthIndex(a.month);
  const kb = Number(b.year) * 12 + monthIndex(b.month);
  if (ka !== kb) return kb - ka;
  const da = a.paymentDate || "";
  const db = b.paymentDate || "";
  if (da !== db) return da < db ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}
