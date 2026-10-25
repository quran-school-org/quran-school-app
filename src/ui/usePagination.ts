/**
 * Pagination : calculs purs (bornes, fenêtre de numéros) et crochet
 * `usePagination`, qui revient à la page 1 quand la clé de réinitialisation
 * (recherche, filtres) change. Testé dans tests/unit/pagination.test.ts (nom distinct de Pagination.tsx : disques insensibles à la casse).
 */
import { useCallback, useMemo, useState } from "react";

/** Nombre de pages (au moins 1, même pour une liste vide). */
export function pageCountOf(total: number, pageSize: number): number {
  const size = Math.max(1, Math.floor(pageSize) || 1);
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

/** Page ramenée dans [1, pageCount] (valeur non numérique : 1). */
export function clampPage(page: number, pageCount: number): number {
  const p = Math.floor(Number(page));
  if (!Number.isFinite(p) || p < 1) return 1;
  return Math.min(p, Math.max(1, pageCount));
}

export interface PageRange {
  page: number;
  pageCount: number;
  /** Rang (1…total) du premier élément affiché ; 0 si la liste est vide. */
  start: number;
  /** Rang du dernier élément affiché ; 0 si la liste est vide. */
  end: number;
  total: number;
}

export function pageRange(total: number, page: number, pageSize: number): PageRange {
  const pageCount = pageCountOf(total, pageSize);
  const p = clampPage(page, pageCount);
  if (total <= 0) return { page: 1, pageCount, start: 0, end: 0, total: 0 };
  return { page: p, pageCount, start: (p - 1) * pageSize + 1, end: Math.min(total, p * pageSize), total };
}

export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const { start, end } = pageRange(items.length, page, pageSize);
  return start ? items.slice(start - 1, end) : [];
}

/** Page (1…) qui contient l'élément de rang `index` (0…). */
export function pageOfIndex(index: number, pageSize: number): number {
  return index < 0 ? 1 : Math.floor(index / Math.max(1, pageSize)) + 1;
}

export type PageItem = number | "gap";

/**
 * Numéros affichés : première et dernière page, la page courante et `siblings`
 * voisines de chaque côté ; « gap » pour un saut de plus d'une page (un trou
 * d'une seule page affiche ce numéro plutôt que « … »).
 */
export function pageWindow(page: number, pageCount: number, siblings = 1): PageItem[] {
  const count = Math.max(1, pageCount);
  const p = clampPage(page, count);
  const keep = new Set<number>([1, count]);
  for (let i = p - siblings; i <= p + siblings; i++) if (i >= 1 && i <= count) keep.add(i);
  const sorted = [...keep].sort((a, b) => a - b);
  const out: PageItem[] = [];
  sorted.forEach((n, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined) {
      if (n - prev === 2) out.push(prev + 1);
      else if (n - prev > 2) out.push("gap");
    }
    out.push(n);
  });
  return out;
}

export interface PageState {
  page: number;
  /** Clé (recherche, filtres) pour laquelle la page a été choisie. */
  key: string;
}

/** Page effective : la page choisie si la clé n'a pas changé, sinon 1 ; toujours dans les bornes. */
export function effectivePage(state: PageState, key: string, pageCount: number): number {
  return state.key === key ? clampPage(state.page, pageCount) : 1;
}

/**
 * Pagination d'une liste déjà filtrée et triée. `resetKey` résume la recherche
 * et les filtres : quand elle change, la liste repart de la page 1 (sans
 * effet ni rendu intermédiaire). `initialPage` : page affichée à l'ouverture
 * (ex. celle de l'élève déjà sélectionné).
 */
export function usePagination<T>(items: readonly T[], pageSize: number, resetKey: string, initialPage = 1) {
  const [state, setState] = useState<PageState>(() => ({ page: initialPage, key: resetKey }));
  // Recherche ou filtres modifiés : retour à la page 1 (état dérivé, mis à jour pendant le rendu).
  if (state.key !== resetKey) setState({ page: 1, key: resetKey });
  const range = pageRange(items.length, effectivePage(state, resetKey, pageCountOf(items.length, pageSize)), pageSize);
  const setPage = useCallback((page: number) => setState({ page, key: resetKey }), [resetKey]);
  const pageItems = useMemo(() => pageSlice(items, range.page, pageSize), [items, range.page, pageSize]);
  return { ...range, pageSize, pageItems, setPage };
}
