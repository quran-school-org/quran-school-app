/**
 * Rewrite Hosting `/api/**` → fonction `api` (firebase.json), de bout en bout
 * sur les émulateurs Hosting + Functions + Auth + Firestore (D48).
 *
 *   npm run test:hosting
 *
 * Dans un conteneur à proxy sortant, l'émulateur Hosting doit être lancé sans
 * variables de proxy (voir scripts/dev/without-proxy.sh et D11 / D48).
 * Vérifie aussi les en-têtes de sécurité servis par Hosting (D49).
 */
import { describe, expect, it } from "vitest";

const HOSTING = "http://127.0.0.1:5000";

describe("rewrite Hosting /api/** → fonction api", () => {
  it("GET /api/health passe par le rewrite", async () => {
    const res = await fetch(`${HOSTING}/api/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it("l'ancienne route du rapport IA (retiré, D76) : 404 JSON de la fonction, pas index.html", async () => {
    const res = await fetch(`${HOSTING}/api/gemini/analyze`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolId: "alfajr", studentName: "ياسين" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not-found" });
  });

  it("une route inconnue de l'application renvoie index.html (SPA), pas la fonction", async () => {
    const res = await fetch(`${HOSTING}/eleves/S-101`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<div id="root">');
  });
});

describe("en-têtes de sécurité et cache servis par Hosting (D49)", () => {
  it("page de l'application : CSP, nosniff, Referrer-Policy, Permissions-Policy (caméra pour le scan QR), pas de cache", async () => {
    const res = await fetch(`${HOSTING}/`);
    const csp = res.headers.get("content-security-policy") || "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://fonts.googleapis.com");
    expect(csp).toContain("https://www.google.com/recaptcha/");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("permissions-policy")).toContain("camera=(self)");
    expect(res.headers.get("permissions-policy")).toContain("microphone=()");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("cache-control")).toBe("no-cache");
    const html = await res.text();
    expect(html).not.toContain("الفجر");
  });

  it("fichiers versionnés de /assets : cache long et immuable ; route SPA : pas de cache", async () => {
    const html = await (await fetch(`${HOSTING}/`)).text();
    const asset = html.match(/\/assets\/[^"']+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const res = await fetch(`${HOSTING}${asset}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await fetch(`${HOSTING}/eleves/S-101`)).headers.get("cache-control")).toBe("no-cache");
  });
});
