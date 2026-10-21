/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ActivityType, ActivityStatus, ActivityExpenseCategory } from "../../types";



export const ACTIVITY_TYPES: ActivityType[] = [
  "رحلة استكشافية",
  "مخيم قرآني صيفي/ربيعي",
  "نشاط تربوي وثقافي",
  "دوري رياضي",
  "حفل تكريم ومهرجان",
  "زيارة ميدانية ومعرض",
  "أخرى"
];

export const ACTIVITY_STATUSES: ActivityStatus[] = [
  "مخطط له",
  "قيد التسجيل",
  "قيد التنفيذ",
  "مكتمل",
  "ملغى"
];

export const EXPENSE_CATEGORIES: ActivityExpenseCategory[] = [
  "كراء حافلة وتنقل",
  "كراء فضاء أو مزرعة أو مسبح",
  "تغذية ومأكولات ومشروبات",
  "جوائز وشواهد وميداليات",
  "تأمين ورسوم دخول مزارات",
  "عتاد ولوازم تنشيط وورشات",
  "ضيافة وتنقل المؤطرين",
  "أخرى"
];

export const TARGET_AUDIENCE_PRESETS = [
  "الجميع (طلاب، أطر، أولياء أمور)",
  "الطلاب فقط",
  "الطالبات فقط",
  "الطلاب والعاملين",
  "الكوادر والمدرسين فقط",
  "أولياء الأمور",
  "أمهات الطالبات",
  "أطفال التعليم الأولي",
  "عام"
];
