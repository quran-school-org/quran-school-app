/** Format d'affichage des dates (audit UX, constat 22, D100). */
import { describe, expect, it } from "vitest";
import { MONTHS_AR } from "../../src/school/businessRules";
import { DATE_FALLBACK, formatDateAr, formatDateRangeAr, formatDateTimeAr, formatTimeAr } from "../../src/format/date";

describe("formatDateAr", () => {
  it("écrit le jour, le mois marocain et l'année, en chiffres latins", () => {
    expect(formatDateAr("2026-10-01")).toBe("1 أكتوبر 2026");
    expect(formatDateAr("2026-07-15")).toBe("15 يوليوز 2026");
    expect(formatDateAr("2026-08-09")).toBe("9 غشت 2026");
    expect(formatDateAr("2025-12-31")).toBe("31 دجنبر 2025");
  });

  it("emploie exactement les noms de mois de l'application, pour les douze mois", () => {
    MONTHS_AR.forEach((month, i) => {
      expect(formatDateAr(`2026-${String(i + 1).padStart(2, "0")}-05`)).toBe(`5 ${month} 2026`);
    });
  });

  it("n'applique aucun décalage de fuseau : la date écrite est la date affichée", () => {
    expect(formatDateAr("2026-01-01")).toBe("1 يناير 2026");
    expect(formatDateAr("2026-10-01T23:59:59")).toBe("1 أكتوبر 2026");
    expect(formatDateAr("2026-10-01T00:00:00.000Z")).toBe("1 أكتوبر 2026");
  });

  it("vide, absent ou illisible : texte de repli", () => {
    for (const v of ["", "   ", null, undefined, 12, {}, "n'importe quoi", "2026-13-01", "2026-00-10", "2026-02-30", "2026-04-31", "2026-10-00", "10/01/2026", "2026-1-1"]) {
      expect(formatDateAr(v)).toBe(DATE_FALLBACK);
    }
    expect(DATE_FALLBACK).toBe("—");
  });

  it("accepte le 29 février d'une année bissextile seulement", () => {
    expect(formatDateAr("2028-02-29")).toBe("29 فبراير 2028");
    expect(formatDateAr("2026-02-29")).toBe(DATE_FALLBACK);
  });

  it("repli personnalisé", () => {
    expect(formatDateAr("", "غير محدد")).toBe("غير محدد");
    expect(formatDateAr("2026-10-01", "غير محدد")).toBe("1 أكتوبر 2026");
  });
});

describe("formatDateRangeAr", () => {
  it("début seul, ou fin identique : une seule date", () => {
    expect(formatDateRangeAr("2026-10-01")).toBe("1 أكتوبر 2026");
    expect(formatDateRangeAr("2026-10-01", "2026-10-01")).toBe("1 أكتوبر 2026");
    expect(formatDateRangeAr("2026-10-01", "")).toBe("1 أكتوبر 2026");
  });
  it("période : début « إلى » fin", () => {
    expect(formatDateRangeAr("2026-10-01", "2026-10-03")).toBe("1 أكتوبر 2026 إلى 3 أكتوبر 2026");
  });
  it("début absent ou invalide : repli (ou la fin seule)", () => {
    expect(formatDateRangeAr("", "")).toBe(DATE_FALLBACK);
    expect(formatDateRangeAr("nope", undefined)).toBe(DATE_FALLBACK);
    expect(formatDateRangeAr("", "2026-10-03")).toBe("3 أكتوبر 2026");
  });
});

describe("formatDateTimeAr", () => {
  it("date et heure locales", () => {
    expect(formatDateTimeAr("2026-10-01T14:05:00")).toBe("1 أكتوبر 2026، 14:05");
  });
  it("sans heure : la date seule", () => {
    expect(formatDateTimeAr("2026-10-01")).toBe("1 أكتوبر 2026");
  });
  it("vide ou invalide : repli", () => {
    expect(formatDateTimeAr("")).toBe(DATE_FALLBACK);
    expect(formatDateTimeAr(undefined)).toBe(DATE_FALLBACK);
    expect(formatDateTimeAr("pas une date")).toBe(DATE_FALLBACK);
  });
});

describe("formatTimeAr", () => {
  it("heure locale sur 24 h, chiffres latins", () => {
    expect(formatTimeAr("2026-10-01T09:05:00")).toBe("09:05");
  });
  it("sans heure ou invalide : repli", () => {
    expect(formatTimeAr("2026-10-01")).toBe(DATE_FALLBACK);
    expect(formatTimeAr("")).toBe(DATE_FALLBACK);
    expect(formatTimeAr(null, "x")).toBe("x");
  });
});
