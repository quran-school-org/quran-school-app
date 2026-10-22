/**
 * Tests de bout en bout des Cloud Functions du Lot 0 sur l'émulateur Functions :
 * callables createUserAccount / resetUserPassword (appel réel par le SDK client)
 * et suspension des comptes à l'archivage (triggers Firestore).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp as deleteClientApp, initializeApp as initClientApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth as getClientAuth, signInWithEmailAndPassword, signOut, type Auth as ClientAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from "firebase/functions";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runLot0Provision } from "../../scripts/admin/lot0-provision-auth";
import { DEMO_PASSWORDS, legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { normalizeAuthPassword } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const REGION = "europe-west1";
let admin: AdminHandles;
let app: FirebaseApp;
let auth: ClientAuth;
let functions: Functions;

async function waitFor(check: () => Promise<boolean>, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Délai dépassé en attendant le trigger");
}

async function signInAs(username: string, password: string) {
  await signOut(auth).catch(() => undefined);
  await signInWithEmailAndPassword(auth, `${username}@alfajr.local`, normalizeAuthPassword(password));
}

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "functions-test");
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
  await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });

  app = initClientApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `functions-client-${Date.now()}`);
  auth = getClientAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  functions = getFunctions(app, REGION);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
});

afterAll(async () => {
  await signOut(auth).catch(() => undefined);
  if (app) await deleteClientApp(app);
  await admin?.close();
});

describe("callables de gestion des comptes", () => {
  it("le directeur crée un compte : Auth + appUsers sans mot de passe + authLinks", async () => {
    await signInAs("admin_alfajr", DEMO_PASSWORDS.director);
    const create = httpsCallable(functions, "createUserAccount");
    const res: any = await create({
      username: "nouveau_prof",
      password: "motdepasse-2026",
      fullName: "أستاذ جديد",
      role: "مدرس",
      linkedTeacherId: "t1",
      permissions: { attendance: { read: true, create: true, hack: true } },
    });
    const { appUserId, uid } = res.data;
    const userDoc = (await admin.db.collection("appUsers").doc(appUserId).get()).data()!;
    expect(userDoc.password).toBeUndefined();
    expect(userDoc.mustChangePassword).toBe(true);
    expect(userDoc.authUid).toBe(uid);
    expect(userDoc.permissions.attendance).toEqual({ read: true, create: true });
    const link = (await admin.db.collection("authLinks").doc(uid).get()).data()!;
    expect(link).toMatchObject({ appUserId, role: "مدرس", isActive: true, linkedTeacherId: "t1" });

    await signInAs("nouveau_prof", "motdepasse-2026");
    expect(auth.currentUser?.uid).toBe(uid);
  });

  it("refuse un nom d'utilisateur déjà pris, un mot de passe court et un rôle inconnu", async () => {
    await signInAs("admin_alfajr", DEMO_PASSWORDS.director);
    const create = httpsCallable(functions, "createUserAccount");
    await expect(create({ username: "khalid_tazi", password: "motdepasse-2026", fullName: "X", role: "مدرس" })).rejects.toMatchObject({ code: "functions/already-exists" });
    await expect(create({ username: "autre_prof", password: "court", fullName: "X", role: "مدرس" })).rejects.toMatchObject({ code: "functions/invalid-argument" });
    await expect(create({ username: "autre_prof", password: "motdepasse-2026", fullName: "X", role: "superadmin" })).rejects.toMatchObject({ code: "functions/invalid-argument" });
  });

  it("refuse tout appelant qui n'est pas directeur (même إداري)", async () => {
    await signInAs("khalid_tazi", "123");
    const create = httpsCallable(functions, "createUserAccount");
    await expect(create({ username: "pirate", password: "motdepasse-2026", fullName: "X", role: "مدير" })).rejects.toMatchObject({ code: "functions/permission-denied" });
    const reset = httpsCallable(functions, "resetUserPassword");
    await expect(reset({ appUserId: "u1", newPassword: "motdepasse-2026" })).rejects.toMatchObject({ code: "functions/permission-denied" });
    await signOut(auth);
    await expect(create({ username: "pirate", password: "motdepasse-2026", fullName: "X", role: "مدير" })).rejects.toMatchObject({ code: "functions/unauthenticated" });
  });

  it("le directeur réinitialise un mot de passe : l'ancien ne marche plus, changement obligatoire", async () => {
    await admin.db.collection("appUsers").doc("p_S-101").update({ mustChangePassword: false });
    await signInAs("admin_alfajr", DEMO_PASSWORDS.director);
    const reset = httpsCallable(functions, "resetUserPassword");
    await reset({ appUserId: "p_S-101", newPassword: "provisoire-2026" });
    expect((await admin.db.collection("appUsers").doc("p_S-101").get()).data()?.mustChangePassword).toBe(true);
    await expect(signInAs("mohammed_alami", "123")).rejects.toThrow();
    await signInAs("mohammed_alami", "provisoire-2026");
  });
});

// Voir functions/src/index.ts : dans un environnement où l'émulateur ne peut pas
// enregistrer les triggers, ces tests sont ignorés ; la logique est alors couverte
// par functions/test/archiveSync.test.ts (appel direct des gestionnaires).
const triggersDisabled = process.env.EMULATOR_SKIP_FIRESTORE_TRIGGERS === "true";

describe.skipIf(triggersDisabled)("archivage = compte suspendu (triggers)", () => {
  const accountState = async (appUserId: string) => {
    const u = (await admin.db.collection("appUsers").doc(appUserId).get()).data()!;
    const link = (await admin.db.collection("authLinks").doc(u.authUid).get()).data()!;
    const rec = await admin.auth.getUser(u.authUid);
    return { isActive: u.isActive, isArchived: u.isArchived, linkActive: link.isActive, disabled: rec.disabled };
  };

  it("archiver un enseignant suspend son compte, le désarchiver le réactive", async () => {
    await admin.db.collection("teachers").doc("t1").update({ isArchived: true });
    await waitFor(async () => (await accountState("t_t1")).disabled === true);
    expect(await accountState("t_t1")).toEqual({ isActive: false, isArchived: true, linkActive: false, disabled: true });

    await admin.db.collection("teachers").doc("t1").update({ isArchived: false });
    await waitFor(async () => (await accountState("t_t1")).disabled === false);
    expect(await accountState("t_t1")).toEqual({ isActive: true, isArchived: false, linkActive: true, disabled: false });
  });

  it("archiver un élève suspend son compte et celui du parent dont tous les enfants sont archivés", async () => {
    await admin.db.collection("students").doc("S-109").update({ isArchived: true });
    await waitFor(async () => (await accountState("s_S-109")).disabled === true && (await accountState("p_S-109")).disabled === true);
    expect((await accountState("s_S-109")).linkActive).toBe(false);
    expect((await accountState("p_S-109")).linkActive).toBe(false);
  });

  it("un parent qui a encore un enfant actif n'est pas suspendu", async () => {
    await admin.db.collection("students").doc("S-101").update({ isArchived: true });
    // Laisser au trigger le temps de passer, puis vérifier que rien n'a changé.
    await new Promise((r) => setTimeout(r, 3000));
    expect((await accountState("p_S-101")).isActive).toBe(true);
    await admin.db.collection("students").doc("S-102").update({ isArchived: true });
    await waitFor(async () => (await accountState("p_S-101")).disabled === true);
  });

  it("le compte directeur principal n'est jamais suspendu automatiquement", async () => {
    await admin.db.collection("appUsers").doc("u1").update({ linkedTeacherId: "t2" });
    await admin.db.collection("teachers").doc("t2").update({ isArchived: true });
    await waitFor(async () => (await accountState("t_t2")).disabled === true);
    expect((await accountState("u1")).isActive).toBe(true);
  });
});
