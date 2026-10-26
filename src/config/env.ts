/**
 * Lecture centralisée de la configuration d'environnement (variables VITE_*).
 *
 * - `npm run dev`   -> .env.development (émulateurs, projet demo-quran-school)
 * - `npm run build` -> .env.production  (config web publique de la prod)
 *
 * Aucune valeur n'est codée en dur ici : une variable manquante provoque une
 * erreur explicite au démarrage plutôt qu'une connexion silencieuse à un
 * mauvais projet.
 */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example (copier les valeurs dans .env.local si besoin).`
    );
  }
  return value.trim();
}

const env = import.meta.env;

export const firebaseWebConfig = {
  apiKey: required("VITE_FIREBASE_API_KEY", env.VITE_FIREBASE_API_KEY),
  authDomain: required("VITE_FIREBASE_AUTH_DOMAIN", env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: required("VITE_FIREBASE_PROJECT_ID", env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: required("VITE_FIREBASE_APP_ID", env.VITE_FIREBASE_APP_ID),
};

export const firestoreDatabaseId: string = (env.VITE_FIRESTORE_DATABASE_ID || "(default)").trim();

const useEmulators = String(env.VITE_USE_EMULATORS || "").trim().toLowerCase() === "true";

if (useEmulators && !firebaseWebConfig.projectId.startsWith("demo-")) {
  // Garde-fou : les émulateurs ne doivent jamais être mélangés avec un vrai projet.
  throw new Error(
    `VITE_USE_EMULATORS=true exige un projet "demo-*" (reçu : ${firebaseWebConfig.projectId}).`
  );
}

export const emulatorConfig = {
  enabled: useEmulators,
  host: (env.VITE_EMULATOR_HOST || "127.0.0.1").trim(),
  authPort: 9099,
  firestorePort: 8080,
  functionsPort: 5001,
};

/**
 * App Check (D44), DÉSACTIVÉ tant que VITE_APPCHECK_SITE_KEY est vide.
 * - VITE_APPCHECK_SITE_KEY : clé de site reCAPTCHA Enterprise (publique) ;
 * - VITE_APPCHECK_DEBUG_TOKEN : jeton de débogage (émulateurs, CI, poste de
 *   développement) ; à enregistrer dans la console App Check du projet de DEV.
 *   Ne jamais en mettre un dans .env.production.
 */
export const appCheckConfig = {
  siteKey: (env.VITE_APPCHECK_SITE_KEY || "").trim(),
  debugToken: (env.VITE_APPCHECK_DEBUG_TOKEN || "").trim(),
};

/**
 * Aperçu par rôle du super-admin (D95) : « true » seulement dans
 * .env.development et dans l'étape dev de deploy.yml ; jamais en production
 * (refusé par scripts/dev/buildGuards.ts). Lu directement sur import.meta.env
 * pour que le build de production le remplace par une constante.
 */
export const rolePreviewEnabled: boolean = import.meta.env.VITE_ENABLE_ROLE_PREVIEW === "true";
