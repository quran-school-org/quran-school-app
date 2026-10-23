/**
 * Garde-fous du build de production (revue du durcissement, D70).
 *
 * Vite charge `.env.local` dans TOUS les modes, y compris `vite build`
 * (production). Une surcharge prévue pour le poste de développement (jeton de
 * débogage App Check, émulateurs…) se retrouverait donc dans le bundle public
 * de la prod. Le build échoue dans ces cas, avec un message explicite.
 * Échappatoire volontaire (CI de test sur un projet de dev seulement) :
 * `ALLOW_APPCHECK_DEBUG_IN_BUILD=true` dans l'environnement du processus.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";

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

/**
 * Traduction française de TEST (D79) : le drapeau VITE_ENABLE_FR_TEST ne doit
 * jamais être vrai pour un build visant le projet de PRODUCTION. Le projet de
 * prod est celui du fichier versionné `.env.production` (aucune valeur codée
 * en dur) ; le dev déployé le surcharge par `.env.production.local`.
 */
export function frTestBuildProblems(mode: string, env: Record<string, string | undefined>, committedProdProjectId: string | undefined): string[] {
  if (mode !== "production") return [];
  const enabled = String(env.VITE_ENABLE_FR_TEST || "").trim().toLowerCase() === "true";
  const project = (env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (enabled && committedProdProjectId && project === committedProdProjectId.trim()) {
    return [`VITE_ENABLE_FR_TEST=true pour le projet de production (${project}) : la traduction de test est réservée au dev (D79).`];
  }
  return [];
}

/** Projet visé par le `.env.production` versionné (sans surcharge locale). */
export function committedProductionProjectId(root: string): string | undefined {
  try {
    return parse(readFileSync(resolve(root, ".env.production"))).VITE_FIREBASE_PROJECT_ID;
  } catch {
    return undefined;
  }
}

/**
 * Bundle : sans le drapeau, aucun module de src/i18n-test ne doit y figurer
 * (dictionnaire, sélecteur). Contrôlé à la génération du bundle (vite.config.ts).
 */
export function frTestBundleProblems(enabled: boolean, moduleIds: Iterable<string>): string[] {
  if (enabled) return [];
  const leaked = [...moduleIds].filter((id) => id.replace(/\\/g, "/").includes("/src/i18n-test/"));
  return leaked.length ? [`Modules de traduction de test présents dans le bundle sans VITE_ENABLE_FR_TEST : ${leaked.join(", ")}`] : [];
}
