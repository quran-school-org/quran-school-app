/**
 * Content-Security-Policy de production (firebase.json, D49) et sa variante
 * pour les tests de bout en bout sur émulateurs. Source unique : firebase.json.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type HeaderRule = { source?: string; regex?: string; headers: { key: string; value: string }[] };

export function productionCsp(root = process.cwd()): string {
  const fb = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));
  const rule = (fb.hosting.headers as HeaderRule[]).find((h) => h.source === "**");
  const csp = rule?.headers.find((h) => h.key === "Content-Security-Policy")?.value;
  if (!csp) throw new Error("Content-Security-Policy absente de firebase.json (hosting.headers, source **)");
  return csp;
}

/**
 * Variante pour les tests (balise <meta>, serveur de développement) : ajoute les
 * origines locales des émulateurs et de Vite à connect-src ; retire
 * upgrade-insecure-requests (émulateurs en http) et frame-ancestors (ignoré
 * dans une balise <meta>, protégé par l'en-tête X-Frame-Options en production).
 */
export function e2eCsp(root = process.cwd()): string {
  const local = "http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*";
  return productionCsp(root)
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith("upgrade-insecure-requests") && !d.startsWith("frame-ancestors"))
    .map((d) => (d.startsWith("connect-src ") ? d.replace("connect-src 'self'", `connect-src 'self' ${local}`) : d))
    .join("; ");
}
