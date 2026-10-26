/**
 * Vue famille des activités (D94) : fonctions pures, sans React, testées dans
 * tests/unit/familyActivities.test.ts. Les inscriptions viennent de
 * l'abonnement filtré par élève (participantType « طالب » + referenceId).
 */
import type { ActivityParticipant, ActivityTrip } from "../../types";

/** Au-delà de ce nombre d'activités, recherche et filtre sont proposés (règle des écrans de liste). */
export const FAMILY_ACTIVITIES_SEARCH_MIN = 8;

const isOver = (a: ActivityTrip) => a.status === "مكتمل" || a.status === "ملغى";
const lastDay = (a: ActivityTrip) => a.endDate || a.startDate || "";
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);

/**
 * Les plus proches ou à venir d'abord (date de début croissante, activités en
 * cours comprises), puis les terminées, annulées ou passées, de la plus récente
 * à la plus ancienne. `today` : YYYY-MM-DD. Les activités archivées sont écartées.
 */
export function sortFamilyActivities(activities: ActivityTrip[], today: string): ActivityTrip[] {
  const upcoming = (a: ActivityTrip) => !isOver(a) && lastDay(a) >= today;
  const live = activities.filter((a) => !a.isArchived);
  const next = live.filter(upcoming).sort((a, b) => cmp(a.startDate || "", b.startDate || "") || cmp(a.title, b.title));
  const past = live.filter((a) => !upcoming(a)).sort((a, b) => cmp(b.startDate || "", a.startDate || "") || cmp(a.title, b.title));
  return [...next, ...past];
}

export type ChildActivityState =
  | { kind: "none" }
  | { kind: "registered"; payment: "paid" | "partial" | "unpaid" | "exempt"; fee: number; paid: number; remaining: number };

/** Inscription d'un enfant à une activité : seul un participant de type « طالب » dont referenceId est l'élève compte. */
export function childActivityState(participants: ActivityParticipant[], activityId: string, studentId: string): ChildActivityState {
  const p = participants.find((x) => x.activityId === activityId && x.participantType === "طالب" && x.referenceId === studentId);
  if (!p) return { kind: "none" };
  const fee = Number(p.fee) || 0;
  const paid = Number(p.paidAmount) || 0;
  const remaining = Math.max(0, fee - paid);
  let payment: "paid" | "partial" | "unpaid" | "exempt";
  if (p.paymentStatus === "معفى") payment = "exempt";
  else if (fee > 0 && paid >= fee) payment = "paid";
  else if (paid > 0) payment = "partial";
  else payment = fee > 0 ? "unpaid" : "exempt";
  return { kind: "registered", payment, fee, paid, remaining };
}

/** Au-delà de ce seuil (caractères ou lignes), le texte est replié avec « عرض المزيد ». */
export const FAMILY_TEXT_FOLD_CHARS = 220;
export const FAMILY_TEXT_FOLD_LINES = 4;

/** Texte à replier : long ou sur plusieurs lignes. Vide ou espaces seuls : pas de texte. */
export function isLongText(text: string | undefined | null): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  return t.length > FAMILY_TEXT_FOLD_CHARS || t.split(/\r?\n/).filter((l) => l.trim()).length > FAMILY_TEXT_FOLD_LINES;
}

/** Textes de présentation montrés à la famille (description, programme, rendez-vous) : aucune donnée financière interne. */
export function familyActivityTexts(a: ActivityTrip): { description: string; program: string; meetingPoint: string } {
  return { description: (a.description || "").trim(), program: (a.programDetails || "").trim(), meetingPoint: (a.meetingPoint || "").trim() };
}
