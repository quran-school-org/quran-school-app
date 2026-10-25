/**
 * Captures d'écran de référence (avant / après), pour chaque rôle et chaque
 * écran, en bureau (1440 px) et en mobile (390 px). Données FICTIVES,
 * émulateurs uniquement. Ne tourne que si CAPTURE_DIR est défini :
 *
 *   CAPTURE_DIR=/chemin/absolu npm run capture:screens
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, loginAs, logout, openTab, type DemoAccount, chooseOption } from "./helpers";

const DIR = process.env.CAPTURE_DIR || "";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
/** Filtres facultatifs (itérations de design) : CAPTURE_ROLES=directeur,parent CAPTURE_TABS=dashboard CAPTURE_MOBILE=0 */
const ONLY_ROLES = (process.env.CAPTURE_ROLES || "").split(",").filter(Boolean);
const ONLY_TABS = (process.env.CAPTURE_TABS || "").split(",").filter(Boolean);
const WITH_MOBILE = process.env.CAPTURE_MOBILE !== "0";
const EXTRAS = process.env.CAPTURE_EXTRAS !== "0";

test.skip(!DIR, "CAPTURE_DIR non défini");
test.setTimeout(240_000);

async function settle(page: Page) {
  await page.waitForTimeout(700);
}

async function shot(page: Page, folder: string, name: string, both = WITH_MOBILE) {
  mkdirSync(join(DIR, folder), { recursive: true });
  await settle(page);
  await page.screenshot({ path: join(DIR, folder, `${name}-bureau.png`), fullPage: true, animations: "disabled" });
  if (!both || !WITH_MOBILE) return;
  await page.setViewportSize(MOBILE);
  await settle(page);
  await page.screenshot({ path: join(DIR, folder, `${name}-mobile.png`), fullPage: true, animations: "disabled" });
  await page.setViewportSize(DESKTOP);
}

async function shotModal(page: Page, folder: string, name: string, open: () => Promise<void>, close: () => Promise<void>) {
  await open();
  await shot(page, folder, name, false);
  await close();
}

async function allScreens(page: Page, folder: string) {
  for (const tab of await desktopTabs(page)) {
    if (ONLY_TABS.length && !ONLY_TABS.includes(tab)) continue;
    await openTab(page, tab);
    await shot(page, folder, tab);
  }
}

const ROLES: [string, DemoAccount][] = [
  ["directeur", ACCOUNTS.directeur],
  ["administratif", ACCOUNTS.administratif],
  ["enseignant", ACCOUNTS.enseignant],
  ["parent", ACCOUNTS.parent],
  ["eleve", ACCOUNTS.eleve],
];

test.describe.serial("captures", () => {
  test.use({ viewport: DESKTOP });

  test("connexion et changement de mot de passe imposé", async ({ page }) => {
    test.skip(!EXTRAS, "extras filtrés");
    await page.goto("/");
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await shot(page, "connexion", "connexion");
    await page.locator('form input[type="text"]').fill(ACCOUNTS.directeur.username);
    await page.locator('form input[type="password"]').fill(ACCOUNTS.directeur.initial);
    await page.locator('form button[type="submit"]').click();
    const forced = page.getByText("لأسباب أمنية، يجب اختيار كلمة مرور جديدة");
    await expect(forced.or(page.locator("[data-app-shell]")).first()).toBeVisible();
    if (await forced.isVisible()) await shot(page, "connexion", "mot-de-passe-impose");
  });

  for (const [folder, account] of ROLES) {
    test(`écrans : ${folder}`, async ({ page }) => {
      test.skip(ONLY_ROLES.length > 0 && !ONLY_ROLES.includes(folder), "rôle filtré");
      await loginAs(page, account);
      await allScreens(page, folder);

      if (folder === "directeur" && EXTRAS) {
        await openTab(page, "students");
        await shotModal(page, folder, "fenetre-eleve",
          () => page.locator('[data-action="open-student-form"]').click(),
          () => page.locator('[data-modal="student-form"]').getByRole("button", { name: "إلغاء" }).click());
        await openTab(page, "grades");
        await shotModal(page, folder, "fenetre-examen",
          () => page.locator('[data-action="open-grade-form"]').click(),
          () => page.locator('[data-modal="grade-form"]').getByRole("button", { name: "إلغاء" }).click());
        await openTab(page, "payments");
        await shotModal(page, folder, "fenetre-paiement",
          () => page.locator('[data-action="open-payment-form"]').click(),
          () => page.locator('[data-modal="payment-form"]').getByRole("button", { name: "إلغاء" }).click());
        await openTab(page, "attendance");
        await shotModal(page, folder, "fenetre-releve-mensuel",
          () => page.locator('[data-action="open-monthly-report"]').first().click(),
          () => page.locator('[data-modal="monthly-report"]').getByRole("button", { name: /إغلاق الكشف/ }).click());
        await shotModal(page, folder, "fenetre-profil",
          () => page.locator('[data-action="open-profile"]').click(),
          () => page.locator('[data-modal="profile"]').getByRole("button", { name: "إلغاء" }).click());
        // Sous-onglets et fenêtres des modules extraits.
        const closeOverlay = () => page.locator(".fixed.inset-0, [data-modal]").last().getByRole("button", { name: /إلغاء|إغلاق/ }).first().click();
        await openTab(page, "teachers");
        await shotModal(page, folder, "fenetre-personnel", () => page.locator('[data-action="open-staff-form"]').click(), closeOverlay);
        await openTab(page, "classes");
        await shotModal(page, folder, "fenetre-halaqa", () => page.locator('[data-action="open-class-form"]').click(), closeOverlay);
        await openTab(page, "finance");
        await shotModal(page, folder, "fenetre-recette", () => page.locator('[data-action="open-income-form"]').click(), closeOverlay);
        for (const sub of ["salaries", "expenses", "report"]) {
          await page.locator(`[data-screen="finance"] [data-subtab="${sub}"]`).click();
          await shot(page, folder, `finance-${sub}`);
        }
        await openTab(page, "activities");
        await page.locator('[data-action="open-activity"]').first().click();
        await shot(page, folder, "activities-detail");
        await shotModal(page, folder, "fenetre-activite", () => page.locator('[data-action="open-activity-form"]').first().click(), closeOverlay);
        await openTab(page, "settings");
        await page.locator('[data-screen="settings"] [data-subtab="users"]').click();
        await shot(page, folder, "settings-users");
        await shotModal(page, folder, "fenetre-compte", () => page.locator('[data-action="open-user-form"]').click(), closeOverlay);
        // Page de choix et de création d'école (super-admin).
        await chooseOption(page, page.locator("#school-switcher"), "__picker__");
        await expect(page.locator('[data-screen="school-picker"]')).toBeVisible();
        await shot(page, folder, "choix-ecole-superadmin");
        await page.getByRole("button", { name: /جمعية الفجر الجديد/ }).first().click();
        await expect(page.locator("[data-app-shell]")).toBeVisible();
      }

      if (folder === "administratif" && EXTRAS) {
        // Page de choix d'école (compte présent dans deux écoles).
        await chooseOption(page, page.locator("#school-switcher"), "__picker__");
        await expect(page.locator('[data-screen="school-picker"]')).toBeVisible();
        await shot(page, folder, "choix-ecole");
        await page.getByRole("button", { name: /جمعية الفجر الجديد/ }).first().click();
        await expect(page.locator("[data-app-shell]")).toBeVisible();
      }
      await logout(page);
    });
  }
});
