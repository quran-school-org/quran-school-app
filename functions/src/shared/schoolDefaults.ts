/**
 * Paramètres par défaut d'une nouvelle école (miroir de
 * src/school/businessRules.ts > defaultSchoolSettings, côté client).
 */
export const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"] as const;

export const SCHOOL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

export function defaultSchoolSettings(name: string, schoolId: string, now: Date = new Date()) {
  const year = now.getFullYear();
  const season = now.getMonth() >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  return {
    schoolId,
    associationName: name,
    associationPhone: "",
    associationEmail: "",
    associationAddress: "",
    associationLogo: "",
    generalSupervisorName: "",
    directorName: "",
    subscriptionFee: 100,
    currency: "درهم مغربي",
    allowSelfRegistration: false,
    showStampOnReceipts: true,
    stampText: "",
    activeAcademicSeason: season,
    receiptPrefixFormat: "REC-{YEAR}-{NO}",
    feeOverrides: [],
    openingYear: year,
    openingMonth: MONTHS_AR[now.getMonth()],
    studentAccountMinAge: 15,
  };
}
