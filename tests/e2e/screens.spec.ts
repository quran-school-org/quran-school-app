/**
 * Filet de sécurité du découpage d'App.tsx et du nouveau design : pour chaque
 * rôle, le menu affiche exactement les onglets attendus, chaque écran s'ouvre,
 * et les données affichées respectent le périmètre du rôle.
 * Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, loginAs, logout, openTab } from "./helpers";

// Ordre du menu de la charte : التعليم / المالية / الإدارة.
const ALL_OFFICE = ["dashboard", "students", "classes", "grades", "attendance", "payments", "finance", "activities", "teachers", "id-cards-lab", "notifications"];

/** emptyTabs : onglets sans écran de saisie pour ce rôle (état vide explicatif, constat F3). */
type RoleCase = {
  name: string;
  account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS];
  tabs: string[];
  emptyTabs?: string[];
  checks?: (page: Page) => Promise<void>;
};

async function expectScreen(page: Page, tab: string) {
  await expect(page.locator(`[data-screen="${tab}"]`)).toBeVisible();
}

const CASES: RoleCase[] = [
  {
    name: "directeur",
    account: ACCOUNTS.directeur,
    tabs: [...ALL_OFFICE, "settings"],
    checks: async (page) => {
      await openTab(page, "students");
      await expect(page.locator('[data-screen="students"]').getByText("ياسين العلمي").first()).toBeVisible();
      await expect(page.locator('[data-screen="students"]').getByText("أيوب العلوي").first()).toBeVisible();
      await openTab(page, "teachers");
      await expect(page.locator('[data-screen="teachers"]').getByText("يوسف البقالي").first()).toBeVisible();
      await openTab(page, "classes");
      await expect(page.locator('[data-screen="classes"]').getByText("حلقة النور").first()).toBeVisible();
      await openTab(page, "payments");
      await page.getByRole("button", { name: /إعادة تعيين الفلاتر/ }).click();
      await expect(page.locator('[data-screen="payments"]').getByText("ياسين العلمي").first()).toBeVisible();
      await openTab(page, "settings");
      await expect(page.locator('[data-screen="settings"]')).toBeVisible();
    },
  },
  {
    name: "administratif",
    account: ACCOUNTS.administratif,
    tabs: ALL_OFFICE,
    emptyTabs: ["attendance"],
    checks: async (page) => {
      await openTab(page, "finance");
      await expect(page.locator('[data-screen="finance"]').getByText("تبرع", { exact: true }).first()).toBeVisible();
      await openTab(page, "activities");
      await expect(page.locator('[data-screen="activities"]').getByText("رحلة تجريبية").first()).toBeVisible();
    },
  },
  {
    name: "enseignant",
    account: ACCOUNTS.enseignant,
    tabs: ["teacher-dashboard", "students", "classes", "grades", "attendance", "activities", "id-cards-lab", "notifications"],
    checks: async (page) => {
      await openTab(page, "teacher-dashboard");
      await expect(page.locator('[data-screen="teacher-dashboard"]').getByText("ياسين العلمي").first()).toBeVisible();
      await openTab(page, "attendance");
      await expect(page.locator('[data-screen="attendance"]').getByText("ياسين العلمي").first()).toBeVisible();
      await openTab(page, "grades");
      await expect(page.locator('[data-screen="grades"]').getByText("ياسين العلمي").first()).toBeVisible();
    },
  },
  {
    name: "parent",
    account: ACCOUNTS.parent,
    tabs: ["students", "classes", "grades", "attendance", "payments", "activities", "notifications"],
    emptyTabs: ["attendance"],
    checks: async (page) => {
      for (const tab of ["students", "grades", "payments"]) {
        await openTab(page, tab);
        if (tab === "payments") await page.getByRole("button", { name: /إعادة تعيين الفلاتر/ }).click();
        const screen = page.locator(`[data-screen="${tab}"]`);
        await expect(screen.getByText("ياسين العلمي").first()).toBeVisible();
        await expect(screen.getByText("مريم العلمي").first()).toBeVisible();
        await expect(page.getByText("أيوب العلوي")).toHaveCount(0);
        await expect(page.getByText("زينب الناصري")).toHaveCount(0);
      }
    },
  },
  {
    name: "élève",
    account: ACCOUNTS.eleve,
    tabs: ["students", "classes", "grades", "attendance", "activities", "notifications"],
    emptyTabs: ["attendance"],
    checks: async (page) => {
      for (const tab of ["students", "grades"]) {
        await openTab(page, tab);
        await expect(page.locator(`[data-screen="${tab}"]`).getByText("علي الرباطي").first()).toBeVisible();
        await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
        await expect(page.getByText("زينب الناصري")).toHaveCount(0);
      }
    },
  },
  {
    name: "encadrant",
    account: ACCOUNTS.encadrant,
    tabs: ["dashboard", "students", "classes", "grades", "attendance", "activities", "id-cards-lab", "notifications"],
    emptyTabs: ["attendance"],
  },
];

test.describe.serial("écrans par rôle", () => {
  for (const c of CASES) {
    test(`${c.name} : menu, écrans et périmètre des données`, async ({ page }) => {
      await loginAs(page, c.account);
      expect(await desktopTabs(page)).toEqual(c.tabs);
      // Écran d'accueil : le premier onglet du menu, jamais une page vide.
      await expectScreen(page, c.tabs[0]);
      for (const tab of c.tabs) {
        await openTab(page, tab);
        await expect(page.locator(`[data-nav="desktop"] [data-tab="${tab}"]`)).toBeVisible();
        if (c.emptyTabs?.includes(tab)) {
          await expect(page.locator('[data-screen="attendance-unavailable"]')).toBeVisible();
        } else {
          await expectScreen(page, tab);
        }
      }
      if (c.checks) await c.checks(page);
      await logout(page);
    });
  }

  test("directeur : formulaires et fenêtres principales", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    await page.locator('[data-action="open-student-form"]').click();
    await expect(page.locator('[data-modal="student-form"]')).toBeVisible();
    await page.locator('[data-modal="student-form"]').getByRole("button", { name: "إلغاء" }).click();
    await expect(page.locator('[data-modal="student-form"]')).toHaveCount(0);

    await openTab(page, "grades");
    await page.locator('[data-action="open-grade-form"]').click();
    await expect(page.locator('[data-modal="grade-form"]')).toBeVisible();
    await page.locator('[data-modal="grade-form"]').getByRole("button", { name: "إلغاء" }).click();

    await openTab(page, "payments");
    await page.locator('[data-action="open-payment-form"]').click();
    await expect(page.locator('[data-modal="payment-form"]')).toBeVisible();
    await page.locator('[data-modal="payment-form"]').getByRole("button", { name: "إلغاء" }).click();

    await openTab(page, "attendance");
    await page.locator('[data-action="open-monthly-report"]').first().click();
    await expect(page.locator('[data-modal="monthly-report"]')).toBeVisible();
    await page.locator('[data-modal="monthly-report"]').getByRole("button", { name: /إغلاق الكشف/ }).click();
    await expect(page.locator('[data-modal="monthly-report"]')).toHaveCount(0);

    await page.locator('[data-action="open-profile"]').click();
    await expect(page.locator('[data-modal="profile"]')).toBeVisible();
    await page.locator('[data-modal="profile"]').getByRole("button", { name: "إلغاء" }).click();
    await expect(page.locator('[data-modal="profile"]')).toHaveCount(0);
    await logout(page);
  });
});
