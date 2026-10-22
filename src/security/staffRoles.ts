/**
 * Rôle et droits par défaut déduits de la fiche du personnel (catégorie,
 * intitulé, spécialité). Module pur, partagé par l'interface et les tests.
 */
import type { Teacher, UserRole } from "../types";

// Helper function to smartly determine role and permissions based on staff category and title
export function getRoleAndPermissionsForStaff(teacher: Teacher): {
  role: UserRole;
  canEditStudents: boolean;
  canEditTeachers: boolean;
  canEditGrades: boolean;
  canEditPayments: boolean;
  teacherTakeAttendance: boolean;
  teacherRecordGrades: boolean;
  teacherWriteBehaviorReports: boolean;
  teacherEditOwnStudents: boolean;
  teacherSendAlertsToParents: boolean;
} {
  const cat = (teacher.category || "").trim();
  const title = (teacher.roleTitle || "").trim().toLowerCase();
  const spec = (teacher.specialty || "").trim().toLowerCase();

  // 1. Executive Board & Directors (عضو مكتب تنفيذي / مسير)
  if (cat.includes("مكتب") || cat.includes("مسير") || cat.includes("تنفيذي")) {
    if (title.includes("رئيس") || title.includes("مدير") || title.includes("مسير") || title.includes("عام") || spec.includes("رئيس") || spec.includes("مدير")) {
      return {
        role: "مدير",
        canEditStudents: true,
        canEditTeachers: true,
        canEditGrades: true,
        canEditPayments: true,
        teacherTakeAttendance: true,
        teacherRecordGrades: true,
        teacherWriteBehaviorReports: true,
        teacherEditOwnStudents: true,
        teacherSendAlertsToParents: true,
      };
    }
    // Treasurer (أمين مال)
    if (title.includes("أمين") || title.includes("مال") || title.includes("حساب") || spec.includes("مال")) {
      return {
        role: "إداري",
        canEditStudents: true,
        canEditTeachers: true,
        canEditGrades: true,
        canEditPayments: true,
        teacherTakeAttendance: true,
        teacherRecordGrades: true,
        teacherWriteBehaviorReports: true,
        teacherEditOwnStudents: true,
        teacherSendAlertsToParents: true,
      };
    }
    // Secretary General (الكاتب العام) / Advisors (مستشار) / General Executive Board
    return {
      role: "إداري",
      canEditStudents: true,
      canEditTeachers: true,
      canEditGrades: true,
      canEditPayments: true,
      teacherTakeAttendance: true,
      teacherRecordGrades: true,
      teacherWriteBehaviorReports: true,
      teacherEditOwnStudents: true,
      teacherSendAlertsToParents: true,
    };
  }

  // 2. Administrative & Clerical Staff (إداري / كاتب)
  if (cat.includes("إداري") || cat.includes("كاتب") || title.includes("إداري") || title.includes("كاتب") || spec.includes("إداري") || spec.includes("سكرتار")) {
    return {
      role: "إداري",
      canEditStudents: true,
      canEditTeachers: true,
      canEditGrades: true,
      canEditPayments: true,
      teacherTakeAttendance: true,
      teacherRecordGrades: true,
      teacherWriteBehaviorReports: true,
      teacherEditOwnStudents: true,
      teacherSendAlertsToParents: true,
    };
  }

  // 3. Mentors & Activity Supervisors (مؤطر / مشرف تربوي)
  if (cat.includes("مؤطر") || cat.includes("مشرف") || title.includes("مؤطر") || title.includes("مشرف") || spec.includes("مؤطر") || spec.includes("تأطير")) {
    return {
      role: "مؤطر",
      canEditStudents: true,
      canEditTeachers: false,
      canEditGrades: true,
      canEditPayments: false,
      teacherTakeAttendance: true,
      teacherRecordGrades: true,
      teacherWriteBehaviorReports: true,
      teacherEditOwnStudents: true,
      teacherSendAlertsToParents: true,
    };
  }

  // 4. Volunteers (متطوع) - Explicitly respect the volunteer role
  if (cat.includes("متطوع") || title.includes("متطوع") || spec.includes("تطوع")) {
    return {
      role: "متطوع",
      canEditStudents: false,
      canEditTeachers: false,
      canEditGrades: false,
      canEditPayments: false,
      teacherTakeAttendance: false,
      teacherRecordGrades: false,
      teacherWriteBehaviorReports: false,
      teacherEditOwnStudents: false,
      teacherSendAlertsToParents: false,
    };
  }

  // 5. Cleaning & Maintenance staff (عامل نظافة / صيانة)
  if (cat.includes("نظافة") || cat.includes("صيانة") || title.includes("نظافة") || title.includes("صيانة") || spec.includes("نظافة") || spec.includes("صيانة")) {
    return {
      role: "عامل نظافة / صيانة",
      canEditStudents: false,
      canEditTeachers: false,
      canEditGrades: false,
      canEditPayments: false,
      teacherTakeAttendance: false,
      teacherRecordGrades: false,
      teacherWriteBehaviorReports: false,
      teacherEditOwnStudents: false,
      teacherSendAlertsToParents: false,
    };
  }

  // 6. Other (أخرى)
  if (cat === "أخرى") {
    return {
      role: "أخرى",
      canEditStudents: false,
      canEditTeachers: false,
      canEditGrades: false,
      canEditPayments: false,
      teacherTakeAttendance: false,
      teacherRecordGrades: false,
      teacherWriteBehaviorReports: false,
      teacherEditOwnStudents: false,
      teacherSendAlertsToParents: false,
    };
  }

  // 7. Teachers & Quran instructors (أستاذ / محفظ)
  return {
    role: "مدرس",
    canEditStudents: false,
    canEditTeachers: false,
    canEditGrades: true,
    canEditPayments: false,
    teacherTakeAttendance: true,
    teacherRecordGrades: true,
    teacherWriteBehaviorReports: true,
    teacherEditOwnStudents: true,
    teacherSendAlertsToParents: true,
  };
}

