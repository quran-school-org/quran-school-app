/** Filtre de période des paiements et ordre du plus récent au plus ancien (UI-08, UI-09, D92). */
import { describe, expect, it } from "vitest";
import { comparePaymentsRecentFirst, fromPeriodFilter, periodYears, toPeriodFilter } from "../../src/utils/paymentPeriod";
import type { Payment } from "../../src/types";

const pay = (id: string, year: number, month: string, paymentDate = ""): Payment => ({ id, studentId: "s1", year, month, amount: 70, status: "مدفوع", paymentDate });

describe("filtre « AAAA-MM »", () => {
  it("aller-retour avec les mois en arabe marocain", () => {
    expect(toPeriodFilter(2026, "أكتوبر")).toBe("2026-10");
    expect(toPeriodFilter(2026, "يناير")).toBe("2026-01");
    expect(fromPeriodFilter("2026-10")).toEqual({ year: 2026, month: "أكتوبر" });
    expect(fromPeriodFilter("2026-08")).toEqual({ year: 2026, month: "غشت" });
    expect(fromPeriodFilter("2026-07")).toEqual({ year: 2026, month: "يوليوز" });
  });
  it("vide, invalide ou mois inconnu : tous les mois", () => {
    expect(fromPeriodFilter("")).toBeNull();
    expect(fromPeriodFilter("2026-13")).toBeNull();
    expect(fromPeriodFilter("oct")).toBeNull();
    expect(toPeriodFilter(2026, "")).toBe("");
    expect(toPeriodFilter(2026, "octobre")).toBe("");
  });
});

describe("années proposées", () => {
  it("année courante + années des paiements, de la plus récente à la plus ancienne, sans doublon", () => {
    expect(periodYears([{ year: 2025 }, { year: 2026 }, { year: 2025 }], 2026)).toEqual([2026, 2025]);
    expect(periodYears([], 2026)).toEqual([2026]);
    expect(periodYears([{ year: 2024 }], 2026)).toEqual([2026, 2024]);
  });
});

describe("ordre du plus récent au plus ancien", () => {
  it("par période, puis date de paiement, puis identifiant", () => {
    const list = [pay("a", 2025, "دجنبر"), pay("b", 2026, "ماي"), pay("c", 2026, "أكتوبر", "2026-10-03"), pay("d", 2026, "أكتوبر", "2026-10-20"), pay("e", 2026, "يناير")];
    expect([...list].sort(comparePaymentsRecentFirst).map((p) => p.id)).toEqual(["d", "c", "b", "e", "a"]);
  });
});
