import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  getDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { Student, Teacher, Class, Attendance, Grade, Payment, Notification, SystemSettings, AppUser } from "./types";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBNF7NMj9WxW_1Ud6YWRHLk5D4noFiRryI",
  authDomain: "gen-lang-client-0481880143.firebaseapp.com",
  projectId: "gen-lang-client-0481880143",
  storageBucket: "gen-lang-client-0481880143.firebasestorage.app",
  messagingSenderId: "806522370204",
  appId: "1:806522370204:web:3da3acc4def8a8fa129559"
};

const app = initializeApp(firebaseConfig);

// Using the custom database ID provided by Google AI Studio
export const db = getFirestore(app, "ai-studio-a6572431-c7db-4071-82bf-a922d18511ec");

// Initialize Firebase Auth
export const auth = getAuth(app);

// Helper function to sign in or create a user in Firebase Auth
export async function loginWithFirebaseAuth(username: string, password: string) {
  const email = `${username.toLowerCase().trim()}@alfajr.local`;
  // Firebase Auth requires passwords to be at least 6 characters
  const authPassword = password.length >= 6 ? password : `${password}_secure_fajr`;

  try {
    // Attempt standard sign-in
    await signInWithEmailAndPassword(auth, email, authPassword);
    console.log("Logged into Firebase Auth successfully:", email);
  } catch (error: any) {
    if (
      error.code === "auth/network-request-failed" ||
      String(error?.message || "").includes("network-request-failed")
    ) {
      console.warn("Firebase Auth network request failed. Operating in offline/local mode.", error);
      return;
    }
    // If user does not exist or credentials fail, we attempt auto-creation
    // because Firestore relies on request.auth != null and we want zero friction.
    if (
      error.code === "auth/user-not-found" || 
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      try {
        // Let's attempt to create the user on the fly if they don't exist
        await createUserWithEmailAndPassword(auth, email, authPassword);
        console.log("Created and logged into brand new Firebase Auth user:", email);
      } catch (createError: any) {
        if (
          createError.code === "auth/network-request-failed" ||
          String(createError?.message || "").includes("network-request-failed")
        ) {
          console.warn("Firebase Auth network request failed during creation. Operating in offline/local mode.", createError);
          return;
        }
        // If it's a wrong-password error for an existing user, let's rethrow the initial error
        if (createError.code === "auth/email-already-in-use") {
          console.error("Firebase Auth credential failure for existing user:", error);
          throw error;
        }
        console.error("Error auto-creating Firebase Auth user:", createError);
        throw createError;
      }
    } else {
      console.error("Firebase Auth sign-in error:", error);
      throw error;
    }
  }
}

// Helper function to sign out of Firebase Auth
export async function logoutFromFirebaseAuth() {
  try {
    await firebaseSignOut(auth);
    console.log("Logged out from Firebase Auth.");
  } catch (error) {
    console.error("Error logging out from Firebase Auth:", error);
  }
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
    const sanitizedData = sanitizeForFirestore(data);
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

// Upload local data to Firestore if Firestore collection is empty
export async function bootstrapCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  localData: T[]
) {
  if (localData.length === 0) return;
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log(`Firestore collection '${collectionName}' is empty. Uploading local data...`);
      const batch = writeBatch(db);
      localData.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, sanitizeForFirestore(item));
      });
      await batch.commit();
      console.log(`Uploaded ${localData.length} items to Firestore collection '${collectionName}'.`);
    }
  } catch (error) {
    console.error(`Error bootstrapping Firestore collection '${collectionName}':`, error);
    checkAndHandleQuotaError(error);
  }
}

// Upload system settings to Firestore if empty
export async function bootstrapSettingsIfEmpty(settings: SystemSettings) {
  try {
    const docRef = doc(db, "settings", "system");
    const snapshot = await getDocs(collection(db, "settings"));
    if (snapshot.empty) {
      console.log("Firestore settings collection is empty. Uploading system settings...");
      await setDoc(docRef, sanitizeForFirestore(settings));
    }
  } catch (error) {
    console.error("Error bootstrapping system settings:", error);
    checkAndHandleQuotaError(error);
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
      items.push({ id: doc.id, ...doc.data() } as T);
    });
    
    // Save to localStorage so it works offline and during loading
    try {
      let sanitizedItems: any = items;
      if (localStorageKey === "alfajr_notifications") {
        sanitizedItems = items.slice(-20);
      }
      localStorage.setItem(localStorageKey, JSON.stringify(sanitizedItems));
    } catch (e) {
      console.error(`Error saving synced ${collectionName} to LocalStorage:`, e);
    }
    onUpdate(items);
  }, (error) => {
    console.error(`Error in real-time sync for ${collectionName}:`, error);
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

// Fetch all appUsers directly from Firestore (useful during login on new browsers)
export async function fetchAppUsersFromFirestore(): Promise<AppUser[]> {
  try {
    const colRef = collection(db, "appUsers");
    const snapshot = await getDocs(colRef);
    const users: AppUser[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
    });
    if (users.length > 0) {
      try {
        localStorage.setItem("alfajr_settings_users", JSON.stringify(users));
      } catch (e) {
        console.error("Failed to write appUsers to localStorage:", e);
      }
    }
    return users;
  } catch (error) {
    console.error("Error fetching appUsers directly from Firestore:", error);
    checkAndHandleQuotaError(error);
    return [];
  }
}

// Fetch system settings directly from Firestore
export async function fetchSystemSettingsFromFirestore(): Promise<SystemSettings | null> {
  try {
    const docRef = doc(db, "settings", "system");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as SystemSettings;
      try {
        localStorage.setItem("alfajr_settings_system", JSON.stringify(data));
      } catch (e) {
        console.error("Failed to write system settings to localStorage:", e);
      }
      return data;
    }
  } catch (error) {
    console.error("Error fetching settings directly from Firestore:", error);
    checkAndHandleQuotaError(error);
  }
  return null;
}
