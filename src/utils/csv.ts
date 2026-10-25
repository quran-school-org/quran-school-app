/**
 * Cellule CSV sûre pour un tableur (A-05, D86) : une valeur qui commence par
 * `=`, `@`, une tabulation, un retour chariot, `+` ou `-` serait lue comme une
 * formule par Excel ou LibreOffice. On la préfixe d'une apostrophe, sauf les
 * nombres et téléphones (`-50`, `+212 6 61 00 00 01`), qui restent tels quels.
 */
const FORMULA_START = /^[=@\t\r+-]/;
const SIGNED_NUMBER = /^[+-][\d\s().]*$/;

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (FORMULA_START.test(text) && !SIGNED_NUMBER.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}
