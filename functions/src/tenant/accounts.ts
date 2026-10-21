/**
 * Gestion des écoles et des comptes (multi-écoles). Callables :
 *   - createSchool      : super-admin ; crée l'école et ses paramètres par défaut
 *   - createSchoolUser  : directeur de l'école ou super-admin ; crée un compte
 *                         (Auth + users + members) ou rattache un compte existant
 *   - resetUserPassword : directeur ou super-admin ; jamais sur un compte partagé
 *                         avec une école que l'appelant ne dirige pas
 *   - setMemberRole     : directeur ou super-admin ; rôle, statut, droits, liens,
 *                         ou retrait de l'école
 * Les noms d'utilisateur sont uniques sur toute la plateforme (registre
 * `usernames/{username}`). Aucun mot de passe n'est jamais écrit dans Firestore.
 */
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../admin.js";
import { FUNCTIONS_REGION } from "../config.js";
import {
  MIN_NEW_PASSWORD_LENGTH,
  NEW_ACCOUNTS_EMAIL_DOMAIN,
  isValidUsername,
  loginEmailCandidates,
  normalizeUsername,
  usernameToEmail,
} from "../shared/accounts.js";
import { FAMILY_ROLES, isRole, type UserRole } from "../shared/roles.js";
import { defaultSchoolSettings } from "../shared/schoolDefaults.js";
import { assertSchoolId, getMember, requireAuth, requireSchoolRole } from "./access.js";

const FLAG_KEYS = [
  "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
  "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
  "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
] as const;
const PERMISSION_ACTIONS = ["read", "create", "update", "delete", "print"] as const;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const DIRECTOR_ROLES = ["مدير"];

function str(value: unknown, field: string, max = 200, required = true): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpsError("invalid-argument", `Champ manquant : ${field}.`);
    return undefined;
  }
  if (typeof value !== "string" || value.length > max) throw new HttpsError("invalid-argument", `Champ invalide : ${field}.`);
  return value.trim();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < MIN_NEW_PASSWORD_LENGTH || password.length > 128 || password.trim() !== password) {
    throw new HttpsError("invalid-argument", `يجب أن تتكون كلمة المرور من ${MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل.`);
  }
  return password;
}

function sanitizePermissions(input: unknown): Record<string, Record<string, boolean>> | null {
  if (!input || typeof input !== "object") return null;
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

function sanitizeFlags(input: unknown): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  if (input && typeof input === "object") {
    for (const key of FLAG_KEYS) {
      const v = (input as Record<string, unknown>)[key];
      if (typeof v === "boolean") flags[key] = v;
    }
  }
  return flags;
}

function sanitizeLinks(role: UserRole, linkedTeacherId: unknown, linkedStudentIds: unknown) {
  const students = Array.isArray(linkedStudentIds)
    ? linkedStudentIds.filter((x): x is string => typeof x === "string" && ID_PATTERN.test(x))
    : [];
  if (students.length > 30) throw new HttpsError("invalid-argument", "30 élèves liés au maximum.");
  const teacher = typeof linkedTeacherId === "string" && ID_PATTERN.test(linkedTeacherId) ? linkedTeacherId : null;
  const family = FAMILY_ROLES.includes(role);
  return { linkedTeacherId: family ? null : teacher, linkedStudentIds: family ? Array.from(new Set(students)) : [] };
}

/** uid d'un nom d'utilisateur existant (registre, puis comptes Auth des deux domaines). */
export async function findUidByUsername(username: string): Promise<string | null> {
  const reg = await adminDb().collection("usernames").doc(username).get();
  if (reg.exists && typeof reg.data()?.uid === "string") return reg.data()!.uid;
  for (const email of loginEmailCandidates(username)) {
    try {
      return (await adminAuth().getUserByEmail(email)).uid;
    } catch (e: any) {
      if (e?.code !== "auth/user-not-found") throw e;
    }
  }
  return null;
}

// ---------------------------------------------------------------- createSchool

export async function createSchoolCore(callerUid: string, data: Record<string, unknown>) {
  const schoolId = assertSchoolId(data.schoolId);
  const name = str(data.name, "name", 120)!;
  const makeMeDirector = data.makeMeDirector === true;
  const db = adminDb();
  const now = new Date().toISOString();
  const schoolRef = db.collection("schools").doc(schoolId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(schoolRef);
    if (existing.exists) throw new HttpsError("already-exists", "Cette école existe déjà.");
    const callerUser = makeMeDirector ? await tx.get(db.collection("users").doc(callerUid)) : null;
    tx.set(schoolRef, { name, slug: schoolId, status: "active", createdAt: now, createdBy: callerUid });
    tx.set(schoolRef.collection("settings").doc("system"), defaultSchoolSettings(name, schoolId));
    if (makeMeDirector) {
      const authUser = await adminAuth().getUser(callerUid);
      const username = callerUser?.data()?.username || (authUser.email || "").split("@")[0];
      tx.set(schoolRef.collection("members").doc(callerUid), {
        schoolId, uid: callerUid, username, fullName: authUser.displayName || username,
        role: "مدير", isActive: true, isArchived: false, permissions: null,
        linkedTeacherId: null, linkedStudentIds: [], createdAt: now, createdBy: callerUid,
      });
      tx.set(db.collection("users").doc(callerUid), {
        username, schoolIds: FieldValue.arrayUnion(schoolId), lastSchoolId: schoolId,
      }, { merge: true });
    }
  });
  logger.info("createSchool", { schoolId, by: callerUid });
  return { schoolId };
}

export const createSchool = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const { uid, superAdmin } = requireAuth(request);
  if (!superAdmin) throw new HttpsError("permission-denied", "إنشاء المدارس مخصص للمشرف العام للمنصة.");
  return createSchoolCore(uid, (request.data || {}) as Record<string, unknown>);
});

// ------------------------------------------------------------ createSchoolUser

export async function createSchoolUserCore(callerUid: string, data: Record<string, unknown>) {
  const schoolId = assertSchoolId(data.schoolId);
  const username = normalizeUsername(str(data.username, "username", 40)!);
  if (!isValidUsername(username)) {
    throw new HttpsError("invalid-argument", "اسم المستخدم غير صالح (حروف لاتينية صغيرة وأرقام و . _ - فقط).");
  }
  if (!isRole(data.role)) throw new HttpsError("invalid-argument", "Rôle inconnu.");
  const role = data.role;
  const fullName = str(data.fullName, "fullName", 120)!;
  const links = sanitizeLinks(role, data.linkedTeacherId, data.linkedStudentIds);
  const db = adminDb();
  const auth = adminAuth();
  const now = new Date().toISOString();
  const memberBase = {
    schoolId,
    username,
    fullName,
    role,
    isActive: data.isActive !== false,
    isArchived: false,
    phone: str(data.phone, "phone", 40, false) ?? null,
    email: str(data.email, "email", 120, false) ?? null,
    permissions: sanitizePermissions(data.permissions),
    ...sanitizeFlags(data.flags),
    ...links,
    createdAt: now,
    createdBy: callerUid,
  };

  // Rattacher un compte existant (même personne dans plusieurs écoles).
  if (data.attachExisting === true) {
    const uid = await findUidByUsername(username);
    if (!uid) throw new HttpsError("not-found", "لا يوجد حساب بهذا الاسم.");
    if (await getMember(schoolId, uid)) throw new HttpsError("already-exists", "هذا الحساب عضو في هذه المدرسة من قبل.");
    await db.collection("schools").doc(schoolId).collection("members").doc(uid).set({ ...memberBase, uid });
    await db.collection("users").doc(uid).set({ username, schoolIds: FieldValue.arrayUnion(schoolId) }, { merge: true });
    await auth.updateUser(uid, { disabled: false });
    logger.info("createSchoolUser.attach", { schoolId, uid, role, by: callerUid });
    return { uid, username };
  }

  const password = validatePassword(data.password);
  if (await findUidByUsername(username)) throw new HttpsError("already-exists", "Nom d'utilisateur déjà utilisé.");
  const email = usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN);
  const record = await auth.createUser({ email, password, displayName: fullName, disabled: data.isActive === false });
  try {
    await db.runTransaction(async (tx) => {
      const regRef = db.collection("usernames").doc(username);
      if ((await tx.get(regRef)).exists) throw new HttpsError("already-exists", "Nom d'utilisateur déjà utilisé.");
      tx.set(regRef, { uid: record.uid, email, createdAt: now });
      tx.set(db.collection("users").doc(record.uid), {
        username, displayName: fullName, schoolIds: [schoolId], lastSchoolId: schoolId,
        mustChangePassword: true, createdAt: now, createdBy: callerUid,
      });
      tx.set(db.collection("schools").doc(schoolId).collection("members").doc(record.uid), { ...memberBase, uid: record.uid });
    });
  } catch (error) {
    await auth.deleteUser(record.uid).catch(() => undefined); // pas de compte Auth orphelin
    throw error;
  }
  logger.info("createSchoolUser", { schoolId, uid: record.uid, role, by: callerUid });
  return { uid: record.uid, username };
}

export const createSchoolUser = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, unknown>;
  const schoolId = assertSchoolId(data.schoolId);
  const caller = await requireSchoolRole(request, schoolId, DIRECTOR_ROLES);
  return createSchoolUserCore(caller.uid, data);
});

// ------------------------------------------------------------ resetUserPassword

export async function resetUserPasswordCore(caller: { uid: string; superAdmin: boolean }, schoolId: string, uid: string, newPassword: string) {
  const db = adminDb();
  const target = await getMember(schoolId, uid);
  if (!target) throw new HttpsError("not-found", "Compte introuvable dans cette école.");
  if (!caller.superAdmin) {
    const authUser = await adminAuth().getUser(uid);
    if (authUser.customClaims?.superAdmin === true) {
      throw new HttpsError("permission-denied", "لا يمكن إعادة تعيين كلمة مرور المشرف العام.");
    }
    // Un compte présent dans plusieurs écoles : il faut diriger TOUTES ces écoles,
    // sinon un directeur pourrait prendre le contrôle du compte d'une autre école.
    const schoolIds: string[] = (await db.collection("users").doc(uid).get()).data()?.schoolIds || [schoolId];
    for (const s of schoolIds) {
      const m = await getMember(s, caller.uid);
      if (!m || m.isActive !== true || m.role !== "مدير") {
        throw new HttpsError("permission-denied", "هذا الحساب مرتبط بمدرسة أخرى: إعادة تعيين كلمة المرور من صلاحية المشرف العام.");
      }
    }
  }
  await adminAuth().updateUser(uid, { password: newPassword });
  await adminAuth().revokeRefreshTokens(uid);
  await db.collection("users").doc(uid).set({ mustChangePassword: true, passwordResetAt: new Date().toISOString(), passwordResetBy: caller.uid }, { merge: true });
  logger.info("resetUserPassword", { schoolId, uid, by: caller.uid });
  return { ok: true };
}

export const resetUserPassword = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, unknown>;
  const schoolId = assertSchoolId(data.schoolId);
  const uid = str(data.uid, "uid", 128)!;
  const newPassword = validatePassword(data.newPassword);
  const caller = await requireSchoolRole(request, schoolId, DIRECTOR_ROLES);
  return resetUserPasswordCore(caller, schoolId, uid, newPassword);
});

// ----------------------------------------------------------------- setMemberRole

export async function setMemberRoleCore(caller: { uid: string; superAdmin: boolean }, schoolId: string, uid: string, patch: Record<string, unknown>, remove: boolean) {
  const db = adminDb();
  const ref = db.collection("schools").doc(schoolId).collection("members").doc(uid);
  const current = (await ref.get()).data();
  if (!current) throw new HttpsError("not-found", "Compte introuvable dans cette école.");

  const self = caller.uid === uid;
  const protectedDirector = current.legacyAppUserId === "u1";
  const nextRole = patch.role === undefined ? current.role : patch.role;
  if (!isRole(nextRole)) throw new HttpsError("invalid-argument", "Rôle inconnu.");
  const demotes = nextRole !== current.role || patch.isActive === false || remove;
  if (!caller.superAdmin && demotes && self) {
    throw new HttpsError("failed-precondition", "لا يمكنك تغيير دورك أو إيقاف حسابك أو حذفه بنفسك.");
  }
  if (!caller.superAdmin && demotes && protectedDirector) {
    throw new HttpsError("failed-precondition", "حساب المدير الأساسي محمي: لا يغيّره إلا المشرف العام.");
  }

  if (remove) {
    await ref.delete();
    const userRef = db.collection("users").doc(uid);
    const user = (await userRef.get()).data();
    const remaining: string[] = (user?.schoolIds || []).filter((s: string) => s !== schoolId);
    await userRef.set({
      schoolIds: FieldValue.arrayRemove(schoolId),
      ...(user?.lastSchoolId === schoolId ? { lastSchoolId: remaining[0] ?? null } : {}),
    }, { merge: true });
    if (remaining.length === 0) {
      await adminAuth().updateUser(uid, { disabled: true }).catch(() => undefined);
      await adminAuth().revokeRefreshTokens(uid).catch(() => undefined);
    }
    logger.info("setMemberRole.remove", { schoolId, uid, by: caller.uid });
    return { ok: true };
  }

  const update: Record<string, unknown> = { role: nextRole, updatedAt: new Date().toISOString(), updatedBy: caller.uid };
  if (patch.fullName !== undefined) update.fullName = str(patch.fullName, "fullName", 120);
  if (patch.phone !== undefined) update.phone = str(patch.phone, "phone", 40, false) ?? null;
  if (patch.email !== undefined) update.email = str(patch.email, "email", 120, false) ?? null;
  if (patch.roleTitle !== undefined) update.roleTitle = str(patch.roleTitle, "roleTitle", 120, false) ?? null;
  if (patch.category !== undefined) update.category = str(patch.category, "category", 80, false) ?? null;
  if (typeof patch.isActive === "boolean") update.isActive = patch.isActive;
  if (typeof patch.isArchived === "boolean") update.isArchived = patch.isArchived;
  if (patch.permissions !== undefined) update.permissions = sanitizePermissions(patch.permissions);
  if (patch.flags !== undefined) Object.assign(update, sanitizeFlags(patch.flags));
  if (patch.linkedTeacherId !== undefined || patch.linkedStudentIds !== undefined || nextRole !== current.role) {
    Object.assign(update, sanitizeLinks(nextRole,
      patch.linkedTeacherId !== undefined ? patch.linkedTeacherId : current.linkedTeacherId,
      patch.linkedStudentIds !== undefined ? patch.linkedStudentIds : current.linkedStudentIds));
  }
  await ref.set(update, { merge: true });
  logger.info("setMemberRole", { schoolId, uid, role: nextRole, by: caller.uid });
  return { ok: true };
}

export const setMemberRole = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, unknown>;
  const schoolId = assertSchoolId(data.schoolId);
  const uid = str(data.uid, "uid", 128)!;
  const patch = data.patch && typeof data.patch === "object" ? (data.patch as Record<string, unknown>) : {};
  const caller = await requireSchoolRole(request, schoolId, DIRECTOR_ROLES);
  return setMemberRoleCore(caller, schoolId, uid, patch, data.remove === true);
});
