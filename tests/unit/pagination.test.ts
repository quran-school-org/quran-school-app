/**
 * Pagination (D83) : bornes, liste vide, fenêtre de numéros et retour à la
 * page 1 quand la recherche ou les filtres changent (src/ui/usePagination.ts).
 */
import { describe, expect, it } from "vitest";
import { clampPage, effectivePage, pageCountOf, pageOfIndex, pageRange, pageSlice, pageWindow } from "../../src/ui/usePagination";
import { PAGE_SIZES } from "../../src/ui/Pagination";

const items = Array.from({ length: 150 }, (_, i) => i + 1);

describe("pagination : tailles retenues", () => {
  it("8 élèves et 20 attestations par page", () => {
    expect(PAGE_SIZES).toEqual({ students: 8, certificates: 20 });
  });
});

describe("pagination : bornes", () => {
  it("nombre de pages : au moins 1, arrondi au-dessus", () => {
    expect(pageCountOf(0, 8)).toBe(1);
    expect(pageCountOf(8, 8)).toBe(1);
    expect(pageCountOf(9, 8)).toBe(2);
    expect(pageCountOf(150, 8)).toBe(19);
    expect(pageCountOf(150, 20)).toBe(8);
    expect(pageCountOf(-3, 8)).toBe(1);
  });

  it("page ramenée dans [1, nombre de pages]", () => {
    expect(clampPage(0, 19)).toBe(1);
    expect(clampPage(-4, 19)).toBe(1);
    expect(clampPage(25, 19)).toBe(19);
    expect(clampPage(2.7, 19)).toBe(2);
    expect(clampPage(Number.NaN, 19)).toBe(1);
  });

  it("rangs affichés : « 9–16 sur 150 », dernière page partielle", () => {
    expect(pageRange(150, 2, 8)).toEqual({ page: 2, pageCount: 19, start: 9, end: 16, total: 150 });
    expect(pageRange(150, 19, 8)).toEqual({ page: 19, pageCount: 19, start: 145, end: 150, total: 150 });
    expect(pageRange(150, 99, 8).page).toBe(19);
    expect(pageSlice(items, 19, 8)).toEqual([145, 146, 147, 148, 149, 150]);
    expect(pageSlice(items, 1, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("liste vide : page 1, aucun élément, rangs à 0", () => {
    expect(pageRange(0, 3, 8)).toEqual({ page: 1, pageCount: 1, start: 0, end: 0, total: 0 });
    expect(pageSlice([], 3, 8)).toEqual([]);
  });

  it("page d'un élément (élève sélectionné)", () => {
    expect(pageOfIndex(0, 8)).toBe(1);
    expect(pageOfIndex(7, 8)).toBe(1);
    expect(pageOfIndex(8, 8)).toBe(2);
    expect(pageOfIndex(-1, 8)).toBe(1);
  });
});

describe("pagination : numéros affichés", () => {
  it("« 1 2 3 … 19 » au début, « 1 … 9 10 11 … 19 » au milieu, « 1 … 17 18 19 » à la fin", () => {
    expect(pageWindow(1, 19)).toEqual([1, 2, "gap", 19]);
    expect(pageWindow(2, 19)).toEqual([1, 2, 3, "gap", 19]);
    expect(pageWindow(10, 19)).toEqual([1, "gap", 9, 10, 11, "gap", 19]);
    expect(pageWindow(19, 19)).toEqual([1, "gap", 18, 19]);
  });

  it("un trou d'une seule page montre le numéro, pas « … »", () => {
    expect(pageWindow(4, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("une seule page ; mobile (aucune voisine)", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 19, 0)).toEqual([1, "gap", 5, "gap", 19]);
  });
});

describe("pagination : retour à la page 1", () => {
  it("même recherche et mêmes filtres : la page choisie est gardée (dans les bornes)", () => {
    expect(effectivePage({ page: 4, key: "q=|active" }, "q=|active", 19)).toBe(4);
    expect(effectivePage({ page: 40, key: "q=|active" }, "q=|active", 19)).toBe(19);
  });

  it("recherche ou filtre modifié : page 1", () => {
    expect(effectivePage({ page: 4, key: "q=|active" }, "q=ali|active", 19)).toBe(1);
    expect(effectivePage({ page: 4, key: "q=|active" }, "q=|archived", 19)).toBe(1);
  });

  it("la liste raccourcit (élève archivé, filtre) : dernière page existante", () => {
    expect(effectivePage({ page: 19, key: "k" }, "k", pageCountOf(100, 8))).toBe(13);
  });
});
