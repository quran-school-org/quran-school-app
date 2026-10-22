/**
 * Impressions aux couleurs de la charte : fenêtres de reçu et d'attestation
 * (styles intégrés, sans CDN Tailwind, nom de l'école), et feuille @media print
 * de l'application (menu et barre du haut masqués). Données FICTIVES, émulateurs.
 * Si CAPTURE_DIR est défini, les aperçus imprimés y sont enregistrés.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR;

/** Neutralise print() et close() des fenêtres ouvertes, le temps de les inspecter. */
async function keepPopupsOpen(page: Page) {
  await page.evaluate(() => {
    const open = window.open.bind(window);
    (window as any).open = (...args: any[]) => {
      const w = open(...(args as [string?, string?, string?]));
      if (w) {
        (w as any).print = () => undefined;
        (w as any).close = () => undefined;
      }
      return w;
    };
  });
}

async function checkPopup(page: Page, trigger: () => Promise<void>, rootSelector: string, name: string) {
  const popupPromise = page.context().waitForEvent("page");
  await trigger();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
  await expect(popup.locator(rootSelector)).toBeVisible();
  // Plus de dépendance au CDN Tailwind ; polices de la charte.
  expect(await popup.locator('script[src*="cdn.tailwindcss.com"]').count()).toBe(0);
  expect(await popup.locator('link[href*="Reem+Kufi"]').count()).toBe(1);
  await popup.emulateMedia({ media: "print" });
  if (CAPTURE_DIR) {
    mkdirSync(join(CAPTURE_DIR, "impressions"), { recursive: true });
    await popup.setViewportSize({ width: 1100, height: 900 });
    await popup.screenshot({ path: join(CAPTURE_DIR, "impressions", `${name}.png`), fullPage: true });
  }
  return popup;
}

test.describe("impressions", () => {
  test("reçu, attestation et @media print de l'application", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await keepPopupsOpen(page);

    // Reçu d'une cotisation payée.
    await openTab(page, "payments");
    const reset = page.getByRole("button", { name: /إعادة تعيين الفلاتر/ });
    if (await reset.isVisible()) await reset.click();
    const receipt = await checkPopup(page, () => page.getByRole("button", { name: "طباعة وصل مالي رسمي" }).first().click(), ".receipt", "recu");
    await expect(receipt.locator(".receipt-head h1")).toContainText("جمعية الفجر الجديد");
    expect(await receipt.locator(".receipt-head").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(16, 36, 70)");
    await receipt.close();

    // Attestation d'examen.
    await openTab(page, "grades");
    const cert = await checkPopup(page, () => page.getByRole("button", { name: /عرض الشهادة التقديرية/ }).first().click(), ".cert", "attestation");
    await expect(cert.locator(".cert .name")).not.toBeEmpty();
    await cert.close();

    // Feuille d'impression de l'application : le cadre (menu, barre du haut) disparaît.
    await openTab(page, "dashboard");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator('[data-nav="desktop"]')).toBeHidden();
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await logout(page);
  });
});
