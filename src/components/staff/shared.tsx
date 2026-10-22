/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { StaffCategory } from "../../types";



// Catégories du personnel et tons de la charte (pastilles, filtres)
export const STAFF_CATEGORIES_CONFIG: Record<StaffCategory, { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }> = {
  "عضو مكتب تنفيذي / مسير": {
    label: "أعضاء المكتب والمسيرون",
    icon: "🏛️",
    bg: "bg-primary-100",
    text: "text-primary",
    border: "border-primary-200",
    badgeBg: "bg-primary text-white"
  },
  "أستاذ / محفظ": {
    label: "أساتذة ومحفظين",
    icon: "👨‍🏫",
    bg: "bg-gold-100",
    text: "text-gold-800",
    border: "border-gold-200",
    badgeBg: "bg-gold text-night"
  },
  "مؤطر / مشرف تربوي": {
    label: "مؤطرون ومشرفون",
    icon: "🌟",
    bg: "bg-success-100",
    text: "text-success-700",
    border: "border-success-200",
    badgeBg: "bg-success-700 text-white"
  },
  "إداري / كاتب": {
    label: "إداريون وكتاب",
    icon: "📋",
    bg: "bg-primary-50",
    text: "text-primary-500",
    border: "border-primary-200",
    badgeBg: "bg-primary-500 text-white"
  },
  "عامل نظافة / صيانة": {
    label: "عمال نظافة وصيانة",
    icon: "🧹",
    bg: "bg-sunken",
    text: "text-ink-2",
    border: "border-line-strong",
    badgeBg: "bg-ink-2 text-white"
  },
  "متطوع": {
    label: "متطوعون",
    icon: "🤝",
    bg: "bg-danger-50",
    text: "text-danger-800",
    border: "border-danger-200",
    badgeBg: "bg-danger-800 text-white"
  },
  "أخرى": {
    label: "أخرى",
    icon: "👤",
    bg: "bg-surface-2",
    text: "text-ink-2",
    border: "border-line",
    badgeBg: "bg-ink-3 text-white"
  }
};
