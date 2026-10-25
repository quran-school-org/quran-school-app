/**
 * Liste déroulante de la charte (D83) : lecture des <option> enfants (valeurs
 * inchangées), recherche et saisie de lettre (src/ui/Select.tsx, textSearch.ts).
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { foldForSearch, optionsFromChildren, stepIndex, typeaheadIndex } from "../../src/ui/Select";

const h = React.createElement;

describe("liste déroulante : options déclarées en <option>", () => {
  it("valeurs gardées telles quelles (rôles en arabe), libellés aplatis", () => {
    const opts = optionsFromChildren([
      h("option", { key: "a", value: "مدير" }, "مدير (Director - كامل الصلاحيات)"),
      h(React.Fragment, { key: "f" }, h("option", { value: "عامل نظافة / صيانة" }, "عامل نظافة", " ", "وصيانة")),
      [h("option", { key: "n", value: 2026 }, 2026)],
      h("option", { key: "d", value: "x", disabled: true }, "  معطل  "),
      false,
      null,
    ]);
    expect(opts).toEqual([
      { value: "مدير", label: "مدير (Director - كامل الصلاحيات)", disabled: false },
      { value: "عامل نظافة / صيانة", label: "عامل نظافة وصيانة", disabled: false },
      { value: "2026", label: "2026", disabled: false },
      { value: "x", label: "معطل", disabled: true },
    ]);
  });

  it("option sans `value` : la valeur est le libellé d'origine", () => {
    expect(optionsFromChildren(h("option", null, "ذكر"))).toEqual([{ value: "ذكر", label: "ذكر", disabled: false }]);
  });
});

describe("liste déroulante : recherche et clavier", () => {
  it("comparaison sans voyelles, formes d'alif ni accents", () => {
    expect(foldForSearch("أَحْمَد")).toBe(foldForSearch("احمد"));
    expect(foldForSearch("إيمان")).toBe(foldForSearch("ايمان"));
    expect(foldForSearch("Élèves  Archivés")).toBe("eleves archives");
  });

  it("flèches : options désactivées ou masquées sautées, pas de sortie des bornes", () => {
    const usable = [true, false, true, true];
    expect(stepIndex(usable, 0, 1)).toBe(2);
    expect(stepIndex(usable, 3, 1)).toBe(3);
    expect(stepIndex(usable, 2, -1)).toBe(0);
    expect(stepIndex(usable, -1, 1)).toBe(0);
  });

  it("première lettre : texte affiché (traduit) ou d'origine ; lettre répétée = option suivante", () => {
    const texts = [["Élèves actifs", "الطلاب النشطون"], ["Élèves archivés", "الطلاب المؤرشفون"], ["Tous (actifs et archivés)", "الكل (نشط ومؤرشف)"]];
    const all = [true, true, true];
    expect(typeaheadIndex(texts, all, "t", 0)).toBe(2);
    expect(typeaheadIndex(texts, all, "e", 0)).toBe(1);
    expect(typeaheadIndex(texts, all, "ee", 1)).toBe(0);
    expect(typeaheadIndex(texts, all, "eleves ar", 0)).toBe(1);
    expect(typeaheadIndex(texts, all, "الك", 0)).toBe(2);
    expect(typeaheadIndex(texts, all, "z", 0)).toBe(-1);
  });
});
