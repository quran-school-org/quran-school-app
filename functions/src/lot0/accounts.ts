/**
 * Lot 0 — gestion des comptes (structure actuelle, collections à la racine).
 *
 * Callables réservées à un directeur (مدير) actif, vérifié via authLinks/{uid} :
 *   - createUserAccount  : compte Firebase Auth + appUsers + authLinks
 *   - resetUserPassword  : mot de passe provisoire + changement obligatoire
 * Aucun mot de passe n'est jamais écrit dans Firestore.
 */
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../admin.js";
import { FUNCTIONS_REGION } from "../config.js";
import {
  MIN_NEW_PASSWORD_LENGTH,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "../shared/accounts.js";
import { FAMILY_ROLES, isRole, type UserRole } from "../shared/roles.js";

const FLAG_KEYS = [
  "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
  "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
  "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
] as const;

const PERMISSION_ACTIONS = ["read", "create", "update", "delete", "print"] as const;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export interface CreateUserAccountInput {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  phone?: string;
  email?: string;
  permissions?: Record<string, Record<string, boolean>>;
  linkedTeacherId?: string;
  linkedStudentIds?: string[];
  flags?: Record<string, boolean>;
}

/** Vérifie que l'appelant est un directeur actif ; renvoie son uid. */
export async function requireDirector(request: CallableRequest<unknown>): Promise<string> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentification requise.");
  }
  const snap = await adminDb().collection("authLinks").doc(request.auth.uid).get();
  const link = snap.data();
  if (!snap.exists || link?.isActive !== true || link?.role !== "مدير") {
    throw new HttpsError("permission-denied", "Réservé au directeur.");
  }
  return request.auth.uid;
}

function assertString(value: unknown, field: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new HttpsError("invalid-argument", `Champ invalide : ${field}.`);
  }
  return value.trim();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < MIN_NEW_PASSWORD_LENGTH || password.length > 128 || password.trim() !== password) {
    throw new HttpsError("invalid-argument", `يجب أن تتكون كلمة المرور من ${MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل.`);
  }
  return password;
}

function sanitizePermissions(input: unknown): Record<string, Record<string, boolean>> | undefined {
  if (!input || typeof input !== "object") return undefined;
  const out: Record<string, Record<string, boolean>> = {};
  for (const [moduleId, perms] of Object.entries(input as Record<string, unknown>)) {
    if (!/^[a-z-]{1,40}$/.test(moduleId) || !perms || typeof perms !== "object") continue;
    const clean: Record<string, boolean> = {};
    for (const action of PERMISSION_ACTIONS) {
      const v = (perms as Record<string, unknown>)[action];
      if (typeof v === "boolean") clean[action] = v;
    }
    out[moduleId] = clean;
  }
  return out;
}

export function parseCreateInput(data: unknown): CreateUserAccountInput {
  if (!data || typeof data !== "object") throw new HttpsError("invalid-argument", "Requête invalide.");
  const d = data as Record<string, unknown>;
  const username = normalizeUsername(assertString(d.username, "username", 40));
  if (!isValidUsername(username)) {
    throw new HttpsError("invalid-argument", "اسم المستخدم غير صالح (حروف لاتينية صغيرة وأرقام و . _ - فقط).");
  }
  if (!isRole(d.role)) throw new HttpsError("invalid-argument", "Rôle inconnu.");
  const linkedStudentIds = Array.isArray(d.linkedStudentIds)
    ? d.linkedStudentIds.filter((x): x is string => typeof x === "string" && ID_PATTERN.test(x))
    : [];
  if (linkedStudentIds.length > 30) throw new HttpsError("invalid-argument", "30 élèves liés au maximum.");
  const linkedTeacherId = typeof d.linkedTeacherId === "string" && ID_PATTERN.test(d.linkedTeacherId) ? d.linkedTeacherId : undefined;
  const flags: Record<string, boolean> = {};
  if (d.flags && typeof d.flags === "object") {
    for (const key of FLAG_KEYS) {
      const v = (d.flags as Record<string, unknown>)[key];
      if (typeof v === "boolean") flags[key] = v;
    }
  }
  return {
    username,
    password: validatePassword(d.password),
    fullName: assertString(d.fullName, "fullName", 120),
    role: d.role,
    isActive: d.isActive !== false,
    phone: typeof d.phone === "string" ? d.phone.slice(0, 40) : undefined,
    email: typeof d.email === "string" ? d.email.slice(0, 120) : undefined,
    permissions: sanitizePermissions(d.permissions),
    linkedTeacherId: FAMILY_ROLES.includes(d.role) ? undefined : linkedTeacherId,
    linkedStudentIds: FAMILY_ROLES.includes(d.role) ? linkedStudentIds : [],
    flags,
  };
}

/** Cœur de createUserAccount (exporté pour les tests). */
export async function createUserAccountCore(callerUid: string, input: CreateUserAccountInput) {
  const db = adminDb();
  const auth = adminAuth();
  const email = usernameToEmail(input.username);

  const sameUsername = await db.collection("appUsers").where("username", "==", input.username).limit(1).get();
  if (!sameUsername.empty) throw new HttpsError("already-exists", "Nom d'utilisateur déjà utilisé.");
  try {
    await auth.getUserByEmail(email);
    throw new HttpsError("already-exists", "Nom d'utilisateur déjà utilisé.");
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const appUserId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userRecord = await auth.createUser({
    email,
    password: input.password,
    displayName: input.fullName,
    disabled: input.isActive === false,
  });

  const now = new Date().toISOString();
  try {
    const batch = db.batch();
    batch.set(db.collection("appUsers").doc(appUserId), {
      username: input.username,
      fullName: input.fullName,
      role: input.role,
      isActive: input.isActive !== false,
      isArchived: false,
      phone: input.phone ?? null,
      email: input.email ?? null,
      ...input.flags,
      permissions: input.permissions ?? null,
      linkedTeacherId: input.linkedTeacherId ?? null,
      linkedStudentIds: input.linkedStudentIds ?? [],
      authUid: userRecord.uid,
      authEmail: email,
      mustChangePassword: true,
      createdAt: now,
      createdBy: callerUid,
    });
    batch.set(db.collection("authLinks").doc(userRecord.uid), {
      appUserId,
      role: input.role,
      isActive: input.isActive !== false,
      username: input.username,
      linkedStudentIds: input.linkedStudentIds ?? [],
      linkedTeacherId: input.linkedTeacherId ?? null,
      updatedAt: now,
      updatedBy: callerUid,
    });
    await batch.commit();
  } catch (error) {
    // Retour arrière : pas de compte Auth orphelin.
    await auth.deleteUser(userRecord.uid).catch(() => undefined);
    throw error;
  }

  logger.info("createUserAccount", { appUserId, uid: userRecord.uid, role: input.role, by: callerUid });
  return { appUserId, uid: userRecord.uid };
}

/** Cœur de resetUserPassword (exporté pour les tests). */
export async function resetUserPasswordCore(callerUid: string, appUserId: string, newPassword: string) {
  const db = adminDb();
  const ref = db.collection("appUsers").doc(appUserId);
  const snap = await ref.get();
  const authUid = snap.data()?.authUid;
  if (!snap.exists || typeof authUid !== "string") {
    throw new HttpsError("not-found", "Compte introuvable ou non relié à Firebase Auth.");
  }
  await adminAuth().updateUser(authUid, { password: newPassword });
  await adminAuth().revokeRefreshTokens(authUid);
  await ref.set({
    mustChangePassword: true,
    passwordResetAt: new Date().toISOString(),
    passwordResetBy: callerUid,
    password: FieldValue.delete(),
  }, { merge: true });
  logger.info("resetUserPassword", { appUserId, by: callerUid });
  return { ok: true };
}

export const createUserAccount = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const callerUid = await requireDirector(request);
  const input = parseCreateInput(request.data);
  return createUserAccountCore(callerUid, input);
});

export const resetUserPassword = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const callerUid = await requireDirector(request);
  const data = (request.data || {}) as Record<string, unknown>;
  const appUserId = assertString(data.appUserId, "appUserId", 128);
  if (!ID_PATTERN.test(appUserId)) throw new HttpsError("invalid-argument", "Identifiant invalide.");
  const newPassword = validatePassword(data.newPassword);
  return resetUserPasswordCore(callerUid, appUserId, newPassword);
});
