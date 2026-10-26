/**
 * Seconde école FICTIVE pour les tests multi-écoles (émulateurs uniquement) :
 * mêmes identifiants de documents que l'école n°1 (S-101…) pour vérifier
 * l'isolation, un directeur propre, et une personne présente dans les deux
 * écoles (khalid_tazi : إداري à alfajr, مدرس à annour).
 */
import type { Auth } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { NEW_ACCOUNTS_EMAIL_DOMAIN, normalizeAuthPassword, usernameToEmail } from "../../../src/security/accounts";
import { defaultSchoolSettings } from "../../../src/school/businessRules";

export const SECOND_SCHOOL = {
  id: "annour",
  name: "مدرسة النور القرآنية (بيانات تجريبية)",
  director: { username: "dir_annour", password: "demo-annour-2026", fullName: "مدير مدرسة النور" },
  teacher: { username: "prof_annour", password: "demo-prof-2026", fullName: "أستاذة النور" },
} as const;

async function ensureAccount(db: Firestore, auth: Auth, username: string, password: string, fullName: string): Promise<string> {
  const email = usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN);
  let uid: string;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
  } catch {
    uid = (await auth.createUser({ email, password: normalizeAuthPassword(password), displayName: fullName })).uid;
  }
  await db.collection("usernames").doc(username).set({ uid, email });
  return uid;
}

async function addMember(db: Firestore, schoolId: string, uid: string, username: string, fullName: string, role: string, extra: Record<string, unknown> = {}) {
  await db.collection("schools").doc(schoolId).collection("members").doc(uid).set({
    uid, schoolId, username, fullName, role, isActive: true, isArchived: false,
    permissions: null, linkedTeacherId: null, linkedStudentIds: [], ...extra,
  });
  await db.collection("users").doc(uid).set({
    username, displayName: fullName, schoolIds: FieldValue.arrayUnion(schoolId),
  }, { merge: true });
}

export async function seedSecondSchool(db: Firestore, auth: Auth, alsoMemberUsername = "khalid_tazi"): Promise<void> {
  const s = SECOND_SCHOOL;
  const school = db.collection("schools").doc(s.id);
  await school.set({ name: s.name, slug: s.id, status: "active", createdAt: new Date().toISOString() });
  await school.collection("settings").doc("system").set({ ...defaultSchoolSettings(s.name), schoolId: s.id, subscriptionFee: 80 });

  const dirUid = await ensureAccount(db, auth, s.director.username, s.director.password, s.director.fullName);
  await addMember(db, s.id, dirUid, s.director.username, s.director.fullName, "مدير");
  await db.collection("users").doc(dirUid).set({ lastSchoolId: s.id, mustChangePassword: false }, { merge: true });

  const teacherUid = await ensureAccount(db, auth, s.teacher.username, s.teacher.password, s.teacher.fullName);
  await addMember(db, s.id, teacherUid, s.teacher.username, s.teacher.fullName, "مدرس", { linkedTeacherId: "t1" });
  await db.collection("users").doc(teacherUid).set({ lastSchoolId: s.id, mustChangePassword: false }, { merge: true });

  await school.collection("teachers").doc("t1").set({ schoolId: s.id, fullName: s.teacher.fullName, category: "أستاذ / محفظ", phone: "0700000001", isArchived: false });
  // Fiche RH (bureau seulement, D42).
  await school.collection("staffPrivate").doc("t1").set({ schoolId: s.id, teacherId: "t1", monthlySalary: 1800, contractType: "مكافأة شهرية", cinNumber: "YY000001" });
  await school.collection("classes").doc("c1").set({ schoolId: s.id, name: "حلقة الفرقان", teacherId: "t1", schedule: "الجمعة 16:00 - 18:00", maxStudents: 15 });
  for (const [id, name] of [["S-101", "إلياس البركاني"], ["S-102", "هدى البركاني"]]) {
    await school.collection("students").doc(id).set({
      schoolId: s.id, fullName: name, birthDate: "2015-01-01", gender: "ذكر", registrationDate: "2026-09-01",
      parentName: "عادل البركاني", parentPhone: "0711000001", classId: "c1", hizbCount: 2, currentSurah: "سورة الملك",
      tajweedLevel: "متوسط", notes: "", photo: "", docParentId: false, docBirthCert: false, docPhotos: false, isArchived: false,
    });
  }

  // Une personne de l'école n°1 exerce aussi dans la seconde (même compte).
  const reg = await db.collection("usernames").doc(alsoMemberUsername).get();
  const multiUid = reg.data()?.uid;
  if (typeof multiUid === "string") {
    await addMember(db, s.id, multiUid, alsoMemberUsername, "خالد التازي", "مدرس");
  }
}

/**
 * Super-admin FICTIF, membre (مدير) de la seule école annour, pour tester
 * l'aperçu par rôle (D95, tests/e2e/apercu-roles.spec.ts). Appelé par
 * seed-emulator.ts uniquement : les tests d'émulateur qui appellent
 * seedSecondSchool ne voient pas ce compte. Émulateurs seulement.
 */
export const PREVIEW_SUPER_ADMIN = { username: "super_demo", password: "demo-super-2026", fullName: "مشرف عام تجريبي" } as const;

export async function seedPreviewSuperAdmin(db: Firestore, auth: Auth, schoolId: string = SECOND_SCHOOL.id): Promise<string> {
  const a = PREVIEW_SUPER_ADMIN;
  const uid = await ensureAccount(db, auth, a.username, a.password, a.fullName);
  const rec = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(rec.customClaims || {}), superAdmin: true });
  await addMember(db, schoolId, uid, a.username, a.fullName, "مدير");
  await db.collection("users").doc(uid).set({ lastSchoolId: schoolId, mustChangePassword: false }, { merge: true });
  return uid;
}
