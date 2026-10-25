/**
 * Test de fumée : connexion par rôle, isolation des données, changement
 * d'école. Données FICTIVES (npm run seed:emulator), émulateurs uniquement.
 */
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, SCHOOL_1, SCHOOL_2, loginAs, logout, openTab, chooseOption } from "./helpers";

test.describe.serial("parcours par rôle", () => {
  test("un identifiant inconnu est refusé", async ({ page }) => {
    await page.goto("/");
    await page.locator('form input[type="text"]').fill("inconnu");
    await page.locator('form input[type="password"]').fill("mauvais-mot-de-passe");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText("اسم المستخدم أو كلمة المرور غير صحيحة")).toBeVisible();
  });

  test("directeur : changement de mot de passe imposé, accès aux finances", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await expect(page.locator("[data-active-school]").getByText(SCHOOL_1)).toBeVisible();
    await expect(page.locator('[data-nav="desktop"] [data-tab="finance"]')).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await logout(page);
  });

  test("enseignant : pas de finances", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await expect(page.locator('[data-nav="desktop"]')).toBeVisible();
    await expect(page.locator('[data-tab="finance"]')).toHaveCount(0);
    await expect(page.locator('[data-tab="payments"]')).toHaveCount(0);
    await logout(page);
  });

  test("parent : seulement ses enfants", async ({ page }) => {
    await loginAs(page, ACCOUNTS.parent);
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    await expect(page.getByText("مريم العلمي").first()).toBeVisible();
    await expect(page.getByText("أيوب العلوي")).toHaveCount(0);
    await expect(page.getByText("زينب الناصري")).toHaveCount(0);
    await logout(page);
  });

  test("agent d'entretien : aucun dossier d'élève", async ({ page }) => {
    await loginAs(page, ACCOUNTS.entretien);
    await expect(page.locator('[data-nav="desktop"]')).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await logout(page);
  });

  test("compte présent dans deux écoles : changement d'école sans fuite de données", async ({ page }) => {
    await loginAs(page, ACCOUNTS.administratif);
    await expect(page.locator("[data-active-school]").getByText(SCHOOL_1)).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();

    await chooseOption(page, page.locator("#school-switcher"), "annour");
    await expect(page.locator("[data-active-school]").getByText(SCHOOL_2)).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.filter((k) => k.startsWith("kuttab:alfajr:"))).toEqual([]);

    await chooseOption(page, page.locator("#school-switcher"), "alfajr");
    await expect(page.locator("[data-active-school]").getByText(SCHOOL_1)).toBeVisible();
    await logout(page);
  });

  test("directeur de la seconde école : ne voit que la sienne", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeurAnnour);
    await expect(page.locator("[data-active-school]").getByText(SCHOOL_2)).toBeVisible();
    await openTab(page, "students");
    await expect(page.getByText("إلياس البركاني").first()).toBeVisible();
    await expect(page.getByText("ياسين العلمي")).toHaveCount(0);
    await expect(page.locator("#school-switcher")).toHaveCount(0);
    await logout(page);
  });
});

/**
 * Revue de sécurité (étape 2) : démonstrations de bout en bout, après les
 * parcours ci-dessus (mots de passe déjà changés). Voir
 * docs/revues/REVUE-SECURITE-ETAPE-2.md.
 */
test.describe.serial("revue de sécurité", () => {
  test("C-01 : un nom d'élève piégé par un enseignant n'exécute aucun script à l'impression du directeur", async ({ page }) => {
    // L'enseignant (droits d'écriture sur les élèves) modifie un nom via l'API.
    const { initializeApp, deleteApp } = await import("firebase/app");
    const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = await import("firebase/auth");
    const { getFirestore, connectFirestoreEmulator, doc, updateDoc } = await import("firebase/firestore");
    const app = initializeApp({ projectId: "demo-quran-school", apiKey: "demo-api-key" }, `e2e-xss-${Date.now()}`);
    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099"}`, { disableWarnings: true });
    const db = getFirestore(app);
    const [host, port] = String(process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");
    connectFirestoreEmulator(db, host, Number(port));
    // Mot de passe déjà changé par un test précédent, sinon mot de passe initial.
    await signInWithEmailAndPassword(auth, "youssef_baqali@alfajr.local", ACCOUNTS.enseignant.e2e)
      .catch(() => signInWithEmailAndPassword(auth, "youssef_baqali@alfajr.local", ACCOUNTS.enseignant.initial));
    await updateDoc(doc(db, "schools", "alfajr", "students", "S-103"), {
      fullName: `أيوب<img src=x onerror="window.opener.__xss='C-01'">`,
      parentName: `<svg onload="window.opener.__xss='C-01'"></svg>`,
    });
    await deleteApp(app);

    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "students");
    await expect(page.getByText("ياسين العلمي").first()).toBeVisible();
    const popupPromise = page.context().waitForEvent("page");
    await page.locator("#export-students-dropdown-btn").click();
    await page.locator("#export-students-pdf-btn").click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).__xss ?? null)).toBeNull();
    await popup.close().catch(() => undefined);
    await logout(page);
  });

  test("C-02 : session Firebase terminée sans déconnexion (jeton expiré, révoqué) : le cache local est purgé", async ({ page }) => {
    await loginAs(page, ACCOUNTS.enseignant);
    await expect.poll(async () => (await page.evaluate(() => Object.keys(localStorage))).some((k) => k.startsWith("kuttab:alfajr:"))).toBe(true);
    // Fin de session sans passer par le bouton « خروج » : la persistance Auth disparaît.
    await page.evaluate(() => new Promise((resolve) => {
      const req = indexedDB.deleteDatabase("firebaseLocalStorageDb");
      req.onsuccess = req.onerror = req.onblocked = () => resolve(null);
    }));
    await page.goto("about:blank");
    await page.goto("/");
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kuttab:alfajr:")))).toEqual([]);
  });
});

/**
 * Étape 2, durcissement : fiches RH du personnel (R-06, D42). Vérifié sur le
 * cache local rempli par la couche données (indépendant de la mise en page).
 */
test.describe.serial("durcissement", () => {
  const cachedTeachers = (page: Page) => page.evaluate(() => {
    const raw = localStorage.getItem("kuttab:alfajr:teachers");
    return raw ? (JSON.parse(raw) as Record<string, unknown>[]) : null;
  });

  test("R-06 : le bureau reçoit les fiches RH, l'enseignant jamais", async ({ page }) => {
    await loginAs(page, ACCOUNTS.directeur);
    await expect.poll(async () => (await cachedTeachers(page))?.find((t) => t.id === "t1")?.monthlySalary ?? null).toBe(2500);
    await logout(page);

    await loginAs(page, ACCOUNTS.enseignant);
    await expect.poll(async () => (await cachedTeachers(page))?.length ?? 0).toBeGreaterThan(0);
    const staff = (await cachedTeachers(page))!;
    for (const t of staff) {
      for (const k of ["monthlySalary", "cinNumber", "contractType", "birthDate", "address", "emergencyContact"]) {
        expect(t[k], `${t.id}.${k}`).toBeUndefined();
      }
    }
    await logout(page);
  });
});
