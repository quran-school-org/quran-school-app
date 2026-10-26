/**
 * « الأنشطة والرحلات » des familles (D94) : vue simplifiée en lecture seule.
 * Données FICTIVES (npm run seed:emulator) : l'activité « رحلة تجريبية » compte
 * l'inscription de S-101 (payée) ; S-102 (même parent) et S-109 (élève) ne sont pas inscrits.
 * CAPTURE_DIR=/chemin/absolu : enregistre aussi des captures (390 et 1440 px).
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

const screen = (page: Page) => page.locator('[data-screen="activities"]');
const shot = async (page: Page, name: string) => {
  const dir = process.env.CAPTURE_DIR;
  if (!dir) return;
  for (const [tag, width] of [["1440", 1440], ["390", 390]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: `${dir}/${name}-${tag}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1400, height: 900 });
};

test.describe.serial("activités : vue famille", () => {
  test("parent : situation de chaque enfant, sans dépenses, budget, boutons ni totaux", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "activities");
    const view = page.locator('[data-screen="activities"][data-view="family"]');
    await expect(view).toBeVisible();
    await expect(view.locator("h1")).toHaveText("الأنشطة والرحلات");
    const card = view.locator("[data-activity]").first();
    await expect(card).toContainText("رحلة تجريبية");
    await expect(card).toContainText("واجب المساهمة");
    await expect(card).toContainText("50 د.م");
    await expect(card).toContainText("قيد التسجيل");
    // Description, programme (long : replié) et rendez-vous ; rien de financier interne (400 = bus).
    await expect(card.locator('[data-activity-text="description"]')).toContainText("رحلة ترفيهية وتربوية إلى الغابة");
    await expect(card.locator("[data-activity-meeting]")).toContainText("أمام مقر الجمعية، الساعة 08:00");
    const program = card.locator('[data-activity-text="program"]');
    await expect(program).toContainText("08:00 الانطلاق من مقر الجمعية");
    await expect(card.locator('[data-activity-text="description"]').getByRole("button")).toHaveCount(0); // court : pas de repli
    const more = program.getByRole("button", { name: "عرض المزيد" });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    const less = program.getByRole("button", { name: "عرض أقل" });
    await expect(less).toHaveAttribute("aria-expanded", "true");
    await expect(program).toContainText("17:00 العودة إلى مقر الجمعية");
    await less.click();
    await expect(program.getByRole("button", { name: "عرض المزيد" })).toHaveAttribute("aria-expanded", "false");
    await expect(card).not.toContainText("400");
    // Deux enfants : l'un inscrit et payé, l'autre non inscrit.
    await expect(card.locator("[data-child-state]")).toHaveCount(2);
    const inscrit = card.locator('[data-child-state="S-101"]');
    await expect(inscrit).toHaveAttribute("data-registered", "yes");
    await expect(inscrit).toContainText("ياسين العلمي");
    await expect(inscrit).toContainText("مسجّل");
    await expect(inscrit).toContainText("مدفوع");
    const absent = card.locator('[data-child-state="S-102"]');
    await expect(absent).toHaveAttribute("data-registered", "no");
    await expect(absent).toContainText("غير مسجّل");
    // Rien de l'interface du bureau.
    for (const text of ["مصاريف النشاط", "الميزانية والربط المالي", "مرتبط بمالية الجمعية", "تم الربط المالي", "إضافة نفقة", "تسجيل مشارك جديد", "طباعة لائحة المشاركين", "الصافي", "المشاركون"]) {
      await expect(view.getByText(text)).toHaveCount(0);
    }
    await expect(view.getByRole("button")).toHaveCount(1); // seul bouton : « عرض المزيد » du programme replié
    await expect(view.getByRole("tab")).toHaveCount(0);
    await expect(view.getByRole("searchbox")).toHaveCount(0); // 8 activités ou moins : ni recherche ni filtre
    await shot(page, "activites-parent");
    await logout(page);
  });

  test("élève : seulement sa propre situation", async ({ page }) => {
    await loginAs(page, ACCOUNTS.eleve);
    await openTab(page, "activities");
    const view = page.locator('[data-screen="activities"][data-view="family"]');
    await expect(view).toBeVisible();
    const card = view.locator("[data-activity]").first();
    await expect(card.locator("[data-child-state]")).toHaveCount(1);
    await expect(card.locator('[data-child-state="S-109"]')).toContainText("غير مسجّل");
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await expect(view.getByRole("button")).toHaveCount(1); // seul bouton : « عرض المزيد » du programme replié
    await logout(page);
  });

  test("directeur : l'écran du bureau est inchangé", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "activities");
    await expect(screen(page)).toBeVisible();
    await expect(page.locator('[data-view="family"]')).toHaveCount(0);
    await expect(page.locator("#btn-add-new-activity")).toBeVisible();
    await expect(page.getByText("المشاركون المسجلون")).toBeVisible();
    await shot(page, "activites-directeur");
    await logout(page);
  });
});
