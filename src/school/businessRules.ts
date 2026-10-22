/**
 * Règles métier paramétrées par école (`schools/{schoolId}/settings/system`).
 *
 * Remplace les valeurs codées en dur de la version mono-école :
 *   - cotisation 100 MAD, 70 MAD en juillet-août 2026 (getSubscriptionAmount) ;
 *   - ouverture officielle en juillet 2026 (isMonthBeforeJuly2026) ;
 *   - âge = 2026 - année de naissance.
 * Module pur : aucune dépendance au navigateur ni à Firebase.
 */
import type { FeeOverride, SystemSettings } from "../types";

export const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"] as const;

/** Cotisation utilisée quand l'école n'a rien paramétré (valeur historique). */
export const DEFAULT_MONTHLY_FEE = 100;
export const DEFAULT_STUDENT_ACCOUNT_MIN_AGE = 15;

type BusinessSettings = Partial<Pick<SystemSettings, "subscriptionFee" | "feeOverrides" | "openingYear" | "openingMonth" | "studentAccountMinAge">> | null | undefined;

export function monthIndex(month: string): number {
  return (MONTHS_AR as readonly string[]).indexOf(month);
}

/** Montant dû pour un mois donné : tarif particulier, sinon cotisation de l'école. */
export function getSubscriptionAmount(settings: BusinessSettings, month: string, year: number): number {
  const override = (settings?.feeOverrides || []).find((o: FeeOverride) => Number(o.year) === Number(year) && o.month === month);
  if (override && Number.isFinite(Number(override.amount))) return Number(override.amount);
  const fee = Number(settings?.subscriptionFee);
  return Number.isFinite(fee) && fee > 0 ? fee : DEFAULT_MONTHLY_FEE;
}

/** Vrai si le mois précède l'ouverture officielle de l'école (aucun paiement dû). */
export function isMonthBeforeOpening(settings: BusinessSettings, month: string, year: number): boolean {
  const openingYear = Number(settings?.openingYear);
  if (!Number.isFinite(openingYear) || openingYear <= 0) return false;
  if (year < openingYear) return true;
  if (year > openingYear) return false;
  const openingIdx = monthIndex(settings?.openingMonth || "");
  const idx = monthIndex(month);
  return openingIdx > 0 && idx !== -1 && idx < openingIdx;
}

/** Premier mois facturable : ouverture officielle (si paramétrée). */
export function getOpeningPeriod(settings: BusinessSettings): { year: number; month: string } | null {
  const year = Number(settings?.openingYear);
  if (!Number.isFinite(year) || year <= 0) return null;
  const month = settings?.openingMonth && monthIndex(settings.openingMonth) !== -1 ? settings.openingMonth : MONTHS_AR[0];
  return { year, month };
}

/** Mois à générer depuis la date d'inscription jusqu'au mois courant (hors période avant ouverture). */
export function getMonthsToGenerate(settings: BusinessSettings, registrationDateStr: string, now: Date = new Date()): { month: string; year: number }[] {
  const result: { month: string; year: number }[] = [];
  if (!registrationDateStr) return result;
  const parts = registrationDateStr.split("-");
  if (parts.length !== 3) return result;
  const regYear = parseInt(parts[0], 10);
  const regMonthNum = parseInt(parts[1], 10);
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  if (regYear > currentYear || (regYear === currentYear && regMonthNum > currentMonthNum)) {
    if (regMonthNum >= 1 && regMonthNum <= 12) result.push({ month: MONTHS_AR[regMonthNum - 1], year: regYear });
  } else {
    let y = regYear;
    let m = regMonthNum;
    while (y < currentYear || (y === currentYear && m <= currentMonthNum)) {
      if (m >= 1 && m <= 12) result.push({ month: MONTHS_AR[m - 1], year: y });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }
  return result.filter((item) => !isMonthBeforeOpening(settings, item.month, item.year));
}

/** Âge à la date donnée (au lieu de « 2026 - année de naissance »). */
export function computeAge(birthDate: string | undefined, now: Date = new Date()): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Valeurs par défaut des paramètres d'une nouvelle école. */
export function defaultSchoolSettings(name: string, now: Date = new Date()): SystemSettings {
  const year = now.getFullYear();
  const season = now.getMonth() >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  return {
    associationName: name,
    associationPhone: "",
    associationEmail: "",
    associationAddress: "",
    associationLogo: "",
    generalSupervisorName: "",
    directorName: "",
    subscriptionFee: DEFAULT_MONTHLY_FEE,
    currency: "درهم مغربي",
    allowSelfRegistration: false,
    showStampOnReceipts: true,
    stampText: "",
    activeAcademicSeason: season,
    receiptPrefixFormat: "REC-{YEAR}-{NO}",
    feeOverrides: [],
    openingYear: year,
    openingMonth: MONTHS_AR[now.getMonth()],
    studentAccountMinAge: DEFAULT_STUDENT_ACCOUNT_MIN_AGE,
  };
}
