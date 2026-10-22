import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  getDoc,
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
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { SystemSettings, AppUser, AuthLink } from "./types";
import { firebaseWebConfig, firestoreDatabaseId, emulatorConfig } from "./config/env";
import { normalizeAuthPassword, normalizeUsername, usernameToEmail } from "./security/accounts";

/** Région des Cloud Functions (identique à functions/src/config.ts). */
export const FUNCTIONS_REGION = "europe-west1";

// Configuration web Firebase lue depuis les variables VITE_* (voir .env.example).
const app = initializeApp(firebaseWebConfig);

// Base Firestore (base nommée en prod, "(default)" sur les émulateurs).
export const db = firestoreDatabaseId === "(default)"
  ? getFirestore(app)
  : getFirestore(app, firestoreDatabaseId);

// Initialize Firebase Auth
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
// Authentification (Lot 0)
// ---------------------------------------------------------------------------
// La connexion se fait TOUJOURS par Firebase Auth, avant toute lecture de
// données. Aucun mot de passe n'est comparé ni stocké côté client, et aucun
// compte n'est plus créé automatiquement à la connexion.

/**
 * Connexion par nom d'utilisateur : email technique `{username}@alfajr.local`,
 * mot de passe complété par `_secure_fajr` s'il fait moins de 6 caractères
 * (compatibilité avec les comptes existants).
 */
export async function signInWithUsername(username: string, password: string) {
  const email = usernameToEmail(normalizeUsername(username));
  const candidates = Array.from(new Set([password, password.trim()])).filter((p) => p.length > 0);
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      return await signInWithEmailAndPassword(auth, email, normalizeAuthPassword(candidate));
    } catch (error: any) {
      lastError = error;
      // Seule une erreur d'identifiants justifie d'essayer la variante suivante.
      if (error?.code !== "auth/invalid-credential" && error?.code !== "auth/wrong-password") break;
    }
  }
  throw lastError;
}

/** Déconnexion réelle de Firebase Auth. */
export async function signOutUser() {
  await firebaseSignOut(auth);
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

/** Lien d'autorisation du compte connecté (lisible par son propriétaire). */
export async function fetchAuthLink(uid: string): Promise<AuthLink | null> {
  const snap = await getDoc(doc(db, "authLinks", uid));
  return snap.exists() ? (snap.data() as AuthLink) : null;
}

/** Compte applicatif (profil) par identifiant. */
export async function fetchAppUser(appUserId: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "appUsers", appUserId));
  return snap.exists() ? stripPassword({ id: snap.id, ...snap.data() } as AppUser) : null;
}

/** Retire tout champ `password` hérité d'un objet compte. */
export function stripPassword<T extends Record<string, any>>(user: T): T {
  if (user && "password" in user) {
    const { password: _ignored, ...rest } = user as any;
    return rest as T;
  }
  return user;
}

/**
 * Écrit un compte applicatif SANS mot de passe (le champ hérité est supprimé
 * explicitement). Réservé au directeur par les règles, sauf champs anodins de
 * son propre compte.
 */
export async function saveAppUserDoc(user: AppUser) {
  const data = sanitizeForFirestore(stripPassword(user));
  await setDoc(doc(db, "appUsers", user.id), { ...data, password: deleteField() }, { merge: true });
}

/** Met à jour des champs anodins de son propre compte (lastLogin, mustChangePassword…). */
export async function updateOwnAppUserFields(appUserId: string, fields: Partial<Pick<AppUser, "lastLogin" | "mustChangePassword" | "fullName" | "phone" | "passwordChangedAt">>) {
  await setDoc(doc(db, "appUsers", appUserId), sanitizeForFirestore(fields), { merge: true });
}

/** Écrit le lien d'autorisation d'un compte (directeur uniquement). */
export async function saveAuthLink(uid: string, link: AuthLink) {
  await setDoc(doc(db, "authLinks", uid), sanitizeForFirestore(link), { merge: true });
}

export async function deleteAuthLink(uid: string) {
  await deleteDoc(doc(db, "authLinks", uid));
}

// ---------------------------------------------------------------------------
// Cloud Functions callables (gestion des comptes, directeur uniquement)
// ---------------------------------------------------------------------------

export interface CreateUserAccountInput {
  username: string;
  password: string;
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

export async function createUserAccountRemote(input: CreateUserAccountInput): Promise<{ appUserId: string; uid: string }> {
  const callable = httpsCallable<CreateUserAccountInput, { appUserId: string; uid: string }>(functions, "createUserAccount");
  const res = await callable(input);
  return res.data;
}

export async function resetUserPasswordRemote(appUserId: string, newPassword: string): Promise<void> {
  const callable = httpsCallable<{ appUserId: string; newPassword: string }, { ok: boolean }>(functions, "resetUserPassword");
  await callable({ appUserId, newPassword });
}

/** Traduit une erreur Firebase (Auth, Functions) en message arabe lisible. */
export function describeFirebaseError(error: any): string {
  const code: string = error?.code || "";
  if (code.includes("already-exists") || code === "auth/email-already-exists") return "اسم المستخدم مستعمل من قبل حساب آخر.";
  if (code.includes("permission-denied")) return "ليست لديك صلاحية تنفيذ هذه العملية.";
  if (code.includes("invalid-argument")) return error?.message || "بيانات غير صالحة.";
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

// Generic function to save/update a document in Firestore
export async function saveToFirestore(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    const sanitizedData = sanitizeForFirestore(collectionName === "appUsers" ? stripPassword(data) : data);
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error(`Error saving to Firestore collection ${collectionName} with ID ${id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

// Generic function to delete a document from Firestore
export async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from Firestore collection ${collectionName} with ID ${id}:`, error);
    checkAndHandleQuotaError(error);
  }
}

function writeCache(localStorageKey: string, items: unknown) {
  try {
    let sanitizedItems: any = items;
    if (localStorageKey === "alfajr_notifications" && Array.isArray(items)) {
      sanitizedItems = items.slice(-20);
    }
    localStorage.setItem(localStorageKey, JSON.stringify(sanitizedItems));
  } catch (e) {
    console.error(`Error saving synced data to LocalStorage (${localStorageKey}):`, e);
  }
}

// Sync helper that listens to Firestore changes in real-time
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  localStorageKey: string
) {
  const colRef = collection(db, collectionName);

  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as T;
      items.push(collectionName === "appUsers" ? stripPassword(data as any) : data);
    });

    // Save to localStorage so it works offline and during loading
    writeCache(localStorageKey, items);
    onUpdate(items);
  }, (error) => {
    console.error(`Error in real-time sync for ${collectionName}:`, error);
    checkAndHandleQuotaError(error);
  });
}

/**
 * Abonnement à une liste de documents précis (comptes famille : élèves liés).
 * Les règles n'autorisent que la lecture document par document.
 */
export function subscribeToDocumentsByIds<T extends { id: string }>(
  collectionName: string,
  ids: string[],
  onUpdate: (data: T[]) => void,
  localStorageKey: string
) {
  const current = new Map<string, T>();
  const emit = () => {
    const items = ids.map((id) => current.get(id)).filter((x): x is T => !!x);
    writeCache(localStorageKey, items);
    onUpdate(items);
  };
  if (ids.length === 0) {
    emit();
    return () => {};
  }
  const unsubs = ids.map((id) =>
    onSnapshot(doc(db, collectionName, id), (snap) => {
      if (snap.exists()) current.set(id, { id: snap.id, ...(snap.data() as DocumentData) } as T);
      else current.delete(id);
      emit();
    }, (error) => {
      console.error(`Error in real-time sync for ${collectionName}/${id}:`, error);
      checkAndHandleQuotaError(error);
    })
  );
  return () => unsubs.forEach((u) => u());
}

/**
 * Abonnement filtré `where(field, "in", values)` (comptes famille : présences,
 * notes, suivi des élèves liés). Firestore limite `in` à 30 valeurs : la liste
 * est découpée en paquets.
 */
export function subscribeToQueryIn<T extends { id: string }>(
  collectionName: string,
  field: string,
  values: string[],
  onUpdate: (data: T[]) => void,
  localStorageKey: string
) {
  if (values.length === 0) {
    writeCache(localStorageKey, []);
    onUpdate([]);
    return () => {};
  }
  const chunks: string[][] = [];
  for (let i = 0; i < values.length; i += 30) chunks.push(values.slice(i, i + 30));
  const parts = new Map<number, T[]>();
  const unsubs = chunks.map((chunk, index) =>
    onSnapshot(query(collection(db, collectionName), where(field, "in", chunk)), (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as T));
      parts.set(index, items);
      const all = Array.from(parts.values()).flat();
      writeCache(localStorageKey, all);
      onUpdate(all);
    }, (error) => {
      console.error(`Error in filtered sync for ${collectionName}:`, error);
      checkAndHandleQuotaError(error);
    })
  );
  return () => unsubs.forEach((u) => u());
}

/** Abonnement à un document unique (profil, lien d'autorisation). */
export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  onUpdate: (data: T | null) => void
) {
  return onSnapshot(doc(db, collectionName, id), (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
  }, (error) => {
    console.error(`Error in real-time sync for ${collectionName}/${id}:`, error);
    checkAndHandleQuotaError(error);
  });
}

// Sync helper for system settings
export function subscribeToSettings(
  onUpdate: (settings: SystemSettings) => void,
  localStorageKey: string
) {
  const docRef = doc(db, "settings", "system");

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Error saving synced settings to LocalStorage:", e);
      }
      onUpdate(data);
    }
  }, (error) => {
    console.error("Error in real-time sync for settings:", error);
    checkAndHandleQuotaError(error);
  });
}
