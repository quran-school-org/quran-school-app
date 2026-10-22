/**
 * Constat O-05 : les codes QR (cartes d'élève, badges du personnel) sont générés
 * localement ; aucune requête ne part vers un service tiers (api.qrserver.com),
 * ni à l'écran ni à l'impression. Données FICTIVES, émulateurs.
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

test("codes QR générés localement, sans appel à qrserver", async ({ page }) => {
  const external: string[] = [];
  page.context().on("request", (req) => {
    if (/qrserver/i.test(req.url())) external.push(req.url());
  });
  await loginAs(page, ACCOUNTS.directeur);

  // Cartes d'élève (laboratoire) : QR en SVG en ligne.
  await openTab(page, "id-cards-lab");
  await page.getByRole("button", { name: /بطاقة الهوية الرقمية/ }).click();
  await expect(page.locator('#lab-printable-area svg[aria-label^="رمز QR"]').first()).toBeVisible();

  // Impression d'une carte : la fenêtre contient le même SVG.
  await page.evaluate(() => {
    const open = window.open.bind(window);
    (window as any).open = (...args: any[]) => {
      const w = open(...(args as [string?, string?, string?]));
      if (w) { (w as any).print = () => undefined; (w as any).close = () => undefined; }
      return w;
    };
  });
  const popupPromise = page.context().waitForEvent("page");
  await page.getByRole("button", { name: /طباعة الوجهين/ }).first().click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
  await expect(popup.locator('svg[aria-label^="رمز QR"]').first()).toBeAttached();
  await popup.close();

  // Badge du personnel.
  await openTab(page, "teachers");
  await page.locator('[data-action="open-staff-badge"]').first().click();
  await expect(page.locator('[data-modal="staff-badge"] svg[aria-label^="رمز QR"]')).toBeVisible();
  await page.locator('[data-modal="staff-badge"]').getByRole("button").first().click();
  await expect(page.locator('[data-modal="staff-badge"]')).toHaveCount(0);

  await page.waitForTimeout(500);
  expect(external).toEqual([]);
  await logout(page);
});
