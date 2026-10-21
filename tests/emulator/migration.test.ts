/**
 * Test de bout en bout de scripts/migration/migrate-to-tenants.ts sur les
 * émulateurs, avec le jeu de données fictif réaliste (parents homonymes,
 * téléphones partagés, comptes dupliqués, références orphelines, photo lourde).
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteApp as deleteClientApp, initializeApp as initClientApp } from "firebase/app";
import { connectAuthEmulator, getAuth as getClientAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore as getClientFirestore, query, where } from "firebase/firestore";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runLot0Provision } from "../../scripts/admin/lot0-provision-auth";
import { runMigration, TENANT_COLLECTIONS } from "../../scripts/migration/migrate-to-tenants";
import { DEMO_PASSWORDS, legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { normalizeAuthPassword } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
const S = "alfajr";
let admin: AdminHandles;
const fx = legacyFixture();

async function clearEmulators() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

const count = async (path: string) => (await admin.db.collection(path).count().get()).data().count;
const uidOf = async (appUserId: string) => (await admin.db.collection("appUsers").doc(appUserId).get()).data()?.authUid as string;

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "migration-test");
  await clearEmulators();
  await seedLegacyFixture(admin.db, admin.auth, fx);
});

afterAll(async () => {
  await admin?.close();
});

describe("migration racine → schools/alfajr", () => {
  it("la simulation (par défaut) n'écrit rien et compte ce qui serait copié", async () => {
    const out = mkdtempSync(join(tmpdir(), "migration-dry-"));
    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: false, outDir: out, superAdminUsername: "admin_alfajr" });
    expect(summary.mode).toBe("simulation");
    for (const c of summary.collections) {
      const expected = Object.keys(fx.collections[c.collection] || {}).length;
      expect(c.source, c.collection).toBe(expected);
      expect(c.copied, c.collection).toBe(expected);
    }
    expect(await count(`schools/${S}/students`)).toBe(0);
    expect(await count("users")).toBe(0);
    expect(summary.accounts.pendingAuth).toBe(Object.keys(fx.collections.appUsers).length);
    expect(JSON.parse(readFileSync(join(summary.reportDir!, "resume.json"), "utf8")).mode).toBe("simulation");
  });

  it("l'application copie tout, crée users/members/usernames, pose le claim super-admin", async () => {
    const { summary, anomalies } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null, superAdminUsername: "admin_alfajr" });
    expect(summary.critical).toBe(false);
    for (const c of summary.collections) {
      expect(c.targetAfter, c.collection).toBe(c.source);
    }
    // Chaque document porte le schoolId dénormalisé.
    const students = await admin.db.collection(`schools/${S}/students`).get();
    students.forEach((d) => expect(d.data().schoolId).toBe(S));

    // Paramètres : cotisation et règles historiques désormais explicites.
    const settings = (await admin.db.doc(`schools/${S}/settings/system`).get()).data()!;
    expect(settings.subscriptionFee).toBe(100);
    expect(settings.feeOverrides).toEqual([{ year: 2026, month: "يوليوز", amount: 70 }, { year: 2026, month: "غشت", amount: 70 }]);
    expect(settings.openingYear).toBe(2026);
    expect(settings.openingMonth).toBe("يوليوز");
    expect((await admin.db.doc(`schools/${S}`).get()).data()?.name).toBe(fx.settings.associationName);

    // Comptes
    const nbUsers = Object.keys(fx.collections.appUsers).length;
    expect(summary.accounts.membersWritten).toBe(nbUsers);
    expect(await count("users")).toBe(nbUsers);
    expect(await count(`schools/${S}/members`)).toBe(nbUsers);
    expect(await count("usernames")).toBe(nbUsers);
    const parentUid = await uidOf("p_S-101");
    const member = (await admin.db.doc(`schools/${S}/members/${parentUid}`).get()).data()!;
    expect(member).toMatchObject({ role: "ولي أمر", legacyAppUserId: "p_S-101", schoolId: S });
    expect(member.linkedStudentIds.sort()).toEqual(["S-101", "S-102"]);
    expect(member.password).toBeUndefined();
    const user = (await admin.db.doc(`users/${parentUid}`).get()).data()!;
    expect(user).toMatchObject({ username: "mohammed_alami", schoolIds: [S], lastSchoolId: S, mustChangePassword: true });
    const renamed = (await admin.db.doc(`schools/${S}/members/${await uidOf("p_S-104")}`).get()).data()!;
    expect(renamed.username).toBe("mohammed_alaoui_2");

    const directorUid = await uidOf("u1");
    expect((await admin.auth.getUser(directorUid)).customClaims?.superAdmin).toBe(true);

    // Audit
    const codes = anomalies.map((a) => a.code);
    expect(codes).toEqual(expect.arrayContaining(["DUPLICATE_USERNAME", "INVALID_USERNAME", "LARGE_PHOTO", "ORPHAN_CLASS", "ORPHAN_STUDENT_REF"]));
  });

  it("la relance est idempotente et n'écrase jamais une donnée saisie après la bascule", async () => {
    await admin.db.doc(`schools/${S}/students/S-101`).update({ hizbCount: 42 });
    const directorUid = await uidOf("u1");
    await admin.db.doc(`users/${directorUid}`).update({ mustChangePassword: false });
    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null });
    for (const c of summary.collections) {
      expect(c.copied, c.collection).toBe(0);
      expect(c.skippedExisting, c.collection).toBe(c.source);
    }
    expect(summary.accounts.membersWritten).toBe(0);
    expect(summary.accounts.usernamesRegistered).toBe(0);
    expect((await admin.db.doc(`schools/${S}/students/S-101`).get()).data()?.hizbCount).toBe(42);
    expect((await admin.db.doc(`users/${directorUid}`).get()).data()?.mustChangePassword).toBe(false);
    // Les données racine restent intactes (retour arrière possible).
    expect(await count("students")).toBe(Object.keys(fx.collections.students).length);
  });

  it("après migration, les règles multi-écoles s'appliquent aux comptes migrés", async () => {
    const app = initClientApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `migr-client-${Date.now()}`);
    const auth = getClientAuth(app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const db = getClientFirestore(app);
    const [host, port] = String(process.env.FIRESTORE_EMULATOR_HOST).split(":");
    connectFirestoreEmulator(db, host, Number(port));
    try {
      await signInWithEmailAndPassword(auth, "admin_alfajr@alfajr.local", normalizeAuthPassword(DEMO_PASSWORDS.director));
      expect((await getDocs(collection(db, "schools", S, "payments"))).size).toBeGreaterThan(0);
      await expect(getDoc(doc(db, "payments", "p_init_S-101"))).rejects.toThrow(); // racine fermée
      await signOut(auth);

      await signInWithEmailAndPassword(auth, "mohammed_alami@alfajr.local", "123_secure_fajr");
      expect((await getDoc(doc(db, "schools", S, "students", "S-102"))).exists()).toBe(true);
      await expect(getDoc(doc(db, "schools", S, "students", "S-103"))).rejects.toThrow();
      const pays = await getDocs(query(collection(db, "schools", S, "payments"), where("studentId", "in", ["S-101", "S-102"])));
      expect(pays.size).toBe(2);
      await signOut(auth);

      await signInWithEmailAndPassword(auth, "said_morabit@alfajr.local", "123_secure_fajr");
      await expect(getDocs(collection(db, "schools", S, "students"))).rejects.toThrow();
      expect((await getDocs(collection(db, "schools", S, "classes"))).size).toBe(2);
    } finally {
      await signOut(auth).catch(() => undefined);
      await deleteClientApp(app);
    }
  });
});

describe("migration après un Lot 0 déjà déployé", () => {
  it("reprend les comptes provisionnés sans réimposer de changement de mot de passe", async () => {
    await clearEmulators();
    await seedLegacyFixture(admin.db, admin.auth, fx);
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    await admin.db.doc("appUsers/t_t2").update({ mustChangePassword: false }); // khalid_tazi a changé son mot de passe
    const authBefore = (await admin.auth.listUsers(1000)).users.length;

    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null });
    expect(summary.accounts.pendingAuth).toBe(0);
    expect((await admin.auth.listUsers(1000)).users.length).toBe(authBefore);
    const uid = await uidOf("t_t2");
    expect((await admin.db.doc(`users/${uid}`).get()).data()?.mustChangePassword).toBe(false);
    for (const col of TENANT_COLLECTIONS) {
      expect(await count(`schools/${S}/${col}`), col).toBe(Object.keys(fx.collections[col] || {}).length);
    }
  });
});
