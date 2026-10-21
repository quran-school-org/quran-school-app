/**
 * Fonctions utilitaires d'App.tsx, déplacées telles quelles (Lot 2).
 */
export { isPrimaryDirector, mergeSessionProfile } from "../session/sessionProfile";

export const getYearAndMonthFromDate = (dateStr: string) => {
  if (!dateStr) return { year: null, month: null };
  const parts = dateStr.split("-");
  if (parts.length < 2) return { year: null, month: null };
  const year = parseInt(parts[0], 10);
  const monthNum = parseInt(parts[1], 10); // 1-12
  const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
  if (monthNum >= 1 && monthNum <= 12) {
    return { year, month: months_ar[monthNum - 1] };
  }
  return { year: null, month: null };
};

export interface ParsedSchedule {
  activeDays: number[]; // [0, 6] representing Sun, Mon, etc.
  startTime: { hours: number; minutes: number } | null;
  endTime: { hours: number; minutes: number } | null;
}

export const parseClassSchedule = (scheduleStr: string): ParsedSchedule => {
  const arabicDays = [
    { name: "الأحد", index: 0 },
    { name: "الاثنين", index: 1 },
    { name: "الإثنين", index: 1 },
    { name: "الثلاثاء", index: 2 },
    { name: "الأربعاء", index: 3 },
    { name: "الخميس", index: 4 },
    { name: "الجمعة", index: 5 },
    { name: "السبت", index: 6 }
  ];

  const activeDays = Array.from(new Set(
    arabicDays
      .filter(day => scheduleStr.includes(day.name))
      .map(day => day.index)
  ));

  const timeRegex = /(\d{1,2}):(\d{2})/g;
  const matches = [...scheduleStr.matchAll(timeRegex)];
  
  let startTime = null;
  let endTime = null;

  if (matches.length >= 1) {
    startTime = {
      hours: parseInt(matches[0][1], 10),
      minutes: parseInt(matches[0][2], 10)
    };
  }
  if (matches.length >= 2) {
    endTime = {
      hours: parseInt(matches[1][1], 10),
      minutes: parseInt(matches[1][2], 10)
    };
  }

  return { activeDays, startTime, endTime };
};

/** Libellé affiché quand l'école n'a pas encore de nom dans ses paramètres. */
export const DEFAULT_SCHOOL_LABEL = "المدرسة القرآنية";
