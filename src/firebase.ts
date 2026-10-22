import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  writeBatch,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type UserCredential,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import type { SystemSettings, AppUser, UserProfile, SchoolInfo } from "./types";
import { firebaseWebConfig, firestoreDatabaseId, emulatorConfig, apiBaseUrl } from "./config/env";
import { loginEmailCandidates, normalizeAuthPassword, normalizeUsername } from "./security/accounts";
import { getCacheScope, scopedKey } from "./cache/localCache";
import { STAFF_PRIVATE_COLLECTION, STAFF_PRIVATE_FIELDS, mergeStaffRecords, splitStaffRecord, stripStaffPrivate } from "./security/staffPrivate";

/** Région des Cloud Functions (identique à functions/src/config.ts). */
export const FUNCTIONS_REGION = "europe-west1";

// Configuration web Firebase lue depuis les variables VITE_* (voir .env.example).
const app = initializeApp(firebaseWebConfig);

// Base Firestore (base nommée en prod, "(default)" sur les émulateurs).
export const db = firestoreDatabaseId === "(default)"
  ? getFirestore(app)
  : getFirestore(app, firestoreDatabaseId);

export const auth = getAuth(app);

export const functions = getFunctions(app, FUNCTIONS_REGION);

// Connexion automatique aux émulateurs locaux (VITE_USE_EMULATORS=true).
if (emulatorConfig.enabled) {
  connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestorePort);
  connectAuthEmulator(auth, `http://${emulatorConfig.host}:${emulatorConfig.authPort}`, { disableWarnings: true });
  connectFunctionsEmulator(functions, emulatorConfig.host, emulatorConfig.functionsPort);
  console.info(`[firebase] Émulateurs actifs (projet ${firebaseWebConfig.projectId}).`);
}

// ---------------------------------------------------------------------------
// Chemins multi-écoles : toutes les données métier vivent sous schools/{schoolId}/…
// ---------------------------------------------------------------------------

function assertSchoolId(schoolId: string): string {
  if (!schoolId || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(schoolId)) {
    throw new Error(`Identifiant d'école invalide : « ${schoolId} »`);
  }
  return schoolId;
}

export function schoolCollection(schoolId: string, collectionName: string) {
  return collection(db, "schools", assertSchoolId(schoolId), collectionName);
}

export function schoolDocRef(schoolId: string, collectionName: string, id: string) {
  return doc(db, "schools", assertSchoolId(schoolId), collectionName, id);
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------
// La connexion se fait TOUJOURS par Firebase Auth, avant toute lecture. Aucun
// mot de passe n'est comparé ni stocké côté client, aucun compte n'est créé à
// la connexion.

/**
 * Connexion par nom d'utilisateur (unique sur la plateforme) : essai du domaine
 * historique `@alfajr.local`, puis du domaine des nouveaux comptes ; mot de
 * passe complété par `_secure_fajr` s'il fait moins de 6 caractères.
 */
export async function signInWithUsername(username: string, password: string): Promise<UserCredential> {
  const emails = loginEmailCandidates(normalizeUsername(username));
  const passwords = Array.from(new Set([password, password.trim()])).filter((p) => p.length > 0);
  let lastError: unknown = null;
  for (const email of emails) {
    for (const candidate of passwords) {
      try {
        return await signInWithEmailAndPassword(auth, email, normalizeAuthPassword(candidate));
      } catch (error: any) {
        lastError = error;
        const code = error?.code;
        if (code !== "auth/invalid-credential" && code !== "auth/wrong-password" && code !== "auth/user-not-found") {
          throw error;
        }
      }
    }
  }
  throw lastError;
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

/** Le compte connecté porte-t-il le claim super-admin de la plateforme ? */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const token = await user.getIdTokenResult();
  return token.claims.superAdmin === true;
}

/**
 * Changement de SON propre mot de passe. Firebase exige parfois une
 * authentification récente : on la refait avec le mot de passe actuel si fourni.
 */
export async function changeOwnPassword(newPassword: string, currentPassword?: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("not-signed-in");
  try {
    await updatePassword(user, newPassword);
  } catch (error: any) {
    if (error?.code === "auth/requires-recent-login" && currentPassword) {
      const credential = EmailAuthProvider.credential(user.email, normalizeAuthPassword(currentPassword));
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return;
    }
    throw error;
  }
}

/** Retire tout champ `password` hérité d'un objet compte. */
export function stripPassword<T extends Record<string, any>>(user: T): T {
  if (user && "password" in user) {
    const { password: _ignored, ...rest } = user as any;
    return rest as T;
  }
  return user;
}

/** Profil global `users/{uid}` (lisible par son propriétaire). */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

/** Appartenance `schools/{schoolId}/members/{uid}`. */
export async function fetchMember(schoolId: string, uid: string): Promise<AppUser | null> {
  const snap = await getDoc(schoolDocRef(schoolId, "members", uid));
  return snap.exists() ? stripPassword({ id: snap.id, ...snap.data() } as AppUser) : null;
}

export async function fetchSchool(schoolId: string): Promise<SchoolInfo | null> {
  const snap = await getDoc(doc(db, "schools", assertSchoolId(schoolId)));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SchoolInfo) : null;
}

/** Toutes les écoles (super-admin uniquement, imposé par les règles). */
export async function listAllSchools(): Promise<SchoolInfo[]> {
  const snap = await getDocs(collection(db, "schools"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolInfo));
}

/** Champs anodins de son profil global (école mémorisée, mot de passe changé…). */
export async function updateOwnUserFields(uid: string, fields: Partial<Pick<UserProfile, "lastSchoolId" | "mustChangePassword" | "passwordChangedAt" | "lastLogin">>) {
  await setDoc(doc(db, "users", uid), sanitizeForFirestore(fields), { merge: true });
}

/** Champs anodins de son appartenance à une école (nom affiché, dernière connexion). */
export async function updateOwnMemberFields(schoolId: string, uid: string, fields: Partial<Pick<AppUser, "lastLogin" | "fullName" | "phone">>) {
  await setDoc(schoolDocRef(schoolId, "members", uid), sanitizeForFirestore(fields), { merge: true });
}

/** ID token de l'utilisateur connecté (appels authentifiés à la fonction `api`). */
export async function getIdToken(): Promise<string | null> {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

/** URL de base de la fonction HTTP `api` (même origine en prod via le rewrite Hosting). */
export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

/** Erreur d'appel au rapport IA, avec un message arabe prêt à afficher. */
export class AiReportError extends Error {
  constructor(public readonly status: number, public readonly userMessage: string) {
    super(`ai-report-${status}`);
  }
}

/** Message arabe selon le code HTTP de la fonction `api` (429 quota, 413 taille…). */
export function describeAiReportStatus(status: number): string {
  if (status === 429) return "تم بلوغ الحد المسموح به من تقارير الذكاء الاصطناعي لهذا اليوم. يرجى المحاولة لاحقاً.";
  if (status === 413) return "بيانات الطالب طويلة جداً لإنشاء التقرير. يرجى اختصار الملاحظات.";
  if (status === 401) return "انتهت الجلسة. يرجى تسجيل الدخول من جديد.";
  if (status === 403) return "ليست لديك صلاحية إنشاء تقرير الذكاء الاصطناعي في هذه المدرسة.";
  return "عذراً، حدث خطأ أثناء تشغيل محرك الذكاء الاصطناعي. الرجاء إعادة المحاولة.";
}

/**
 * Rapport pédagogique IA d'un élève (fonction `api`, POST /api/gemini/analyze).
 * Jeton Firebase joint ; en cas d'échec, lève AiReportError (message arabe).
 */
export async function requestAiReport<T = unknown>(input: {
  schoolId: string;
  studentName: string;
  hizbCount?: number;
  tajweedLevel?: string;
  age?: number | string | null;
  notes?: string;
  attendanceRate?: number;
  recentGrades?: string;
}): Promise<T> {
  const idToken = await getIdToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/gemini/analyze"), { method: "POST", headers, body: JSON.stringify(input) });
  } catch {
    throw new AiReportError(0, "تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.");
  }
  if (!res.ok) throw new AiReportError(res.status, describeAiReportStatus(res.status));
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Cloud Functions callables (gestion des écoles et des comptes)
// ---------------------------------------------------------------------------

export interface CreateSchoolUserInput {
  schoolId: string;
  username: string;
  password?: string;
  attachExisting?: boolean;
  fullName: string;
  role: AppUser["role"];
  isActive?: boolean;
  phone?: string;
  email?: string;
  permissions?: AppUser["permissions"];
  linkedTeacherId?: string;
  linkedStudentIds?: string[];
  flags?: Record<string, boolean>;
}

export interface MemberPatch {
  fullName?: string;
  role?: AppUser["role"];
  isActive?: boolean;
  phone?: string;
  email?: string;
  permissions?: AppUser["permissions"];
  linkedTeacherId?: string | null;
  linkedStudentIds?: string[];
  roleTitle?: string | null;
  category?: string | null;
  isArchived?: boolean;
  flags?: Record<string, boolean>;
}

async function call<I, O>(name: string, input: I): Promise<O> {
  const callable = httpsCallable<I, O>(functions, name);
  const res = await callable(input);
  return res.data;
}

export const createSchoolRemote = (input: { schoolId: string; name: string; makeMeDirector?: boolean }) =>
  call<typeof input, { schoolId: string }>("createSchool", input);

export const createSchoolUserRemote = (input: CreateSchoolUserInput) =>
  call<CreateSchoolUserInput, { uid: string; username: string }>("createSchoolUser", input);

export const resetUserPasswordRemote = (schoolId: string, uid: string, newPassword: string) =>
  call<{ schoolId: string; uid: string; newPassword: string }, { ok: boolean }>("resetUserPassword", { schoolId, uid, newPassword });

export const setMemberRoleRemote = (schoolId: string, uid: string, patch: MemberPatch, remove = false) =>
  call<{ schoolId: string; uid: string; patch: MemberPatch; remove: boolean }, { ok: boolean }>("setMemberRole", { schoolId, uid, patch, remove });

/** Traduit une erreur Firebase (Auth, Functions) en message arabe lisible. */
export function describeFirebaseError(error: any): string {
  const code: string = error?.code || "";
  if (code.includes("already-exists") || code === "auth/email-already-exists") return "اسم المستخدم مستعمل من قبل حساب آخر.";
  if (code.includes("permission-denied")) return error?.message && /[؀-ۿ]/.test(error.message) ? error.message : "ليست لديك صلاحية تنفيذ هذه العملية.";
  if (code.includes("invalid-argument") || code.includes("failed-precondition")) return error?.message || "بيانات غير صالحة.";
  if (code.includes("not-found")) return "العنصر المطلوب غير موجود.";
  if (code.includes("unauthenticated")) return "يجب تسجيل الدخول أولاً.";
  if (code === "auth/weak-password") return "كلمة المرور ضعيفة جداً.";
  if (code === "auth/requires-recent-login") return "يرجى إدخال كلمة المرور الحالية لتأكيد العملية.";
  if (code === "auth/network-request-failed" || code.includes("unavailable")) return "تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.";
  if (code === "auth/too-many-requests") return "محاولات كثيرة. يرجى المحاولة لاحقاً.";
  return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
}

// Global state to track Firestore Quota Exceeded
let quotaExceededState = false;
const quotaListeners = new Set<(exceeded: boolean) => void>();

export function isFirestoreQuotaExceeded() {
  return quotaExceededState;
}

export function subscribeToQuotaState(listener: (exceeded: boolean) => void) {
  quotaListeners.add(listener);
  listener(quotaExceededState);
  return () => {
    quotaListeners.delete(listener);
  };
}

export function setFirestoreQuotaExceeded(exceeded: boolean) {
  if (quotaExceededState !== exceeded) {
    quotaExceededState = exceeded;
    quotaListeners.forEach((listener) => listener(exceeded));
  }
}

// Helper to check if an error is a quota error
export function checkAndHandleQuotaError(error: any) {
  if (!error) return;
  const errMsg = String(error.message || error || "").toLowerCase();
  if (
    error.code === "resource-exhausted" ||
    error.code === "quota-exceeded" ||
    errMsg.includes("quota exceeded") ||
    errMsg.includes("quota limit exceeded") ||
    errMsg.includes("resource exhausted") ||
    errMsg.includes("quota_exceeded")
  ) {
    setFirestoreQuotaExceeded(true);
  }
}

// Helper to remove undefined values recursively so Firestore setDoc doesn't fail
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Enregistre un document dans `schools/{schoolId}/{collection}/{id}`.
 * Le champ `schoolId` est dénormalisé dans chaque document (vérifié par les règles).
 */
export async function saveToFirestore(schoolId: string, collectionName: string, id: string, data: any) {
  try {
    const sanitizedData = sanitizeForFirestore(stripPassword({ ...data }));
    await setDoc(schoolDocRef(schoolId, collectionName, id), { ...sanitizedData, schoolId }, { merge: true });
  } catch (error) {
    console.error(`Error saving to Firestore ${schoolId}/${collectionName}/${id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

/** Supprime `schools/{schoolId}/{collection}/{id}`. */
export async function deleteFromFirestore(schoolId: string, collectionName: string, id: string) {
  try {
    await deleteDoc(schoolDocRef(schoolId, collectionName, id));
  } catch (error) {
    console.error(`Error deleting from Firestore ${schoolId}/${collectionName}/${id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

function writeCache(schoolId: string, cacheName: string, items: unknown) {
  // Seule l'école ACTIVE écrit son cache : après déconnexion ou changement
  // d'école, un dernier instantané de l'école quittée est ignoré.
  if (getCacheScope() !== schoolId) return;
  try {
    let sanitizedItems: any = items;
    if (cacheName.replace(/^alfajr_/, "") === "notifications" && Array.isArray(items)) {
      sanitizedItems = items.slice(-20);
    }
    localStorage.setItem(scopedKey(cacheName), JSON.stringify(sanitizedItems));
  } catch (e) {
    console.error(`Error saving synced data to LocalStorage (${cacheName}):`, e);
  }
}

/** Abonnement temps réel à toute une collection de l'école (rôles autorisés). */
export function subscribeToCollection<T extends { id: string }>(
  schoolId: string,
  collectionName: string,
  onUpdate: (data: T[]) => void,
  cacheName: string
) {
  return onSnapshot(schoolCollection(schoolId, collectionName), (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((d) => {
      items.push(stripPassword({ id: d.id, ...d.data() } as T & Record<string, any>));
    });
    writeCache(schoolId, cacheName, items);
    onUpdate(items);
  }, (error) => {
    console.error(`Error in real-time sync for ${schoolId}/${collectionName}:`, error);
    checkAndHandleQuotaError(error);
  });
}

/**
 * Abonnement à une liste de documents précis (comptes famille : élèves liés).
 * Les règles n'autorisent que la lecture document par document.
 */
export function subscribeToDocumentsByIds<T extends { id: string }>(
  schoolId: string,
  collectionName: string,
  ids: string[],
  onUpdate: (data: T[]) => void,
  cacheName: string
) {
  const current = new Map<string, T>();
  const emit = () => {
    const items = ids.map((id) => current.get(id)).filter((x): x is T => !!x);
    writeCache(schoolId, cacheName, items);
    onUpdate(items);
  };
  if (ids.length === 0) {
    emit();
    return () => {};
  }
  const unsubs = ids.map((id) =>
    onSnapshot(schoolDocRef(schoolId, collectionName, id), (snap) => {
      if (snap.exists()) current.set(id, { id: snap.id, ...(snap.data() as DocumentData) } as T);
      else current.delete(id);
      emit();
    }, (error) => {
      console.error(`Error in real-time sync for ${schoolId}/${collectionName}/${id}:`, error);
      checkAndHandleQuotaError(error);
    })
  );
  return () => unsubs.forEach((u) => u());
}

/**
 * Abonnement filtré `where(field, "in", values)` (comptes famille). Firestore
 * limite `in` à 30 valeurs : la liste est découpée en paquets.
 */
export function subscribeToQueryIn<T extends { id: string }>(
  schoolId: string,
  collectionName: string,
  field: string,
  values: string[],
  onUpdate: (data: T[]) => void,
  cacheName: string
) {
  if (values.length === 0) {
    writeCache(schoolId, cacheName, []);
    onUpdate([]);
    return () => {};
  }
  const chunks: string[][] = [];
  for (let i = 0; i < values.length; i += 30) chunks.push(values.slice(i, i + 30));
  const parts = new Map<number, T[]>();
  const unsubs = chunks.map((chunk, index) =>
    onSnapshot(query(schoolCollection(schoolId, collectionName), where(field, "in", chunk)), (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as T));
      parts.set(index, items);
      const all = Array.from(parts.values()).flat();
      writeCache(schoolId, cacheName, all);
      onUpdate(all);
    }, (error) => {
      console.error(`Error in filtered sync for ${schoolId}/${collectionName}:`, error);
      checkAndHandleQuotaError(error);
    })
  );
  return () => unsubs.forEach((u) => u());
}

/** Abonnement à un document unique (chemin libre : profil, appartenance…). */
export function subscribeToDocument<T>(pathSegments: string[], onUpdate: (data: T | null) => void) {
  const [first, ...rest] = pathSegments;
  return onSnapshot(doc(db, first, ...rest), (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
  }, (error) => {
    console.error(`Error in real-time sync for ${pathSegments.join("/")}:`, error);
    checkAndHandleQuotaError(error);
  });
}

/** Paramètres de l'école : `schools/{schoolId}/settings/system`. */
export function subscribeToSettings(
  schoolId: string,
  onUpdate: (settings: SystemSettings) => void,
  cacheName: string
) {
  return onSnapshot(schoolDocRef(schoolId, "settings", "system"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      try {
        if (getCacheScope() === schoolId) localStorage.setItem(scopedKey(cacheName), JSON.stringify(data));
      } catch (e) {
        console.error("Error saving synced settings to LocalStorage:", e);
      }
      onUpdate(data);
    }
  }, (error) => {
    console.error(`Error in real-time sync for ${schoolId}/settings:`, error);
    checkAndHandleQuotaError(error);
  });
}

// ---------------------------------------------------------------------------
// Personnel : fiche publique `teachers` + fiche RH `staffPrivate` (R-06, D42)
// ---------------------------------------------------------------------------

/**
 * Enregistre une fiche du personnel en deux documents, dans un seul lot :
 * `teachers/{id}` (partie publique, champs RH explicitement supprimés pour ne
 * jamais les y laisser) et `staffPrivate/{id}` (partie RH, bureau seulement).
 * Les champs RH absents de l'objet ne sont pas effacés (écriture en fusion).
 */
export async function saveStaffToFirestore(schoolId: string, staff: { id: string; [k: string]: any }) {
  try {
    const { publicData, privateData } = splitStaffRecord(stripPassword({ ...staff }));
    const batch = writeBatch(db);
    const removed: Record<string, unknown> = {};
    for (const k of STAFF_PRIVATE_FIELDS) removed[k] = deleteField();
    batch.set(schoolDocRef(schoolId, "teachers", staff.id), { ...sanitizeForFirestore(publicData), ...removed, schoolId }, { merge: true });
    batch.set(
      schoolDocRef(schoolId, STAFF_PRIVATE_COLLECTION, staff.id),
      { ...sanitizeForFirestore(privateData), teacherId: staff.id, schoolId, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    await batch.commit();
  } catch (error) {
    console.error(`Error saving staff ${schoolId}/teachers/${staff.id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

/** Supprime la fiche publique et la fiche RH d'un membre du personnel. */
export async function deleteStaffFromFirestore(schoolId: string, id: string) {
  try {
    const batch = writeBatch(db);
    batch.delete(schoolDocRef(schoolId, "teachers", id));
    batch.delete(schoolDocRef(schoolId, STAFF_PRIVATE_COLLECTION, id));
    await batch.commit();
  } catch (error) {
    console.error(`Error deleting staff ${schoolId}/teachers/${id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

/**
 * Abonnement aux fiches du personnel. Sans droit RH (`includePrivate` faux),
 * seules les fiches publiques sont lues (et tout champ RH résiduel est retiré).
 * Avec droit RH (bureau), les fiches RH sont fusionnées dans les fiches
 * publiques : l'interface reçoit le même objet `Teacher` qu'avant la scission.
 * La liste n'est émise qu'une fois les deux lectures arrivées ; si la lecture
 * RH est refusée, les fiches publiques sont émises seules.
 */
export function subscribeToStaff<T extends { id: string }>(
  schoolId: string,
  includePrivate: boolean,
  onUpdate: (data: T[]) => void,
  cacheName: string,
) {
  let publicDocs: T[] | null = null;
  let privateDocs: { id: string; [k: string]: unknown }[] | null = includePrivate ? null : [];
  const emit = () => {
    if (publicDocs === null || privateDocs === null) return;
    const items = includePrivate
      ? mergeStaffRecords(publicDocs, privateDocs)
      : publicDocs.map((t) => stripStaffPrivate(t as T & Record<string, any>) as unknown as T);
    writeCache(schoolId, cacheName, items);
    onUpdate(items);
  };
  const unsubs = [
    onSnapshot(schoolCollection(schoolId, "teachers"), (snapshot) => {
      publicDocs = snapshot.docs.map((d) => stripPassword({ id: d.id, ...d.data() } as T & Record<string, any>));
      emit();
    }, (error) => {
      console.error(`Error in real-time sync for ${schoolId}/teachers:`, error);
      checkAndHandleQuotaError(error);
    }),
  ];
  if (includePrivate) {
    unsubs.push(onSnapshot(schoolCollection(schoolId, STAFF_PRIVATE_COLLECTION), (snapshot) => {
      privateDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    }, (error) => {
      console.error(`Error in real-time sync for ${schoolId}/${STAFF_PRIVATE_COLLECTION}:`, error);
      privateDocs = [];
      emit();
      checkAndHandleQuotaError(error);
    }));
  }
  return () => unsubs.forEach((u) => u());
}
