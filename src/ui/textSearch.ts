/**
 * Comparaison de textes pour la recherche (module pur) : casse, accents
 * latins, voyelles brèves, tatweel et variantes d'alif / ya / ta marbuta
 * arabes ignorés. « أحمد » trouve « احمد », « Élève » trouve « eleve ».
 */
/** Lettres de remplacement (codes, pas des chaînes d'interface à traduire). */
const ALEF = String.fromCharCode(0x0627);
const YA = String.fromCharCode(0x064a);
const HA = String.fromCharCode(0x0647);

export function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, ALEF)
    .replace(/\u0649/g, YA)
    .replace(/\u0629/g, HA)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

