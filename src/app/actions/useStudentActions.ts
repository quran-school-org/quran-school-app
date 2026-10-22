/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React  from "react";
import { RealmSimDB } from "../../db";
import { Student, AppUser, DailyProgress } from "../../types";
import { isDirectorRole } from "../../security/access";
import { linkedStudentIdsOf } from "../../security/accountAlignment";
import type { DerivedScope } from "../scope";

export function useStudentActions(s: DerivedScope) {
  const {
    activeTeacher,
    addSysNotification,
    appUsers,
    currentRole,
    currentUser,
    editingStudent,
    formBirthDate,
    formClassId,
    formCurrentSurah,
    formDocBirthCert,
    formDocParentId,
    formDocPhotos,
    formFullName,
    formGender,
    formHizbCount,
    formIsArchived,
    formNotes,
    formParentEmail,
    formParentName,
    formParentPhone,
    formPhoto,
    formRegistrationDate,
    formTajweedLevel,
    getMonthsToGenerate,
    getSubscriptionAmount,
    loadDatabase,
    payments,
    progressDate,
    progressMemorization,
    progressNotes,
    progressOldRevision,
    progressRating,
    progressRevision,
    selectedStudent,
    setEditingStudent,
    setFormBirthDate,
    setFormClassId,
    setFormCurrentSurah,
    setFormDocBirthCert,
    setFormDocParentId,
    setFormDocPhotos,
    setFormFullName,
    setFormGender,
    setFormHizbCount,
    setFormIsArchived,
    setFormNotes,
    setFormParentEmail,
    setFormParentName,
    setFormParentPhone,
    setFormPhoto,
    setFormRegistrationDate,
    setFormTajweedLevel,
    setProgressMemorization,
    setProgressNotes,
    setProgressOldRevision,
    setProgressRevision,
    setSelectedStudent,
    setShowStudentModal,
    students,
    teacherSelectedStudent,
  } = s;

  const handleSaveDailyProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherSelectedStudent) return;

    const progressId = `dp_${Date.now()}`;
    const newProgress: DailyProgress = {
      id: progressId,
      studentId: teacherSelectedStudent.id,
      date: progressDate,
      memorizationPart: progressMemorization,
      revisionPart: progressRevision,
      oldRevisionPart: progressOldRevision,
      rating: progressRating,
      notes: progressNotes,
      teacherId: activeTeacher?.id || currentUser?.linkedTeacherId || currentUser?.id || ""
    };

    RealmSimDB.saveDailyProgress(newProgress);

    // Save the student updates as well
    RealmSimDB.saveStudent(teacherSelectedStudent);

    addSysNotification(
      "تسجيل متابعة حفظ",
      `تم تسجيل تقييم ومتابعة الحفظ للطالب(ة) ${teacherSelectedStudent.fullName} بنجاح.`,
      "نجاح"
    );

    // Reset progress inputs
    setProgressMemorization("");
    setProgressRevision("");
    setProgressOldRevision("");
    setProgressNotes("");
    
    // Reload database
    loadDatabase();
  };

  const handleDeleteDailyProgress = (id: string) => {
    RealmSimDB.deleteDailyProgress(id);
    addSysNotification(
      "حذف متابعة حفظ",
      "تم حذف سجل متابعة الحفظ بنجاح.",
      "تنبيه"
    );
    loadDatabase();
  };
  // Student CRUD Operations
  const handleOpenStudentForm = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormFullName(student.fullName || "");
      const photoFromStudent =
        student.photo ||
        student.photoUrl ||
        student.photoURL ||
        student.avatar ||
        student.image ||
        student.picture ||
        "";
      setFormPhoto(photoFromStudent);
      setFormBirthDate(student.birthDate || "");
      setFormRegistrationDate(student.registrationDate || new Date().toISOString().split("T")[0]);
      setFormGender(student.gender || "ذكر");
      setFormParentName(student.parentName || "");
      setFormParentPhone(student.parentPhone || "");
      setFormParentEmail(student.parentEmail || "");
      setFormDocParentId(!!student.docParentId);
      setFormDocBirthCert(!!student.docBirthCert);
      setFormDocPhotos(!!student.docPhotos);
      setFormHizbCount(student.hizbCount !== undefined ? student.hizbCount : 1);
      setFormCurrentSurah(student.currentSurah || "");
      setFormTajweedLevel(student.tajweedLevel || "متوسط");
      setFormNotes(student.notes || "");
      setFormClassId(student.classId || "c1");
      setFormIsArchived(!!student.isArchived);
    } else {
      setEditingStudent(null);
      setFormFullName("");
      setFormPhoto("");
      setFormBirthDate("2014-01-01");
      setFormRegistrationDate(new Date().toISOString().split("T")[0]);
      setFormGender("ذكر");
      setFormParentName("");
      setFormParentPhone("");
      setFormParentEmail("");
      setFormDocParentId(false);
      setFormDocBirthCert(false);
      setFormDocPhotos(false);
      setFormHizbCount(1);
      setFormCurrentSurah("سورة النبأ");
      setFormTajweedLevel("متوسط");
      setFormNotes("");
      setFormClassId("c1");
      setFormIsArchived(false);
    }
    setShowStudentModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nextId = (() => {
      if (editingStudent) return editingStudent.id;
      
      // Calculate next serial number among existing student IDs
      let maxNum = 0;
      students.forEach((s) => {
        const idStr = s.id.toLowerCase();
        const match = idStr.match(/^(s[-_]?)(\d+)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          if (num < 1000000000) { // Ignore timestamps like 1784...
            if (num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      let nextNum = maxNum + 1;
      if (nextNum <= 100) {
        nextNum = 101; // Start from S-101 for elegance
      }
      return `S-${nextNum}`;
    })();

    const studentPhotoValue = formPhoto.trim();

    const newStudent: Student = {
      id: nextId,
      fullName: formFullName,
      photo: studentPhotoValue,
      photoUrl: studentPhotoValue,
      photoURL: studentPhotoValue,
      avatar: studentPhotoValue,
      birthDate: formBirthDate,
      gender: formGender,
      registrationDate: formRegistrationDate || new Date().toISOString().split("T")[0],
      parentName: formParentName,
      parentPhone: formParentPhone,
      parentEmail: formParentEmail,
      docParentId: formDocParentId,
      docBirthCert: formDocBirthCert,
      docPhotos: formDocPhotos,
      hizbCount: Number(formHizbCount),
      currentSurah: formCurrentSurah || "سورة النبأ",
      tajweedLevel: formTajweedLevel,
      notes: formNotes,
      classId: formClassId,
      isArchived: formIsArchived
    };

    RealmSimDB.saveStudent(newStudent);
    
    // Seed blank payments starting from registration date
    if (!editingStudent) {
      const monthsToGen = getMonthsToGenerate(newStudent.registrationDate);
      monthsToGen.forEach((item, idx) => {
        RealmSimDB.savePayment({
          id: `p_new_${newStudent.id}_${idx}`,
          studentId: newStudent.id,
          year: item.year,
          month: item.month,
          amount: getSubscriptionAmount(item.month, item.year),
          paymentDate: "",
          status: "غير مدفوع"
        });
      });
      addSysNotification(
        "تسجيل طالب جديد",
        `تم إضافة الطالب ${newStudent.fullName} بنجاح إلى النظام برقم تعريف (${newStudent.id}) وتخصيص طلبات المدفوعات المستحقة له بدءاً من شهر تسجيله.`,
        "نجاح"
      );
    } else {
      addSysNotification(
        "تعديل بيانات طالب",
        `تم تحديث ملف الطالب ${newStudent.fullName} بنجاح.`,
        "إداري"
      );
    }

    loadDatabase();
    setShowStudentModal(false);
    setSelectedStudent(newStudent);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب ${name} نهائياً؟`)) {
      RealmSimDB.deleteStudent(id);
      addSysNotification("حذف طالب", `تم إزالة ملف الطالب ${name} من قاعدة البيانات.`, "تنبيه");
      loadDatabase();
      setSelectedStudent(null);
    }
  };

  const handleToggleArchiveStudent = (id: string, name: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const isArchivedNow = !student.isArchived;
      const updated = { ...student, isArchived: isArchivedNow };
      RealmSimDB.saveStudent(updated);

      // Suspension / réactivation du compte élève lié (liens explicites uniquement).
      // Le directeur l'applique immédiatement ; pour les autres rôles, la Cloud
      // Function syncAccountsOnArchive s'en charge côté serveur.
      if (isDirectorRole(currentRole)) {
        appUsers
          .filter(u => u.role === "طالب" && linkedStudentIdsOf(u).includes(student.id))
          .forEach((studentUser) => {
            const updatedStudentUser: AppUser = {
              ...studentUser,
              isActive: !isArchivedNow,
              isArchived: isArchivedNow,
            };
            RealmSimDB.saveAppUser(updatedStudentUser).catch((err) => console.error("Account status sync failed:", err));
          });
      }

      addSysNotification(
        isArchivedNow ? "أرشفة ملف طالب" : "تنشيط ملف طالب",
        `تم ${isArchivedNow ? "أرشفة" : "تنشيط (إلغاء أرشفة)"} ملف الطالب ${name} بنجاح، وتم ${isArchivedNow ? "إيقاف" : "تنشيط"} حسابه في المنظومة.`,
        isArchivedNow ? "تنبيه" : "نجاح"
      );
      loadDatabase();
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(updated);
      }
    }
  };

  return {
    handleSaveDailyProgress,
    handleDeleteDailyProgress,
    handleOpenStudentForm,
    handleSaveStudent,
    handleDeleteStudent,
    handleToggleArchiveStudent,
  };
}
