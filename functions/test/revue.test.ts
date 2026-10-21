/**
 * Revue de sécurité (étape 2) — Cloud Functions du Lot 0.
 * Chaque test démontrait une faille avant correctif (voir
 * docs/revues/REVUE-SECURITE-ETAPE-2.md) et sert de non-régression.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let accounts: typeof import("../src/lot0/accounts.js");

const PROJECT = () => process.env.GCLOUD_PROJECT!;

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

/** Compte provisionné : Auth + appUsers + authLinks. */
async function account(appUserId: string, username: string, role: string) {
  const rec = await admin.adminAuth().createUser({ email: `${username}@alfajr.local`, password: "motdepasse-2026" });
  const db = admin.adminDb();
  await db.collection("appUsers").doc(appUserId).set({ username, role, isActive: true, authUid: rec.uid });
  await db.collection("authLinks").doc(rec.uid).set({ appUserId, role, isActive: true });
  return rec.uid;
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  accounts = await import("../src/lot0/accounts.js");
});

beforeEach(clear);

describe("F-02 réinitialisation du mot de passe du directeur historique (u1)", () => {
  it("un autre directeur ne peut pas prendre le compte u1", async () => {
    await account("u1", "admin_alfajr", "مدير");
    const co = await account("u_co", "co_directeur", "مدير");
    await expect(accounts.resetUserPasswordCore(co, "u1", "prise-de-compte-2026")).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("u1 peut réinitialiser les autres comptes", async () => {
    const u1 = await account("u1", "admin_alfajr", "مدير");
    await account("p_1", "parent_1", "ولي أمر");
    await accounts.resetUserPasswordCore(u1, "p_1", "nouveau-2026-xyz");
  });
});

describe("F-03 réinitialisation par un authUid détourné", () => {
  it("un appUsers dont l'authUid désigne le compte d'un autre est refusé", async () => {
    const u1Uid = await account("u1", "admin_alfajr", "مدير");
    const co = await account("u_co", "co_directeur", "مدير");
    // Le directeur (règles : écriture libre d'appUsers) crée un compte leurre pointant vers u1.
    await admin.adminDb().collection("appUsers").doc("u_leurre").set({ username: "leurre", role: "ولي أمر", authUid: u1Uid });
    await expect(accounts.resetUserPasswordCore(co, "u_leurre", "prise-de-compte-2026")).rejects.toMatchObject({ code: "permission-denied" });
  });
});
