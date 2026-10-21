import { describe, expect, it } from "vitest";
import { computeAge, getMonthsToGenerate, getSubscriptionAmount, isMonthBeforeOpening } from "../../src/school/businessRules";

const alfajr = {
  subscriptionFee: 100,
  feeOverrides: [
    { year: 2026, month: "يوليوز", amount: 70 },
    { year: 2026, month: "غشت", amount: 70 },
  ],
  openingYear: 2026,
  openingMonth: "يوليوز",
};

describe("paramètres métier par école", () => {
  it("reproduit exactement les tarifs historiques d'Al Fajr", () => {
    expect(getSubscriptionAmount(alfajr, "يوليوز", 2026)).toBe(70);
    expect(getSubscriptionAmount(alfajr, "غشت", 2026)).toBe(70);
    expect(getSubscriptionAmount(alfajr, "شتمبر", 2026)).toBe(100);
    expect(getSubscriptionAmount(alfajr, "يوليوز", 2027)).toBe(100);
  });

  it("cotisation non paramétrée : valeur historique de 100", () => {
    expect(getSubscriptionAmount({ subscriptionFee: 0 }, "ماي", 2027)).toBe(100);
    expect(getSubscriptionAmount(null, "ماي", 2027)).toBe(100);
    expect(getSubscriptionAmount({ subscriptionFee: 150 }, "ماي", 2027)).toBe(150);
  });

  it("ouverture officielle paramétrable (ex-isMonthBeforeJuly2026)", () => {
    expect(isMonthBeforeOpening(alfajr, "يونيو", 2026)).toBe(true);
    expect(isMonthBeforeOpening(alfajr, "يوليوز", 2026)).toBe(false);
    expect(isMonthBeforeOpening(alfajr, "يناير", 2025)).toBe(true);
    expect(isMonthBeforeOpening({ openingYear: 2027, openingMonth: "شتمبر" }, "غشت", 2027)).toBe(true);
    expect(isMonthBeforeOpening({}, "يناير", 2000)).toBe(false);
  });

  it("génère les mois depuis l'inscription, sans ceux d'avant l'ouverture", () => {
    const months = getMonthsToGenerate(alfajr, "2026-05-15", new Date("2026-09-10"));
    expect(months.map((m) => m.month)).toEqual(["يوليوز", "غشت", "شتمبر"]);
  });

  it("âge calculé à la date du jour (et non 2026 - année)", () => {
    expect(computeAge("2011-10-22", new Date("2026-10-21"))).toBe(14);
    expect(computeAge("2011-10-21", new Date("2026-10-21"))).toBe(15);
    expect(computeAge("", new Date())).toBeNull();
  });
});
