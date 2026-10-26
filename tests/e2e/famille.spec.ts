/**
 * Parcours famille et tableaux en cartes (D89 : UI-01, 02, 03, 06, 17, 21).
 * Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, desktopTabs, loginAs, logout, openTab } from "./helpers";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1400, height: 900 };

const screen = (page: Page, name: string) => page.locator(`[data-screen="${name}"]`);
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function sessionDates(page: Page): Promise<string[]> {
  return page.locator("[data-attendance-list] li[data-session]").evaluateAll((els) => els.map((e) => e.getAttribute("data-session") || ""));
}

test.describe.serial("famille, présences en lecture seule, cartes", () => {
  test("parent : « ملخص » est le premier onglet, une carte par enfant", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    expect((await desktopTabs(page))[0]).toBe("home");
    const home = screen(page, "home");
    await expect(home).toBeVisible();
    await expect(home.locator("h1")).toHaveText("ملخص");
    await expect(home.locator("[data-child]")).toHaveCount(2);
    await expect(page.getByText("أيوب العلوي")).toHaveCount(0);
    // Carte du bas du menu : une ligne par enfant (prénom et hizb actuel), sans « أبعد حزب بلغه طالب ».
    const side = page.locator('[data-nav="desktop"] [data-family-sidebar="many"]');
    await expect(side.locator("[data-family-sidebar-child]")).toHaveCount(2);
    await expect(side.locator('[data-family-sidebar-child="S-101"]')).toContainText("ياسين");
    await expect(side.locator('[data-family-sidebar-child="S-101"]')).toContainText(/الحزب الحالي : \d+/);
    await expect(side.locator("[data-family-sidebar-extra]")).toHaveCount(0);
    await expect(page.locator('[data-nav="desktop"]')).not.toContainText("أبعد حزب بلغه طالب");
    for (const card of await home.locator("article[data-child]").all()) {
      await expect(card.getByRole("img", { name: /من 60 حزباً/ })).toBeVisible();
      await expect(card.getByText("آخر امتحان")).toBeVisible();
      await expect(card.getByText(/الحضور في آخر 30 يوماً/)).toBeVisible();
      await expect(card.getByText(/^رسوم /)).toBeVisible(); // cotisation du mois : parents seulement
    }
    // Ni recherche, ni compteur, ni papiers administratifs, ni aperçu de carte.
    await expect(home.getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByText("الأوراق الإدارية")).toHaveCount(0);
    await logout(page);
  });

  test("parent : fiche sans liste d'administration, carte dans une fenêtre", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "students");
    const students = screen(page, "students");
    await expect(students.locator("h1")).toHaveText("متابعة أبنائي");
    await expect(students.getByRole("searchbox")).toHaveCount(0);
    await expect(students.locator("table")).toHaveCount(0);
    await expect(page.getByText("قائمة طلاب النادي")).toHaveCount(0);
    await expect(page.getByText("معاينة بطاقة الطالب للاستخدام والتصدير")).toHaveCount(0);
    await expect(students.locator("[data-child]")).toHaveCount(2); // choix de l'enfant
    await students.locator('[data-child="S-102"]').click();
    await expect(students.locator('[aria-labelledby="dossier-title"]')).toContainText("مريم العلمي");

    await students.locator('[data-action="open-student-card"]').click();
    const modal = page.locator('[data-modal="student-card"]');
    await expect(modal.getByRole("dialog")).toBeVisible();
    await expect(modal).toContainText("مريم العلمي");
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
    await logout(page);
  });

  test("parent : halaqas de ses enfants, sans « لم يتم تعيين معلم » ni archive", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "classes");
    const classes = screen(page, "classes");
    await expect(classes.locator("article").first()).toBeVisible();
    await expect(page.getByText("لم يتم تعيين معلم")).toHaveCount(0);
    await expect(classes.getByText("الأرشيف")).toHaveCount(0);
    await expect(classes.getByRole("searchbox")).toHaveCount(0);
    await expect(classes.getByText("الاستيعاب والقدرة الاستيعابية")).toHaveCount(0);
    await expect(classes.getByText("إضافة")).toHaveCount(0);
    await logout(page);
  });

  test("parent : présences par enfant, du plus récent au plus ancien, sans saisie", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "attendance");
    const att = screen(page, "attendance-history");
    await expect(att).toBeVisible();
    await expect(att.locator("[data-attendance-list] li").first()).toBeVisible();
    const dates = await sessionDates(page);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates).toEqual([...dates].sort().reverse());
    // Lecture seule : aucun champ ni bouton de saisie de présence.
    await expect(att.locator("input, textarea")).toHaveCount(0);
    await expect(att.locator('[data-action*="attendance"], [data-attendance-status]')).toHaveCount(0);
    await att.getByRole("button", { name: "مريم العلمي" }).click();
    await expect(att.locator("#attendance-history-title")).toHaveText("مريم العلمي");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible(); // le choix reste proposé
    await logout(page);
  });

  test("parent : examens sans filtres ni bloc décoratif sous 8 résultats", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "grades");
    const grades = screen(page, "grades");
    await expect(grades.locator("h1")).toHaveText("النتائج والشهادات");
    await expect(grades.locator("[data-grade-filters]")).toHaveCount(0);
    await expect(grades.getByText("شهادة حفظ وتميز تجويدي")).toHaveCount(0);
    await logout(page);
  });

  test("élève : « ملخص » sans cotisation, un seul enfant", async ({ page }) => {
    await loginAs(page, ACCOUNTS.eleve);
    expect((await desktopTabs(page))[0]).toBe("home");
    const home = screen(page, "home");
    await expect(home.locator("article[data-child]")).toHaveCount(1);
    await expect(home.getByText(/^رسوم /)).toHaveCount(0); // les règles ne donnent pas les paiements à l'élève
    await openTab(page, "students");
    await expect(screen(page, "students").locator("[data-child]")).toHaveCount(0); // un seul enfant : pas de choix
    await expect(screen(page, "students").getByRole("searchbox")).toHaveCount(0);
    await logout(page);
  });

  test("administratif : présences en lecture seule, élève au choix", async ({ page }) => {
    await loginAs(page, ACCOUNTS.administratif);
    await openTab(page, "attendance");
    const att = screen(page, "attendance-history");
    await expect(att).toBeVisible();
    await chooseOption(page, att.getByRole("combobox", { name: "الطالب" }), "S-101");
    await expect(att.locator("#attendance-history-title")).toHaveText("ياسين العلمي");
    const dates = await sessionDates(page);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates).toEqual([...dates].sort().reverse());
    await expect(att.locator("input, textarea")).toHaveCount(0);
    await logout(page);
  });

  test("directeur : carte de l'élève dans une fenêtre, pas sous la fiche", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    const students = screen(page, "students");
    await expect(page.getByText("معاينة بطاقة الطالب للاستخدام والتصدير")).toHaveCount(0);
    await students.locator('[data-action="open-student-card"]').click();
    const modal = page.locator('[data-modal="student-card"]');
    await expect(modal.getByRole("dialog")).toBeVisible();
    await expect(modal.getByRole("button", { name: /طباعة وتصدير بطاقة الطالب/ })).toBeVisible();
    await modal.getByRole("button", { name: "إغلاق", exact: true }).last().click();
    await expect(modal).toHaveCount(0);
    await logout(page);
  });

  test("1 400 px : la colonne d'actions de la liste des élèves n'est pas rognée", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    const wrap = screen(page, "students").getByRole("region", { name: "قائمة الطلاب" });
    await expect(wrap.locator("tbody tr").first()).toBeVisible();
    const { scrollable, last, rects } = await wrap.evaluate((el) => {
      const th = el.querySelectorAll("thead th");
      const box = el.getBoundingClientRect();
      const r = th[th.length - 1].getBoundingClientRect();
      return { scrollable: el.scrollWidth - el.clientWidth, last: r.left >= box.left - 1 && r.right <= box.right + 1, rects: JSON.stringify({ box: [box.left, box.right], last: [r.left, r.right], n: th.length }) };
    });
    expect(scrollable).toBeLessThanOrEqual(1);
    expect(last, rects).toBe(true);
    await logout(page);
  });

  test("390 px : élèves et comptes en cartes, actions visibles, sans défilement horizontal", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await loginAs(page, ACCOUNTS.directeur);
    await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
    await page.locator('[data-nav="mobile"] [data-tab="students"]').click();
    const students = screen(page, "students");
    await expect(students.locator("[data-data-cards]")).toBeVisible();
    await expect(students.locator("table")).toHaveCount(0);
    const card = students.locator("[data-data-cards] [data-card]").first();
    await expect(card).toBeVisible();
    for (const name of ["تعديل الطالب", "أرشفة الطالب", "عرض التفاصيل"]) {
      const b = await card.getByRole("button", { name }).boundingBox();
      expect(b, name).not.toBeNull();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(PHONE.width);
    }
    expect(await overflow(page)).toBeLessThanOrEqual(1);

    await page.getByRole("button", { name: "القائمة الرئيسية", exact: true }).click();
    await page.locator('[data-nav="mobile"] [data-tab="settings"]').click();
    await screen(page, "settings").locator('[data-subtab="users"]').click();
    const users = screen(page, "settings").locator("[data-data-cards]");
    await expect(users).toBeVisible();
    const userCard = users.locator("[data-card]").first();
    const edit = await userCard.getByRole("button", { name: "تعديل الحساب والصلاحيات" }).boundingBox();
    expect(edit).not.toBeNull();
    expect(edit!.x + edit!.width).toBeLessThanOrEqual(PHONE.width);
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    await page.setViewportSize(DESKTOP);
    await logout(page);
  });
});
