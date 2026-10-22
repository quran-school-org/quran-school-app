/**
 * Revue adversariale du durcissement — règles : compteurs du proxy IA et
 * fiches RH (D42, D43). Hypothèses toutes RÉFUTÉES : ces tests le prouvent.
 * Voir docs/revues/REVUE-SECURITE-DURCISSEMENT.md.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch, type Firestore } from "firebase/firestore";

const A = "alfajr";
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-quran-school", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "schools", A), { name: A });
    await setDoc(doc(db, "schools", A, "members", "dir"), { role: "مدير", isActive: true, schoolId: A });
    await setDoc(doc(db, "schools", A, "members", "prof"), { role: "مدرس", isActive: true, schoolId: A });
    await setDoc(doc(db, "aiQuota", "u_prof_2026-10-22"), { scope: "user", count: 30 });
    await setDoc(doc(db, "aiQuota", "s_alfajr_2026-10-22"), { scope: "school", count: 300 });
    await setDoc(doc(db, "schools", A, "teachers", "t1"), { fullName: "prof", schoolId: A });
    await setDoc(doc(db, "schools", A, "staffPrivate", "t1"), { monthlySalary: 2500, teacherId: "t1", schoolId: A });
  });
});

const as = (uid: string, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, claims).firestore() as unknown as Firestore;

describe("hypothèses réfutées : compteurs aiQuota falsifiés par le client", () => {
  it("aucun compte (enseignant, directeur, super-admin) ne lit, ne remet à zéro ni ne supprime un compteur", async () => {
    for (const db of [as("prof"), as("dir"), as("super", { superAdmin: true })]) {
      await assertFails(getDoc(doc(db, "aiQuota", "u_prof_2026-10-22")));
      await assertFails(getDocs(collection(db, "aiQuota")));
      await assertFails(setDoc(doc(db, "aiQuota", "u_prof_2026-10-22"), { count: 0 }));
      await assertFails(deleteDoc(doc(db, "aiQuota", "s_alfajr_2026-10-22")));
      await assertFails(setDoc(doc(db, "aiQuota", "u_prof_2026-10-23"), { count: -1000 }));
    }
  });

  it("un compteur placé sous l'école n'est pas une issue : sous-collection non prévue, fermée", async () => {
    await assertFails(setDoc(doc(as("dir"), "schools", A, "aiQuota", "u_prof_2026-10-22"), { count: 0, schoolId: A }));
  });
});

describe("hypothèses réfutées : fiches RH (staffPrivate)", () => {
  it("un enseignant ne glisse pas de champ RH dans un lot avec une écriture permise, ni ne crée de fiche RH", async () => {
    const db = as("prof");
    const batch = writeBatch(db);
    batch.set(doc(db, "schools", A, "students", "S-9"), { fullName: "x", schoolId: A });
    batch.set(doc(db, "schools", A, "staffPrivate", "t1"), { monthlySalary: 99999, teacherId: "t1", schoolId: A });
    await assertFails(batch.commit());
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t_moi"), { monthlySalary: 1, teacherId: "t_moi", schoolId: A }));
    await assertFails(setDoc(doc(db, "schools", A, "teachers", "t1"), { fullName: "prof", schoolId: A }, { merge: true }));
  });

  it("le directeur ne peut pas stocker un mot de passe ou un champ libre dans la fiche RH (liste fermée)", async () => {
    const db = as("dir");
    await assertSucceeds(setDoc(doc(db, "schools", A, "staffPrivate", "t1"), { monthlySalary: 2600, teacherId: "t1", schoolId: A }, { merge: true }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t1"), { notes: "x", schoolId: A }, { merge: true }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t1"), { password: "x", schoolId: A }, { merge: true }));
  });
});

describe("constat accepté (faible) : taille des photos non bornée par les règles", () => {
  it("un enseignant peut écrire une photo base64 de ~900 Ko (le filet de recompression D51 est côté client)", async () => {
    const photo = `data:image/jpeg;base64,${"A".repeat(900_000)}`;
    await assertSucceeds(setDoc(doc(as("prof"), "schools", A, "students", "S-photo"), { fullName: "x", photo, schoolId: A }));
  });
});
