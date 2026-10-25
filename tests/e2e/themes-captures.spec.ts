/**
 * Captures de contrôle des thèmes (D84) : tableau de bord, Élèves et
 * Paramètres, pour chacun des cinq thèmes, en arabe, à 1440 px. Données
 * FICTIVES, émulateurs uniquement. Ne tourne que si THEME_CAPTURE_DIR est défini :
 *
 *   THEME_CAPTURE_DIR=/chemin/absolu npx playwright test tests/e2e/themes-captures.spec.ts
 *   (dans `firebase emulators:exec … "npm run seed:emulator && …"`, comme capture:screens)
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { THEME_IDS } from "../../src/theme/palettes";
import { ACCOUNTS, loginAs, openTab } from "./helpers";

const DIR = process.env.THEME_CAPTURE_DIR || "";
const PROJECT_ID = "demo-quran-school";

test.skip(!DIR, "THEME_CAPTURE_DIR non défini");
test.setTimeout(300_000);
test.use({ viewport: { width: 1440, height: 900 } });

test("captures des cinq thèmes", async ({ page }) => {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, `e2e-theme-captures-${Date.now()}`);
  const settings = getFirestore(app).doc("schools/alfajr/settings/system");
  mkdirSync(DIR, { recursive: true });

  try {
    await loginAs(page, ACCOUNTS.directeur);
    for (const id of THEME_IDS) {
      await settings.update({ theme: id });
      await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(id);
      for (const tab of ["dashboard", "students", "settings"]) {
        await openTab(page, tab);
        await page.waitForTimeout(900);
        await page.mouse.move(0, 0);
        await page.screenshot({ path: join(DIR, `${id}-${tab}.png`), fullPage: true, animations: "disabled" });
      }
      // Survol d'un élément du menu et du bouton principal (contrôle des survols).
      await openTab(page, "students");
      await page.locator('[data-nav="desktop"] [data-tab="payments"]').hover();
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(DIR, `${id}-survol-menu.png`), clip: { x: 1100, y: 0, width: 340, height: 520 }, animations: "disabled" });
    }
  } finally {
    await settings.update({ theme: FieldValue.delete() });
    await deleteApp(app);
  }
});
