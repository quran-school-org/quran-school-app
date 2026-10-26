/**
 * Appel rapide de l'enseignant (UI-04, UI-16, UI-09, UI-20) : halaqa présélectionnée, « tous présents »
 * qui n'écrase aucune saisie, date sans champ natif, présence de la semaine sur téléphone.
 * Données FICTIVES (émulateurs) : youssef_baqali est le muḥaffiẓ de « حلقة النور » (5 élèves).
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, loginAs, logout, openTab } from "./helpers";

const screen = (page: Page) => page.locator('[data-screen="attendance"]');
const row = (page: Page, name: string) => screen(page).locator("[data-student-row]").filter({ hasText: name });
const pressed = (page: Page, name: string, status: string) => row(page, name).getByRole("button", { name: status, exact: true });

test.describe("appel de l'enseignant", () => {
  test("sa halaqa est présélectionnée, la carte du jour mène à l'appel", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await openTab(page, "attendance");
    await expect(screen(page).getByRole("combobox").first()).toContainText("حلقة النور");
    await expect(row(page, "ياسين العلمي")).toBeVisible();
    await expect(row(page, "سارة العلوي")).toHaveCount(0); // élève d'une autre halaqa
    // pas de <input type="date"> natif
    await expect(screen(page).locator('input[type="date"]')).toHaveCount(0);

    await openTab(page, "teacher-dashboard");
    const card = page.locator('[data-card="today-session"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("حلقة النور");
    await card.locator('[data-action="take-attendance"]').click();
    await expect(screen(page)).toBeVisible();
    await expect(screen(page).getByRole("combobox").first()).toContainText("حلقة النور");
    await logout(page);
  });

  test("la ligne d'un élève ouvre le suivi du hifz", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await openTab(page, "teacher-dashboard");
    await page.locator('[data-action="open-teacher-student-file"]').first().click();
    await expect(page.locator('[data-modal="teacher-student-file"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-modal="teacher-student-file"]')).toHaveCount(0);
    await logout(page);
  });

  test("« تسجيل الجميع حاضرين » ne remplace aucune saisie existante", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await openTab(page, "attendance");

    // Un lundi passé (aucune séance de « حلقة النور » ce jour-là : aucune absence automatique).
    await screen(page).locator('[data-attendance-date] [aria-controls="attendance-date-fields"]').click();
    const fields = screen(page).locator("#attendance-date-fields").getByRole("combobox");
    await chooseOption(page, fields.nth(2), "2025");
    await chooseOption(page, fields.nth(1), "9");
    await chooseOption(page, fields.nth(0), "13");
    const summary = screen(page).locator("[data-attendance-summary]");
    await expect(summary).toContainText("13 أكتوبر 2025");
    await expect(summary.locator('[data-count="غير مرصود"]')).toContainText("5");

    await pressed(page, "ياسين العلمي", "غائب").click();
    await pressed(page, "مريم العلمي", "متأخر").click();
    await expect(pressed(page, "ياسين العلمي", "غائب")).toHaveAttribute("aria-pressed", "true");

    await screen(page).locator('[data-action="mark-all-present"]').click();
    await expect(pressed(page, "ياسين العلمي", "غائب")).toHaveAttribute("aria-pressed", "true"); // intacte
    await expect(pressed(page, "ياسين العلمي", "حاضر")).toHaveAttribute("aria-pressed", "false");
    await expect(pressed(page, "مريم العلمي", "متأخر")).toHaveAttribute("aria-pressed", "true"); // intacte
    await expect(pressed(page, "أيوب العلوي", "حاضر")).toHaveAttribute("aria-pressed", "true");
    await expect(pressed(page, "طارق السوسي", "حاضر")).toHaveAttribute("aria-pressed", "true");
    await expect(summary.locator('[data-count="حاضر"]')).toContainText("3");
    await expect(summary.locator('[data-count="غائب"]')).toContainText("1");
    await expect(summary.locator('[data-count="متأخر"]')).toContainText("1");
    await expect(summary.locator('[data-count="غير مرصود"]')).toContainText("0");
    await expect(screen(page).locator('[data-action="mark-all-present"]')).toBeDisabled();

    // « اليوم » et « الحصة السابقة »
    await screen(page).locator('[data-action="attendance-today"]').click();
    await expect(summary).not.toContainText("13 أكتوبر 2025");
    const todayText = await summary.locator("span").first().innerText();
    await screen(page).locator('[data-action="attendance-previous"]').click();
    await expect(summary.locator("span").first()).not.toHaveText(todayText);
    await logout(page);
  });
});

test.describe("présence de la semaine sur téléphone (UI-20)", () => {
  test("barres horizontales à 390 px, colonnes à 1 440 px, sans débordement", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTab(page, "dashboard");
    await expect(page.locator('[data-weekly="columns"], p:has-text("لم تُسجَّل")').first()).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const rows = page.locator('[data-weekly="rows"]');
    if (await rows.count()) {
      await expect(rows).toBeVisible();
      await expect(page.locator('[data-weekly="columns"]')).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 1400, height: 900 });
    await logout(page);
  });
});
