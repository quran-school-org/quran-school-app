/**
 * Point d'entrée des Cloud Functions (2nd gen, Node 22).
 *
 * Squelette du socle de développement : seule la fonction HTTP `api` existe,
 * avec une route de santé. Les fonctions métier (création de comptes,
 * réinitialisation de mot de passe, proxy Gemini…) arrivent dans les branches
 * suivantes.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

import { FUNCTIONS_REGION } from "./config.js";

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 });

export const api = onRequest((req, res) => {
  if (req.method === "GET" && (req.path === "/api/health" || req.path === "/health")) {
    res.json({ status: "ok", time: new Date().toISOString() });
    return;
  }
  res.status(404).json({ error: "not-found" });
});
