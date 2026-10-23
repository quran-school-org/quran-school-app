/**
 * Revue adversariale du durcissement — Functions : le compte super-admin
 * n'est jamais désactivé automatiquement (D72). Les tests du proxy IA (D43,
 * D67) ont été retirés avec la fonctionnalité (D76).
 * Voir docs/revues/REVUE-SECURITE-DURCISSEMENT.md.
 * Émulateurs Firestore et Auth (firebase emulators:exec).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.GCLOUD_PROJECT ||= "demo-quran-school";
process.env.FIRESTORE_DATABASE_ID ||= "(default)";

let admin: typeof import("../src/admin.js");
let accounts: typeof import("../src/tenant/accounts.js");
let archive: typeof import("../src/tenant/archiveSync.js");

const PROJECT = () => process.env.GCLOUD_PROJECT!;

async function clear() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT()}/accounts`, { method: "DELETE" });
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = await import("../src/admin.js");
  accounts = await import("../src/tenant/accounts.js");
  archive = await import("../src/tenant/archiveSync.js");
});

beforeEach(clear);

describe("D72 : un directeur ne peut pas bloquer le compte du super-admin", () => {
  async function setup() {
    const db = admin.adminDb();
    const auth = admin.adminAuth();
    const sup = (await auth.createUser({ email: "plateforme@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    await auth.setCustomUserClaims(sup, { superAdmin: true });
    const dir = (await auth.createUser({ email: "dir_nouvelle@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    const prof = (await auth.createUser({ email: "prof_nouvelle@comptes.kuttab.local", password: "motdepasse-2026" })).uid;
    // École créée par le super-admin avec makeMeDirector (parcours de l'interface), puis vrai directeur.
    for (const [uid, role] of [[sup, "مدير"], [dir, "مدير"], [prof, "مدرس"]] as const) {
      await db.doc(`schools/nouvelle/members/${uid}`).set({ uid, schoolId: "nouvelle", role, isActive: true, isArchived: false, linkedStudentIds: [], linkedTeacherId: null });
      await db.doc(`users/${uid}`).set({ schoolIds: ["nouvelle"], lastSchoolId: "nouvelle" });
    }
    return { sup, dir, prof };
  }

  it("retrait du super-admin de sa seule école : appartenance supprimée, compte Auth NON désactivé", async () => {
    const { sup, dir, prof } = await setup();
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "nouvelle", sup, {}, true);
    expect((await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).exists).toBe(false);
    expect((await admin.adminAuth().getUser(sup)).disabled).toBe(false);
    // Comportement normal conservé pour un compte ordinaire.
    await accounts.setMemberRoleCore({ uid: dir, superAdmin: false }, "nouvelle", prof, {}, true);
    expect((await admin.adminAuth().getUser(prof)).disabled).toBe(true);
  });

  it("archivage d'une fiche liée au super-admin : membre suspendu dans l'école, compte Auth NON désactivé", async () => {
    const { sup } = await setup();
    const member = { uid: sup, data: (await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).data()! };
    expect(await archive.setMemberArchived("nouvelle", member, true)).toBe(true);
    expect((await admin.adminDb().doc(`schools/nouvelle/members/${sup}`).get()).data()?.isActive).toBe(false);
    expect((await admin.adminAuth().getUser(sup)).disabled).toBe(false);
  });
});
