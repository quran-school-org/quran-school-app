/**
 * Calculs du tableau de bord (fonctions pures, testées dans
 * tests/unit/dashboardData.test.ts) à partir des vraies données de l'école.
 */
import type { Attendance, Class, Grade, Student, Teacher } from "../../types";

/** Accord du nom « طالب » avec un nombre (1, 2, 3-10, 11+). */
export function studentsLabel(n: number): string {
  if (n === 0) return "لا طالب";
  if (n === 1) return "طالب واحد";
  if (n === 2) return "طالبان";
  if (n >= 3 && n <= 10) return `${n} طلاب`;
  return `${n} طالباً`;
}

export function classesLabel(n: number): string {
  if (n === 1) return "حلقة واحدة";
  if (n === 2) return "حلقتين";
  if (n >= 3 && n <= 10) return `${n} حلقات`;
  return `${n} حلقة`;
}

export const activeOnly = (students: Student[]) => students.filter((s) => !s.isArchived);

/** Halaqas actives et élèves qui n'appartiennent à aucune halaqa active. */
export function classPlacement(students: Student[], classes: Class[]) {
  const active = activeOnly(students);
  const liveClasses = classes.filter((c) => !c.isArchived);
  const ids = new Set(liveClasses.map((c) => c.id));
  const placed = active.filter((s) => s.classId && ids.has(s.classId));
  const usedClasses = new Set(placed.map((s) => s.classId));
  return {
    liveClasses,
    placed: placed.length,
    unplaced: active.length - placed.length,
    usedClassCount: usedClasses.size,
  };
}

export function missingDocuments(students: Student[]): Student[] {
  return activeOnly(students).filter((s) => !s.docParentId || !s.docBirthCert || !s.docPhotos);
}

/** Halaqas sans muḥaffiẓ (aucun enseignant ou enseignant absent / archivé). */
export function classesWithoutTeacher(classes: Class[], teachers: Teacher[]): Class[] {
  const live = new Set(teachers.filter((t) => !t.isArchived).map((t) => t.id));
  return classes.filter((c) => !c.isArchived && (!c.teacherId || !live.has(c.teacherId)));
}

// ---------------------------------------------------------------- semaine

/** Samedi (début de semaine de la maquette) de la semaine contenant `d`. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 1) % 7; // samedi = 0
  x.setDate(x.getDate() - offset);
  return x;
}

export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const WEEK_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export interface DayRate {
  day: string;
  date: string;
  rate: number | null; // % présents (présent + en retard) ; null = aucun relevé
  records: number;
}

function rateOf(list: Attendance[]): number | null {
  if (list.length === 0) return null;
  const ok = list.filter((a) => a.status === "حاضر" || a.status === "متأخر").length;
  return Math.round((ok / list.length) * 100);
}

/** Taux de présence jour par jour pour la semaine courante et la précédente. */
export function weeklyAttendance(attendance: Attendance[], studentIds: Set<string> | null, today = new Date()) {
  const scoped = studentIds ? attendance.filter((a) => studentIds.has(a.studentId)) : attendance;
  const start = weekStart(today);
  const build = (offsetDays: number): DayRate[] =>
    WEEK_DAYS.map((day, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + offsetDays + i);
      const date = isoDate(d);
      const list = scoped.filter((a) => a.date === date);
      return { day, date, rate: rateOf(list), records: list.length };
    });
  const thisWeek = build(0);
  const lastWeek = build(-7);
  const avg = (days: DayRate[]) => {
    const list = scoped.filter((a) => a.date >= days[0].date && a.date <= days[6].date);
    return rateOf(list);
  };
  const lastRecord = scoped.reduce<string>((m, a) => (a.date > m ? a.date : m), "");
  return { thisWeek, lastWeek, thisAvg: avg(thisWeek), lastAvg: avg(lastWeek), lastRecord };
}

// ---------------------------------------------------------------- muḥaffiẓ

export interface TeacherPerf {
  teacher: Teacher;
  classes: Class[];
  students: number;
  capacity: number;
  exams: number;
  memo: number | null; // moyenne / 20
  tajweed: number | null;
}

const isMuhaffiz = (t: Teacher, classes: Class[]) =>
  !t.isArchived && (t.category === "أستاذ / محفظ" || classes.some((c) => !c.isArchived && c.teacherId === t.id));

export function teacherPerformance(teachers: Teacher[], classes: Class[], students: Student[], grades: Grade[]): TeacherPerf[] {
  const active = activeOnly(students);
  return teachers
    .filter((t) => isMuhaffiz(t, classes))
    .map((t) => {
      const own = classes.filter((c) => !c.isArchived && c.teacherId === t.id);
      const ids = new Set(own.map((c) => c.id));
      const studs = active.filter((s) => ids.has(s.classId));
      const sid = new Set(studs.map((s) => s.id));
      const gs = grades.filter((g) => sid.has(g.studentId));
      const mean = (k: "memorizationGrade" | "tajweedGrade") =>
        gs.length ? Math.round((gs.reduce((a, g) => a + (Number(g[k]) || 0), 0) / gs.length) * 10) / 10 : null;
      return {
        teacher: t,
        classes: own,
        students: studs.length,
        capacity: own.reduce((a, c) => a + (Number(c.maxStudents) || 0), 0),
        exams: gs.length,
        memo: mean("memorizationGrade"),
        tajweed: mean("tajweedGrade"),
      };
    })
    .sort((a, b) => (b.classes.length > 0 ? 1 : 0) - (a.classes.length > 0 ? 1 : 0) || b.students - a.students);
}

/** Halaqa dont les élèves ont la meilleure moyenne (ḥifẓ + tajwīd). */
export function bestClass(classes: Class[], students: Student[], grades: Grade[]): Class | null {
  let best: Class | null = null;
  let bestAvg = -1;
  for (const c of classes.filter((x) => !x.isArchived)) {
    const sid = new Set(activeOnly(students).filter((s) => s.classId === c.id).map((s) => s.id));
    const gs = grades.filter((g) => sid.has(g.studentId));
    if (!gs.length) continue;
    const avg = gs.reduce((a, g) => a + (Number(g.memorizationGrade) || 0) + (Number(g.tajweedGrade) || 0), 0) / gs.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = c;
    }
  }
  return best;
}

/** Ḥizb qui compte le plus d'élèves (sélection par défaut de la carte). */
export function busiestHizb(students: Student[]): number {
  const count = new Map<number, number>();
  for (const s of activeOnly(students)) {
    const h = Math.max(0, Math.min(60, Math.round(Number(s.hizbCount) || 0)));
    if (h >= 1) count.set(h, (count.get(h) || 0) + 1);
  }
  let best = 1;
  let n = 0;
  count.forEach((v, k) => {
    if (v > n || (v === n && k > best)) {
      n = v;
      best = k;
    }
  });
  return best;
}
