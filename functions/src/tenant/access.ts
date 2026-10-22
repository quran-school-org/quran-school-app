/**
 * Contrôles d'accès communs aux Cloud Functions multi-écoles.
 * L'appartenance `schools/{schoolId}/members/{uid}` fait foi (comme dans les
 * règles Firestore) ; le super-admin est un claim posé par l'Admin SDK.
 */
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

import { adminAuth, adminDb } from "../admin.js";
import { SCHOOL_ID_PATTERN } from "../shared/schoolDefaults.js";

export interface Caller {
  uid: string;
  superAdmin: boolean;
  member: FirebaseFirestore.DocumentData | null;
}

export function requireAuth(request: CallableRequest<unknown>): { uid: string; superAdmin: boolean } {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentification requise.");
  return { uid: request.auth.uid, superAdmin: request.auth.token?.superAdmin === true };
}

export function assertSchoolId(value: unknown): string {
  if (typeof value !== "string" || !SCHOOL_ID_PATTERN.test(value)) {
    throw new HttpsError("invalid-argument", "معرّف المدرسة غير صالح.");
  }
  return value;
}

export async function getMember(schoolId: string, uid: string) {
  const snap = await adminDb().collection("schools").doc(schoolId).collection("members").doc(uid).get();
  return snap.exists ? snap.data()! : null;
}

/** L'appelant est super-admin, ou membre actif de l'école avec un des rôles donnés. */
export async function requireSchoolRole(request: CallableRequest<unknown>, schoolId: string, roles: string[]): Promise<Caller> {
  const { uid, superAdmin } = requireAuth(request);
  const member = await getMember(schoolId, uid);
  if (superAdmin) return { uid, superAdmin, member };
  if (!member || member.isActive !== true || !roles.includes(member.role)) {
    throw new HttpsError("permission-denied", "ليست لديك صلاحية تنفيذ هذه العملية في هذه المدرسة.");
  }
  return { uid, superAdmin, member };
}

/** Vrai si l'uid est membre ACTIF d'au moins une école. */
export async function hasAnyActiveMembership(uid: string): Promise<boolean> {
  const user = await adminDb().collection("users").doc(uid).get();
  const schoolIds: string[] = Array.isArray(user.data()?.schoolIds) ? user.data()!.schoolIds : [];
  for (const s of schoolIds) {
    const m = await getMember(s, uid);
    if (m?.isActive === true) return true;
  }
  return false;
}

/**
 * Vrai si le compte porte le claim super-admin. Un tel compte n'est JAMAIS
 * désactivé automatiquement (retrait de sa dernière école, archivage d'une
 * fiche liée) : sinon le directeur d'une école dont le super-admin est membre
 * pourrait bloquer l'administration de la plateforme (revue, D72).
 */
export async function isSuperAdminAccount(uid: string): Promise<boolean> {
  try {
    return (await adminAuth().getUser(uid)).customClaims?.superAdmin === true;
  } catch {
    return false;
  }
}
