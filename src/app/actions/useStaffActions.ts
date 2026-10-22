/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../../db";
import { Teacher, Class, AppUser } from "../../types";
import { isDirectorRole } from "../../security/access";
import { linkedTeacherIdOf } from "../../security/accountAlignment";
import type { DerivedScope } from "../scope";

export function useStaffActions(s: DerivedScope) {
  const {
    addSysNotification,
    appUsers,
    classes,
    currentRole,
    loadDatabase,
    students,
    teachers,
  } = s;

  // Teacher CRUD Operations
  const handleSaveTeacher = (teacher: Teacher, assignedClassIds?: string[]) => {
    // 1. Save Teacher in DB
    RealmSimDB.saveTeacher(teacher);
    
    // 2. Handle multiple class assignments
    const targetIds = assignedClassIds || [];
    classes.forEach(c => {
      if (targetIds.includes(c.id)) {
        if (c.teacherId !== teacher.id) {
          RealmSimDB.saveClass({ ...c, teacherId: teacher.id });
        }
      } else {
        if (c.teacherId === teacher.id) {
          RealmSimDB.saveClass({ ...c, teacherId: "" });
        }
      }
    });

    addSysNotification(
      "حفظ بيانات معلم",
      `تم حفظ وتحديث ملف المعلم ${teacher.fullName} بنجاح وتعديل فصوله المسندة.`,
      "إداري"
    );
    loadDatabase();
  };

  const handleArchiveTeacherToggle = (teacherId: string) => {
    const teach = teachers.find(t => t.id === teacherId);
    if (teach) {
      const isArchivedNow = !teach.isArchived;
      const updated = { ...teach, isArchived: isArchivedNow };
      RealmSimDB.saveTeacher(updated);
      
      // Suspension / réactivation du compte lié (liens explicites uniquement ;
      // jamais le compte directeur principal). Voir aussi syncAccountsOnArchive.
      if (isDirectorRole(currentRole)) {
        appUsers
          .filter(u => u.id !== "u1" && linkedTeacherIdOf(u) === teach.id)
          .forEach((targetUser) => {
            const updatedUser: AppUser = {
              ...targetUser,
              isActive: !isArchivedNow,
              isArchived: isArchivedNow,
            };
            RealmSimDB.saveAppUser(updatedUser).catch((err) => console.error("Account status sync failed:", err));
          });
      }

      const statusText = isArchivedNow ? "أرشفة" : "تنشيط (إلغاء أرشفة)";
      const userStatusMsg = isArchivedNow 
        ? "وتم إيقاف حسابه في إدارة المستخدمين تلقائياً" 
        : "وتم إعادة تنشيط حسابه في إدارة المستخدمين";
      addSysNotification(
        "تعديل حالة الكادر / المعلم",
        `تم ${statusText} ملف ${teach.fullName} بنجاح، ${userStatusMsg}.`,
        isArchivedNow ? "تنبيه" : "نجاح"
      );
      loadDatabase();
    }
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const teach = teachers.find(t => t.id === teacherId);
    if (teach) {
      if (confirm(`هل أنت متأكد من حذف المعلم ${teach.fullName} نهائياً؟`)) {
        RealmSimDB.deleteTeacher(teacherId);
        
        // Remove teacherId from any assigned classes
        classes.forEach(c => {
          if (c.teacherId === teacherId) {
            RealmSimDB.saveClass({ ...c, teacherId: "" });
          }
        });

        addSysNotification(
          "حذف معلم",
          `تم إزالة ملف المعلم ${teach.fullName} نهائياً من قاعدة البيانات.`,
          "تنبيه"
        );
        loadDatabase();
      }
    }
  };

  // Class CRUD Operations
  const handleSaveClass = (newClass: Class) => {
    RealmSimDB.saveClass(newClass);
    addSysNotification(
      "حفظ بيانات حلقة",
      `تم حفظ وتحديث الفصل الدراسي / الحلقة ${newClass.name} بنجاح.`,
      "إداري"
    );
    loadDatabase();
  };

  const handleArchiveClassToggle = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      const updated = { ...cls, isArchived: !cls.isArchived };
      RealmSimDB.saveClass(updated);
      
      const statusText = updated.isArchived ? "أرشفة" : "تنشيط";
      addSysNotification(
        "تعديل حالة الحلقة",
        `تم ${statusText} حلقة ${cls.name} بنجاح.`,
        "إداري"
      );
      loadDatabase();
    }
  };

  const handleDeleteClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      if (confirm(`هل أنت متأكد من حذف الحلقة ${cls.name} نهائياً؟`)) {
        RealmSimDB.deleteClass(classId);
        
        // Remove classId from students who belonged to this class
        students.forEach(s => {
          if (s.classId === classId) {
            RealmSimDB.saveStudent({ ...s, classId: "" });
          }
        });

        addSysNotification(
          "حذف حلقة دراسية",
          `تم إزالة حلقة ${cls.name} نهائياً من قاعدة البيانات.`,
          "تنبيه"
        );
        loadDatabase();
      }
    }
  };

  return {
    handleSaveTeacher,
    handleArchiveTeacherToggle,
    handleDeleteTeacher,
    handleSaveClass,
    handleArchiveClassToggle,
    handleDeleteClass,
  };
}
