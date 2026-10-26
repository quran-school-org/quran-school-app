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

export { parseClassSchedule } from "./classSchedule";
export type { ParsedSchedule } from "./classSchedule";

/** Libellé affiché quand l'école n'a pas encore de nom dans ses paramètres. */
export const DEFAULT_SCHOOL_LABEL = "المدرسة القرآنية";
