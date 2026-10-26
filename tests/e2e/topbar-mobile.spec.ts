/**
 * UI-05 : à 390 px, la barre du haut tient sur une seule ligne (≤ 64 px) ;
 * le changement d'école et la déconnexion restent accessibles, depuis le tiroir
 * du menu. À 1 440 px, la barre complète est conservée. Données FICTIVES, émulateurs.
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, SCHOOL_1, SCHOOL_2, chooseOption, loginAs } from "./helpers";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

test.describe.serial("barre du haut mobile (UI-05)", () => {
  test("390 px : une ligne, école tronquée, tiroir avec école et déconnexion", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await loginAs(page, ACCOUNTS.administratif); // compte présent dans deux écoles
    const bar = page.locator("[data-topbar]");
    await expect(bar).toBeVisible();
    const box = await bar.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(64);
    await expect(page.locator("[data-active-school-mobile]")).toBeVisible();
    // Menu, cloche et avatar : cibles d'au moins 44 px, aucun défilement horizontal.
    for (const loc of [page.getByRole("button", { name: "القائمة الرئيسية", exact: true }), page.getByRole("button", { name: /^الإشعارات/ }), page.locator('[data-action="open-profile"]')]) {
      const b = await loc.boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(43.5);
      expect(b!.height).toBeGreaterThanOrEqual(43.5);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    // Sélecteur d'école et sortie ne sont plus dans la barre.
    await expect(page.locator("#school-switcher")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /خروج/ })).toHaveCount(0);

    // Tiroir : ouverture, école, Échap.
    const menu = page.getByRole("button", { name: "القائمة الرئيسية", exact: true });
    await menu.click();
    await expect(page.locator('[data-nav="mobile"]')).toBeVisible();
    await expect(page.locator("#school-switcher")).toBeVisible();
    await chooseOption(page, page.locator("#school-switcher"), "annour");
    await expect(page.locator("[data-active-school-mobile]")).toContainText(SCHOOL_2.split(" (")[0]);
    await chooseOption(page, page.locator("#school-switcher"), "alfajr");
    await expect(page.locator("[data-active-school-mobile]")).toContainText(SCHOOL_1.split(" (")[0]);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-nav="mobile"]')).toBeHidden();

    // Déconnexion depuis le tiroir (vrai bouton, au clavier).
    await menu.click();
    const logoutBtn = page.locator("[data-drawer-account]").getByRole("button", { name: /خروج/ });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test("1 440 px : barre complète (école, sortie) conservée", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ACCOUNTS.administratif);
    await expect(page.locator("#school-switcher")).toBeVisible();
    const logoutBtn = page.locator("[data-topbar]").getByRole("button", { name: /خروج/ });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });
});
