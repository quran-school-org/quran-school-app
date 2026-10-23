/**
 * App Check (D44) : PRÉPARÉ, DÉSACTIVÉ PAR DÉFAUT.
 *
 * - Callables : `enforceAppCheck` piloté par le paramètre APPCHECK_ENFORCE
 *   (functions/.env.<projet>, défaut false). Sans application, un jeton
 *   invalide ou absent laisse `request.app` vide : on le journalise pour la
 *   période d'observation (noteCallableAppCheck).
 * - La fonction HTTP `api` ne sert plus que GET /api/health, sans donnée ni
 *   coût : pas de vérification App Check (rapport IA retiré, D76).
 * Procédure d'activation : docs/runbooks/APP-CHECK.md.
 */
import { defineBoolean } from "firebase-functions/params";
import { logger } from "firebase-functions";

import "./admin.js";

export const APPCHECK_ENFORCE = defineBoolean("APPCHECK_ENFORCE", {
  default: false,
  description: "Refuser les requêtes sans jeton App Check valide (après la période d'observation).",
});

/** Valeur effective (hors CLI Firebase, la variable est absente : false). */
export function appCheckEnforced(): boolean {
  return process.env.APPCHECK_ENFORCE === undefined ? false : APPCHECK_ENFORCE.value();
}

/** Journal d'observation pour les callables (aucune donnée personnelle). */
export function noteCallableAppCheck(fn: string, request: { app?: unknown }): void {
  logger.info("appcheck", { fn, state: request.app ? "valid" : "missing-or-invalid", enforced: appCheckEnforced() });
}
