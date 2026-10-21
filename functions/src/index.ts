/**
 * Point d'entrée des Cloud Functions (2nd gen, Node 22).
 *
 * - api : fonction HTTP (route de santé ; proxy Gemini dans une branche suivante)
 * - Lot 0 : gestion des comptes (callables réservées au directeur) et
 *   suspension des comptes à l'archivage des fiches.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

import { FUNCTIONS_REGION } from "./config.js";

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 });

import * as archiveSync from "./lot0/archiveSync.js";

export { createUserAccount, resetUserPassword } from "./lot0/accounts.js";

/**
 * Dans certains environnements (proxy sortant qui intercepte même 127.0.0.1),
 * l'émulateur Functions ne parvient pas à enregistrer les triggers Firestore et
 * refuse de démarrer. EMULATOR_SKIP_FIRESTORE_TRIGGERS=true permet alors de
 * tester les callables seules. Sans effet hors émulateur (déploiement réel).
 */
const skipTriggers = process.env.FUNCTIONS_EMULATOR === "true" && process.env.EMULATOR_SKIP_FIRESTORE_TRIGGERS === "true";

export const syncAccountsOnTeacherArchive = skipTriggers ? undefined : archiveSync.syncAccountsOnTeacherArchive;
export const syncAccountsOnStudentArchive = skipTriggers ? undefined : archiveSync.syncAccountsOnStudentArchive;

export const api = onRequest({ region: FUNCTIONS_REGION }, (req, res) => {
  if (req.method === "GET" && (req.path === "/api/health" || req.path === "/health")) {
    res.json({ status: "ok", time: new Date().toISOString() });
    return;
  }
  res.status(404).json({ error: "not-found" });
});
