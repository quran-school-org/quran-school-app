/**
 * Miroir côté client des groupes de rôles des règles Firestore (firestore.rules).
 * Sert à n'ouvrir que les abonnements autorisés pour le rôle connecté.
 * La sécurité réelle reste dans les règles : ce module n'est qu'un confort.
 */
import type { UserRole } from "../types";

export const ALL_ROLES: UserRole[] = [
  "مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر",
];

export const OFFICE_ROLES: UserRole[] = ["مدير", "إداري"];
export const EDUCATOR_ROLES: UserRole[] = ["مدير", "إداري", "مؤطر", "مدرس"];
export const STAFF_ROLES: UserRole[] = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى"];
export const FAMILY_ROLES: UserRole[] = ["طالب", "ولي أمر"];

export const isOfficeRole = (role: UserRole | undefined | null) => !!role && OFFICE_ROLES.includes(role);
export const isEducatorRole = (role: UserRole | undefined | null) => !!role && EDUCATOR_ROLES.includes(role);
export const isStaffRole = (role: UserRole | undefined | null) => !!role && STAFF_ROLES.includes(role);
export const isFamilyRole = (role: UserRole | undefined | null) => !!role && FAMILY_ROLES.includes(role);
export const isDirectorRole = (role: UserRole | undefined | null) => role === "مدير";

/** Collections lisibles en entier (abonnement à toute la collection) pour un rôle. */
export function fullyReadableCollections(role: UserRole): string[] {
  const cols = new Set<string>(["classes", "activities"]);
  if (isEducatorRole(role)) {
    ["students", "teachers", "attendance", "grades", "dailyProgress", "activityParticipants", "activityExpenses"].forEach((c) => cols.add(c));
  }
  if (role === "متطوع") cols.add("activityParticipants");
  if (isStaffRole(role)) cols.add("notifications");
  if (isOfficeRole(role)) {
    ["payments", "otherIncomes", "expenses", "salaryPayments", "appUsers"].forEach((c) => cols.add(c));
  }
  return Array.from(cols);
}

/** Fiches RH du personnel (staffPrivate : salaire, CIN…) : bureau seulement (D42). */
export const canReadStaffPrivate = (role: UserRole | undefined | null) => isOfficeRole(role);

/** Collections lisibles par les familles, filtrées sur `studentId`. */
export const FAMILY_FILTERED_COLLECTIONS = ["attendance", "grades", "dailyProgress"];
