export type TajweedLevel = "ممتاز" | "متوسط" | "ضعيف";

export interface Student {
  id: string;
  fullName: string;
  photo: string; // Base64 or avatar URL/placeholder
  photoUrl?: string;
  photoURL?: string;
  avatar?: string;
  image?: string;
  picture?: string;
  birthDate: string;
  gender: "ذكر" | "أنثى";
  registrationDate: string;
  
  // Parent information
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  
  // Administrative documents (الأوراق الإدارية)
  docParentId: boolean; // فوطوكوبي من البطاقة الوطنية لولي الأمر
  docBirthCert: boolean; // عقد ازدياد الطالب
  docPhotos: boolean; // صورتان شمسيتان
  
  // Quran and Tajweed progress
  hizbCount: number; // عدد الأحزاب المحفوظة (من 1 إلى 60)
  currentSurah: string; // السورة الحالية التي يحفظها أو يراجعها
  tajweedLevel: TajweedLevel; // مستوى التجويد
  notes: string;
  
  // Educational & Club grouping
  classId: string; // المعرف الخاص بالفصل الدراسي
  isArchived?: boolean; // هل الطالب مؤرشف
}

export type StaffCategory = 
  | "عضو مكتب تنفيذي / مسير"
  | "أستاذ / محفظ" 
  | "مؤطر / مشرف تربوي" 
  | "إداري / كاتب" 
  | "عامل نظافة / صيانة" 
  | "متطوع" 
  | "أخرى";

export type ContractType = 
  | "تطوعي" 
  | "عقد عمل دائم" 
  | "عقد مؤقت / بالساعة" 
  | "مكافأة شهرية" 
  | "منحة تدريب";

export interface Teacher {
  id: string;
  fullName: string;
  photo: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  specialty: string; // e.g., "تجويد وقراءات", "حفظ وتثبيت", "إدارة وتسيير", "نظافة وصيانة", "تأطير أنشطة"
  trainingCourses?: string[];
  isArchived?: boolean;
  joinedDate: string;
  
  // Personnel & Staff Fields (شؤون العاملين)
  category?: StaffCategory; // الفئة: أستاذ، مؤطر، إداري، عامل نظافة، متطوع...
  roleTitle?: string; // المسمى الوظيفي (مثل: كاتب الجمعية، مؤطر الأنشطة، عون نظافة وصيانة...)
  contractType?: ContractType; // نوع التعاقد أو التطوع
  monthlySalary?: number; // الراتب أو المنحة الشهرية بالدرهم
  cinNumber?: string; // رقم بطاقة التعريف الوطنية (CIN)
  duties?: string; // المهام والمسؤوليات الموكلة
  assignedAreas?: string; // الأماكن أو الفصول أو المرافق المكلف بها
  emergencyContact?: string; // رقم هاتف للطوارئ
  workSchedule?: string; // أوقات وساعات العمل
  birthDate?: string; // تاريخ الازدياد
  address?: string; // عنوان السكن
  isFromSettings?: boolean; // هل السجل مربوط تلقائياً من الإعدادات العامة
  settingsKey?: "generalSupervisor" | "director"; // المفتاح المرتبط في الإعدادات
}

export type StaffMember = Teacher;

export interface Class {
  id: string;
  name: string; // e.g., "فصل النور", "فصل الإيمان"
  teacherId: string;
  schedule: string; // e.g., "السبت والأحد 09:00 - 12:00"
  maxStudents: number;
  isArchived?: boolean;
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: "حاضر" | "غائب" | "متأخر";
  notes?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  examDate: string;
  testedPortion: string; // e.g., "من الحزب 1 إلى 5"
  memorizationGrade: number; // Out of 20 or 100
  tajweedGrade: number; // Out of 20 or 100
  overallGrade: "ممتاز" | "جيد جداً" | "جيد" | "مقبول";
  notes?: string;
  examinerId: string; // المعلم الذي اختبره
}

export interface Payment {
  id: string;
  studentId: string;
  year: number;
  month: string; // e.g., "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"
  amount: number; // المبلغ المدفوع بالدرهم المغربي
  paymentDate: string;
  status: "مدفوع" | "غير مدفوع";
  receiptNo?: string;
  paymentMethod?: "نقداً" | "تحويل بنكي" | "شيك";
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "نجاح" | "تنبيه" | "مالي" | "إداري";
  isRead: boolean;
}

export type UserRole = "مدير" | "إداري" | "مؤطر" | "مدرس" | "متطوع" | "عامل نظافة / صيانة" | "طالب" | "ولي أمر" | "أخرى";

export interface ExecutiveMemberItem {
  id: string;
  fullName: string;
  role: string;
}

export interface SystemSettings {
  associationName: string;
  associationPhone: string;
  associationEmail: string;
  associationAddress: string;
  associationLogo: string;
  generalSupervisorName?: string;
  directorName: string;
  subscriptionFee: number;
  currency: string;
  allowSelfRegistration: boolean;
  showStampOnReceipts: boolean;
  stampText: string;

  // 1. البيانات القانونية والتأسيسية
  foundingDate?: string;
  licenseNumber?: string;
  bankRIB?: string;

  // 2. الهيكلة والتوقيعات الرسمية
  presidentName?: string;
  treasurerName?: string;
  secretaryGeneralName?: string;
  boardMembers?: string;
  executiveBoardMembers?: ExecutiveMemberItem[];

  // 3. إعدادات النّظم والمطبوعات الاحترافية
  activeAcademicSeason?: string;
  mottoVision?: string;
  receiptPrefixFormat?: string;
  internalBylaws?: string;
  footerNotice?: string;

  // 4. Paramètres métier par école (multi-écoles) — voir src/school/businessRules.ts
  // (la cotisation mensuelle par défaut est `subscriptionFee`)
  feeOverrides?: FeeOverride[]; // tarifs particuliers par mois
  openingYear?: number; // ouverture officielle : aucun paiement généré avant
  openingMonth?: string;
  studentAccountMinAge?: number; // âge minimal pour un compte élève (défaut 15)
}

export type ModuleId =
  | "dashboard"
  | "students"
  | "teachers"
  | "attendance"
  | "grades"
  | "payments"
  | "finance"
  | "activities"
  | "classes"
  | "notifications"
  | "id-cards-lab"
  | "settings"
  | "teacher-dashboard"
  | "teacher-students"
  | "student-dashboard"
  | "student-profile"
  | "parent-dashboard"
  | "parent-children";

export type CRUDAction = "read" | "create" | "update" | "delete" | "print";

export interface ModulePermission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
}

export type UserPermissions = Record<string, ModulePermission>;

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  category: "عام" | "المدرسين" | "الطلاب وأولياء الأمور";
  description: string;
}

export const ALL_MODULES: ModuleMeta[] = [
  { id: "dashboard", name: "لوحة البيانات والتحليل", category: "عام", description: "إحصائيات المنظومة ورسوم البيانية" },
  { id: "students", name: "إدارة ملفات الطلاب", category: "عام", description: "سجلات الطلاب، بيانات التجويد والحفظ" },
  { id: "teachers", name: "إدارة شؤون العاملين والمدرسين", category: "عام", description: "تسيير شؤون المحفظين، الإداريين، المؤطرين، عمال النظافة والمتطوعين" },
  { id: "activities", name: "إدارة الأنشطة والرحلات", category: "عام", description: "تنظيم الرحلات، المخيمات، الأنشطة، تسجيل المشاركين والمصاريف والربط المالي" },
  { id: "attendance", name: "تسجيل الحضور والغياب", category: "عام", description: "تحضير يومي وسجلات الغياب والتأخير" },
  { id: "grades", name: "الامتحانات والشهادات", category: "عام", description: "اختبارات الحفظ والتجويد والشهادات" },
  { id: "payments", name: "الرسوم والمدفوعات", category: "عام", description: "رسوم الاشتراكات الشهيرة والوصولات" },
  { id: "finance", name: "المحاسبة والمالية الجمعوية", category: "عام", description: "المداخيل، المصاريف وأجور الأطقم" },
  { id: "classes", name: "الفصول والحلقات الدراسية", category: "عام", description: "توزيع الحلقات والمجموعات والجدولة" },
  { id: "notifications", name: "صندوق الإشعارات", category: "عام", description: "التنبيهات الإدارية والرسائل" },
  { id: "id-cards-lab", name: "معمل بطاقات الهوية", category: "عام", description: "طباعة بطاقات الطالب QR والشارات" },
  { id: "settings", name: "إعدادات النظام وإدارة المستخدمين", category: "عام", description: "بيانات الجمعية والتراخيص والمسؤولين" },
  { id: "teacher-dashboard", name: "لوحة تحكم المعلم", category: "المدرسين", description: "واجهة المعلم لمتابعة الحلقات" },
  { id: "teacher-students", name: "طلاب الحلقة الدراسية", category: "المدرسين", description: "إدارة طلاب الحلقة والمتابعة اليومية" },
  { id: "student-dashboard", name: "لوحة تحكم الطالب", category: "الطلاب وأولياء الأمور", description: "بوابة الطالب لمتابعة التقدم" },
  { id: "student-profile", name: "ملفي الشخصي وسجل الحفظ", category: "الطلاب وأولياء الأمور", description: "مراجعة الأحزاب المحفوظة والشهادات" },
  { id: "parent-dashboard", name: "لوحة تحكم ولي الأمر", category: "الطلاب وأولياء الأمور", description: "بوابة ولي الأمر لمتابعة أبنائه" },
  { id: "parent-children", name: "متابعة أبنائي", category: "الطلاب وأولياء الأمور", description: "سجلات الأبناء والحضور والمدفوعات" },
];

export function getDefaultPermissionsForRole(role: UserRole): UserPermissions {
  const permissions: UserPermissions = {};
  
  ALL_MODULES.forEach((mod) => {
    if (role === "مدير") {
      permissions[mod.id] = { read: true, create: true, update: true, delete: true, print: true };
    } else if (role === "إداري") {
      if (
        mod.id === "dashboard" ||
        mod.id === "students" ||
        mod.id === "teachers" ||
        mod.id === "activities" ||
        mod.id === "attendance" ||
        mod.id === "grades" ||
        mod.id === "payments" ||
        mod.id === "finance" ||
        mod.id === "classes" ||
        mod.id === "notifications" ||
        mod.id === "id-cards-lab"
      ) {
        permissions[mod.id] = { read: true, create: true, update: true, delete: false, print: true };
      } else if (mod.id === "settings") {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "مؤطر") {
      if (
        mod.id === "dashboard" ||
        mod.id === "students" ||
        mod.id === "activities" ||
        mod.id === "attendance" ||
        mod.id === "grades" ||
        mod.id === "classes" ||
        mod.id === "notifications" ||
        mod.id === "id-cards-lab" ||
        mod.id === "teacher-students"
      ) {
        permissions[mod.id] = { read: true, create: true, update: true, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "مدرس") {
      if (
        mod.id === "teacher-dashboard" ||
        mod.id === "teacher-students" ||
        mod.id === "activities" ||
        mod.id === "attendance" ||
        mod.id === "grades" ||
        mod.id === "students" ||
        mod.id === "id-cards-lab"
      ) {
        permissions[mod.id] = { read: true, create: true, update: true, delete: false, print: true };
      } else if (mod.id === "classes" || mod.id === "notifications") {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "طالب") {
      if (
        mod.id === "student-dashboard" ||
        mod.id === "student-profile" ||
        mod.id === "activities" ||
        mod.id === "attendance" ||
        mod.id === "grades" ||
        mod.id === "notifications"
      ) {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "ولي أمر") {
      if (
        mod.id === "parent-dashboard" ||
        mod.id === "parent-children" ||
        mod.id === "activities" ||
        mod.id === "attendance" ||
        mod.id === "grades" ||
        mod.id === "payments" ||
        mod.id === "notifications"
      ) {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "متطوع") {
      if (
        mod.id === "dashboard" ||
        mod.id === "activities" ||
        mod.id === "notifications"
      ) {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "عامل نظافة / صيانة") {
      if (
        mod.id === "dashboard" ||
        mod.id === "notifications"
      ) {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: true };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    } else if (role === "أخرى") {
      if (
        mod.id === "dashboard" ||
        mod.id === "notifications"
      ) {
        permissions[mod.id] = { read: true, create: false, update: false, delete: false, print: false };
      } else {
        permissions[mod.id] = { read: false, create: false, update: false, delete: false, print: false };
      }
    }
  });

  return permissions;
}

export function checkUserPermission(
  user: AppUser | null | undefined,
  role: string,
  moduleId: string,
  action: CRUDAction
): boolean {
  if (!user) return false;
  
  // (Plus de super-utilisateur codé en dur « admin_alfajr » : le super-admin de
  // la plateforme est un claim Firebase, et les droits réels sont imposés par
  // les règles Firestore. Le directeur a tous les droits via son rôle.)

  // If user has specific CRUD matrix permissions object defined
  if (user.permissions) {
    if (user.permissions[moduleId]) {
      const modPerm = user.permissions[moduleId];
      if (modPerm[action] !== undefined) {
        return Boolean(modPerm[action]);
      }
      if (action === "print") {
        return Boolean(modPerm.read);
      }
      return Boolean(modPerm[action]);
    }
    // Module is missing in user's permissions matrix -> fallback to role defaults
    const defaultPerms = getDefaultPermissionsForRole(user.role || (role as UserRole));
    if (defaultPerms && defaultPerms[moduleId]) {
      const defMod = defaultPerms[moduleId];
      if (defMod[action] !== undefined) {
        return Boolean(defMod[action]);
      }
      if (action === "print") {
        return Boolean(defMod.read);
      }
      return Boolean(defMod[action]);
    }
    return false;
  }

  // Fallback / legacy compatibility check for accounts without matrix permissions
  if (role === "مدير") return true;

  if (action === "print") {
    return true;
  }

  switch (moduleId) {
    case "dashboard":
      return action === "read" && (role === "مدير" || role === "إداري" || role === "مؤطر" || Boolean(user.canEditStudents || user.canEditTeachers || user.canEditPayments));
    case "students":
      if (action === "read") return true;
      if (action === "create" || action === "update") return role === "مدير" || role === "إداري" || role === "مؤطر" || Boolean(user.canEditStudents || user.teacherEditOwnStudents);
      if (action === "delete") return role === "مدير";
      break;
    case "teachers":
      if (action === "read") return role === "مدير" || role === "إداري" || Boolean(user.canEditTeachers);
      return role === "مدير" || Boolean(user.canEditTeachers);
    case "attendance":
      if (action === "read") return true;
      if (action === "create" || action === "update") return role === "مدير" || role === "إداري" || role === "مؤطر" || role === "مدرس" || Boolean(user.teacherTakeAttendance);
      return role === "مدير";
    case "grades":
      if (action === "read") return true;
      if (action === "create" || action === "update") return role === "مدير" || role === "إداري" || role === "مؤطر" || role === "مدرس" || Boolean(user.canEditGrades || user.teacherRecordGrades);
      return role === "مدير";
    case "payments":
      if (action === "read") return role === "مدير" || role === "إداري" || role === "ولي أمر" || Boolean(user.canEditPayments || user.parentViewOwnPayments);
      return role === "مدير" || role === "إداري" || Boolean(user.canEditPayments);
    case "finance":
      return role === "مدير" || role === "إداري" || Boolean(user.canEditPayments);
    case "activities":
      if (action === "read") return true;
      if (action === "create" || action === "update") return role === "مدير" || role === "إداري" || role === "مؤطر" || Boolean(user.canEditPayments || user.canEditStudents || user.canEditTeachers);
      if (action === "delete") return role === "مدير";
      return role === "مدير" || role === "إداري" || role === "مؤطر";
    case "classes":
      if (action === "read") return true;
      return role === "مدير" || role === "إداري" || role === "مؤطر" || Boolean(user.canEditTeachers);
    case "notifications":
      if (action === "read") return true;
      return role === "مدير" || role === "إداري";
    case "id-cards-lab":
      return role === "مدير" || role === "إداري" || role === "مؤطر" || Boolean(user.canEditStudents);
    case "settings":
      return role === "مدير";
    case "teacher-dashboard":
    case "teacher-students":
      return role === "مدرس" || role === "مؤطر" || role === "مدير";
    case "student-dashboard":
    case "student-profile":
      return action === "read" && (role === "طالب" || role === "مدير");
    case "parent-dashboard":
    case "parent-children":
      return action === "read" && (role === "ولي أمر" || role === "مدير");
    default:
      return role === "مدير";
  }

  return false;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  // Plus AUCUN mot de passe n'est stocké côté application (Lot 0) :
  // l'authentification est entièrement confiée à Firebase Auth.
  role: UserRole;
  roleTitle?: string;
  category?: StaffCategory;
  isArchived?: boolean;
  isActive: boolean;
  email?: string;
  phone?: string;
  canEditStudents: boolean;
  canEditTeachers: boolean;
  canEditGrades: boolean;
  canEditPayments: boolean;
  lastLogin?: string;
  
  // Teachers permissions
  teacherTakeAttendance?: boolean;
  teacherRecordGrades?: boolean;
  teacherWriteBehaviorReports?: boolean;
  teacherEditOwnStudents?: boolean;
  teacherSendAlertsToParents?: boolean;

  // Students & Parents permissions
  parentViewOwnStats?: boolean;
  parentViewOwnAttendance?: boolean;
  parentViewCertificates?: boolean;
  parentViewOwnPayments?: boolean;
  parentUpdateContactInfo?: boolean;
  parentRegisterInActivities?: boolean;

  // Odoo-Style CRUD Matrix Permissions per module
  permissions?: UserPermissions;

  // Lien avec Firebase Auth et liens explicites (Lot 0)
  authUid?: string; // uid Firebase Auth du compte
  authEmail?: string; // email technique ({username}@alfajr.local)
  mustChangePassword?: boolean; // changement de mot de passe obligatoire à la prochaine connexion
  passwordChangedAt?: string;
  linkedTeacherId?: string; // fiche du personnel liée (rôles du personnel)
  linkedStudentIds?: string[]; // élèves liés (élève : lui-même ; parent : ses enfants)

  // Multi-écoles : un compte = un membre `schools/{schoolId}/members/{uid}` (id = uid)
  uid?: string;
  schoolId?: string;
  legacyAppUserId?: string; // identifiant historique dans appUsers (ex. "u1", "p_S-101")
}

/** Profil global `users/{uid}` (aucun mot de passe). */
export interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  schoolIds: string[];
  lastSchoolId?: string | null;
  mustChangePassword?: boolean;
  passwordChangedAt?: string;
  lastLogin?: string;
}

/** École `schools/{schoolId}`. */
export interface SchoolInfo {
  id: string;
  name: string;
  slug?: string;
  status?: "active" | "suspended";
  createdAt?: string;
}

/** Tarif particulier d'un mois (ex. offre d'ouverture). */
export interface FeeOverride {
  year: number;
  month: string; // nom arabe marocain du mois (يناير … دجنبر)
  amount: number;
}

/**
 * Lien d'autorisation `authLinks/{uid}` lu par les règles Firestore.
 * Écrit uniquement par le script Admin SDK, les Cloud Functions ou un directeur.
 */
export interface AuthLink {
  appUserId: string;
  role: UserRole;
  isActive: boolean;
  username?: string;
  linkedStudentIds?: string[];
  linkedTeacherId?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DailyProgress {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  memorizationPart: string; // الحفظ الجديد (Sabaq)
  revisionPart: string; // المراجعة القريبة (Kum)
  oldRevisionPart?: string; // المراجعة البعيدة (Sabqi)
  rating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف"; // التقييم اليومي
  notes?: string; // ملاحظات المحفظ
  teacherId: string; // معرف المعلم الذي سجل المتابعة
}

export interface OtherIncome {
  id: string;
  title: string;
  category: "تبرعات" | "دعم حكومي/مؤسساتي" | "أنشطة ومهرجانات" | "اشتراكات أعضاء الجمعية" | "أخرى";
  amount: number;
  date: string; // YYYY-MM-DD
  source: "الصندوق" | "حساب الجمعية البنكي";
  donorName?: string;
  receiptNo?: string;
  notes?: string;
}

export interface SalaryPayment {
  id: string;
  personType: "أستاذ / محفظ" | "إطار إداري" | "عامل / مستخدم" | "أخرى";
  personId?: string; // Teacher ID if teacher
  personName: string;
  roleTitle?: string;
  amount: number;
  month: string;
  year: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: "نقداً" | "تحويل بنكي" | "شيك";
  paymentSource: "الصندوق" | "حساب الجمعية البنكي";
  receiptNo?: string;
  status: "تم الصرف" | "مستحق (قيد الانتظار)";
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: "فواتير وخدمات" | "مشتريات وتجهيزات" | "أنشطة وحفلات" | "صيانة وإصلاحات" | "ضيافة وتنقل" | "أخرى";
  amount: number;
  date: string; // YYYY-MM-DD
  source: "الصندوق" | "حساب الجمعية البنكي";
  invoiceNo?: string;
  supplier?: string;
  notes?: string;
}

export type ActivityType =
  | "رحلة استكشافية"
  | "مخيم قرآني صيفي/ربيعي"
  | "نشاط تربوي وثقافي"
  | "دوري رياضي"
  | "حفل تكريم ومهرجان"
  | "زيارة ميدانية ومعرض"
  | "أخرى";

export type ActivityStatus = "مخطط له" | "قيد التسجيل" | "قيد التنفيذ" | "مكتمل" | "ملغى";

export type TargetAudience =
  | "الطلاب فقط"
  | "الطالبات فقط"
  | "الطلاب والعاملين"
  | "الجميع (طلاب، أطر، أولياء أمور)"
  | "الكوادر والمدرسين فقط"
  | "أولياء الأمور"
  | "عام"
  | (string & {});

export interface ActivityTrip {
  id: string;
  title: string;
  type: ActivityType;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  location: string; // المكان أو الوجهة (مثل: شلالات أوزود، مزرعة عين أسردون، القاعة المغطاة...)
  leaderIds: string[]; // معرفات المؤطرين والمشرفين من الأساتذة أو الإداريين
  leaderNames?: string[];
  contributionFee: number; // رسوم المساهمة للشخص بالدرهم
  maxCapacity?: number; // الطاقة الاستيعابية القصوى (مثلاً: 50 مقعداً في الحافلة)
  status: ActivityStatus;
  targetAudience: TargetAudience;
  description?: string;
  programDetails?: string; // تفاصيل البرنامج الزمني والأنشطة المبرمجة
  meetingPoint?: string; // نقطة وساعة الانطلاق والتجمع
  isArchived?: boolean;
  createdAt: string;

  // الربط المالي مع المحاسبة الجمعوية
  syncedToFinance?: boolean;
  syncedFinanceDate?: string;
  syncedIncomeId?: string;
  syncedExpenseId?: string;
  syncedNetBalance?: number;
}

export type ParticipantType =
  | "طالب"
  | "أستاذ / محفظ"
  | "عامل / إداري"
  | "ولي أمر / مرافق"
  | "مشارك خارجي"
  | (string & {});

export type ParticipantPaymentStatus = "مدفوع" | "مدفوع جزئياً" | "غير مدفوع" | "معفى";

export interface ActivityParticipant {
  id: string;
  activityId: string;
  participantType: ParticipantType;
  referenceId?: string; // Student ID or Teacher ID
  fullName: string;
  phone?: string;
  gender?: "ذكر" | "أنثى";
  classId?: string; // For students
  fee: number; // المبلغ المطلوب
  paidAmount: number; // المبلغ المدفوع فعلياً
  paymentStatus: ParticipantPaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: "نقداً" | "تحويل بنكي" | "شيك" | "أخرى";
  receiptNo?: string;
  hasParentApproval?: boolean; // ترخيص ولي الأمر
  medicalNotes?: string; // ملاحظات صحية / حساسية
  notes?: string;
  registeredAt: string;
}

export type ActivityExpenseCategory =
  | "كراء حافلة وتنقل"
  | "كراء فضاء أو مزرعة أو مسبح"
  | "تغذية ومأكولات ومشروبات"
  | "جوائز وشواهد وميداليات"
  | "تأمين ورسوم دخول مزارات"
  | "عتاد ولوازم تنشيط وورشات"
  | "ضيافة وتنقل المؤطرين"
  | "أخرى";

export interface ActivityExpense {
  id: string;
  activityId: string;
  title: string;
  category: ActivityExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: "نقداً" | "تحويل بنكي" | "شيك";
  paidBy?: string; // القائم بالأداء / المسؤول
  receiptOrInvoiceNo?: string;
  supplier?: string; // الشركة أو المورد (مثل: شركة النقل السريع، مزرعة النور)
  notes?: string;
  createdAt: string;
}




