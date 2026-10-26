/**
 * Audit UI/UX, saisies et finances (D92) : fenêtre d'examen (UI-11), fenêtre et liste des
 * paiements (UI-12, UI-08, UI-09), avatars de la fiche élève (UI-14), formats (UI-10),
 * comptabilité (UI-19), personnel (UI-18), notifications (UI-22), titres par rôle (UI-07).
 * Données FICTIVES, émulateurs uniquement. Si CAPTURE_DIR est défini, les écrans sont
 * enregistrés (bureau 1440 px et mobile 390 px).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, loginAs, logout, openTab } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];

async function shot(page: Page, name: string, both = true) {
  if (!CAPTURE_DIR) return;
  mkdirSync(join(CAPTURE_DIR, "saisie"), { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(CAPTURE_DIR, "saisie", `${name}-bureau.png`), fullPage: true, animations: "disabled" });
  if (!both) return;
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(CAPTURE_DIR, "saisie", `${name}-mobile.png`), fullPage: true, animations: "disabled" });
  await page.setViewportSize(DESKTOP);
}

test.describe.serial("audit UI : saisies, paiements, finances, personnel, notifications", () => {
  test.use({ viewport: DESKTOP });

  test("examen : notes vides et obligatoires, mention proposée puis modifiable", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "grades");
    // Attendre les données : le bouton refuse d'ouvrir la fenêtre tant qu'aucun élève n'est chargé.
    await expect(page.locator('[data-screen="grades"] li').first()).toBeVisible();
    await page.locator('[data-action="open-grade-form"]').click();
    const modal = page.locator('[data-modal="grade-form"]');
    await expect(modal).toBeVisible();
    const mem = modal.locator('input[type="number"]').nth(0);
    const taj = modal.locator('input[type="number"]').nth(1);
    const overall = modal.getByRole("combobox", { name: /التقدير الإجمالي/ });
    await expect(mem).toHaveValue("");
    await expect(taj).toHaveValue("");
    await expect(mem).toHaveAttribute("required", "");
    await expect(taj).toHaveAttribute("required", "");
    await expect(overall).toHaveAttribute("data-value", "");
    await expect(modal.getByRole("button", { name: "تسجيل وإصدار الشهادة" })).toBeVisible();
    await shot(page, "fenetre-examen");

    // Une seule note : pas de mention. Deux notes : mention proposée (moyenne 16 : جيد جداً, pas ممتاز).
    await mem.fill("16");
    await expect(overall).toHaveAttribute("data-value", "");
    await taj.fill("16");
    await expect(overall).toHaveAttribute("data-value", "جيد جداً");
    await taj.fill("19");
    await expect(overall).toHaveAttribute("data-value", "ممتاز"); // moyenne 17,5
    // Choix manuel : la mention n'est plus recalculée.
    await chooseOption(page, overall, "جيد");
    await taj.fill("20");
    await expect(overall).toHaveAttribute("data-value", "جيد");

    // Enregistrement sans portion : refusé par le formulaire (champ requis), la fenêtre reste ouverte.
    await modal.getByRole("button", { name: "تسجيل وإصدار الشهادة" }).click();
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder(/من الحزب/).fill("الحزب 3");
    await modal.getByRole("button", { name: "تسجيل وإصدار الشهادة" }).click();
    await expect(modal).toHaveCount(0);
    await logout(page);
  });

  test("paiement : « مدفوع » par défaut, « حفظ الدفعة », « غير مدفوع » reste accessible", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "payments");
    await page.locator('[data-action="open-payment-form"]').click();
    const modal = page.locator('[data-modal="payment-form"]');
    const status = modal.getByRole("combobox", { name: "حالة الدفع" });
    await expect(status).toHaveAttribute("data-value", "مدفوع");
    await expect(modal.getByRole("button", { name: "حفظ الدفعة" })).toBeVisible();
    await expect(modal.getByLabel("رقم الإيصال")).toBeVisible();
    await shot(page, "fenetre-paiement");
    await chooseOption(page, status, "غير مدفوع");
    await expect(modal.getByLabel("رقم الإيصال")).toHaveCount(0);
    await chooseOption(page, status, "مدفوع");
    await modal.getByRole("button", { name: "إلغاء" }).click();
    await logout(page);
  });

  test("liste des paiements (bureau) : deux listes pour le mois, état vide qui guide, formats", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "payments");
    const screen = page.locator('[data-screen="payments"]');
    await expect(screen.locator("h1")).toHaveText("الرسوم والمدفوعات");
    // Plus de champ de mois natif : deux listes de la charte.
    await expect(screen.locator('input[type="month"]')).toHaveCount(0);
    const month = screen.locator('[data-filter="payment-month"]');
    const year = screen.locator('[data-filter="payment-year"]');
    await expect(month).toHaveAttribute("data-value", MONTHS[new Date().getMonth()]);
    await expect(year).toHaveAttribute("data-value", String(new Date().getFullYear()));
    // Devise et chiffres : « د.م » partout, jamais « درهم », ni « 1,320 » ni « 1.320 ».
    const text = await screen.innerText();
    expect(text).not.toMatch(/درهم/);
    expect(text).not.toMatch(/\d[,.]\d{3}(?!\d)/);
    await shot(page, "paiements-directeur");

    // Mois sans paiement : état vide avec les deux actions.
    const years = await year.evaluate((el) => el.getAttribute("data-value"));
    let emptyShown = false;
    for (const m of MONTHS) {
      await chooseOption(page, month, m);
      if (await screen.locator('[data-action="show-all-months"]').isVisible()) { emptyShown = true; break; }
    }
    expect(emptyShown, `un mois de ${years} sans paiement`).toBe(true);
    await expect(screen.getByText(/لا مدفوعات مسجلة لشهر/)).toBeVisible();
    await expect(screen.locator('[data-action="empty-add-payment"]')).toBeVisible();
    await shot(page, "paiements-mois-vide");
    await screen.locator('[data-action="show-all-months"]').click();
    await expect(month).toHaveAttribute("data-value", "");
    await expect(year).toBeDisabled();
    await expect(screen.locator("tbody tr").first()).toBeVisible();
    await logout(page);
  });

  test("liste des paiements (parent) : pas de filtre de mois, du plus récent au plus ancien", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "payments");
    const screen = page.locator('[data-screen="payments"]');
    await expect(screen.locator("h1")).toHaveText("سجل الرسوم");
    await expect(screen.locator('[data-filter="payment-month"]')).toHaveCount(0);
    await expect(screen.locator('input[type="month"]')).toHaveCount(0);
    const rows = screen.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    const periods = await rows.evaluateAll((trs, months) => trs.map((tr) => {
      const m = /(\S+) \/ (\d{4})/.exec(tr.children[1]?.textContent || "");
      return m ? Number(m[2]) * 12 + (months as string[]).indexOf(m[1]) : -1;
    }), MONTHS);
    expect(periods.length).toBeGreaterThan(0);
    for (let i = 1; i < periods.length; i++) expect(periods[i - 1]).toBeGreaterThanOrEqual(periods[i]);
    expect(await screen.innerText()).not.toMatch(/درهم/);
    await shot(page, "paiements-parent");
    await logout(page);
  });

  test("fiche élève : plus d'Unsplash ni de champ URL", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => { if (/unsplash/i.test(r.url())) external.push(r.url()); });
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    await page.locator('[data-action="open-student-form"]').click();
    const modal = page.locator('[data-modal="student-form"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('input[type="url"]')).toHaveCount(0);
    await expect(modal.locator('img[src*="unsplash"]')).toHaveCount(0);
    await expect(modal.locator('input[type="file"]')).toHaveCount(1);
    await expect(modal.getByText(/الرمزيات المسبقة/)).toHaveCount(0);
    await shot(page, "fenetre-eleve", false);
    await modal.getByRole("button", { name: "إلغاء" }).click();
    expect(external).toEqual([]);
    await logout(page);
  });

  test("comptabilité : un seul total, une ligne de répartition, formats", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "finance");
    const screen = page.locator('[data-screen="finance"]');
    await expect(screen.locator("h1")).toHaveText("المحاسبة");
    await expect(screen.locator('[data-block="income-breakdown"]')).toBeVisible();
    await expect(screen.getByText("مجموع الإيرادات الكلي")).toHaveCount(0);
    await expect(screen.getByText("إجمالي المداخيل")).toHaveCount(1);
    const text = await screen.innerText();
    expect(text).not.toMatch(/\d[,.]\d{3}(?!\d)/);
    expect(text).not.toMatch(/درهم/);
    await shot(page, "comptabilite");
    await logout(page);
  });

  test("personnel : pas de rangée de chiffres, « تعديل » en action principale, menu « ⋯ » au clavier", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "teachers");
    const screen = page.locator('[data-screen="teachers"]');
    await expect(screen.locator("h1")).toHaveText("العاملون والمدرّسون");
    await expect(screen.getByText("طاقم نشط ومسجل")).toHaveCount(0);
    await expect(screen.getByText("يوسف البقالي").first()).toBeVisible();
    const edit = screen.locator('[data-action="edit-staff"]').first();
    await expect(edit).toBeVisible();
    const box = await edit.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(43);
    const trigger = screen.getByRole("button", { name: /المزيد من الإجراءات/ }).first();
    const tbox = await trigger.boundingBox();
    expect(tbox!.width).toBeGreaterThanOrEqual(43);
    expect(tbox!.height).toBeGreaterThanOrEqual(43);
    // Les actions secondaires ne sont plus visibles en permanence.
    await expect(page.getByRole("menuitem")).toHaveCount(0);
    await shot(page, "personnel");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = page.getByRole("menuitem");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toBeFocused();
    await expect(items.nth(0)).toHaveText("شارة العمل");
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await expect(items.nth(1)).toHaveText(/أرشفة/);
    await page.keyboard.press("End");
    await expect(items.nth(2)).toHaveText("حذف نهائي");
    await page.keyboard.press("Escape");
    await expect(items).toHaveCount(0);
    await expect(trigger).toBeFocused();
    // Badge : toujours atteignable (menu).
    await trigger.click();
    await page.locator('[role="menuitem"][data-action="open-staff-badge"]').click();
    await expect(page.locator('[data-modal="staff-badge"]')).toBeVisible();
    await page.locator('[data-modal="staff-badge"]').getByRole("button").first().click();
    await logout(page);
  });

  test("notifications : tout marquer comme lu en principal, effacer en discret, ligne cliquable", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "notifications");
    const screen = page.locator('[data-screen="notifications"]');
    await expect(screen.locator("h1")).toHaveText("الإشعارات");
    const markAll = screen.locator('[data-action="mark-all-notifications-read"]');
    const clear = screen.locator('[data-action="clear-notifications"]');
    await expect(clear).toHaveText("مسح الكل");
    await shot(page, "notifications");
    if (await markAll.isVisible()) {
      await expect(markAll).toHaveText("تعليم الكل كمقروء");
      // L'action principale est la première ; la destructive vient après et n'est pas pleine.
      const [a, b] = [await markAll.boundingBox(), await clear.boundingBox()];
      expect(Math.abs(a!.y - b!.y)).toBeLessThan(60);
      await markAll.click();
      await expect(markAll).toHaveCount(0);
      await expect(screen.getByText(/غير مقروءة/)).toHaveCount(0);
      await expect(screen.getByText("جديد", { exact: true })).toHaveCount(0);
    }
    // Confirmation conservée pour « مسح الكل ».
    await clear.click();
    const dialog = page.locator('[data-modal="confirm-clear-notifications"]');
    await expect(dialog.getByRole("dialog")).toBeVisible();
    await dialog.getByRole("button", { name: "إلغاء" }).click();
    await expect(dialog).toHaveCount(0);
    await logout(page);
  });

  test("notifications : le parent n'a pas d'action d'écriture, titre = libellé du menu", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    const tabs = await page.locator('[data-nav="desktop"] [data-tab]').evaluateAll((els) => els.map((e) => e.getAttribute("data-tab")));
    if (tabs.includes("notifications")) {
      await openTab(page, "notifications");
      const screen = page.locator('[data-screen="notifications"]');
      await expect(screen.locator("h1")).toHaveText("الإشعارات");
      await expect(screen.locator('[data-action="mark-all-notifications-read"]')).toHaveCount(0);
      await expect(screen.locator('[data-action="clear-notifications"]')).toHaveCount(0);
    }
    await logout(page);
  });
});
