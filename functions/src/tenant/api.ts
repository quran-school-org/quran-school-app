/**
 * Fonction HTTP `api` (servie sous /api/** par le rewrite Hosting).
 *
 * GET /api/health : état du service. Aucune autre route : le rapport IA
 * (proxy IA et ses quotas) a été retiré (D76). La fonction reste,
 * minimale et sans secret, pour que le rewrite `/api/**` de `firebase.json`
 * pointe vers une fonction existante et pour garder la même fonction que
 * `release/lot0` (pas de suppression de fonction au déploiement).
 */
import { onRequest } from "firebase-functions/v2/https";

import { FUNCTIONS_REGION } from "../config.js";

type Req = { method: string; path: string };
type Res = { status: (code: number) => Res; json: (body: unknown) => void };

export function handleApi(req: Req, res: Res): void {
  const path = req.path.replace(/^\/api/, "") || "/";
  if (req.method === "GET" && path === "/health") {
    res.json({ status: "ok", time: new Date().toISOString() });
    return;
  }
  res.status(404).json({ error: "not-found" });
}

export const api = onRequest({ region: FUNCTIONS_REGION }, (req, res) => handleApi(req, res as unknown as Res));
