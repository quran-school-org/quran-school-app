/**
 * Traduction française de TEST (D79) : sélecteur AR / FR, connexion et
 * navigation en FR, valeurs et saisies jamais traduites. Données FICTIVES,
 * émulateurs uniquement ; `npm run dev` lit .env.development (drapeau actif).
 *
 * Options (désactivées par défaut) :
 *   CAPTURE_DIR=/chemin/absolu       captures FR (bureau 1440 px, mobile 390 px)
 *   I18N_MISSING_OUT=/chemin/fichier  parcours des écrans, chaînes sans traduction
 * Retrait de la traduction : supprimer ce fichier avec src/i18n-test (D79).
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, openTab, type DemoAccount, chooseOption } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR || "";
const MISSING_OUT = process.env.I18N_MISSING_OUT || "";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const html = (page: Page) => page.locator("html");
const switcher = (page: Page) => page.locator("#i18n-test-switch");

async function setLang(page: Page, lang: "ar" | "fr") {
  await switcher(page).locator(`button[data-lang="${lang}"]`).click();
  await expect(html(page)).toHaveAttribute("lang", lang);
}

/** Connexion depuis l'interface en FR (messages attendus en français). */
async function loginFr(page: Page, account: DemoAccount) {
  page.on("dialog", (d) => d.accept().catch(() => undefined));
  await page.goto("/");
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
  if ((await html(page).getAttribute("lang")) !== "fr") await setLang(page, "fr");
  await expect(page.getByText("Connexion sécurisée")).toBeVisible();
  const forced = page.getByText(/Pour des raisons de sécurité, vous devez choisir un nouveau mot de passe/);
  const bad = page.getByText("Nom d'utilisateur ou mot de passe incorrect");
  const shell = page.locator("[data-app-shell]");
  for (const password of [account.initial, account.e2e]) {
    await page.locator('form input[type="text"]').fill(account.username);
    await page.locator('form input[type="password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
    await expect(shell.or(forced).or(bad).first()).toBeVisible();
    if (await bad.isVisible()) continue;
    if (await forced.isVisible()) {
      await page.locator('[data-modal="profile"] form input[type="password"]').last().fill(account.e2e);
      await page.locator('[data-modal="profile"] form button[type="submit"]').click();
      await expect(forced).toBeHidden();
    }
    await expect(shell).toBeVisible();
    return;
  }
  throw new Error(`connexion impossible pour ${account.username}`);
}

async function logoutFr(page: Page) {
  await page.getByRole("button", { name: /Déconnexion/ }).first().click();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
}

test.describe.serial("traduction FR de test (D79)", () => {
  test("bascule AR → FR → AR sur l'écran de connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await expect(html(page)).toHaveAttribute("dir", "rtl");
    await expect(switcher(page)).toBeVisible();
    await expect(switcher(page)).toContainText("test");
    await expect(page.getByText("تسجيل الدخول الآمن")).toBeVisible();

    await setLang(page, "fr");
    await expect(html(page)).toHaveAttribute("dir", "ltr");
    await expect(page.getByText("Connexion sécurisée")).toBeVisible();
    await expect(page.getByText("Nom d'utilisateur", { exact: true })).toBeVisible();
    await expect(page.locator('[data-screen="login"]')).toHaveCSS("direction", "ltr");

    await setLang(page, "ar");
    await expect(html(page)).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("تسجيل الدخول الآمن")).toBeVisible();
    await expect(page.getByText("Connexion sécurisée")).toHaveCount(0);
    await expect(page.locator('[data-screen="login"]')).toHaveCSS("direction", "rtl");

    // Le choix est mémorisé dans le navigateur.
    await setLang(page, "fr");
    await page.reload();
    await expect(html(page)).toHaveAttribute("dir", "ltr");
    await expect(page.getByText("Connexion sécurisée")).toBeVisible();
    await setLang(page, "ar");
  });

  test("directeur : connexion et navigation en FR, valeurs et saisies intactes", async ({ page }) => {
    await loginFr(page, ACCOUNTS.directeur);
    const nav = page.locator('[data-nav="desktop"]');
    await expect(nav.getByText("Tableau de bord du kuttab")).toBeVisible();
    await expect(nav.getByText("Comptabilité")).toBeVisible();
    await expect(page.locator("[data-app-shell]")).toHaveCSS("direction", "ltr");

    await openTab(page, "students");
    const students = page.locator('[data-screen="students"]');
    await expect(students.getByText("Nouvel élève").first()).toBeVisible();
    // Les noms d'élèves (données) restent en arabe.
    await expect(students.getByText("ياسين العلمي").first()).toBeVisible();
    // Une saisie n'est jamais traduite, même si elle figure au dictionnaire.
    const search = students.locator("input").first();
    // Attribut d'affichage traduit (placeholder), jamais la valeur saisie.
    await expect(search).toHaveAttribute("placeholder", "Rechercher par nom de l'élève ou du parent…");
    await search.fill("حاضر");
    await page.waitForTimeout(300);
    await expect(search).toHaveValue("حاضر");
    await search.fill("");

    await openTab(page, "payments");
    await expect(page.locator('[data-screen="payments"]').getByText("Frais et paiements").first()).toBeVisible();

    await openTab(page, "classes");
    await expect(page.locator('[data-screen="classes"]').getByText("Nouvelle halaqa").first()).toBeVisible();

    await openTab(page, "attendance");
    await expect(page.locator('[data-screen="attendance"]').getByText("Présences et absences").first()).toBeVisible();

    // Paramètres : le libellé du rôle est traduit, sa valeur (clé stockée) reste en arabe.
    await openTab(page, "settings");
    await page.locator('[data-screen="settings"] [data-subtab="users"]').click();
    await page.locator('[data-action="open-user-form"]').click();
    // Liste déroulante de la charte (D83) : la valeur est en `data-value`, jamais traduite.
    const roleSelect = page.locator('[data-field="user-role"]');
    await roleSelect.click();
    const roleOption = page.locator('[data-select-menu] [role="option"][data-value="مدير"]');
    await expect(roleOption).toHaveCount(1);
    await expect(roleOption).toContainText("Directeur");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-select-menu]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.locator(".fixed.inset-0, [data-modal]").last().getByRole("button", { name: /Annuler|Fermer/ }).first().click().catch(() => undefined);

    // Retour en arabe dans l'application : texte et sens d'origine.
    await setLang(page, "ar");
    await expect(html(page)).toHaveAttribute("dir", "rtl");
    await expect(nav.getByText("لوحة الكتّاب")).toBeVisible();
    await expect(page.locator("[data-app-shell]")).toHaveCSS("direction", "rtl");
    await setLang(page, "fr");
    await expect(nav.getByText("Tableau de bord du kuttab")).toBeVisible();
    await logoutFr(page);
    await setLang(page, "ar");
  });

  test("parent : écrans en FR", async ({ page }) => {
    await loginFr(page, ACCOUNTS.parent);
    const nav = page.locator('[data-nav="desktop"]');
    await expect(nav.getByText("Suivi de mes enfants")).toBeVisible();
    await openTab(page, "students");
    await expect(page.locator('[data-screen="students"]').getByText("مريم العلمي").first()).toBeVisible();
    await openTab(page, "payments");
    await expect(nav.getByText("Historique des frais")).toBeVisible();
    await logoutFr(page);
    await setLang(page, "ar");
  });

  test("parcours des écrans : chaînes sans traduction (I18N_MISSING_OUT)", async ({ page }) => {
    test.skip(!MISSING_OUT, "I18N_MISSING_OUT non défini");
    test.setTimeout(600_000);
    const roles: [string, DemoAccount][] = [
      ["directeur", ACCOUNTS.directeur], ["administratif", ACCOUNTS.administratif], ["enseignant", ACCOUNTS.enseignant],
      ["parent", ACCOUNTS.parent], ["eleve", ACCOUNTS.eleve], ["encadrant", ACCOUNTS.encadrant],
    ];
    for (const [name, account] of roles) {
      await loginFr(page, account);
      for (const tab of await desktopTabs(page)) {
        await openTab(page, tab);
        await page.waitForTimeout(500);
        for (const sub of await page.locator("[data-subtab]").evaluateAll((els) => els.map((e) => e.getAttribute("data-subtab") || ""))) {
          await page.locator(`[data-subtab="${sub}"]`).first().click().catch(() => undefined);
          await page.waitForTimeout(300);
        }
        for (const action of ["open-student-form", "open-grade-form", "open-payment-form", "open-monthly-report", "open-staff-form", "open-class-form", "open-income-form", "open-expense-form", "open-salary-form", "open-activity-form", "open-user-form", "open-teacher-student-file", "open-staff-badge"]) {
          const btn = page.locator(`[data-action="${action}"]`).first();
          if (!(await btn.isVisible().catch(() => false))) continue;
          await btn.click().catch(() => undefined);
          await page.waitForTimeout(400);
          await page.keyboard.press("Escape");
          const close = page.locator(".fixed.inset-0, [data-modal]").last().getByRole("button", { name: /Annuler|Fermer|إلغاء|إغلاق/ }).first();
          if (await close.isVisible().catch(() => false)) await close.click().catch(() => undefined);
          await page.waitForTimeout(200);
        }
        const activity = page.locator('[data-action="open-activity"]').first();
        if (tab === "activities" && (await activity.isVisible().catch(() => false))) {
          await activity.click();
          await page.waitForTimeout(300);
        }
      }
      const missing = await page.evaluate(() => [...((window as unknown as { __frTestMissing?: Set<string> }).__frTestMissing || [])]);
      appendFileSync(MISSING_OUT, missing.map((m) => `${name}\t${m.replace(/\s+/g, " ")}`).join("\n") + "\n");
      await logoutFr(page);
    }
  });

  test("captures FR (CAPTURE_DIR)", async ({ page }) => {
    test.skip(!CAPTURE_DIR, "CAPTURE_DIR non défini");
    test.setTimeout(600_000);
    await page.setViewportSize(DESKTOP);
    const shot = async (name: string, mobile = true) => {
      mkdirSync(CAPTURE_DIR, { recursive: true });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(CAPTURE_DIR, `${name}-bureau.png`), fullPage: true, animations: "disabled" });
      if (!mobile) return;
      await page.setViewportSize(MOBILE);
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(CAPTURE_DIR, `${name}-mobile.png`), fullPage: true, animations: "disabled" });
      await page.setViewportSize(DESKTOP);
    };
    await page.goto("/");
    await setLang(page, "fr");
    await shot("connexion");
    const tabsFor: Record<string, string[]> = {
      directeur: ["dashboard", "students", "classes", "grades", "attendance", "payments", "finance", "activities", "teachers", "id-cards-lab", "notifications", "settings"],
      parent: ["home", "students", "grades", "payments", "attendance", "notifications"],
    };
    for (const [name, account] of [["directeur", ACCOUNTS.directeur], ["parent", ACCOUNTS.parent]] as const) {
      await loginFr(page, account);
      for (const tab of tabsFor[name]) {
        if (!(await page.locator(`[data-nav="desktop"] [data-tab="${tab}"]`).count())) continue;
        await openTab(page, tab);
        await shot(`${name}-${tab}`);
      }
      if (name === "directeur") {
        await openTab(page, "students");
        await page.locator('[data-action="open-student-form"]').click();
        await shot("directeur-fenetre-eleve", false);
        await page.locator('[data-modal="student-form"]').getByRole("button", { name: "Annuler" }).click();
        await openTab(page, "settings");
        await page.locator('[data-screen="settings"] [data-subtab="users"]').click();
        await shot("directeur-settings-users");
        await page.locator('[data-action="open-user-form"]').click();
        await shot("directeur-fenetre-compte", false);
        await page.keyboard.press("Escape");
        await page.locator(".fixed.inset-0, [data-modal]").last().getByRole("button", { name: /Annuler|Fermer/ }).first().click().catch(() => undefined);
        await chooseOption(page, page.locator("#school-switcher"), "__picker__");
        await expect(page.locator('[data-screen="school-picker"]')).toBeVisible();
        await shot("directeur-choix-ecole");
        await page.getByRole("button", { name: /جمعية الفجر الجديد/ }).first().click();
        await expect(page.locator("[data-app-shell]")).toBeVisible();
      }
      await logoutFr(page);
    }
    await setLang(page, "ar");
  });
});
