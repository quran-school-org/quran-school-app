/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { StaffCategory } from "../../types";



// Category Configuration & Colors
export const STAFF_CATEGORIES_CONFIG: Record<StaffCategory, { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }> = {
  "عضو مكتب تنفيذي / مسير": {
    label: "أعضاء المكتب والمسيرون",
    icon: "🏛️",
    bg: "bg-primary-50",
    text: "text-primary-800",
    border: "border-primary-200",
    badgeBg: "bg-primary-700 text-white"
  },
  "أستاذ / محفظ": {
    label: "أساتذة ومحفظين",
    icon: "👨‍🏫",
    bg: "bg-primary-50",
    text: "text-primary-800",
    border: "border-primary-200",
    badgeBg: "bg-primary-700 text-white"
  },
  "مؤطر / مشرف تربوي": {
    label: "مؤطرون ومشرفون",
    icon: "🌟",
    bg: "bg-primary-50",
    text: "text-primary-800",
    border: "border-primary-200",
    badgeBg: "bg-primary-700 text-white"
  },
  "إداري / كاتب": {
    label: "إداريون وكتاب",
    icon: "📋",
    bg: "bg-primary-50",
    text: "text-primary-800",
    border: "border-primary-200",
    badgeBg: "bg-primary-700 text-white"
  },
  "عامل نظافة / صيانة": {
    label: "عمال نظافة وصيانة",
    icon: "🧹",
    bg: "bg-primary-50",
    text: "text-primary-800",
    border: "border-primary-200",
    badgeBg: "bg-primary-700 text-white"
  },
  "متطوع": {
    label: "متطوعون",
    icon: "🤝",
    bg: "bg-gold-50",
    text: "text-gold-800",
    border: "border-gold-200",
    badgeBg: "bg-gold-700 text-white"
  },
  "أخرى": {
    label: "أخرى",
    icon: "👤",
    bg: "bg-sand-50",
    text: "text-sand-800",
    border: "border-sand-200",
    badgeBg: "bg-sand-700 text-white"
  }
};
