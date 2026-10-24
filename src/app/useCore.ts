/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useMemo } from "react";
import { RealmSimDB } from "../db";
import { Payment, Notification, NotificationAudience, UserRole } from "../types";
import { isEducatorRole, isOfficeRole } from "../security/access";
import { getSubscriptionAmount as rulesSubscriptionAmount, getMonthsToGenerate as rulesMonthsToGenerate, isMonthBeforeOpening } from "../school/businessRules";
import { DEFAULT_SCHOOL_LABEL } from "./helpers";
import type { BaseScope } from "./scope";

export function useCore(s: BaseScope) {
  const {
    activeSchoolId,
    currentUser,
    schools,
    selectedLabStudentId,
    selectedStudent,
    setActivities,
    setActivityExpenses,
    setActivityParticipants,
    setAppUsers,
    setAttendance,
    setClasses,
    setDailyProgress,
    setExpenses,
    setGrades,
    setNotifications,
    setOtherIncomes,
    setPayments,
    setSalaryPayments,
    setSelectedLabStudentId,
    setSelectedStudent,
    setStudents,
    setSystemSettings,
    setTeachers,
    settingsRef,
    systemSettings,
  } = s;

  // UI state
  const currentRole: UserRole = currentUser?.role || "طالب";
  // Identité et règles métier de l'école active (paramètres de l'école).
  settingsRef.current = systemSettings;
  const activeSchool = useMemo(() => schools.find((sc) => sc.id === activeSchoolId) || null, [schools, activeSchoolId]);
  const schoolName = systemSettings?.associationName?.trim() || activeSchool?.name || DEFAULT_SCHOOL_LABEL;
  const getSubscriptionAmount = (month: string, year: number) => rulesSubscriptionAmount(systemSettings, month, year);
  const getMonthsToGenerate = (registrationDateStr: string) => rulesMonthsToGenerate(systemSettings, registrationDateStr);
  const keepBillable = (list: Payment[]) => list.filter((pay) => !isMonthBeforeOpening(settingsRef.current, pay.month, pay.year));
  const loadDatabase = (roleForMigrations: UserRole | null = currentUser ? currentRole : null) => {
    const s = RealmSimDB.getStudents();
    const t = RealmSimDB.getTeachers();
    const c = RealmSimDB.getClasses();
    const a = RealmSimDB.getAttendance();
    const g = RealmSimDB.getGrades();
    let p = RealmSimDB.getPayments();
    const n = RealmSimDB.getNotifications();

    // Les mois antérieurs à l'ouverture officielle de l'école ne sont pas affichés
    // (paramètre de l'école ; la création des lignes manquantes est faite par
    // une migration idempotente, voir plus haut).
    p = keepBillable(p);

    // Auto-sync activities finances with accounting records (bureau uniquement)
    if (isOfficeRole(roleForMigrations)) {
      RealmSimDB.syncAllActivitiesToFinance();
    }

    setStudents(s);
    setTeachers(t);
    setClasses(c);
    setAttendance(a);
    setGrades(g);
    setPayments(p);
    setNotifications(n);
    setDailyProgress(RealmSimDB.getDailyProgress());
    setOtherIncomes(RealmSimDB.getOtherIncomes());
    setSalaryPayments(RealmSimDB.getSalaryPayments());
    setExpenses(RealmSimDB.getExpenses());
    setActivities(RealmSimDB.getActivities());
    setActivityParticipants(RealmSimDB.getActivityParticipants());
    setActivityExpenses(RealmSimDB.getActivityExpenses());
    
    // Load settings & users
    const settingsObj = RealmSimDB.getSystemSettings();
    const usersList = RealmSimDB.getAppUsers();
    setSystemSettings(settingsObj);
    setAppUsers(usersList);

    // Default student choice for detail panel
    if (s.length > 0 && !selectedStudent) {
      setSelectedStudent(s[0]);
    }
    if (s.length > 0 && !selectedLabStudentId) {
      setSelectedLabStudentId(s[0].id);
    }
  };
  // Helper to trigger automated notifications
  // Destinataires par défaut (D83) : le bureau pour ses propres opérations,
  // la pédagogie pour celles d'un enseignant ou d'un encadrant, tout le
  // personnel pour les autres rôles (seule valeur que les règles leur permettent).
  const addSysNotification = (title: string, message: string, type: "نجاح" | "تنبيه" | "مالي" | "إداري", audience?: NotificationAudience) => {
    const newNotif: Notification = {
      id: "n_" + Date.now(),
      title,
      message,
      date: new Date().toISOString().split("T")[0],
      type,
      isRead: false,
      audience: audience ?? (isOfficeRole(currentRole) ? "office" : isEducatorRole(currentRole) ? "educators" : "staff"),
    };
    RealmSimDB.saveNotification(newNotif);
    setNotifications(RealmSimDB.getNotifications());
  };

  return {
    currentRole,
    activeSchool,
    schoolName,
    getSubscriptionAmount,
    getMonthsToGenerate,
    keepBillable,
    loadDatabase,
    addSysNotification,
  };
}
