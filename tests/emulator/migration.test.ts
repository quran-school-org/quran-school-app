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
import { STAFF_PRIVATE_FIELDS, hasStaffPrivateFields } from "../../src/security/staffPrivate";
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
/** Nombre attendu de fiches RH : fiches du personnel de la racine porteuses d'un champ RH. */
const expectedStaffPrivate = Object.values(fx.collections.teachers).filter((t) => hasStaffPrivateFields(t as Record<string, unknown>)).length;
const expectedCount = (col: string) => (col === "staffPrivate" ? expectedStaffPrivate : Object.keys(fx.collections[col] || {}).length);
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
    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: false, outDir: out, superAdminUsername: "admin_alfajr", rotatePasswords: "none" });
    expect(summary.mode).toBe("simulation");
    expect(summary.collections.map((c) => c.collection)).toEqual([...TENANT_COLLECTIONS, "staffPrivate"]);
    expect(expectedStaffPrivate).toBeGreaterThan(0);
    for (const c of summary.collections) {
      const expected = expectedCount(c.collection);
      expect(c.source, c.collection).toBe(expected);
      expect(c.copied, c.collection).toBe(expected);
    }
    expect(await count(`schools/${S}/students`)).toBe(0);
    expect(await count("users")).toBe(0);
    expect(summary.accounts.pendingAuth).toBe(Object.keys(fx.collections.appUsers).length);
    expect(JSON.parse(readFileSync(join(summary.reportDir!, "resume.json"), "utf8")).mode).toBe("simulation");
  });

  it("l'application copie tout, crée users/members/usernames, pose le claim super-admin", async () => {
    const { summary, anomalies } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null, superAdminUsername: "admin_alfajr", rotatePasswords: "none" });
    expect(summary.critical).toBe(false);
    for (const c of summary.collections) {
      expect(c.targetAfter, c.collection).toBe(c.source);
    }
    // Personnel scindé (R-06, D42) : aucune donnée RH dans la fiche publique.
    const teachers = await admin.db.collection(`schools/${S}/teachers`).get();
    expect(teachers.size).toBe(Object.keys(fx.collections.teachers).length);
    teachers.forEach((d) => {
      for (const k of STAFF_PRIVATE_FIELDS) expect(d.data()[k], `${d.id}.${k}`).toBeUndefined();
      expect(d.data().fullName).toBe((fx.collections.teachers[d.id] as any).fullName);
    });
    const rh = (await admin.db.doc(`schools/${S}/staffPrivate/t1`).get()).data()!;
    expect(rh).toMatchObject({ monthlySalary: 2500, cinNumber: "XX000001", contractType: "مكافأة شهرية", birthDate: "1990-04-12", address: "عنوان تجريبي، سلا", emergencyContact: "0611000009", teacherId: "t1", schoolId: S });
    expect(rh.fullName).toBeUndefined();
    expect((await admin.db.doc(`schools/${S}/staffPrivate/t3`).get()).exists).toBe(false); // aucun champ RH à la racine
    expect(summary.staffSplitExisting).toBe(0);

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
    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null, rotatePasswords: "none" });
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
    expect((await admin.db.doc("teachers/t1").get()).data()?.monthlySalary).toBe(2500);
  });

  it("une fiche publique cible encore porteuse de champs RH est scindée à la relance, sans écraser la fiche RH", async () => {
    // Fiche saisie par une version antérieure à D42 (t2 : fiche RH déjà présente ; t5 : aucune).
    // t2 : emergencyContact n'existe que dans la fiche publique (revue D66 : il ne doit pas être perdu).
    await admin.db.doc(`schools/${S}/teachers/t2`).update({ monthlySalary: 9999, cinNumber: "ANCIEN", emergencyContact: "0612000000" });
    await admin.db.doc(`schools/${S}/teachers/t5`).update({ monthlySalary: 1800, address: "عنوان" });
    await admin.db.doc(`schools/${S}/staffPrivate/t1`).update({ monthlySalary: 2700 }); // saisie après la bascule

    const dry = await runMigration(admin.db, admin.auth, { schoolId: S, apply: false, outDir: null, rotatePasswords: "none" });
    expect(dry.summary.staffSplitExisting).toBe(2);
    expect((await admin.db.doc(`schools/${S}/teachers/t5`).get()).data()?.monthlySalary).toBe(1800); // simulation : rien d'écrit

    const { summary, anomalies } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null, rotatePasswords: "none" });
    expect(summary.staffSplitExisting).toBe(2);
    expect(summary.critical).toBe(false);
    expect(anomalies.filter((a) => a.code === "STAFF_PRIVATE_SPLIT").map((a) => a.appUserId).sort()).toEqual(["t2", "t5"]);
    for (const id of ["t2", "t5"]) {
      const pub = (await admin.db.doc(`schools/${S}/teachers/${id}`).get()).data()!;
      for (const k of STAFF_PRIVATE_FIELDS) expect(pub[k], `${id}.${k}`).toBeUndefined();
      expect(pub.fullName).toBeTruthy();
    }
    const rhT2 = (await admin.db.doc(`schools/${S}/staffPrivate/t2`).get()).data()!;
    expect(rhT2.monthlySalary).toBe(3000); // fiche RH existante conservée
    expect(rhT2.cinNumber).toBe("XX000002");
    expect(rhT2.emergencyContact).toBe("0612000000"); // champ absent de la fiche RH : complété, pas perdu
    const conflict = anomalies.filter((a) => a.code === "STAFF_PRIVATE_CONFLICT");
    expect(conflict.map((a) => a.appUserId)).toEqual(["t2"]);
    expect(conflict[0].detail).toContain("monthlySalary");
    expect(conflict[0].detail).toContain("cinNumber");
    expect(conflict[0].detail).not.toContain("9999"); // noms de champs seulement, aucune valeur
    expect((await admin.db.doc(`schools/${S}/staffPrivate/t5`).get()).data()).toMatchObject({ monthlySalary: 1800, address: "عنوان", teacherId: "t5", schoolId: S });
    expect((await admin.db.doc(`schools/${S}/staffPrivate/t1`).get()).data()?.monthlySalary).toBe(2700);
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

      // Enseignant migré : fiches publiques du personnel, jamais les fiches RH (R-06).
      await signInWithEmailAndPassword(auth, "youssef_baqali@alfajr.local", "123_secure_fajr");
      const staff = await getDocs(collection(db, "schools", S, "teachers"));
      expect(staff.size).toBe(Object.keys(fx.collections.teachers).length);
      staff.forEach((d) => expect(d.data().monthlySalary).toBeUndefined());
      await expect(getDoc(doc(db, "schools", S, "staffPrivate", "t1"))).rejects.toThrow();
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
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    await admin.db.doc("appUsers/t_t2").update({ mustChangePassword: false }); // khalid_tazi a changé son mot de passe
    const authBefore = (await admin.auth.listUsers(1000)).users.length;

    const { summary } = await runMigration(admin.db, admin.auth, { schoolId: S, apply: true, outDir: null, rotatePasswords: "none" });
    expect(summary.accounts.pendingAuth).toBe(0);
    expect((await admin.auth.listUsers(1000)).users.length).toBe(authBefore);
    const uid = await uidOf("t_t2");
    expect((await admin.db.doc(`users/${uid}`).get()).data()?.mustChangePassword).toBe(false);
    for (const col of [...TENANT_COLLECTIONS, "staffPrivate"]) {
      expect(await count(`schools/${S}/${col}`), col).toBe(expectedCount(col));
    }
  });
});
