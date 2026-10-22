/**
 * Logique de suspension à l'archivage, testée en appelant directement les
 * gestionnaires des triggers contre les émulateurs Firestore et Auth.
 * (Complète les tests E2E de tests/emulator/lot0-functions.test.ts, qui
 * passent par l'émulateur Functions quand celui-ci peut enregistrer les triggers.)
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

type Mod = typeof import("../src/lot0/archiveSync.js");
type AdminMod = typeof import("../src/admin.js");
let archive: Mod;
let adminMod: AdminMod;

const snap = (data: Record<string, unknown>) => ({ data: () => data });
const event = (params: Record<string, string>, before: Record<string, unknown>, after: Record<string, unknown>) =>
  ({ params, data: { before: snap(before), after: snap(after) } }) as any;

async function account(appUserId: string, data: Record<string, unknown>) {
  const auth = adminMod.adminAuth();
  const user = await auth.createUser({ email: `${appUserId.toLowerCase().replace(/[^a-z0-9]/g, "")}@test.local`, password: "motdepasse-2026" });
  const db = adminMod.adminDb();
  await db.collection("appUsers").doc(appUserId).set({ isActive: true, isArchived: false, authUid: user.uid, ...data });
  await db.collection("authLinks").doc(user.uid).set({ appUserId, role: data.role, isActive: data.isActive ?? true });
  return user.uid;
}

async function state(appUserId: string) {
  const db = adminMod.adminDb();
  const u = (await db.collection("appUsers").doc(appUserId).get()).data()!;
  const link = (await db.collection("authLinks").doc(u.authUid).get()).data()!;
  const rec = await adminMod.adminAuth().getUser(u.authUid);
  return { isActive: u.isActive, isArchived: u.isArchived, linkActive: link.isActive, disabled: rec.disabled };
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  adminMod = await import("../src/admin.js");
  archive = await import("../src/lot0/archiveSync.js");
});

beforeEach(async () => {
  const project = process.env.GCLOUD_PROJECT;
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${project}/accounts`, { method: "DELETE" });
});

describe("syncAccountsOnTeacherArchive", () => {
  it("suspend puis réactive le compte lié (lien explicite ou t_{id})", async () => {
    await account("t_t1", { role: "مدرس" });
    await account("u_lie", { role: "مؤطر", linkedTeacherId: "t1" });
    await archive.syncAccountsOnTeacherArchive.run(event({ teacherId: "t1" }, { isArchived: false }, { isArchived: true }));
    expect(await state("t_t1")).toEqual({ isActive: false, isArchived: true, linkActive: false, disabled: true });
    expect((await state("u_lie")).disabled).toBe(true);

    await archive.syncAccountsOnTeacherArchive.run(event({ teacherId: "t1" }, { isArchived: true }, { isArchived: false }));
    expect(await state("t_t1")).toEqual({ isActive: true, isArchived: false, linkActive: true, disabled: false });
  });

  it("ne réactive pas un compte suspendu pour une autre raison, ni ne touche à u1", async () => {
    await account("t_t2", { role: "إداري", isActive: false, isArchived: false });
    await account("u1", { role: "مدير", linkedTeacherId: "t2" });
    await archive.syncAccountsOnTeacherArchive.run(event({ teacherId: "t2" }, { isArchived: true }, { isArchived: false }));
    expect((await state("t_t2")).isActive).toBe(false);
    await archive.syncAccountsOnTeacherArchive.run(event({ teacherId: "t2" }, { isArchived: false }, { isArchived: true }));
    expect((await state("u1")).isActive).toBe(true);
  });

  it("ignore les mises à jour qui ne changent pas isArchived", async () => {
    await account("t_t3", { role: "مدرس" });
    await archive.syncAccountsOnTeacherArchive.run(event({ teacherId: "t3" }, { isArchived: false, phone: "1" }, { isArchived: false, phone: "2" }));
    expect((await state("t_t3")).isActive).toBe(true);
  });
});

describe("syncAccountsOnStudentArchive", () => {
  it("suspend l'élève et le parent dont tous les enfants sont archivés", async () => {
    const db = adminMod.adminDb();
    await db.collection("students").doc("S-1").set({ fullName: "A", isArchived: true });
    await db.collection("students").doc("S-2").set({ fullName: "B", isArchived: false });
    await account("s_S-1", { role: "طالب", linkedStudentIds: ["S-1"] });
    await account("p_S-1", { role: "ولي أمر", linkedStudentIds: ["S-1", "S-2"] });

    await archive.syncAccountsOnStudentArchive.run(event({ studentId: "S-1" }, { isArchived: false }, { isArchived: true }));
    expect((await state("s_S-1")).disabled).toBe(true);
    expect((await state("p_S-1")).isActive).toBe(true); // S-2 encore actif

    await db.collection("students").doc("S-2").set({ fullName: "B", isArchived: true });
    await archive.syncAccountsOnStudentArchive.run(event({ studentId: "S-2" }, { isArchived: false }, { isArchived: true }));
    expect(await state("p_S-1")).toEqual({ isActive: false, isArchived: true, linkActive: false, disabled: true });

    await db.collection("students").doc("S-2").set({ fullName: "B", isArchived: false });
    await archive.syncAccountsOnStudentArchive.run(event({ studentId: "S-2" }, { isArchived: true }, { isArchived: false }));
    expect((await state("p_S-1")).isActive).toBe(true);
  });
});
