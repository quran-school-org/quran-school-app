/**
 * Tests des règles Firestore du Lot 0 (structure actuelle, collections à la racine).
 *
 * Couvre : visiteur non connecté, compte Auth créé par un inconnu (sans lien),
 * lien inactif, chacun des 9 rôles (matrice collection × action), portée des
 * comptes famille (linkedStudentIds) et tentatives d'auto-promotion.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

type Role =
  | "مدير" | "إداري" | "مؤطر" | "مدرس" | "متطوع" | "عامل نظافة / صيانة" | "أخرى" | "طالب" | "ولي أمر";

const ROLES: Role[] = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر"];
const OFFICE: Role[] = ["مدير", "إداري"];
const EDUCATORS: Role[] = ["مدير", "إداري", "مؤطر", "مدرس"];
const COORDINATORS: Role[] = ["مدير", "إداري", "مؤطر"];
const STAFF: Role[] = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى"];

const uidFor = (role: Role) => `uid_${ROLES.indexOf(role)}`;
const appUserFor = (role: Role) => `app_${ROLES.indexOf(role)}`;

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-quran-school",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const role of ROLES) {
      const linked = role === "ولي أمر" ? ["S-101", "S-102"] : role === "طالب" ? ["S-101"] : [];
      await setDoc(doc(db, "authLinks", uidFor(role)), {
        appUserId: appUserFor(role),
        role,
        isActive: true,
        linkedStudentIds: linked,
      });
      await setDoc(doc(db, "appUsers", appUserFor(role)), {
        username: `user${ROLES.indexOf(role)}`,
        fullName: `Utilisateur ${role}`,
        role,
        isActive: true,
        mustChangePassword: true,
      });
    }
    // Lien inactif (compte suspendu / archivé)
    await setDoc(doc(db, "authLinks", "uid_suspendu"), { appUserId: "app_suspendu", role: "مدير", isActive: false });
    await setDoc(doc(db, "appUsers", "app_suspendu"), { username: "suspendu", role: "مدير", isActive: false });

    await setDoc(doc(db, "settings", "system"), { associationName: "Association de test" });
    for (const id of ["S-101", "S-102", "S-200"]) {
      await setDoc(doc(db, "students", id), { fullName: `Élève ${id}`, classId: "c1" });
      await setDoc(doc(db, "attendance", `a_2026-10-01_${id}`), { studentId: id, date: "2026-10-01", status: "حاضر" });
      await setDoc(doc(db, "grades", `g_${id}`), { studentId: id, overallGrade: "جيد" });
      await setDoc(doc(db, "dailyProgress", `dp_${id}`), { studentId: id, rating: "جيد" });
      await setDoc(doc(db, "payments", `p_init_${id}`), { studentId: id, amount: 100, status: "غير مدفوع" });
    }
    await setDoc(doc(db, "teachers", "t1"), { fullName: "Enseignant", monthlySalary: 3000, cinNumber: "X0000" });
    await setDoc(doc(db, "classes", "c1"), { name: "حلقة", teacherId: "t1" });
    await setDoc(doc(db, "otherIncomes", "i1"), { amount: 10 });
    await setDoc(doc(db, "expenses", "e1"), { amount: 10 });
    await setDoc(doc(db, "salaryPayments", "sal1"), { amount: 3000, personId: "t1" });
    await setDoc(doc(db, "activities", "act1"), { title: "Sortie" });
    await setDoc(doc(db, "activityParticipants", "part1"), { activityId: "act1", fullName: "Élève", medicalNotes: "…" });
    await setDoc(doc(db, "activityExpenses", "ae1"), { activityId: "act1", amount: 50 });
    await setDoc(doc(db, "notifications", "n1"), { title: "Info", isRead: false });
  });
});

const dbAs = (uid: string): Firestore => env.authenticatedContext(uid).firestore();
const dbRole = (role: Role): Firestore => dbAs(uidFor(role));

const ALL_COLLECTIONS = [
  "settings", "appUsers", "authLinks", "students", "teachers", "classes", "attendance", "grades",
  "dailyProgress", "payments", "otherIncomes", "expenses", "salaryPayments", "activities",
  "activityParticipants", "activityExpenses", "notifications",
];

describe("visiteur non connecté et compte Auth d'un inconnu", () => {
  it("le visiteur non connecté ne lit aucune collection", async () => {
    const anon = env.unauthenticatedContext().firestore();
    for (const col of ALL_COLLECTIONS) {
      await assertFails(getDocs(collection(anon, col)));
    }
    await assertFails(getDoc(doc(anon, "settings", "system")));
    await assertFails(getDoc(doc(anon, "appUsers", appUserFor("مدير"))));
  });

  it("un compte Auth sans lien n'a accès à rien, ni en lecture ni en écriture", async () => {
    const stranger = dbAs("uid_inconnu");
    for (const col of ALL_COLLECTIONS) {
      await assertFails(getDocs(collection(stranger, col)));
      await assertFails(setDoc(doc(stranger, col, "x1"), { a: 1 }));
    }
    await assertFails(getDoc(doc(stranger, "settings", "system")));
    await assertFails(getDoc(doc(stranger, "students", "S-101")));
  });

  it("un inconnu ne peut pas se créer de lien d'autorisation", async () => {
    const stranger = dbAs("uid_inconnu");
    await assertFails(setDoc(doc(stranger, "authLinks", "uid_inconnu"), { appUserId: "x", role: "مدير", isActive: true }));
    await assertFails(setDoc(doc(stranger, "appUsers", "x"), { username: "pirate", role: "مدير", isActive: true }));
  });

  it("un lien inactif (compte suspendu) n'a accès à rien sauf à son propre lien", async () => {
    const suspended = dbAs("uid_suspendu");
    await assertSucceeds(getDoc(doc(suspended, "authLinks", "uid_suspendu")));
    await assertFails(getDoc(doc(suspended, "settings", "system")));
    await assertFails(getDoc(doc(suspended, "appUsers", "app_suspendu")));
    await assertFails(getDocs(collection(suspended, "students")));
    await assertFails(getDocs(collection(suspended, "payments")));
  });
});

/** Matrice attendue : pour chaque collection, rôles autorisés à lire (liste) et à écrire. */
const MATRIX: Record<string, { list: Role[]; create: Role[]; remove: Role[]; docId: string }> = {
  settings: { list: ROLES, create: ["مدير"], remove: ["مدير"], docId: "system" },
  students: { list: EDUCATORS, create: EDUCATORS, remove: OFFICE, docId: "S-300" },
  teachers: { list: EDUCATORS, create: OFFICE, remove: OFFICE, docId: "t9" },
  classes: { list: ROLES, create: COORDINATORS, remove: OFFICE, docId: "c9" },
  attendance: { list: EDUCATORS, create: EDUCATORS, remove: OFFICE, docId: "a_new" },
  grades: { list: EDUCATORS, create: EDUCATORS, remove: OFFICE, docId: "g_new" },
  dailyProgress: { list: EDUCATORS, create: EDUCATORS, remove: EDUCATORS, docId: "dp_new" },
  payments: { list: OFFICE, create: OFFICE, remove: OFFICE, docId: "p_new" },
  otherIncomes: { list: OFFICE, create: OFFICE, remove: OFFICE, docId: "i9" },
  expenses: { list: OFFICE, create: OFFICE, remove: OFFICE, docId: "e9" },
  salaryPayments: { list: OFFICE, create: OFFICE, remove: OFFICE, docId: "sal9" },
  activities: { list: ROLES, create: EDUCATORS, remove: OFFICE, docId: "act9" },
  activityParticipants: { list: [...EDUCATORS, "متطوع"], create: EDUCATORS, remove: EDUCATORS, docId: "part9" },
  activityExpenses: { list: EDUCATORS, create: EDUCATORS, remove: EDUCATORS, docId: "ae9" },
  notifications: { list: STAFF, create: ROLES, remove: OFFICE, docId: "n9" },
  appUsers: { list: OFFICE, create: ["مدير"], remove: ["مدير"], docId: "u_new" },
  authLinks: { list: ["مدير"], create: ["مدير"], remove: ["مدير"], docId: "uid_new" },
};

const samplePayload = (col: string): Record<string, unknown> => {
  if (col === "authLinks") return { appUserId: "u_new", role: "مدرس", isActive: true, linkedStudentIds: [] };
  if (col === "appUsers") return { username: "nouveau", fullName: "Nouveau", role: "مدرس", isActive: true };
  if (["attendance", "grades", "dailyProgress", "payments"].includes(col)) return { studentId: "S-200", value: 1 };
  return { title: "valeur", value: 1 };
};

describe("matrice rôle × collection × action", () => {
  for (const [col, exp] of Object.entries(MATRIX)) {
    for (const role of ROLES) {
      it(`${col} — ${role}`, async () => {
        const db = dbRole(role);
        const listing = getDocs(collection(db, col));
        if (exp.list.includes(role)) await assertSucceeds(listing);
        else await assertFails(listing);

        const write = setDoc(doc(db, col, exp.docId), samplePayload(col));
        if (exp.create.includes(role)) await assertSucceeds(write);
        else await assertFails(write);

        // Suppression d'un document existant (créé sans règles).
        await env.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(doc(ctx.firestore(), col, `${exp.docId}_del`), samplePayload(col));
        });
        const del = deleteDoc(doc(db, col, `${exp.docId}_del`));
        if (exp.remove.includes(role)) await assertSucceeds(del);
        else await assertFails(del);
      });
    }
  }
});

describe("comptes famille : accès limité aux élèves liés", () => {
  it("le parent lit ses enfants liés, pas les autres élèves", async () => {
    const db = dbRole("ولي أمر");
    await assertSucceeds(getDoc(doc(db, "students", "S-101")));
    await assertSucceeds(getDoc(doc(db, "students", "S-102")));
    await assertFails(getDoc(doc(db, "students", "S-200")));
    await assertFails(getDocs(collection(db, "students")));
    await assertFails(getDocs(query(collection(db, "students"), where(documentId(), "in", ["S-101", "S-200"]))));
  });

  it("l'élève ne lit que son propre dossier", async () => {
    const db = dbRole("طالب");
    await assertSucceeds(getDoc(doc(db, "students", "S-101")));
    await assertFails(getDoc(doc(db, "students", "S-102")));
  });

  it("requêtes filtrées sur studentId : autorisées pour les enfants liés uniquement", async () => {
    const db = dbRole("ولي أمر");
    for (const col of ["attendance", "grades", "dailyProgress"]) {
      const ok = await assertSucceeds(getDocs(query(collection(db, col), where("studentId", "in", ["S-101", "S-102"]))));
      expect(ok.size, col).toBe(2);
      await assertSucceeds(getDocs(query(collection(db, col), where("studentId", "==", "S-101"))));
      await assertFails(getDocs(query(collection(db, col), where("studentId", "in", ["S-101", "S-200"]))));
      await assertFails(getDocs(query(collection(db, col), where("studentId", "==", "S-200"))));
      await assertFails(getDocs(collection(db, col)));
    }
  });

  it("les finances restent fermées aux familles, même filtrées", async () => {
    const db = dbRole("ولي أمر");
    await assertFails(getDocs(query(collection(db, "payments"), where("studentId", "==", "S-101"))));
    await assertFails(getDoc(doc(db, "payments", "p_init_S-101")));
  });

  it("les familles n'écrivent aucune donnée pédagogique", async () => {
    const db = dbRole("ولي أمر");
    await assertFails(setDoc(doc(db, "attendance", "a_x"), { studentId: "S-101", status: "حاضر" }));
    await assertFails(updateDoc(doc(db, "students", "S-101"), { hizbCount: 60 }));
  });
});

describe("profil et auto-promotion", () => {
  it("chacun lit son propre compte applicatif et son lien, pas ceux des autres", async () => {
    const db = dbRole("مدرس");
    await assertSucceeds(getDoc(doc(db, "appUsers", appUserFor("مدرس"))));
    await assertSucceeds(getDoc(doc(db, "authLinks", uidFor("مدرس"))));
    await assertFails(getDoc(doc(db, "appUsers", appUserFor("مدير"))));
    await assertFails(getDoc(doc(db, "authLinks", uidFor("مدير"))));
  });

  it("un utilisateur peut lever son obligation de changer de mot de passe et mettre à jour lastLogin", async () => {
    const db = dbRole("ولي أمر");
    await assertSucceeds(updateDoc(doc(db, "appUsers", appUserFor("ولي أمر")), { mustChangePassword: false }));
    await assertSucceeds(updateDoc(doc(db, "appUsers", appUserFor("ولي أمر")), { lastLogin: "2026-10-21T10:00:00Z" }));
  });

  it("lastLogin reste modifiable même si mustChangePassword vaut encore true", async () => {
    const db = dbRole("مدرس");
    await assertSucceeds(updateDoc(doc(db, "appUsers", appUserFor("مدرس")), { lastLogin: "2026-10-21T10:00:00Z" }));
  });

  for (const role of ROLES.filter((r) => r !== "مدير")) {
    it(`${role} ne peut pas se promouvoir`, async () => {
      const db = dbRole(role);
      await assertFails(updateDoc(doc(db, "authLinks", uidFor(role)), { role: "مدير" }));
      await assertFails(setDoc(doc(db, "authLinks", uidFor(role)), { appUserId: appUserFor(role), role: "مدير", isActive: true }));
      await assertFails(updateDoc(doc(db, "appUsers", appUserFor(role)), { role: "مدير" }));
      await assertFails(updateDoc(doc(db, "appUsers", appUserFor(role)), { username: "admin_alfajr" }));
      await assertFails(updateDoc(doc(db, "appUsers", appUserFor(role)), { permissions: { finance: { read: true } } }));
      await assertFails(updateDoc(doc(db, "appUsers", appUserFor(role)), { linkedStudentIds: ["S-200"] }));
      await assertFails(updateDoc(doc(db, "authLinks", uidFor(role)), { linkedStudentIds: ["S-200"] }));
      // Ni lien pour un autre compte qu'il contrôlerait.
      await assertFails(setDoc(doc(db, "authLinks", "uid_complice"), { appUserId: "x", role: "مدير", isActive: true }));
    });
  }

  it("personne (pas même le directeur) n'écrit de mot de passe dans Firestore", async () => {
    const director = dbRole("مدير");
    await assertFails(setDoc(doc(director, "appUsers", "u_pw"), { username: "x", role: "مدرس", isActive: true, password: "123" }));
    await assertFails(updateDoc(doc(director, "appUsers", appUserFor("مدرس")), { password: "123" }));
    const self = dbRole("مدرس");
    await assertFails(updateDoc(doc(self, "appUsers", appUserFor("مدرس")), { password: "nouveau" }));
  });

  it("le directeur gère les comptes et les liens des autres", async () => {
    const director = dbRole("مدير");
    await assertSucceeds(updateDoc(doc(director, "authLinks", uidFor("مدرس")), { role: "مؤطر" }));
    await assertSucceeds(updateDoc(doc(director, "appUsers", appUserFor("مدرس")), { role: "مؤطر" }));
    await assertSucceeds(getDocs(collection(director, "authLinks")));
    await assertFails(setDoc(doc(director, "authLinks", "uid_x"), { appUserId: "x", role: "superadmin", isActive: true }));
    await assertFails(deleteDoc(doc(director, "appUsers", "u1")));
  });

  it("un directeur dont le lien est désactivé perd tous ses droits", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "authLinks", uidFor("مدير")), { isActive: false });
    });
    const director = dbRole("مدير");
    await assertFails(getDocs(collection(director, "payments")));
    await assertFails(updateDoc(doc(director, "authLinks", uidFor("مدير")), { isActive: true }));
  });
});
