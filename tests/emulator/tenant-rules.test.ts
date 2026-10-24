/**
 * Règles Firestore multi-écoles : matrice rôle × collection × action dans une
 * école, isolation entre deux écoles, profils globaux, registre des noms
 * d'utilisateur, super-admin, racine fermée, auto-promotion.
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
  deleteField,
  doc,
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

const A = "alfajr";
const B = "annour";
const uidFor = (role: Role) => `uid_${ROLES.indexOf(role)}`;
const COLLECTIONS = [
  "students", "teachers", "classes", "attendance", "grades", "dailyProgress", "payments", "otherIncomes",
  "expenses", "salaryPayments", "activities", "activityParticipants", "activityExpenses", "notifications",
  "staffPrivate",
];

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

async function seedSchool(db: Firestore, s: string) {
  await setDoc(doc(db, "schools", s), { name: `École ${s}`, status: "active" });
  await setDoc(doc(db, "schools", s, "settings", "system"), { associationName: `École ${s}`, schoolId: s });
  for (const id of ["S-101", "S-102", "S-200"]) {
    await setDoc(doc(db, "schools", s, "students", id), { fullName: `Élève ${id}`, classId: "c1", schoolId: s });
    for (const col of ["attendance", "grades", "dailyProgress", "payments"]) {
      await setDoc(doc(db, "schools", s, col, `${col}_${id}`), { studentId: id, schoolId: s });
    }
  }
  await setDoc(doc(db, "schools", s, "staffPrivate", "teachers_1"), { monthlySalary: 2000, cinNumber: "XX9", teacherId: "teachers_1", schoolId: s });
  for (const col of ["teachers", "classes", "otherIncomes", "expenses", "salaryPayments", "activities", "activityParticipants", "activityExpenses", "notifications"]) {
    await setDoc(doc(db, "schools", s, col, `${col}_1`), { title: "x", schoolId: s });
  }
}

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await seedSchool(db, A);
    await seedSchool(db, B);
    for (const role of ROLES) {
      const linked = role === "ولي أمر" ? ["S-101", "S-102"] : role === "طالب" ? ["S-101"] : [];
      await setDoc(doc(db, "schools", A, "members", uidFor(role)), { role, isActive: true, linkedStudentIds: linked, username: `u${ROLES.indexOf(role)}`, schoolId: A });
      await setDoc(doc(db, "users", uidFor(role)), { username: `u${ROLES.indexOf(role)}`, schoolIds: [A], mustChangePassword: true });
    }
    // Directeur de l'autre école
    await setDoc(doc(db, "schools", B, "members", "uid_dir_b"), { role: "مدير", isActive: true, schoolId: B });
    await setDoc(doc(db, "users", "uid_dir_b"), { username: "dir_b", schoolIds: [B] });
    // Personne présente dans les deux écoles avec des rôles différents
    await setDoc(doc(db, "schools", A, "members", "uid_multi"), { role: "مدرس", isActive: true, schoolId: A });
    await setDoc(doc(db, "schools", B, "members", "uid_multi"), { role: "مدير", isActive: true, schoolId: B });
    await setDoc(doc(db, "users", "uid_multi"), { username: "multi", schoolIds: [A, B], lastSchoolId: A });
    // Membre suspendu
    await setDoc(doc(db, "schools", A, "members", "uid_suspendu"), { role: "مدير", isActive: false, schoolId: A });
    // Anciennes collections racine (avant migration)
    await setDoc(doc(db, "students", "S-101"), { fullName: "ancien" });
    await setDoc(doc(db, "appUsers", "u1"), { username: "admin_alfajr", role: "مدير" });
    await setDoc(doc(db, "usernames", "u0"), { uid: uidFor("مدير") });
  });
});

const dbAs = (uid: string, claims: Record<string, unknown> = {}): Firestore =>
  env.authenticatedContext(uid, claims).firestore() as unknown as Firestore;
const dbRole = (role: Role) => dbAs(uidFor(role));
const payload = (s: string, extra: Record<string, unknown> = {}) => ({ title: "valeur", studentId: "S-200", schoolId: s, ...extra });
/** Contenu d'écriture valide selon la collection (staffPrivate : liste fermée de champs RH). */
const payloadFor = (col: string, s: string) =>
  col === "staffPrivate" ? { monthlySalary: 1500, cinNumber: "XX1", schoolId: s }
  : col === "notifications" ? payload(s, { audience: "staff" }) // destinataires : tout le personnel (D84)
  : payload(s);

describe("accès sans appartenance", () => {
  it("visiteur non connecté : rien", async () => {
    const anon = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(getDoc(doc(anon, "schools", A)));
    await assertFails(getDoc(doc(anon, "schools", A, "settings", "system")));
    for (const col of COLLECTIONS) await assertFails(getDocs(collection(anon, "schools", A, col)));
  });

  it("compte Auth d'un inconnu : rien, et ne peut pas s'ajouter à une école", async () => {
    const db = dbAs("uid_inconnu");
    await assertFails(getDoc(doc(db, "schools", A)));
    await assertFails(getDocs(collection(db, "schools")));
    for (const col of COLLECTIONS) {
      await assertFails(getDocs(collection(db, "schools", A, col)));
      await assertFails(setDoc(doc(db, "schools", A, col, "x"), payload(A)));
    }
    await assertFails(setDoc(doc(db, "schools", A, "members", "uid_inconnu"), { role: "مدير", isActive: true, schoolId: A }));
    await assertFails(setDoc(doc(db, "users", "uid_inconnu"), { username: "pirate", schoolIds: [A] }));
    await assertFails(setDoc(doc(db, "schools", "pirate"), { name: "pirate" }));
  });

  it("membre suspendu : rien", async () => {
    const db = dbAs("uid_suspendu");
    await assertFails(getDoc(doc(db, "schools", A)));
    await assertFails(getDocs(collection(db, "schools", A, "students")));
    await assertSucceeds(getDoc(doc(db, "schools", A, "members", "uid_suspendu")));
  });
});

const MATRIX: Record<string, { list: Role[]; write: Role[]; remove: Role[] }> = {
  students: { list: EDUCATORS, write: EDUCATORS, remove: OFFICE },
  teachers: { list: EDUCATORS, write: OFFICE, remove: OFFICE },
  staffPrivate: { list: OFFICE, write: OFFICE, remove: OFFICE },
  classes: { list: ROLES, write: COORDINATORS, remove: OFFICE },
  attendance: { list: EDUCATORS, write: EDUCATORS, remove: OFFICE },
  grades: { list: EDUCATORS, write: EDUCATORS, remove: OFFICE },
  dailyProgress: { list: EDUCATORS, write: EDUCATORS, remove: EDUCATORS },
  payments: { list: OFFICE, write: OFFICE, remove: OFFICE },
  otherIncomes: { list: OFFICE, write: OFFICE, remove: OFFICE },
  expenses: { list: OFFICE, write: OFFICE, remove: OFFICE },
  salaryPayments: { list: OFFICE, write: OFFICE, remove: OFFICE },
  activities: { list: ROLES, write: EDUCATORS, remove: OFFICE },
  activityParticipants: { list: [...EDUCATORS, "متطوع"], write: EDUCATORS, remove: EDUCATORS },
  activityExpenses: { list: EDUCATORS, write: EDUCATORS, remove: EDUCATORS },
  notifications: { list: OFFICE, write: STAFF, remove: OFFICE }, // R-07 (D65) ; liste complète : bureau (D84)
  settings: { list: ROLES, write: ["مدير"], remove: [] },
};

describe("matrice rôle × collection × action (école alfajr)", () => {
  for (const [col, exp] of Object.entries(MATRIX)) {
    for (const role of ROLES) {
      it(`${col} — ${role}`, async () => {
        const db = dbRole(role);
        const list = getDocs(collection(db, "schools", A, col));
        if (exp.list.includes(role)) await assertSucceeds(list);
        else await assertFails(list);

        const id = col === "settings" ? "system" : `${col}_new`;
        const write = setDoc(doc(db, "schools", A, col, id), payloadFor(col, A));
        if (exp.write.includes(role)) await assertSucceeds(write);
        else await assertFails(write);

        await env.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(doc(ctx.firestore() as unknown as Firestore, "schools", A, col, `${col}_del`), payloadFor(col, A));
        });
        const del = deleteDoc(doc(db, "schools", A, col, `${col}_del`));
        if (exp.remove.includes(role)) await assertSucceeds(del);
        else await assertFails(del);
      });
    }
  }
});

describe("fiches RH du personnel (R-06, D42)", () => {
  const RH = ["monthlySalary", "contractType", "cinNumber", "emergencyContact", "birthDate", "address"];

  it("aucun champ RH ne peut être écrit dans la fiche publique teachers", async () => {
    const db = dbRole("مدير");
    for (const field of RH) {
      await assertFails(setDoc(doc(db, "schools", A, "teachers", "t_rh"), { fullName: "x", schoolId: A, [field]: "valeur" }));
    }
    await assertSucceeds(setDoc(doc(db, "schools", A, "teachers", "t_rh"), { fullName: "x", phone: "0600", schoolId: A }));
  });

  it("une fiche publique héritée avec salaire peut être nettoyée (deleteField en fusion)", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "schools", A, "teachers", "t_old"), { fullName: "x", monthlySalary: 2500, schoolId: A });
    });
    const db = dbRole("إداري");
    // Une mise à jour qui garde le champ RH est refusée…
    await assertFails(updateDoc(doc(db, "schools", A, "teachers", "t_old"), { fullName: "y" }));
    // … celle qui le retire passe (c'est ce que fait saveStaffToFirestore).
    await assertSucceeds(setDoc(doc(db, "schools", A, "teachers", "t_old"), { fullName: "y", schoolId: A, monthlySalary: deleteField() }, { merge: true }));
  });

  it("staffPrivate : liste fermée de champs, identifiant cohérent, bon schoolId", async () => {
    const db = dbRole("مدير");
    await assertSucceeds(setDoc(doc(db, "schools", A, "staffPrivate", "t9"), { monthlySalary: 1, contractType: "تطوعي", cinNumber: "X", emergencyContact: "06", birthDate: "1990-01-01", address: "سلا", teacherId: "t9", schoolId: A, updatedAt: "2026-10-22" }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t9"), { fullName: "intrus", schoolId: A }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t9"), { monthlySalary: 1, teacherId: "autre", schoolId: A }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t9"), { monthlySalary: 1, schoolId: B }));
    await assertFails(setDoc(doc(db, "schools", A, "staffPrivate", "t9"), { monthlySalary: 1, password: "x", schoolId: A }));
  });

  it("enseignants, coordinateurs, familles, autre école et super-admin : aucune fiche RH", async () => {
    for (const role of ROLES.filter((r) => !OFFICE.includes(r))) {
      await assertFails(getDoc(doc(dbRole(role), "schools", A, "staffPrivate", "teachers_1")));
    }
    await assertFails(getDoc(doc(dbAs("uid_dir_b"), "schools", A, "staffPrivate", "teachers_1")));
    await assertFails(getDoc(doc(dbAs("uid_super", { superAdmin: true }), "schools", A, "staffPrivate", "teachers_1")));
    await assertFails(getDoc(doc(dbAs("uid_suspendu"), "schools", A, "staffPrivate", "teachers_1")));
    await assertSucceeds(getDoc(doc(dbRole("إداري"), "schools", A, "staffPrivate", "teachers_1")));
  });
});

describe("isolation entre écoles", () => {
  it("le directeur de A ne lit ni n'écrit rien dans B (mêmes identifiants de documents)", async () => {
    const db = dbRole("مدير");
    await assertFails(getDoc(doc(db, "schools", B)));
    await assertFails(getDoc(doc(db, "schools", B, "settings", "system")));
    for (const col of COLLECTIONS) {
      await assertFails(getDocs(collection(db, "schools", B, col)));
      await assertFails(setDoc(doc(db, "schools", B, col, "x"), payload(B)));
    }
    await assertFails(getDoc(doc(db, "schools", B, "students", "S-101")));
    await assertFails(getDocs(collection(db, "schools", B, "members")));
  });

  it("le directeur de B ne voit rien de A", async () => {
    const db = dbAs("uid_dir_b");
    await assertSucceeds(getDocs(collection(db, "schools", B, "payments")));
    await assertFails(getDocs(collection(db, "schools", A, "payments")));
    await assertFails(getDoc(doc(db, "schools", A, "students", "S-101")));
  });

  it("une personne membre des deux écoles a le rôle de chaque école", async () => {
    const db = dbAs("uid_multi");
    await assertFails(getDocs(collection(db, "schools", A, "payments"))); // مدرس dans A
    await assertSucceeds(getDocs(collection(db, "schools", B, "payments"))); // مدير dans B
    await assertSucceeds(getDocs(collection(db, "schools", A, "students")));
  });

  it("une écriture doit porter le schoolId de son école", async () => {
    const db = dbRole("مدير");
    await assertFails(setDoc(doc(db, "schools", A, "students", "S-900"), payload(B)));
    await assertFails(setDoc(doc(db, "schools", A, "students", "S-901"), { fullName: "sans école" }));
    await assertSucceeds(setDoc(doc(db, "schools", A, "students", "S-902"), payload(A)));
    await assertFails(setDoc(doc(db, "schools", A, "students", "S-903"), payload(A, { password: "123" })));
  });
});

describe("familles : enfants liés uniquement", () => {
  it("parent : dossiers, suivi et cotisations de ses enfants, rien d'autre", async () => {
    const db = dbRole("ولي أمر");
    await assertSucceeds(getDoc(doc(db, "schools", A, "students", "S-101")));
    await assertFails(getDoc(doc(db, "schools", A, "students", "S-200")));
    await assertFails(getDocs(collection(db, "schools", A, "students")));
    for (const col of ["attendance", "grades", "dailyProgress", "payments"]) {
      const ok = await assertSucceeds(getDocs(query(collection(db, "schools", A, col), where("studentId", "in", ["S-101", "S-102"]))));
      expect(ok.size, col).toBe(2);
      await assertFails(getDocs(query(collection(db, "schools", A, col), where("studentId", "in", ["S-101", "S-200"]))));
      await assertFails(getDocs(collection(db, "schools", A, col)));
    }
    // Les enfants liés dans A ne donnent rien dans B.
    await assertFails(getDoc(doc(db, "schools", B, "students", "S-101")));
  });

  it("élève : son dossier, pas les cotisations", async () => {
    const db = dbRole("طالب");
    await assertSucceeds(getDoc(doc(db, "schools", A, "students", "S-101")));
    await assertFails(getDoc(doc(db, "schools", A, "students", "S-102")));
    await assertFails(getDocs(query(collection(db, "schools", A, "payments"), where("studentId", "==", "S-101"))));
  });
});

describe("comptes, profils et auto-promotion", () => {
  it("chacun lit son appartenance et son profil, pas ceux des autres", async () => {
    const db = dbRole("مدرس");
    await assertSucceeds(getDoc(doc(db, "schools", A, "members", uidFor("مدرس"))));
    await assertFails(getDoc(doc(db, "schools", A, "members", uidFor("مدير"))));
    await assertSucceeds(getDoc(doc(db, "users", uidFor("مدرس"))));
    await assertFails(getDoc(doc(db, "users", uidFor("مدير"))));
    await assertFails(getDoc(doc(db, "usernames", "u0")));
  });

  it("le bureau liste les membres de son école, les autres non", async () => {
    await assertSucceeds(getDocs(collection(dbRole("إداري"), "schools", A, "members")));
    await assertFails(getDocs(collection(dbRole("مؤطر"), "schools", A, "members")));
  });

  for (const role of ROLES) {
    it(`${role} ne peut ni se promouvoir ni modifier les comptes (même le directeur : Cloud Functions)`, async () => {
      const db = dbRole(role);
      await assertFails(updateDoc(doc(db, "schools", A, "members", uidFor(role)), { role: role === "مدير" ? "أخرى" : "مدير" }));
      await assertFails(updateDoc(doc(db, "schools", A, "members", uidFor(role)), { isActive: true, linkedStudentIds: ["S-200"] }));
      await assertFails(updateDoc(doc(db, "schools", A, "members", uidFor(role)), { permissions: { finance: { read: true } } }));
      await assertFails(setDoc(doc(db, "schools", B, "members", uidFor(role)), { role: "مدير", isActive: true, schoolId: B }));
      await assertFails(updateDoc(doc(db, "users", uidFor(role)), { schoolIds: [A, B] }));
      await assertFails(updateDoc(doc(db, "users", uidFor(role)), { username: "admin_alfajr" }));
      await assertFails(setDoc(doc(db, "usernames", "nouveau"), { uid: uidFor(role) }));
      const other = role === "مدير" ? uidFor("مدرس") : uidFor("مدير");
      await assertFails(updateDoc(doc(db, "schools", A, "members", other), { role: "أخرى" }));
    });
  }

  it("champs anodins de son compte : autorisés", async () => {
    const db = dbRole("ولي أمر");
    await assertSucceeds(updateDoc(doc(db, "schools", A, "members", uidFor("ولي أمر")), { lastLogin: "2026-10-21", fullName: "Nom" }));
    await assertSucceeds(updateDoc(doc(db, "users", uidFor("ولي أمر")), { mustChangePassword: false, passwordChangedAt: "2026-10-21" }));
    await assertFails(updateDoc(doc(db, "users", uidFor("ولي أمر")), { mustChangePassword: true }));
    await assertSucceeds(updateDoc(doc(db, "users", uidFor("ولي أمر")), { lastSchoolId: A }));
    await assertFails(updateDoc(doc(db, "users", uidFor("ولي أمر")), { lastSchoolId: B }));
  });

  it("le directeur modifie le nom de son école, pas son statut", async () => {
    const db = dbRole("مدير");
    await assertSucceeds(updateDoc(doc(db, "schools", A), { name: "Nouveau nom" }));
    await assertFails(updateDoc(doc(db, "schools", A), { status: "suspended" }));
    await assertFails(updateDoc(doc(db, "schools", B), { name: "Piratage" }));
  });
});

describe("super-admin (claim) et racine", () => {
  it("le super-admin liste et lit les écoles et les membres, mais pas les données sans appartenance", async () => {
    const db = dbAs("uid_super", { superAdmin: true });
    await assertSucceeds(getDocs(collection(db, "schools")));
    await assertSucceeds(getDoc(doc(db, "schools", B)));
    await assertSucceeds(getDocs(collection(db, "schools", A, "members")));
    await assertSucceeds(getDocs(collection(db, "users")));
    await assertFails(getDocs(collection(db, "schools", A, "students")));
    await assertFails(getDocs(collection(db, "schools", A, "payments")));
  });

  it("un claim superAdmin=false ou absent ne donne rien", async () => {
    await assertFails(getDocs(collection(dbAs("uid_x", { superAdmin: false }), "schools")));
    await assertFails(getDocs(collection(dbRole("مدير"), "schools")));
  });

  it("la racine (anciennes collections) est fermée à tous", async () => {
    for (const db of [dbRole("مدير"), dbAs("uid_super", { superAdmin: true })]) {
      await assertFails(getDoc(doc(db, "students", "S-101")));
      await assertFails(getDoc(doc(db, "appUsers", "u1")));
      await assertFails(getDocs(collection(db, "authLinks")));
      await assertFails(setDoc(doc(db, "students", "S-999"), { fullName: "x" }));
    }
  });
});
