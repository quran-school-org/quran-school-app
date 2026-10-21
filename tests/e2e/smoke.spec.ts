/**
 * Test de fumée : connexion par rôle, isolation des données, changement
 * d'école. Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, SCHOOL_1, SCHOOL_2, loginAs, logout, openTab } from "./helpers";

test.describe.serial("parcours par rôle", () => {
  test("un identifiant inconnu est refusé", async ({ page }) => {
    await page.goto("/");
    await page.locator('form input[type="text"]').fill("inconnu");
    await page.locator('form input[type="password"]').fill("mauvais-mot-de-passe");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText("اسم المستخدم أو كلمة المرور غير صحيحة")).toBeVisible();
  });

  test("directeur : changement de mot de passe imposé, accès aux finances", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await expect(page.locator("header").getByText(SCHOOL_1).first()).toBeVisible();
    await expect(page.locator('[data-nav="desktop"] [data-tab="finance"]')).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await logout(page);
  });

  test("enseignant : pas de finances", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await expect(page.locator('[data-nav="desktop"]')).toBeVisible();
    await expect(page.locator('[data-tab="finance"]')).toHaveCount(0);
    await expect(page.locator('[data-tab="payments"]')).toHaveCount(0);
    await logout(page);
  });

  test("parent : seulement ses enfants", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await expect(page.getByText("مريم العلمي").first()).toBeVisible();
    await expect(page.getByText("أيوب العلوي")).toHaveCount(0);
    await expect(page.getByText("زينب الناصري")).toHaveCount(0);
    await logout(page);
  });

  test("agent d'entretien : aucun dossier d'élève", async ({ page }) => {
    await loginAs(page, ACCOUNTS.entretien);
    await expect(page.locator('[data-nav="desktop"]')).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await logout(page);
  });

  test("compte présent dans deux écoles : changement d'école sans fuite de données", async ({ page }) => {
    await loginAs(page, ACCOUNTS.administratif);
    await expect(page.locator("header").getByText(SCHOOL_1).first()).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();

    await page.locator("#school-switcher").selectOption("annour");
    await expect(page.locator("header").getByText(SCHOOL_2).first()).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.filter((k) => k.startsWith("kuttab:alfajr:"))).toEqual([]);

    await page.locator("#school-switcher").selectOption("alfajr");
    await expect(page.locator("header").getByText(SCHOOL_1).first()).toBeVisible();
    await logout(page);
  });

  test("directeur de la seconde école : ne voit que la sienne", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeurAnnour);
    await expect(page.locator("header").getByText(SCHOOL_2).first()).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("إلياس البركاني").first()).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await expect(page.locator("#school-switcher")).toHaveCount(0);
    await logout(page);
  });
});
