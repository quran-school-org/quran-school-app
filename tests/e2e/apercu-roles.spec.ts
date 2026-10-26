/**
 * « معاينة كدور » du super-admin (D95), sur les ÉMULATEURS, données FICTIVES :
 * super_demo (super-admin, مدير de l'école fictive annour, 2 frères et sœurs
 * S-101 / S-102 et une enseignante t1 avec la halaqa c1). Le changement de rôle
 * est RÉEL (Cloud Function setMemberRole sur son propre uid) : on le vérifie par
 * ce que les règles laissent voir (menu, accueil famille, bandeau).
 * CAPTURE_DIR=/chemin/absolu : enregistre aussi des captures (390 et 1440 px).
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, chooseOption, desktopTabs, loginAs, logout } from "./helpers";

const control = (page: Page) => page.locator('[data-modal="profile"] [data-role-preview="control"]');
const banner = (page: Page) => page.locator('[data-role-preview="banner"]');

const shot = async (page: Page, name: string) => {
  const dir = process.env.CAPTURE_DIR;
  if (!dir) return;
  for (const [tag, width] of [["1440", 1440], ["390", 390]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: `${dir}/${name}-${tag}.png`, fullPage: false });
  }
  await page.setViewportSize({ width: 1400, height: 900 });
};

async function openProfile(page: Page) {
  await page.locator('[data-action="open-profile"]').click();
  await expect(page.locator('[data-modal="profile"]')).toBeVisible();
}

async function previewAs(page: Page, role: string) {
  await openProfile(page);
  await chooseOption(page, control(page).locator("[data-role-preview-select]"), role);
  await expect(page.locator('[data-modal="profile"]')).toHaveCount(0); // fenêtre fermée : la session est rechargée
}

test.describe.serial("aperçu par rôle du super-admin", () => {
  test("jamais pour un compte non super-admin, ni sur alfajr", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeurAnnour); // directeur d'annour, pas super-admin
    await openProfile(page);
    await expect(page.locator('[data-modal="profile"] [data-language-setting]')).toBeVisible();
    await expect(page.locator("[data-role-preview]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await logout(page);

    await loginAs(page, ACCOUNTS.directeur); // super-admin, mais école alfajr (copie de données réelles en dev)
    await expect(page.locator("[data-app-shell]")).toBeVisible();
    await openProfile(page);
    await expect(page.locator('[data-modal="profile"] [data-language-setting]')).toBeVisible();
    await expect(page.locator("[data-role-preview]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await logout(page);
  });

  test("super-admin d'annour : parent → accueil « ملخص » des enfants liés → retour directeur", async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdminAnnour);
    await expect(page.locator("[data-app-shell]")).toBeVisible();
    await expect(banner(page)).toHaveCount(0); // directeur : pas d'aperçu en cours
    await openProfile(page);
    await expect(control(page)).toBeVisible();
    await expect(control(page).locator("[data-role-preview-back]")).toHaveCount(0); // déjà directeur
    await shot(page, "apercu-controle");
    await page.keyboard.press("Escape");
    expect(await desktopTabs(page)).toContain("settings");

    await previewAs(page, "ولي أمر");
    // Rôle réel : menu famille, accueil « ملخص » avec les deux enfants liés (frères et sœurs d'annour).
    expect((await desktopTabs(page))[0]).toBe("home");
    expect(await desktopTabs(page)).not.toContain("settings");
    const home = page.locator('[data-screen="home"]');
    await expect(home.locator("h1")).toHaveText("ملخص");
    await expect(home.locator("[data-child]")).toHaveCount(2);
    await expect(home).toContainText("إلياس البركاني");
    await expect(home).toContainText("هدى البركاني");
    // Bandeau : le vrai rôle et les élèves liés.
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).locator("[data-role-preview-text]")).toHaveText(/^وضع المعاينة : ولي أمر \(.*إلياس البركاني.*\)$/);
    await expect(banner(page).locator("[data-role-preview-text]")).toContainText("هدى البركاني");
    // Carte du bas du menu : une ligne par enfant, sans « أبعد حزب بلغه طالب ».
    const card = page.locator('[data-nav="desktop"]').locator('[data-family-sidebar="many"]');
    await expect(card.locator("[data-family-sidebar-child]")).toHaveCount(2);
    await expect(card).toContainText("إلياس");
    await expect(card).toContainText("الحزب الحالي");
    await expect(page.locator('[data-nav="desktop"]')).not.toContainText("أبعد حزب بلغه طالب");
    await shot(page, "apercu-parent");

    // Les règles s'appliquent : le parent ne voit plus la liste de l'école (pas d'onglet comptabilité).
    expect(await desktopTabs(page)).not.toContain("finance");

    // Retour au directeur depuis le menu du compte (accessible à tous les rôles).
    await openProfile(page);
    await expect(control(page).locator("[data-role-preview-back]")).toBeVisible();
    await control(page).locator("[data-role-preview-back]").click();
    await expect(page.locator('[data-modal="profile"]')).toHaveCount(0);
    await expect(banner(page)).toHaveCount(0);
    await expect.poll(() => desktopTabs(page)).toContain("settings");
    await logout(page);
  });

  test("enseignant : fiche liée au bandeau, retour par le bandeau ; élève ; rôle sans lien", async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdminAnnour);
    await previewAs(page, "مدرس");
    await expect(banner(page).locator("[data-role-preview-text]")).toHaveText("وضع المعاينة : مدرس (أستاذة النور)");
    expect(await desktopTabs(page)).not.toContain("settings");

    // D'un rôle non directeur vers un rôle qui lit toute l'école : passage par « مدير », puis tirage.
    await previewAs(page, "طالب");
    await expect(banner(page).locator("[data-role-preview-text]")).toHaveText(/^وضع المعاينة : طالب \((إلياس|هدى) البركاني\)$/);
    await expect(page.locator('[data-nav="desktop"] [data-family-sidebar]')).toHaveCount(0); // l'élève garde sa carte « ملخص الحفظ الشخصي »

    await previewAs(page, "إداري");
    await expect(banner(page).locator("[data-role-preview-text]")).toHaveText("وضع المعاينة : إداري");

    // Retour par le bouton du bandeau.
    await banner(page).locator("[data-role-preview-back]").click();
    await expect(banner(page)).toHaveCount(0);
    await expect.poll(() => desktopTabs(page)).toContain("settings");
    await logout(page);
  });

  test("une erreur de la Function s'affiche proprement, sans changer de rôle", async ({ page }) => {
    await loginAs(page, ACCOUNTS.superAdminAnnour);
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" };
    await page.route("**/setMemberRole", async (route) => {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({ status: 403, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify({ error: { status: "PERMISSION_DENIED", message: "ليست لديك صلاحية تنفيذ هذه العملية في هذه المدرسة." } }) });
    });
    await openProfile(page);
    await chooseOption(page, control(page).locator("[data-role-preview-select]"), "إداري");
    const alert = control(page).getByRole("alert");
    await expect(alert).toContainText("تعذر تغيير الدور");
    await expect(alert).toContainText("ليست لديك صلاحية تنفيذ هذه العملية في هذه المدرسة.");
    await expect(page.locator('[data-modal="profile"]')).toBeVisible();
    await page.unroute("**/setMemberRole");
    await page.keyboard.press("Escape");
    await expect(banner(page)).toHaveCount(0); // toujours directeur
    await logout(page);
  });
});
