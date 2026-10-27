/**
 * Retours à l'utilisateur (D99) : `Toast` et `ConfirmDialog` remplacent les boîtes natives
 * `alert()` et `confirm()`. Données FICTIVES, émulateurs uniquement. Si CAPTURE_DIR est
 * défini, des captures (bureau 1440 px, mobile 390 px) y sont enregistrées (non commitées).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(join(CAPTURE_DIR, "retours"), { recursive: true });
  for (const [label, size] of [["bureau", DESKTOP], ["mobile", MOBILE]] as const) {
    await page.setViewportSize(size);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(CAPTURE_DIR, "retours", `${name}-${label}.png`), animations: "disabled" });
  }
  await page.setViewportSize(DESKTOP);
}

const EXPENSE_TITLE = "نفقة اختبار التأكيد (e2e)";
const PROJECT_ID = "demo-quran-school";

/** Paramètres de l'école avant les enregistrements du test (Admin SDK, ÉMULATEUR uniquement : projet demo-), rétablis ensuite. */
async function withSettingsDoc<T>(run: (doc: { get: () => Promise<Record<string, unknown> | undefined>; set: (d: Record<string, unknown>) => Promise<unknown> }) => Promise<T>): Promise<T> {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, `e2e-retours-${Date.now()}`);
  try {
    const ref = getFirestore(app).doc("schools/alfajr/settings/system");
    return await run({ get: async () => (await ref.get()).data(), set: (d) => ref.set(d) });
  } finally {
    await deleteApp(app);
  }
}

/** Champs obligatoires vides dans les données fictives (courriel, superviseur) : remplis pour pouvoir enregistrer. */
async function fillRequiredSettings(page: Page) {
  const form = page.locator("form:has(#btn-save-general-settings)");
  for (const field of await form.locator("input[required], textarea[required]").all()) {
    if (await field.inputValue()) continue;
    await field.fill((await field.getAttribute("type")) === "email" ? "contact@example.test" : "قيمة تجريبية");
  }
}

let savedSettings: Record<string, unknown> | undefined;

test.describe.serial("retours : confirmation et messages (D99)", () => {
  test.use({ viewport: DESKTOP });

  test.beforeAll(async () => {
    savedSettings = await withSettingsDoc((doc) => doc.get());
  });

  test.afterAll(async () => {
    if (savedSettings) await withSettingsDoc((doc) => doc.set(savedSettings!));
  });

  test("suppression d'une dépense : confirmation, l'annulation ne supprime rien, la confirmation supprime", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "finance");
    await page.locator('[data-subtab="expenses"]').click();

    // Création d'une dépense dédiée au test (supprimée à la fin).
    await page.locator('[data-action="open-expense-form"]').click();
    const form = page.locator('[data-modal="expense-form"]');
    await form.getByLabel("بيان النفقة / المشتريات *").fill(EXPENSE_TITLE);
    await form.getByRole("button", { name: "حفظ النفقة" }).click();
    await expect(form).toHaveCount(0);
    const row = page.locator("tr", { hasText: EXPENSE_TITLE });
    await expect(row).toHaveCount(1);

    // 1. Suppression demandée : boîte de la charte, focus sur « إلغاء », rien n'est supprimé.
    await row.getByRole("button", { name: "حذف" }).click();
    const confirmBox = page.locator('[data-modal="confirm-dialog"]');
    const dialog = confirmBox.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("تأكيد الحذف");
    await expect(dialog).toContainText("هل أنت متأكد من حذف هذه النفقة؟");
    await expect(confirmBox.getByRole("button", { name: "إلغاء" })).toBeFocused();
    await expect(confirmBox.getByRole("button", { name: "حذف" })).toBeVisible();
    await shot(page, "confirmation");

    // Annuler : la dépense reste.
    await confirmBox.getByRole("button", { name: "إلغاء" }).click();
    await expect(confirmBox).toHaveCount(0);
    await expect(row).toHaveCount(1);

    // Échap : la dépense reste aussi, et le focus revient sur le bouton d'origine.
    await row.getByRole("button", { name: "حذف" }).click();
    await expect(confirmBox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(confirmBox).toHaveCount(0);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("button", { name: "حذف" })).toBeFocused();

    // Confirmer : la dépense est supprimée.
    await row.getByRole("button", { name: "حذف" }).click();
    await confirmBox.getByRole("button", { name: "حذف" }).click();
    await expect(confirmBox).toHaveCount(0);
    await expect(row).toHaveCount(0);

    await logout(page);
  });

  test("validation bloquante : erreur sous le champ (aria-invalid, role=alert), focus sur le champ, la fenêtre reste ouverte", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "activities");
    await page.locator('[data-action="open-activity"]').first().click();
    await page.getByRole("button", { name: /مصاريف النشاط/ }).first().click();
    await page.getByRole("button", { name: "إضافة نفقة / مصروف" }).first().click();
    const form = page.locator('[data-modal="activity-expense-form"]');
    const title = form.getByLabel("بيان / عنوان المصروف");
    // Un intitulé fait d'espaces passe la validation native du navigateur, pas celle de l'application.
    await title.fill("   ");
    await form.getByLabel("المبلغ (د.م)").fill("50");
    await form.getByRole("button", { name: "إضافة المصروف" }).click();

    const error = form.getByRole("alert").filter({ hasText: "يرجى إدخال وصف أو اسم المصروف." });
    await expect(error).toHaveCount(1);
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title).toBeFocused();
    await expect(form).toBeVisible();
    await shot(page, "erreur-champ");

    // Corriger le champ efface l'erreur.
    await title.fill("حافلة");
    await expect(error).toHaveCount(0);
    await expect(title).not.toHaveAttribute("aria-invalid", "true");

    await form.getByRole("button", { name: "إلغاء" }).click();
    await logout(page);
  });

  test("erreur bloquante hors champ : message d'erreur (role=alert), fermeture au bouton nommé", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "settings");
    await page.locator('[data-subtab="general"]').click();
    // Logo de plus de 2 Mo : refusé avec un message, aucune boîte native.
    await page.locator("#logo-upload-input").setInputFiles({ name: "grand-logo.png", mimeType: "image/png", buffer: Buffer.alloc(3 * 1024 * 1024) });

    const toast = page.locator('[data-toast="error"]');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveAttribute("role", "alert");
    await expect(toast).toContainText("حجم الصورة كبير جداً");
    await shot(page, "toast-erreur");

    await toast.getByRole("button", { name: "إغلاق الإشعار" }).click();
    await expect(toast).toHaveCount(0);
    await logout(page);
  });

  test("enregistrement : toast de succès (role=status), sans boîte native", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "settings");
    await page.locator('[data-subtab="general"]').click();
    await fillRequiredSettings(page);
    await page.locator("#btn-save-general-settings").click();

    const toast = page.locator('[data-toast="success"]');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveAttribute("role", "status");
    await expect(toast).toContainText("تم حفظ الإعدادات وتحديث معلومات المؤسسة بنجاح!");
    await expect(toast.getByRole("button", { name: "إغلاق الإشعار" })).toBeVisible();
    // Le message ne masque ni la barre du haut ni le contenu : région fixée en bas, sans capter les clics.
    const region = page.locator("[data-toast-region]");
    await expect(region).toHaveCSS("pointer-events", "none");
    await shot(page, "toast-succes");

    // Fermeture automatique (5 s pour un succès).
    await expect(toast).toHaveCount(0, { timeout: 9_000 });
    await logout(page);
  });

  test("mobile 390 px : le message tient dans l'écran, sans défilement horizontal", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "settings");
    await page.locator('[data-subtab="general"]').click();
    await fillRequiredSettings(page);
    await page.setViewportSize(MOBILE);
    await page.locator("#btn-save-general-settings").click();
    const toast = page.locator('[data-toast="success"]');
    await expect(toast).toBeVisible();
    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(MOBILE.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await shot(page, "toast-mobile");
    await page.setViewportSize(DESKTOP);
    await logout(page);
  });
});
