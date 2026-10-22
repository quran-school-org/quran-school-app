/**
 * L'application fonctionne sous la Content-Security-Policy de production
 * (firebase.json, D49). `npm run test:e2e` démarre le serveur de
 * développement avec E2E_CSP=1 : la politique de firebase.json y est appliquée
 * par une balise <meta> (origines locales des émulateurs ajoutées, voir
 * scripts/dev/csp.ts). TOUTE la suite Playwright tourne donc sous cette
 * politique ; ce fichier vérifie en plus qu'aucune violation n'est signalée,
 * fenêtre d'impression comprise (about:blank hérite de la politique).
 * Données FICTIVES, émulateurs uniquement.
 */
import { expect, test, type Page } from "@playwright/test";

import { e2eCsp } from "../../scripts/dev/csp";

test("l'application fonctionne sous la CSP de production (connexion, écrans, impression)", async ({ page, context }) => {
  const violations: string[] = [];
  const watch = (p: Page) => p.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  watch(page);
  context.on("page", watch);
  await context.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      ((window as any).__csp ||= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  page.on("dialog", (d) => d.accept());

  await page.goto("/");
  const meta = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(meta, "serveur de développement lancé sans E2E_CSP=1 ?").toBe(e2eCsp());

  // Contrôle : la politique est bien appliquée (un script tiers est refusé).
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.src = "https://tiers.invalid/x.js";
    document.head.appendChild(s);
  });
  await expect.poll(async () => (await page.evaluate(() => (window as any).__csp || [])).length).toBeGreaterThan(0);
  await page.evaluate(() => { (window as any).__csp = []; });
  violations.length = 0;

  await page.locator('form input[type="text"]').fill("dir_annour");
  await page.locator('form input[type="password"]').fill("demo-annour-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText("أهلاً بك").first()).toBeVisible();

  await page.locator("aside").getByText("إدارة ملفات الطلاب").click();
  await expect(page.getByText("إلياس البركاني").first()).toBeVisible();

  // Fenêtre d'impression : hérite de la CSP de l'application.
  const popupPromise = context.waitForEvent("page");
  await page.locator("#export-students-pdf-btn").dispatchEvent("click");
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page.waitForTimeout(1500);
  const popupViolations = await popup.evaluate(() => (window as any).__csp || []).catch(() => []);
  await popup.close().catch(() => undefined);

  await page.locator("aside").getByText("شؤون العاملين والمدرسين").click();
  await expect(page.getByText("أستاذة النور").first()).toBeVisible();
  await page.locator("aside").getByText("المحاسبة والمالية الجمعوية").click();
  await page.waitForTimeout(1000);

  const inPage = await page.evaluate(() => (window as any).__csp || []);
  expect([...violations, ...inPage, ...popupViolations], "violations de la CSP").toEqual([]);
  await page.getByRole("button", { name: /خروج/ }).first().click();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
});
