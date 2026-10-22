/** Rôles applicatifs (valeurs en arabe, identiques à src/types.ts et firestore.rules). */
export const ALL_ROLES = [
  "مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر",
] as const;

export type UserRole = (typeof ALL_ROLES)[number];

export const FAMILY_ROLES: readonly UserRole[] = ["طالب", "ولي أمر"];

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}
