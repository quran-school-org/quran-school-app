/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useState } from "react";
import { Student, Teacher, Class, Attendance, Grade, Payment, Notification, SystemSettings, AppUser, DailyProgress, OtherIncome, SalaryPayment, Expense, ActivityTrip, ActivityParticipant, ActivityExpense } from "../types";

export function useSchoolDataState() {
  // State from LocalStorage database
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<ActivityTrip[]>([]);
  const [activityParticipants, setActivityParticipants] = useState<ActivityParticipant[]>([]);
  const [activityExpenses, setActivityExpenses] = useState<ActivityExpense[]>([]);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState<boolean>(false);
  // Database synchronization states
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("syncing");

  return {
    students,
    setStudents,
    teachers,
    setTeachers,
    classes,
    setClasses,
    attendance,
    setAttendance,
    grades,
    setGrades,
    payments,
    setPayments,
    notifications,
    setNotifications,
    systemSettings,
    setSystemSettings,
    appUsers,
    setAppUsers,
    dailyProgress,
    setDailyProgress,
    otherIncomes,
    setOtherIncomes,
    salaryPayments,
    setSalaryPayments,
    expenses,
    setExpenses,
    activities,
    setActivities,
    activityParticipants,
    setActivityParticipants,
    activityExpenses,
    setActivityExpenses,
    firestoreQuotaExceeded,
    setFirestoreQuotaExceeded,
    syncStatus,
    setSyncStatus,
  };
}
