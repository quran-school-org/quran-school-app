/**
 * Garde-fous du build de production (revue du durcissement, D57).
 *
 * Vite charge `.env.local` dans TOUS les modes, y compris `vite build`
 * (production). Une surcharge prévue pour le poste de développement (jeton de
 * débogage App Check, émulateurs…) se retrouverait donc dans le bundle public
 * de la prod. Le build échoue dans ces cas, avec un message explicite.
 * Échappatoire volontaire (CI de test sur un projet de dev seulement) :
 * `ALLOW_APPCHECK_DEBUG_IN_BUILD=true` dans l'environnement du processus.
 */
export function productionBuildProblems(mode: string, env: Record<string, string | undefined>, processEnv: Record<string, string | undefined> = {}): string[] {
  if (mode !== "production") return [];
  const problems: string[] = [];
  const debugToken = (env.VITE_APPCHECK_DEBUG_TOKEN || "").trim();
  if (debugToken && processEnv.ALLOW_APPCHECK_DEBUG_IN_BUILD !== "true") {
    problems.push(
      "VITE_APPCHECK_DEBUG_TOKEN est défini pour un build de production (souvent via .env.local) : " +
        "il serait publié dans le bundle et App Check passerait en mode débogage. " +
        "Le mettre dans .env.development.local (chargé seulement par `npm run dev`).",
    );
  }
  if (String(env.VITE_USE_EMULATORS || "").trim().toLowerCase() === "true" && !(env.VITE_FIREBASE_PROJECT_ID || "").startsWith("demo-")) {
    problems.push("VITE_USE_EMULATORS=true avec un vrai projet dans un build de production.");
  }
  return problems;
}
