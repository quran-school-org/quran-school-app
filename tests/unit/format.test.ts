/** Formats des montants et pourcentages (UI-10, D92). */
import { describe, expect, it } from "vitest";
import { CURRENCY, formatMoney, formatNumber, formatPercent } from "../../src/format/money";

const THIN = " ";
const NBSP = " ";

describe("formatNumber", () => {
  it("chiffres latins, espace fine insécable pour les milliers, jamais « , » ni « . »", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(70)).toBe("70");
    expect(formatNumber(1320)).toBe(`1${THIN}320`);
    expect(formatNumber(1234567)).toBe(`1${THIN}234${THIN}567`);
    expect(formatNumber(1320)).not.toMatch(/[,.]/);
  });

  it("décimales : arrondi à 2 chiffres, zéros inutiles retirés", () => {
    expect(formatNumber(12.5)).toBe("12.5");
    expect(formatNumber(12.345)).toBe("12.35");
    expect(formatNumber(12.0)).toBe("12");
    expect(formatNumber(2.5, { maxDecimals: 0 })).toBe("3");
  });

  it("négatifs et signe explicite ; -0 et valeurs non numériques : 0", () => {
    expect(formatNumber(-1500)).toBe(`-1${THIN}500`);
    expect(formatNumber(300, { signed: true })).toBe("+300");
    expect(formatNumber(0, { signed: true })).toBe("0");
    expect(formatNumber(-0.001)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber("abc")).toBe("0");
    expect(formatNumber("250")).toBe("250");
    expect(formatNumber(NaN)).toBe("0");
  });
});

describe("formatMoney", () => {
  it("toujours « د.م » (jamais « درهم »), espace insécable avant la devise", () => {
    expect(CURRENCY).toBe("د.م");
    expect(formatMoney(1320)).toBe(`1${THIN}320${NBSP}د.م`);
    expect(formatMoney(0)).toBe(`0${NBSP}د.م`);
    expect(formatMoney(770)).not.toContain("درهم");
  });

  it("deux écrans, un seul texte pour la même somme", () => {
    expect(formatMoney(1320)).toBe(formatMoney("1320"));
  });
});

describe("formatPercent", () => {
  it("entier par défaut, signe % collé au nombre", () => {
    expect(formatPercent(92)).toBe("92%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(91.6)).toBe("92%");
    expect(formatPercent(33.333, { maxDecimals: 1 })).toBe("33.3%");
    expect(formatPercent(undefined)).toBe("0%");
  });
});
