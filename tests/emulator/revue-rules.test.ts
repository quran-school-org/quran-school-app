/**
 * Revue de sécurité (étape 2) — hypothèses d'attaque contre les règles
 * multi-écoles qui n'étaient pas couvertes par tenant-rules.test.ts.
 * Toutes ont été RÉFUTÉES (les règles tiennent) : ces tests le prouvent et
 * servent de non-régression. Voir docs/revues/REVUE-SECURITE-ETAPE-2.md (§ R).
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, type Firestore } from "firebase/firestore";

const A = "alfajr";
const B = "annour";
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
    for (const s of [A, B]) {
      await setDoc(doc(db, "schools", s), { name: s, status: "active" });
      for (const id of ["S-1", "S-2"]) {
        await setDoc(doc(db, "schools", s, "students", id), { fullName: `${s} ${id}`, schoolId: s });
        for (const col of ["attendance", "grades", "dailyProgress", "payments"]) {
          await setDoc(doc(db, "schools", s, col, `${col}_${id}`), { studentId: id, schoolId: s });
        }
      }
      // Fiche scindée (D42) : partie publique et fiche RH.
      await setDoc(doc(db, "schools", s, "teachers", "t1"), { fullName: "prof", schoolId: s });
      await setDoc(doc(db, "schools", s, "staffPrivate", "t1"), { monthlySalary: 2500, cinNumber: "XX1", teacherId: "t1", schoolId: s });
    }
    // Parent de A lié à S-1 ; ses liens citent aussi un identifiant qui n'existe que dans B.
    await setDoc(doc(db, "schools", A, "members", "parent"), { role: "ولي أمر", isActive: true, linkedStudentIds: ["S-1"], schoolId: A });
    await setDoc(doc(db, "schools", A, "members", "prof"), { role: "مدرس", isActive: true, schoolId: A });
    await setDoc(doc(db, "schools", A, "members", "admin"), { role: "إداري", isActive: true, schoolId: A });
    await setDoc(doc(db, "schools", A, "members", "benevole"), { role: "متطوع", isActive: true, schoolId: A });
    await setDoc(doc(db, "users", "parent"), { username: "parent", schoolIds: [A] });
  });
});

const as = (uid: string, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, claims).firestore() as unknown as Firestore;

describe("hypothèses réfutées : écritures partielles et schoolId", () => {
  it("un update qui retire le champ schoolId est refusé", async () => {
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "students", "S-1"), { schoolId: deleteField() }));
  });

  it("un update qui remplace schoolId par celui d'une autre école est refusé", async () => {
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "students", "S-1"), { schoolId: B }));
  });

  it("un lot (batch) mêlant une écriture permise et une écriture dans une autre école échoue en entier", async () => {
    const db = as("prof");
    const batch = writeBatch(db);
    batch.update(doc(db, "schools", A, "students", "S-1"), { notes: "ok" });
    batch.set(doc(db, "schools", B, "students", "S-1"), { fullName: "pirate", schoolId: B });
    await assertFails(batch.commit());
    await assertSucceeds(updateDoc(doc(db, "schools", A, "students", "S-1"), { notes: "ok" }));
  });

  it("une sous-collection non prévue sous un document de l'école est fermée", async () => {
    await assertFails(setDoc(doc(as("admin"), "schools", A, "students", "S-1", "prive", "x"), { schoolId: A }));
    await assertFails(getDocs(collection(as("admin"), "schools", A, "students", "S-1", "prive")));
  });
});

describe("hypothèses réfutées : familles", () => {
  it("un parent ne lit pas la fiche de même identifiant dans une autre école", async () => {
    await assertSucceeds(getDoc(doc(as("parent"), "schools", A, "students", "S-1")));
    await assertFails(getDoc(doc(as("parent"), "schools", B, "students", "S-1")));
    await assertFails(getDocs(query(collection(as("parent"), "schools", B, "payments"), where("studentId", "in", ["S-1"]))));
  });

  it("une requête `in` qui glisse un enfant non lié est refusée en entier", async () => {
    await assertSucceeds(getDocs(query(collection(as("parent"), "schools", A, "attendance"), where("studentId", "in", ["S-1"]))));
    await assertFails(getDocs(query(collection(as("parent"), "schools", A, "attendance"), where("studentId", "in", ["S-1", "S-2"]))));
    await assertFails(getDocs(query(collection(as("parent"), "schools", A, "payments"), where("studentId", "==", "S-2"))));
    await assertFails(getDocs(collection(as("parent"), "schools", A, "grades")));
  });

  it("un parent ne s'ajoute pas d'enfant ni ne change de rôle via son appartenance ou son profil", async () => {
    await assertFails(updateDoc(doc(as("parent"), "schools", A, "members", "parent"), { linkedStudentIds: ["S-1", "S-2"] }));
    await assertFails(updateDoc(doc(as("parent"), "schools", A, "members", "parent"), { role: "مدير" }));
    await assertFails(updateDoc(doc(as("parent"), "schools", A, "members", "parent"), { isActive: true, schoolId: B }));
    await assertFails(updateDoc(doc(as("parent"), "users", "parent"), { schoolIds: [A, B] }));
    await assertFails(updateDoc(doc(as("parent"), "users", "parent"), { lastSchoolId: B }));
    await assertFails(setDoc(doc(as("parent"), "schools", B, "members", "parent"), { role: "ولي أمر", isActive: true, schoolId: B }));
  });

  it("un parent ne lit ni les notifications, ni le personnel, ni les membres", async () => {
    await assertFails(getDocs(collection(as("parent"), "schools", A, "notifications")));
    await assertFails(getDocs(collection(as("parent"), "schools", A, "teachers")));
    await assertFails(getDocs(collection(as("parent"), "schools", A, "members")));
  });
});

describe("hypothèses réfutées : personnel", () => {
  it("un enseignant n'écrit ni ne lit les finances, ni les paramètres", async () => {
    for (const col of ["payments", "otherIncomes", "expenses", "salaryPayments"]) {
      await assertFails(getDocs(collection(as("prof"), "schools", A, col)));
      await assertFails(setDoc(doc(as("prof"), "schools", A, col, "x"), { amount: 1, schoolId: A }));
    }
    await assertFails(setDoc(doc(as("prof"), "schools", A, "settings", "system"), { associationName: "x", schoolId: A }));
  });

  it("un bénévole ne lit aucun dossier d'élève ni le personnel", async () => {
    await assertFails(getDoc(doc(as("benevole"), "schools", A, "students", "S-1")));
    await assertFails(getDocs(collection(as("benevole"), "schools", A, "teachers")));
  });

  it("le registre des noms d'utilisateur n'est pas énumérable", async () => {
    await assertFails(getDocs(collection(as("admin"), "usernames")));
    await assertFails(getDoc(doc(as("admin"), "usernames", "parent")));
  });

  it("un claim forgé côté client (superAdmin dans un jeton non signé par Firebase) n'est pas réalisable : seul l'Admin SDK pose les claims", async () => {
    // Le jeton de test porte le claim : on vérifie seulement qu'un super-admin
    // ne lit toujours pas les données d'une école sans appartenance.
    await assertFails(getDocs(collection(as("super", { superAdmin: true }), "schools", A, "students")));
  });
});

describe("R-06 corrigé (D42) : fiches RH du personnel", () => {
  it("un enseignant lit la fiche publique, sans salaire ni CIN, mais pas la fiche RH", async () => {
    const snap = await assertSucceeds(getDoc(doc(as("prof"), "schools", A, "teachers", "t1")));
    if (snap.data()?.monthlySalary !== undefined || snap.data()?.cinNumber !== undefined) throw new Error("champ RH dans la fiche publique");
    await assertFails(getDoc(doc(as("prof"), "schools", A, "staffPrivate", "t1")));
    await assertFails(getDocs(collection(as("prof"), "schools", A, "staffPrivate")));
  });

  it("le bureau lit la fiche RH de son école, pas celle d'une autre", async () => {
    const snap = await assertSucceeds(getDoc(doc(as("admin"), "schools", A, "staffPrivate", "t1")));
    if (snap.data()?.monthlySalary !== 2500) throw new Error("donnée attendue");
    await assertFails(getDoc(doc(as("admin"), "schools", B, "staffPrivate", "t1")));
  });
});

describe("R-07 corrigé (D65) : notifications réservées au personnel", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "schools", A, "notifications", "n_1"), { title: "t", message: "m", type: "إداري", isRead: false, audience: "staff", schoolId: A });
    });
  });

  it("une famille (parent, élève) ne crée ni ne modifie aucune notification", async () => {
    await assertFails(setDoc(doc(as("parent"), "schools", A, "notifications", "n_famille"), { title: "x", message: "y", schoolId: A }));
    await assertFails(setDoc(doc(as("parent"), "schools", A, "notifications", "n_1"), { isRead: true, schoolId: A }, { merge: true }));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "schools", A, "members", "eleve"), { role: "طالب", isActive: true, linkedStudentIds: ["S-1"], schoolId: A });
    });
    await assertFails(setDoc(doc(as("eleve"), "schools", A, "notifications", "n_eleve"), { title: "x", message: "y", schoolId: A }));
  });

  it("le personnel crée une notification ; hors bureau, il ne peut que la marquer comme lue pour lui-même (D85)", async () => {
    await assertSucceeds(setDoc(doc(as("prof"), "schools", A, "notifications", "n_prof"), { title: "x", message: "y", isRead: false, audience: "educators", schoolId: A }));
    await assertSucceeds(updateDoc(doc(as("benevole"), "schools", A, "notifications", "n_1"), { readBy: arrayUnion("benevole") }));
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { message: "payez sur le compte X" }));
    await assertFails(setDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { title: "faux", message: "faux", isRead: false, schoolId: A }));
    // Le « lu » commun à tous n'est plus modifiable hors bureau, ni le « lu » d'un autre compte.
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { isRead: true }));
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { readBy: arrayUnion("autre") }));
    await assertFails(updateDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { readBy: ["prof"] }));
    await assertSucceeds(updateDoc(doc(as("prof"), "schools", A, "notifications", "n_1"), { readBy: arrayUnion("prof") }));
    await assertSucceeds(updateDoc(doc(as("admin"), "schools", A, "notifications", "n_1"), { message: "corrigé" }));
  });

  it("une autre école ne crée pas de notification chez A, même avec le bon schoolId", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "schools", B, "members", "prof_b"), { role: "مدرس", isActive: true, schoolId: B });
    });
    await assertFails(setDoc(doc(as("prof_b"), "schools", A, "notifications", "n_b"), { title: "x", message: "y", schoolId: A }));
  });
});
