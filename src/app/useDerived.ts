/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useMemo, useCallback } from "react";
import { Student, Payment, UserRole } from "../types";
import { linkedStudentIdsOf, linkedTeacherIdOf } from "../security/accountAlignment";
import { Plus, Search } from "lucide-react";
import { getYearAndMonthFromDate } from "./helpers";
import type { SessionScope } from "./scope";

export function useDerived(s: SessionScope) {
  const {
    attendance,
    classes,
    currentRole,
    currentUser,
    notifications,
    paymentFilterDate,
    paymentFilterStatus,
    paymentSearchQuery,
    paymentSortDir,
    paymentSortKey,
    payments,
    searchQuery,
    studentArchiveFilter,
    students,
    systemSettings,
    teachers,
  } = s;

  // Lot 0 : rattachement EXPLICITE aux élèves (linkedStudentIds, ou identifiant
  // historique s_{id} / p_{id}). Plus aucune correspondance approximative par
  // nom ou téléphone (rapport §10.3).
  const linkedStudentIdSet = useMemo(() => new Set(linkedStudentIdsOf(currentUser)), [currentUser]);

  const loggedStudentId = useMemo(() => {
    if (currentUser && currentRole === "طالب") {
      return linkedStudentIdsOf(currentUser)[0] || "";
    }
    return "";
  }, [currentUser, currentRole]);

  // Helper function to check if student belongs to logged parent or student user
  const isStudentBelongsToUser = useCallback((st: Student, role: UserRole): boolean => {
    if (role === "ولي أمر" || role === "طالب") {
      return linkedStudentIdSet.has(st.id);
    }
    // Personnel : la visibilité est déjà bornée par les règles Firestore.
    return true;
  }, [linkedStudentIdSet]);

  // Filter students based on role or search query
  const filteredStudents = students.filter(st => {
    const matchesSearch = (st.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (st.parentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (st.parentPhone || "").includes(searchQuery);
    
    const isArchived = !!st.isArchived;
    let matchesArchive = true;
    if (studentArchiveFilter === "active") {
      matchesArchive = !isArchived;
    } else if (studentArchiveFilter === "archived") {
      matchesArchive = isArchived;
    }

    const belongs = isStudentBelongsToUser(st, currentRole);

    return matchesSearch && matchesArchive && belongs;
  });

  // Parent children list & stats
  const parentStudents = useMemo(() => {
    if (currentRole !== "ولي أمر") return [];
    return students.filter(st => isStudentBelongsToUser(st, "ولي أمر"));
  }, [students, currentRole, isStudentBelongsToUser]);

  const parentStudentsCount = parentStudents.length;
  const parentTotalHizbs = parentStudents.reduce((acc, s) => acc + s.hizbCount, 0);
  const parentAverageHizb = parentStudentsCount > 0 ? (parentTotalHizbs / parentStudentsCount).toFixed(1) : 0;
  const parentFurthestHizb = parentStudentsCount > 0 ? Math.max(...parentStudents.map(s => Number(s.hizbCount) || 0)) : 0;

  // Single student obj for student role: UNIQUEMENT le dossier lié au compte.
  // (L'ancien repli sur le premier élève actif affichait le dossier d'un autre élève.)
  const currentStudentObj = useMemo(() => {
    if (currentRole !== "طالب" || !loggedStudentId) return null;
    return students.find(st => st.id === loggedStudentId) || null;
  }, [students, currentRole, loggedStudentId]);

  // Account Owner Name & Dynamic First Avatar Letter
  const accountOwnerName = useMemo(() => {
    return currentUser?.fullName || (currentRole === "مدير" ? (systemSettings?.directorName || "مدير النظام") : currentRole === "مدرس" ? "المدرس" : currentRole === "طالب" ? "الطالب" : "ولي الأمر");
  }, [currentRole, systemSettings, currentUser]);

  const userAvatarInitial = useMemo(() => {
    if (!accountOwnerName) return "م";
    const trimmed = accountOwnerName.trim();
    return trimmed ? trimmed.charAt(0) : "م";
  }, [accountOwnerName]);
  const mustChangePassword = Boolean(currentUser?.mustChangePassword);
  // Fiche du personnel liée au compte connecté : lien explicite, identifiant
  // historique t_{id}, ou à défaut nom identique. Plus de repli sur un autre
  // enseignant (« t1 » ou le premier de la liste).
  const activeTeacher = useMemo(() => {
    if (!currentUser) return null;
    const linkedId = linkedTeacherIdOf(currentUser);
    if (linkedId) {
      const byId = teachers.find(t => t.id === linkedId);
      if (byId) return byId;
    }
    const fullName = (currentUser.fullName || "").trim();
    return (fullName && teachers.find(t => (t.fullName || "").trim() === fullName)) || null;
  }, [currentUser, teachers]);

  const teacherClasses = useMemo(() => {
    if (!activeTeacher) return [];
    return classes.filter(c => c.teacherId === activeTeacher.id);
  }, [activeTeacher, classes]);

  const teacherStudents = useMemo(() => {
    if (teacherClasses.length === 0) return [];
    const classIds = teacherClasses.map(c => c.id);
    return students.filter(s => classIds.includes(s.classId) && !s.isArchived);
  }, [teacherClasses, students]);

  // Role-scoped notifications list
  const userNotifications = useMemo(() => {
    if (currentRole === "مدير") {
      return notifications;
    }

    if (currentRole === "ولي أمر") {
      const parentName = currentUser?.fullName || "";
      const childNames = parentStudents.map(s => s.fullName);

      return notifications.filter(n => {
        if (n.title.includes("تسجيل دخول") && !n.message.includes(parentName)) {
          return false;
        }
        if (n.message.includes("admin_alfajr") || n.message.includes("إعدادات الجمعية")) {
          return false;
        }

        const mentionsParent = parentName && (n.title.includes(parentName) || n.message.includes(parentName));
        const mentionsChild = childNames.some(cName => n.title.includes(cName) || n.message.includes(cName));
        const isParentNotice = n.type === "تنبيه" && (n.title.includes("ولي") || n.message.includes("ولي") || n.title.includes("أولياء"));

        return mentionsParent || mentionsChild || isParentNotice;
      });
    }

    if (currentRole === "طالب") {
      const studentName = currentStudentObj ? currentStudentObj.fullName : currentUser?.fullName || "";

      return notifications.filter(n => {
        if (n.title.includes("تسجيل دخول") && !n.message.includes(studentName)) return false;
        if (n.message.includes("admin_alfajr") || n.message.includes("إعدادات الجمعية")) return false;

        const mentionsStudent = studentName && (n.title.includes(studentName) || n.message.includes(studentName));
        const isStudentNotice = n.type === "تنبيه" && (n.title.includes("طالب") || n.message.includes("طالب") || n.title.includes("الطلاب"));

        return mentionsStudent || isStudentNotice;
      });
    }

    if (currentRole === "مدرس") {
      const teacherName = activeTeacher ? activeTeacher.fullName : currentUser?.fullName || "";
      const teacherStudentNames = teacherStudents.map(s => s.fullName);

      return notifications.filter(n => {
        if (n.title.includes("تسجيل دخول") && !n.message.includes(teacherName)) return false;
        if (n.message.includes("admin_alfajr") || n.message.includes("إعدادات الجمعية")) return false;

        const mentionsTeacher = teacherName && (n.title.includes(teacherName) || n.message.includes(teacherName));
        const mentionsStudent = teacherStudentNames.some(sName => n.title.includes(sName) || n.message.includes(sName));
        const isTeacherNotice = n.title.includes("معلم") || n.message.includes("معلم") || n.title.includes("مدرس") || n.type === "نجاح";

        return mentionsTeacher || mentionsStudent || isTeacherNotice;
      });
    }

    return notifications;
  }, [notifications, currentRole, currentUser, parentStudents, currentStudentObj, activeTeacher, teacherStudents]);

  // Global calculations
  const activeStudents = students.filter(s => !s.isArchived);
  const totalStudentsCount = activeStudents.length;
  const advancedStudentsCount = activeStudents.filter(s => s.hizbCount >= 20).length;
  const totalHizbSum = activeStudents.reduce((acc, curr) => acc + curr.hizbCount, 0);
  const averageHizb = totalStudentsCount > 0 ? (totalHizbSum / totalStudentsCount).toFixed(1) : 0;

  const excellentTajweedCount = activeStudents.filter(s => s.tajweedLevel === "ممتاز").length;
  const averageTajweedCount = activeStudents.filter(s => s.tajweedLevel === "متوسط").length;
  const weakTajweedCount = activeStudents.filter(s => s.tajweedLevel === "ضعيف").length;
  const totalTajweedKnown = excellentTajweedCount + averageTajweedCount;
  const tajweedSuccessPercent = totalStudentsCount > 0 ? Math.round((totalTajweedKnown / totalStudentsCount) * 100) : 0;

  const getStudentAttendanceRate = (studentId: string) => {
    const records = attendance.filter(a => a.studentId === studentId);
    if (records.length === 0) return 100;
    const attended = records.filter(r => r.status === "حاضر" || r.status === "متأخر").length;
    return Math.round((attended / records.length) * 100);
  };

  const teacherAverageAttendance = useMemo(() => {
    if (teacherStudents.length === 0) return 100;
    const totalRates = teacherStudents.reduce((sum, s) => sum + getStudentAttendanceRate(s.id), 0);
    return Math.round(totalRates / teacherStudents.length);
  }, [teacherStudents, attendance]);

  const teacherAverageHizb = useMemo(() => {
    if (teacherStudents.length === 0) return 0;
    const totalHizbs = teacherStudents.reduce((sum, s) => sum + s.hizbCount, 0);
    return (totalHizbs / teacherStudents.length).toFixed(1);
  }, [teacherStudents]);

  const furthestHizb = useMemo(() => {
    if (activeStudents.length === 0) return 0;
    return Math.max(...activeStudents.map(s => Number(s.hizbCount) || 0));
  }, [activeStudents]);

  const teacherFurthestHizb = useMemo(() => {
    if (teacherStudents.length === 0) return 0;
    return Math.max(...teacherStudents.map(s => Number(s.hizbCount) || 0));
  }, [teacherStudents]);

  const isStaffOrAdmin = useMemo(() => {
    return ["مدير", "إداري", "مؤطر", "متطوع", "عامل نظافة / صيانة", "أخرى"].includes(currentRole);
  }, [currentRole]);
  
  const filteredPayments = payments.filter(p => {
    const stud = students.find(s => s.id === p.studentId);
    
    // Role based filtering
    if (currentRole === "ولي أمر" || currentRole === "طالب") {
      if (!stud || !isStudentBelongsToUser(stud, currentRole)) {
        return false;
      }
    }

    // Search query
    const matchesSearch = !paymentSearchQuery || 
                          (stud?.fullName || "").toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                          (stud?.parentName || "").toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                          (stud?.parentPhone || "").includes(paymentSearchQuery) ||
                          (p.receiptNo && p.receiptNo.toLowerCase().includes(paymentSearchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = paymentFilterStatus === "all" || p.status === paymentFilterStatus;

    // Year & Month filter via Date picker
    const { year: filterYear, month: filterMonth } = getYearAndMonthFromDate(paymentFilterDate);
    const matchesDate = !paymentFilterDate || (p.year === filterYear && p.month === filterMonth);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPaymentsCollected = useMemo(() => {
    return payments.filter(p => p.status === "مدفوع").reduce((acc, curr) => acc + curr.amount, 0);
  }, [payments]);

  const totalUnpaidCount = useMemo(() => {
    return payments.filter(p => p.status === "غير مدفوع").length;
  }, [payments]);

  const totalUnpaidAmount = useMemo(() => {
    return payments.filter(p => p.status === "غير مدفوع").reduce((acc, curr) => acc + curr.amount, 0);
  }, [payments]);

  const sortedPayments = useMemo(() => {
    let list = [...filteredPayments];
    if (paymentSortKey) {
      list.sort((a, b) => {
        let valA: any = a[paymentSortKey as keyof Payment] || "";
        let valB: any = b[paymentSortKey as keyof Payment] || "";

        if (paymentSortKey === "studentName") {
          const sA = students.find(s => s.id === a.studentId);
          const sB = students.find(s => s.id === b.studentId);
          valA = sA?.fullName || "";
          valB = sB?.fullName || "";
        }

        if (valA < valB) return paymentSortDir === "asc" ? -1 : 1;
        if (valA > valB) return paymentSortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredPayments, paymentSortKey, paymentSortDir, students]);

  const paymentChartData = useMemo(() => {
    const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
    const targetYear = getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear();

    return months_ar.map((month) => {
      const collected = payments
        .filter(p => p.year === targetYear && p.month === month && p.status === "مدفوع")
        .reduce((sum, curr) => sum + curr.amount, 0);

      const unpaid = payments
        .filter(p => p.year === targetYear && p.month === month && p.status === "غير مدفوع")
        .reduce((sum, curr) => sum + curr.amount, 0);

      return {
        name: month,
        "المداخيل المحصلة": collected,
        "المستحقات المعلقة": unpaid,
      };
    });
  }, [payments, paymentFilterDate]);

  return {
    linkedStudentIdSet,
    loggedStudentId,
    isStudentBelongsToUser,
    filteredStudents,
    parentStudents,
    parentStudentsCount,
    parentTotalHizbs,
    parentAverageHizb,
    parentFurthestHizb,
    currentStudentObj,
    accountOwnerName,
    userAvatarInitial,
    mustChangePassword,
    activeTeacher,
    teacherClasses,
    teacherStudents,
    userNotifications,
    activeStudents,
    totalStudentsCount,
    advancedStudentsCount,
    totalHizbSum,
    averageHizb,
    excellentTajweedCount,
    averageTajweedCount,
    weakTajweedCount,
    totalTajweedKnown,
    tajweedSuccessPercent,
    getStudentAttendanceRate,
    teacherAverageAttendance,
    teacherAverageHizb,
    furthestHizb,
    teacherFurthestHizb,
    isStaffOrAdmin,
    filteredPayments,
    totalPaymentsCollected,
    totalUnpaidCount,
    totalUnpaidAmount,
    sortedPayments,
    paymentChartData,
  };
}
