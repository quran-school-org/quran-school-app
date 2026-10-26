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

  // Constats 1 et 2 de l'audit UX : tiroir rogné, nom de l'école sous le bouton « × ».
  test("390×667 : le tiroir défile jusqu'à « خروج » et la carte, le nom d'école ne touche pas « × »", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 667 });
    await loginAs(page, ACCOUNTS.administratif); // deux écoles : sélecteur + sortie + carte dans le tiroir
    await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
    const nav = page.locator('[data-nav="mobile"]');
    await expect(nav).toBeVisible();
    const drawer = page.locator("aside", { has: nav });

    // Le contenu dépasse l'écran : il doit donc défiler (avant : coupé par overflow-hidden).
    const m = await drawer.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight, navH: el.querySelector("nav")!.getBoundingClientRect().height }));
    expect(m.scroll).toBeGreaterThan(m.client);
    expect(m.navH).toBeGreaterThan(m.client); // le menu n'est pas écrasé à la hauteur de l'écran

    // « خروج » et la carte de statistiques s'atteignent par défilement, et se touchent.
    const logout = nav.locator("[data-drawer-account]").getByRole("button", { name: /خروج/ });
    const card = nav.locator('button[title="استعراض الإحصائيات"]');
    for (const target of [logout, card]) {
      await target.scrollIntoViewIfNeeded();
      const b = (await target.boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height).toBeLessThanOrEqual(667 + 0.5);
      await target.click({ trial: true });
    }
    // En bas du défilement : la carte est entièrement visible, rien n'est coupé en dessous.
    await drawer.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(667 + 0.5);

    // Haut du tiroir : le nom de l'école et le bouton « × » ne se chevauchent pas.
    await drawer.evaluate((el) => { el.scrollTop = 0; });
    const name = (await nav.locator("[data-active-school]").boundingBox())!;
    const close = (await drawer.getByRole("button", { name: "إغلاق القائمة", exact: true }).boundingBox())!;
    const overlap = name.x < close.x + close.width && close.x < name.x + name.width && name.y < close.y + close.height && close.y < name.y + name.height;
    expect(overlap, `nom ${JSON.stringify(name)} / fermer ${JSON.stringify(close)}`).toBe(false);
    expect(name.y).toBeGreaterThanOrEqual(0);

    // Le bouton « خروج » fonctionne après défilement.
    await logout.scrollIntoViewIfNeeded();
    await logout.click();
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
