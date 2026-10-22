/**
 * Revue de sécurité (étape 2) — provisionnement des comptes et migration.
 *
 * Chaque test démontre une faille constatée (il échouait avant le correctif)
 * puis sert de test de non-régression. Données FICTIVES, émulateurs uniquement.
 * Références : docs/revues/REVUE-SECURITE-ETAPE-2.md.
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { runLot0Provision } from "../../scripts/admin/lot0-provision-auth";
import { runMigration } from "../../scripts/migration/migrate-to-tenants";
import { DEMO_PASSWORDS, legacyFixture } from "../../scripts/dev/fixtures/legacy-alfajr";
import { seedLegacyFixture } from "../../scripts/dev/lib/seed";
import { normalizeAuthPassword } from "../../src/security/accounts";

const PROJECT = "demo-quran-school";
let admin: AdminHandles;

async function clearEmulators() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
}

/** Connexion REST à l'émulateur Auth : renvoie les jetons, ou null si refusée. */
async function signIn(email: string, password: string): Promise<{ idToken: string; refreshToken: string } | null> {
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await res.json();
  return res.ok && body.idToken ? { idToken: body.idToken, refreshToken: body.refreshToken } : null;
}

/** Échange d'un jeton de rafraîchissement : vrai si la session est encore valable. */
async function refreshStillWorks(refreshToken: string): Promise<boolean> {
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/securetoken.googleapis.com/v1/token?key=demo`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  const body = await res.json().catch(() => ({}));
  return res.ok && Boolean(body.id_token);
}

/** Lecture minimale d'un CSV produit par scripts/admin/lib/csv.ts (sans champs multilignes). */
function readCsv(path: string): Record<string, string>[] {
  const lines = readFileSync(path, "utf8").replace(/^﻿/, "").split("\r\n").filter(Boolean);
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') quoted = false; else cur += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const [head, ...rows] = lines.map(split);
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

/** Auth qui échoue (panne transitoire simulée) pour certains emails. */
function flakyAuth(auth: Auth, failingEmails: string[]): Auth {
  return new Proxy(auth, {
    get(target, prop) {
      if (prop === "createUser") {
        return async (props: { email?: string }) => {
          if (props.email && failingEmails.includes(props.email)) {
            throw Object.assign(new Error("Quota exceeded (panne simulée)"), { code: "auth/quota-exceeded" });
          }
          return target.createUser(props as any);
        };
      }
      const v = (target as any)[prop];
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** Firestore dont listDocuments() rate les documents d'un chemin (course simulée). */
function staleListingDb(db: Firestore, stalePath: string): Firestore {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "collection") {
        return (path: string) => {
          const col = target.collection(path);
          if (path !== stalePath) return col;
          return new Proxy(col, {
            get(c, p) {
              if (p === "listDocuments") return async () => [];
              const v = (c as any)[p];
              return typeof v === "function" ? v.bind(c) : v;
            },
          });
        };
      }
      const v = (target as any)[prop];
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

const appUser = async (id: string) => (await admin.db.collection("appUsers").doc(id).get()).data()!;

beforeAll(async () => {
  expect(process.env.FIRESTORE_EMULATOR_HOST, "lancer via firebase emulators:exec").toBeTruthy();
  admin = initAdmin(PROJECT, "(default)", true, "revue-provision-test");
});

afterAll(async () => {
  await admin?.close();
});

beforeEach(async () => {
  await clearEmulators();
  await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
});

describe("R-01 mots de passe exposés encore valables après le provisionnement", () => {
  it("par défaut, tous les mots de passe exposés sont remplacés par des mots de passe temporaires aléatoires", async () => {
    const out = mkdtempSync(join(tmpdir(), "revue-rot-"));
    const { summary } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: out });

    // « 123 » (parent, enseignant) et mot de passe exposé du directeur : refusés.
    expect(await signIn("mohammed_alami@alfajr.local", normalizeAuthPassword("123"))).toBeNull();
    expect(await signIn("youssef_baqali@alfajr.local", normalizeAuthPassword("123"))).toBeNull();
    expect(await signIn("admin_alfajr@alfajr.local", DEMO_PASSWORDS.director)).toBeNull();
    expect(await signIn("sans_mdp@alfajr.local", normalizeAuthPassword("123"))).toBeNull();
    // Même un mot de passe solide de appUsers était lisible (S1) et modifiable (S2) par tous.
    expect(await signIn("parent_manuel@alfajr.local", DEMO_PASSWORDS.manualParent)).toBeNull();

    // Les mots de passe temporaires (rapport secret) fonctionnent et le changement est imposé.
    const rows = readCsv(join(summary.reportDir!, "mots-de-passe-temporaires.csv"));
    const director = rows.find((r) => r.appUserId === "u1")!;
    expect(director.motDePasseTemporaire.length).toBeGreaterThanOrEqual(10);
    expect(await signIn("admin_alfajr@alfajr.local", director.motDePasseTemporaire)).not.toBeNull();
    expect((await appUser("u1")).mustChangePassword).toBe(true);
    expect(summary.passwordsRotated).toBe(rows.length);

    // Aucun mot de passe en clair ailleurs que dans ce rapport.
    expect(readFileSync(join(summary.reportDir!, "comptes.csv"), "utf8")).not.toContain(director.motDePasseTemporaire);
    expect(readFileSync(join(summary.reportDir!, "resume.json"), "utf8")).not.toContain(director.motDePasseTemporaire);
  });

  it("la simulation annonce les remplacements sans rien changer ni produire de mot de passe", async () => {
    const out = mkdtempSync(join(tmpdir(), "revue-rot-dry-"));
    const { summary } = await runLot0Provision(admin.db, admin.auth, { apply: false, syncExistingPasswords: true, acceptCritical: false, outDir: out });
    expect(summary.passwordsRotated).toBeGreaterThan(0);
    expect(await signIn("admin_alfajr@alfajr.local", DEMO_PASSWORDS.director)).not.toBeNull();
    expect(() => readFileSync(join(summary.reportDir!, "mots-de-passe-temporaires.csv"))).toThrow();
    const comptes = readCsv(join(summary.reportDir!, "comptes.csv"));
    expect(comptes.find((r) => r.appUserId === "u1")?.motDePasse).toBe("à remplacer");
  });

  it("la relance ne régénère pas les mots de passe déjà remplacés", async () => {
    const out = mkdtempSync(join(tmpdir(), "revue-rot-rerun-"));
    const first = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: out });
    const temp = readCsv(join(first.summary.reportDir!, "mots-de-passe-temporaires.csv")).find((r) => r.appUserId === "u1")!.motDePasseTemporaire;
    const second = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    expect(second.summary.passwordsRotated).toBe(0);
    expect(await signIn("admin_alfajr@alfajr.local", temp)).not.toBeNull();
  });

  it("option explicite --rotate-passwords=weak : faibles et bureau remplacés, mot de passe solide d'une famille conservé", async () => {
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: mkdtempSync(join(tmpdir(), "revue-weak-")), rotatePasswords: "weak" });
    expect(await signIn("mohammed_alami@alfajr.local", normalizeAuthPassword("123"))).toBeNull();
    expect(await signIn("admin_alfajr@alfajr.local", DEMO_PASSWORDS.director)).toBeNull();
    expect(await signIn("parent_manuel@alfajr.local", DEMO_PASSWORDS.manualParent)).not.toBeNull();
  });

  it("option explicite --rotate-passwords=none : comportement historique (données de démonstration)", async () => {
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    expect(await signIn("mohammed_alami@alfajr.local", normalizeAuthPassword("123"))).not.toBeNull();
  });
});

describe("R-02 relance du provisionnement : un lien retiré par l'école revient", () => {
  it("un lien parent/enfant retiré après validation n'est pas rétabli par une relance (ni par la migration)", async () => {
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    const before = await appUser("u_manual_parent");
    expect(before.linkedStudentIds).toEqual(["S-106"]); // « LIÉ — à retirer si erroné »

    // L'école retire le lien (comme saveAppUser du Lot 0 : appUsers + authLinks).
    await admin.db.collection("appUsers").doc("u_manual_parent").update({ linkedStudentIds: [] });
    await admin.db.collection("authLinks").doc(before.authUid).update({ linkedStudentIds: [] });

    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    expect((await admin.db.collection("authLinks").doc(before.authUid).get()).data()?.linkedStudentIds).toEqual([]);
    expect((await appUser("u_manual_parent")).linkedStudentIds).toEqual([]);

    await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    expect((await admin.db.doc(`schools/alfajr/members/${before.authUid}`).get()).data()?.linkedStudentIds).toEqual([]);
  });
});

describe("R-03 compte Firebase Auth préexistant adopté par le script", () => {
  it("le réalignement du mot de passe (défaut) révoque les sessions antérieures", async () => {
    const squatter = await signIn("youssef_baqali@alfajr.local", "ancien-mot-de-passe");
    expect(squatter).not.toBeNull();
    await new Promise((r) => setTimeout(r, 1100)); // les dates de validité sont à la seconde
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    await expect(admin.auth.verifyIdToken(squatter!.idToken, true)).rejects.toMatchObject({ code: "auth/id-token-revoked" });
  });

  it("même sans réalignement (--no-sync-passwords), les sessions ouvertes avant le rattachement sont révoquées", async () => {
    // Compte créé par l'ancien client (ou par un tiers via l'inscription libre).
    const squatter = await signIn("youssef_baqali@alfajr.local", "ancien-mot-de-passe");
    expect(squatter).not.toBeNull();
    await new Promise((r) => setTimeout(r, 1100)); // les dates de validité sont à la seconde
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: false, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    // L'émulateur Auth n'applique pas la révocation à l'échange du jeton de
    // rafraîchissement (la production, si) : on vérifie la date de validité
    // des jetons, telle que contrôlée par Firebase (checkRevoked).
    await expect(admin.auth.verifyIdToken(squatter!.idToken, true)).rejects.toMatchObject({ code: "auth/id-token-revoked" });
    void refreshStillWorks; // conservé pour documenter la limite de l'émulateur
  });
});

describe("R-04 erreur partielle pendant le provisionnement", () => {
  it("une erreur sur un compte n'interrompt pas les autres ; elle est comptée et rapportée", async () => {
    const out = mkdtempSync(join(tmpdir(), "revue-partial-"));
    const auth = flakyAuth(admin.auth, ["hamza_fassi@alfajr.local"]);
    const { summary } = await runLot0Provision(admin.db, auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: out, rotatePasswords: "none" });
    expect(summary.failures).toBe(1);
    const comptes = readCsv(join(summary.reportDir!, "comptes.csv"));
    expect(comptes.find((r) => r.appUserId === "t_t3")?.auth).toMatch(/^ÉCHEC/);
    // Les comptes suivants ont bien été traités.
    expect(typeof (await appUser("t_t4")).authUid).toBe("string");
    expect((await appUser("t_t3")).password).toBe("123"); // inchangé : sera repris à la relance

    // La relance termine le travail.
    const again = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    expect(again.summary.failures).toBe(0);
    expect(typeof (await appUser("t_t3")).authUid).toBe("string");
  });

  it("la migration interrompue au milieu des comptes se termine à la relance, sans doublon", async () => {
    const auth = flakyAuth(admin.auth, ["omar_idrissi@alfajr.local"]);
    const first = await runMigration(admin.db, auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    expect(first.summary.accounts.pendingAuth).toBe(1);
    expect(first.summary.critical).toBe(true); // échec signalé comme critique
    const second = await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    expect(second.summary.accounts.pendingAuth).toBe(0);
    const members = await admin.db.collection("schools/alfajr/members").get();
    expect(members.size).toBe(Object.keys(legacyFixture().collections.appUsers).length);
  });
});

describe("R-05 relance de la migration pendant que la nouvelle application écrit", () => {
  it("un document cible apparu après l'inventaire n'est jamais écrasé par la copie racine", async () => {
    await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    const path = "schools/alfajr/attendance";
    // Saisie faite dans la nouvelle application après la bascule.
    await admin.db.doc(`${path}/a_2026-10-17_S-101`).update({ status: "غائب", editedAfterSwitch: true });
    // Relance (contrôle d'écart) : l'inventaire de la cible est périmé (course).
    const { summary } = await runMigration(staleListingDb(admin.db, path), admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    const after = (await admin.db.doc(`${path}/a_2026-10-17_S-101`).get()).data()!;
    expect(after.status).toBe("غائب");
    expect(after.editedAfterSwitch).toBe(true);
    expect(summary.anomalies.WRITE_FAILED ?? 0).toBe(0);
  });
});

describe("R-08 comptes falsifiés avant le Lot 0 (appUsers était modifiable par tout compte connecté)", () => {
  it("un authUid planté dans appUsers ne rattache pas le compte d'un tiers au rôle de directeur", async () => {
    // Le tiers crée son compte (inscription libre) puis écrit son uid dans appUsers/u1.
    const pirate = await admin.auth.createUser({ email: "pirate@example.invalid", password: "pirate-2026" });
    await admin.db.collection("appUsers").doc("u1").update({ authUid: pirate.uid });
    const out = mkdtempSync(join(tmpdir(), "revue-planted-"));
    const dry = await runLot0Provision(admin.db, admin.auth, { apply: false, syncExistingPasswords: true, acceptCritical: false, outDir: out });
    expect(dry.plan.anomalies.find((a) => a.code === "UNTRUSTED_AUTH_UID")).toMatchObject({ severity: "critique", appUserId: "u1" });
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: true, outDir: out });
    expect((await admin.db.collection("authLinks").doc(pirate.uid).get()).exists).toBe(false);
    const u1 = await appUser("u1");
    expect(u1.authUid).not.toBe(pirate.uid);
    expect(u1.authEmail).toBe("admin_alfajr@alfajr.local");
  });

  it("des liens plantés dans appUsers avant le premier provisionnement sont ignorés et signalés", async () => {
    await admin.db.collection("appUsers").doc("p_S-101").update({ linkedStudentIds: ["S-103", "S-104", "S-105"], linkedTeacherId: "t1" });
    const { plan } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: mkdtempSync(join(tmpdir(), "revue-links-")) });
    const p = await appUser("p_S-101");
    expect(p.linkedStudentIds.sort()).toEqual(["S-101", "S-102"]);
    expect((await admin.db.collection("authLinks").doc(p.authUid).get()).data()?.linkedStudentIds.sort()).toEqual(["S-101", "S-102"]);
    expect(plan.anomalies.find((a) => a.code === "UNEXPECTED_LINK_FIELDS")?.appUserId).toBe("p_S-101");
  });

  it("un mot de passe planté (non faible) dans un compte enseignant ne devient pas son mot de passe", async () => {
    await admin.db.collection("appUsers").doc("t_t1").update({ password: "Mot-de-passe-pirate-2026" });
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: mkdtempSync(join(tmpdir(), "revue-pw-")) });
    expect(await signIn("youssef_baqali@alfajr.local", "Mot-de-passe-pirate-2026")).toBeNull();
  });

  it("tout compte du bureau autre que u1 est listé pour vérification par l'école", async () => {
    await admin.db.collection("appUsers").doc("u_intrus").set({ username: "gestion", fullName: "إدارة", role: "مدير", password: "Intrus-2026-xyz", isActive: true });
    const { plan } = await runLot0Provision(admin.db, admin.auth, { apply: false, syncExistingPasswords: true, acceptCritical: false, outDir: null });
    const review = plan.anomalies.filter((a) => a.code === "PRIVILEGED_ACCOUNT").map((a) => a.appUserId).sort();
    expect(review).toEqual(["t_t2", "u_intrus"]);
  });
});

describe("R-09 divergence appUsers / authLinks (le lien fait foi, D12)", () => {
  it("un compte suspendu dans son lien n'est pas réactivé par la relance ni par la migration", async () => {
    await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    const parent = await appUser("p_S-101");
    // Suspension appliquée au lien (règles), mais l'écriture d'appUsers a échoué.
    await admin.db.collection("authLinks").doc(parent.authUid).update({ isActive: false });
    await admin.auth.updateUser(parent.authUid, { disabled: true });

    const { plan } = await runLot0Provision(admin.db, admin.auth, { apply: true, syncExistingPasswords: true, acceptCritical: false, outDir: null, rotatePasswords: "none" });
    expect(plan.anomalies.find((a) => a.code === "AUTHLINK_MISMATCH")?.appUserId).toBe("p_S-101");
    expect((await admin.db.collection("authLinks").doc(parent.authUid).get()).data()?.isActive).toBe(false);
    expect((await admin.auth.getUser(parent.authUid)).disabled).toBe(true);

    await runMigration(admin.db, admin.auth, { schoolId: "alfajr", apply: true, outDir: null, rotatePasswords: "none" });
    expect((await admin.db.doc(`schools/alfajr/members/${parent.authUid}`).get()).data()?.isActive).toBe(false);
  });
});
