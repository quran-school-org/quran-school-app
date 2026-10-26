/** Carte « ملخص أبنائك » du menu pour un parent (src/shell/familySidebar.ts). */
import { describe, expect, it } from "vitest";
import type { Student } from "../../src/types";
import { extraChildrenLabel, familySidebarModel, firstName } from "../../src/shell/familySidebar";

const kid = (id: string, fullName: string, hizbCount: number, gender: Student["gender"] = "ذكر") => ({ id, fullName, hizbCount, gender }) as Student;

describe("prénom", () => {
  it("premier mot, ou deux pour un prénom composé", () => {
    expect(firstName("ياسين العلمي")).toBe("ياسين");
    expect(firstName("عبد الرحمن العلمي")).toBe("عبد الرحمن");
    expect(firstName("  فاطمة  ")).toBe("فاطمة");
    expect(firstName("")).toBe("");
    expect(firstName(undefined)).toBe("");
  });
});

describe("modèle de la carte famille", () => {
  it("aucun enfant", () => {
    expect(familySidebarModel([])).toMatchObject({ kind: "none", title: "ملخص أبنائك", lines: [], extra: 0 });
  });
  it("un enfant : titre au singulier selon le genre, prénom et hizb, sans « +N »", () => {
    expect(familySidebarModel([kid("1", "ياسين العلمي", 2)])).toEqual({ kind: "one", title: "ملخص ابنك", lines: [{ id: "1", name: "ياسين", hizb: 2 }], extra: 0 });
    expect(familySidebarModel([kid("2", "مريم العلمي", 5, "أنثى")]).title).toBe("ملخص ابنتك");
  });
  it("plusieurs enfants : une ligne par enfant, au plus 3, puis le reste", () => {
    const two = familySidebarModel([kid("1", "ياسين العلمي", 2), kid("2", "مريم العلمي", 5, "أنثى")]);
    expect(two).toMatchObject({ kind: "many", title: "ملخص أبنائك", extra: 0 });
    expect(two.lines.map((l) => l.name)).toEqual(["ياسين", "مريم"]);
    const five = familySidebarModel([1, 2, 3, 4, 5].map((i) => kid(String(i), `ولد${i} العلمي`, i)));
    expect(five.lines).toHaveLength(3);
    expect(five.extra).toBe(2);
    expect(familySidebarModel([1, 2, 3].map((i) => kid(String(i), `ولد${i} العلمي`, i))).extra).toBe(0);
  });
  it("hizb absent ou invalide : 0", () => {
    expect(familySidebarModel([kid("1", "علي", NaN as any)]).lines[0].hizb).toBe(0);
  });
});

describe("« +N » pour lecteur d'écran", () => {
  it("singulier, duel, pluriel, au-delà de 10", () => {
    expect(extraChildrenLabel(1)).toBe("وابن آخر");
    expect(extraChildrenLabel(2)).toBe("وابنان آخران");
    expect(extraChildrenLabel(4)).toBe("و4 أبناء آخرين");
    expect(extraChildrenLabel(11)).toBe("و11 ابنًا آخر");
  });
});
