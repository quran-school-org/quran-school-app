/**
 * App Check (D44) : PRÉPARÉ, DÉSACTIVÉ PAR DÉFAUT.
 *
 * - Callables : `enforceAppCheck` piloté par le paramètre APPCHECK_ENFORCE
 *   (functions/.env.<projet>, défaut false). Sans application, un jeton
 *   invalide ou absent laisse `request.app` vide : on le journalise pour la
 *   période d'observation (noteCallableAppCheck).
 * - Fonction HTTP `api` : vérification manuelle de l'en-tête
 *   `X-Firebase-AppCheck` (checkAppCheckHeader) ; refus 401 seulement si
 *   APPCHECK_ENFORCE=true, sinon simple journal.
 * Procédure d'activation : docs/runbooks/APP-CHECK.md.
 */
import { defineBoolean } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getAppCheck } from "firebase-admin/app-check";

import "./admin.js";

export const APPCHECK_ENFORCE = defineBoolean("APPCHECK_ENFORCE", {
  default: false,
  description: "Refuser les requêtes sans jeton App Check valide (après la période d'observation).",
});

/** Valeur effective (hors CLI Firebase, la variable est absente : false). */
export function appCheckEnforced(): boolean {
  return process.env.APPCHECK_ENFORCE === undefined ? false : APPCHECK_ENFORCE.value();
}

export type AppCheckState = "valid" | "missing" | "invalid";

export type AppCheckVerifier = (token: string) => Promise<unknown>;

const defaultVerifier: AppCheckVerifier = (token) => getAppCheck().verifyToken(token);

/** État du jeton App Check d'une requête HTTP (en-tête X-Firebase-AppCheck). */
export async function appCheckStateOf(
  headers: Record<string, string | string[] | undefined>,
  verify: AppCheckVerifier = defaultVerifier,
): Promise<AppCheckState> {
  const raw = headers["x-firebase-appcheck"] ?? headers["X-Firebase-AppCheck"];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token) return "missing";
  try {
    await verify(String(token));
    return "valid";
  } catch {
    return "invalid";
  }
}

/**
 * Décision pour une requête HTTP : `allowed` faux seulement si l'application
 * est activée et le jeton absent ou invalide.
 */
export async function checkAppCheckHeader(
  headers: Record<string, string | string[] | undefined>,
  enforce: boolean,
  verify?: AppCheckVerifier,
): Promise<{ allowed: boolean; state: AppCheckState }> {
  const state = await appCheckStateOf(headers, verify);
  return { allowed: !enforce || state === "valid", state };
}

/** Journal d'observation pour les callables (aucune donnée personnelle). */
export function noteCallableAppCheck(fn: string, request: { app?: unknown }): void {
  logger.info("appcheck", { fn, state: request.app ? "valid" : "missing-or-invalid", enforced: appCheckEnforced() });
}
