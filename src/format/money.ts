/**
 * Formats d'affichage des montants et des pourcentages (UI-10, D92) : une seule
 * écriture dans toute l'interface, chiffres latins, un seul séparateur de
 * milliers (espace fine insécable), devise « د.م ».
 *
 * Unique formateur de montants de l'interface (D101) : tout montant affiché passe par
 * `formatMoney` / `formatNumber` (garde-fous de `tests/unit/uiGuards.test.ts` : ni
 * « درهم » dans un écran, ni `toLocaleString`). Devise toujours APRÈS le nombre.
 *
 * Les valeurs stockées ne changent pas : ce sont des formats d'AFFICHAGE.
 * Un nombre signé (« -150 », « +300 ») commence par un signe : le rendre dans
 * un `<Ltr>` (src/ui) pour qu'il reste collé à ses chiffres dans un texte RTL.
 */

/** Espace fine insécable (U+202F) : séparateur des milliers. */
export const THOUSANDS_SEPARATOR = " ";
/** Devise affichée partout dans l'interface. */
export const CURRENCY = "د.م";

export interface FormatOptions {
  /** Décimales affichées au plus (défaut 2 pour un montant, 0 pour un pourcentage). */
  maxDecimals?: number;
  /** Préfixe « + » devant un nombre positif (soldes, écarts). */
  signed?: boolean;
}

const toNumber = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
};

/** Nombre groupé par milliers, sans devise : 1320 -> « 1 320 » ; point décimal latin (1234.5 -> « 1 234.5 »). */
export function formatNumber(n: unknown, { maxDecimals = 2, signed = false }: FormatOptions = {}): string {
  const v = toNumber(n);
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(Math.abs(v) * factor) / factor;
  const [int, dec] = rounded.toFixed(maxDecimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  const body = dec && Number(dec) !== 0 ? `${grouped}.${dec.replace(/0+$/, "")}` : grouped;
  const negative = v < 0 && rounded !== 0;
  return `${negative ? "-" : signed && rounded !== 0 ? "+" : ""}${body}`;
}

/** Montant avec la devise : 1320 -> « 1 320 د.م » (espace insécable avant la devise). */
export function formatMoney(n: unknown, options: FormatOptions = {}): string {
  return `${formatNumber(n, options)} ${CURRENCY}`;
}

/** Pourcentage entier par défaut : 92 -> « 92% » (à rendre dans un `<Ltr>` / `bdi dir="ltr"`). */
export function formatPercent(n: unknown, { maxDecimals = 0, signed = false }: FormatOptions = {}): string {
  return `${formatNumber(n, { maxDecimals, signed })}%`;
}
