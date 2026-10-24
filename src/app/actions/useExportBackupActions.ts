/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React  from "react";
import { RealmSimDB } from "../../db";
import type { DerivedScope } from "../scope";
import { csvCell } from "../../utils/csv";

export function useExportBackupActions(s: DerivedScope) {
  const {
    loadDatabase,
    students,
  } = s;

  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      alert("لا توجد بيانات طلاب لتصديرها.");
      return;
    }

    const headers = [
      "معرف الطالب",
      "الاسم الكامل",
      "تاريخ الازدياد",
      "الجنس",
      "تاريخ التسجيل",
      "اسم ولي الأمر",
      "هاتف ولي الأمر",
      "عدد الأحزاب المحفوظة",
      "السورة الحالية",
      "مستوى التجويد",
      "الحالة",
      "الملاحظات"
    ];

    const rows = students.map(s => {
      return [
        s.id,
        s.fullName,
        s.birthDate,
        s.gender,
        s.registrationDate,
        s.parentName || "—",
        s.parentPhone || "—",
        s.hizbCount,
        s.currentSurah || "—",
        s.tajweedLevel,
        s.isArchived ? "مؤرشف" : "نشط",
        s.notes || "—"
      ].map(csvCell);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "نسخة_احتياطية_الطلاب.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudentsJSON = () => {
    if (students.length === 0) {
      alert("لا توجد بيانات طلاب لتصديرها.");
      return;
    }

    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "نسخة_احتياطية_الطلاب.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupRealmDB = () => {
    try {
      const fullBackup = {
        students: RealmSimDB.getStudents(),
        teachers: RealmSimDB.getTeachers(),
        classes: RealmSimDB.getClasses(),
        attendance: RealmSimDB.getAttendance(),
        grades: RealmSimDB.getGrades(),
        payments: RealmSimDB.getPayments(),
        notifications: RealmSimDB.getNotifications(),
        settings: RealmSimDB.getSystemSettings(),
        appUsers: RealmSimDB.getAppUsers(),
        backupDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `نسخة_احتياطية_كاملة_المركز_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء محاولة نسخ البيانات احتياطياً.");
    }
  };

  const handleRestoreRealmDB = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const backupData = JSON.parse(jsonContent);

        // Check if there are some recognizable backup arrays/structures (legacy format, direct localStorage dump, or structured object)
        const isLegacyArray = Array.isArray(backupData) && backupData.length > 0 && (backupData[0].parentName !== undefined || backupData[0].hizbCount !== undefined);
        const isLocalStorageDump = backupData && (backupData.alfajr_students || backupData.alfajr_teachers || backupData.alfajr_classes);
        const isStructuredBackup = backupData && (backupData.students || backupData.teachers || backupData.classes);

        if (!backupData || (!isLegacyArray && !isLocalStorageDump && !isStructuredBackup)) {
          alert("الملف المختار ليس ملف نسخة احتياطية صالحاً أو لا يحتوي على الجداول الأساسية.");
          return;
        }

        const confirmRestore = window.confirm(
          "تنبيه هام! استرجاع النسخة الاحتياطية سيقوم باستبدال جميع البيانات الحالية بالكامل ببيانات ملف النسخ الاحتياطي. هل أنت متأكد من الاستمرار؟"
        );
        if (!confirmRestore) return;

        RealmSimDB.restoreBackup(backupData);
        loadDatabase();
        alert("تم استرجاع النسخة الاحتياطية وتحديث النظام بنجاح! سيتم الآن إعادة تحميل الصفحة لتطبيق التغييرات بشكل كامل.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. يرجى التحقق من صحة الملف بصيغة JSON.");
      }
    };
    reader.readAsText(file);
    // Reset target value so same file can be uploaded again
    event.target.value = "";
  };

  return {
    handleExportStudentsCSV,
    handleExportStudentsJSON,
    handleBackupRealmDB,
    handleRestoreRealmDB,
  };
}
