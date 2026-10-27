/**
 * Projet de PRODUCTION, lu dans le `.env.production` versionné (D103) : aucune
 * valeur codée en dur dans les scripts qui doivent le refuser ou ne le servir
 * que par `ops.yml`. Même source que `scripts/dev/buildGuards.ts`.
 *
 * Échec fermé : si le fichier est introuvable ou sans projet, l'import échoue
 * et le script ne démarre pas (un refus qui ne sait pas quoi refuser ne vaut rien).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const ENV_PRODUCTION = fileURLToPath(new URL("../../../.env.production", import.meta.url));

/** Identifiants de projet de la prod d'après un contenu de `.env.production` (pur, testable). */
export function productionProjectIdsFrom(content: string | Buffer): string[] {
  const id = (parse(content).VITE_FIREBASE_PROJECT_ID || "").trim().toLowerCase();
  if (!id) throw new Error("VITE_FIREBASE_PROJECT_ID absent de .env.production : impossible de savoir quel projet refuser.");
  return [id];
}

export function readProductionProjectIds(path: string = ENV_PRODUCTION): string[] {
  let content: Buffer;
  try {
    content = readFileSync(path);
  } catch {
    throw new Error(".env.production illisible : impossible de savoir quel projet refuser.");
  }
  return productionProjectIdsFrom(content);
}

/** Projets de PRODUCTION : jamais visés (liste de refus lue dans `.env.production`, pas une configuration). */
export const FORBIDDEN_PROJECT_IDS: string[] = readProductionProjectIds();

export function isProductionProject(projectId: unknown): boolean {
  const p = typeof projectId === "string" ? projectId.trim().toLowerCase() : "";
  return FORBIDDEN_PROJECT_IDS.includes(p);
}
