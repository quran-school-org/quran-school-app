/**
 * Carte « ملخص أبنائك » du bas du menu pour un parent : fonctions pures,
 * testées dans tests/unit/familySidebar.test.ts. Un enfant : son prénom et son
 * hizb actuel. Plusieurs : une ligne par enfant (au plus 3), puis « +N ».
 */
import type { Student } from "../types";

/** Nombre maximal de lignes d'enfants affichées dans la carte. */
export const FAMILY_SIDEBAR_MAX_LINES = 3;

/** Prénoms composés arabes : le premier mot seul ne suffit pas (عبد الرحمن، أبو بكر). */
const COMPOUND_FIRST = new Set(["عبد", "أبو", "ابو", "أم", "ام", "ابن"]);

/** Prénom d'un élève (premier mot du nom complet, ou deux mots pour un prénom composé). */
export function firstName(fullName: string | undefined | null): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length > 1 && COMPOUND_FIRST.has(parts[0])) return `${parts[0]} ${parts[1]}`;
  return parts[0];
}

export interface FamilySidebarLine { id: string; name: string; hizb: number }
export interface FamilySidebarModel {
  /** « one » : un seul enfant ; « many » : plusieurs. Aucun enfant : « none ». */
  kind: "none" | "one" | "many";
  /** Libellé de la carte, au singulier ou au pluriel (ابنك / ابنتك / أبنائك). */
  title: string;
  lines: FamilySidebarLine[];
  /** Enfants non affichés (« +N »). */
  extra: number;
}

export function familySidebarModel(children: Student[], max = FAMILY_SIDEBAR_MAX_LINES): FamilySidebarModel {
  const toLine = (s: Student): FamilySidebarLine => ({ id: s.id, name: firstName(s.fullName), hizb: Number(s.hizbCount) || 0 });
  if (children.length === 0) return { kind: "none", title: "ملخص أبنائك", lines: [], extra: 0 };
  if (children.length === 1) return { kind: "one", title: children[0].gender === "أنثى" ? "ملخص ابنتك" : "ملخص ابنك", lines: [toLine(children[0])], extra: 0 };
  return { kind: "many", title: "ملخص أبنائك", lines: children.slice(0, max).map(toLine), extra: Math.max(0, children.length - max) };
}

/** Lecteur d'écran : « +N » dit en arabe correct (duel, pluriel, singulier après 10). */
export function extraChildrenLabel(n: number): string {
  if (n === 1) return "وابن آخر";
  if (n === 2) return "وابنان آخران";
  if (n >= 3 && n <= 10) return `و${n} أبناء آخرين`;
  return `و${n} ابنًا آخر`;
}
