/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIRESTORE_DATABASE_ID?: string;
  readonly VITE_USE_EMULATORS?: string;
  readonly VITE_EMULATOR_HOST?: string;
  readonly VITE_APPCHECK_SITE_KEY?: string;
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string;
  /** Traduction française de test (D79) : "true" en dev seulement. */
  readonly VITE_ENABLE_FR_TEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
