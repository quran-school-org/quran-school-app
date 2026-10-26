/**
 * Listes déroulantes de la charte et pagination (D83). Données FICTIVES
 * (npm run seed:emulator), émulateurs uniquement.
 *
 * - liste déroulante : clavier (↑ ↓ Entrée Échap, première lettre), clic
 *   extérieur, recherche intégrée ; en FR, libellés traduits et valeurs
 *   (`data-value`) inchangées ;
 * - pagination des élèves (8 par page) : bornes, retour à la page 1 à la
 *   recherche, fiche de l'élève sélectionné conservée hors de la page ;
 * - confirmation avant d'effacer toutes les notifications.
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, loginAs, logout, openTab } from "./helpers";

const menu = (page: Page) => page.locator("[data-select-menu]");
const option = (page: Page, value: string) => menu(page).locator(`[role="option"][data-value="${value}"]`);
const setLang = async (page: Page, lang: "ar" | "fr") => {
  await page.locator("#i18n-test-switch .i18n-test-toggle").click();
  await page.locator(`#i18n-test-switch button[data-lang="${lang}"]`).click();
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
};

test.describe.serial("listes déroulantes et pagination (D83)", () => {
  test("liste déroulante : clavier, Échap, clic extérieur, recherche", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    const trigger = page.locator('[data-filter="student-status"]');
    await expect(trigger).toHaveAttribute("role", "combobox");
    await expect(trigger).toHaveAttribute("data-value", "active");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ↓ ouvre sur l'option sélectionnée, ↓ passe à la suivante, Entrée choisit.
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page).getByRole("listbox")).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(option(page, "active")).toHaveAttribute("aria-selected", "true");
    await expect(option(page, "active")).toHaveAttribute("data-active", "");
    await page.keyboard.press("ArrowDown");
    await expect(option(page, "archived")).toHaveAttribute("data-active", "");
    await expect(trigger).toHaveAttribute("aria-activedescendant", (await option(page, "archived").getAttribute("id"))!);
    await page.keyboard.press("Enter");
    await expect(menu(page)).toHaveCount(0);
    await expect(trigger).toHaveAttribute("data-value", "archived");
    await expect(trigger).toBeFocused();

    // Échap ferme sans rien changer ; ↑ ne sort pas des bornes.
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeVisible();
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowUp");
    await expect(option(page, "active")).toHaveAttribute("data-active", "");
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(trigger).toHaveAttribute("data-value", "archived");

    // Clic extérieur : fermeture sans changement.
    await trigger.click();
    await expect(menu(page)).toBeVisible();
    await page.locator('[data-screen="students"] h1, [data-screen="students"] h2').first().click();
    await expect(menu(page)).toHaveCount(0);
    await chooseOption(page, trigger, "active");
    await expect(trigger).toHaveAttribute("data-value", "active");

    // Plus de 10 options : champ de recherche intégré (fenêtre de paiement).
    await openTab(page, "payments");
    await page.locator('[data-action="open-payment-form"]').click();
    const modal = page.locator('[data-modal="payment-form"]');
    const student = modal.getByRole("combobox").first();
    await student.click();
    const search = menu(page).getByRole("searchbox");
    await expect(search).toBeFocused();
    await search.fill("سارة");
    await expect(menu(page).locator('[role="option"]:visible')).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(menu(page)).toHaveCount(0);
    await expect(student).toContainText("سارة العلوي");
    // Échap dans le menu ne ferme pas la fenêtre.
    await student.click();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "إلغاء" }).click();
    await logout(page);
  });

  test("liste déroulante en FR : libellés traduits, valeurs intactes, saisie de lettre", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await setLang(page, "fr");
    await openTab(page, "students");
    const trigger = page.locator('[data-filter="student-status"]');
    await expect(trigger).toContainText("Élèves actifs");
    await expect(trigger).toHaveAttribute("data-value", "active");
    await trigger.click();
    await expect(option(page, "archived")).toContainText("Élèves archivés");
    await expect(option(page, "all")).toContainText("Tous (actifs et archivés)");
    // Première lettre du libellé AFFICHÉ (traduit) : « T » → « Tous… ».
    await page.keyboard.press("t");
    await expect(option(page, "all")).toHaveAttribute("data-active", "");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("data-value", "all");
    await expect(trigger).toContainText("Tous (actifs et archivés)");
    // Retour en arabe : même valeur, libellé d'origine.
    await setLang(page, "ar");
    await expect(trigger).toHaveAttribute("data-value", "all");
    await expect(trigger).toContainText("الكل (نشط ومؤرشف)");
    await chooseOption(page, trigger, "active");
    await logout(page);
  });

  test("élèves : 8 par page, bornes, retour à la page 1, fiche conservée", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    const screen = page.locator('[data-screen="students"]');
    const rows = screen.getByRole("region", { name: "قائمة الطلاب" }).locator("tbody tr");
    const nav = screen.locator('[data-pagination="students"]');
    const summary = nav.locator("p");
    await expect(rows).toHaveCount(8);
    const total = Number((await summary.textContent())!.match(/من (\d+)/)![1]);
    expect(total).toBeGreaterThan(8);
    await expect(summary).toHaveText(`الطلاب 1–8 من ${total}`);
    await expect(nav.locator('[data-page-prev]:visible')).toBeDisabled();
    await expect(nav.locator('[data-page="1"]:visible')).toHaveAttribute("aria-current", "page");

    await nav.locator("[data-page-next]:visible").click();
    await expect(nav.locator('[data-page="2"]:visible')).toHaveAttribute("aria-current", "page");
    const onPage2 = Math.min(8, total - 8);
    await expect(rows).toHaveCount(onPage2);
    await expect(summary).toHaveText(`الطلاب 9–${8 + onPage2} من ${total}`);
    if (total <= 16) await expect(nav.locator("[data-page-next]:visible")).toBeDisabled();

    // Sélection sur la page 2, puis retour à la page 1 : la fiche reste celle de l'élève choisi.
    const chosen = (await rows.first().locator("td").first().locator("span.font-semibold").first().textContent())!.trim();
    await rows.first().click();
    const dossier = screen.locator('[aria-labelledby="dossier-title"]');
    await expect(dossier).toContainText(chosen);
    await nav.locator("[data-page-prev]:visible").click();
    await expect(nav.locator('[data-page="1"]:visible')).toHaveAttribute("aria-current", "page");
    await expect(dossier).toContainText(chosen);
    await screen.locator('[data-action="show-selected-student-page"]').click();
    await expect(nav.locator('[data-page="2"]:visible')).toHaveAttribute("aria-current", "page");

    // Recherche : retour à la page 1.
    await screen.getByRole("searchbox").first().fill("العلمي");
    await expect(summary).toHaveText("الطلاب 1–2 من 2");
    await expect(rows).toHaveCount(2);
    await expect(nav.locator("[data-page]")).toHaveCount(0);
    await expect(dossier).toContainText(chosen);
    await screen.getByRole("searchbox").first().fill("");
    await expect(nav.locator('[data-page="1"]:visible')).toHaveAttribute("aria-current", "page");
    await logout(page);
  });

  test("notifications : effacer tout demande une confirmation", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "notifications");
    const screen = page.locator('[data-screen="notifications"]');
    const items = screen.locator("ul > li");
    // Le jeu fictif contient au moins une notification (« تسجيل طالب جديد ») : attendre la liste.
    await expect(items.first()).toBeVisible();
    const before = await items.count();
    await screen.locator('[data-action="clear-notifications"]').click();
    const dialog = page.locator('[data-modal="confirm-clear-notifications"]');
    await expect(dialog.getByRole("dialog")).toBeVisible();
    await expect(dialog).toContainText(`عدد التنبيهات التي ستُحذف: ${before}`);
    await expect(dialog).toContainText("لا يمكن التراجع");
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(items).toHaveCount(before);
    await logout(page);
  });
});
