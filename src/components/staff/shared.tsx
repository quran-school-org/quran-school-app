/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import React from "react";
import { Brush, ClipboardList, GraduationCap, HandHeart, Landmark, Star, UserRound } from "lucide-react";
import { StaffCategory } from "../../types";

/** Icône de catégorie : taille relative à la police (1em), décorative. */
const ico = (C: any) => <C className="inline-block w-[1em] h-[1em] align-[-0.125em]" strokeWidth={1.75} aria-hidden="true" />;
export const DEFAULT_STAFF_ICON = ico(UserRound);



// Catégories du personnel et tons de la charte (pastilles, filtres)
export const STAFF_CATEGORIES_CONFIG: Record<StaffCategory, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; badgeBg: string }> = {
  "عضو مكتب تنفيذي / مسير": {
    label: "أعضاء المكتب والمسيرون",
    icon: ico(Landmark),
    bg: "bg-primary-100",
    text: "text-primary",
    border: "border-primary-200",
    badgeBg: "bg-primary text-white"
  },
  "أستاذ / محفظ": {
    label: "أساتذة ومحفظين",
    icon: ico(GraduationCap),
    bg: "bg-gold-100",
    text: "text-gold-800",
    border: "border-gold-200",
    badgeBg: "bg-gold text-night"
  },
  "مؤطر / مشرف تربوي": {
    label: "مؤطرون ومشرفون",
    icon: ico(Star),
    bg: "bg-success-100",
    text: "text-success-700",
    border: "border-success-200",
    badgeBg: "bg-success-700 text-white"
  },
  "إداري / كاتب": {
    label: "إداريون وكتاب",
    icon: ico(ClipboardList),
    bg: "bg-primary-50",
    text: "text-primary-500",
    border: "border-primary-200",
    badgeBg: "bg-primary-500 text-white"
  },
  "عامل نظافة / صيانة": {
    label: "عمال نظافة وصيانة",
    icon: ico(Brush),
    bg: "bg-sunken",
    text: "text-ink-2",
    border: "border-line-strong",
    badgeBg: "bg-ink-2 text-white"
  },
  "متطوع": {
    label: "متطوعون",
    icon: ico(HandHeart),
    bg: "bg-danger-50",
    text: "text-danger-800",
    border: "border-danger-200",
    badgeBg: "bg-danger-800 text-white"
  },
  "أخرى": {
    label: "أخرى",
    icon: ico(UserRound),
    bg: "bg-surface-2",
    text: "text-ink-2",
    border: "border-line",
    badgeBg: "bg-ink-3 text-white"
  }
};
