/**
 * Format d'AFFICHAGE des dates (audit UX, constat 22, D100) : « 2026-10-01 »
 * devient « 1 أكتوبر 2026 ». Un seul formateur pour toute l'interface.
 *
 * - Les mois sont ceux de l'application (`MONTHS_AR` : « يوليوز », « غشت »…,
 *   graphie marocaine, la même que les listes de mois des cotisations et des
 *   salaires). Pas d'`Intl` : son orthographe des mois diffère (« شتنبر »).
 * - Chiffres occidentaux, jour sans zéro initial.
 * - La date est lue telle qu'elle est écrite (`AAAA-MM-JJ`, avec ou sans heure) :
 *   aucun décalage de fuseau horaire.
 * - Les valeurs STOCKÉES, les champs `<input type="date">`, les exports (CSV,
 *   JSON, PDF), l'impression et les numéros de reçus ne passent pas par ici.
 */
import { MONTHS_AR } from "../school/businessRules";

/** Texte affiché quand la date est absente ou illisible. */
export const DATE_FALLBACK = "—";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;

/** `[année, mois 1-12, jour]` d'une date `AAAA-MM-JJ` (heure ignorée), ou null si elle n'existe pas. */
function parseIsoDay(value: unknown): [number, number, number] | null {
  if (typeof value !== "string") return null;
  const m = ISO_DAY.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // dernier jour du mois (années bissextiles comprises)
  return d > last ? null : [y, mo, d];
}

/** « 2026-10-01 » -> « 1 أكتوبر 2026 ». Vide ou invalide : `fallback` (« — » par défaut). */
export function formatDateAr(iso: unknown, fallback: string = DATE_FALLBACK): string {
  const parts = parseIsoDay(iso);
  if (!parts) return fallback;
  const [y, mo, d] = parts;
  return `${d} ${MONTHS_AR[mo - 1]} ${y}`;
}

/**
 * Période : « 1 أكتوبر 2026 إلى 3 أكتوبر 2026 » ; la fin n'est écrite que si elle
 * existe et diffère du début.
 */
export function formatDateRangeAr(start: unknown, end?: unknown, fallback: string = DATE_FALLBACK): string {
  const from = formatDateAr(start, "");
  const to = formatDateAr(end, "");
  if (!from) return to || fallback;
  return to && to !== from ? `${from} إلى ${to}` : from;
}

/** Heure locale d'un horodatage ISO : « 14:05 » (chiffres latins, 24 h). */
export function formatTimeAr(iso: unknown, fallback: string = DATE_FALLBACK): string {
  if (typeof iso !== "string" || !/[T\s]\d{2}:\d{2}/.test(iso)) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** Date et heure (horodatage ISO, ex. dernière connexion) : « 1 أكتوبر 2026، 14:05 » (heure locale). */
export function formatDateTimeAr(iso: unknown, fallback: string = DATE_FALLBACK): string {
  if (typeof iso !== "string" || !parseIsoDay(iso)) return fallback;
  const time = formatTimeAr(iso, "");
  if (!time) return formatDateAr(iso, fallback);
  const date = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  const local = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  return `${formatDateAr(local, fallback)}، ${time}`;
}
