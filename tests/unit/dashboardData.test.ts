import { describe, expect, it } from "vitest";
import {
  bestClass, busiestHizb, classPlacement, classesWithoutTeacher, missingDocuments, studentsLabel,
  teacherPerformance, weekStart, weeklyAttendance, isoDate,
} from "../../src/screens/dashboard/dashboardData";

const st = (id: string, extra: Record<string, unknown> = {}) => ({
  id, fullName: id, photo: "", birthDate: "2014-01-01", gender: "ذكر", registrationDate: "2026-09-01",
  parentName: "", parentPhone: "", docParentId: true, docBirthCert: true, docPhotos: true,
  hizbCount: 3, currentSurah: "", tajweedLevel: "متوسط", notes: "", classId: "c1", ...extra,
}) as any;

describe("tableau de bord", () => {
  it("accorde « طالب » avec le nombre", () => {
    expect(studentsLabel(1)).toBe("طالب واحد");
    expect(studentsLabel(2)).toBe("طالبان");
    expect(studentsLabel(5)).toBe("5 طلاب");
    expect(studentsLabel(13)).toBe("13 طالباً");
  });

  it("compte les élèves sans halaqa active et ignore les archivés", () => {
    const classes = [{ id: "c1", name: "A", teacherId: "t1", schedule: "", maxStudents: 10 }, { id: "c2", name: "B", teacherId: "", schedule: "", maxStudents: 10, isArchived: true }] as any;
    const students = [st("a"), st("b", { classId: "c2" }), st("c", { classId: "" }), st("d", { isArchived: true, classId: "" })];
    expect(classPlacement(students, classes)).toMatchObject({ placed: 1, unplaced: 2, usedClassCount: 1 });
  });

  it("détecte les documents manquants et les halaqas sans muḥaffiẓ", () => {
    expect(missingDocuments([st("a"), st("b", { docPhotos: false }), st("c", { docPhotos: false, isArchived: true })]).map((s) => s.id)).toEqual(["b"]);
    const classes = [{ id: "c1", teacherId: "t1" }, { id: "c2", teacherId: "" }, { id: "c3", teacherId: "t9" }, { id: "c4", teacherId: "t2" }] as any;
    const teachers = [{ id: "t1" }, { id: "t2", isArchived: true }] as any;
    expect(classesWithoutTeacher(classes, teachers).map((c) => c.id)).toEqual(["c2", "c3", "c4"]);
  });

  it("calcule la semaine (samedi → vendredi) et les taux de présence", () => {
    const wed = new Date(2026, 9, 21); // mercredi 21/10/2026
    expect(isoDate(weekStart(wed))).toBe("2026-10-17");
    const att = [
      { id: "1", date: "2026-10-17", studentId: "a", status: "حاضر" },
      { id: "2", date: "2026-10-17", studentId: "b", status: "غائب" },
      { id: "3", date: "2026-10-18", studentId: "a", status: "متأخر" },
      { id: "4", date: "2026-10-10", studentId: "a", status: "غائب" },
    ] as any;
    const w = weeklyAttendance(att, null, wed);
    expect(w.thisWeek[0]).toMatchObject({ day: "السبت", rate: 50 });
    expect(w.thisWeek[1].rate).toBe(100);
    expect(w.thisWeek[3].rate).toBeNull();
    expect(w.thisAvg).toBe(67);
    expect(w.lastAvg).toBe(0);
    expect(weeklyAttendance(att, new Set(["b"]), wed).thisAvg).toBe(0);
    expect(w.lastRecord).toBe("2026-10-18");
  });

  it("moyennes des muḥaffiẓ, meilleure halaqa, ḥizb le plus peuplé", () => {
    const teachers = [{ id: "t1", fullName: "T1", category: "أستاذ / محفظ" }, { id: "t2", fullName: "T2", category: "أستاذ / محفظ" }, { id: "t3", fullName: "T3", category: "متطوع" }] as any;
    const classes = [{ id: "c1", name: "A", teacherId: "t1", maxStudents: 20 }, { id: "c2", name: "B", teacherId: "t3", maxStudents: 5 }] as any;
    const students = [st("a", { hizbCount: 4 }), st("b", { hizbCount: 4 }), st("c", { classId: "c2", hizbCount: 9 })];
    const grades = [
      { id: "g1", studentId: "a", memorizationGrade: 16, tajweedGrade: 14 },
      { id: "g2", studentId: "b", memorizationGrade: 18, tajweedGrade: 15 },
      { id: "g3", studentId: "c", memorizationGrade: 10, tajweedGrade: 10 },
    ] as any;
    const perf = teacherPerformance(teachers, classes, students, grades);
    expect(perf.map((p) => p.teacher.id)).toEqual(["t1", "t3", "t2"]);
    expect(perf[0]).toMatchObject({ students: 2, capacity: 20, exams: 2, memo: 17, tajweed: 14.5 });
    expect(perf[2].classes).toHaveLength(0);
    expect(bestClass(classes, students, grades)?.id).toBe("c1");
    expect(busiestHizb(students)).toBe(4);
  });
});
