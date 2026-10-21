/**
 * Test de bout en bout du script scripts/admin/lot0-provision-auth.ts sur les
 * émulateurs Auth + Firestore, avec un jeu de données fictif reproduisant la
 * forme des données réelles (dont les cas piégeux).
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initializeApp as initClientApp, deleteApp as deleteClientApp } from "firebase/app";
import { connectAuthEmulator, getAuth as getClientAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, getFirestore as getClientFirestore } from "firebase/firestore";

import { initAdmin, parseCommonArgs, type AdminHandles } from "../../scripts/admin/lib/cli";
import { computeProvisionPlan, runLot0Provision } from "../../scripts/admin/lot0-provision-auth";
import { DEMO_PASSWORDS, legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { normalizeAuthPassword } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
let admin: AdminHandles;

async function clearEmulators() {
  const fsHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  await fetch(`http://${fsHost}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${authHost}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

async function allAuthUsers() {
  const res = await admin.auth.listUsers(1000);
  return res.users;
}

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = initAdmin(PROJECT, "(default)", true, "provision-test");
  await clearEmulators();
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
});

afterAll(async () => {
  await admin?.close();
});

describe("garde-fous de la ligne de commande", () => {
  const emuEnv = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };
  it("refuse de tourner sans --project explicite", () => {
    expect(() => parseCommonArgs([], emuEnv)).toThrow(/--project/);
  });
  it("est en simulation par défaut", () => {
    expect(parseCommonArgs(["--project=demo-quran-school"], emuEnv).apply).toBe(false);
  });
  it("refuse un vrai projet quand les émulateurs sont configurés (mélange)", () => {
    expect(() => parseCommonArgs(["--project=gen-lang-client-0481880143"], emuEnv)).toThrow(/mélange/);
  });
  it("refuse un projet demo-* hors émulateurs", () => {
    expect(() => parseCommonArgs(["--project=demo-quran-school"], {})).toThrow(/émulateurs/);
  });
  it("exige --database et --confirm-prod pour écrire sur un vrai projet", () => {
    expect(() => parseCommonArgs(["--project=mon-projet", "--apply"], {})).toThrow(/--database/);
    expect(() => parseCommonArgs(["--project=mon-projet", "--database=base", "--apply"], {})).toThrow(/--confirm-prod=mon-projet/);
    expect(parseCommonArgs(["--project=mon-projet", "--database=base"], {}).apply).toBe(false);
  });
});

describe("plan de provisionnement (pur)", () => {
  const fx = legacyFixture();
  const users = Object.entries(fx.collections.appUsers).map(([id, d]) => ({ id, ...d }));
  const students = Object.entries(fx.collections.students).map(([id, d]) => ({ id, ...(d as any) }));
  const teachers = Object.entries(fx.collections.teachers).map(([id, d]) => ({ id, ...(d as any) }));
  const plan = computeProvisionPlan(users, students, teachers);
  const acc = (id: string) => plan.accounts.find((a) => a.appUserId === id)!;

  it("rattache les enfants par téléphone normalisé, sans approximation", () => {
    expect(acc("p_S-101").linkedStudentIds.sort()).toEqual(["S-101", "S-102"]);
    expect(acc("p_S-101").linkIssues).toEqual([]);
    expect(acc("p_S-109").linkedStudentIds).toEqual(["S-109"]);
  });

  it("sépare les parents homonymes qui ont des téléphones différents", () => {
    expect(acc("p_S-103").linkedStudentIds).toEqual(["S-103"]);
    expect(acc("p_S-104").linkedStudentIds).toEqual(["S-104"]);
  });

  it("téléphone partagé par deux parents de noms différents : l'autre enfant n'est PAS lié, il est signalé", () => {
    expect(acc("p_S-105").linkedStudentIds).toEqual(["S-105"]);
    const issue = acc("p_S-105").linkIssues.find((i) => i.code === "SHARED_PHONE_DIFFERENT_NAME");
    expect(issue).toMatchObject({ studentId: "S-106", included: false });
  });

  it("rattachement par le seul nom (sans téléphone) : exclu et signalé", () => {
    expect(acc("p_S-107").linkedStudentIds).toEqual(["S-107"]);
    expect(acc("p_S-107").linkIssues.find((i) => i.code === "NAME_ONLY_MATCH")).toMatchObject({ studentId: "S-108", included: false });
  });

  it("compte parent saisi à la main : seul l'enfant dont téléphone ET nom concordent est lié", () => {
    expect(acc("u_manual_parent").linkedStudentIds).toEqual(["S-106"]);
    const codes = acc("u_manual_parent").linkIssues.map((i) => `${i.code}:${i.studentId}:${i.included}`);
    expect(codes).toContain("NO_ANCHOR_MATCH:S-106:true");
    expect(codes).toContain("SHARED_PHONE_DIFFERENT_NAME:S-105:false");
  });

  it("lie l'élève à son seul dossier et le personnel à sa fiche", () => {
    expect(acc("s_S-109").linkedStudentIds).toEqual(["S-109"]);
    expect(acc("t_t1").linkedTeacherId).toBe("t1");
    expect(acc("u1").linkedStudentIds).toEqual([]);
  });

  it("dédoublonne les noms d'utilisateur et corrige les identifiants invalides", () => {
    expect(acc("p_S-103").username).toBe("mohammed_alaoui");
    expect(acc("p_S-104").username).toBe("mohammed_alaoui_2");
    expect(acc("p_S-104").renamed).toBe(true);
    expect(acc("u_bad").username).toMatch(/^[a-z0-9][a-z0-9._-]+$/);
    const codes = plan.anomalies.map((a) => a.code);
    expect(codes).toEqual(expect.arrayContaining(["DUPLICATE_USERNAME", "INVALID_USERNAME", "NO_PASSWORD", "USERNAME_RENAMED"]));
    expect(plan.critical).toBe(false);
  });

  it("classe comme critique un compte u1 dont le rôle a été écrasé", () => {
    const tampered = users.map((u) => (u.id === "u1" ? { ...u, role: "ولي أمر" } : u));
    const p = computeProvisionPlan(tampered, students, teachers);
    expect(p.critical).toBe(true);
    expect(p.anomalies.find((a) => a.code === "U1_NOT_DIRECTOR")).toBeTruthy();
  });
});

describe("exécution sur les émulateurs", () => {
  it("la simulation (par défaut) n'écrit rien", async () => {
    const before = (await allAuthUsers()).length;
    const out = mkdtempSync(join(tmpdir(), "lot0-dry-"));
    const { summary } = await runLot0Provision(admin.db, admin.auth, { apply: false, syncExistingPasswords: true, acceptCritical: false, outDir: out });
    expect(summary.mode).toBe("simulation");
    expect(summary.authCreated).toBe(0);
    expect((await allAuthUsers()).length).toBe(before);
    const u1 = await admin.db.collection("appUsers").doc("u1").get();
    expect(u1.data()?.password).toBe(DEMO_PASSWORDS.director);
    expect((await admin.db.collection("authLinks").get()).size).toBe(0);
    // Rapports produits
    const dir = summary.reportDir!;
    expect(readdirSync(dir).sort()).toEqual(["anomalies.csv", "comptes.csv", "identifiants-renommes.csv", "liens-a-valider.csv", "resume.json"]);
    const review = readFileSync(join(dir, "liens-a-valider.csv"), "utf8");
    expect(review).toContain("SHARED_PHONE_DIFFERENT_NAME");
    expect(review).toContain("NON LIÉ — à ajouter si confirmé");
  });

  it("refuse d'appliquer en présence d'anomalie critique sans --accept-critical", async () => {
    await admin.db.collection("appUsers").doc("u1").update({ role: "ولي أمر" });
    await expect(runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null })).rejects.toThrow(/critiques/);
    await admin.db.collection("appUsers").doc("u1").update({ role: "مدير" });
    expect((await admin.db.collection("authLinks").get()).size).toBe(0);
  });

  it("l'application crée les comptes, les liens, retire les mots de passe", async () => {
    const { summary } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    const fx = legacyFixture();
    const nbUsers = Object.keys(fx.collections.appUsers).length;
    expect(summary.appUsers).toBe(nbUsers);
    expect(summary.authExisting).toBe(2); // admin_alfajr et youssef_baqali existaient déjà
    expect(summary.authCreated).toBe(nbUsers - 2);
    expect(summary.linksWritten).toBe(nbUsers);

    const usersSnap = await admin.db.collection("appUsers").get();
    for (const d of usersSnap.docs) {
      expect(d.data().password, d.id).toBeUndefined();
      expect(d.data().mustChangePassword, d.id).toBe(true);
      expect(typeof d.data().authUid, d.id).toBe("string");
      const link = await admin.db.collection("authLinks").doc(d.data().authUid).get();
      expect(link.data()?.appUserId).toBe(d.id);
      expect(link.data()?.role).toBe(d.data().role);
    }
    const parent = (await admin.db.collection("appUsers").doc("p_S-101").get()).data()!;
    expect(parent.linkedStudentIds.sort()).toEqual(["S-101", "S-102"]);
    const suspended = (await admin.db.collection("appUsers").doc("p_S-110").get()).data()!;
    const suspendedLink = (await admin.db.collection("authLinks").doc(suspended.authUid).get()).data()!;
    expect(suspendedLink.isActive).toBe(false);
    expect((await admin.auth.getUser(suspended.authUid)).disabled).toBe(true);
    const renamed = (await admin.db.collection("appUsers").doc("p_S-104").get()).data()!;
    expect(renamed.username).toBe("mohammed_alaoui_2");
    expect(renamed.authEmail).toBe("mohammed_alaoui_2@alfajr.local");
  });

  it("la relance est idempotente (aucun doublon, aucun changement forcé)", async () => {
    const before = (await allAuthUsers()).length;
    // Un utilisateur a déjà changé son mot de passe entre-temps.
    await admin.db.collection("appUsers").doc("t_t2").update({ mustChangePassword: false });
    const { summary } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    expect(summary.authCreated).toBe(0);
    expect(summary.authPasswordSynced).toBe(0);
    expect(summary.mustChangePasswordSet).toBe(0);
    expect((await allAuthUsers()).length).toBe(before);
    expect((await admin.db.collection("appUsers").doc("t_t2").get()).data()?.mustChangePassword).toBe(false);
  });

  it("supprime un mot de passe réécrit par un ancien client sans toucher à Firebase Auth", async () => {
    // Ancien onglet resté ouvert entre le script et le déploiement des règles.
    await admin.db.collection("appUsers").doc("t_t2").update({ password: "123" });
    const { summary, plan } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    expect(plan.anomalies.find((a) => a.code === "PASSWORD_REAPPEARED")?.appUserId).toBe("t_t2");
    expect(summary.passwordsRemoved).toBe(1);
    expect(summary.authPasswordSynced).toBe(0);
    expect((await admin.db.collection("appUsers").doc("t_t2").get()).data()?.password).toBeUndefined();
  });

  it("les utilisateurs se connectent avec leur mot de passe connu ; la racine reste fermée", async () => {
    // Depuis la bascule multi-écoles, les règles ferment la racine : les données
    // ne sont lisibles que sous schools/{id} (voir tenant-rules.test.ts).
    const app = initClientApp({ projectId: PROJECT, apiKey: "demo-api-key" }, `client-${Date.now()}`);
    const auth = getClientAuth(app);
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const db = getClientFirestore(app);
    const [host, port] = String(process.env.FIRESTORE_EMULATOR_HOST).split(":");
    connectFirestoreEmulator(db, host, Number(port));
    try {
      // Directeur : mot de passe long, inchangé.
      await signInWithEmailAndPassword(auth, "admin_alfajr@alfajr.local", normalizeAuthPassword(DEMO_PASSWORDS.director));
      await expect(getDoc(doc(db, "payments", "p_init_S-101"))).rejects.toThrow();
      await signOut(auth);

      // Enseignant dont le compte Auth existait avec un mot de passe périmé : réaligné sur « 123 ».
      await signInWithEmailAndPassword(auth, "youssef_baqali@alfajr.local", normalizeAuthPassword("123"));
      await signOut(auth);

      // Parent (« 123 » + suffixe historique).
      await signInWithEmailAndPassword(auth, "mohammed_alami@alfajr.local", "123_secure_fajr");
      await expect(getDoc(doc(db, "students", "S-102"))).rejects.toThrow();
      await signOut(auth);

      // Compte suspendu (enfant archivé) : connexion refusée par Firebase Auth.
      await expect(signInWithEmailAndPassword(auth, "mustafa_filali@alfajr.local", "123_secure_fajr")).rejects.toThrow(/user-disabled/);
    } finally {
      await signOut(auth).catch(() => undefined);
      await deleteClientApp(app);
    }
  });
});
