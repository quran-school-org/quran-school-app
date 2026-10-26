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
 * Traduction française (D79, disponible en production par D93) : le
 * dictionnaire et la couche DOM (src/i18n-test) ne se chargent que si
 * l'utilisateur choisit le français. Ils doivent donc être dans un chunk
 * séparé, chargé par import dynamique, jamais dans un chunk d'entrée (le
 * bundle principal en arabe ne doit pas grossir).
 */
export interface BundleChunk {
  fileName: string;
  isEntry: boolean;
  moduleIds: string[];
}

const inFrLayer = (id: string) => id.replace(/\\/g, "/").includes("/src/i18n-test/");

export function frChunkProblems(chunks: BundleChunk[]): string[] {
  const problems: string[] = [];
  for (const c of chunks) {
    const leaked = c.moduleIds.filter(inFrLayer);
    if (c.isEntry && leaked.length) problems.push(`Traduction FR dans le chunk d'entrée ${c.fileName} (import dynamique requis) : ${leaked.join(", ")}`);
  }
  if (!chunks.some((c) => !c.isEntry && c.moduleIds.some((id) => inFrLayer(id) && id.endsWith("/fr.ts")))) {
    problems.push("Le dictionnaire FR (src/i18n-test/fr.ts) est absent du bundle : l'option « Français » ne fonctionnerait pas.");
  }
  return problems;
}

/**
 * Aperçu par rôle du super-admin (D95) : le drapeau VITE_ENABLE_ROLE_PREVIEW ne
 * doit jamais être vrai pour un build visant le projet de PRODUCTION. Le projet
 * de prod est celui du fichier versionné `.env.production` (aucune valeur codée
 * en dur) ; le dev déployé le surcharge par `.env.production.local`. Si le
 * projet de prod est introuvable, le drapeau est refusé en production (prudence).
 */
export function rolePreviewBuildProblems(mode: string, env: Record<string, string | undefined>, committedProdProjectId: string | undefined): string[] {
  if (mode !== "production") return [];
  const enabled = String(env.VITE_ENABLE_ROLE_PREVIEW || "").trim().toLowerCase() === "true";
  if (!enabled) return [];
  const project = (env.VITE_FIREBASE_PROJECT_ID || "").trim();
  const prod = (committedProdProjectId || "").trim();
  if (!prod) return ["VITE_ENABLE_ROLE_PREVIEW=true dans un build de production dont le projet de prod (.env.production) est introuvable : refusé par prudence (D95)."];
  if (project === prod) return [`VITE_ENABLE_ROLE_PREVIEW=true pour le projet de production (${project}) : l'aperçu par rôle est réservé au dev (D95).`];
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
 * Bundle : sans le drapeau, aucun module de src/rolePreview ne doit y figurer
 * (contrôle, bandeau, sélection au hasard). Contrôlé à la génération du bundle.
 */
export function rolePreviewBundleProblems(enabled: boolean, moduleIds: Iterable<string>): string[] {
  if (enabled) return [];
  const leaked = [...moduleIds].filter((id) => id.replace(/\\/g, "/").includes("/src/rolePreview/"));
  return leaked.length ? [`Modules de l'aperçu par rôle présents dans le bundle sans VITE_ENABLE_ROLE_PREVIEW : ${leaked.join(", ")}`] : [];
}
