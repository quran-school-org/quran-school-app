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
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { NEW_ACCOUNTS_EMAIL_DOMAIN, normalizeAuthPassword, usernameToEmail } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const HOSTING = "http://127.0.0.1:5000";
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
let admin: AdminHandles;
let token = "";

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "hosting-rewrite-test");
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  const email = usernameToEmail("prof_rewrite", NEW_ACCOUNTS_EMAIL_DOMAIN);
  const password = "rewrite-demo-2026";
  const user = await admin.auth.createUser({ email, password: normalizeAuthPassword(password) });
  await admin.db.doc("schools/alfajr").set({ name: "alfajr" });
  await admin.db.doc(`schools/alfajr/members/${user.uid}`).set({ uid: user.uid, schoolId: "alfajr", role: "مدرس", isActive: true });
  const res = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: normalizeAuthPassword(password), returnSecureToken: true }),
  });
  token = (await res.json()).idToken;
  expect(token).toBeTruthy();
});

afterAll(async () => {
  await admin?.close();
});

describe("rewrite Hosting /api/** → fonction api", () => {
  it("GET /api/health passe par le rewrite", async () => {
    const res = await fetch(`${HOSTING}/api/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it("POST /api/gemini/analyze : 401 sans jeton, rapport avec un jeton d'enseignant, quota compté", async () => {
    const body = JSON.stringify({ schoolId: "alfajr", studentName: "ياسين", hizbCount: 2, attendanceRate: 90 });
    const anon = await fetch(`${HOSTING}/api/gemini/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    expect(anon.status).toBe(401);
    const res = await fetch(`${HOSTING}/api/gemini/analyze`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body,
    });
    expect(res.status).toBe(200);
    expect(typeof (await res.json()).summary).toBe("string"); // rapport de repli (pas de clé Gemini)
    const day = new Date().toISOString().slice(0, 10);
    expect((await admin.db.doc(`aiQuota/s_alfajr_${day}`).get()).data()?.count).toBe(1);
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
