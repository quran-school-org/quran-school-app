/**
 * Audit UX/UI, lots L2 (fenêtres) et L3 (formulaires), D98 : les fenêtres qui étaient écrites
 * à la main passent sur `src/ui/Modal.tsx`. Pour chacune : ouverture, `role="dialog"` relié à
 * son titre, focus placé dans la fenêtre puis rendu au bouton d'origine, fermeture par Échap ;
 * chaque champ a un nom accessible (étiquette reliée). Les repères `data-*` des fenêtres
 * (`data-modal`, `data-action`) sont ceux de D54.
 * Données FICTIVES, émulateurs uniquement. Si CAPTURE_DIR est défini, chaque fenêtre est
 * enregistrée à 1 440 et 390 px (non commité).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ACCOUNTS, desktopTabs, loginAs, logout, openTab } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** Champs de saisie d'une zone qui n'ont aucun nom accessible (étiquette reliée, aria-label ou aria-labelledby). */
export async function unnamedFields(scope: Locator): Promise<string[]> {
  return scope.evaluate((root) => {
    const text = (el: Element | null) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const fields = Array.from(root.querySelectorAll<HTMLElement>("input:not([type=hidden]), textarea, select, [role=combobox]"));
    const bad: string[] = [];
    for (const el of fields) {
      const style = getComputedStyle(el);
      if (el.closest('[aria-hidden="true"]')) continue; // champ relais d'un Select (validation native), hors arbre d'accessibilité
      const hiddenFile = (el as HTMLInputElement).type === "file";
      if (!hiddenFile && (style.display === "none" || style.visibility === "hidden")) continue;
      const labelledby = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => text(document.getElementById(id))).join("");
      const labels = Array.from(((el as HTMLInputElement).labels || []) as ArrayLike<HTMLLabelElement>).map(text).join("");
      const name = (el.getAttribute("aria-label") || "").trim() || labelledby || labels;
      if (!name) bad.push(`${el.tagName.toLowerCase()}${(el as HTMLInputElement).type ? `[${(el as HTMLInputElement).type}]` : ""} ${el.getAttribute("placeholder") || el.getAttribute("name") || el.id || ""}`.trim());
    }
    return bad;
  });
}

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(join(CAPTURE_DIR, "fenetres"), { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, "fenetres", `${name}-1440.png`), animations: "disabled" });
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(CAPTURE_DIR, "fenetres", `${name}-390.png`), animations: "disabled" });
  await page.setViewportSize(DESKTOP);
  await page.waitForTimeout(200);
}

/**
 * Ouvre une fenêtre par son bouton, vérifie le contrat de `Modal`, puis la ferme par Échap et
 * vérifie le retour du focus. `fields` : champs à contrôler (true) ; false pour un aperçu sans champ.
 */
async function checkDialog(page: Page, opener: Locator, modalId: string, opts: { fields?: boolean; name: string; between?: (modal: Locator) => Promise<void> }) {
  await opener.focus();
  await opener.click();
  const modal = page.locator(`[data-modal="${modalId}"]`);
  await expect(modal).toBeVisible();
  const dialog = modal.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  // Titre relié : aria-labelledby désigne un titre non vide.
  const labelledby = await dialog.getAttribute("aria-labelledby");
  expect(labelledby).toBeTruthy();
  await expect(page.locator(`[id="${labelledby}"]`)).not.toHaveText("");
  await expect(dialog).toHaveAccessibleName(/\S/);
  // Focus dans la fenêtre dès l'ouverture.
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  if (opts.fields !== false) {
    expect(await unnamedFields(dialog), `champs sans nom dans ${modalId}`).toEqual([]);
  }
  if (opts.between) await opts.between(modal);
  await shot(page, opts.name);
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(opener).toBeFocused();
}

test.describe.serial("fenêtres sur Modal et champs nommés (D98)", () => {
  test.use({ viewport: DESKTOP });

  test("comptabilité : recette, salaire, dépense, rapport", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "finance");
    const screen = page.locator('[data-screen="finance"]');

    await checkDialog(page, screen.locator('[data-action="open-income-form"]'), "income-form", {
      name: "recette",
      between: async (modal) => {
        // Étiquette reliée : getByLabel trouve le champ, un clic sur l'étiquette lui donne le focus.
        const title = modal.getByLabel("بيان / عنوان الدخل");
        await expect(title).toBeVisible();
        await modal.locator("label", { hasText: "المبلغ (د.م)" }).click();
        await expect(modal.getByLabel("المبلغ (د.م)")).toBeFocused();
        await expect(modal.getByRole("combobox", { name: "نوع الدخل" })).toBeVisible();
        await expect(modal.getByRole("button", { name: "حفظ السجل المالي" })).toBeVisible();
        // Piège du focus : Maj+Tab depuis le premier champ passe au dernier élément, Tab revient au premier.
        for (let i = 0; i < 24; i++) {
          await page.keyboard.press("Tab");
          expect(await modal.getByRole("dialog").evaluate((el) => el.contains(document.activeElement)), `Tab n°${i + 1}`).toBe(true);
        }
        for (let i = 0; i < 24; i++) {
          await page.keyboard.press("Shift+Tab");
          expect(await modal.getByRole("dialog").evaluate((el) => el.contains(document.activeElement)), `Maj+Tab n°${i + 1}`).toBe(true);
        }
      },
    });

    await screen.locator('[data-subtab="salaries"]').click();
    await checkDialog(page, screen.locator('[data-action="open-salary-form"]'), "salary-form", {
      name: "salaire",
      between: async (modal) => {
        await expect(modal.getByRole("combobox", { name: "فئة المستفيد" })).toBeVisible();
        await expect(modal.getByLabel("اسم المستفيد الكامل")).toBeVisible();
        await expect(modal.getByRole("button", { name: "حفظ أجر المستفيد" })).toBeVisible();
      },
    });

    await screen.locator('[data-subtab="expenses"]').click();
    await checkDialog(page, screen.locator('[data-action="open-expense-form"]'), "expense-form", {
      name: "depense",
      between: async (modal) => {
        await expect(modal.getByLabel("بيان النفقة / المشتريات")).toBeVisible();
        // « Enregistrer » n'est plus rouge : variante primaire (même couleur que « حفظ السجل المالي »).
        const save = modal.getByRole("button", { name: "حفظ النفقة" });
        await expect(save).toBeVisible();
        expect(await save.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
          await page.evaluate(() => {
            const probe = document.createElement("div");
            probe.className = "bg-primary";
            document.body.appendChild(probe);
            const color = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return color;
          }),
        );
      },
    });

    await screen.locator('[data-subtab="report"]').click();
    await checkDialog(page, screen.getByRole("button", { name: /معاينة وطباعة التقرير الختامي/ }), "finance-print-report", { name: "rapport", fields: false });
    await logout(page);
  });

  test("activités : activité, participant, dépense, aperçus", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "activities");
    await checkDialog(page, page.locator('[data-action="open-activity-form"]').first(), "activity-form", {
      name: "activite",
      between: async (modal) => {
        await expect(modal.getByLabel("اسم / عنوان النشاط أو الرحلة")).toBeVisible();
        await expect(modal.getByRole("combobox", { name: /نوع النشاط/ })).toBeVisible();
        await expect(modal.getByRole("group", { name: "المؤطرون والمشرفون المعتمدون" })).toBeVisible();
      },
    });

    await page.locator('[data-action="open-activity"]').first().click();
    await page.getByRole("button", { name: /المشاركون والمساهمات/ }).first().click();
    await checkDialog(page, page.getByRole("button", { name: "تسجيل مشارك جديد" }).first(), "participant-form", {
      name: "participant",
      between: async (modal) => {
        await expect(modal.getByLabel("الاسم الكامل للمشارك")).toBeVisible();
        await expect(modal.getByRole("group", { name: "مصدر بيانات المشارك" })).toBeVisible();
      },
    });
    await checkDialog(page, page.getByRole("button", { name: "طباعة لائحة المشاركين" }).first(), "activity-print", { name: "activite-impression", fields: false });

    await page.getByRole("button", { name: /مصاريف النشاط/ }).first().click();
    await checkDialog(page, page.getByRole("button", { name: "إضافة نفقة / مصروف" }).first(), "activity-expense-form", {
      name: "activite-depense",
      between: async (modal) => {
        await expect(modal.getByLabel("بيان / عنوان المصروف")).toBeVisible();
        await expect(modal.getByRole("button", { name: "تسجيل المصروف" })).toBeVisible();
      },
    });
    await logout(page);
  });

  test("personnel : fiche, liste imprimable, badge", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "teachers");
    const screen = page.locator('[data-screen="teachers"]');
    await expect(screen.getByText("يوسف البقالي").first()).toBeVisible();

    await checkDialog(page, screen.locator('[data-action="open-staff-form"]'), "staff-form", {
      name: "personnel",
      between: async (modal) => {
        await expect(modal.getByLabel("الاسم الكامل")).toBeVisible();
        await expect(modal.getByLabel("رقم الهاتف", { exact: false }).first()).toBeVisible();
        await expect(modal.getByRole("group", { name: /فئة الكادر/ })).toBeVisible();
        await expect(modal.getByRole("button", { name: "تسجيل الكادر" })).toBeVisible();
      },
    });
    await checkDialog(page, screen.getByRole("button", { name: "طباعة لائحة الطاقم" }), "staff-directory", { name: "personnel-liste", fields: false });

    // Badge : ouvert par le menu « ⋯ » de la carte ; le focus revient au déclencheur du menu.
    const trigger = screen.getByRole("button", { name: /المزيد من الإجراءات/ }).first();
    await trigger.click();
    await page.locator('[role="menuitem"][data-action="open-staff-badge"]').click();
    const badge = page.locator('[data-modal="staff-badge"]');
    await expect(badge.getByRole("dialog")).toHaveAccessibleName(/\S/);
    // L'impression bleu nuit voulue du badge est conservée.
    await expect(badge.locator("#staff-badge-print-area")).toHaveAttribute("data-theme", "bleu-nuit");
    expect(await badge.getByRole("dialog").evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await shot(page, "badge");
    await page.keyboard.press("Escape");
    await expect(badge).toHaveCount(0);
    await logout(page);
  });

  test("paramètres : fenêtre du compte et paramètres généraux", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "settings");
    const screen = page.locator('[data-screen="settings"]');
    // Paramètres généraux : chaque champ a une étiquette reliée.
    await expect(screen.getByLabel("اسم الجمعية / المدرسة")).toBeVisible();
    expect(await unnamedFields(screen), "champs sans nom dans les paramètres généraux").toEqual([]);

    await screen.locator('[data-subtab="users"]').click();
    await checkDialog(page, screen.locator('[data-action="open-user-form"]'), "user-form", {
      name: "compte",
      between: async (modal) => {
        await expect(modal.getByLabel("الاسم الكامل")).toBeVisible();
        await expect(modal.getByLabel("اسم المستخدم (Username)")).toBeVisible();
        await expect(modal.getByRole("combobox", { name: "نوع الصلاحية الافتراضية" })).toBeVisible();
        // Le bouton « afficher le mot de passe » a un nom.
        await expect(modal.getByRole("button", { name: "إظهار كلمة المرور" })).toBeVisible();
      },
    });
    await logout(page);
  });

  test("balayage : aucun champ sans nom dans les écrans du directeur ni dans les autres fenêtres de saisie", async ({ page }) => {
    test.setTimeout(180_000);
    await loginAs(page, ACCOUNTS.directeur);
    const problems: string[] = [];
    for (const tab of await desktopTabs(page)) {
      // Cartes d'identité : écran du lot L1 (champs de sélection et curseur d'échelle), balayé quand L1 sera fusionné.
      if (tab === "id-cards-lab") continue;
      await openTab(page, tab);
      await page.waitForTimeout(600);
      const main = page.locator("main");
      for (const bad of await unnamedFields(main)) problems.push(`${tab} : ${bad}`);
      const subs = await page.locator("[data-subtab]").evaluateAll((els) => els.map((e) => e.getAttribute("data-subtab") || ""));
      for (const sub of subs) {
        await page.locator(`[data-subtab="${sub}"]`).first().click();
        await page.waitForTimeout(400);
        for (const bad of await unnamedFields(main)) problems.push(`${tab}/${sub} : ${bad}`);
      }
    }
    // Fenêtres de saisie déjà sur Modal avant ce lot : élève, examen, paiement, classe.
    const windows: Array<[string, string, string]> = [
      ["students", "open-student-form", "student-form"],
      ["grades", "open-grade-form", "grade-form"],
      ["payments", "open-payment-form", "payment-form"],
      ["classes", "open-class-form", "class-form"],
    ];
    for (const [tab, action, modalId] of windows) {
      await openTab(page, tab);
      await page.locator(`[data-action="${action}"]`).first().click();
      const modal = page.locator(`[data-modal="${modalId}"]`);
      await expect(modal).toBeVisible();
      for (const bad of await unnamedFields(modal)) problems.push(`${modalId} : ${bad}`);
      await page.keyboard.press("Escape");
      await expect(modal).toHaveCount(0);
    }
    expect(problems, "champs sans nom accessible").toEqual([]);
    await logout(page);
  });
});
