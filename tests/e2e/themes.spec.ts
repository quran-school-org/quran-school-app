/**
 * Thème de couleur par école (D84) : choix dans Paramètres (aperçu immédiat,
 * enregistrement), persistance après rechargement, thème propre à chaque
 * école (changement d'école, autre directeur), dernier thème sur l'écran de
 * connexion. Données FICTIVES, émulateurs uniquement (projet demo-).
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, loginAs, logout, openTab } from "./helpers";

const PROJECT_ID = "demo-quran-school";
const BLEU = "rgb(16, 36, 70)"; // #102446
const FORET = "rgb(11, 42, 30)"; // #0B2A1E
const EMERAUDE = "rgb(14, 59, 46)"; // #0E3B2E

const navBackground = (page: Page) =>
  page.locator('[data-nav="desktop"]').evaluate((el) => getComputedStyle(el).backgroundColor);
const htmlTheme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const metaThemeColor = (page: Page) => page.locator('meta[name="theme-color"]').getAttribute("content");

async function adminSettings() {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, `e2e-themes-${Date.now()}`);
  const db = getFirestore(app);
  const ref = (school: string) => db.doc(`schools/${school}/settings/system`);
  return {
    theme: async (school: string) => (await ref(school).get()).data()?.theme as string | undefined,
    snapshot: async (school: string) => (await ref(school).get()).data(),
    restore: async (school: string, data: Record<string, unknown> | undefined) => {
      if (data) await ref(school).set(data);
    },
    reset: async () => {
      for (const school of ["alfajr", "annour"]) {
        if ((await ref(school).get()).exists) await ref(school).update({ theme: FieldValue.delete() });
      }
    },
    close: () => deleteApp(app),
  };
}

/** Champs obligatoires vides dans les données fictives (courriel, superviseur) : remplis pour pouvoir enregistrer. */
async function fillRequiredSettings(page: Page) {
  const form = page.locator("form:has(#btn-save-general-settings)");
  for (const field of await form.locator("input[required], textarea[required]").all()) {
    if (await field.inputValue()) continue;
    await field.fill((await field.getAttribute("type")) === "email" ? "contact@example.test" : "قيمة تجريبية");
  }
}

let savedAlfajr: Record<string, unknown> | undefined;

test.describe.serial("thème de couleur par école", () => {
  test.beforeAll(async () => {
    const admin = await adminSettings();
    await admin.reset();
    savedAlfajr = await admin.snapshot("alfajr");
    await admin.close();
  });

  test.afterAll(async () => {
    const admin = await adminSettings();
    await admin.restore("alfajr", savedAlfajr);
    await admin.reset();
    await admin.close();
  });

  test("aperçu sans enregistrement : le thème enregistré revient en quittant Paramètres", async ({ page }) => {
    // Aucun thème enregistré : émeraude par défaut (D88).
    await loginAs(page, ACCOUNTS.directeur);
    await expect.poll(() => navBackground(page)).toBe(EMERAUDE);
    await openTab(page, "settings");
    const bleu = page.locator('[data-theme-option="bleu-nuit"]');
    await expect(page.locator('[data-theme-option="emeraude"]')).toHaveAttribute("aria-pressed", "true");
    await bleu.click();
    await expect(bleu).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => navBackground(page)).toBe(BLEU);
    await openTab(page, "dashboard");
    await expect.poll(() => navBackground(page)).toBe(EMERAUDE);
    await logout(page);
  });

  test("choisir « foret » change la barre latérale, persiste au rechargement, pas dans l'autre école", async ({ page }) => {
    const admin = await adminSettings();
    try {
      await loginAs(page, ACCOUNTS.directeur);
      await openTab(page, "settings");
      const before = await navBackground(page);
      expect(before).toBe(EMERAUDE);

      // Clavier : la vignette est un vrai bouton (Tab puis Espace).
      const foret = page.locator('[data-theme-option="foret"]');
      await foret.focus();
      await page.keyboard.press("Space");
      await expect(foret).toHaveAttribute("aria-pressed", "true");
      await expect.poll(() => navBackground(page)).toBe(FORET);
      expect(await metaThemeColor(page)).toBe("#0B2A1E");

      await fillRequiredSettings(page);
      await page.locator("#btn-save-general-settings").click();
      await expect.poll(() => admin.theme("alfajr")).toBe("foret");

      await page.reload();
      await expect(page.locator("[data-app-shell]")).toBeVisible();
      expect(await htmlTheme(page)).toBe("foret");
      await expect.poll(() => navBackground(page)).toBe(FORET);

      // Écran de connexion : dernier thème connu sur l'appareil.
      await logout(page);
      expect(await htmlTheme(page)).toBe("foret");

      // Compte présent dans les deux écoles : le thème suit l'école active.
      await loginAs(page, ACCOUNTS.administratif);
      await expect.poll(() => navBackground(page)).toBe(FORET);
      await chooseOption(page, page.locator("#school-switcher"), "annour");
      await expect.poll(() => navBackground(page)).toBe(EMERAUDE);
      expect(await htmlTheme(page)).toBe("emeraude");
      await chooseOption(page, page.locator("#school-switcher"), "alfajr");
      await expect.poll(() => navBackground(page)).toBe(FORET);
      await logout(page);

      // Directeur de l'autre école : son école garde le thème par défaut.
      await loginAs(page, ACCOUNTS.directeurAnnour);
      await expect.poll(() => navBackground(page)).toBe(EMERAUDE);
      expect(await admin.theme("annour")).toBeUndefined();
      await logout(page);
    } finally {
      await admin.close();
    }
  });
});
