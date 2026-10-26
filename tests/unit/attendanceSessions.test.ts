/** Séances et pointage : présélection de la halaqa de l'enseignant, « tous présents », séances terminées (UI-04, UI-20). */
import { describe, expect, it } from "vitest";
import type { Attendance, Class, Student } from "../../src/types";
import {
  pickTeacherClass, previousSessionDate, scheduledWeekdays, sessionInfo, settledAttendance, shiftIsoDate, studentsToMarkPresent, todaySession,
} from "../../src/app/attendanceSessions";

const cls = (id: string, schedule: string, extra: Partial<Class> = {}): Class => ({ id, name: id, teacherId: "t1", schedule, maxStudents: 15, ...extra });
// 2026-10-26 est un lundi ; 2026-10-25 un dimanche.
const at = (iso: string, h: number, m = 0) => { const [y, mo, d] = iso.split("-").map(Number); return new Date(y, mo - 1, d, h, m); };

const SAT_SUN = cls("sat-sun", "السبت والأحد 09:00 - 11:00");
const MON_WED = cls("mon-wed", "الاثنين والأربعاء 17:00 - 19:00");
const MON_EVE = cls("mon-eve", "الاثنين 20:00 - 21:00");

describe("séance du jour", () => {
  it("état : à venir, en cours, terminée, aucune", () => {
    expect(sessionInfo(MON_WED, "2026-10-26", at("2026-10-26", 16)).state).toBe("upcoming");
    expect(sessionInfo(MON_WED, "2026-10-26", at("2026-10-26", 17, 30)).state).toBe("ongoing");
    expect(sessionInfo(MON_WED, "2026-10-26", at("2026-10-26", 19)).state).toBe("done");
    expect(sessionInfo(MON_WED, "2026-10-27", at("2026-10-27", 18)).state).toBe("none");
    expect(sessionInfo(MON_WED, "2026-10-24", at("2026-10-26", 8)).state).toBe("none"); // samedi : pas de séance
    expect(sessionInfo(SAT_SUN, "2026-10-25", at("2026-10-26", 8)).state).toBe("done");
  });

  it("todaySession : en cours d'abord, puis à venir, puis la dernière", () => {
    const list = [MON_EVE, MON_WED, SAT_SUN];
    expect(todaySession(list, at("2026-10-26", 17, 30))?.cls.id).toBe("mon-wed");
    expect(todaySession(list, at("2026-10-26", 19, 30))?.cls.id).toBe("mon-eve");
    expect(todaySession(list, at("2026-10-26", 21, 30))?.cls.id).toBe("mon-eve");
    expect(todaySession(list, at("2026-10-27", 10))).toBeNull();
  });
});

describe("présélection de la halaqa de l'enseignant (UI-04)", () => {
  it("prend la halaqa qui a une séance aujourd'hui", () => {
    expect(pickTeacherClass([SAT_SUN, MON_WED], at("2026-10-26", 12))?.id).toBe("mon-wed");
    expect(pickTeacherClass([MON_WED, SAT_SUN], at("2026-10-25", 12))?.id).toBe("sat-sun");
  });
  it("sinon sa première halaqa active ; aucune halaqa : null", () => {
    expect(pickTeacherClass([SAT_SUN, MON_WED], at("2026-10-27", 12))?.id).toBe("sat-sun");
    expect(pickTeacherClass([cls("old", "الاثنين 17:00 - 19:00", { isArchived: true }), SAT_SUN], at("2026-10-26", 12))?.id).toBe("sat-sun");
    expect(pickTeacherClass([], at("2026-10-26", 12))).toBeNull();
  });
});

describe("séance précédente", () => {
  it("dernier jour de séance avant la date", () => {
    expect(previousSessionDate("2026-10-26", [MON_WED])).toBe("2026-10-21");
    expect(previousSessionDate("2026-10-21", [MON_WED])).toBe("2026-10-19");
    expect(previousSessionDate("2026-10-26", [SAT_SUN, MON_WED])).toBe("2026-10-25");
  });
  it("horaire sans jour : la veille", () => {
    expect(previousSessionDate("2026-10-26", [cls("x", "بعد العصر")])).toBe("2026-10-25");
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("« tous présents » (UI-04)", () => {
  const students = [{ id: "s1" }, { id: "s2" }, { id: "s3" }, { id: "s4" }];
  const rec = (studentId: string, status: Attendance["status"], notes?: string): Attendance => ({ id: `a_${studentId}`, date: "2026-10-26", studentId, status, notes });

  it("ne marque que les élèves non saisis", () => {
    const attendance = [rec("s1", "غائب"), rec("s2", "متأخر")];
    expect(studentsToMarkPresent(students, attendance, "2026-10-26")).toEqual(["s3", "s4"]);
  });
  it("n'écrase aucune saisie manuelle, y compris une absence", () => {
    expect(studentsToMarkPresent(students, [rec("s1", "غائب", "مريض")], "2026-10-26")).not.toContain("s1");
  });
  it("une absence automatique n'est pas une saisie : elle est remplacée", () => {
    const attendance = [rec("s1", "غائب", "غياب تلقائي (بدأت الحلقة ولم يسجل حضوره)"), rec("s2", "غائب")];
    expect(studentsToMarkPresent(students, attendance, "2026-10-26")).toEqual(["s1", "s3", "s4"]);
  });
  it("les saisies d'un autre jour ne comptent pas", () => {
    expect(studentsToMarkPresent(students, [{ ...rec("s1", "غائب"), date: "2026-10-25" }], "2026-10-26")).toContain("s1");
  });
});

describe("présence de la semaine (UI-20)", () => {
  const student = (id: string, classId: string) => ({ id, classId } as Student);
  const students = [student("s1", "mon-wed"), student("s2", "sat-sun")];
  const a = (date: string, studentId: string, status: Attendance["status"] = "غائب"): Attendance => ({ id: `${date}${studentId}`, date, studentId, status });
  const classes = [MON_WED, SAT_SUN];

  it("ne compte pas une séance du jour avant sa fin", () => {
    const list = [a("2026-10-26", "s1"), a("2026-10-25", "s2", "حاضر")];
    expect(settledAttendance(list, students, classes, at("2026-10-26", 17, 30)).map((x) => x.date)).toEqual(["2026-10-25"]);
    expect(settledAttendance(list, students, classes, at("2026-10-26", 19, 30)).map((x) => x.date)).toEqual(["2026-10-26", "2026-10-25"]);
  });
  it("jours de séance de la semaine", () => {
    expect([...scheduledWeekdays(classes)].sort()).toEqual([0, 1, 3, 6]);
  });
});
