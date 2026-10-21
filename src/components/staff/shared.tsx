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
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-700 text-white"
  },
  "أستاذ / محفظ": {
    label: "أساتذة ومحفظين",
    icon: "👨‍🏫",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-700 text-white"
  },
  "مؤطر / مشرف تربوي": {
    label: "مؤطرون ومشرفون",
    icon: "🌟",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    badgeBg: "bg-blue-700 text-white"
  },
  "إداري / كاتب": {
    label: "إداريون وكتاب",
    icon: "📋",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    badgeBg: "bg-purple-700 text-white"
  },
  "عامل نظافة / صيانة": {
    label: "عمال نظافة وصيانة",
    icon: "🧹",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    badgeBg: "bg-teal-700 text-white"
  },
  "متطوع": {
    label: "متطوعون",
    icon: "🤝",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    badgeBg: "bg-amber-700 text-white"
  },
  "أخرى": {
    label: "أخرى",
    icon: "👤",
    bg: "bg-slate-50",
    text: "text-slate-800",
    border: "border-slate-200",
    badgeBg: "bg-slate-700 text-white"
  }
};
