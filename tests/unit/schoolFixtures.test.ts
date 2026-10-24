/**
 * Jeu de données fictif de scripts/dev/seed-school-fixtures.ts (D82) : volumes,
 * quotas, marquage, cohérence des références, format de l'application.
 */
import { describe, expect, it, vi } from "vitest";

// helpers.ts réexporte des fonctions de session qui chargent Firebase : inutiles ici.
vi.mock("../../src/session/sessionProfile", () => ({ isPrimaryDirector: () => false, mergeSessionProfile: (x: unknown) => x }));

import { parseClassSchedule } from "../../src/app/helpers";
import { STAFF_PRIVATE_FIELDS, STAFF_PRIVATE_META_FIELDS } from "../../src/security/staffPrivate";
import {
  CLASS_DEFS,
  FIXTURE_COLLECTIONS,
  buildSchoolFixtures,
  countFixtures,
  isGeneratedDoc,
  referencesGenerated,
  surahForHizb,
} from "../../scripts/dev/fixtures/school-fixtures";

const NOW = new Date("2026-10-24T10:00:00.000Z");
const SETTINGS = { activeAcademicSeason: "2026/2027", openingYear: 2026, openingMonth: "شتمبر", subscriptionFee: 100, feeOverrides: [] };
const build = (size: "small" | "large", settings: Record<string, unknown> | null = SETTINGS, now = NOW) =>
  buildSchoolFixtures({ schoolId: "test1234", size, now, settings });
const total = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);

describe("jeu de données fictif d'une école (D82)", () => {
  const large = build("large");
  const small = build("small");
  const cl = countFixtures(large);
  const cs = countFixtures(small);

  it("volumes : large réaliste et sous le quota, small environ dix fois plus petit", () => {
    expect(cl).toMatchObject({ students: 150, classes: 12, teachers: 15, staffPrivate: 15, activities: 4, notifications: 30 });
    expect(cl.attendance).toBeGreaterThan(4000);
    expect(cl.dailyProgress).toBeGreaterThan(1000);
    expect(cl.grades).toBeGreaterThan(200);
    expect(cl.payments).toBeGreaterThan(250); // septembre et octobre
    expect(cl.salaryPayments).toBe(13 * 3);
    expect(cl.activityParticipants).toBeGreaterThan(60);
    expect(total(cl)).toBeLessThan(20_000 - 3 * 4);
    expect(cs).toMatchObject({ students: 15, classes: 2, teachers: 6, activities: 1, notifications: 3 });
    expect(total(cs) / total(cl)).toBeGreaterThan(0.05);
    expect(total(cs) / total(cl)).toBeLessThan(0.2);
    expect(large.paymentMonths).toEqual(["2026-09", "2026-10"]);
  });

  it("déterministe pour une même école, une même taille et une même date", () => {
    expect(JSON.stringify(build("large"))).toBe(JSON.stringify(large));
    expect(JSON.stringify(buildSchoolFixtures({ schoolId: "autre", size: "large", now: NOW, settings: SETTINGS }))).not.toBe(JSON.stringify(large));
  });

  it("marquage : demoData et DEMO- partout, sauf staffPrivate (liste fermée) et attendance (identifiant de l'application)", () => {
    for (const f of [large, small]) {
      for (const col of FIXTURE_COLLECTIONS) {
        for (const [id, data] of Object.entries(f.collections[col])) {
          expect(isGeneratedDoc(col, id, data), `${col}/${id}`).toBe(true);
          expect(id, `${col}/${id}`).toMatch(/^[a-zA-Z0-9_-]{1,128}$/); // isValidId des règles
          expect(data.schoolId).toBe("test1234");
          if (col === "staffPrivate") {
            expect(data).not.toHaveProperty("demoData");
            expect(data.teacherId).toBe(id);
            for (const k of Object.keys(data)) expect([...STAFF_PRIVATE_FIELDS, ...STAFF_PRIVATE_META_FIELDS], `${id}.${k}`).toContain(k);
          } else {
            expect(data.demoData).toBe(true);
            expect(data.id).toBe(id);
            if (col === "attendance") expect(id).toBe(`a_${data.date}_${data.studentId}`);
            else expect(id.startsWith("DEMO-")).toBe(true);
          }
          if (col === "teachers") for (const k of STAFF_PRIVATE_FIELDS) expect(data, id).not.toHaveProperty(k);
          expect(JSON.stringify(data), `${col}/${id}`).not.toMatch(/password/i);
          for (const v of Object.values(data)) expect(v, `${col}/${id}`).not.toBeUndefined();
        }
      }
    }
  });

  it("isGeneratedDoc : jamais vrai pour un document sans marquage", () => {
    expect(isGeneratedDoc("students", "DEMO-S-001", { fullName: "x" })).toBe(false);
    expect(isGeneratedDoc("students", "S-101", { demoData: true })).toBe(false);
    expect(isGeneratedDoc("attendance", "a_2026-10-01_S-101", { demoData: true })).toBe(false);
    expect(isGeneratedDoc("attendance", "a_2026-10-01_DEMO-S-001", {})).toBe(false);
    expect(isGeneratedDoc("payments", "p_init_DEMO-S-001", { demoData: true })).toBe(false);
    expect(isGeneratedDoc("staffPrivate", "t1", { teacherId: "t1" })).toBe(false);
    expect(isGeneratedDoc("staffPrivate", "DEMO-T-01", { teacherId: "t1" })).toBe(false);
    expect(isGeneratedDoc("students", "DEMO-S-001", null)).toBe(false);
    expect(referencesGenerated("p_init_DEMO-S-001", { studentId: "DEMO-S-001" })).toBe(true);
    expect(referencesGenerated("n1", { title: "x" })).toBe(false);
  });

  it("références cohérentes : halaqas, muhaffiz, élèves, activités", () => {
    for (const f of [large, small]) {
      const c = f.collections;
      for (const s of Object.values(c.students)) expect(c.classes[String(s.classId)], String(s.id)).toBeDefined();
      for (const k of Object.values(c.classes)) expect(c.teachers[String(k.teacherId)]).toBeDefined();
      for (const col of ["attendance", "dailyProgress", "grades", "payments"]) {
        for (const d of Object.values(c[col])) expect(c.students[String(d.studentId)], `${col}/${d.id}`).toBeDefined();
      }
      for (const d of Object.values(c.dailyProgress)) expect(c.teachers[String(d.teacherId)]).toBeDefined();
      for (const d of Object.values(c.grades)) expect(c.teachers[String(d.examinerId)]).toBeDefined();
      for (const d of Object.values(c.salaryPayments)) expect(c.teachers[String(d.personId)]).toBeDefined();
      for (const d of [...Object.values(c.activityParticipants), ...Object.values(c.activityExpenses)]) expect(c.activities[String(d.activityId)]).toBeDefined();
      // Comptes de test.
      expect(c.teachers[f.links.teacherId].category).toBe("أستاذ / محفظ");
      expect(f.links.teacherClassIds.every((id) => c.classes[id].teacherId === f.links.teacherId)).toBe(true);
      expect(c.teachers[f.links.officeTeacherId].category).toBe("إداري / كاتب");
      const [a, b] = f.links.parentStudentIds.map((id) => c.students[id]);
      expect(a.parentPhone).toBe(b.parentPhone);
      expect(a.parentName).toBe(b.parentName);
      expect(c.students[f.links.studentId].isArchived).toBe(false);
    }
  });

  it("contenu réaliste : âges, sexe, hizbs 0 à 60, documents, téléphones 06 00, retards et impayés", () => {
    const students = Object.values(large.collections.students);
    const ages = students.map((s) => 2026 - Number(String(s.birthDate).slice(0, 4)));
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...ages)).toBeLessThanOrEqual(19);
    expect(new Set(students.map((s) => s.gender))).toEqual(new Set(["ذكر", "أنثى"]));
    for (const s of students) {
      expect(Number(s.hizbCount)).toBeGreaterThanOrEqual(0);
      expect(Number(s.hizbCount)).toBeLessThanOrEqual(60);
      expect(String(s.parentPhone)).toMatch(/^06 00 \d{2} \d{2} \d{2}$/);
      expect(["ممتاز", "متوسط", "ضعيف"]).toContain(s.tajweedLevel);
    }
    for (const s of students) {
      const ageAtRegistration = (Date.parse(String(s.registrationDate)) - Date.parse(String(s.birthDate))) / (365.25 * 86_400_000);
      expect(ageAtRegistration, String(s.id)).toBeGreaterThanOrEqual(4.9);
      expect(String(s.registrationDate) <= "2026-10-24").toBe(true);
    }
    expect(students.some((s) => !s.docPhotos)).toBe(true);
    expect(students.some((s) => s.isArchived)).toBe(true);
    expect(new Set(students.map((s) => s.fullName)).size).toBeGreaterThan(120);
    const pays = Object.values(large.collections.payments);
    expect(pays.filter((p) => p.status === "غير مدفوع").length).toBeGreaterThan(10);
    expect(pays.filter((p) => p.notes === "أداء متأخر").length).toBeGreaterThan(5);
    const att = Object.values(large.collections.attendance);
    for (const s of ["حاضر", "غائب", "متأخر"]) expect(att.some((a) => a.status === s), s).toBe(true);
    expect(att.some((a) => a.date === "2026-10-24")).toBe(true);
    expect(att.every((a) => String(a.date) > "2026-07-24" && String(a.date) <= "2026-10-24")).toBe(true);
    const cats = new Set(Object.values(large.collections.teachers).map((t) => t.category));
    expect(cats).toEqual(new Set(["أستاذ / محفظ", "مؤطر / مشرف تربوي", "إداري / كاتب", "عامل نظافة / صيانة", "متطوع"]));
    expect(surahForHizb(60)).toMatch(/ختم/);
    expect(surahForHizb(1)).toBe("سورة النبأ");
  });

  it("présences aux seuls jours des halaqas (horaires lus comme l'application, jamais le vendredi)", () => {
    for (const c of CLASS_DEFS) {
      expect(parseClassSchedule(c.schedule).activeDays.sort(), c.key).toEqual([...c.days].sort());
      expect(c.days).not.toContain(5);
    }
    const classOf = new Map(Object.values(large.collections.students).map((s) => [s.id, CLASS_DEFS.find((c) => `DEMO-C-${c.key.slice(1)}` === s.classId)!]));
    for (const a of Object.values(large.collections.attendance)) {
      expect(classOf.get(a.studentId)!.days).toContain(new Date(`${a.date}T00:00:00Z`).getUTCDay());
    }
  });

  it("cotisations : jamais avant l'ouverture ; mois d'ouverture antérieur à la saison ajouté ; tarifs de l'école", () => {
    const opened = build("large", { ...SETTINGS, openingMonth: "أكتوبر" });
    expect(opened.paymentMonths).toEqual(["2026-10"]);
    const old = build("large", { ...SETTINGS, openingYear: 2026, openingMonth: "يوليوز", feeOverrides: [{ year: 2026, month: "يوليوز", amount: 70 }] });
    expect(old.paymentMonths).toEqual(["2026-07", "2026-09", "2026-10"]);
    const july = Object.values(old.collections.payments).filter((p) => p.month === "يوليوز");
    expect(july.length).toBeGreaterThan(0);
    expect(july.every((p) => p.amount === 70)).toBe(true);
    expect(countFixtures(build("large", null)).payments).toBeGreaterThan(0);
  });
});
