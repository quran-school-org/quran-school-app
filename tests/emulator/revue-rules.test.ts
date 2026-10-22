/**
 * Revue de sécurité (étape 2) — hypothèses d'attaque contre les règles du Lot 0
 * non couvertes par lot0-rules.test.ts. Les hypothèses « réfutées » prouvent
 * que les règles tiennent ; les « constats » documentent un comportement
 * accepté ou le vecteur d'une faille corrigée ailleurs.
 * Voir docs/revues/REVUE-SECURITE-ETAPE-2.md.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type Firestore } from "firebase/firestore";

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
    const link = async (uid: string, appUserId: string, role: string, extra: Record<string, unknown> = {}) => {
      await setDoc(doc(db, "authLinks", uid), { appUserId, role, isActive: true, ...extra });
      await setDoc(doc(db, "appUsers", appUserId), { username: appUserId, role, isActive: true, authUid: uid });
    };
    await link("parent", "p_S-1", "ولي أمر", { linkedStudentIds: ["S-1"] });
    await link("prof", "t_t1", "مدرس");
    await link("admin", "t_t2", "إداري");
    for (const id of ["S-1", "S-2"]) {
      await setDoc(doc(db, "students", id), { fullName: id });
      await setDoc(doc(db, "attendance", `a_${id}`), { studentId: id });
    }
    await setDoc(doc(db, "teachers", "t1"), { fullName: "prof", monthlySalary: 2500, cinNumber: "XX1" });
  });
});

const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

describe("hypothèses réfutées", () => {
  it("un compte ne modifie ni son authUid, ni ses liens, ni son rôle dans appUsers", async () => {
    await assertFails(updateDoc(doc(as("parent"), "appUsers", "p_S-1"), { authUid: "autre" }));
    await assertFails(updateDoc(doc(as("parent"), "appUsers", "p_S-1"), { linkedStudentIds: ["S-1", "S-2"] }));
    await assertFails(updateDoc(doc(as("parent"), "appUsers", "p_S-1"), { role: "مدير" }));
    await assertFails(setDoc(doc(as("parent"), "authLinks", "parent"), { appUserId: "p_S-1", role: "ولي أمر", isActive: true, linkedStudentIds: ["S-1", "S-2"] }));
  });

  it("le bureau (إداري) n'écrit ni liens d'autorisation ni comptes", async () => {
    await assertFails(setDoc(doc(as("admin"), "authLinks", "admin"), { appUserId: "t_t2", role: "مدير", isActive: true }));
    await assertFails(updateDoc(doc(as("admin"), "appUsers", "t_t2"), { role: "مدير" }));
  });

  it("une requête famille élargie à un enfant non lié est refusée", async () => {
    await assertSucceeds(getDocs(query(collection(as("parent"), "attendance"), where("studentId", "in", ["S-1"]))));
    await assertFails(getDocs(query(collection(as("parent"), "attendance"), where("studentId", "in", ["S-1", "S-2"]))));
    await assertFails(getDoc(doc(as("parent"), "students", "S-2")));
  });

  it("aucune collection hors liste (users, members, usernames, schools…) n'est ouverte", async () => {
    for (const col of ["users", "usernames", "schools", "secrets"]) {
      await assertFails(getDocs(collection(as("admin"), col)));
      await assertFails(setDoc(doc(as("admin"), col, "x"), { a: 1 }));
    }
  });
});

describe("constats confirmés", () => {
  it("vecteur de C-01 : un enseignant peut écrire du HTML dans le nom d'un élève (échappé à l'impression)", async () => {
    await assertSucceeds(updateDoc(doc(as("prof"), "students", "S-1"), { fullName: `<img src=x onerror="alert(1)">` }));
  });

  it("R-06 (connu, D14) : un enseignant lit salaires et CIN du personnel", async () => {
    await assertSucceeds(getDoc(doc(as("prof"), "teachers", "t1")));
  });

  it("R-07 corrigé (D52) : une famille ne crée pas de notification ; le personnel, si", async () => {
    await assertFails(setDoc(doc(as("parent"), "notifications", "n_famille"), { title: "x", message: "y" }));
    await assertSucceeds(setDoc(doc(as("prof"), "notifications", "n_prof"), { title: "x", message: "y" }));
  });
});
