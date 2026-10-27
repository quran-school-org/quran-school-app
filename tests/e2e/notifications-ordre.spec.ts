/**
 * Notifications : la plus récente d'abord, et un clic sur une notification non lue
 * ne recharge pas toute l'école ni ne réordonne la liste (la ligne sous le doigt ne
 * change pas). Données FICTIVES, émulateurs uniquement (projet demo-).
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, loginAs, logout, openTab } from "./helpers";

const PROJECT_ID = "demo-quran-school";
const SCHOOL_ID = "alfajr";
// Identifiants volontairement dans l'ordre inverse des dates : l'ordre de Firestore
// (par identifiant) diffère ainsi de l'ordre attendu à l'écran.
const SEED = [
  { id: "n_e2e_ordre_c", date: "2026-10-27", title: "إشعار تجريبي ٣ (الأحدث)" },
  { id: "n_e2e_ordre_b", date: "2026-10-20", title: "إشعار تجريبي ٢" },
  { id: "n_e2e_ordre_a", date: "2026-09-01", title: "إشعار تجريبي ١ (الأقدم)" },
];

test("notifications : la plus récente d'abord, ordre stable après un clic", async ({ page }) => {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  expect(PROJECT_ID.startsWith("demo-")).toBe(true);
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const admin = initializeApp({ projectId: PROJECT_ID }, `e2e-notif-${Date.now()}`);
  const db = getFirestore(admin);
  const col = db.collection(`schools/${SCHOOL_ID}/notifications`);
  try {
    for (const s of SEED) {
      await col.doc(s.id).set({ id: s.id, schoolId: SCHOOL_ID, title: s.title, message: "رسالة تجريبية", date: s.date, type: "نجاح", isRead: false, audience: "staff" });
    }

    await loginAs(page, ACCOUNTS.directeur);
    await openTab(page, "notifications");
    const screen = page.locator('[data-screen="notifications"]');
    const ours = screen.locator('li[data-notification^="n_e2e_ordre_"]');
    await expect(ours).toHaveCount(3);
    const order = () => ours.evaluateAll((els) => els.map((e) => e.getAttribute("data-notification")));
    expect(await order()).toEqual(["n_e2e_ordre_c", "n_e2e_ordre_b", "n_e2e_ordre_a"]);

    // La plus récente du jeu est en tête de toute la liste (aucune notification plus récente ailleurs).
    const all = await screen.locator("li[data-notification]").evaluateAll((els) => els.map((e) => e.getAttribute("data-notification")));
    expect(all.indexOf("n_e2e_ordre_c")).toBeLessThan(all.indexOf("n_e2e_ordre_a"));

    // Clic sur la 2e (non lue) : elle devient lue, l'ordre ne bouge pas, ni tout de suite ni après la synchronisation.
    const second = screen.locator('li[data-notification="n_e2e_ordre_b"]');
    // Non lue : badge « جديد » avec son texte pour lecteur d'écran.
    const UNREAD = "انقر لتعليم الإشعار كمقروء";
    await expect(second).toContainText(UNREAD);
    await second.getByRole("button").click();
    await expect(second).not.toContainText(UNREAD);
    expect(await order()).toEqual(["n_e2e_ordre_c", "n_e2e_ordre_b", "n_e2e_ordre_a"]);
    await page.waitForTimeout(1500);
    expect(await order()).toEqual(["n_e2e_ordre_c", "n_e2e_ordre_b", "n_e2e_ordre_a"]);
    await expect(screen.locator('li[data-notification="n_e2e_ordre_c"]')).toContainText(UNREAD);

    // La lecture est bien enregistrée côté serveur (readBy), sans toucher aux autres.
    await expect.poll(async () => ((await col.doc("n_e2e_ordre_b").get()).data()?.readBy ?? []).length).toBe(1);
    expect((await col.doc("n_e2e_ordre_c").get()).data()?.readBy).toBeUndefined();
    await logout(page);
  } finally {
    for (const s of SEED) await col.doc(s.id).delete().catch(() => undefined);
    await deleteApp(admin);
  }
});
