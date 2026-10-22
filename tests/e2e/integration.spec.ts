/**
 * Intégration du nouveau design avec le durcissement (D63) : ce que l'interface
 * montre réellement.
 * - Personnel : le directeur voit les fiches RH (salaire, CIN) ; un enseignant
 *   à qui l'on ouvre l'écran du personnel n'en voit AUCUNE (R-06, D42), même
 *   pas les valeurs par défaut des fiches synthétiques.
 * - Rapport IA : passe par requestAiReport ; message AiReportError.userMessage
 *   en cas de quota atteint (réponse simulée, aucun appel à Gemini).
 * Si CAPTURE_DIR est défini, les écrans sont enregistrés (captures « après »).
 * Données FICTIVES, émulateurs uniquement (projet demo-, Admin SDK sur émulateurs).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const PROJECT_ID = "demo-quran-school";

async function capture(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(join(CAPTURE_DIR, "integration"), { recursive: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(CAPTURE_DIR, "integration", `${name}.png`), fullPage: true, animations: "disabled" });
}

/** Marqueurs d'une fiche RH dans l'écran du personnel (données fictives). */
const HR_MARKERS = [/CIN/, /XX0000\d/, /الراتب الشهري/, /د\.م/, /2[,.\s]?500/, /3[,.\s]?500/, /1[,.\s]?500/];

async function adminApp() {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);
  const { initializeApp } = await import("firebase-admin/app");
  return initializeApp({ projectId: PROJECT_ID }, `e2e-integration-${Date.now()}`);
}

test.describe.serial("intégration design + durcissement", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("personnel : le directeur voit salaires et CIN", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "teachers");
    const screen = page.locator('[data-screen="teachers"]');
    await expect(screen.getByText("يوسف البقالي").first()).toBeVisible();
    await expect(screen.getByText("XX000001").first()).toBeVisible();
    await expect(screen.getByText(/الراتب الشهري/).first()).toBeVisible();
    await capture(page, "personnel-directeur");
    await logout(page);
  });

  test("personnel : un enseignant autorisé à l'écran ne voit aucun salaire ni CIN", async ({ page }) => {
    const { deleteApp } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
    const admin = await adminApp();
    const { uid } = await getAuth(admin).getUserByEmail("youssef_baqali@alfajr.local");
    const member = getFirestore(admin).doc(`schools/alfajr/members/${uid}`);
    // Ouvre l'écran du personnel (lecture seule) à l'enseignant fictif, le temps du test.
    await member.update({ "permissions.teachers": { read: true, create: false, update: false, delete: false, print: false } });
    try {
      await loginAs(page, ACCOUNTS.enseignant);
      await openTab(page, "teachers");
      const screen = page.locator('[data-screen="teachers"]');
      await expect(screen.getByText("يوسف البقالي").first()).toBeVisible();
      await page.waitForTimeout(1000);
      const text = await screen.innerText();
      for (const marker of HR_MARKERS) expect(text, `marqueur RH ${marker}`).not.toMatch(marker);
      // Les données reçues ne portent aucun champ RH (cache local de la session).
      const cached = await page.evaluate(() => JSON.parse(localStorage.getItem("kuttab:alfajr:teachers") || "[]"));
      for (const t of cached) for (const k of ["monthlySalary", "cinNumber", "contractType", "birthDate", "address", "emergencyContact"]) {
        expect(t[k], `${t.id}.${k}`).toBeUndefined();
      }
      await capture(page, "personnel-enseignant");
      await logout(page);
    } finally {
      await member.update({ "permissions.teachers": FieldValue.delete() });
      await deleteApp(admin);
    }
  });

  test("tableau de bord et rapport IA (requestAiReport : quota atteint, puis rapport)", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "dashboard");
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await capture(page, "tableau-de-bord-directeur");

    await openTab(page, "students");
    const aiButton = page.getByRole("button", { name: /تحليل تقدم الطالب بالذكاء الاصطناعي/ });
    await expect(aiButton).toBeVisible();

    const calls: { auth: string | undefined; body: any }[] = [];
    let status = 429;
    await page.route("**/api/gemini/analyze", async (route) => {
      calls.push({ auth: route.request().headers()["authorization"], body: route.request().postDataJSON() });
      if (status !== 200) return route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ error: "quota" }) });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: "ملخص تجريبي (رد محاكى في الاختبار).",
          tajweedTips: ["نصيحة تجريبية 1", "نصيحة تجريبية 2"],
          studyPlan: "خطة تجريبية.",
          parentMessage: "رسالة تجريبية.",
          recommendedSurahs: ["الملك", "يس"],
        }),
      });
    });

    await aiButton.click();
    await expect(page.getByText("تم بلوغ الحد المسموح به من تقارير الذكاء الاصطناعي لهذا اليوم")).toBeVisible();
    expect(calls[0].auth, "jeton Firebase joint").toMatch(/^Bearer /);
    expect(calls[0].body.schoolId).toBe("alfajr");
    await capture(page, "rapport-ia-quota");

    status = 200;
    await aiButton.click();
    await expect(page.getByText("ملخص تجريبي (رد محاكى في الاختبار).")).toBeVisible();
    await capture(page, "rapport-ia");
    await logout(page);
  });
});
