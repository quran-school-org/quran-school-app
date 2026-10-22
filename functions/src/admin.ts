import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { FIRESTORE_DATABASE_ID } from "./config.js";

if (getApps().length === 0) {
  initializeApp();
}

export function adminAuth() {
  return getAuth();
}

export function adminDb() {
  const databaseId = FIRESTORE_DATABASE_ID.value();
  return databaseId === "(default)" ? getFirestore() : getFirestore(databaseId);
}
