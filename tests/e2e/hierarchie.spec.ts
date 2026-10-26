/**
 * Hiérarchie des écrans (audit UX, lot L5, D100) : sauvegarde dans les Paramètres,
 * « تحتاج إجراء » avant la carte du ḥifẓ, état vide de la présence, comptabilité,
 * dates lisibles. Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, loginAs, logout, openTab } from "./helpers";

const DESKTOP = { width: 1440, height: 900 };

/** Vrai si `first` précède `second` dans l'ordre du document. */
async function precedes(page: Page, first: string, second: string): Promise<boolean> {
  return page.evaluate(([a, b]) => {
    const x = document.querySelector(a);
    const y = document.querySelector(b);
    if (!x || !y) throw new Error(`introuvable : ${!x ? a : b}`);
    return Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
  }, [first, second]);
}

test.describe.serial("hiérarchie (L5)", () => {
  test.use({ viewport: DESKTOP });

  test("sauvegarde : dans les Paramètres pour le directeur, plus sur le tableau de bord", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "dashboard");
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await expect(page.locator("#manual-db-backup-btn")).toHaveCount(0);
    await expect(page.locator("#manual-db-restore-btn")).toHaveCount(0);

    await openTab(page, "settings");
    const section = page.locator('[data-section="backup"]');
    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { name: "النسخ الاحتياطي" })).toBeVisible();
    await expect(section).toContainText("الاسترجاع يستبدل جميع البيانات الحالية");

    // Téléchargement : même fichier JSON qu'avant.
    const [download] = await Promise.all([page.waitForEvent("download"), section.getByRole("button", { name: "تنزيل نسخة احتياطية" }).click()]);
    const content = JSON.parse(readFileSync((await download.path()) as string, "utf-8"));
    expect(content).toHaveProperty("backupDate");
    expect(Array.isArray(content.students)).toBe(true);

    // Restauration : le bouton ouvre le sélecteur de fichier (la confirmation suit la lecture du fichier).
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), section.getByRole("button", { name: "استرجاع نسخة" }).click()]);
    expect(chooser.isMultiple()).toBe(false);

    // L'onglet « المستخدمون » n'affiche pas la section.
    await page.locator('[data-subtab="users"]').click();
    await expect(section).toHaveCount(0);
    await page.locator('[data-subtab="general"]').click();
    await expect(section).toBeVisible();
    await logout(page);
  });

  test("sauvegarde : absente pour un enseignant", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    expect(await desktopTabs(page)).not.toContain("settings");
    for (const tab of await desktopTabs(page)) {
      await openTab(page, tab);
      await expect(page.locator('[data-section="backup"]')).toHaveCount(0);
      await expect(page.locator("#manual-db-backup-btn")).toHaveCount(0);
      await expect(page.locator("#manual-db-restore-btn")).toHaveCount(0);
    }
    await logout(page);
  });

  test("« تحتاج إجراء » précède la carte du ḥifẓ quand il y a des alertes, et suit les chiffres clés", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "dashboard");
    const block = page.locator('[data-block="action-needed"]');
    await expect(block).toBeVisible();
    // Des alertes réelles (documents manquants, élève sans halaqa, cotisations…), pas le message « rien à faire ».
    await expect(block).toContainText("بوثائق ناقصة"); // attendre les données : sans alerte, le bloc reste à sa place d'origine
    await expect(block.getByText("لا شيء يحتاج إجراءً الآن")).toHaveCount(0);
    expect(await precedes(page, '[aria-label="مؤشرات رئيسية"]', '[data-block="action-needed"]')).toBe(true);
    expect(await precedes(page, '[data-block="action-needed"]', "#hifz-map-title")).toBe(true);
    await logout(page);
  });

  test("présence de la semaine : état vide explicite au lieu de cases vides", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeurAnnour); // aucune présence enregistrée
    await openTab(page, "dashboard");
    const empty = page.locator('[data-weekly="empty"]');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("لم يُسجَّل حضور هذا الأسبوع بعد");
    await expect(page.locator('[data-weekly="columns"]')).toHaveCount(0);
    await expect(page.locator('[data-weekly="rows"]')).toHaveCount(0);
    await logout(page);
  });

  test("comptabilité : l'ajout du sous-onglet est l'action principale, l'impression est secondaire", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "finance");
    const screen = page.locator('[data-screen="finance"]');
    const bg = (loc: ReturnType<Page["locator"]>) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
    const print = screen.getByRole("button", { name: "طباعة التقرير المالي الختامي" });
    await expect(print).toBeVisible();

    const add: Record<string, string> = { revenues: "open-income-form", salaries: "open-salary-form", expenses: "open-expense-form" };
    for (const [sub, action] of Object.entries(add)) {
      await screen.locator(`[data-subtab="${sub}"]`).click();
      const button = screen.locator(`[data-action="${action}"]`);
      await expect(button).toHaveCount(1); // une seule, dans l'en-tête de la page
      expect(await screen.locator("section").first().locator(`[data-action="${action}"]`).count()).toBe(1);
      for (const other of Object.values(add).filter((a) => a !== action)) await expect(screen.locator(`[data-action="${other}"]`)).toHaveCount(0);
      expect(await bg(button)).not.toBe(await bg(print));
      expect(await bg(button)).toBe(await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.className = "bg-primary";
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      }));
      // La recherche et l'exercice sont juste sous les onglets, avant les chiffres et le tableau.
      expect(await precedes(page, '[data-block="finance-filters"]', 'h3')).toBe(true);
    }
    await screen.locator('[data-subtab="report"]').click();
    await expect(screen.locator('[data-block="finance-filters"]')).toBeVisible();
    for (const a of Object.values(add)) await expect(screen.locator(`[data-action="${a}"]`)).toHaveCount(0);
    await logout(page);
  });

  test("dates lisibles à l'accueil du parent, sans format ISO", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    const home = page.locator('[data-screen="home"]');
    // Attendre les données (date lisible affichée) avant de lire tout le texte.
    await expect(home).toContainText(/\d{1,2} (يناير|فبراير|مارس|أبريل|ماي|يونيو|يوليوز|غشت|شتمبر|أكتوبر|نونبر|دجنبر) \d{4}/);
    expect(await home.innerText()).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    await logout(page);
  });
});
