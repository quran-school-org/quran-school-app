/**
 * Séances et pointage (fonctions pures, testées dans tests/unit/attendanceSessions.test.ts) :
 * séance du jour d'une halaqa, halaqa à présélectionner pour l'enseignant, séance
 * précédente, « tous présents » sans écraser une saisie, séances terminées.
 */
import type { Attendance, Class, Student } from "../types";
import { parseClassSchedule } from "./classSchedule";

/** Durée supposée d'une séance dont l'horaire n'indique pas l'heure de fin. */
const DEFAULT_SESSION_MIN = 120;

/** Date locale au format AAAA-MM-JJ (et non UTC : le jour change à minuit local). */
export function localIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftIsoDate(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return localIsoDate(d);
}

/** Vrai si la halaqa a lieu le jour de la semaine de `date` (horaire sans jour : jamais). */
export function hasSessionOn(cls: Class, date: string): boolean {
  return parseClassSchedule(cls.schedule || "").activeDays.includes(parseIsoDate(date).getDay());
}

export type SessionState = "none" | "upcoming" | "ongoing" | "done";

export interface SessionInfo {
  state: SessionState;
  /** Minutes depuis minuit ; null si l'horaire n'en donne pas. */
  start: number | null;
  end: number | null;
}

/** État de la séance de `cls` à la date `date`, vu à l'instant `now`. */
export function sessionInfo(cls: Class, date: string, now: Date): SessionInfo {
  if (!hasSessionOn(cls, date)) return { state: "none", start: null, end: null };
  const { startTime, endTime } = parseClassSchedule(cls.schedule || "");
  const start = startTime ? startTime.hours * 60 + startTime.minutes : null;
  const end = endTime ? endTime.hours * 60 + endTime.minutes : start !== null ? start + DEFAULT_SESSION_MIN : null;
  const today = localIsoDate(now);
  if (date < today) return { state: "done", start, end };
  if (date > today) return { state: "upcoming", start, end };
  if (start === null || end === null) return { state: "ongoing", start, end };
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < start) return { state: "upcoming", start, end };
  if (minutes < end) return { state: "ongoing", start, end };
  return { state: "done", start, end };
}

/** Séance du jour la plus pertinente parmi les halaqas (en cours, sinon à venir, sinon la dernière). */
export function todaySession(classes: Class[], now: Date): { cls: Class; info: SessionInfo } | null {
  const today = localIsoDate(now);
  const list = classes
    .filter((c) => !c.isArchived)
    .map((cls) => ({ cls, info: sessionInfo(cls, today, now) }))
    .filter((x) => x.info.state !== "none")
    .sort((a, b) => (a.info.start ?? 0) - (b.info.start ?? 0));
  if (list.length === 0) return null;
  return list.find((x) => x.info.state === "ongoing") || list.find((x) => x.info.state === "upcoming") || list[list.length - 1];
}

/** Halaqa à présélectionner pour un enseignant : celle de la séance du jour, sinon sa première ; null s'il n'en a pas. */
export function pickTeacherClass(teacherClasses: Class[], now: Date): Class | null {
  const live = teacherClasses.filter((c) => !c.isArchived);
  return todaySession(live, now)?.cls || live[0] || null;
}

/** Jour de séance précédant `date` pour l'une des halaqas données (sans horaire connu : la veille). */
export function previousSessionDate(date: string, classes: Class[], maxBack = 21): string {
  const scoped = classes.filter((c) => !c.isArchived);
  const withDays = scoped.filter((c) => parseClassSchedule(c.schedule || "").activeDays.length > 0);
  if (withDays.length === 0) return shiftIsoDate(date, -1);
  for (let i = 1; i <= maxBack; i++) {
    const d = shiftIsoDate(date, -i);
    if (withDays.some((c) => hasSessionOn(c, d))) return d;
  }
  return shiftIsoDate(date, -1);
}

/** Le pointage automatique (absence à l'heure de la séance) n'est pas une saisie de l'enseignant. */
export const AUTO_ABSENCE_PREFIX = "غياب تلقائي";
export const isAutoAbsence = (a?: Pick<Attendance, "notes">) => Boolean(a?.notes && a.notes.startsWith(AUTO_ABSENCE_PREFIX));

/**
 * Élèves à marquer présents : ceux qui n'ont aucune saisie ce jour-là, ou
 * seulement une absence automatique. Toute saisie manuelle (même « غائب ») est conservée.
 */
export function studentsToMarkPresent(students: Pick<Student, "id">[], attendance: Attendance[], date: string): string[] {
  const byStudent = new Map(attendance.filter((a) => a.date === date).map((a) => [a.studentId, a]));
  return students.filter((s) => {
    const rec = byStudent.get(s.id);
    return !rec || isAutoAbsence(rec);
  }).map((s) => s.id);
}

/**
 * Présences « réglées » : on ne compte pas une séance du jour avant qu'elle soit
 * terminée (les absences automatiques d'une séance en cours fausseraient le taux).
 */
export function settledAttendance(attendance: Attendance[], students: Student[], classes: Class[], now: Date): Attendance[] {
  const today = localIsoDate(now);
  const classOf = new Map(students.map((s) => [s.id, s.classId]));
  const classById = new Map(classes.map((c) => [c.id, c]));
  return attendance.filter((a) => {
    if (a.date < today) return true;
    if (a.date > today) return false;
    const cls = classById.get(classOf.get(a.studentId) || "");
    if (!cls) return true;
    const state = sessionInfo(cls, a.date, now).state;
    return state === "none" || state === "done";
  });
}

/** Jours de la semaine (0 = dimanche) où au moins une halaqa a lieu. */
export function scheduledWeekdays(classes: Class[]): Set<number> {
  const out = new Set<number>();
  for (const c of classes) if (!c.isArchived) parseClassSchedule(c.schedule || "").activeDays.forEach((d) => out.add(d));
  return out;
}

export function formatClock(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
