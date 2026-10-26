/**
 * En-têtes Hosting (firebase.json, D49) : présence, cohérence, et syntaxe
 * compatible avec Firebase Hosting (expressions RE2 : pas de lookaround).
 */
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { e2eCsp, productionCsp } from "../../scripts/dev/csp";

type Rule = { source?: string; regex?: string; headers: { key: string; value: string }[] };
const hosting = JSON.parse(readFileSync("firebase.json", "utf8")).hosting;
const rules: Rule[] = hosting.headers;
const header = (rule: Rule | undefined, key: string) => rule?.headers.find((h) => h.key === key)?.value;
const all = rules.find((r) => r.source === "**");

describe("en-têtes de sécurité Hosting", () => {
  it("CSP stricte sur les points sans dépendance aux gabarits d'impression", () => {
    const csp = productionCsp();
    const directives = Object.fromEntries(csp.split(";").map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
    expect(directives["default-src"]).toEqual(["'self'"]);
    expect(directives["object-src"]).toEqual(["'none'"]);
    expect(directives["base-uri"]).toEqual(["'self'"]);
    expect(directives["frame-ancestors"]).toEqual(["'none'"]);
    expect(directives["form-action"]).toEqual(["'self'"]);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/(^|\s)\*(\s|;|$)/); // aucun joker nu
    expect(directives["script-src"]).toEqual(expect.arrayContaining(["https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"]));
    expect(directives["connect-src"]).toEqual(expect.arrayContaining(["https://*.googleapis.com", "https://*.cloudfunctions.net"]));
    expect(directives["style-src"]).toContain("https://fonts.googleapis.com");
    expect(directives["font-src"]).toContain("https://fonts.gstatic.com");
    // Origines devenues inutiles avec le nouveau design (D61, D62, D63) : QR locaux,
    // impressions sans CDN Tailwind.
    expect(csp).not.toContain("cdn.tailwindcss.com");
    expect(csp).not.toContain("qrserver");
    // Plus de photos d'avatar tierces (UI-14, D92) : images locales, data: et blob: seulement.
    expect(csp).not.toContain("unsplash");
    expect(directives["img-src"]).toEqual(expect.arrayContaining(["'self'", "data:", "blob:"]));
    expect(directives["img-src"].some((v) => v.includes("unsplash"))).toBe(false);
  });

  it("nosniff, Referrer-Policy, Permissions-Policy (caméra autorisée pour le scan QR), cadres interdits", () => {
    expect(header(all, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(all, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(all, "Permissions-Policy")).toMatch(/(^|, )camera=\(self\)/);
    expect(header(all, "Permissions-Policy")).toContain("microphone=()");
    expect(header(all, "Permissions-Policy")).toContain("geolocation=()");
    expect(header(all, "X-Frame-Options")).toBe("DENY");
  });

  it("cache : /assets immuable, pages sans cache, règles disjointes et compatibles RE2", () => {
    expect(header(rules.find((r) => r.source === "/assets/**"), "Cache-Control")).toBe("public, max-age=31536000, immutable");
    const page = rules.find((r) => r.regex);
    expect(header(page, "Cache-Control")).toBe("no-cache");
    for (const r of rules.filter((x) => x.regex)) expect(r.regex, "RE2 n'accepte pas (?= (?! (?<").not.toMatch(/\(\?[=!<]/);
    const re = new RegExp(page!.regex!);
    for (const p of ["/", "/index.html", "/eleves/S-101"]) expect(re.test(p), p).toBe(true);
    for (const p of ["/assets/index-abc123.js", "/assets/index-abc123.css"]) expect(re.test(p), p).toBe(false);
  });

  it("variante de test : origines locales ajoutées, rien d'autre d'assoupli", () => {
    const test = e2eCsp();
    expect(test).toContain("connect-src 'self' http://127.0.0.1:*");
    expect(test).not.toContain("upgrade-insecure-requests");
    expect(test).not.toContain("frame-ancestors");
    expect(test.replace(/ http:\/\/127\.0\.0\.1:\* ws:\/\/127\.0\.0\.1:\* http:\/\/localhost:\* ws:\/\/localhost:\*/, ""))
      .toBe(productionCsp().split("; ").filter((d) => !d.startsWith("upgrade-insecure-requests") && !d.startsWith("frame-ancestors")).join("; "));
  });

  it("index.html générique (aucun nom d'école codé en dur)", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/الفجر|Fajr/i);
    expect(html).toContain("<title>المدرسة القرآنية</title>");
  });

  it("icônes du logo temporaire (D78) : balises de index.html et fichiers de public/", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
    expect(html).toContain('<meta name="theme-color" content="#102446" />');
    for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "logo.svg"]) {
      expect(existsSync(`public/${f}`), f).toBe(true);
    }
  });
});
