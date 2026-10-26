/** Mention proposée à partir des notes sur 20 (UI-11, D92). */
import { describe, expect, it } from "vitest";
import { MENTIONS, parseGrade, suggestMention } from "../../src/utils/gradeMention";

describe("parseGrade", () => {
  it("vide ou hors de 0-20 : pas une note", () => {
    expect(parseGrade("")).toBeNull();
    expect(parseGrade("  ")).toBeNull();
    expect(parseGrade(undefined)).toBeNull();
    expect(parseGrade(null)).toBeNull();
    expect(parseGrade("abc")).toBeNull();
    expect(parseGrade(-1)).toBeNull();
    expect(parseGrade("20.5")).toBeNull();
  });
  it("0 est une note valide (et pas une saisie vide)", () => {
    expect(parseGrade("0")).toBe(0);
    expect(parseGrade(0)).toBe(0);
    expect(parseGrade("17.25")).toBe(17.25);
    expect(parseGrade(20)).toBe(20);
  });
});

describe("suggestMention (moyenne des deux notes)", () => {
  it("aucune mention tant qu'une note manque", () => {
    expect(suggestMention("", "")).toBeNull();
    expect(suggestMention("18", "")).toBeNull();
    expect(suggestMention("", "18")).toBeNull();
    expect(suggestMention("25", "18")).toBeNull();
  });

  it("seuils : 17 ممتاز, 15 جيد جداً, 12 جيد, sinon مقبول (bornes incluses)", () => {
    expect(suggestMention(20, 20)).toBe("ممتاز");
    expect(suggestMention(17, 17)).toBe("ممتاز");
    expect(suggestMention(16, 18)).toBe("ممتاز"); // moyenne 17
    expect(suggestMention(16.5, 16.5)).toBe("جيد جداً");
    expect(suggestMention(15, 15)).toBe("جيد جداً");
    expect(suggestMention(14, 15)).toBe("جيد"); // 14.5
    expect(suggestMention(12, 12)).toBe("جيد");
    expect(suggestMention(11, 12)).toBe("مقبول"); // 11.5
    expect(suggestMention(0, 0)).toBe("مقبول");
  });

  it("le cas de l'audit : 16/20 et 16/20 ne donne plus « ممتاز »", () => {
    expect(suggestMention("16", "16")).toBe("جيد جداً");
  });

  it("cohérent avec les données de démo (mêmes seuils que les fixtures)", () => {
    const fixture = (avg: number) => (avg >= 17 ? "ممتاز" : avg >= 15 ? "جيد جداً" : avg >= 12 ? "جيد" : "مقبول");
    for (let m = 6; m <= 20; m++) for (let t = 6; t <= 20; t++) expect(suggestMention(m, t)).toBe(fixture((m + t) / 2));
  });

  it("ne propose que des mentions du modèle", () => {
    for (const m of [0, 10, 13, 16, 19]) expect(MENTIONS).toContain(suggestMention(m, m));
  });
});
