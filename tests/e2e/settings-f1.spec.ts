/**
 * Constat F1 (docs/DECISIONS.md, D55 et D63) : à la première connexion du
 * directeur, l'enregistrement du profil (changement de mot de passe imposé)
 * synchronise le nom du directeur dans les paramètres de l'école. Il recopiait
 * tout l'objet des paramètres tenu par l'interface : si ceux-ci n'étaient pas
 * encore arrivés du serveur, les VALEURS PAR DÉFAUT (cotisation 0, téléphone
 * vide…) écrasaient les vrais paramètres.
 *
 * Le test rend la course certaine : l'abonnement aux paramètres est retenu
 * (requête Listen qui ajoute la cible settings/system) jusqu'à ce que le profil
 * soit enregistré. Il vérifie ensuite, côté serveur, que seuls le nom du
 * directeur (et schoolId) ont été écrits. Données FICTIVES, émulateurs
 * uniquement (projet demo-, Admin SDK branché sur les émulateurs).
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, watchNativeDialogs } from "./helpers";

const PROJECT_ID = "demo-quran-school";
const SCHOOL_ID = "alfajr";
const DIRECTOR_EMAIL = "admin_alfajr@alfajr.local";
const FORCED_TEXT = "لأسباب أمنية، يجب اختيار كلمة مرور جديدة";

const mentionsSettings = (body: string | null) => {
  if (!body) return false;
  let decoded = body;
  try { decoded = decodeURIComponent(body.replace(/\+/g, " ")); } catch { /* corps non encodé */ }
  return decoded.includes(`schools/${SCHOOL_ID}/settings/system`);
};

test("F1 : le profil du directeur enregistré avant l'arrivée des paramètres n'écrase pas les paramètres de l'école", async ({ page }) => {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);

  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");
  const admin = initializeApp({ projectId: PROJECT_ID }, `e2e-f1-${Date.now()}`);
  const firestore = getFirestore(admin);
  const settingsRef = firestore.doc(`schools/${SCHOOL_ID}/settings/system`);

  try {
    const before = (await settingsRef.get()).data()!;
    expect(before.subscriptionFee, "paramètres fictifs : cotisation non nulle").toBeGreaterThan(0);
    expect(before.associationPhone).toBeTruthy();

    // Changement de mot de passe imposé, quel que soit l'ordre des tests.
    const { uid } = await getAuth(admin).getUserByEmail(DIRECTOR_EMAIL);
    await firestore.doc(`users/${uid}`).update({ mustChangePassword: true });

    // Abonnement aux paramètres retenu tant que le profil n'est pas enregistré.
    let release!: () => void;
    const released = new Promise<void>((resolve) => { release = resolve; });
    let held = 0;
    const settingsWrites: string[] = [];
    await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (route) => {
      if (route.request().method() === "POST" && mentionsSettings(route.request().postData())) {
        held++;
        await released;
      }
      await route.continue();
    });
    await page.route("**/google.firestore.v1.Firestore/Write/channel**", async (route) => {
      const body = route.request().postData();
      if (route.request().method() === "POST" && mentionsSettings(body)) settingsWrites.push(body!);
      await route.continue();
    });

    watchNativeDialogs(page);
    await page.goto("/");
    const forced = page.getByText(FORCED_TEXT);
    const bad = page.getByText("اسم المستخدم أو كلمة المرور غير صحيحة");
    let loggedIn = false;
    for (const password of [ACCOUNTS.directeur.e2e, ACCOUNTS.directeur.initial]) {
      await page.locator('form input[type="text"]').fill(ACCOUNTS.directeur.username);
      await page.locator('form input[type="password"]').fill(password);
      await page.locator('form button[type="submit"]').click();
      await expect(forced.or(bad).first()).toBeVisible();
      if (await forced.isVisible()) { loggedIn = true; break; }
    }
    expect(loggedIn, "connexion du directeur").toBe(true);

    // Enregistrement immédiat, paramètres pas encore reçus.
    await expect.poll(() => held, { message: "abonnement aux paramètres retenu" }).toBeGreaterThan(0);
    await page.locator('[data-modal="profile"] form input[type="password"]').last().fill(ACCOUNTS.directeur.e2e);
    await page.locator('[data-modal="profile"] form button[type="submit"]').click();
    await expect(forced).toBeHidden();

    // La synchronisation du nom du directeur a bien eu lieu pendant la course…
    await expect.poll(() => settingsWrites.length, { message: "écriture de settings/system" }).toBeGreaterThan(0);
    release();
    await page.waitForTimeout(1500);

    // … et n'a écrit que le nom du directeur : les autres paramètres sont intacts.
    const after = (await settingsRef.get()).data()!;
    const { directorName: _b, ...beforeRest } = before;
    const { directorName, ...afterRest } = after;
    expect(directorName).toBe(before.directorName);
    expect(afterRest).toEqual(beforeRest);
    // L'interface reçoit ensuite les vrais paramètres.
    await expect.poll(() => page.evaluate(() => {
      const raw = localStorage.getItem("kuttab:alfajr:settings_system");
      return raw ? JSON.parse(raw).subscriptionFee : null;
    })).toBe(before.subscriptionFee);

    await page.getByRole("button", { name: /خروج/ }).first().click();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  } finally {
    await deleteApp(admin);
  }
});
