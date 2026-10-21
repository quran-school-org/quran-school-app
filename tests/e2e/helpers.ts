/**
 * Outils partagés des tests de bout en bout (émulateurs, données FICTIVES de
 * `npm run seed:emulator`). Les mots de passe ci-dessous sont des valeurs de
 * démonstration propres aux émulateurs.
 */
import { expect, type Page } from "@playwright/test";

export const SCHOOL_1 = "جمعية الفجر الجديد (بيانات تجريبية)";
export const SCHOOL_2 = "مدرسة النور القرآنية (بيانات تجريبية)";

export interface DemoAccount {
  username: string;
  /** Mot de passe du jeu de données fictif. */
  initial: string;
  /** Mot de passe choisi au premier changement imposé (comptes migrés). */
  e2e: string;
}

export const ACCOUNTS = {
  directeur: { username: "admin_alfajr", initial: "demo-directeur-2026", e2e: "e2e-directeur-2026" },
  administratif: { username: "khalid_tazi", initial: "123", e2e: "e2e-multi-2026" },
  enseignant: { username: "youssef_baqali", initial: "123", e2e: "e2e-enseignant-2026" },
  parent: { username: "mohammed_alami", initial: "123", e2e: "e2e-parent-2026" },
  eleve: { username: "ali_rebati", initial: "123", e2e: "e2e-eleve-2026" },
  encadrant: { username: "omar_idrissi", initial: "123", e2e: "e2e-encadrant-2026" },
  entretien: { username: "said_morabit", initial: "123", e2e: "e2e-entretien-2026" },
  directeurAnnour: { username: "dir_annour", initial: "demo-annour-2026", e2e: "demo-annour-2026" },
} satisfies Record<string, DemoAccount>;

const FORCED_TEXT = "لأسباب أمنية، يجب اختيار كلمة مرور جديدة";
const BAD_CREDENTIALS = "اسم المستخدم أو كلمة المرور غير صحيحة";

async function submitLogin(page: Page, username: string, password: string) {
  await page.locator('form input[type="text"]').fill(username);
  await page.locator('form input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

/**
 * Connexion indépendante de l'ordre des tests : essaie le mot de passe initial,
 * puis celui déjà choisi par un test précédent ; applique le changement imposé.
 */
export async function loginAs(page: Page, account: DemoAccount) {
  page.on("dialog", (d) => d.accept().catch(() => undefined));
  await page.goto("/");
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
  const forced = page.getByText(FORCED_TEXT);
  const shell = page.locator("[data-app-shell]");
  const picker = page.locator('[data-screen="school-picker"]');
  const bad = page.getByText(BAD_CREDENTIALS);

  for (const password of [account.initial, account.e2e]) {
    await submitLogin(page, account.username, password);
    await expect(shell.or(forced).or(picker).or(bad).first()).toBeVisible();
    if (await bad.isVisible()) continue;
    if (await forced.isVisible()) {
      // Laisse arriver les paramètres de l'école avant d'enregistrer : un
      // enregistrement immédiat du profil du directeur peut réécrire les
      // paramètres avec les valeurs par défaut (constat F1, docs/DECISIONS.md).
      await page.waitForTimeout(2000);
      await page.locator('[data-modal="profile"] form input[type="password"]').last().fill(account.e2e);
      await page.locator('[data-modal="profile"] form button[type="submit"]').click();
      await expect(forced).toBeHidden();
    }
    return;
  }
  throw new Error(`connexion impossible pour ${account.username}`);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /خروج/ }).first().click();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kuttab:") || k.startsWith("alfajr_")))).toEqual([]);
}

/** Onglets visibles dans le menu latéral (bureau), dans l'ordre d'affichage. */
export async function desktopTabs(page: Page): Promise<string[]> {
  const nav = page.locator('[data-nav="desktop"]');
  await expect(nav).toBeVisible();
  return nav.locator("[data-tab]").evaluateAll((els) => els.map((e) => e.getAttribute("data-tab") || ""));
}

export async function openTab(page: Page, tab: string) {
  await page.locator(`[data-nav="desktop"] [data-tab="${tab}"]`).click();
}
