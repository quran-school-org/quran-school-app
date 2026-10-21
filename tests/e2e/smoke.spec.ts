/**
 * Test de fumée : connexion par rôle, isolation des données, changement
 * d'école. Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { expect, test, type Page } from "@playwright/test";

const SCHOOL_1 = "جمعية الفجر الجديد (بيانات تجريبية)";
const SCHOOL_2 = "مدرسة النور القرآنية (بيانات تجريبية)";

async function login(page: Page, username: string, password: string, newPassword?: string) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/");
  await page.locator('form input[type="text"]').fill(username);
  await page.locator('form input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  const forced = page.getByText("لأسباب أمنية، يجب اختيار كلمة مرور جديدة");
  await expect(page.getByText("أهلاً بك").or(forced).or(page.getByText("اختيار المدرسة")).first()).toBeVisible();
  if (await forced.isVisible()) {
    expect(newPassword, `changement de mot de passe imposé pour ${username}`).toBeTruthy();
    const inputs = page.locator('form input[type="password"]');
    await inputs.last().fill(newPassword!);
    await page.locator('form button[type="submit"]', { hasText: "حفظ" }).click();
    await expect(forced).toBeHidden();
  }
}

async function logout(page: Page) {
  await page.getByRole("button", { name: /خروج/ }).first().click();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kuttab:") || k.startsWith("alfajr_")))).toEqual([]);
}

test.describe.serial("parcours par rôle", () => {
  test("un identifiant inconnu est refusé", async ({ page }) => {
    await page.goto("/");
    await page.locator('form input[type="text"]').fill("inconnu");
    await page.locator('form input[type="password"]').fill("mauvais-mot-de-passe");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText("اسم المستخدم أو كلمة المرور غير صحيحة")).toBeVisible();
  });

  test("directeur : changement de mot de passe imposé, accès aux finances", async ({ page }) => {
    await login(page, "admin_alfajr", "demo-directeur-2026", "e2e-directeur-2026");
    await expect(page.locator("header").getByText(SCHOOL_1).first()).toBeVisible();
    await expect(page.locator("aside").getByText("المحاسبة والمالية الجمعوية")).toBeVisible();
    await page.locator("aside").getByText("إدارة ملفات الطلاب").click();
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await logout(page);
  });

  test("enseignant : pas de finances", async ({ page }) => {
    await login(page, "youssef_baqali", "123", "e2e-enseignant-2026");
    await expect(page.locator("aside").getByText("المحاسبة والمالية الجمعوية")).toHaveCount(0);
    await logout(page);
  });

  test("parent : seulement ses enfants", async ({ page }) => {
    await login(page, "mohammed_alami", "123", "e2e-parent-2026");
    await page.locator("aside").getByText("متابعة أبنائي والطلاب").click();
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await expect(page.getByText("مريم العلمي").first()).toBeVisible();
    await expect(page.getByText("أيوب العلوي")).toHaveCount(0);
    await expect(page.getByText("زينب الناصري")).toHaveCount(0);
    await logout(page);
  });

  test("agent d'entretien : aucun dossier d'élève", async ({ page }) => {
    await login(page, "said_morabit", "123", "e2e-entretien-2026");
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await logout(page);
  });

  test("compte présent dans deux écoles : changement d'école sans fuite de données", async ({ page }) => {
    await login(page, "khalid_tazi", "123", "e2e-multi-2026");
    await expect(page.locator("header").getByText(SCHOOL_1).first()).toBeVisible();
    await page.locator("aside").getByText("إدارة ملفات الطلاب").click();
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
    await login(page, "dir_annour", "demo-annour-2026");
    await expect(page.locator("header").getByText(SCHOOL_2).first()).toBeVisible();
    await page.locator("aside").getByText("إدارة ملفات الطلاب").click();
    await expect(page.getByText("إلياس البركاني").first()).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await expect(page.locator("#school-switcher")).toHaveCount(0);
    await logout(page);
  });
});
