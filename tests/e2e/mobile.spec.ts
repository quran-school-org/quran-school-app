/**
 * Mise en page mobile (360 px) : aucun écran ne doit provoquer de défilement
 * horizontal de la page (les tableaux défilent dans leur carte), et le menu
 * mobile s'ouvre et se ferme. Données FICTIVES, émulateurs.
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, loginAs, logout, openTab } from "./helpers";

const DESKTOP = { width: 1400, height: 900 };
const PHONE = { width: 360, height: 780 };

async function pageOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const [name, account] of [
  ["directeur", ACCOUNTS.directeur],
  ["enseignant", ACCOUNTS.enseignant],
  ["parent", ACCOUNTS.parent],
] as const) {
  test(`360 px sans défilement horizontal : ${name}`, async ({ page }) => {
    await loginAs(page, account);
    const tabs = await desktopTabs(page);
    expect(tabs.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const tab of tabs) {
      await page.setViewportSize(DESKTOP);
      await openTab(page, tab);
      await page.setViewportSize(PHONE);
      await page.waitForTimeout(150);
      const overflow = await pageOverflow(page);
      if (overflow > 1) offenders.push(`${tab} (+${overflow}px)`);
    }
    expect(offenders).toEqual([]);

    // Menu mobile : bouton, tiroir, fermeture par Échap.
    await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
    await expect(page.locator('[data-nav="mobile"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-nav="mobile"]')).toBeHidden();
    await page.setViewportSize(DESKTOP);
    await logout(page);
  });
}
