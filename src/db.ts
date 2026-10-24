import { 
  Student, Teacher, Class, Attendance, Grade, Payment, Notification, 
  SystemSettings, AppUser, DailyProgress, OtherIncome, SalaryPayment, 
  Expense, ActivityTrip, ActivityParticipant, ActivityExpense,
} from "./types";
import { saveToFirestore, deleteFromFirestore, saveStaffToFirestore, deleteStaffFromFirestore, setMemberRoleRemote, stripPassword } from "./firebase";
import { clearAllCaches, getCacheScope, hasCacheScope, purgeLegacyAlfajrKeys, scopedKey, setCacheScope } from "./cache/localCache";

export { getRoleAndPermissionsForStaff } from "./security/staffRoles";

/** Drapeaux de droits hérités transmis tels quels aux Cloud Functions. */
export const ACCOUNT_FLAG_KEYS = [
  "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
  "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
  "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
] as const;

// Key definitions for LocalStorage
const STORAGE_KEYS = {
  STUDENTS: "students",
  TEACHERS: "teachers",
  CLASSES: "classes",
  ATTENDANCE: "attendance",
  GRADES: "grades",
  PAYMENTS: "payments",
  NOTIFICATIONS: "notifications",
  SETTINGS_SYSTEM: "settings_system",
  SETTINGS_USERS: "settings_users",
  DAILY_PROGRESS: "daily_progress",
  OTHER_INCOMES: "other_incomes",
  SALARY_PAYMENTS: "salary_payments",
  EXPENSES: "expenses",
  ACTIVITIES: "activities",
  ACTIVITY_PARTICIPANTS: "activity_participants",
  ACTIVITY_EXPENSES: "activity_expenses",
};

const INITIAL_SETTINGS_SYSTEM: SystemSettings = {
  associationName: "",
  associationPhone: "",
  associationEmail: "",
  associationAddress: "",
  associationLogo: "",
  generalSupervisorName: "",
  directorName: "",
  subscriptionFee: 0,
  currency: "درهم مغربي",
  allowSelfRegistration: true,
  showStampOnReceipts: true,
  stampText: "",

  // 1. البيانات القانونية والتأسيسية
  foundingDate: "",
  licenseNumber: "",
  bankRIB: "",

  // 2. الهيكلة والتوقيعات الرسمية
  presidentName: "",
  treasurerName: "",
  secretaryGeneralName: "",
  boardMembers: "",
  executiveBoardMembers: [],

  // 3. إعدادات النّظم والمطبوعات الاحترافية
  activeAcademicSeason: "2026/2027",
  mottoVision: "",
  receiptPrefixFormat: "REC-{YEAR}-{NO}",
  internalBylaws: "",
  footerNotice: "",
};

const INITIAL_SETTINGS_USERS: AppUser[] = [];
const INITIAL_OTHER_INCOMES: OtherIncome[] = [];
const INITIAL_SALARY_PAYMENTS: SalaryPayment[] = [];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_TEACHERS: Teacher[] = [];
const INITIAL_CLASSES: Class[] = [];
const INITIAL_STUDENTS: Student[] = [];
const INITIAL_ATTENDANCE: Attendance[] = [];
const INITIAL_GRADES: Grade[] = [];
const INITIAL_PAYMENTS: Payment[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];
// Plus aucune donnée de démonstration n'est injectée (multi-écoles) : une
// école vide reste vide.
const INITIAL_ACTIVITIES: ActivityTrip[] = [];
const INITIAL_ACTIVITY_PARTICIPANTS: ActivityParticipant[] = [];
const INITIAL_ACTIVITY_EXPENSES: ActivityExpense[] = [];

// Helper to sanitize data stored in LocalStorage to prevent quota errors
function sanitizeForLocalStorage(key: string, data: any): any {
  if (!data) return data;
  if (key === STORAGE_KEYS.NOTIFICATIONS) {
    if (Array.isArray(data)) {
      return data.slice(-20);
    }
  }
  return data;
}

// Lecture / écriture du cache local, cloisonné par école (kuttab:{schoolId}:{nom}).
// Une clé absente renvoie la valeur par défaut SANS l'écrire.
function getStoredData<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const data = localStorage.getItem(scopedKey(key));
  if (!data) return [...seed];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing key ${key}`, e);
    return [...seed];
  }
}

function setStoredData<T>(key: string, data: T[]): void {
  if (typeof window !== "undefined" && hasCacheScope()) {
    try {
      const sanitizedData = sanitizeForLocalStorage(key, data);
      localStorage.setItem(scopedKey(key), JSON.stringify(sanitizedData));
    } catch (e) {
      console.error(`Error saving to LocalStorage key ${key}:`, e);
    }
  }
}

function getStoredItem<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  const data = localStorage.getItem(scopedKey(key));
  if (!data) return { ...(seed as any) };
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing key ${key}`, e);
    return { ...(seed as any) };
  }
}

function setStoredItem<T>(key: string, data: T): void {
  if (typeof window !== "undefined" && hasCacheScope()) {
    try {
      const sanitizedData = sanitizeForLocalStorage(key, data);
      localStorage.setItem(scopedKey(key), JSON.stringify(sanitizedData));
    } catch (e) {
      console.error(`Error saving to LocalStorage key ${key}:`, e);
    }
  }
}

/** École active : préfixe des chemins Firestore et du cache local. */
export function setActiveSchool(schoolId: string | null): void {
  setCacheScope(schoolId);
}

export function getActiveSchool(): string | null {
  return getCacheScope();
}

function sid(): string {
  const schoolId = getCacheScope();
  if (!schoolId) throw new Error("Aucune école sélectionnée.");
  return schoolId;
}

// Les utilitaires de noms d'utilisateur sont purs (sans Firebase) pour être
// réutilisables par les scripts d'administration Node.
export {
  translitArabicToEnglish,
  generateUniqueUsername,
  getUsernameForTeacher,
  getUsernameForParent,
  getUsernameForStudent,
} from "./utils/usernames";

// RealmDB-like interface wrapping LocalStorage
export const RealmSimDB = {
  // --- Students ---
  getStudents(): Student[] {
    return getStoredData(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  saveStudent(student: Student): void {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    setStoredData(STORAGE_KEYS.STUDENTS, students);
    saveToFirestore(sid(), "students", student.id, student);
    // Lot 0 : plus aucune création automatique de compte (parent / élève) depuis
    // le navigateur. Les comptes sont créés explicitement par un directeur
    // (Paramètres > المستخدمين) via la Cloud Function createUserAccount.
  },
  deleteStudent(id: string): void {
    const students = this.getStudents().filter((s) => s.id !== id);
    setStoredData(STORAGE_KEYS.STUDENTS, students);
    deleteFromFirestore(sid(), "students", id);
    // Les comptes liés ne sont plus supprimés implicitement (action du directeur).
  },

  // --- Teachers ---
  getTeachers(): Teacher[] {
    return getStoredData(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  },
  saveTeacher(teacher: Teacher): void {
    const teachers = this.getTeachers();
    const index = teachers.findIndex((t) => t.id === teacher.id);
    if (index >= 0) {
      teachers[index] = teacher;
    } else {
      teachers.push(teacher);
    }
    setStoredData(STORAGE_KEYS.TEACHERS, teachers);
    // Fiche publique (teachers) + fiche RH (staffPrivate), voir D42.
    saveStaffToFirestore(sid(), teacher);
    // Lot 0 : le compte lié n'est plus créé ni réécrit automatiquement. La
    // suspension à l'archivage est faite par la Cloud Function
    // syncAccountsOnArchive (et par le directeur depuis l'interface).
  },
  deleteTeacher(id: string): void {
    const teachers = this.getTeachers().filter((t) => t.id !== id);
    setStoredData(STORAGE_KEYS.TEACHERS, teachers);
    deleteStaffFromFirestore(sid(), id);
  },

  // --- Classes ---
  getClasses(): Class[] {
    return getStoredData(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClass(cls: Class): void {
    const classes = this.getClasses();
    const index = classes.findIndex((c) => c.id === cls.id);
    if (index >= 0) {
      classes[index] = cls;
    } else {
      classes.push(cls);
    }
    setStoredData(STORAGE_KEYS.CLASSES, classes);
    saveToFirestore(sid(), "classes", cls.id, cls);
  },
  deleteClass(id: string): void {
    const classes = this.getClasses().filter((c) => c.id !== id);
    setStoredData(STORAGE_KEYS.CLASSES, classes);
    deleteFromFirestore(sid(), "classes", id);
  },

  // --- Attendance ---
  getAttendance(): Attendance[] {
    return getStoredData(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  saveAttendance(attendance: Attendance): void {
    const records = this.getAttendance();
    const index = records.findIndex(
      (r) => r.date === attendance.date && r.studentId === attendance.studentId
    );
    if (index >= 0) {
      records[index] = attendance;
    } else {
      records.push(attendance);
    }
    setStoredData(STORAGE_KEYS.ATTENDANCE, records);
    saveToFirestore(sid(), "attendance", attendance.id, attendance);
  },
  saveMultipleAttendance(attendanceList: Attendance[]): void {
    const records = this.getAttendance();
    attendanceList.forEach((att) => {
      const idx = records.findIndex((r) => r.date === att.date && r.studentId === att.studentId);
      if (idx >= 0) {
        records[idx] = att;
      } else {
        records.push(att);
      }
      saveToFirestore(sid(), "attendance", att.id, att);
    });
    setStoredData(STORAGE_KEYS.ATTENDANCE, records);
  },

  // --- Grades ---
  getGrades(): Grade[] {
    return getStoredData(STORAGE_KEYS.GRADES, INITIAL_GRADES);
  },
  saveGrade(grade: Grade): void {
    const grades = this.getGrades();
    const index = grades.findIndex((g) => g.id === grade.id);
    if (index >= 0) {
      grades[index] = grade;
    } else {
      grades.push(grade);
    }
    setStoredData(STORAGE_KEYS.GRADES, grades);
    saveToFirestore(sid(), "grades", grade.id, grade);
  },
  deleteGrade(id: string): void {
    const grades = this.getGrades().filter((g) => g.id !== id);
    setStoredData(STORAGE_KEYS.GRADES, grades);
    deleteFromFirestore(sid(), "grades", id);
  },

  // --- Payments ---
  getPayments(): Payment[] {
    return getStoredData(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },
  savePayment(payment: Payment): void {
    const payments = this.getPayments();
    const index = payments.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    setStoredData(STORAGE_KEYS.PAYMENTS, payments);
    saveToFirestore(sid(), "payments", payment.id, payment);
  },
  deletePayment(id: string): void {
    const payments = this.getPayments().filter((p) => p.id !== id);
    setStoredData(STORAGE_KEYS.PAYMENTS, payments);
    deleteFromFirestore(sid(), "payments", id);
  },
  saveMultiplePayments(paymentsList: Payment[]): void {
    const payments = this.getPayments();
    paymentsList.forEach((pay) => {
      const idx = payments.findIndex((p) => p.id === pay.id);
      if (idx >= 0) {
        payments[idx] = pay;
      } else {
        payments.push(pay);
      }
      saveToFirestore(sid(), "payments", pay.id, pay);
    });
    setStoredData(STORAGE_KEYS.PAYMENTS, payments);
  },

  // --- Notifications ---
  getNotifications(): Notification[] {
    return getStoredData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotification(notification: Notification): void {
    const list = this.getNotifications();
    list.unshift(notification); // add to the beginning
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, list);
    saveToFirestore(sid(), "notifications", notification.id, notification);
  },
  markNotificationAsRead(id: string): void {
    const list = this.getNotifications().map((n) => {
      if (n.id === id) {
        const updated = { ...n, isRead: true };
        saveToFirestore(sid(), "notifications", id, updated);
        return updated;
      }
      return n;
    });
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  clearAllNotifications(): void {
    const list = this.getNotifications();
    list.forEach(n => deleteFromFirestore(sid(), "notifications", n.id));
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  restoreBackup(backupData: any): void {
    if (!backupData) return;

    // 1. Direct array backup (legacy student backup format)
    if (Array.isArray(backupData)) {
      if (backupData.length > 0 && (backupData[0].parentName !== undefined || backupData[0].hizbCount !== undefined)) {
        setStoredData(STORAGE_KEYS.STUDENTS, backupData);
      }
      return;
    }

    // 2. Raw localStorage keys dump format
    if (backupData.alfajr_students || backupData.alfajr_teachers || backupData.alfajr_classes) {
      if (backupData.alfajr_students && Array.isArray(backupData.alfajr_students)) {
        setStoredData(STORAGE_KEYS.STUDENTS, backupData.alfajr_students);
      }
      if (backupData.alfajr_teachers && Array.isArray(backupData.alfajr_teachers)) {
        setStoredData(STORAGE_KEYS.TEACHERS, backupData.alfajr_teachers);
      }
      if (backupData.alfajr_classes && Array.isArray(backupData.alfajr_classes)) {
        setStoredData(STORAGE_KEYS.CLASSES, backupData.alfajr_classes);
      }
      if (backupData.alfajr_attendance && Array.isArray(backupData.alfajr_attendance)) {
        setStoredData(STORAGE_KEYS.ATTENDANCE, backupData.alfajr_attendance);
      }
      if (backupData.alfajr_grades && Array.isArray(backupData.alfajr_grades)) {
        setStoredData(STORAGE_KEYS.GRADES, backupData.alfajr_grades);
      }
      if (backupData.alfajr_payments && Array.isArray(backupData.alfajr_payments)) {
        setStoredData(STORAGE_KEYS.PAYMENTS, backupData.alfajr_payments);
      }
      if (backupData.alfajr_notifications && Array.isArray(backupData.alfajr_notifications)) {
        setStoredData(STORAGE_KEYS.NOTIFICATIONS, backupData.alfajr_notifications);
      }
      return;
    }

    // 3. Structured full backup object format
    if (backupData.students && Array.isArray(backupData.students)) {
      setStoredData(STORAGE_KEYS.STUDENTS, backupData.students);
    }
    if (backupData.teachers && Array.isArray(backupData.teachers)) {
      setStoredData(STORAGE_KEYS.TEACHERS, backupData.teachers);
    }
    if (backupData.classes && Array.isArray(backupData.classes)) {
      setStoredData(STORAGE_KEYS.CLASSES, backupData.classes);
    }
    if (backupData.attendance && Array.isArray(backupData.attendance)) {
      setStoredData(STORAGE_KEYS.ATTENDANCE, backupData.attendance);
    }
    if (backupData.grades && Array.isArray(backupData.grades)) {
      setStoredData(STORAGE_KEYS.GRADES, backupData.grades);
    }
    if (backupData.payments && Array.isArray(backupData.payments)) {
      setStoredData(STORAGE_KEYS.PAYMENTS, backupData.payments);
    }
    if (backupData.notifications && Array.isArray(backupData.notifications)) {
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, backupData.notifications);
    }
    if (backupData.settings && typeof backupData.settings === "object") {
      setStoredItem(STORAGE_KEYS.SETTINGS_SYSTEM, backupData.settings);
    }
    if (backupData.appUsers && Array.isArray(backupData.appUsers)) {
      setStoredData(STORAGE_KEYS.SETTINGS_USERS, backupData.appUsers.map((u: AppUser) => stripPassword(u)));
    }
  },
  getSystemSettings(): SystemSettings {
    // (L'ancien remplacement automatique « طنجة → سلا », propre à Al Fajr, est supprimé.)
    return getStoredItem(STORAGE_KEYS.SETTINGS_SYSTEM, INITIAL_SETTINGS_SYSTEM);
  },
  saveSystemSettings(settings: SystemSettings): void {
    setStoredItem(STORAGE_KEYS.SETTINGS_SYSTEM, settings);
    saveToFirestore(sid(), "settings", "system", settings);
  },
  /**
   * Mise à jour PARTIELLE des paramètres (constat F1) : seuls les champs donnés
   * sont écrits (fusion Firestore). Sert aux synchronisations automatiques
   * (nom du directeur) qui ne doivent jamais recopier tout l'objet : s'il n'est
   * pas encore arrivé du serveur, ce seraient les valeurs par défaut.
   */
  updateSystemSettingsFields(fields: Partial<SystemSettings>): void {
    setStoredItem(STORAGE_KEYS.SETTINGS_SYSTEM, { ...this.getSystemSettings(), ...fields });
    saveToFirestore(sid(), "settings", "system", fields);
  },
  getAppUsers(): AppUser[] {
    // Lot 0 : liste telle que synchronisée depuis Firestore (bureau uniquement),
    // sans aucune synthèse de comptes ni écriture. Les mots de passe hérités
    // éventuellement présents dans un vieux cache sont retirés.
    const savedUsers = getStoredData<AppUser>(STORAGE_KEYS.SETTINGS_USERS, INITIAL_SETTINGS_USERS);
    const cleaned = savedUsers.map((u) => stripPassword(u));
    if (cleaned.some((u, i) => u !== savedUsers[i])) {
      setStoredData(STORAGE_KEYS.SETTINGS_USERS, cleaned);
    }
    return cleaned;
  },
  /**
   * Enregistre un compte existant de l'école (membre). Passe par la Cloud
   * Function setMemberRole (directeur de l'école ou super-admin) : rôle,
   * statut, droits et liens explicites. Aucun mot de passe.
   */
  async saveAppUser(user: AppUser): Promise<void> {
    const clean = stripPassword(user);
    const list = this.getAppUsers();
    const idx = list.findIndex(u => u.id === clean.id);
    if (idx >= 0) {
      list[idx] = clean;
    } else {
      list.push(clean);
    }
    setStoredData(STORAGE_KEYS.SETTINGS_USERS, list);
    const flags: Record<string, boolean> = {};
    for (const k of ACCOUNT_FLAG_KEYS) {
      const v = (clean as any)[k];
      if (typeof v === "boolean") flags[k] = v;
    }
    await setMemberRoleRemote(sid(), clean.id, {
      fullName: clean.fullName,
      role: clean.role,
      isActive: clean.isActive !== false,
      isArchived: Boolean(clean.isArchived),
      phone: clean.phone,
      email: clean.email,
      permissions: clean.permissions,
      linkedTeacherId: clean.linkedTeacherId || null,
      linkedStudentIds: clean.linkedStudentIds || [],
      roleTitle: clean.roleTitle || null,
      category: clean.category || null,
      flags,
    });
  },
  /** Retire un compte de l'école (le compte global n'est pas supprimé). */
  async deleteAppUser(userId: string): Promise<void> {
    const all = this.getAppUsers();
    setStoredData(STORAGE_KEYS.SETTINGS_USERS, all.filter(u => u.id !== userId));
    await setMemberRoleRemote(sid(), userId, {}, true);
  },
  /** Remplace le cache local des comptes (après création via Cloud Function). */
  setCachedAppUsers(users: AppUser[]): void {
    setStoredData(STORAGE_KEYS.SETTINGS_USERS, users.map((u) => stripPassword(u)));
  },
  getDailyProgress(): DailyProgress[] {
    return getStoredData(STORAGE_KEYS.DAILY_PROGRESS, []);
  },
  saveDailyProgress(progress: DailyProgress): void {
    const list = this.getDailyProgress();
    const idx = list.findIndex(p => p.id === progress.id);
    if (idx >= 0) {
      list[idx] = progress;
    } else {
      list.push(progress);
    }
    setStoredData(STORAGE_KEYS.DAILY_PROGRESS, list);
    saveToFirestore(sid(), "dailyProgress", progress.id, progress);
  },
  deleteDailyProgress(id: string): void {
    const list = this.getDailyProgress().filter(p => p.id !== id);
    setStoredData(STORAGE_KEYS.DAILY_PROGRESS, list);
    deleteFromFirestore(sid(), "dailyProgress", id);
  },

  // --- Other Incomes ---
  getOtherIncomes(): OtherIncome[] {
    return getStoredData(STORAGE_KEYS.OTHER_INCOMES, INITIAL_OTHER_INCOMES);
  },
  saveOtherIncome(income: OtherIncome): void {
    const list = this.getOtherIncomes();
    const idx = list.findIndex(item => item.id === income.id);
    if (idx >= 0) {
      list[idx] = income;
    } else {
      list.push(income);
    }
    setStoredData(STORAGE_KEYS.OTHER_INCOMES, list);
    saveToFirestore(sid(), "otherIncomes", income.id, income);
  },
  deleteOtherIncome(id: string): void {
    const list = this.getOtherIncomes().filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.OTHER_INCOMES, list);
    deleteFromFirestore(sid(), "otherIncomes", id);
  },

  // --- Salary Payments ---
  getSalaryPayments(): SalaryPayment[] {
    return getStoredData(STORAGE_KEYS.SALARY_PAYMENTS, INITIAL_SALARY_PAYMENTS);
  },
  saveSalaryPayment(salary: SalaryPayment): void {
    const list = this.getSalaryPayments();
    const idx = list.findIndex(item => item.id === salary.id);
    if (idx >= 0) {
      list[idx] = salary;
    } else {
      list.push(salary);
    }
    setStoredData(STORAGE_KEYS.SALARY_PAYMENTS, list);
    saveToFirestore(sid(), "salaryPayments", salary.id, salary);
  },
  deleteSalaryPayment(id: string): void {
    const list = this.getSalaryPayments().filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.SALARY_PAYMENTS, list);
    deleteFromFirestore(sid(), "salaryPayments", id);
  },

  // --- Operational Expenses ---
  getExpenses(): Expense[] {
    return getStoredData(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  saveExpense(expense: Expense): void {
    const list = this.getExpenses();
    const idx = list.findIndex(item => item.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.push(expense);
    }
    setStoredData(STORAGE_KEYS.EXPENSES, list);
    saveToFirestore(sid(), "expenses", expense.id, expense);
  },
  deleteExpense(id: string): void {
    const list = this.getExpenses().filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.EXPENSES, list);
    deleteFromFirestore(sid(), "expenses", id);
  },

  // --- Activities & Trips Management (إدارة الأنشطة والرحلات) ---
  getActivities(): ActivityTrip[] {
    return getStoredData(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  },
  saveActivity(activity: ActivityTrip): void {
    const list = this.getActivities();
    const idx = list.findIndex(item => item.id === activity.id);
    if (idx >= 0) {
      list[idx] = activity;
    } else {
      list.push(activity);
    }
    setStoredData(STORAGE_KEYS.ACTIVITIES, list);
    saveToFirestore(sid(), "activities", activity.id, activity);
    this.syncAllActivitiesToFinance();
  },
  deleteActivity(id: string): void {
    const list = this.getActivities().filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.ACTIVITIES, list);
    deleteFromFirestore(sid(), "activities", id);

    // Also delete associated participants and expenses
    const participants = this.getActivityParticipants().filter(p => p.activityId === id);
    participants.forEach(p => this.deleteActivityParticipant(p.id));

    const expenses = this.getActivityExpenses().filter(e => e.activityId === id);
    expenses.forEach(e => this.deleteActivityExpense(e.id));

    this.syncAllActivitiesToFinance();
  },

  // --- Activity Participants (تسجيل المشاركين في النشاط/الرحلة) ---
  getActivityParticipants(activityId?: string): ActivityParticipant[] {
    const list = getStoredData<ActivityParticipant>(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, INITIAL_ACTIVITY_PARTICIPANTS);
    if (activityId) {
      return list.filter(p => p.activityId === activityId);
    }
    return list;
  },
  saveActivityParticipant(participant: ActivityParticipant): void {
    const list = getStoredData<ActivityParticipant>(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, INITIAL_ACTIVITY_PARTICIPANTS);
    const idx = list.findIndex(item => item.id === participant.id);
    if (idx >= 0) {
      list[idx] = participant;
    } else {
      list.push(participant);
    }
    setStoredData(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, list);
    saveToFirestore(sid(), "activityParticipants", participant.id, participant);
    this.syncAllActivitiesToFinance();
  },
  deleteActivityParticipant(id: string): void {
    const list = getStoredData<ActivityParticipant>(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, INITIAL_ACTIVITY_PARTICIPANTS).filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, list);
    deleteFromFirestore(sid(), "activityParticipants", id);
    this.syncAllActivitiesToFinance();
  },

  // --- Activity Expenses (مصاريف النشاط/الرحلة) ---
  getActivityExpenses(activityId?: string): ActivityExpense[] {
    const list = getStoredData<ActivityExpense>(STORAGE_KEYS.ACTIVITY_EXPENSES, INITIAL_ACTIVITY_EXPENSES);
    if (activityId) {
      return list.filter(e => e.activityId === activityId);
    }
    return list;
  },
  saveActivityExpense(expense: ActivityExpense): void {
    const list = getStoredData<ActivityExpense>(STORAGE_KEYS.ACTIVITY_EXPENSES, INITIAL_ACTIVITY_EXPENSES);
    const idx = list.findIndex(item => item.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.push(expense);
    }
    setStoredData(STORAGE_KEYS.ACTIVITY_EXPENSES, list);
    saveToFirestore(sid(), "activityExpenses", expense.id, expense);
    this.syncAllActivitiesToFinance();
  },
  deleteActivityExpense(id: string): void {
    const list = getStoredData<ActivityExpense>(STORAGE_KEYS.ACTIVITY_EXPENSES, INITIAL_ACTIVITY_EXPENSES).filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.ACTIVITY_EXPENSES, list);
    deleteFromFirestore(sid(), "activityExpenses", id);
    this.syncAllActivitiesToFinance();
  },

  // --- Automatic Live Financial Synchronization with Association Accounting ---
  syncAllActivitiesToFinance(): void {
    const activities = getStoredData<ActivityTrip>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    const allParticipants = getStoredData<ActivityParticipant>(STORAGE_KEYS.ACTIVITY_PARTICIPANTS, INITIAL_ACTIVITY_PARTICIPANTS);
    const allExpenses = getStoredData<ActivityExpense>(STORAGE_KEYS.ACTIVITY_EXPENSES, INITIAL_ACTIVITY_EXPENSES);
    const today = new Date().toISOString().split("T")[0];

    let otherIncomes = getStoredData<OtherIncome>(STORAGE_KEYS.OTHER_INCOMES, INITIAL_OTHER_INCOMES);
    let expenses = getStoredData<Expense>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    let incomesModified = false;
    let expensesModified = false;
    let activitiesModified = false;


    // 1. Remove synthetic legacy sync records from otherIncomes and expenses
    const prevIncomesCount = otherIncomes.length;
    otherIncomes = otherIncomes.filter(inc => {
      if (inc.id.startsWith("inc_act_")) {
        deleteFromFirestore(sid(), "otherIncomes", inc.id);
        return false;
      }
      return true;
    });
    if (otherIncomes.length !== prevIncomesCount) incomesModified = true;

    const prevExpensesCount = expenses.length;
    expenses = expenses.filter(exp => {
      if (exp.id.startsWith("exp_sync_act_")) {
        deleteFromFirestore(sid(), "expenses", exp.id);
        return false;
      }
      return true;
    });
    if (expenses.length !== prevExpensesCount) expensesModified = true;

    // 2. Mark activities as synced with their live financial calculations
    activities.forEach(act => {
      const actParticipants = allParticipants.filter(p => p.activityId === act.id);
      const actExpenses = allExpenses.filter(e => e.activityId === act.id);

      const totalCollected = actParticipants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const totalSpent = actExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const netBalance = totalCollected - totalSpent;

      act.syncedToFinance = true;
      act.syncedFinanceDate = today;
      act.syncedNetBalance = netBalance;
      act.syncedIncomeId = undefined;
      act.syncedExpenseId = undefined;
      activitiesModified = true;
    });

    if (incomesModified) {
      setStoredData(STORAGE_KEYS.OTHER_INCOMES, otherIncomes);
    }
    if (expensesModified) {
      setStoredData(STORAGE_KEYS.EXPENSES, expenses);
    }
    if (activitiesModified) {
      setStoredData(STORAGE_KEYS.ACTIVITIES, activities);
    }
  }
};

// ---------------------------------------------------------------------------
// Hygiène du cache local (faille S6)
// ---------------------------------------------------------------------------
const CACHE_OWNER_KEY = "kuttab:owner";

/** Vide tout le cache local (déconnexion). */
export function clearLocalCache(): void {
  clearAllCaches();
  try {
    localStorage.removeItem(CACHE_OWNER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Le cache local appartient à un seul compte : s'il a été rempli par un autre
 * utilisateur (PC partagé de l'école), il est purgé avant d'afficher quoi que ce soit.
 */
export function ensureCacheOwner(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(CACHE_OWNER_KEY) !== uid) {
      clearAllCaches();
      localStorage.setItem(CACHE_OWNER_KEY, uid);
    }
  } catch (e) {
    console.error("Error checking cache owner:", e);
  }
}

/**
 * Supprime au démarrage les clés de la version mono-école (`alfajr_*`), dont la
 * session complète avec mot de passe et le cache des comptes en clair.
 */
export function purgeLegacySensitiveStorage(): void {
  purgeLegacyAlfajrKeys();
}
