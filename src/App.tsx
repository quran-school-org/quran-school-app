import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { RealmSimDB, clearLocalCache, ensureCacheOwner, purgeLegacySensitiveStorage } from "./db";
import { 
  subscribeToCollection, 
  subscribeToSettings,
  subscribeToDocument,
  subscribeToDocumentsByIds,
  subscribeToQueryIn,
  subscribeToQuotaState,
  signInWithUsername,
  signOutUser,
  changeOwnPassword,
  fetchAuthLink,
  fetchAppUser,
  updateOwnAppUserFields,
  createUserAccountRemote,
  resetUserPasswordRemote,
  describeFirebaseError,
  stripPassword,
  auth
} from "./firebase";
import { 
  Student, Teacher, Class, Attendance, Grade, Payment, Notification, 
  UserRole, TajweedLevel, SystemSettings, AppUser, AuthLink, DailyProgress, 
  OtherIncome, SalaryPayment, Expense, checkUserPermission,
  ActivityTrip, ActivityParticipant, ActivityExpense
} from "./types";
import { isDirectorRole, isEducatorRole, isFamilyRole, isOfficeRole, fullyReadableCollections } from "./security/access";
import { validateNewPassword } from "./security/accounts";
import { computeAccountAlignment, linkedStudentIdsOf, linkedTeacherIdOf } from "./security/accountAlignment";
import { getStudentPhoto, StudentAvatar } from "./utils/studentAvatar";
import StudentCard from "./components/StudentCard";
import TeacherManagement from "./components/TeacherManagement";
import ClassManagement from "./components/ClassManagement";
import AttendanceChart from "./components/AttendanceChart";
import TeacherPerformanceChart from "./components/TeacherPerformanceChart";
import SettingsManagement from "./components/SettingsManagement";
import FinanceManagement from "./components/FinanceManagement";
import ActivitiesManagement from "./components/ActivitiesManagement";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { Html5Qrcode } from "html5-qrcode";
import {
  Users, BookOpen, UserCheck, Award, CreditCard, Bell, Sparkles, Plus, Search, Trash2, Edit3, 
  Check, X, ChevronRight, Phone, Calendar, ShieldAlert, CheckSquare, Square, RefreshCw, Eye, Download, Info,
  Briefcase, Printer, FileText, Archive, Database, QrCode, Camera, Volume2, Keyboard, MapPin, Settings,
  Globe, Facebook, Lock, User, LogIn, LogOut, EyeOff, LayoutDashboard, Coins, ArrowUpDown, ArrowUp, ArrowDown, Menu,
  Compass
} from "lucide-react";

const getSubscriptionAmount = (month: string, year: number): number => {
  // Base subscription amount is 100 MAD
  // Month 7 (يوليوز) and Month 8 (غشت) of current year (2026) has an offer of 70 MAD
  if (year === 2026 && (month === "يوليوز" || month === "غشت")) {
    return 70;
  }
  return 100;
};

const getYearAndMonthFromDate = (dateStr: string) => {
  if (!dateStr) return { year: null, month: null };
  const parts = dateStr.split("-");
  if (parts.length < 2) return { year: null, month: null };
  const year = parseInt(parts[0], 10);
  const monthNum = parseInt(parts[1], 10); // 1-12
  const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
  if (monthNum >= 1 && monthNum <= 12) {
    return { year, month: months_ar[monthNum - 1] };
  }
  return { year: null, month: null };
};

const isMonthBeforeJuly2026 = (month: string, year: number): boolean => {
  if (year < 2026) return true;
  if (year > 2026) return false;
  const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
  const monthIndex = months_ar.indexOf(month);
  return monthIndex !== -1 && monthIndex < 6; // 6 is "يوليوز"
};

const getMonthsToGenerate = (registrationDateStr: string) => {
  const result: { month: string; year: number }[] = [];
  if (!registrationDateStr) return result;
  const parts = registrationDateStr.split("-");
  if (parts.length !== 3) return result;
  
  const regYear = parseInt(parts[0], 10);
  const regMonthNum = parseInt(parts[1], 10); // 1-12
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  
  const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
  
  let tempYear = regYear;
  let tempMonthNum = regMonthNum;
  
  // If the registration date is in the future compared to now, just generate the month of registration
  if (regYear > currentYear || (regYear === currentYear && regMonthNum > currentMonthNum)) {
    if (regMonthNum >= 1 && regMonthNum <= 12) {
      result.push({
        month: months_ar[regMonthNum - 1],
        year: regYear
      });
    }
  } else {
    // Generate from regYear/regMonthNum up to currentYear/currentMonthNum
    while (tempYear < currentYear || (tempYear === currentYear && tempMonthNum <= currentMonthNum)) {
      if (tempMonthNum >= 1 && tempMonthNum <= 12) {
        result.push({
          month: months_ar[tempMonthNum - 1],
          year: tempYear
        });
      }
      tempMonthNum++;
      if (tempMonthNum > 12) {
        tempMonthNum = 1;
        tempYear++;
      }
    }
  }
  
  // Filter out any months before July 2026 (the official opening)
  return result.filter(item => !isMonthBeforeJuly2026(item.month, item.year));
};

interface ParsedSchedule {
  activeDays: number[]; // [0, 6] representing Sun, Mon, etc.
  startTime: { hours: number; minutes: number } | null;
  endTime: { hours: number; minutes: number } | null;
}

const parseClassSchedule = (scheduleStr: string): ParsedSchedule => {
  const arabicDays = [
    { name: "الأحد", index: 0 },
    { name: "الاثنين", index: 1 },
    { name: "الإثنين", index: 1 },
    { name: "الثلاثاء", index: 2 },
    { name: "الأربعاء", index: 3 },
    { name: "الخميس", index: 4 },
    { name: "الجمعة", index: 5 },
    { name: "السبت", index: 6 }
  ];

  const activeDays = Array.from(new Set(
    arabicDays
      .filter(day => scheduleStr.includes(day.name))
      .map(day => day.index)
  ));

  const timeRegex = /(\d{1,2}):(\d{2})/g;
  const matches = [...scheduleStr.matchAll(timeRegex)];
  
  let startTime = null;
  let endTime = null;

  if (matches.length >= 1) {
    startTime = {
      hours: parseInt(matches[0][1], 10),
      minutes: parseInt(matches[0][2], 10)
    };
  }
  if (matches.length >= 2) {
    endTime = {
      hours: parseInt(matches[1][1], 10),
      minutes: parseInt(matches[1][2], 10)
    };
  }

  return { activeDays, startTime, endTime };
};

/** Fusionne compte applicatif et lien d'autorisation (le lien fait foi). */
function mergeSessionProfile(appUser: AppUser, link: AuthLink, uid: string): AppUser {
  return {
    ...stripPassword(appUser),
    role: link.role,
    isActive: link.isActive,
    authUid: uid,
    linkedStudentIds: link.linkedStudentIds ?? appUser.linkedStudentIds ?? [],
    linkedTeacherId: link.linkedTeacherId ?? appUser.linkedTeacherId ?? undefined,
  };
}

export default function App() {
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

  // Authentication states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Lot 0 : session restaurée par Firebase Auth (plus jamais depuis localStorage)
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const loginInProgressRef = useRef(false);

  // UI state
  const currentRole: UserRole = currentUser?.role || "طالب";
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentArchiveFilter, setStudentArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // AI Report State
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // Modals & Form State
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showGradeModal, setShowGradeModal] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Teacher Dashboard States
  const [showTeacherStudentFileModal, setShowTeacherStudentFileModal] = useState<boolean>(false);
  const [teacherSelectedStudent, setTeacherSelectedStudent] = useState<Student | null>(null);
  const [progressDate, setProgressDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [progressMemorization, setProgressMemorization] = useState<string>("");
  const [progressRevision, setProgressRevision] = useState<string>("");
  const [progressOldRevision, setProgressOldRevision] = useState<string>("");
  const [progressRating, setProgressRating] = useState<"ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف">("ممتاز");
  const [progressNotes, setProgressNotes] = useState<string>("");
  
  // Fast Scan QR/Barcode Attendance states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [scannerInputValue, setScannerInputValue] = useState<string>("");
  const [showScannerPanel, setShowScannerPanel] = useState<boolean>(false);

  // Payments Ledger Sorting
  const [paymentSortKey, setPaymentSortKey] = useState<string | null>(null);
  const [paymentSortDir, setPaymentSortDir] = useState<"asc" | "desc">("asc");

  const handleTogglePaymentSort = (key: string) => {
    if (paymentSortKey === key) {
      if (paymentSortDir === "asc") {
        setPaymentSortDir("desc");
      } else {
        setPaymentSortKey(null);
        setPaymentSortDir("asc");
      }
    } else {
      setPaymentSortKey(key);
      setPaymentSortDir("asc");
    }
  };

  // ID Cards Lab States
  const [idCardLabTab, setIdCardLabTab] = useState<"student-card" | "membership-card">("student-card");
  const [selectedLabStudentId, setSelectedLabStudentId] = useState<string>("");
  const [labScale, setLabScale] = useState<number>(1.0);
  const [labViewMode, setLabViewMode] = useState<"both" | "front" | "back">("both");
  const [labDisplayType, setLabDisplayType] = useState<"print" | "3d">("print");
  const [labFlip, setLabFlip] = useState<boolean>(false);
  const [searchLabQuery, setSearchLabQuery] = useState<string>("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [labPrintMode, setLabPrintMode] = useState<"single" | "bulk">("single");
  
  // Monthly Attendance Report States
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
  const [reportYearMonth, setReportYearMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  // User Profile Edit Modal States
  const [showProfileEditModal, setShowProfileEditModal] = useState<boolean>(false);
  const [profileFullName, setProfileFullName] = useState<string>("");
  const [profilePassword, setProfilePassword] = useState<string>("");
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [showProfilePassword, setShowProfilePassword] = useState<boolean>(false);
  const [profileCurrentPassword, setProfileCurrentPassword] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string>("");

  // Form input states
  const [formFullName, setFormFullName] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formRegistrationDate, setFormRegistrationDate] = useState("");
  const [formGender, setFormGender] = useState<"ذكر" | "أنثى">("ذكر");
  const [formParentName, setFormParentName] = useState("");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formParentEmail, setFormParentEmail] = useState("");
  const [formDocParentId, setFormDocParentId] = useState(false);
  const [formDocBirthCert, setFormDocBirthCert] = useState(false);
  const [formDocPhotos, setFormDocPhotos] = useState(false);
  const [formHizbCount, setFormHizbCount] = useState<number>(1);
  const [formCurrentSurah, setFormCurrentSurah] = useState("");
  const [formTajweedLevel, setFormTajweedLevel] = useState<TajweedLevel>("متوسط");
  const [formNotes, setFormNotes] = useState("");
  const [formClassId, setFormClassId] = useState("c1");
  const [formIsArchived, setFormIsArchived] = useState(false);

  const [studentDragActive, setStudentDragActive] = useState(false);

  const compressImage = (base64Str: string, maxWidth = 180, maxHeight = 180, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  const handleStudentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 15 ميغابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Compress the image before setting the form state
        const compressed = await compressImage(base64);
        setFormPhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudentDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setStudentDragActive(true);
    } else if (e.type === "dragleave") {
      setStudentDragActive(false);
    }
  };

  const handleStudentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStudentDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 15 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 15 ميغابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Compress the image before setting the form state
        const compressed = await compressImage(base64);
        setFormPhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  // Grade Form state
  const [gradeStudentId, setGradeStudentId] = useState("");
  const [gradePortion, setGradePortion] = useState("");
  const [gradeMemorization, setGradeMemorization] = useState(18);
  const [gradeTajweed, setGradeTajweed] = useState(18);
  const [gradeOverall, setGradeOverall] = useState<"ممتاز" | "جيد جداً" | "جيد" | "مقبول">("ممتاز");
  const [gradeNotes, setGradeNotes] = useState("");

  // Payment search and filter states
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [paymentFilterStatus, setPaymentFilterStatus] = useState("all");
  const [paymentFilterDate, setPaymentFilterDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  // Payment Form & Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentFormStudentId, setPaymentFormStudentId] = useState("");
  const [paymentFormYear, setPaymentFormYear] = useState<number>(2026);
  const [paymentFormMonth, setPaymentFormMonth] = useState("يوليوز");
  const [paymentFormAmount, setPaymentFormAmount] = useState<number>(70);
  const [paymentFormStatus, setPaymentFormStatus] = useState<"مدفوع" | "غير مدفوع">("غير مدفوع");
  const [paymentFormDate, setPaymentFormDate] = useState("");
  const [paymentFormMethod, setPaymentFormMethod] = useState<"نقداً" | "تحويل بنكي" | "شيك">("نقداً");
  const [paymentFormReceiptNo, setPaymentFormReceiptNo] = useState("");
  const [paymentFormNotes, setPaymentFormNotes] = useState("");

  // Database synchronization states
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("syncing");

  // Listen to global Firestore Quota state
  useEffect(() => {
    return subscribeToQuotaState((exceeded) => {
      setFirestoreQuotaExceeded(exceeded);
      if (exceeded) {
        setSyncStatus("error");
        loadDatabase();
      }
    });
  }, []);

  /**
   * Construit le profil de session : le lien d'autorisation `authLinks/{uid}`
   * fait foi pour le rôle, le statut et les liens ; le compte applicatif
   * fournit l'affichage et la matrice de droits de l'interface.
   */
  const loadSessionProfile = async (uid: string): Promise<{ user: AppUser } | { error: string }> => {
    const link = await fetchAuthLink(uid);
    if (!link) {
      return { error: "هذا الحساب غير مرتبط بأي مستخدم في المنظومة. يرجى التواصل مع إدارة الجمعية." };
    }
    if (!link.isActive) {
      return { error: "هذا الحساب معطل حالياً. يرجى التواصل مع إدارة الجمعية." };
    }
    const appUser = await fetchAppUser(link.appUserId);
    if (!appUser) {
      return { error: "تعذر تحميل ملف المستخدم. يرجى التواصل مع إدارة الجمعية." };
    }
    return { user: mergeSessionProfile(appUser, link, uid) };
  };

  /** Remet à zéro tout l'état de données (déconnexion, changement de compte). */
  const resetSessionState = () => {
    setStudents([]);
    setTeachers([]);
    setClasses([]);
    setAttendance([]);
    setGrades([]);
    setPayments([]);
    setNotifications([]);
    setAppUsers([]);
    setDailyProgress([]);
    setOtherIncomes([]);
    setSalaryPayments([]);
    setExpenses([]);
    setActivities([]);
    setActivityParticipants([]);
    setActivityExpenses([]);
    setSelectedStudent(null);
    setSelectedLabStudentId("");
  };

  /** Déconnexion réelle : Firebase Auth + purge du cache local. */
  const handleLogout = async (reason?: string) => {
    try {
      await signOutUser();
    } catch (e) {
      console.error("Firebase sign-out error:", e);
    }
    clearLocalCache();
    resetSessionState();
    setAuthUid(null);
    setCurrentUser(null);
    setActiveTab("dashboard");
    setShowProfileEditModal(false);
    if (reason) setLoginError(reason);
  };

  // Démarrage : purge des traces sensibles des anciennes versions, puis
  // restauration de la session par Firebase Auth (jamais depuis localStorage).
  useEffect(() => {
    purgeLegacySensitiveStorage();
    setSystemSettings(RealmSimDB.getSystemSettings());
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUid(null);
        setCurrentUser(null);
        setAuthChecking(false);
        return;
      }
      if (loginInProgressRef.current) return; // pris en charge par handleLoginSubmit
      try {
        const res = await loadSessionProfile(fbUser.uid);
        if ("error" in res) {
          await signOutUser();
          clearLocalCache();
          setLoginError(res.error);
        } else {
          ensureCacheOwner(fbUser.uid);
          loadDatabase(res.user.role);
          setAuthUid(fbUser.uid);
          setCurrentUser(res.user);
        }
      } catch (e) {
        console.error("Session restore error:", e);
        setLoginError("تعذر التحقق من الحساب. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.");
      } finally {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Clé de session : on ne se réabonne que si le compte, le rôle ou les liens changent.
  const sessionKey = currentUser && authUid
    ? `${authUid}|${currentUser.id}|${currentUser.role}|${linkedStudentIdsOf(currentUser).join(",")}`
    : "";

  // Real-time Firestore synchronization (abonnements limités à ce que le rôle peut lire)
  useEffect(() => {
    if (!currentUser || !authUid) {
      return;
    }
    let active = true;
    const unsubscribes: (() => void)[] = [];
    const role = currentUser.role;
    const readable = new Set(fullyReadableCollections(role));
    const linkedIds = linkedStudentIdsOf(currentUser);

    setSyncStatus("syncing");
    try {
      // Lien d'autorisation : une suspension ou un changement de rôle s'applique immédiatement.
      unsubscribes.push(subscribeToDocument<AuthLink & { id: string }>("authLinks", authUid, (link) => {
        if (!active) return;
        if (!link || !link.isActive) {
          handleLogout("تم إيقاف هذا الحساب. يرجى التواصل مع إدارة الجمعية.");
          return;
        }
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const merged = mergeSessionProfile(prev, link, authUid);
          return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
        });
      }));

      // Compte applicatif : nom, droits fins de l'interface, obligation de changer le mot de passe.
      unsubscribes.push(subscribeToDocument<AppUser>("appUsers", currentUser.id, (u) => {
        if (!active || !u) return;
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const merged: AppUser = {
            ...stripPassword(u),
            role: prev.role,
            isActive: prev.isActive,
            authUid: prev.authUid,
            linkedStudentIds: prev.linkedStudentIds,
            linkedTeacherId: prev.linkedTeacherId,
          };
          return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
        });
      }));

      unsubscribes.push(subscribeToSettings((settings) => {
        if (active && settings) setSystemSettings(settings);
      }, "alfajr_settings_system"));

      const sub = <T extends { id: string }>(col: string, key: string, setter: (items: T[]) => void) => {
        if (!readable.has(col)) return;
        unsubscribes.push(subscribeToCollection<T>(col, (items) => {
          if (active) setter(items);
        }, key));
      };

      const onStudents = (items: Student[]) => {
        setStudents(items);
        if (items.length > 0) {
          setSelectedStudent(prev => prev ? (items.find(s => s.id === prev.id) || items[0]) : items[0]);
          setSelectedLabStudentId(prev => prev ? (items.some(s => s.id === prev) ? prev : items[0].id) : items[0].id);
        } else {
          setSelectedStudent(null);
        }
      };

      if (readable.has("students")) {
        sub<Student>("students", "alfajr_students", onStudents);
      } else if (isFamilyRole(role)) {
        // Familles : uniquement les dossiers explicitement liés au compte.
        unsubscribes.push(subscribeToDocumentsByIds<Student>("students", linkedIds, (items) => {
          if (active) onStudents(items);
        }, "alfajr_students"));
      }

      sub<AppUser>("appUsers", "alfajr_settings_users", setAppUsers);
      sub<Teacher>("teachers", "alfajr_teachers", setTeachers);
      sub<Class>("classes", "alfajr_classes", setClasses);
      sub<Payment>("payments", "alfajr_payments", setPayments);
      sub<Notification>("notifications", "alfajr_notifications", setNotifications);
      sub<OtherIncome>("otherIncomes", "alfajr_other_incomes", setOtherIncomes);
      sub<SalaryPayment>("salaryPayments", "alfajr_salary_payments", setSalaryPayments);
      sub<Expense>("expenses", "alfajr_expenses", setExpenses);
      sub<ActivityTrip>("activities", "alfajr_activities", setActivities);
      sub<ActivityParticipant>("activityParticipants", "alfajr_activity_participants", setActivityParticipants);
      sub<ActivityExpense>("activityExpenses", "alfajr_activity_expenses", setActivityExpenses);

      if (readable.has("attendance")) {
        sub<Attendance>("attendance", "alfajr_attendance", setAttendance);
        sub<Grade>("grades", "alfajr_grades", setGrades);
        sub<DailyProgress>("dailyProgress", "alfajr_daily_progress", setDailyProgress);
      } else if (isFamilyRole(role)) {
        // Familles : requêtes filtrées sur les élèves liés (vérifiées par les règles).
        unsubscribes.push(subscribeToQueryIn<Attendance>("attendance", "studentId", linkedIds, (items) => { if (active) setAttendance(items); }, "alfajr_attendance"));
        unsubscribes.push(subscribeToQueryIn<Grade>("grades", "studentId", linkedIds, (items) => { if (active) setGrades(items); }, "alfajr_grades"));
        unsubscribes.push(subscribeToQueryIn<DailyProgress>("dailyProgress", "studentId", linkedIds, (items) => { if (active) setDailyProgress(items); }, "alfajr_daily_progress"));
      }

      setSyncStatus("synced");
    } catch (err) {
      console.error("Error setting up Firebase sync:", err);
      if (active) {
        setSyncStatus("error");
        loadDatabase();
      }
    }

    return () => {
      active = false;
      unsubscribes.forEach(unsub => unsub());
    };
  }, [sessionKey]);

  // Changement de mot de passe obligatoire (comptes provisionnés ou réinitialisés).
  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setProfileFullName(currentUser.fullName || "");
      setProfilePhone(currentUser.username || "");
      setProfilePassword("");
      setProfileCurrentPassword("");
      setProfileError("");
      setShowProfileEditModal(true);
    }
  }, [currentUser?.mustChangePassword]);

  // Auto-process absences based on schedule
  useEffect(() => {
    if (students.length === 0 || classes.length === 0) return;
    // Seuls les comptes pédagogiques écrivent les présences (règles Firestore).
    if (!currentUser || !isEducatorRole(currentRole)) return;

    const dateObj = new Date(attendanceDate);
    // Get day of the week for selected date
    const dayOfWeek = dateObj.getDay(); // 0-6 (0 is Sunday, 6 is Saturday)

    let hasChanges = false;
    const currentAttendance = RealmSimDB.getAttendance();

    students.forEach((st) => {
      const cls = classes.find(c => c.id === st.classId);
      if (!cls || st.isArchived) return;

      const parsed = parseClassSchedule(cls.schedule);

      // Is the selected date a scheduled day for this class?
      if (parsed.activeDays.includes(dayOfWeek)) {
        // Is there an existing record for this student on this date?
        const existing = currentAttendance.find(att => att.date === attendanceDate && att.studentId === st.id);
        if (!existing) {
          const todayStr = new Date().toISOString().split("T")[0];

          if (attendanceDate < todayStr) {
            // It's a past date, so the student missed the ring/session
            const newRecord: Attendance = {
              id: `a_${attendanceDate}_${st.id}`,
              date: attendanceDate,
              studentId: st.id,
              status: "غائب" as const,
              notes: "غياب تلقائي (انتهاء وقت الحلقة)"
            };
            RealmSimDB.saveAttendance(newRecord);
            hasChanges = true;
          } else if (attendanceDate === todayStr) {
            // It's today. Let's check if the session start time has arrived.
            if (parsed.startTime) {
              const now = new Date();
              const currentTotalMin = now.getHours() * 60 + now.getMinutes();
              const startTotalMin = parsed.startTime.hours * 60 + parsed.startTime.minutes;

              if (currentTotalMin >= startTotalMin) {
                // The session has started, so any student who hasn't registered yet is automatically absent!
                const newRecord: Attendance = {
                  id: `a_${attendanceDate}_${st.id}`,
                  date: attendanceDate,
                  studentId: st.id,
                  status: "غائب" as const,
                  notes: "غياب تلقائي (بدأت الحلقة ولم يسجل حضوره)"
                };
                RealmSimDB.saveAttendance(newRecord);
                hasChanges = true;
              }
            }
          }
        }
      }
    });

    if (hasChanges) {
      loadDatabase();
    }
  }, [attendanceDate, students.length, classes.length]);

  const loadDatabase = (roleForMigrations: UserRole | null = currentUser ? currentRole : null) => {
    const s = RealmSimDB.getStudents();
    const t = RealmSimDB.getTeachers();
    const c = RealmSimDB.getClasses();
    const a = RealmSimDB.getAttendance();
    const g = RealmSimDB.getGrades();
    let p = RealmSimDB.getPayments();
    const n = RealmSimDB.getNotifications();

    // Migrate legacy payments: filter out months before July 2026 without resetting payment statuses
    // Lot 0 : réservé au bureau (seul autorisé à écrire les paiements), et plus
    // jamais déclenché par un cache vide (qui écrasait des paiements réels).
    const hasPreJuly = p.some(pay => isMonthBeforeJuly2026(pay.month, pay.year));
    if (hasPreJuly && isOfficeRole(roleForMigrations)) {
      const cleanPayments: Payment[] = p.filter(pay => !isMonthBeforeJuly2026(pay.month, pay.year));

      // Make sure every student has a July 2026 payment record
      s.forEach((stud) => {
        const hasJuly = cleanPayments.some(pay => pay.studentId === stud.id && pay.month === "يوليوز" && pay.year === 2026);
        if (!hasJuly) {
          const initPay: Payment = {
            id: `p_init_${stud.id}`,
            studentId: stud.id,
            year: 2026,
            month: "يوليوز",
            amount: getSubscriptionAmount("يوليوز", 2026),
            paymentDate: "",
            status: "غير مدفوع"
          };
          cleanPayments.push(initPay);
          RealmSimDB.savePayment(initPay);
        }
      });

      p = cleanPayments;
      if (typeof window !== "undefined") {
        localStorage.setItem("alfajr_payments", JSON.stringify(p));
      }
    }

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

  // Helper to trigger automated notifications
  const addSysNotification = (title: string, message: string, type: "نجاح" | "تنبيه" | "مالي" | "إداري") => {
    const newNotif: Notification = {
      id: "n_" + Date.now(),
      title,
      message,
      date: new Date().toISOString().split("T")[0],
      type,
      isRead: false
    };
    RealmSimDB.saveNotification(newNotif);
    setNotifications(RealmSimDB.getNotifications());
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

  // Attendance processing
  const getConsecutiveAbsences = (studentId: string): number => {
    const studentRecords = attendance
      .filter(a => a.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));

    let consecutiveCount = 0;
    for (const record of studentRecords) {
      if (record.status === "غائب") {
        consecutiveCount++;
      } else {
        break;
      }
    }
    return consecutiveCount;
  };

  const handleSendAbsenceWarning = (student: Student) => {
    const consecutiveCount = getConsecutiveAbsences(student.id);
    const phone = (student.parentPhone || "").replace(/\s+/g, "");
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "212" + phone.substring(1);
    }
    const message = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) *${student.fullName}* المحترم(ة). نحيطكم علماً بأن ابنكم/ابنتكم قد تغيب عن حصص التحفيظ بـ *${consecutiveCount} حصص متتالية*. نرجو منكم التواصل مع إدارة نادي الفجر الجديد للقرآن الكريم لتبرير هذا الغياب والتعاون معنا لضمان التزام الطالب وتقدمه الدراسي. جزاكم الله خيراً.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, "_blank");

    addSysNotification(
      "إنذار غياب",
      `تم إرسال إنذار غياب لولي أمر الطالب ${student.fullName} عبر واتساب لتغيبه ${consecutiveCount} حصص متتالية.`,
      "تنبيه"
    );
  };

  const handleToggleAttendance = (studentId: string, status: "حاضر" | "غائب" | "متأخر", notes?: string) => {
    const updated: Attendance = {
      id: `a_${attendanceDate}_${studentId}`,
      date: attendanceDate,
      studentId,
      status,
      notes
    };
    RealmSimDB.saveAttendance(updated);

    // Check if the new attendance status marks 3 or more consecutive absences
    const student = students.find(s => s.id === studentId);
    if (status === "غائب" && student) {
      const nextRecords = [
        updated,
        ...attendance.filter(a => a.studentId === studentId && a.date !== attendanceDate)
      ].sort((a, b) => b.date.localeCompare(a.date));

      let consecutiveCount = 0;
      for (const record of nextRecords) {
        if (record.status === "غائب") {
          consecutiveCount++;
        } else {
          break;
        }
      }

      if (consecutiveCount >= 3) {
        addSysNotification(
          "تنبيه غياب متكرر ⚠️",
          `الطالب ${student.fullName} متغيب لـ ${consecutiveCount} حصص متتالية! يرجى إرسال إنذار غياب لولي أمره.`,
          "تنبيه"
        );
      }
    }

    loadDatabase();
  };

  const playBeep = (type: "success" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio not supported or blocked by user interaction", e);
    }
  };

  const handleScannedValue = (scannedText: string) => {
    if (!scannedText || scannedText.trim() === "") return;
    
    let targetId = scannedText.trim();
    
    if (targetId.startsWith("ALFAJR ID-")) {
      targetId = targetId.replace("ALFAJR ID-", "");
    }
    targetId = targetId.replace(/\*/g, "");
    
    const normalizedTarget = targetId.toLowerCase().trim();

    const foundStudent = students.find(
      s => s.id.toLowerCase() === normalizedTarget || 
           s.fullName.toLowerCase() === normalizedTarget ||
           s.fullName.includes(scannedText)
    );

    if (foundStudent) {
      const studentClass = classes.find(c => c.id === foundStudent.classId);
      let finalStatus: "حاضر" | "غائب" | "متأخر" = "حاضر";
      let note = "تسجيل حضور سريع بالرمز";
      let alertMessage = `تم رصد حضور الطالب(ة) بنجاح: ${foundStudent.fullName}`;

      if (studentClass) {
        const parsed = parseClassSchedule(studentClass.schedule);
        if (parsed.startTime) {
          const now = new Date();
          const currentTotalMin = now.getHours() * 60 + now.getMinutes();
          const startTotalMin = parsed.startTime.hours * 60 + parsed.startTime.minutes;
          
          const delay = currentTotalMin - startTotalMin;
          if (delay >= 10) {
            finalStatus = "متأخر";
            note = `متأخر تلقائياً بـ ${delay} دقيقة (بدأت الحلقة في ${String(parsed.startTime.hours).padStart(2, '0')}:${String(parsed.startTime.minutes).padStart(2, '0')})`;
            alertMessage = `تم رصد حضور الطالب(ة) متأخراً: ${foundStudent.fullName} (متأخر بـ ${delay} دقيقة)`;
          } else {
            finalStatus = "حاضر";
            note = `حاضر في الوقت (بدأت الحلقة في ${String(parsed.startTime.hours).padStart(2, '0')}:${String(parsed.startTime.minutes).padStart(2, '0')})`;
            alertMessage = `تم رصد حضور الطالب(ة) في الوقت المحدد: ${foundStudent.fullName}`;
          }
        }
      }

      handleToggleAttendance(foundStudent.id, finalStatus, note);
      playBeep("success");

      setScanStatus({
        type: "success",
        message: alertMessage
      });

      addSysNotification(
        finalStatus === "متأخر" ? "حضور متأخر بالرمز 🕒" : "حضور سريع بالرمز 🟢",
        `تم تسجيل حضور الطالب ${foundStudent.fullName} تلقائياً (${finalStatus === "متأخر" ? "متأخر" : "حاضر"}) لمسح بطاقة هويته. ${note}`,
        finalStatus === "متأخر" ? "تنبيه" : "نجاح"
      );
    } else {
      playBeep("error");
      setScanStatus({
        type: "error",
        message: `عذراً، لم نتمكن من العثور على طالب بالمعرف: "${scannedText}"`
      });
    }
  };

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isScanning) {
      setScanStatus({ type: "info", message: "جاري تشغيل الكاميرا والمستشعر..." });
      
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("qr-scanner-viewport");
        qrScannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            handleScannedValue(decodedText);
          },
          () => {
            // Silence frame scan errors to prevent console spam
          }
        ).catch((err) => {
          console.error("Camera startup error:", err);
          playBeep("error");
          setScanStatus({
            type: "error",
            message: "فشل تشغيل الكاميرا. يرجى التحقق من منح صلاحيات الكاميرا للموقع والمحاولة مجدداً."
          });
          setIsScanning(false);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current) {
          if (qrScannerRef.current.isScanning) {
            qrScannerRef.current.stop().then(() => {
              qrScannerRef.current = null;
            }).catch(err => console.error("Failed to stop scanner on unmount:", err));
          } else {
            qrScannerRef.current = null;
          }
        }
      };
    } else {
      if (qrScannerRef.current) {
        if (qrScannerRef.current.isScanning) {
          qrScannerRef.current.stop().then(() => {
            qrScannerRef.current = null;
          }).catch(err => console.error("Failed to stop scanner:", err));
        } else {
          qrScannerRef.current = null;
        }
      }
    }
  }, [isScanning, students]);

  // Print A4 Monthly Attendance Report
  const handlePrintReport = () => {
    const reportElement = document.getElementById("printable-monthly-report");
    if (!reportElement) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    let stylesHtml = "";
    document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    const tailwindCdn = `<script src="https://cdn.tailwindcss.com"></script>`;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير حضور وغياب - ${selectedStudentForReport?.fullName || ""}</title>
          ${tailwindCdn}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white p-4">
          <div class="w-full">
            ${reportElement.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Grade processing
  const handleOpenGradeForm = (studentId: string) => {
    setGradeStudentId(studentId);
    setGradePortion("");
    setGradeMemorization(18);
    setGradeTajweed(18);
    setGradeOverall("ممتاز");
    setGradeNotes("");
    setShowGradeModal(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const newGrade: Grade = {
      id: "g_" + Date.now(),
      studentId: gradeStudentId,
      examDate: new Date().toISOString().split("T")[0],
      testedPortion: gradePortion || "جزء عمّ",
      memorizationGrade: Number(gradeMemorization),
      tajweedGrade: Number(gradeTajweed),
      overallGrade: gradeOverall,
      notes: gradeNotes,
      examinerId: "t1"
    };
    RealmSimDB.saveGrade(newGrade);
    const studName = students.find(st => st.id === gradeStudentId)?.fullName || "";
    addSysNotification("إصدار شهادة اختبار", `تم رصد نتيجة اختبار جديدة للطالب ${studName} بتقدير ${gradeOverall}.`, "نجاح");
    loadDatabase();
    setShowGradeModal(false);
  };

  const handleDeleteGrade = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التقييم؟")) {
      RealmSimDB.deleteGrade(id);
      loadDatabase();
    }
  };

  // Payment processing
  const handleTogglePayment = (paymentId: string) => {
    const pay = payments.find(p => p.id === paymentId);
    if (pay) {
      const isPaid = pay.status === "مدفوع";
      const updated: Payment = {
        ...pay,
        status: isPaid ? "غير مدفوع" : "مدفوع",
        paymentDate: !isPaid ? new Date().toISOString().split("T")[0] : "",
        receiptNo: !isPaid ? (pay.receiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000)) : undefined,
        paymentMethod: !isPaid ? (pay.paymentMethod || "نقداً") : undefined
      };
      RealmSimDB.savePayment(updated);
      const studName = students.find(s => s.id === pay.studentId)?.fullName || "";
      addSysNotification(
        "تحديث حالة الدفع",
        `تم تعديل حالة دفعة شهر ${pay.month} للطالب ${studName} إلى [${updated.status}].`,
        "مالي"
      );
      loadDatabase();
    }
  };

  const handleOpenPaymentForm = (pay?: Payment) => {
    if (pay) {
      setEditingPayment(pay);
      setPaymentFormStudentId(pay.studentId || "");
      setPaymentFormYear(pay.year || new Date().getFullYear());
      setPaymentFormMonth(pay.month || "يوليوز");
      setPaymentFormAmount(pay.amount !== undefined ? pay.amount : 70);
      setPaymentFormStatus(pay.status || "غير مدفوع");
      setPaymentFormDate(pay.paymentDate || new Date().toISOString().split("T")[0]);
      setPaymentFormMethod(pay.paymentMethod || "نقداً");
      setPaymentFormReceiptNo(pay.receiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000));
      setPaymentFormNotes(pay.notes || "");
    } else {
      setEditingPayment(null);
      setPaymentFormStudentId(students[0]?.id || "");
      setPaymentFormYear(new Date().getFullYear());
      // Pre-select current month or default
      const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
      const currentMonthIndex = new Date().getMonth();
      setPaymentFormMonth(months_ar[currentMonthIndex] || "يوليوز");
      setPaymentFormAmount(getSubscriptionAmount(months_ar[currentMonthIndex] || "يوليوز", new Date().getFullYear()));
      setPaymentFormStatus("غير مدفوع");
      setPaymentFormDate(new Date().toISOString().split("T")[0]);
      setPaymentFormMethod("نقداً");
      setPaymentFormReceiptNo("REC-" + Math.floor(Math.random() * 9000 + 1000));
      setPaymentFormNotes("");
    }
    setShowPaymentModal(true);
  };

  const handleFormMonthChange = (month: string) => {
    setPaymentFormMonth(month);
    setPaymentFormAmount(getSubscriptionAmount(month, paymentFormYear));
  };

  const handleFormYearChange = (year: number) => {
    setPaymentFormYear(year);
    setPaymentFormAmount(getSubscriptionAmount(paymentFormMonth, year));
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFormStudentId) {
      alert("يرجى اختيار الطالب.");
      return;
    }
    const newPayment: Payment = {
      id: editingPayment ? editingPayment.id : "p_" + Date.now(),
      studentId: paymentFormStudentId,
      year: Number(paymentFormYear),
      month: paymentFormMonth,
      amount: Number(paymentFormAmount),
      status: paymentFormStatus,
      paymentDate: paymentFormStatus === "مدفوع" ? paymentFormDate : "",
      paymentMethod: paymentFormStatus === "مدفوع" ? paymentFormMethod : undefined,
      receiptNo: paymentFormStatus === "مدفوع" ? (paymentFormReceiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000)) : undefined,
      notes: paymentFormNotes || undefined
    };

    RealmSimDB.savePayment(newPayment);
    const studName = students.find(s => s.id === paymentFormStudentId)?.fullName || "";

    addSysNotification(
      editingPayment ? "تعديل دفعة مالية" : "إضافة دفعة مالية جديدة",
      `تم ${editingPayment ? "تعديل" : "إضافة"} دفعة شهر ${paymentFormMonth} ${paymentFormYear} للطالب ${studName} بقيمة ${paymentFormAmount} درهم.`,
      "مالي"
    );

    loadDatabase();
    setShowPaymentModal(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    const pay = payments.find(p => p.id === paymentId);
    if (pay) {
      const studName = students.find(s => s.id === pay.studentId)?.fullName || "";
      if (confirm(`هل أنت متأكد من حذف دفعة شهر ${pay.month} للطالب ${studName} نهائياً؟`)) {
        RealmSimDB.deletePayment(paymentId);
        addSysNotification(
          "حذف دفعة مالية",
          `تم إزالة سجل دفعة شهر ${pay.month} للطالب ${studName} نهائياً من النظام.`,
          "تنبيه"
        );
        loadDatabase();
      }
    }
  };

  const handleSaveOtherIncome = (income: OtherIncome) => {
    RealmSimDB.saveOtherIncome(income);
    addSysNotification("إضافة/تعديل إيراد", `تم حفظ سجل الإيراد: ${income.title} بقيمة ${income.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteOtherIncome = (id: string) => {
    RealmSimDB.deleteOtherIncome(id);
    addSysNotification("حذف إيراد", "تم حذف سجل الإيراد بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSaveSalaryPayment = (salary: SalaryPayment) => {
    RealmSimDB.saveSalaryPayment(salary);
    addSysNotification("إصدار مستحق راتب", `تم تسجيل مستحق ${salary.personName} لمبلغ ${salary.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteSalaryPayment = (id: string) => {
    RealmSimDB.deleteSalaryPayment(id);
    addSysNotification("حذف مستحق راتب", "تم حذف سجل مستحق الراتب.", "تنبيه");
    loadDatabase();
  };

  const handleSaveExpense = (expense: Expense) => {
    RealmSimDB.saveExpense(expense);
    addSysNotification("إضافة/تعديل مصروفات", `تم تسجيل مصروف ${expense.title} بقيمة ${expense.amount} د.م.`, "مالي");
    loadDatabase();
  };

  const handleDeleteExpense = (id: string) => {
    RealmSimDB.deleteExpense(id);
    addSysNotification("حذف مصروفات", "تم حذف سجل المصروفات بنجاح.", "تنبيه");
    loadDatabase();
  };

  // --- Activities & Trips Handlers (إدارة الأنشطة والرحلات) ---
  const handleSaveActivity = (activity: ActivityTrip) => {
    RealmSimDB.saveActivity(activity);
    addSysNotification(
      "إضافة/تعديل نشاط أو رحلة",
      `تم حفظ نشاط: "${activity.title}" بنجاح.`,
      "إداري"
    );
    loadDatabase();
  };

  const handleDeleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    RealmSimDB.deleteActivity(id);
    addSysNotification(
      "حذف نشاط أو رحلة",
      `تم حذف النشاط "${act?.title || ""}" وكافة سجلاته بنجاح.`,
      "تنبيه"
    );
    loadDatabase();
  };

  const handleSaveActivityParticipant = (participant: ActivityParticipant) => {
    RealmSimDB.saveActivityParticipant(participant);
    addSysNotification(
      "تسجيل مشارك في النشاط",
      `تم تسجيل المشارك "${participant.fullName}" وحفظ حالة الأداء [${participant.paymentStatus}].`,
      "مالي"
    );
    loadDatabase();
  };

  const handleDeleteActivityParticipant = (id: string) => {
    RealmSimDB.deleteActivityParticipant(id);
    addSysNotification("إلغاء تسجيل مشارك", "تم حذف سجل المشارك بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSaveActivityExpense = (expense: ActivityExpense) => {
    RealmSimDB.saveActivityExpense(expense);
    addSysNotification(
      "تسجيل مصروف نشاط/رحلة",
      `تم قيد مصروف "${expense.title}" بمبلغ ${expense.amount} د.م.`,
      "مالي"
    );
    loadDatabase();
  };

  const handleDeleteActivityExpense = (id: string) => {
    RealmSimDB.deleteActivityExpense(id);
    addSysNotification("حذف مصروف نشاط", "تم حذف المصروف بنجاح.", "تنبيه");
    loadDatabase();
  };

  const handleSyncActivityToFinance = (
    activity?: ActivityTrip, 
    netBalance?: number, 
    totalContributions?: number, 
    totalExpenses?: number
  ) => {
    RealmSimDB.syncAllActivitiesToFinance();
    loadDatabase();

    const title = activity ? activity.title : "الأنشطة والرحلات";
    addSysNotification(
      "الربط المالي التلقائي المباشر",
      `تم تحديث الربط المالي التلقائي لنشاط "${title}" بنجاح مع قيود المحاسبة والمالية الجمعوية ورصيد الصندوق.`,
      "مالي"
    );
  };

  const handlePrintReceipt = (p: Payment) => {
    const stud = students.find(s => s.id === p.studentId);
    if (!stud) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال.");
      return;
    }

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال استلام رسوم - ${stud.fullName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 20px;
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="max-w-md mx-auto border-2 border-dashed border-slate-300 p-6 rounded-2xl space-y-6 mt-10">
            <div class="text-center space-y-2">
              ${systemSettings?.associationLogo ? `
                <div class="w-16 h-16 mx-auto flex items-center justify-center bg-white rounded-xl overflow-hidden p-1">
                  <img src="${systemSettings.associationLogo}" class="max-w-full max-h-full object-contain" />
                </div>
              ` : `
                <span class="text-4xl">🌅</span>
              `}
              <h2 class="text-xl font-bold text-emerald-800">${systemSettings?.associationName || "نادي الفجر الجديد للقرآن الكريم"}</h2>
              <p class="text-xs text-slate-500 font-medium">برعاية ${systemSettings?.associationName || "جمعية الفجر الجديد"} • وصل استلام مالي</p>
            </div>
            
            <div class="border-t border-b border-slate-100 py-4 my-4 space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">رقم الإيصال:</span>
                <span class="font-mono font-bold text-slate-800">${p.receiptNo || "—"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">تاريخ الأداء:</span>
                <span class="font-mono text-slate-700">${p.paymentDate || "—"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">اسم الطالب:</span>
                <span class="font-bold text-slate-800">${stud.fullName}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">ولي الأمر:</span>
                <span class="text-slate-700">${stud.parentName}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">الفترة المستحقة:</span>
                <span class="font-semibold text-emerald-800">شهر ${p.month} ${p.year}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">طريقة الأداء:</span>
                <span class="font-semibold text-slate-800">${p.paymentMethod || "نقداً"}</span>
              </div>
              ${p.notes ? `
              <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                ملاحظات: ${p.notes}
              </div>
              ` : ""}
            </div>

            <div class="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center">
              <span class="text-xs block font-medium">المبلغ المستلم</span>
              <span class="text-2xl font-black font-mono">${p.amount} درهم</span>
            </div>

            <div class="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              شكرًا لكم على ثقتكم والتزامكم • جمعية الفجر الجديد
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsAppShare = (p: Payment) => {
    const stud = students.find(s => s.id === p.studentId);
    if (!stud) return;
    const rawMsg = `السلام عليكم ورحمة الله وبركاته،
المحترم(ة) السيد(ة) *${stud.parentName}*،
نعلمكم بأنه تم استلام دفعة الاشتراك المدرسي الخاصة بالطالب *${stud.fullName}*:
- *الشهر المستهدف*: ${p.month} ${p.year}
- *المبلغ*: ${p.amount} درهم
- *حالة الدفع*: ${p.status}
- *تاريخ الأداء*: ${p.paymentDate || "—"}
- *رقم الإيصال*: ${p.receiptNo || "—"}
- *طريقة الدفع*: ${p.paymentMethod || "نقداً"}
${p.notes ? `- *ملاحظة*: ${p.notes}\n` : ""}
شاكرين لكم حسن تعاونكم الدائم مع نادي الفجر الجديد للقرآن الكريم.`;
    const encodedMsg = encodeURIComponent(rawMsg);
    const phone = (stud?.parentPhone || "").replace(/\s+/g, "");
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "212" + phone.substring(1);
    }
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, "_blank");
  };

  const handleExportPaymentsToCSV = () => {
    if (filteredPayments.length === 0) {
      alert("لا توجد بيانات سداد لتصديرها.");
      return;
    }

    const headers = [
      "اسم الطالب",
      "اسم ولي الأمر",
      "هاتف ولي الأمر",
      "الشهر",
      "السنة",
      "المبلغ (درهم)",
      "حالة الدفع",
      "تاريخ الدفع",
      "طريقة الدفع",
      "رقم الإيصال",
      "الملاحظات"
    ];

    const rows = filteredPayments.map(p => {
      const stud = students.find(s => s.id === p.studentId);
      return [
        stud?.fullName || "طالب مجهول",
        stud?.parentName || "—",
        stud?.parentPhone || "—",
        p.month,
        p.year,
        p.amount,
        p.status,
        p.paymentDate || "—",
        p.paymentMethod || "—",
        p.receiptNo || "—",
        p.notes || "—"
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_المدفوعات_${getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCertificate = (stud: any, gr: any) => {
    if (!stud) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الشهادة.");
      return;
    }

    const associationName = systemSettings?.associationName || "جمعية الفجر الجديد";
    const associationLogo = systemSettings?.associationLogo || "";

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>شهادة تقديرية - ${stud.fullName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              background-color: #fafaf9;
              color: #1c1917;
              padding: 0;
              margin: 0;
            }
            .certificate-container {
              font-family: 'Amiri', serif;
            }
          </style>
        </head>
        <body class="flex items-center justify-center min-h-screen p-4" onload="window.print(); setTimeout(window.close, 1500);">
          <div class="certificate-container w-full max-w-4xl bg-white border-[16px] border-double border-amber-600 rounded-3xl p-12 text-center relative shadow-2xl overflow-hidden my-4">
            <div class="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-amber-600 rounded-tr-xl opacity-80"></div>
            <div class="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-amber-600 rounded-tl-xl opacity-80"></div>
            <div class="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-amber-600 rounded-br-xl opacity-80"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-amber-600 rounded-bl-xl opacity-80"></div>
            
            <div class="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

            <div class="flex justify-between items-center border-b border-amber-200 pb-6 mb-8">
              <div class="text-right">
                <h3 class="text-sm font-bold text-amber-900 font-sans tracking-tight">${associationName}</h3>
                <p class="text-[11px] text-amber-700 font-sans mt-1">نادي القرآن الكريم وتجويده</p>
                <p class="text-[9px] text-slate-400 font-sans">تاريخ الاختبار: ${gr.examDate}</p>
              </div>
              
              <div class="w-20 h-20 bg-white border-2 border-amber-400 rounded-2xl flex items-center justify-center p-1.5 shadow-md overflow-hidden shrink-0">
                ${associationLogo ? `
                  <img src="${associationLogo}" class="max-w-full max-h-full object-contain" />
                ` : `
                  <svg class="w-full h-full text-amber-600" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="46" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
                    <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#d97706" />
                    <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
                  </svg>
                `}
              </div>
              
              <div class="text-left text-xs font-sans text-amber-900 font-semibold">
                <span class="bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">الرقم الترتيبي: ${gr.id.slice(-5).toUpperCase()}</span>
              </div>
            </div>

            <div class="my-6">
              <h1 class="text-4xl font-extrabold text-amber-800 tracking-wide mb-2">شَـهَـادَة تَقْـدِيـر وَتَمِـيُّـز</h1>
              <div class="h-1 w-40 bg-gradient-to-l from-transparent via-amber-600 to-transparent mx-auto my-3"></div>
            </div>

            <p class="text-sm text-emerald-800 font-bold italic max-w-lg mx-auto mb-8 bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
              "الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ"<br/>
              <span class="text-[11px] text-emerald-600 font-sans not-italic block mt-1">— حديث شريف مروي عن عائشة رضي الله عنها</span>
            </p>

            <div class="space-y-6 text-lg text-slate-800 max-w-2xl mx-auto leading-relaxed">
              <p>
                بكل فخر واعتزاز، تشهد إدارة <span class="font-bold text-amber-900 font-sans">${associationName}</span> لنادي القرآن الكريم أن الطالب / الطالبة:
              </p>
              
              <div class="my-6">
                <h2 class="text-3xl font-black text-emerald-950 underline decoration-amber-500 decoration-wavy decoration-2 underline-offset-8 py-2 inline-block font-sans">${stud.fullName}</h2>
              </div>

              <p class="text-base">
                قد اجتاز بنجاح وتفوق اختبار حفظ وتجويد القرآن الكريم في الجزء المبارك:
              </p>
              
              <div class="bg-amber-50/70 border border-amber-200/50 rounded-2xl px-6 py-2.5 max-w-md mx-auto my-4 text-amber-950 font-bold text-xl">
                [ ${gr.testedPortion} ]
              </div>

              <p class="text-base">
                وحصل على تقدير عام <span class="font-bold text-emerald-800 font-sans">${gr.overallGrade}</span> بمعدل مشرف ينم عن جد ومثابرة:
              </p>
              
              <div class="flex justify-center gap-8 text-xs font-sans font-bold my-4">
                <span class="bg-slate-100 border px-4 py-2 rounded-xl text-slate-700">درجة الحفظ: <span class="text-emerald-700 font-mono text-sm">${gr.memorizationGrade}</span> / 20</span>
                <span class="bg-slate-100 border px-4 py-2 rounded-xl text-slate-700">درجة التجويد: <span class="text-emerald-700 font-mono text-sm">${gr.tajweedGrade}</span> / 20</span>
              </div>

              ${gr.notes ? `
                <div class="p-3.5 bg-amber-50/30 rounded-xl text-sm text-amber-900 italic max-w-lg mx-auto border border-amber-100/50 mt-4">
                  "ملاحظة وتوجيه المدرس: ${gr.notes}"
                </div>
              ` : ''}

              <p class="text-base text-slate-600 mt-6">
                سائلين المولى عز وجل له دوام التوفيق والسداد، والختم القريب لكتاب الله تعالى بالبركة والقبول والرضوان.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-dashed border-amber-200">
              <div class="text-right">
                <p class="text-xs text-slate-400 font-sans mb-6">توقيع وختم الإدارة:</p>
                <div class="h-16 flex items-center justify-start">
                  ${systemSettings?.showStampOnReceipts ? `
                    <div class="border border-red-500/30 text-red-600 rounded-full px-4 py-1.5 inline-block text-xs font-black rotate-[-3deg] border-dashed">
                      ★ ${systemSettings.stampText || "إدارة النادي"} ★
                    </div>
                  ` : `
                    <span class="text-slate-300 italic text-xs">موقع ومعتمد</span>
                  `}
                </div>
              </div>
              <div class="text-left">
                <p class="text-xs text-slate-400 font-sans mb-6">توقيع محفظ الحلقة:</p>
                <div class="h-16 flex items-center justify-end">
                  <span class="text-slate-400 font-serif italic text-sm">أستاذ الحلقة</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintFinancialReport = () => {
    if (filteredPayments.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    const { year: filterYear } = getYearAndMonthFromDate(paymentFilterDate);
    const reportTitle = `التقرير المالي للدفوعات والاشتراكات - لعام ${filterYear || new Date().getFullYear()}`;

    const tableRows = filteredPayments.map(p => {
      const stud = students.find(s => s.id === p.studentId);
      return `
        <tr class="border-b border-slate-100 text-xs">
          <td class="p-2 text-right" style="padding: 8px; text-align: right;">${stud?.fullName || "طالب مجهول"}<br/><span class="text-[9px] text-slate-400">ولي الأمر: ${stud?.parentName || "—"}</span></td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.month} / ${p.year}</td>
          <td class="p-2 text-center font-mono font-bold" style="padding: 8px; text-align: center;">${p.amount} درهم</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.status === "مدفوع" ? "مدفوع ✓" : "غير مدفوع ❌"}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${p.paymentDate || "—"}</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.paymentMethod || "—"}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${p.receiptNo || "—"}</td>
        </tr>
      `;
    }).join("");

    const totalCollected = filteredPayments.filter(p => p.status === "مدفوع").reduce((sum, p) => sum + p.amount, 0);
    const totalPending = filteredPayments.filter(p => p.status === "غير مدفوع").reduce((sum, p) => sum + p.amount, 0);

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${reportTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 40px;
            }
            @media print {
              body { padding: 0px; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="space-y-6">
            <div class="flex justify-between items-center border-b-2 border-emerald-800 pb-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #065f46; padding-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${systemSettings?.associationLogo ? `
                  <div style="width: 50px; height: 50px; background-color: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; shrink-0;">
                    <img src="${systemSettings.associationLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </div>
                ` : ''}
                <div>
                  <h1 class="text-2xl font-black text-emerald-800" style="font-size: 24px; font-weight: 900; color: #065f46; margin: 0;">${systemSettings?.associationName || "نادي الفجر الجديد للقرآن الكريم"}</h1>
                  <p class="text-xs text-slate-500 font-medium mt-1" style="margin: 4px 0 0 0;">التقرير المالي التفصيلي للاشتراكات والرسوم الإدارية</p>
                </div>
              </div>
              <div class="text-left" style="text-align: left;">
                <p class="text-xs text-slate-400">تاريخ إصدار التقرير:</p>
                <p class="text-xs font-mono font-bold text-slate-700">${new Date().toLocaleDateString("ar-MA")}</p>
              </div>
            </div>

            <div class="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200" style="text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 class="text-base font-bold text-slate-800">${reportTitle}</h2>
              <p class="text-xs text-slate-500 mt-1">عدد السجلات الإجمالي في التقرير: ${filteredPayments.length} معاملة</p>
            </div>

            <div class="grid grid-cols-3 gap-4" style="display: grid; grid-template-cols: repeat(3, minmax(0, 1fr)); gap: 16px;">
              <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-emerald-700 font-bold block" style="font-size: 10px; color: #047857; font-weight: 700; display: block;">إجمالي المداخيل المحصلة</span>
                <span class="text-lg font-black font-mono text-emerald-800" style="font-size: 18px; font-weight: 900; color: #065f46;">${totalCollected} درهم</span>
              </div>
              <div class="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center" style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-rose-700 font-bold block" style="font-size: 10px; color: #be123c; font-weight: 700; display: block;">إجمالي المستحقات المعلقة</span>
                <span class="text-lg font-black font-mono text-rose-800" style="font-size: 18px; font-weight: 900; color: #9f1239;">${totalPending} درهم</span>
              </div>
              <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-blue-700 font-bold block" style="font-size: 10px; color: #1d4ed8; font-weight: 700; display: block;">المجموع المتوقع للدفعة</span>
                <span class="text-lg font-black font-mono text-blue-800" style="font-size: 18px; font-weight: 900; color: #1e40af;">${totalCollected + totalPending} درهم</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden mt-6" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px;">
              <table class="w-full text-right text-xs" style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px;">
                <thead class="bg-slate-100 text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <tr>
                    <th class="p-2 text-right" style="padding: 8px;">اسم الطالب</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">الفترة</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">المبلغ</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">حالة السداد</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">تاريخ الدفع</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">طريقة الدفع</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">رقم الوصل</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="flex justify-between items-center pt-8 border-t text-[10px] text-slate-400 mt-10" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; margin-top: 40px; font-size: 10px; color: #94a3b8;">
              <p>نادي الفجر الجديد • إدارة الحسابات والمالية</p>
              <p>الصفحة 1 من 1</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
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

      addSysNotification(
        "تنزيل النسخة الاحتياطية",
        "تم تصدير وتحميل النسخة الاحتياطية الكاملة من قاعدة البيانات (RealmDB) بصيغة JSON بنجاح.",
        "نجاح"
      );
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

        addSysNotification(
          "استرجاع النسخة الاحتياطية",
          "تم استيراد واسترجاع النسخة الاحتياطية الكاملة وإعادة بناء قاعدة البيانات (RealmDB) بنجاح.",
          "نجاح"
        );
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

  const handleSaveSystemSettings = (updatedSettings: SystemSettings) => {
    RealmSimDB.saveSystemSettings(updatedSettings);
    setSystemSettings(updatedSettings);

    if (updatedSettings.directorName && updatedSettings.directorName.trim() && isDirectorRole(currentRole)) {
      const newDirectorName = updatedSettings.directorName.trim();
      const updatedUsers = RealmSimDB.getAppUsers().map(u => {
        if ((u.id === "u1" || u.username === "admin_alfajr") && u.fullName !== newDirectorName) {
          const uUpdated = { ...u, fullName: newDirectorName };
          RealmSimDB.saveAppUser(uUpdated).catch((err) => console.error("Director name sync failed:", err));
          return uUpdated;
        }
        return u;
      });
      setAppUsers(updatedUsers);
    }

    addSysNotification(
      "تحديث الإعدادات",
      "تم تحديث معلومات الجمعية والإعدادات العامة والرسوم المالية بنجاح.",
      "إداري"
    );
    alert("تم حفظ الإعدادات وتحديث معلومات المؤسسة بنجاح!");
  };

  /** Modification d'un compte existant (directeur uniquement : compte + lien d'autorisation). */
  const handleSaveAppUser = async (user: AppUser) => {
    try {
      await RealmSimDB.saveAppUser(user);
    } catch (err) {
      console.error("Save app user failed:", err);
      alert(describeFirebaseError(err));
      return;
    }

    if ((user.id === "u1" || user.username === "admin_alfajr") && user.fullName && systemSettings) {
      if (systemSettings.directorName !== user.fullName) {
        const updatedSysSettings = {
          ...systemSettings,
          directorName: user.fullName,
        };
        RealmSimDB.saveSystemSettings(updatedSysSettings);
        setSystemSettings(updatedSysSettings);
      }
    }

    setAppUsers(RealmSimDB.getAppUsers());
    addSysNotification(
      "تحديث صلاحيات المستخدمين",
      `تم حفظ تعديلات حساب المستخدم (${user.fullName}) بنجاح.`,
      "إداري"
    );
    alert("تم حفظ حساب المستخدم والصلاحيات بنجاح!");
  };

  /**
   * Création d'un compte : Cloud Function `createUserAccount` (compte Firebase
   * Auth + compte applicatif + lien d'autorisation, sans mot de passe stocké).
   */
  const handleCreateAppUser = async (user: AppUser, password: string): Promise<boolean> => {
    const pwError = validateNewPassword(password);
    if (pwError) {
      alert(pwError);
      return false;
    }
    const flags: Record<string, boolean> = {};
    ([
      "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
      "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
      "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
    ] as const).forEach((k) => {
      const v = (user as any)[k];
      if (typeof v === "boolean") flags[k] = v;
    });
    try {
      const res = await createUserAccountRemote({
        username: user.username,
        password,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        email: user.email,
        permissions: user.permissions,
        linkedTeacherId: user.linkedTeacherId,
        linkedStudentIds: user.linkedStudentIds,
        flags,
      });
      const created: AppUser = { ...user, id: res.appUserId, authUid: res.uid, mustChangePassword: true };
      const next = [...RealmSimDB.getAppUsers().filter(u => u.id !== created.id), created];
      RealmSimDB.setCachedAppUsers(next);
      setAppUsers(next);
      addSysNotification(
        "إنشاء حساب مستخدم",
        `تم إنشاء حساب المستخدم (${user.fullName}) باسم الدخول ${user.username} بنجاح.`,
        "إداري"
      );
      alert("تم إنشاء الحساب بنجاح. سيُطلب من المستخدم تغيير كلمة المرور عند أول دخول.");
      return true;
    } catch (err) {
      console.error("Create user account failed:", err);
      alert(describeFirebaseError(err));
      return false;
    }
  };

  /** Réinitialisation du mot de passe d'un autre compte (directeur, Cloud Function). */
  const handleResetUserPassword = async (user: AppUser, newPassword: string): Promise<boolean> => {
    const pwError = validateNewPassword(newPassword);
    if (pwError) {
      alert(pwError);
      return false;
    }
    try {
      await resetUserPasswordRemote(user.id, newPassword);
      addSysNotification(
        "إعادة تعيين كلمة المرور",
        `تمت إعادة تعيين كلمة مرور حساب (${user.fullName}). سيُطلب تغييرها عند الدخول القادم.`,
        "إداري"
      );
      alert("تمت إعادة تعيين كلمة المرور بنجاح.");
      return true;
    } catch (err) {
      console.error("Reset password failed:", err);
      alert(describeFirebaseError(err));
      return false;
    }
  };

  const handleDeleteAppUser = async (userId: string) => {
    try {
      await RealmSimDB.deleteAppUser(userId);
    } catch (err) {
      console.error("Delete app user failed:", err);
      alert(describeFirebaseError(err));
      return;
    }
    setAppUsers(RealmSimDB.getAppUsers());
    addSysNotification(
      "حذف مستخدم",
      "تم حذف حساب المستخدم وتجريده من صلاحيات الوصول إلى النظام بنجاح.",
      "تنبيه"
    );
    alert("تم حذف المستخدم بنجاح!");
  };

  /**
   * « مزامنة فورية للأدوار » : action EXPLICITE du directeur. Aligne rôles et
   * statuts des comptes existants sur les fiches (liens explicites), sans créer
   * de compte ni toucher aux mots de passe.
   */
  const handleHarmonizeUsersWithStaff = async () => {
    if (!isDirectorRole(currentRole)) {
      alert("هذه العملية مخصصة للمدير.");
      return;
    }
    const freshStaff = RealmSimDB.getTeachers();
    const freshUsers = RealmSimDB.getAppUsers();
    const changes = computeAccountAlignment(freshUsers, freshStaff, RealmSimDB.getStudents());
    try {
      for (const u of changes) {
        await RealmSimDB.saveAppUser(u);
      }
    } catch (err) {
      console.error("Harmonize users failed:", err);
      alert(describeFirebaseError(err));
    }
    setAppUsers(RealmSimDB.getAppUsers());
    setTeachers(freshStaff);
    addSysNotification(
      "مزامنة الحسابات والأدوار",
      `تمت مزامنة أدوار الحسابات مع شؤون العاملين وإيقاف حسابات الأشخاص المؤرشفين (${changes.length} حساب محدث).`,
      "نجاح"
    );
  };

  const handlePrintStudentsReport = () => {
    if (filteredStudents.length === 0) {
      alert("لا توجد بيانات طلاب لتصديرها.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    const reportTitle = "تقرير كشف الطلاب والتقدم الدراسي";
    
    const totalCount = filteredStudents.length;
    const maleCount = filteredStudents.filter(s => s.gender === "ذكر").length;
    const femaleCount = filteredStudents.filter(s => s.gender === "أنثى").length;
    const avgHizb = totalCount > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.hizbCount, 0) / totalCount * 10) / 10 : 0;

    const tableRows = filteredStudents.map(s => {
      const parentName = s.parentName || "—";
      const parentPhone = s.parentPhone || "—";
      const statusText = s.isArchived ? "مؤرشف" : "نشط";
      const statusColor = s.isArchived ? "color: #b45309; background-color: #fffbeb;" : "color: #047857; background-color: #ecfdf5;";

      return `
        <tr class="border-b border-slate-100 text-xs">
          <td class="p-3 text-right font-bold text-slate-800" style="padding: 12px; text-align: right;">${s.fullName}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${s.birthDate}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${s.gender}</td>
          <td class="p-3 text-right text-slate-600" style="padding: 12px; text-align: right;">
            <div class="font-medium text-slate-700">${parentName}</div>
            <div class="text-[10px] text-slate-400 font-mono">${parentPhone}</div>
          </td>
          <td class="p-3 text-right" style="padding: 12px; text-align: right;">
            <div class="font-bold text-emerald-800">${s.hizbCount} حزب</div>
            <div class="text-[10px] text-amber-600 font-medium">${s.currentSurah || "—"}</div>
          </td>
          <td class="p-3 text-center font-bold text-slate-700" style="padding: 12px; text-align: center;">${s.tajweedLevel}</td>
          <td class="p-3 text-center" style="padding: 12px; text-align: center;">
            <span class="px-2 py-1 rounded text-[10px] font-bold" style="padding: 4px 8px; border-radius: 4px; font-weight: 700; ${statusColor}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${reportTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 40px;
            }
            @media print {
              body { padding: 0px; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="space-y-6">
            <div class="flex justify-between items-center border-b-2 border-emerald-800 pb-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #065f46; padding-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${systemSettings?.associationLogo ? `
                  <div style="width: 50px; height: 50px; background-color: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; shrink-0;">
                    <img src="${systemSettings.associationLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </div>
                ` : ''}
                <div>
                  <h1 class="text-2xl font-black text-emerald-800" style="font-size: 24px; font-weight: 900; color: #065f46; margin: 0;">${systemSettings?.associationName || "نادي الفجر الجديد للقرآن الكريم"}</h1>
                  <p class="text-xs text-slate-500 font-medium mt-1" style="margin: 4px 0 0 0;">تقرير كشف شؤون الطلاب والتقدم الدراسي</p>
                </div>
              </div>
              <div class="text-left" style="text-align: left;">
                <p class="text-xs text-slate-400">تاريخ التقرير:</p>
                <p class="text-xs font-mono font-bold text-slate-700">${new Date().toLocaleDateString("ar-MA")}</p>
              </div>
            </div>

            <div class="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200" style="text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 class="text-base font-bold text-slate-800">${reportTitle}</h2>
              <p class="text-xs text-slate-500 mt-1">نسخة مطبوعة من سجلات الطلاب والتقدم الدراسي الحالية</p>
            </div>

            <div class="grid grid-cols-3 gap-4" style="display: grid; grid-template-cols: repeat(3, minmax(0, 1fr)); gap: 16px;">
              <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-emerald-700 font-bold block" style="font-size: 10px; color: #047857; font-weight: 700; display: block;">إجمالي الطلاب في الكشف</span>
                <span class="text-lg font-black font-mono text-emerald-800" style="font-size: 18px; font-weight: 900; color: #065f46;">${totalCount} طالب</span>
              </div>
              <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center" style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-amber-700 font-bold block" style="font-size: 10px; color: #b45309; font-weight: 700; display: block;">التوزيع حسب الجنس</span>
                <span class="text-sm font-bold text-amber-800 block mt-1" style="color: #92400e;">${maleCount} ذكور / ${femaleCount} إناث</span>
              </div>
              <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-blue-700 font-bold block" style="font-size: 10px; color: #1d4ed8; font-weight: 700; display: block;">متوسط الحفظ الفعلي</span>
                <span class="text-lg font-black font-mono text-blue-800" style="font-size: 18px; font-weight: 900; color: #1e40af;">${avgHizb} حزب</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden mt-6" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px;">
              <table class="w-full text-right text-xs" style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px;">
                <thead class="bg-slate-100 text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <tr>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">الاسم الكامل</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">تاريخ الميلاد</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">الجنس</th>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">ولي الأمر / الهاتف</th>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">التقدم في الحفظ</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">مستوى التجويد</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="flex justify-between items-center pt-8 border-t text-[10px] text-slate-400 mt-10" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; margin-top: 40px; font-size: 10px; color: #94a3b8;">
              <p>نادي الفجر الجديد • إدارة شؤون الطلاب</p>
              <p>الصفحة 1 من 1</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintLabCard = (printSide: "both" | "front" | "back" = "both") => {
    let sideSuffix = "";
    if (printSide === "front") sideSuffix = " (الوجه فقط)";
    else if (printSide === "back") sideSuffix = " (الظهر فقط)";
    else sideSuffix = " (الوجهين)";

    if (labPrintMode === "single") {
      if (!selectedLabStudentId) {
        alert("الرجاء اختيار طالب أولاً.");
        return;
      }
      const labStudent = students.find(s => s.id === selectedLabStudentId);
      if (!labStudent) return;

      const printContent = document.getElementById("lab-printable-area");
      if (!printContent) {
        alert("تعذر العثور على منطقة معاينة الكارت.");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الكارت.");
        return;
      }

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>بطاقة الطالب - ${labStudent.fullName}${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 0;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              @page {
                margin: 0;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  padding: 0;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: center center; display: flex; justify-content: center; align-items: center; gap: 24px; padding: 20px;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 600);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      addSysNotification(
        "طباعة بطاقة الهوية",
        `تم إرسال بطاقة الطالب(ة) ${labStudent.fullName}${sideSuffix} للطباعة بالمقياس المخصص: ${Math.round(labScale * 100)}%`,
        "نجاح"
      );
    } else {
      if (bulkSelectedIds.length === 0) {
        alert("الرجاء تحديد طالب واحد على الأقل من القائمة الجانبية للطباعة الجماعية.");
        return;
      }

      const printContent = document.getElementById("lab-printable-area");
      if (!printContent) {
        alert("تعذر العثور على منطقة معاينة الكروت.");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الكروت.");
        return;
      }

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>الطباعة الجماعية للبطاقات${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 1.5cm;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 1cm;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  padding: 0;
                }
                .break-inside-avoid {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: top center; width: 100%;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 800);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      addSysNotification(
        "الطباعة الجماعية",
        `تم إرسال عدد ${bulkSelectedIds.length} بطاقات${sideSuffix} للطباعة الجماعية بالمقياس المخصص: ${Math.round(labScale * 100)}%`,
        "نجاح"
      );
    }
  };

  // AI Generation using custom backend route `/api/gemini/analyze`
  const handleGenerateAIReport = async (student: Student) => {
    setAiLoading(true);
    setAiError("");
    setAiReport(null);

    // calculate attendance rate
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const totalDays = studentAttendance.length;
    const presents = studentAttendance.filter(a => a.status === "حاضر" || a.status === "متأخر").length;
    const attendanceRate = totalDays > 0 ? Math.round((presents / totalDays) * 100) : 100;

    // fetch recent grades
    const studentGrades = grades.filter(g => g.studentId === student.id)
      .map(g => `${g.testedPortion}: ${g.overallGrade} (تسميع: ${g.memorizationGrade}/20, تجويد: ${g.tajweedGrade}/20)`)
      .join(", ");

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentName: student.fullName,
          hizbCount: student.hizbCount,
          tajweedLevel: student.tajweedLevel,
          age: new Date().getFullYear() - new Date(student.birthDate).getFullYear(),
          notes: student.notes,
          attendanceRate,
          recentGrades: studentGrades || "لا توجد امتحانات حديثة مسجلة."
        })
      });

      if (!res.ok) {
        throw new Error("فشل في استدعاء خادم التحليل الذكي.");
      }

      const data = await res.json();
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      setAiError("عذراً، حدث خطأ أثناء تشغيل محرك الذكاء الاصطناعي. الرجاء التحقق من مفتاح API وإعادة المحاولة.");
    } finally {
      setAiLoading(false);
    }
  };

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

  // Auto-select student dossier when logged in or viewing as student
  useEffect(() => {
    if (currentRole === "طالب" && currentStudentObj) {
      if (!selectedStudent || selectedStudent.id !== currentStudentObj.id) {
        setSelectedStudent(currentStudentObj);
      }
    }
  }, [currentRole, currentStudentObj]);

  // Account Owner Name & Dynamic First Avatar Letter
  const accountOwnerName = useMemo(() => {
    return currentUser?.fullName || (currentRole === "مدير" ? (systemSettings?.directorName || "مدير النظام") : currentRole === "مدرس" ? "المدرس" : currentRole === "طالب" ? "الطالب" : "ولي الأمر");
  }, [currentRole, systemSettings, currentUser]);

  const userAvatarInitial = useMemo(() => {
    if (!accountOwnerName) return "م";
    const trimmed = accountOwnerName.trim();
    return trimmed ? trimmed.charAt(0) : "م";
  }, [accountOwnerName]);

  const handleOpenProfileModal = () => {
    if (currentUser) {
      setProfileFullName(currentUser.fullName || "");
      setProfilePhone(currentUser.username || "");
    } else {
      setProfileFullName(accountOwnerName);
      setProfilePhone("");
    }
    setProfilePassword("");
    setProfileCurrentPassword("");
    setProfileError("");
    setShowProfileEditModal(true);
  };

  const mustChangePassword = Boolean(currentUser?.mustChangePassword);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if (!profileFullName.trim()) {
      setProfileError("يرجى إدخال الاسم الكامل.");
      return;
    }
    if (!currentUser) return;

    const newPassword = profilePassword;
    if (mustChangePassword && !newPassword) {
      setProfileError("يجب اختيار كلمة مرور جديدة قبل متابعة استعمال المنظومة.");
      return;
    }
    if (newPassword) {
      const pwError = validateNewPassword(newPassword);
      if (pwError) {
        setProfileError(pwError);
        return;
      }
    }

    setProfileSaving(true);
    try {
      // 1. Mot de passe : directement dans Firebase Auth (jamais dans Firestore).
      if (newPassword) {
        await changeOwnPassword(newPassword, profileCurrentPassword || undefined);
      }
      // 2. Champs autorisés de son propre compte.
      const fields: Parameters<typeof updateOwnAppUserFields>[1] = {};
      if (profileFullName.trim() !== currentUser.fullName) fields.fullName = profileFullName.trim();
      if (newPassword) {
        fields.mustChangePassword = false;
        fields.passwordChangedAt = new Date().toISOString();
      }
      if (Object.keys(fields).length > 0) {
        await updateOwnAppUserFields(currentUser.id, fields);
      }
      setCurrentUser({ ...currentUser, ...fields });
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setProfileError(describeFirebaseError(err));
      setProfileSaving(false);
      return;
    }
    setProfileSaving(false);

    if (currentRole === "مدير" && systemSettings && systemSettings.directorName !== profileFullName.trim() && currentUser.id === "u1") {
      const updatedSettings: SystemSettings = {
        ...systemSettings,
        directorName: profileFullName.trim(),
      };
      RealmSimDB.saveSystemSettings(updatedSettings);
      setSystemSettings(updatedSettings);
    }

    addSysNotification(
      "تعديل البيانات الشخصية",
      `تم تحديث بيانات الملف الشخصي لـ (${profileFullName.trim()}) بنجاح.`,
      "نجاح"
    );
    setProfilePassword("");
    setProfileCurrentPassword("");
    alert(newPassword ? "تم تغيير كلمة المرور وتحديث الملف الشخصي بنجاح!" : "تم تحديث بيانات الملف الشخصي بنجاح!");
    setShowProfileEditModal(false);
  };

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

  /**
   * Connexion (Lot 0) : Firebase Auth D'ABORD, puis lecture du lien
   * d'autorisation et du profil. Aucun mot de passe n'est comparé côté client
   * et aucun compte n'est créé à la connexion.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    loginInProgressRef.current = true;

    try {
      const inputUsername = loginUsername.trim();
      const inputPassword = loginPassword;

      if (!inputUsername || !inputPassword.trim()) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور");
        return;
      }

      let credential;
      try {
        credential = await signInWithUsername(inputUsername, inputPassword);
      } catch (authErr: any) {
        const code = authErr?.code || "";
        if (code === "auth/network-request-failed") {
          setLoginError("تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.");
        } else if (code === "auth/too-many-requests") {
          setLoginError("محاولات كثيرة غير ناجحة. يرجى الانتظار قليلاً ثم المحاولة من جديد.");
        } else if (code === "auth/user-disabled") {
          setLoginError("هذا الحساب معطل حالياً. يرجى التواصل مع إدارة الجمعية.");
        } else {
          setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
        return;
      }

      const res = await loadSessionProfile(credential.user.uid);
      if ("error" in res) {
        await signOutUser();
        setLoginError(res.error);
        return;
      }

      ensureCacheOwner(credential.user.uid);
      loadDatabase(res.user.role);
      setAuthUid(credential.user.uid);
      setCurrentUser(res.user);
      setLoginUsername("");
      setLoginPassword("");
      updateOwnAppUserFields(res.user.id, { lastLogin: new Date().toISOString() })
        .catch((err) => console.warn("lastLogin update failed:", err));
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      loginInProgressRef.current = false;
      setLoginLoading(false);
      setAuthChecking(false);
    }
  };

  if (!currentUser && authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>جاري التحقق من الجلسة...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden animate-fade-in" dir="rtl">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl -z-10 opacity-70"></div>
        
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
          {/* Top colored accent line */}
          <div className="h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700"></div>

          <div className="p-6 md:p-8">
            {/* Logo and Association Name */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-3 overflow-hidden p-1.5">
                {systemSettings?.associationLogo ? (
                  <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" fill="#f0fdf4" />
                    <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#F59E0B" />
                    <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36 M19 48 L29 48 M81 48 L71 48" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M42 63 C42 58, 44 53, 39 48 C37 46, 34 48, 32 50" stroke="#059669" strokeWidth="5.5" strokeLinecap="round" />
                    <circle cx="41" cy="44" r="3.5" fill="#059669" />
                    <path d="M58 63 C58 58, 56 53, 61 48 C63 46, 66 48, 68 50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
                    <circle cx="59" cy="44" r="3.5" fill="#DC2626" />
                    <path d="M28 63 C38 71, 62 71, 72 63" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {systemSettings?.associationName || "جمعية الفجر الجديد"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                بوابة الدخول الموحدة لإدارة شؤون حفظ وتجويد القرآن الكريم
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder=""
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 mr-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="• • • • • •"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:bg-emerald-400 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الهوية...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول الآمن</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="px-3 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-2">
          
          {/* Left group: Mobile Hamburger Toggle + Logo + Association Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors focus:outline-none cursor-pointer"
              title="القائمة الرئيسية"
              aria-label="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-base overflow-hidden shrink-0">
              {systemSettings?.associationLogo ? (
                <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                "🌅"
              )}
            </div>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-emerald-900 flex items-center gap-1.5 truncate">
                <span className="truncate">{systemSettings?.associationName || "نادي الفجر الجديد للقرآن"}</span>
                <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-amber-500 text-zinc-950 font-bold px-2 py-0.5 rounded-full shrink-0">نادي القرآن</span>
              </h1>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium truncate">
                لوحة التحكم الشاملة • برعاية {systemSettings?.associationName || "جمعية الفجر الجديد"}
              </p>
            </div>
          </div>

          {/* Right group: Controls & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Cloud Sync Status Indicator */}
            <div 
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold shadow-xs transition-all ${
                syncStatus === "synced" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : syncStatus === "syncing"
                  ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
              title={
                syncStatus === "synced"
                  ? "البيانات متزامنة مع قاعدة البيانات السحابية Firestore في الوقت الفعلي"
                  : syncStatus === "syncing"
                  ? "جاري الاتصال والمزامنة مع السحابة..."
                  : "حدث خطأ أثناء مزامنة البيانات السحابية"
              }
            >
              <Database className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  syncStatus === "synced" 
                    ? "bg-emerald-400" 
                    : syncStatus === "syncing"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  syncStatus === "synced" 
                    ? "bg-emerald-500" 
                    : syncStatus === "syncing"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}></span>
              </span>
              <span className="hidden sm:inline">
                {syncStatus === "synced" 
                  ? "متزامن" 
                  : syncStatus === "syncing"
                  ? "مزامنة..."
                  : "أوفلاين"}
              </span>
            </div>

            {/* Unread notification icon indicator */}
            <div className="relative">
              <button 
                onClick={() => {
                  setActiveTab("notifications");
                  setIsMobileMenuOpen(false);
                }} 
                className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors relative cursor-pointer"
                title="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                {userNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {userNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>

            {/* Live Interactive Profile representation */}
            <div 
              onClick={handleOpenProfileModal}
              className="flex items-center gap-2 border-r border-slate-200 pr-2 sm:pr-3 mr-0.5 sm:mr-1 pl-1 sm:pl-2 py-1 rounded-xl hover:bg-emerald-50/80 active:bg-emerald-100/70 border border-transparent hover:border-emerald-200 transition-all cursor-pointer group select-none relative"
              title="تعديل بيانات ملفك الشخصي"
            >
              <div className="relative shrink-0">
                <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white border border-emerald-400/60 flex items-center justify-center text-xs font-bold font-sans shadow-xs group-hover:scale-105 transition-all">
                  {userAvatarInitial}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="hidden sm:block text-right">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-slate-400 font-bold group-hover:text-emerald-700 transition-colors">أهلاً بك</p>
                  <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-bold text-slate-700 leading-none group-hover:text-emerald-900 transition-colors whitespace-nowrap">
                  {accountOwnerName}
                </p>
              </div>
            </div>

            {/* Safe Logout Button */}
            <button
              onClick={() => handleLogout()}
              className="p-1.5 sm:p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="تسجيل الخروج الآمن"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* FIRESTORE QUOTA EXCEEDED FALLBACK BANNER */}
      {firestoreQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3.5 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
          <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-amber-500 to-amber-600"></div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                <Database className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-900 leading-snug">
                  وضع التشغيل المحلي (أوفلاين) نشط تلقائياً • Offline Fallback Mode Active
                </h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed max-w-4xl">
                  قاعدة البيانات السحابية <strong>Firestore</strong> تجاوزت حصة الاستخدام المجاني اليومي المسموح بها لهذا اليوم.
                  <span className="block mt-1 sm:inline sm:mr-1">
                    <strong>لا تقلق! بياناتك آمنة تماماً ومحفوظة محلياً</strong> في متصفحك. يمكنك الاستمرار في استخدام التطبيق بشكل كامل (إضافة، تعديل، تسجيل الحضور والدفع) وسيتم تخزين جميع التغييرات محلياً ولن تفقد أي تقدم. ستتم مزامنة التغييرات تلقائياً عند إعادة تعيين الحصة أو ترقية الخطة.
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[11px]">
                  <span className="text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-mono font-bold">
                    Project ID: gen-lang-client-0481880143
                  </span>
                  <span className="text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-mono font-bold">
                    Database ID: ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 md:mr-12">
              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0481880143/firestore/databases/ai-studio-a6572431-c7db-4071-82bf-a922d18511ec/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all border border-amber-700 text-center"
              >
                <Database className="w-4 h-4" />
                <span>ترقية خطة Firebase (Blaze)</span>
              </a>
              <a 
                href="https://firebase.google.com/pricing#cloud-firestore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all text-center"
              >
                <Info className="w-4 h-4" />
                <span>تفاصيل الحصص</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM CONTROLS BAR FOR MOBILE */}
      <div className="block md:hidden bg-zinc-900 text-white p-3 flex justify-between items-center px-4">
        <span className="text-xs text-zinc-300 font-bold">
          الحساب: {currentUser?.fullName || (currentRole === "مدير" ? systemSettings?.directorName : "") || "المستخدم"}
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleLogout()}
            className="p-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" dir="rtl">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <aside className="relative w-72 max-w-[85vw] bg-emerald-950 text-emerald-100 flex flex-col p-4 shrink-0 shadow-2xl overflow-y-auto z-10 border-l border-emerald-900 h-full">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-emerald-900">
              <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Menu className="w-4 h-4" />
                القائمة الرئيسية
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant stats card */}
            <div 
              onClick={() => {
                if (currentRole === "طالب") {
                  setActiveTab("students");
                  if (currentStudentObj) setSelectedStudent(currentStudentObj);
                } else if (currentRole === "مدرس") {
                  setActiveTab("dashboard");
                } else if (currentRole === "ولي أمر") {
                  setActiveTab("students");
                } else {
                  setActiveTab("dashboard");
                }
                setIsMobileMenuOpen(false);
              }}
              className="mb-4 p-3 bg-emerald-900/40 hover:bg-emerald-900/60 transition rounded-xl border border-emerald-800 cursor-pointer"
              title={currentRole === "طالب" ? "الانتقال إلى ملف الحفظ والتجويد الشخصي" : "استعراض الإحصائيات"}
            >
              <p className="text-[9px] text-amber-400 tracking-wider font-bold mb-1 uppercase">
                {isStaffOrAdmin
                  ? "إحصائيات الإدارة"
                  : currentRole === "مدرس"
                  ? "إحصائيات الحلقة"
                  : currentRole === "ولي أمر"
                  ? "ملخص أبنائك"
                  : "ملخص الحفظ الشخصي"}
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold font-mono text-white">
                    {isStaffOrAdmin
                      ? totalStudentsCount
                      : currentRole === "مدرس"
                      ? teacherStudents.length
                      : currentRole === "ولي أمر"
                      ? parentStudentsCount
                      : currentStudentObj
                      ? currentStudentObj.hizbCount
                      : 0}
                  </span>
                  <span className="text-[10px] text-emerald-300 mr-1.5">
                    {currentRole === "طالب" ? "حزب محفوظ" : currentRole === "ولي أمر" ? "أبناء" : "طلاب"}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold font-mono text-amber-300">
                    {currentRole === "طالب"
                      ? (currentStudentObj ? (currentStudentObj.tajweedLevel || "متوسط") : "-")
                      : isStaffOrAdmin
                      ? `${furthestHizb} حزب`
                      : currentRole === "مدرس"
                      ? `${teacherFurthestHizb} حزب`
                      : `${parentFurthestHizb} حزب`}
                  </span>
                  <p className="text-[9px] text-emerald-300 leading-none">
                    {currentRole === "طالب" ? "مستوى التجويد" : "أبعد حزب بلغه طالب"}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            {(() => {
              const canReadDashboard = checkUserPermission(currentUser, currentRole, "dashboard", "read");
              const canReadStudents = checkUserPermission(currentUser, currentRole, "students", "read");
              const canReadTeachers = checkUserPermission(currentUser, currentRole, "teachers", "read");
              const canReadAttendance = checkUserPermission(currentUser, currentRole, "attendance", "read");
              const canReadGrades = checkUserPermission(currentUser, currentRole, "grades", "read");
              const canReadPayments = checkUserPermission(currentUser, currentRole, "payments", "read");
              const canReadFinance = checkUserPermission(currentUser, currentRole, "finance", "read");
              const canReadActivities = checkUserPermission(currentUser, currentRole, "activities", "read");
              const canReadClasses = checkUserPermission(currentUser, currentRole, "classes", "read");
              const canReadNotifications = checkUserPermission(currentUser, currentRole, "notifications", "read");
              const canReadIdCards = checkUserPermission(currentUser, currentRole, "id-cards-lab", "read");
              const canReadSettings = checkUserPermission(currentUser, currentRole, "settings", "read");

              return (
                <nav className="space-y-1 flex-1">
                  {canReadDashboard && currentRole !== "مدرس" && (
                    <button
                      onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-400" />
                      <span>لوحة البيانات والتحليل</span>
                    </button>
                  )}

                  {currentRole === "مدرس" && canReadDashboard && (
                    <button
                      onClick={() => { setActiveTab("teacher-dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "teacher-dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-400" />
                      <span>لوحة تحكم المعلم</span>
                    </button>
                  )}

                  {canReadStudents && (
                    <button
                      onClick={() => { setActiveTab("students"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "students" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>
                        {currentRole === "ولي أمر"
                          ? "متابعة أبنائي والطلاب"
                          : currentRole === "طالب"
                          ? "ملفي الشخصي وسجل الحفظ"
                          : currentRole === "مدرس"
                          ? "طلاب الحلقة الدراسية"
                          : "إدارة ملفات الطلاب"}
                      </span>
                    </button>
                  )}

                  {canReadTeachers && (
                    <button
                      onClick={() => { setActiveTab("teachers"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "teachers" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span>شؤون العاملين والمدرسين</span>
                    </button>
                  )}

                  {canReadAttendance && (
                    <button
                      onClick={() => { setActiveTab("attendance"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "attendance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>
                        {currentRole === "ولي أمر" || currentRole === "طالب"
                          ? "متابعة الحضور والغياب"
                          : "تسجيل الحضور والغياب"}
                      </span>
                    </button>
                  )}

                  {canReadGrades && (
                    <button
                      onClick={() => { setActiveTab("grades"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "grades" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>
                        {currentRole === "ولي أمر" || currentRole === "طالب"
                          ? "نتائج الامتحانات والشهادات"
                          : "الامتحانات والشهادات"}
                      </span>
                    </button>
                  )}

                  {canReadPayments && (
                    <button
                      onClick={() => { setActiveTab("payments"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "payments" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>
                        {currentRole === "ولي أمر"
                          ? "سجل الرسوم والمدفوعات"
                          : "الرسوم والمدفوعات"}
                      </span>
                    </button>
                  )}

                  {canReadFinance && (
                    <button
                      onClick={() => { setActiveTab("finance"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "finance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>المحاسبة والمالية الجمعوية</span>
                    </button>
                  )}

                  {canReadActivities && (
                    <button
                      onClick={() => { setActiveTab("activities"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "activities" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>إدارة الأنشطة والرحلات</span>
                    </button>
                  )}

                  {canReadClasses && (
                    <button
                      onClick={() => { setActiveTab("classes"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "classes" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>الفصول والحلقات الدراسية</span>
                    </button>
                  )}

                  {canReadNotifications && (
                    <button
                      onClick={() => { setActiveTab("notifications"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm justify-between ${
                        activeTab === "notifications" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>صندوق الإشعارات</span>
                      </div>
                      {userNotifications.filter(n => !n.isRead).length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                          {userNotifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </button>
                  )}

                  {canReadIdCards && (
                    <button
                      onClick={() => { setActiveTab("id-cards-lab"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "id-cards-lab" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>معمل بطاقات الهوية</span>
                    </button>
                  )}

                  {canReadSettings && (
                    <button
                      onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                        activeTab === "settings" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                      }`}
                    >
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>الإعدادات والمستخدمين</span>
                    </button>
                  )}
                </nav>
              );
            })()}
          </aside>
        </div>
      )}

      {/* CORE FRAMEWORK GRID */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className="hidden md:flex w-64 bg-emerald-950 text-emerald-100 flex-col p-4 shrink-0 border-l border-emerald-900">
          
          {/* Instant stats card adapted per role */}
          <div 
            onClick={() => {
              if (currentRole === "طالب") {
                setActiveTab("students");
                if (currentStudentObj) setSelectedStudent(currentStudentObj);
              } else if (currentRole === "مدرس") {
                setActiveTab("dashboard");
              } else if (currentRole === "ولي أمر") {
                setActiveTab("students");
              } else {
                setActiveTab("dashboard");
              }
            }}
            className="mb-4 p-3 bg-emerald-900/40 hover:bg-emerald-900/60 transition rounded-xl border border-emerald-800 cursor-pointer"
            title={currentRole === "طالب" ? "الانتقال إلى ملف الحفظ والتجويد الشخصي" : "استعراض الإحصائيات"}
          >
            <p className="text-[9px] text-amber-400 tracking-wider font-bold mb-1 uppercase">
              {isStaffOrAdmin
                ? "إحصائيات الإدارة"
                : currentRole === "مدرس"
                ? "إحصائيات الحلقة"
                : currentRole === "ولي أمر"
                ? "ملخص أبنائك"
                : "ملخص الحفظ الشخصي"}
            </p>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-2xl font-bold font-mono text-white">
                  {isStaffOrAdmin
                    ? totalStudentsCount
                    : currentRole === "مدرس"
                    ? teacherStudents.length
                    : currentRole === "ولي أمر"
                    ? parentStudentsCount
                    : currentStudentObj
                    ? currentStudentObj.hizbCount
                    : 0}
                </span>
                <span className="text-[10px] text-emerald-300 mr-1.5">
                  {currentRole === "طالب" ? "حزب محفوظ" : currentRole === "ولي أمر" ? "أبناء" : "طلاب"}
                </span>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold font-mono text-amber-300">
                  {currentRole === "طالب"
                    ? (currentStudentObj ? (currentStudentObj.tajweedLevel || "متوسط") : "-")
                    : isStaffOrAdmin
                    ? `${furthestHizb} حزب`
                    : currentRole === "مدرس"
                    ? `${teacherFurthestHizb} حزب`
                    : `${parentFurthestHizb} حزب`}
                </span>
                <p className="text-[9px] text-emerald-300 leading-none">
                  {currentRole === "طالب" ? "مستوى التجويد" : "أبعد حزب بلغه طالب"}
                </p>
              </div>
            </div>
          </div>

          {(() => {
            const canReadDashboard = checkUserPermission(currentUser, currentRole, "dashboard", "read");
            const canReadStudents = checkUserPermission(currentUser, currentRole, "students", "read");
            const canReadTeachers = checkUserPermission(currentUser, currentRole, "teachers", "read");
            const canReadAttendance = checkUserPermission(currentUser, currentRole, "attendance", "read");
            const canReadGrades = checkUserPermission(currentUser, currentRole, "grades", "read");
            const canReadPayments = checkUserPermission(currentUser, currentRole, "payments", "read");
            const canReadFinance = checkUserPermission(currentUser, currentRole, "finance", "read");
            const canReadActivities = checkUserPermission(currentUser, currentRole, "activities", "read");
            const canReadClasses = checkUserPermission(currentUser, currentRole, "classes", "read");
            const canReadNotifications = checkUserPermission(currentUser, currentRole, "notifications", "read");
            const canReadIdCards = checkUserPermission(currentUser, currentRole, "id-cards-lab", "read");
            const canReadSettings = checkUserPermission(currentUser, currentRole, "settings", "read");

            return (
              <nav className="space-y-1 flex-1">
                {canReadDashboard && currentRole !== "مدرس" && (
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>لوحة البيانات والتحليل</span>
                  </button>
                )}

                {currentRole === "مدرس" && canReadDashboard && (
                  <button
                    onClick={() => setActiveTab("teacher-dashboard")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "teacher-dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>لوحة تحكم المعلم</span>
                  </button>
                )}

                {/* Students tab for all permitted roles */}
                {canReadStudents && (
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "students" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>
                      {currentRole === "ولي أمر"
                        ? "متابعة أبنائي والطلاب"
                        : currentRole === "طالب"
                        ? "ملفي الشخصي وسجل الحفظ"
                        : currentRole === "مدرس"
                        ? "طلاب الحلقة الدراسية"
                        : "إدارة ملفات الطلاب"}
                    </span>
                  </button>
                )}

                {canReadTeachers && (
                  <button
                    onClick={() => setActiveTab("teachers")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "teachers" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>شؤون العاملين والمدرسين</span>
                  </button>
                )}

                {/* Attendance tab */}
                {canReadAttendance && (
                  <button
                    onClick={() => setActiveTab("attendance")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "attendance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {currentRole === "ولي أمر" || currentRole === "طالب"
                        ? "متابعة الحضور والغياب"
                        : "تسجيل الحضور والغياب"}
                    </span>
                  </button>
                )}

                {/* Grades & Exams tab */}
                {canReadGrades && (
                  <button
                    onClick={() => setActiveTab("grades")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "grades" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>
                      {currentRole === "ولي أمر" || currentRole === "طالب"
                        ? "نتائج الامتحانات والشهادات"
                        : "الامتحانات والشهادات"}
                    </span>
                  </button>
                )}

                {/* Payments tab */}
                {canReadPayments && (
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "payments" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>
                      {currentRole === "ولي أمر"
                        ? "سجل الرسوم والمدفوعات"
                        : "الرسوم والمدفوعات"}
                    </span>
                  </button>
                )}

                {canReadFinance && (
                  <button
                    onClick={() => setActiveTab("finance")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "finance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                    id="sidebar-finance-btn"
                  >
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>المحاسبة والمالية الجمعوية</span>
                  </button>
                )}

                {canReadActivities && (
                  <button
                    onClick={() => setActiveTab("activities")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "activities" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                    id="sidebar-activities-btn"
                  >
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>إدارة الأنشطة والرحلات</span>
                  </button>
                )}

                {canReadClasses && (
                  <button
                    onClick={() => setActiveTab("classes")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "classes" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>الفصول والحلقات الدراسية</span>
                  </button>
                )}

                {canReadNotifications && (
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm justify-between ${
                      activeTab === "notifications" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span>صندوق الإشعارات</span>
                    </div>
                    {userNotifications.filter(n => !n.isRead).length > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {userNotifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>
                )}

                {canReadIdCards && (
                  <button
                    onClick={() => setActiveTab("id-cards-lab")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "id-cards-lab" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                    id="sidebar-id-cards-lab-btn"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>معمل بطاقات الهوية</span>
                  </button>
                )}

                {canReadSettings && (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                      activeTab === "settings" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                    }`}
                    id="sidebar-settings-btn"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>إعدادات النظام وإدارة المستخدمين</span>
                  </button>
                )}
              </nav>
            );
          })()}

          {/* REALM SYSTEM LOG FOOTER */}
          <div className="mt-8 pt-4 border-t border-emerald-900/60">
            <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/80 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white text-[10px]">قاعدة بيانات RealmDB</span>
              </div>
              <p className="text-[10px] text-emerald-300">محلية ومحفوظة بنجاح داخل المتصفح.</p>
              <div className="mt-2 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[9px] text-emerald-400">
                <span>تزامن آلي</span>
                <span>نشط الآن</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          
          {/* TAB: TEACHER DASHBOARD */}
          {activeTab === "teacher-dashboard" && currentRole === "مدرس" && (
            <div className="space-y-6 animate-fade-in" dir="rtl">
              {/* Header Welcome Banner */}
              <div className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <span className="bg-amber-400 text-zinc-950 font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full font-sans">بوابة المدرس والمحفّظ</span>
                    <h2 className="text-xl md:text-3xl font-extrabold tracking-tight mt-1 font-sans">
                      مرحباً بك، {activeTeacher?.fullName || "المحفظ الفاضل"} 👋
                    </h2>
                    <p className="text-xs md:text-sm text-emerald-100 max-w-xl leading-relaxed font-sans">
                      تتيح لك هذه اللوحة استعراض الحلقات والطلاب المسندين إليك، وإدخال بيانات الحفظ اليومية، ومتابعة تطور مستويات التجويد لطلابك.
                    </p>
                  </div>
                  {activeTeacher?.specialty && (
                    <div className="bg-emerald-700/50 border border-emerald-500/30 rounded-2xl p-4 text-xs font-sans">
                      <p className="font-bold text-amber-300">التخصص الحالي:</p>
                      <p className="text-white mt-1">{activeTeacher.specialty}</p>
                      {activeTeacher.trainingCourses && activeTeacher.trainingCourses.length > 0 && (
                        <p className="text-emerald-200 mt-1.5 text-[10px]">
                          🎓 {activeTeacher.trainingCourses[0]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KPI STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
                  <p className="text-xs font-bold text-slate-400 mb-1 font-sans">الحلقات المسندة</p>
                  <h3 className="text-3xl font-black text-slate-800 font-mono">{teacherClasses.length}</h3>
                  <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1 font-sans">
                    <span>📚 فصول دراسية نشطة</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
                  <p className="text-xs font-bold text-slate-400 mb-1 font-sans">إجمالي طلابي</p>
                  <h3 className="text-3xl font-black text-slate-800 font-mono">{teacherStudents.length}</h3>
                  <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1 font-sans">
                    <span>🧑‍🎓 طالباً تحت إشرافك</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
                  <p className="text-xs font-bold text-slate-400 mb-1 font-sans">متوسط نسبة الحضور</p>
                  <h3 className="text-3xl font-black text-slate-800 font-mono">{teacherAverageAttendance}%</h3>
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${teacherAverageAttendance}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
                  <p className="text-xs font-bold text-slate-400 mb-1 font-sans">أبعد حزب بلغه طالب</p>
                  <h3 className="text-3xl font-black text-emerald-700 font-mono">{teacherFurthestHizb} <span className="text-sm font-normal text-slate-500">حزب</span></h3>
                  <div className="mt-2 text-[11px] text-slate-500 font-bold flex items-center justify-between font-sans">
                    <span>📖 أقصى حفظ مسجل</span>
                    <span className="text-emerald-700 font-mono">المعدل: {teacherAverageHizb}</span>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN GRID: Left = My Classes, Right = Students Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* MY CLASSES LIST (1 Column) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="border-b pb-3 flex justify-between items-center font-sans">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>الحلقات والحلقات الدراسية المسندة</span>
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold">
                      {teacherClasses.length} حلقات
                    </span>
                  </div>

                  {teacherClasses.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-sans">
                      <p>📭 لم يتم إسناد أي حلقات لك بعد في النظام.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      {teacherClasses.map(cls => {
                        const classStudents = students.filter(s => s.classId === cls.id && !s.isArchived);
                        return (
                          <div key={cls.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition">
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{cls.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">🕒 {cls.schedule}</p>
                            <div className="mt-3 flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-bold">عدد الطلاب:</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono">
                                {classStudents.length} / {cls.maxStudents} طالب
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* MY STUDENTS TABLE & FILE TRIGGER (2 Columns) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 font-sans">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>قائمة الطلاب المسجلين بحلقاتك</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">انقر على "فتح ملف المتابعة" لتسجيل الحفظ ومراجعة الطالب.</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-bold">
                      إجمالي طلابك: {teacherStudents.length} طلاب
                    </span>
                  </div>

                  {teacherStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs flex-1 flex flex-col items-center justify-center font-sans">
                      <p className="text-2xl mb-2">🧒</p>
                      <p>لا يوجد طلاب مسجلون بحلقاتك حالياً.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto flex-1 font-sans">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5 px-3">اسم الطالب</th>
                            <th className="py-2.5 px-2">الحفظ الفعلي</th>
                            <th className="py-2.5 px-2">السورة الحالية</th>
                            <th className="py-2.5 px-2">التجويد</th>
                            <th className="py-2.5 px-2">نسبة الحضور</th>
                            <th className="py-2.5 px-2 text-center">الملف التعليمي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {teacherStudents.map(student => {
                            const attRate = getStudentAttendanceRate(student.id);
                            return (
                              <tr key={student.id} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border shrink-0">
                                      <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover animate-fade-in" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800">{student.fullName}</p>
                                      <p className="text-[9px] text-slate-400">
                                        {classes.find(c => c.id === student.classId)?.name || "بدون فصل"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 font-mono text-emerald-700 font-bold">
                                  {student.hizbCount} حزب
                                </td>
                                <td className="py-3 px-2 text-amber-700 font-bold font-sans">
                                  {student.currentSurah || "غير محدد"}
                                </td>
                                <td className="py-3 px-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    student.tajweedLevel === "ممتاز" ? "bg-emerald-100 text-emerald-800" :
                                    student.tajweedLevel === "متوسط" ? "bg-amber-100 text-amber-800" :
                                    "bg-rose-100 text-rose-800"
                                  }`}>
                                    {student.tajweedLevel}
                                  </span>
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-slate-700 font-bold">{attRate}%</span>
                                    <div className="w-12 bg-slate-100 rounded-full h-1">
                                      <div className={`h-1 rounded-full ${attRate >= 80 ? "bg-emerald-600" : attRate >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${attRate}%` }}></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    onClick={() => {
                                      setTeacherSelectedStudent(student);
                                      setProgressMemorization("");
                                      setProgressRevision("");
                                      setProgressOldRevision("");
                                      setProgressNotes("");
                                      setProgressDate(new Date().toISOString().split("T")[0]);
                                      setShowTeacherStudentFileModal(true);
                                    }}
                                    className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150"
                                  >
                                    📝 متابعة الحفظ والتجويد
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD & ANALYTICS */}
          {activeTab === "dashboard" && checkUserPermission(currentUser, currentRole, "dashboard", "read") && (
            <div className="space-y-6">
              
              {/* Header Info Banner */}
              <div className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-amber-400 text-zinc-950 font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full">الذكاء الاصطناعي متاح</span>
                      <span className="bg-emerald-700/80 border border-emerald-500/30 text-white font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        🟢 متصل بالذاكرة المحلية (RealmDB)
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black">لوحة الإحصائيات لجمعية الفجر الجديد</h2>
                    <p className="text-sm text-emerald-100 max-w-xl">
                      مرحباً بك في النظام التربوي الذكي الخاص بمركز القرآن الكريم. تتيح لك هذه المنصة متابعة شؤون الحلقات والطلاب ومستويات التجويد والرسوم الإدارية بطريقة رقمية ميسرة.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
                    <button
                      onClick={handleBackupRealmDB}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 transition shadow w-full"
                      id="manual-db-backup-btn"
                      title="تحميل نسخة احتياطية كاملة من قاعدة البيانات كملف JSON"
                    >
                      <Database className="w-4.5 h-4.5 text-emerald-300 animate-pulse" />
                      <span>تنزيل نسخة احتياطية كاملة (JSON)</span>
                    </button>
                    
                    <input
                      type="file"
                      id="restore-backup-file-input"
                      accept=".json"
                      onChange={handleRestoreRealmDB}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById("restore-backup-file-input")?.click()}
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 transition shadow w-full"
                      id="manual-db-restore-btn"
                      title="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي"
                    >
                      <RefreshCw className="w-4.5 h-4.5 text-amber-400" />
                      <span>استرجاع نسخة احتياطية</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Widgets Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold">إجمالي الطلاب</p>
                    <p className="text-3xl font-black text-slate-800 mt-1 font-mono">{totalStudentsCount}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">نشطون حالياً</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold">حفظ متقدم (20+ حزب)</p>
                    <p className="text-3xl font-black text-slate-800 mt-1 font-mono">{advancedStudentsCount}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">مشاريع الختم</span>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold">المدفوعات المحصلة</p>
                    <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">{totalPaymentsCollected} <span className="text-sm">درهم</span></p>
                    <span className="text-[10px] text-amber-600 font-bold">{totalUnpaidCount} دفعات معلقة</span>
                  </div>
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold">جودة التجويد العامة</p>
                    <p className="text-xl font-black text-slate-800 mt-1">
                      {excellentTajweedCount} ممتاز / {averageTajweedCount} متوسط / {weakTajweedCount} ضعيف
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {tajweedSuccessPercent}% بمستوى طيب أو متميز
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Teacher performance evaluation chart */}
              <TeacherPerformanceChart
                teachers={teachers}
                classes={classes}
                students={students}
                grades={grades}
              />

              {/* Attendance comparison chart */}
              <AttendanceChart 
                students={students}
                classes={classes}
                attendance={attendance}
              />

              {/* Quick overview of lists & interactive chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual statistics - SVG generated chart of memorization breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-slate-800 text-sm">مستويات حفظ الطلاب الحاليين (بالأحزاب)</h3>
                    <span className="text-xs text-slate-400">توزيع الطلاب</span>
                  </div>
                  
                  {/* SVG Chart visualization representing student progress visually */}
                  <div className="relative pt-2">
                    <div className="flex flex-col gap-4">
                      {students.map((st) => {
                        const percent = Math.min((st.hizbCount / 60) * 100, 100);
                        return (
                          <div key={st.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700">{st.fullName}</span>
                              <span className="text-slate-500 font-mono">{st.hizbCount} حزب / 60 ({Math.round(percent)}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-gradient-to-l from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
                    <p className="font-bold text-emerald-800">ملاحظة تنظيمية:</p>
                    <p>يهدف النادي لمساعدة جميع الأطفال والشيوخ في جمعية الفجر الجديد لختم كتاب الله وضبط مخارج الحروف بتجويد ممتاز.</p>
                  </div>
                </div>

                {/* Important notices & notifications right side */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                      <h3 className="font-bold text-slate-800 text-sm">تنبيهات إدارية هامة</h3>
                      <span className="text-xs text-rose-500 font-bold">تتطلب إجراءً</span>
                    </div>

                    <div className="space-y-3">
                      {/* Alert about missing documents */}
                      {students.some(s => !s.docBirthCert || !s.docParentId || !s.docPhotos) ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-xs text-amber-950">
                          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="font-bold">أوراق إدارية ناقصة لبعض الطلاب</p>
                            <p className="text-amber-800 mt-0.5">تأكد من مراجعة مستندات الطلاب الجدد واستكمالها.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-xs text-emerald-950">
                          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold">الأوراق الإدارية مكتملة</p>
                            <p className="text-emerald-800 mt-0.5">جميع مستندات الطلاب مسجلة بشكل سليم.</p>
                          </div>
                        </div>
                      )}

                      {/* Unpaid alerts */}
                      {totalUnpaidCount > 0 && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 text-xs text-rose-950">
                          <CreditCard className="w-5 h-5 text-rose-600 shrink-0" />
                          <div>
                            <p className="font-bold">رسوم غير مدفوعة معلقة</p>
                            <p className="text-rose-800 mt-0.5">هناك {totalUnpaidCount} مستحقات معلقة لشهر يوليوز والأشهر السابقة.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button 
                      onClick={() => setActiveTab("students")} 
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
                    >
                      الانتقال إلى كشف الطلاب والوثائق
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: STUDENTS DIRECTORY & DOSSIERS */}
          {activeTab === "students" && (
            <div className="space-y-6">
              
              {/* Header Action Row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {currentRole === "طالب"
                      ? "ملفي الشخصي وسجل الحفظ القرآني"
                      : currentRole === "ولي أمر"
                      ? "متابعة الأبناء وسجلات الحفظ"
                      : "إدارة ملفات الطلاب والوثائق الإدارية"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentRole === "طالب"
                      ? "استعراض مقدار الحفظ الحالي، مستوى التجويد، والوثائق الإدارية المعتمدة."
                      : "سجل معلومات الطلاب، تتبع أوراقهم، ومقدار حفظهم وتجويدهم."}
                  </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث باسم الطالب أو ولي الأمر..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <select
                    value={studentArchiveFilter}
                    onChange={(e) => setStudentArchiveFilter(e.target.value as "active" | "archived" | "all")}
                    className="p-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-600 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="active">الطلاب النشطون</option>
                    <option value="archived">الطلاب المؤرشفون</option>
                    <option value="all">الكل (نشط ومؤرشف)</option>
                  </select>

                  {checkUserPermission(currentUser, currentRole, "students", "print") && (
                    <div className="relative group shrink-0">
                      <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm h-full" id="export-students-dropdown-btn">
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>تصدير البيانات</span>
                      </button>
                      <div className="absolute left-0 md:right-0 md:left-auto top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg hidden group-hover:block hover:block z-50 min-w-[160px] overflow-hidden" id="export-students-menu">
                        <button
                          onClick={handleExportStudentsCSV}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 transition font-bold"
                          id="export-students-csv-btn"
                        >
                          📄 تصدير بصيغة CSV
                        </button>
                        <button
                          onClick={handleExportStudentsJSON}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 border-t border-slate-100 transition font-bold"
                          id="export-students-json-btn"
                        >
                          ⚙️ تصدير بصيغة JSON
                        </button>
                        <button
                          onClick={handlePrintStudentsReport}
                          className="w-full text-right px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 border-t border-slate-100 transition font-bold flex items-center gap-1.5"
                          id="export-students-pdf-btn"
                        >
                          🖨️ تصدير PDF / طباعة
                        </button>
                      </div>
                    </div>
                  )}

                  {checkUserPermission(currentUser, currentRole, "students", "create") && (
                    <button
                      onClick={() => handleOpenStudentForm()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة طالب جديد
                    </button>
                  )}
                </div>
              </div>

              {/* Main Directory Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Students Table List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden flex flex-col">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 font-bold text-xs text-slate-700 flex justify-between items-center">
                    <span>قائمة طلاب النادي</span>
                    <span className="text-[10px] text-slate-500">تم العثور على {filteredStudents.length} طالب</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b">
                        <tr>
                          <th className="p-3">الطالب</th>
                          <th className="p-3">ولي الأمر والهاتف</th>
                          <th className="p-3 text-center">أحزاب القرآن</th>
                          <th className="p-3 text-center">التجويد</th>
                          <th className="p-3 text-center">الأوراق الإدارية</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((st) => (
                            <tr 
                              key={st.id} 
                              onClick={() => {
                                setSelectedStudent(st);
                                setAiReport(null);
                              }}
                              className={`cursor-pointer transition-colors ${
                                selectedStudent?.id === st.id ? "bg-emerald-50/40 border-r-4 border-emerald-600" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                                    <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className={`font-bold ${st.isArchived ? "text-slate-400 line-through" : "text-slate-800"}`}>{st.fullName}</p>
                                      {st.isArchived && (
                                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0">
                                          مؤرشف
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-400">ازدياد: {st.birthDate}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="font-medium text-slate-700">{st.parentName}</p>
                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400 inline" /> {st.parentPhone}
                                </p>
                              </td>
                              <td className="p-3 text-center font-bold font-mono text-emerald-800 text-sm">
                                {st.hizbCount} حزب
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  st.tajweedLevel === "ممتاز" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : st.tajweedLevel === "متوسط" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {st.tajweedLevel}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center gap-1.5" title="البطاقة الوطنية لولي الأمر / عقد الازدياد / صورتان">
                                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docParentId ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                                    بطاقة
                                  </span>
                                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docBirthCert ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                                    عقد
                                  </span>
                                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docPhotos ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                                    صور
                                  </span>
                                </div>
                              </td>
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center gap-2">
                                  {checkUserPermission(currentUser, currentRole, "students", "update") && (
                                    <>
                                      <button 
                                        onClick={() => handleOpenStudentForm(st)} 
                                        className="p-1 hover:bg-slate-100 rounded text-slate-600 transition" 
                                        title="تعديل الطالب"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleToggleArchiveStudent(st.id, st.fullName)} 
                                        className={`p-1 rounded transition ${st.isArchived ? "hover:bg-blue-50 text-blue-600" : "hover:bg-amber-50 text-amber-600"}`}
                                        title={st.isArchived ? "إلغاء الأرشفة (تنشيط)" : "أرشفة الطالب"}
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  {checkUserPermission(currentUser, currentRole, "students", "delete") && (
                                    <button 
                                      onClick={() => handleDeleteStudent(st.id, st.fullName)} 
                                      className="p-1 hover:bg-rose-50 rounded text-rose-600 transition" 
                                      title="حذف الطالب"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => { setSelectedStudent(st); setAiReport(null); }}
                                    className="p-1 hover:bg-emerald-50 rounded text-emerald-700 transition" 
                                    title="عرض التفاصيل"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              لا يوجد طلاب مسجلون يطابقون خيارات البحث الحالية.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Detailed Dossier, Printable Member Card & AI Progress Analyzer */}
                <div className="space-y-6">
                  {selectedStudent ? (
                    <>
                      {/* DOSSIER CARD */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-sm">ملف الطالب الرقمي</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded">
                            {selectedStudent.id.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-emerald-500 shrink-0">
                            <StudentAvatar student={selectedStudent} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{selectedStudent.fullName}</h4>
                            <p className="text-xs text-slate-500">{classes.find(c => c.id === selectedStudent.classId)?.name || "فصل غير معين"}</p>
                          </div>
                        </div>

                        {/* Student Details Grid */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">الجنس:</span>
                            <span className="font-semibold text-slate-800">{selectedStudent.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">تاريخ الازدياد:</span>
                            <span className="font-semibold text-slate-800 font-mono">{selectedStudent.birthDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">تاريخ التسجيل:</span>
                            <span className="font-semibold text-slate-800 font-mono">{selectedStudent.registrationDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">اسم ولي الأمر:</span>
                            <span className="font-semibold text-slate-800">{selectedStudent.parentName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">هاتف ولي الأمر:</span>
                            <span className="font-semibold text-slate-800 font-mono">{selectedStudent.parentPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold text-emerald-800">الحفظ الفعلي:</span>
                            <span className="font-bold text-emerald-700 font-mono">{selectedStudent.hizbCount} حزب من القرآن</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">السورة الحالية:</span>
                            <span className="font-semibold text-slate-800 text-amber-600">{selectedStudent.currentSurah}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">مستوى التجويد:</span>
                            <span className="font-bold text-slate-800">{selectedStudent.tajweedLevel}</span>
                          </div>
                        </div>

                        {/* WhatsApp Message Button */}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              const phone = (selectedStudent?.parentPhone || "").replace(/\s+/g, "");
                              let formattedPhone = phone;
                              if (phone.startsWith("0")) {
                                formattedPhone = "212" + phone.substring(1);
                              }
                              const rawMsg = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) ${selectedStudent.fullName} المحترم(ة)... مدرسة نادي الفجر الجديد للقرآن الكريم.`;
                              const encodedMsg = encodeURIComponent(rawMsg);
                              window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, "_blank");
                            }}
                            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 hover:shadow-sm"
                            id="whatsapp-contact-parent-btn"
                          >
                            <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                            </svg>
                            <span>مراسلة ولي الأمر عبر واتساب</span>
                          </button>
                        </div>

                        {/* Administrative documents status list */}
                        <div className="border-t pt-3">
                          <p className="text-xs font-bold text-slate-700 mb-2">الوثائق والملفات الإدارية المقدمة:</p>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                              {selectedStudent.docParentId ? (
                                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                              ) : (
                                <X className="w-4 h-4 text-rose-500 font-bold" />
                              )}
                              <span>فوتوكوبي من البطاقة الوطنية لولي الأمر</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                              {selectedStudent.docBirthCert ? (
                                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                              ) : (
                                <X className="w-4 h-4 text-rose-500 font-bold" />
                              )}
                              <span>عقد ازدياد الطالب</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                              {selectedStudent.docPhotos ? (
                                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                              ) : (
                                <X className="w-4 h-4 text-rose-500 font-bold" />
                              )}
                              <span>صورتان شمسيتان حديثتان</span>
                            </div>
                          </div>
                        </div>

                        {selectedStudent.notes && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                            <p className="font-bold">ملاحظات المعلم:</p>
                            <p className="mt-1 leading-relaxed text-slate-700">{selectedStudent.notes}</p>
                          </div>
                        )}

                        {/* AI ANALYSIS TRIGGERS */}
                        <div className="border-t pt-4">
                          <button
                            onClick={() => handleGenerateAIReport(selectedStudent)}
                            disabled={aiLoading}
                            className="w-full py-2.5 bg-gradient-to-l from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            {aiLoading ? "جاري توليد التقرير بالذكاء الاصطناعي..." : "تحليل تقدم الطالب بالذكاء الاصطناعي"}
                          </button>
                        </div>
                      </div>

                      {/* AI GENERATED PROGRESS PORTAL (CONDITIONAL) */}
                      {(aiReport || aiLoading || aiError) && (
                        <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-xl p-6 border-4 border-amber-400 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-amber-400" />
                              <h4 className="font-bold text-amber-400 text-sm">التقرير التربوي الذكي لجمعية الفجر الجديد</h4>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">موجه بالذكاء الاصطناعي</span>
                          </div>

                          {aiLoading && (
                            <div className="py-8 flex flex-col items-center gap-3">
                              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                              <p className="text-xs text-zinc-400">يقوم الذكاء الاصطناعي بتحليل جودة التلاوة ومستوى الحفظ والمواظبة على الفصول حالياً...</p>
                            </div>
                          )}

                          {aiError && (
                            <div className="p-3 bg-rose-950/50 border border-rose-900 rounded-xl text-xs text-rose-300">
                              {aiError}
                            </div>
                          )}

                          {aiReport && (
                            <div className="space-y-4 text-xs leading-relaxed">
                              {/* 1. Summary */}
                              <div className="space-y-1">
                                <p className="font-bold text-amber-300">📊 ملخص الأداء والتقدم:</p>
                                <p className="text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">{aiReport.summary}</p>
                              </div>

                              {/* 2. Tajweed Tips */}
                              <div className="space-y-1">
                                <p className="font-bold text-amber-300">📖 نصائح عملية للتجويد والتلاوة:</p>
                                <ul className="list-disc pr-4 space-y-1.5 text-zinc-300">
                                  {aiReport.tajweedTips?.map((tip: string, idx: number) => (
                                    <li key={idx}>{tip}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* 3. Suggested Study Plan */}
                              <div className="space-y-1">
                                <p className="font-bold text-amber-300">📅 خطة حفظ ومراجعة مقترحة:</p>
                                <p className="text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">{aiReport.studyPlan}</p>
                              </div>

                              {/* 4. Parent message */}
                              <div className="space-y-1">
                                <p className="font-bold text-emerald-400">🏠 رسالة لولي الأمر في البيت:</p>
                                <p className="text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800 italic">"{aiReport.parentMessage}"</p>
                              </div>

                              {/* 5. Recommended Surahs */}
                              <div className="space-y-1">
                                <p className="font-bold text-amber-300">🎯 سور يوصى بتمتينها وتثبيتها:</p>
                                <div className="flex gap-2">
                                  {aiReport.recommendedSurahs?.map((surah: string, idx: number) => (
                                    <span key={idx} className="bg-emerald-900/40 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/60 font-medium text-[10px]">
                                      {surah}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* DYNAMIC REAL-TIME GENERATED STUDENT CARD (PORTAL VIEW) */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-800">معاينة بطاقة الطالب للاستخدام والتصدير</h4>
                          <span className="text-[10px] text-emerald-700 font-bold">بشعار الجمعية</span>
                        </div>
                        <div className="p-4 bg-slate-100 flex justify-center">
                          <StudentCard 
                            student={selectedStudent} 
                            studentClass={classes.find(c => c.id === selectedStudent.classId)} 
                            canPrint={checkUserPermission(currentUser, currentRole, "students", "print")}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                      الرجاء اختيار طالب من القائمة لعرض تفاصيله وبطاقته أو إجراء تحليلات تقدمه التجويدي بالذكاء الاصطناعي.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: ATTENDANCE MONITORING */}
          {activeTab === "attendance" && (currentRole === "مدير" || currentRole === "مدرس") && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">حصر الحضور والغياب اليومي لحلقات القرآن</h2>
                  <p className="text-xs text-slate-500">اختر الفصل والتاريخ ثم قم برصد الحضور بنقرة زر واحدة.</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                  {/* Search input */}
                  <div className="space-y-1 w-full sm:w-48 md:w-56">
                    <label className="block text-[10px] font-bold text-slate-400">بحث عن طالب (نشط أو مؤرشف):</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={attendanceSearchQuery}
                        onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم أو الهاتف..."
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Class Filter selector */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">حلقة التحفيظ:</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-emerald-800 focus:outline-none"
                    >
                      <option value="all">الكل (جميع الحلقات والطلاب)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">تاريخ الحلقة:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* FAST SCAN ATTENDANCE QR/BARCODE PANEL */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm relative overflow-hidden">
                <style>{`
                  @keyframes scan-line-movement {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                  }
                `}</style>
                {/* Decorative background scan lines */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
                      <QrCode className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">جهاز المسح السريع وبطاقات الهوية</h3>
                      <p className="text-[10px] text-slate-500">سجل حضور طلابك فورياً بمسح الكود الشخصي من بطاقتهم.</p>
                    </div>
                  </div>

                  {/* Toggle Mode */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setIsScanning(false);
                        setShowScannerPanel(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                        showScannerPanel && !isScanning ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>قارئ الأجهزة / يدوي</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowScannerPanel(true);
                        setIsScanning(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                        isScanning ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>كاميرا الهاتف / الجهاز</span>
                    </button>
                    {showScannerPanel && (
                      <button
                        onClick={() => {
                          setIsScanning(false);
                          setShowScannerPanel(false);
                          setScanStatus(null);
                        }}
                        className="px-2 py-1.5 text-rose-500 hover:text-rose-700 font-bold ml-1 rounded-lg"
                        title="إغلاق لوحة القارئ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {!showScannerPanel ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 bg-white/60 rounded-xl p-4 border border-slate-150">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                        هل تريد تتبع حضور طلابك بضغطة زر وبسرعة فائقة؟ قم بتفعيل ميزة المسح السريع لبطاقة الطالب.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setShowScannerPanel(true);
                          setIsScanning(false);
                        }}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Keyboard className="w-4 h-4" />
                        <span>تشغيل القارئ اليدوي</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowScannerPanel(true);
                          setIsScanning(true);
                        }}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Camera className="w-4 h-4" />
                        <span>المسح بالكاميرا</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
                    {/* Scanner Input / Status side */}
                    <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        {isScanning ? (
                          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1.5">
                            <h4 className="font-bold text-emerald-800">طريقة الاستخدام (المسح بالكاميرا):</h4>
                            <ul className="list-disc pr-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                              <li>وجّه الكاميرا الخلفية لجهازك نحو كود الاستجابة السريعة (QR) أو الباركود الموجود خلف بطاقة الطالب.</li>
                              <li>حافظ على ثبات يدك في مكان مضاء جيداً لثانية واحدة.</li>
                              <li>عند التعرف بنجاح، ستسمع صوت "رنين" وسيتم رصد الطالب كـ <span className="font-bold text-emerald-700">"حاضر"</span> تلقائياً.</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="bg-slate-100/60 border border-slate-200 p-3.5 rounded-xl text-xs space-y-3">
                            <div>
                              <h4 className="font-bold text-slate-800">طريقة الاستخدام (القارئ اليدوي / الخارجي):</h4>
                              <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                                استخدم هذه الميزة عند ربط لابتوب/جهاز تابلت بـ <span className="font-bold">مسدس قارئ باركود أو QR خارجي (USB / Bluetooth)</span>، أو لإدخال رمز الطالب يدوياً.
                              </p>
                            </div>

                            {/* Raw gun reader input form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleScannedValue(scannerInputValue);
                                setScannerInputValue("");
                                // Re-focus the input instantly for rapid scanning
                                const inp = document.getElementById("barcode-scanner-input");
                                if (inp) inp.focus();
                              }}
                              className="flex gap-2"
                            >
                              <div className="relative flex-grow">
                                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                                  <Keyboard className="w-4 h-4 text-emerald-600" />
                                </span>
                                <input
                                  id="barcode-scanner-input"
                                  type="text"
                                  value={scannerInputValue}
                                  onChange={(e) => setScannerInputValue(e.target.value)}
                                  placeholder="وجه قارئ الباركود هنا أو اكتب الرمز (مثال: s1)..."
                                  autoFocus
                                  className="w-full text-xs font-bold bg-white border-2 border-emerald-600/30 rounded-xl pr-9 pl-3 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-inner"
                                />
                              </div>
                              <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 rounded-xl shadow transition shrink-0"
                              >
                                إدخال
                              </button>
                            </form>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              💡 نصيحة: عند استخدام مسدس الباركود الخارجي، ستقوم الأداة بمجرد المسح بإرسال الرمز تلقائياً دون الحاجة للنقر على أي زر.
                            </span>
                          </div>
                        )}

                        {/* Scanner Sound Test / Feedback info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>مكبر الصوت ومؤشرات الصوت مفعلة تلقائياً للتنبيه.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => playBeep("success")}
                            className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-100 transition"
                          >
                            🔔 اختبار نغمة الرنين
                          </button>
                        </div>
                      </div>

                      {/* Display Scan status alerts */}
                      {scanStatus && (
                        <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                          scanStatus.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : scanStatus.type === "error"
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"
                        }`}>
                          <span className="text-base">
                            {scanStatus.type === "success" ? "✅" : scanStatus.type === "error" ? "❌" : "ℹ️"}
                          </span>
                          <div className="space-y-1">
                            <p className="font-bold">{scanStatus.type === "success" ? "تم بنجاح" : scanStatus.type === "error" ? "خطأ في الرصد" : "حالة المستشعر"}</p>
                            <p className="text-[11px] leading-relaxed opacity-90">{scanStatus.message}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera Feed side */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center">
                      {isScanning ? (
                        <div className="w-full max-w-[280px] space-y-3">
                          {/* Simulated Camera Window */}
                          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-4 border-emerald-600/30 shadow-lg">
                            <div 
                              className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] z-20 pointer-events-none" 
                              style={{
                                animation: "scan-line-movement 3s infinite linear"
                              }}
                            />
                            
                            {/* Scanning viewport guidelines corners */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-emerald-400 z-10 rounded-tl-md pointer-events-none" />
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-emerald-400 z-10 rounded-tr-md pointer-events-none" />
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-emerald-400 z-10 rounded-bl-md pointer-events-none" />
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-emerald-400 z-10 rounded-br-md pointer-events-none" />

                            {/* Viewport for html5qrcode */}
                            <div id="qr-scanner-viewport" className="w-full h-full object-cover" />
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsScanning(false)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition shadow flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>تعطيل كاميرا المسح</span>
                          </button>
                        </div>
                      ) : (
                        <div className="aspect-square w-full max-w-[240px] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500">
                            <Camera className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-600">الكاميرا معطلة حالياً</p>
                            <p className="text-[10px] text-slate-400 mt-1">انقر على زر الكاميرا بالأعلى لتفعيل التعرف البصري الفوري.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsScanning(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg shadow-sm hover:shadow transition"
                          >
                            تفعيل البصريات
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Urgent Alerts box */}
              {(() => {
                const studentsWithConsecutiveAbsences = (selectedClassId === "all" ? students : students.filter(s => s.classId === selectedClassId))
                  .filter(st => !st.isArchived)
                  .map(st => ({ student: st, count: getConsecutiveAbsences(st.id) }))
                  .filter(item => item.count >= 3);

                if (studentsWithConsecutiveAbsences.length > 0) {
                  return (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-4 animate-fade-in" id="urgent-attendance-alerts">
                      <div className="flex items-center gap-2 text-rose-800">
                        <span className="text-xl">⚠️</span>
                        <h3 className="font-bold text-xs sm:text-sm">إنذارات الغياب المتكرر العاجلة (3 غيابات متتالية أو أكثر)</h3>
                      </div>
                      <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                        تم رصد طلاب متغيبين لثلاث حصص متتالية أو أكثر. يرجى الضغط على زر "إرسال إنذار غياب" للتواصل الفوري مع أولياء الأمور وتنبيههم لتبرير الغياب.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {studentsWithConsecutiveAbsences.map(({ student, count }) => (
                          <div key={student.id} className="bg-white border border-rose-100 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
                            <div className="space-y-1">
                              <p className="font-bold text-xs text-slate-800">{student.fullName}</p>
                              <p className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg inline-block">
                                🚨 متغيب لـ {count} حصص متتالية
                              </p>
                              <p className="text-[10px] text-slate-400 block">ولي الأمر: {student.parentName} ({student.parentPhone})</p>
                            </div>
                            <button
                              onClick={() => handleSendAbsenceWarning(student)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] sm:text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow transition shrink-0"
                            >
                              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                              </svg>
                              <span>إرسال إنذار غياب</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Attendance Grid list */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>{selectedClassId === "all" ? "جميع طلاب حلقات التحفيظ" : `طلاب ${classes.find(c => c.id === selectedClassId)?.name || ""}`}</span>
                  <span className="text-emerald-700 font-mono">تاريخ الرصد: {attendanceDate}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(() => {
                    const filtered = (selectedClassId === "all"
                      ? students
                      : students.filter(st => st.classId === selectedClassId)
                    ).filter(st => {
                      if (attendanceSearchQuery.trim() === "") {
                        return !st.isArchived;
                      } else {
                        const query = attendanceSearchQuery.toLowerCase().trim();
                        return (st.fullName || "").toLowerCase().includes(query) ||
                               (st.parentName || "").toLowerCase().includes(query) ||
                               (st.parentPhone || "").includes(query);
                      }
                    });

                    return filtered.length > 0 ? (
                      filtered.map((st) => {
                        const record = attendance.find(a => a.date === attendanceDate && a.studentId === st.id);
                        const status = record?.status || "غير مرصود";
                        const studentClass = classes.find(c => c.id === st.classId);

                        return (
                          <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <div 
                                onClick={() => {
                                  setSelectedStudentForReport(st);
                                  setShowMonthlyReportModal(true);
                                }}
                                className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border cursor-pointer hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 transition"
                                title="عرض كشف حضور الطالب الشهري"
                              >
                                <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedStudentForReport(st);
                                      setShowMonthlyReportModal(true);
                                    }}
                                    className={`font-bold text-xs text-right hover:text-emerald-700 hover:underline flex items-center gap-1 transition ${st.isArchived ? "text-slate-400 line-through" : "text-slate-800"}`}
                                    title="عرض كشف حضور الطالب الشهري"
                                  >
                                    <span>{st.fullName}</span>
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                  {st.isArchived && (
                                    <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                      مؤرشف
                                    </span>
                                  )}
                                  {selectedClassId === "all" && studentClass && (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                                      🏫 {studentClass.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span>ولي الأمر: {st.parentName} ({st.parentPhone})</span>
                                  {getConsecutiveAbsences(st.id) >= 3 && (
                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-lg animate-pulse">
                                      ⚠️ غائب لـ {getConsecutiveAbsences(st.id)} حصص متتالية
                                    </span>
                                  )}
                                  {record?.notes && (
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-medium px-1.5 py-0.5 rounded-lg">
                                      📝 {record.notes}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {getConsecutiveAbsences(st.id) >= 3 && (
                                <button
                                  onClick={() => handleSendAbsenceWarning(st)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ml-2 shadow-sm"
                                  id={`send-warning-btn-${st.id}`}
                                  title="إرسال إنذار غياب فوري عبر واتساب"
                                >
                                  <svg className="w-3.5 h-3.5 fill-rose-600" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                                  </svg>
                                  <span>إرسال إنذار غياب</span>
                                </button>
                              )}

                              <span className="text-[10px] font-bold text-slate-400 ml-2">الحالة المرصودة:</span>

                              <button
                                onClick={() => handleToggleAttendance(st.id, "حاضر")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  status === "حاضر" 
                                    ? "bg-emerald-600 text-white shadow-sm" 
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                حاضر ✅
                              </button>

                              <button
                                onClick={() => handleToggleAttendance(st.id, "متأخر")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  status === "متأخر" 
                                    ? "bg-amber-500 text-zinc-950 shadow-sm" 
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                متأخر 🕒
                              </button>

                              <button
                                onClick={() => handleToggleAttendance(st.id, "غائب")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  status === "غائب" 
                                    ? "bg-rose-600 text-white shadow-sm" 
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                }`}
                              >
                                غائب ❌
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا يوجد طلاب مسجلون في هذا الفصل حالياً.
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: EXAM GRADES & CERTIFICATES */}
          {activeTab === "grades" && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">نتائج امتحانات الحفظ والتجويد وإصدار الشهادات</h2>
                  <p className="text-xs text-slate-500">سجل نتائج الاختبارات الدورية التي يشرف عليها معلمو الحلقات.</p>
                </div>

                {checkUserPermission(currentUser, currentRole, "grades", "create") && (
                  <button
                    onClick={() => {
                      if (students.length > 0) {
                        handleOpenGradeForm(students[0].id);
                      } else {
                        alert("يرجى تسجيل طلاب أولاً.");
                      }
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    رصد نتيجة اختبار جديدة
                  </button>
                )}
              </div>

              {/* Grades Table & Certificate generator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Grades list */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b font-bold text-xs text-slate-700">
                    قائمة شهادات الاختبار المعتمدة
                  </div>

                  <div className="divide-y divide-slate-100">
                    {grades.length > 0 ? (
                      grades.map((gr) => {
                        const stud = students.find(s => s.id === gr.studentId);
                        const teacher = teachers.find(t => t.id === gr.examinerId);

                        return (
                          <div key={gr.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50/40">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-400 text-zinc-950 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                  {gr.overallGrade}
                                </span>
                                <h4 className="font-bold text-slate-800 text-sm">{stud?.fullName || "طالب مجهول"}</h4>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-500">
                                <p>الامتحان: <span className="font-bold text-slate-700">{gr.testedPortion}</span></p>
                                <p>درجة الحفظ: <span className="font-bold font-mono text-emerald-700">{gr.memorizationGrade}/20</span></p>
                                <p>درجة التجويد: <span className="font-bold font-mono text-emerald-700">{gr.tajweedGrade}/20</span></p>
                                <p className="md:col-span-3">تاريخ الاختبار: <span className="font-mono font-medium">{gr.examDate}</span></p>
                              </div>

                              {gr.notes && (
                                <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 italic">
                                  "{gr.notes}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {/* Printable Certificate button simulated with simple alert/print window */}
                              {checkUserPermission(currentUser, currentRole, "grades", "print") && (
                                <button
                                  onClick={() => handlePrintCertificate(stud, gr)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                >
                                  📜 عرض الشهادة التقديرية
                                </button>
                              )}

                              {checkUserPermission(currentUser, currentRole, "grades", "delete") && (
                                <button
                                  onClick={() => handleDeleteGrade(gr.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لم يتم رصد اختبارات أو شهادات تقديرية للطلاب بعد.
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Showcase mockup */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-4 border-amber-300 text-center space-y-4 shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
                  
                  <div className="border border-amber-200 p-4 rounded-xl space-y-3">
                    <span className="text-3xl block">📜</span>
                    <h3 className="font-serif font-black text-amber-900 text-base">شهادة حفظ وتميز تجويدي</h3>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-serif">
                      قال رسول الله صلى الله عليه وسلم:<br/>
                      <span className="font-bold italic">"الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ"</span>
                    </p>
                    
                    <div className="h-0.5 bg-gradient-to-l from-transparent via-amber-400 to-transparent my-2" />
                    
                    <p className="text-xs text-slate-700 leading-relaxed">
                      يصدر النادي شهادات معتمدة مع طباعة أوتوماتيكية للطلاب المتميزين تشجيعاً لهم في مسيرتهم التعليمية مع كتاب الله.
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-amber-700 font-bold">بإشراف جمعية الفجر الجديد نادي القرآن</p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: PAYMENTS & ADMINISTRATIVE FEES */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              
              {/* PAGE HEADER */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-700" />
                    إدارة المصروفات ومستحقات أولياء الأمور الشاملة
                  </h2>
                  <p className="text-xs text-slate-500">تتبع رسوم الاشتراك الشهري، تفاصيل الدفع، طباعة الإيصالات، ومشاركة التنبيهات مع أولياء الأمور.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {checkUserPermission(currentUser, currentRole, "payments", "print") && (
                    <>
                      <button
                        onClick={handleExportPaymentsToCSV}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        title="تصدير السجل المالي الحالي كملف CSV المتوافق مع إكسيل"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>تصدير CSV</span>
                      </button>

                      <button
                        onClick={handlePrintFinancialReport}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        title="عرض وطباعة كشف مالي تفصيلي PDF"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>تصدير PDF / طباعة</span>
                      </button>
                    </>
                  )}

                  {checkUserPermission(currentUser, currentRole, "payments", "create") && (
                    <button
                      onClick={() => handleOpenPaymentForm()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة سجل دفع جديد
                    </button>
                  )}
                </div>
              </div>

              {/* STATS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Collected */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0">
                    🪙
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي المقبوضات</span>
                    <span className="text-lg font-black font-mono text-emerald-700">{totalPaymentsCollected} درهم</span>
                  </div>
                </div>

                {/* Unpaid Amount */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
                    ⏳
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي المستحقات المتأخرة</span>
                    <span className="text-lg font-black font-mono text-rose-700">{totalUnpaidAmount} درهم</span>
                  </div>
                </div>

                {/* Unpaid Count */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold shrink-0">
                    📑
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">الفواتير المعلقة</span>
                    <span className="text-lg font-black font-mono text-amber-700">{totalUnpaidCount} مطالبة</span>
                  </div>
                </div>

                {/* Expected Total */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
                    📊
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">المداخيل المتوقعة</span>
                    <span className="text-lg font-black font-mono text-blue-700">{totalPaymentsCollected + totalUnpaidAmount} درهم</span>
                  </div>
                </div>
              </div>

              {/* FINANCIAL FLOW CHART */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 animate-fade-in" id="financial-flow-chart-widget">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      📊 التدفق المالي والمداخيل الشهرية لعام {getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear()}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      متابعة إجمالي الاشتراكات والمبالغ المحصلة شهرياً مقارنة بالمستحقات المعلقة
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md"></span>
                      <span className="text-[11px] text-slate-600 font-bold">المداخيل المحصلة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-amber-500 rounded-md"></span>
                      <span className="text-[11px] text-slate-600 font-bold">المستحقات المعلقة</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full animate-fade-in" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={paymentChartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                        stroke="#cbd5e1"
                      />
                      <YAxis 
                        tickFormatter={(val) => `${val} د.م.`}
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                        stroke="#cbd5e1"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          direction: 'rtl', 
                          textAlign: 'right', 
                          borderRadius: '12px', 
                          borderColor: '#cbd5e1',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                        }}
                        formatter={(value: any, name: string) => [`${value} درهم`, name]}
                      />
                      <RechartsBar dataKey="المداخيل المحصلة" fill="#059669" radius={[4, 4, 0, 0]} />
                      <RechartsBar dataKey="المستحقات المعلقة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                  {/* Search bar */}
                  <div className="space-y-1 w-full sm:w-64">
                    <label className="block text-[10px] font-bold text-slate-400">البحث السريع عن الطلاب:</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={paymentSearchQuery}
                        onChange={(e) => setPaymentSearchQuery(e.target.value)}
                        placeholder="ابحث باسم الطالب، ولي الأمر، أو الإيصال..."
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="month"
                        value={paymentFilterDate}
                        onChange={(e) => setPaymentFilterDate(e.target.value)}
                        className="p-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer shadow-sm"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">اختر شهر الرصد</span>
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">حالة الدفع:</label>
                    <select
                      value={paymentFilterStatus}
                      onChange={(e) => setPaymentFilterStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-emerald-800 focus:outline-none"
                    >
                      <option value="all">كل حالات السداد</option>
                      <option value="مدفوع">مدفوع ✅</option>
                      <option value="غير مدفوع">غير مدفوع ❌</option>
                    </select>
                  </div>
                </div>

                {(paymentSearchQuery || paymentFilterDate !== "" || paymentFilterStatus !== "all") && (
                  <button
                    onClick={() => {
                      setPaymentSearchQuery("");
                      setPaymentFilterDate("");
                      setPaymentFilterStatus("all");
                    }}
                    className="text-[10px] text-rose-600 font-bold hover:underline self-end flex items-center gap-1"
                  >
                    إعادة تعيين الفلاتر 🔄
                  </button>
                )}
              </div>

              {/* PAYMENTS LEDGER TABLE */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>سجل المعاملات والمدفوعات ({sortedPayments.length} سجل مطابق)</span>
                  <span className="text-[10px] text-slate-500 font-medium">مبلغ الاشتراك الأساسي: 100 درهم / شهر (عرض 70 درهم لشهر 7 و8 من هذه السنة)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] border-b">
                      <tr>
                        <th 
                          onClick={() => handleTogglePaymentSort("studentName")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>الطالب وعائلته</span>
                            {paymentSortKey === "studentName" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleTogglePaymentSort("monthYear")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>فترة الاشتراك</span>
                            {paymentSortKey === "monthYear" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleTogglePaymentSort("amount")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>المبلغ المستحق</span>
                            {paymentSortKey === "amount" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleTogglePaymentSort("paymentDate")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>تفاصيل السداد والمعاملة</span>
                            {paymentSortKey === "paymentDate" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleTogglePaymentSort("receiptNo")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>رقم الوصل</span>
                            {paymentSortKey === "receiptNo" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleTogglePaymentSort("status")}
                          className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>حالة الدفع</span>
                            {paymentSortKey === "status" ? (
                              paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedPayments.length > 0 ? (
                        sortedPayments.map((p) => {
                          const stud = students.find(s => s.id === p.studentId);
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                              {/* Student Column */}
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                    <StudentAvatar student={stud} alt={stud?.fullName} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{stud?.fullName || "طالب مجهول"}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">ولي الأمر: {stud?.parentName || "—"} • {stud?.parentPhone || "—"}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Month & Year */}
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold text-[10px]">
                                  {p.month} / {p.year}
                                </span>
                              </td>

                              {/* Amount */}
                              <td className="p-3">
                                <span className="font-bold font-mono text-slate-800 text-sm">{p.amount}</span>
                                <span className="text-[10px] text-slate-400 mr-1">درهم</span>
                              </td>

                              {/* Payment details (method + notes) */}
                              <td className="p-3 space-y-1">
                                {p.status === "مدفوع" ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                                      <span>تاريخ الدفع:</span>
                                      <span className="font-mono font-medium text-slate-800">{p.paymentDate || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] border border-emerald-100">
                                        💰 {p.paymentMethod || "نقداً"}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">بانتظار سداد رسوم الشهر</span>
                                )}

                                {p.notes && (
                                  <p className="text-[9px] bg-amber-50 text-amber-800 border border-amber-100 p-1 rounded max-w-xs leading-relaxed italic">
                                    💬 {p.notes}
                                  </p>
                                )}
                              </td>

                              {/* Receipt Number */}
                              <td className="p-3">
                                <span className="font-mono text-slate-600 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px]">
                                  {p.receiptNo || "—"}
                                </span>
                              </td>

                              {/* Status badge */}
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[9px] font-bold inline-block border ${
                                  p.status === "مدفوع" 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                    : "bg-rose-50 text-rose-800 border-rose-100"
                                }`}>
                                  {p.status === "مدفوع" ? "مكتمل السداد ✓" : "معلق / غير مدفوع"}
                                </span>
                              </td>

                              {/* Actions Column */}
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Quick toggle payment status */}
                                  {checkUserPermission(currentUser, currentRole, "payments", "update") && (
                                    <button
                                      onClick={() => handleTogglePayment(p.id)}
                                      title={p.status === "مدفوع" ? "تحديد كغير مدفوع" : "تحديد كمدفوع"}
                                      className={`p-1.5 rounded-lg border transition ${
                                        p.status === "مدفوع"
                                          ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                          : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                      }`}
                                    >
                                      {p.status === "مدفوع" ? "❌ إلغاء" : "✅ تسديد"}
                                    </button>
                                  )}

                                  {/* Print Receipt (PDF) */}
                                  {p.status === "مدفوع" && checkUserPermission(currentUser, currentRole, "payments", "print") && (
                                    <button
                                      onClick={() => handlePrintReceipt(p)}
                                      title="طباعة وصل مالي رسمي"
                                      className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* WhatsApp notification link */}
                                  {stud && (
                                    <button
                                      onClick={() => handleWhatsAppShare(p)}
                                      title="مشاركة إيصال / تنبيه دفع على الواتساب لولي الأمر"
                                      className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                                    >
                                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                    </button>
                                  )}

                                  {/* Edit */}
                                  {checkUserPermission(currentUser, currentRole, "payments", "update") && (
                                    <button
                                      onClick={() => handleOpenPaymentForm(p)}
                                      title="تعديل تفاصيل الدفعة"
                                      className="p-1.5 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100 rounded-lg transition"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete */}
                                  {checkUserPermission(currentUser, currentRole, "payments", "delete") && (
                                    <button
                                      onClick={() => handleDeletePayment(p.id)}
                                      title="حذف السجل نهائياً"
                                      className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                            لا توجد أي مدفوعات مطابقة لمعايير التصفية والبحث الحالية.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5.5: ASSOCIATION FINANCE & ACCOUNTING */}
          {activeTab === "finance" && (
            <FinanceManagement
              students={students}
              teachers={teachers}
              payments={payments}
              otherIncomes={otherIncomes}
              salaryPayments={salaryPayments}
              expenses={expenses}
              activities={activities}
              activityParticipants={activityParticipants}
              activityExpenses={activityExpenses}
              systemSettings={systemSettings}
              canEditPayments={checkUserPermission(currentUser, currentRole, "finance", "update")}
              canCreateFinance={checkUserPermission(currentUser, currentRole, "finance", "create")}
              canUpdateFinance={checkUserPermission(currentUser, currentRole, "finance", "update")}
              canDeleteFinance={checkUserPermission(currentUser, currentRole, "finance", "delete")}
              canPrintFinance={checkUserPermission(currentUser, currentRole, "finance", "print")}
              onSaveOtherIncome={handleSaveOtherIncome}
              onDeleteOtherIncome={handleDeleteOtherIncome}
              onSaveSalaryPayment={handleSaveSalaryPayment}
              onDeleteSalaryPayment={handleDeleteSalaryPayment}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              onNavigateToActivities={() => setActiveTab("activities")}
            />
          )}

          {/* TAB 5.6: ACTIVITIES & TRIPS MANAGEMENT */}
          {activeTab === "activities" && (
            <ActivitiesManagement
              activities={activities}
              participants={activityParticipants}
              activityExpenses={activityExpenses}
              students={students}
              teachers={teachers}
              classes={classes}
              systemSettings={systemSettings}
              canCreateActivity={checkUserPermission(currentUser, currentRole, "activities", "create")}
              canUpdateActivity={checkUserPermission(currentUser, currentRole, "activities", "update")}
              canDeleteActivity={checkUserPermission(currentUser, currentRole, "activities", "delete")}
              canPrintActivity={checkUserPermission(currentUser, currentRole, "activities", "print")}
              onSaveActivity={handleSaveActivity}
              onDeleteActivity={handleDeleteActivity}
              onSaveParticipant={handleSaveActivityParticipant}
              onDeleteParticipant={handleDeleteActivityParticipant}
              onSaveActivityExpense={handleSaveActivityExpense}
              onDeleteActivityExpense={handleDeleteActivityExpense}
              onSyncToFinance={handleSyncActivityToFinance}
              onNavigateToFinance={() => setActiveTab("finance")}
            />
          )}

          {/* TAB 6: CLASSES & SCHEDULES */}
          {activeTab === "classes" && (
            <ClassManagement
              classes={classes}
              teachers={teachers}
              students={students}
              currentRole={currentRole}
              canEditTeachers={checkUserPermission(currentUser, currentRole, "classes", "update")}
              canCreateClasses={checkUserPermission(currentUser, currentRole, "classes", "create")}
              canUpdateClasses={checkUserPermission(currentUser, currentRole, "classes", "update")}
              canDeleteClasses={checkUserPermission(currentUser, currentRole, "classes", "delete")}
              onSaveClass={handleSaveClass}
              onArchiveToggle={handleArchiveClassToggle}
              onDeleteClass={handleDeleteClass}
              onSelectStudent={setSelectedStudent}
              onSwitchTab={setActiveTab}
            />
          )}

          {/* TAB: TEACHERS MANAGEMENT */}
          {activeTab === "teachers" && (
            <TeacherManagement
              teachers={teachers}
              classes={classes}
              currentRole={currentRole}
              systemSettings={systemSettings}
              canEditTeachers={checkUserPermission(currentUser, currentRole, "teachers", "update")}
              canCreateTeachers={checkUserPermission(currentUser, currentRole, "teachers", "create")}
              canUpdateTeachers={checkUserPermission(currentUser, currentRole, "teachers", "update")}
              canDeleteTeachers={checkUserPermission(currentUser, currentRole, "teachers", "delete")}
              onSaveTeacher={handleSaveTeacher}
              onArchiveToggle={handleArchiveTeacherToggle}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {/* TAB 7: NOTIFICATIONS BOX */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-700" />
                    {currentRole === "ولي أمر"
                      ? "صندوق إشعارات وتنبيهات أولياء الأمور"
                      : currentRole === "طالب"
                      ? "صندوق الإشعارات الشخصية للطالب"
                      : "صندوق الإشعارات الفورية والتنبيهات"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentRole === "ولي أمر"
                      ? "إشعارات خاصة بانتظام وحفظ وحضور أبنائك والرسوم المستحقة."
                      : currentRole === "طالب"
                      ? "إشعارات وتنبيهات الأنشطة والامتحانات وسجل الحفظ الخاص بك."
                      : "تابع العمليات الإدارية، المالية والتربوية دقيقة بدقيقة."}
                  </p>
                </div>

                {currentRole === "مدير" && (
                  <button
                    onClick={() => {
                      RealmSimDB.clearAllNotifications();
                      loadDatabase();
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                  >
                    مسح جميع التنبيهات
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {userNotifications.length > 0 ? (
                  userNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        RealmSimDB.markNotificationAsRead(n.id);
                        loadDatabase();
                      }}
                      className={`p-4 flex gap-4 transition cursor-pointer hover:bg-slate-50/50 ${!n.isRead ? "bg-emerald-50/10 border-r-4 border-emerald-600" : ""}`}
                    >
                      <div className="text-2xl pt-0.5">
                        {n.type === "نجاح" ? "🟢" : n.type === "تنبيه" ? "🔴" : n.type === "مالي" ? "🪙" : "📁"}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 text-xs">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{n.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        
                        {!n.isRead && (
                          <span className="inline-block text-[9px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">
                            جديد • انقر لتعليم كقروء
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs font-medium">
                    لا توجد إشعارات أو تنبيهات موجهة لك حالياً.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: ID CARDS LAB */}
          {activeTab === "id-cards-lab" && (() => {
            const labStudent = students.find(s => s.id === selectedLabStudentId) || students[0];
            const labStudentClass = labStudent ? classes.find(c => c.id === labStudent.classId) : undefined;

            const renderFrontSide = (student: typeof students[0], studentClass: any) => {
              if (!student) return null;
              return (
                <div
                  id={`student-card-front-${student.id}`}
                  className="w-[330px] h-[500px] rounded-3xl bg-gradient-to-b from-emerald-900 via-emerald-800 to-zinc-900 text-white relative shadow-2xl overflow-hidden border border-emerald-600/30 select-none flex flex-col justify-between shrink-0"
                  style={{ direction: "rtl" }}
                >
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                  <div className="p-5 border-b border-white/10 relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-amber-400 font-bold overflow-hidden shrink-0">
                        {systemSettings?.associationLogo ? (
                          <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          "🌅"
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-wide text-amber-400">{systemSettings?.associationName || "جمعية الفجر الجديد"}</h3>
                        <p className="text-[9px] text-emerald-200 font-medium">نادي القرآن الكريم وتجويده</p>
                      </div>
                    </div>
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">بطاقة هوية</span>
                  </div>

                  <div className="px-5 py-2 flex flex-col items-center relative z-10 flex-grow justify-center gap-4">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-amber-400 shadow-md bg-zinc-800 flex items-center justify-center">
                        <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-amber-500 text-zinc-950 font-bold text-[10px] px-3 py-0.5 rounded-full shadow border border-amber-300 whitespace-nowrap">طالب</div>
                    </div>

                    <div className="text-center w-full mt-1">
                      <h4 className="text-lg font-bold text-white drop-shadow-sm">{student.fullName}</h4>
                      <p className="text-xs text-emerald-300 mt-0.5">{studentClass?.name || "فصل غير معين"}</p>
                    </div>

                    <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5 space-y-1.5 text-xs text-right">
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>رقم الطالب:</span>
                        <span className="font-mono text-amber-400 font-bold">{student.id.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>تاريخ الازدياد:</span>
                        <span className="font-semibold">{student.birthDate}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>اسم ولي الأمر:</span>
                        <span className="font-semibold text-emerald-300">{student.parentName}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>هاتف ولي الأمر:</span>
                        <span className="font-mono font-semibold text-amber-400">{student.parentPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950/40 border-t border-white/5 relative z-10 flex items-center justify-between text-[10px] text-zinc-400 rounded-b-3xl">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-500" /><span>تسجيل: {student.registrationDate}</span></span>
                    <span className="text-amber-400/80 font-semibold text-[10px]">نور القلوب بالقرآن</span>
                  </div>
                </div>
              );
            };

            const renderBackSide = (student: typeof students[0]) => {
              if (!student) return null;
              return (
                <div
                  id={`student-card-back-${student.id}`}
                  className="w-[330px] h-[500px] rounded-3xl bg-zinc-900 text-white relative shadow-2xl overflow-hidden border border-zinc-700 select-none flex flex-col justify-between shrink-0"
                  style={{ direction: "rtl" }}
                >
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  
                  <div className="p-5 border-b border-zinc-800 text-center relative z-10">
                    <h4 className="text-sm font-bold text-amber-400">تعليمات وضوابط النادي</h4>
                    <p className="text-[9px] text-zinc-400 mt-1">تلتزم إدارة نادي الفجر الجديد بالمحافظة على تميز الطلاب</p>
                  </div>

                  <div className="px-6 py-4 flex flex-col items-center justify-center gap-4 relative z-10 flex-grow">
                    <ul className="text-[10px] text-zinc-300 space-y-2.5 w-full bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 text-right">
                      <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>الحضور في الوقت المحدد وبثياب تليق بحلقة كتاب الله تعالى.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>يجب الحفاظ على نظافة المصحف والممتلكات الخاصة بالجمعية.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>تقديم هذه البطاقة شرط أساسي للدخول وحضور الفصول والأنشطة.</span></li>
                    </ul>

                    <div className="flex items-center gap-4 w-full bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/60 justify-around">
                      <div className="flex flex-col items-center gap-1.5 bg-white p-1.5 rounded-xl shrink-0 shadow-sm border border-slate-100">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.id)}`}
                          alt={`QR Code for ${student.fullName}`}
                          className="w-14 h-14 object-contain rounded-md"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[6px] text-zinc-800 font-mono font-bold select-all">ALFAJR ID-{student.id}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="flex items-center bg-white p-2 rounded-lg py-3">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div
                              key={i}
                              className="bg-zinc-800"
                              style={{
                                width: `${(stIdCode => {
                                  const c = stIdCode.charCodeAt(i % stIdCode.length) || 1;
                                  return (c % 3) + 1;
                                })(student.id)}px`,
                                marginLeft: "1px",
                                height: "24px",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[7px] font-mono tracking-widest text-zinc-400 mt-1">*{student.id.toUpperCase()}*</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-1 text-[9px] text-zinc-400 rounded-b-3xl">
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1 text-[8px]"><Phone className="w-3 h-3 text-amber-500" /><span>هاتف الجمعية: {systemSettings?.associationPhone || "06.74.633.108"}</span></span>
                      <span className="flex items-center gap-1 text-[8px]"><MapPin className="w-3 h-3 text-emerald-500" /><span>مقر الجمعية: سلا</span></span>
                    </div>
                  </div>
                </div>
              );
            };

            const renderOfficialFrontSide = (student: typeof students[0], studentClass: any) => {
              if (!student) return null;
              return (
                <div
                  id={`official-card-front-${student.id}`}
                  className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-5 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
                  style={{ boxSizing: "border-box", direction: "rtl" }}
                >
                  {/* Subtle Arabesque Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
                  <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

                  {/* Main Content Wrap */}
                  <div className="flex flex-col items-center w-full flex-grow">
                    {/* Header with Logo Only (Prominent and Centered) */}
                    <div className="w-full flex items-center justify-center border-b border-slate-100 pb-3 mb-3">
                      <div className="w-[300px] h-[100px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-1.5 shadow-md">
                        {systemSettings?.associationLogo ? (
                          <img
                            src={systemSettings.associationLogo}
                            alt="Logo"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="46" fill="#f0fdf4" />
                            <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#F59E0B" />
                            <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36 M19 48 L29 48 M81 48 L71 48" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
                            <path d="M42 63 C42 58, 44 53, 39 48 C37 46, 34 48, 32 50" stroke="#059669" strokeWidth="5.5" strokeLinecap="round" />
                            <circle cx="41" cy="44" r="3.5" fill="#059669" />
                            <path d="M58 63 C58 58, 56 53, 61 48 C63 46, 66 48, 68 50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
                            <circle cx="59" cy="44" r="3.5" fill="#DC2626" />
                            <path d="M28 63 C38 71, 62 71, 72 63" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Card Title & Subtitle */}
                    <div className="text-center mb-3">
                      <h2 className="text-lg font-black text-teal-900 tracking-tight leading-none">بطاقة الطالب</h2>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest">نادي القرآن</p>
                    </div>

                    {/* Student Photo Section */}
                    <div className="relative mb-3">
                      <div className="w-32 h-32 rounded-[26px] overflow-hidden border-4 border-teal-100 shadow-md bg-slate-50 flex items-center justify-center relative">
                        <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
                      </div>
                      {/* Photo Frame Badge Overlay */}
                      <div className="absolute -bottom-1 -left-1 bg-white border border-slate-100 rounded-full p-1.5 shadow-md flex items-center justify-center">
                        <div className="w-5 h-5 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>

                    {/* Student Name Box */}
                    <div className="w-full max-w-[290px] border border-teal-100 bg-gradient-to-b from-teal-50/30 to-white rounded-2xl p-2.5 text-center shadow-sm mb-3">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">اسم الطالب:</span>
                      <h1 className="text-base font-black text-teal-900 tracking-tight leading-tight">{student.fullName}</h1>
                    </div>

                    {/* Header Row: Contact Title & Season Pill */}
                    <div className="w-full flex items-center justify-between gap-2 mb-2.5">
                      {/* للتواصل معنا on the right (first in RTL) */}
                      <div className="bg-teal-700 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-full shadow-xs">
                        للتواصل معنا :
                      </div>

                      {/* موسم on the left (second in RTL) */}
                      <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-[9.5px] text-slate-500 font-bold flex items-center gap-1">
                        <span>موسم:</span>
                        <span className="text-teal-800 font-black">1448</span>
                      </div>
                    </div>

                    {/* Contact Details Grid */}
                    <div className="w-full text-[9px] text-slate-500 leading-tight space-y-2 mt-1">
                      
                      {/* Address card */}
                      <div className="flex items-start gap-2 bg-slate-50/55 p-2 rounded-xl border border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <div className="text-right text-slate-700">
                          <span className="font-bold text-teal-900">العنوان:</span> زنقة طارق ابن زياد رقم 3 حي الرشاد قطاع 2 القرية سلا
                        </div>
                      </div>

                      {/* Phone card */}
                      <div className="flex items-center justify-between bg-slate-50/55 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-teal-700" />
                          <span className="font-bold text-teal-900">الهاتف أو الواتساب:</span>
                        </div>
                        <span className="font-black text-teal-800 font-mono tracking-wider text-[10px]">06.74.633.108</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Socials & Certified Badge */}
                  <div className="w-full border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[8px] text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-teal-800">
                        <Globe className="w-3 h-3 text-teal-600" />
                        <span>جمعية الفجر الجديد</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-blue-800">
                        <Facebook className="w-3 h-3 text-blue-600" />
                        <span>الفجر الجديد</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100 font-extrabold text-[7px] uppercase tracking-wide">
                      <span>معتمد</span>
                    </div>
                  </div>
                </div>
              );
            };

            const renderOfficialBackSide = (student: typeof students[0]) => {
              if (!student) return null;

              // Fetch student's payments
              const studentPayments = RealmSimDB.getPayments().filter(
                (p) => p.studentId === student.id && p.status === "مدفوع"
              );

              // Helper to check if a specific month is paid
              const isMonthPaid = (monthName: string): boolean => {
                return studentPayments.some((p) => {
                  const pMonth = p.month.trim();
                  if (monthName === "يوليو" || monthName === "يوليوز") {
                    return pMonth === "يوليو" || pMonth === "يوليوز";
                  }
                  if (monthName === "شتنبر" || monthName === "شتمبر") {
                    return pMonth === "شتنبر" || pMonth === "شتمبر";
                  }
                  return pMonth === monthName;
                });
              };

              const cardMonths = [
                { name: "يوليو", num: 7, hijri: "محرم" },
                { name: "غشت", num: 8, hijri: "صفر" },
                { name: "شتنبر", num: 9, hijri: "ربيع الأول" },
                { name: "أكتوبر", num: 10, hijri: "ربيع الآخر" },
                { name: "نونبر", num: 11, hijri: "جمادى الأول" },
                { name: "دجنبر", num: 12, hijri: "جمادى الآخر" },
                { name: "يناير", num: 1, hijri: "رجب" },
                { name: "فبراير", num: 2, hijri: "شعبان" },
                { name: "مارس", num: 3, hijri: "رمضان" },
                { name: "أبريل", num: 4, hijri: "شوال" },
                { name: "ماي", num: 5, hijri: "ذو القعدة" },
                { name: "يونيو", num: 6, hijri: "ذو الحجة" },
              ];

              return (
                <div
                  id={`official-card-back-${student.id}`}
                  className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-4 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
                  style={{ boxSizing: "border-box", direction: "rtl" }}
                >
                  {/* Subtle Arabesque Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

                  {/* Card Header Back */}
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="text-right">
                      <h2 className="text-xs font-black text-teal-900 leading-tight">بطاقة الانخراط الشهري</h2>
                      <p className="text-[7.5px] text-slate-400 font-bold mt-0.5">يوضع الختم على الأشهر المؤدى عنها</p>
                    </div>

                    <div className="text-left">
                      <p className="text-[7px] text-slate-400 font-bold leading-none">الموسم الدراسي لسنة:</p>
                      <p className="text-[9px] text-teal-800 font-extrabold font-mono mt-0.5">2026-2027 / 1448</p>
                    </div>
                  </div>

                  {/* 12 Months Stamps Grid */}
                  <div className="grid grid-cols-3 gap-2 flex-grow justify-center items-center py-1">
                    {cardMonths.map((m, idx) => {
                      const paid = isMonthPaid(m.name);
                      return (
                        <div
                          key={idx}
                          className={`border rounded-xl p-2 text-center h-[72px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                            paid 
                              ? "border-teal-200 bg-teal-50/20 shadow-2xs" 
                              : "border-slate-200/80 bg-slate-50/55 hover:bg-slate-50"
                          }`}
                        >
                          {/* Month Heading */}
                          <div className="flex justify-between items-center w-full border-b border-slate-100/70 pb-1">
                            <span className="text-[8.5px] font-black text-slate-800 leading-none">
                              {m.name} ({m.num})
                            </span>
                            <span className="text-[7.5px] font-bold text-slate-400 leading-none font-mono">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Hijri Match */}
                          <div className="text-[8.5px] font-bold text-teal-800 py-1 leading-tight text-center">
                            {m.hijri}
                          </div>

                          {/* Stamp Container */}
                          {paid ? (
                            /* High fidelity retro dynamic circular ink stamp */
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div 
                                className="w-[52px] h-[52px] border-2 border-red-600/85 rounded-full flex flex-col items-center justify-center text-red-600/85 font-black uppercase tracking-tighter text-[7.5px] leading-none bg-white/70 p-0.5 scale-95 shadow-sm transform rotate-[-8deg]"
                                style={{ fontFamily: "'Cairo', sans-serif" }}
                              >
                                <div className="border border-dashed border-red-500/60 rounded-full w-full h-full flex flex-col items-center justify-center p-0.5">
                                  <span className="text-[6px] text-red-500/70 scale-90">مؤدى عنه</span>
                                  <span className="text-[8px] font-black tracking-widest my-0.5">★ تم ★</span>
                                  <span className="text-[5px] text-red-500/70 scale-75">الفجر الجديد</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Empty Stamp Marker Slot */
                            <div className="text-[7px] text-slate-300 font-bold leading-none flex items-center justify-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                              <span>خانة الختم</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Rules & Notes Bar */}
                  <div className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-right text-[8px] text-amber-900 leading-normal mt-2">
                    <span className="font-extrabold text-amber-950 block mb-0.5">* تعليمات هامة:</span>
                    يجب الإدلاء بهذه البطاقة عند الأداء الشهري في النادي. شكراً لتعاونكم ودعمكم المستمر للجمعية ومشاركتكم في خدمة كتاب الله.
                  </div>

                  {/* Back Footer Bar */}
                  <div className="w-full border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[7px] text-slate-400 font-bold font-mono">
                    <span>ID: {student.id.toUpperCase()}</span>
                    <span>نادي القرآن الكريم - سلا</span>
                    <span>المغرب</span>
                  </div>
                </div>
              );
            };

            const renderFront = idCardLabTab === "student-card" ? renderOfficialFrontSide : renderFrontSide;
            const renderBack = idCardLabTab === "student-card" ? renderOfficialBackSide : renderBackSide;

            return (
              <div className="space-y-6" style={{ direction: "rtl" }}>
                <div className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-1 rounded-full">استوديو الطباعة الرقمية</span>
                      <h2 className="text-2xl md:text-3xl font-black">معمل بطاقات الهوية الرقمية والطباعة الاحترافية</h2>
                      <p className="text-sm text-emerald-100 max-w-xl">
                        قم بمعاينة وتصميم بطاقة الهوية الذكية لكل طالب، مع إمكانية تصغير وتكبير المقاس بدقة متناهية لتلائم كافة طابعات الكروت البلاستيكية (CR80) أو الورقية بجودة عالية. يتم توليد رمز الاستجابة السريعة (QR Code) تلقائياً على ظهر البطاقة لتسجيل الحضور السريع بمجرد مسحه بالكاميرا.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-emerald-700/80 border border-emerald-500/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                        🖨️ جاهز للتصدير المباشر
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUB-TABS FOR LAB */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 gap-2 shadow-xs">
                  <button
                    onClick={() => setIdCardLabTab("student-card")}
                    className={`flex-1 sm:flex-initial py-3 px-6 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
                      idCardLabTab === "student-card"
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <Award className="w-4.5 h-4.5 text-amber-400" />
                    <span>بطاقة الطالب الرسمية (نادي القرآن)</span>
                  </button>
                  <button
                    onClick={() => setIdCardLabTab("membership-card")}
                    className={`flex-1 sm:flex-initial py-3 px-6 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
                      idCardLabTab === "membership-card"
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <QrCode className="w-4.5 h-4.5 text-amber-400" />
                    <span>بطاقة الهوية الرقمية (QR & Barcode)</span>
                  </button>
                </div>

                {/* TWO PANEL WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* RIGHT PANEL: STUDENT SELECTOR */}
                  <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-800">قائمة الطلاب</h3>
                      <p className="text-[11px] text-slate-500">اختر طالباً للمعاينة، أو حدد دفعة من الطلاب للطباعة الجماعية.</p>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4 text-emerald-600" />
                      </span>
                      <input
                        type="text"
                        value={searchLabQuery}
                        onChange={(e) => setSearchLabQuery(e.target.value)}
                        placeholder="ابحث باسم الطالب أو الرقم التعريفي..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>

                    {/* Bulk Selection Controls */}
                    {(() => {
                      const filteredLabStudents = students.filter(s => {
                        const normSearch = searchLabQuery.toLowerCase().trim();
                        if (!normSearch) return !s.isArchived;
                        return (s.fullName || "").toLowerCase().includes(normSearch) || (s.id || "").toLowerCase().includes(normSearch);
                      });
                      const allFilteredSelected = filteredLabStudents.length > 0 && filteredLabStudents.every(st => bulkSelectedIds.includes(st.id));

                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={allFilteredSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Add all filtered ones to bulk selection
                                    const newIds = Array.from(new Set([...bulkSelectedIds, ...filteredLabStudents.map(st => st.id)]));
                                    setBulkSelectedIds(newIds);
                                  } else {
                                    // Remove all filtered ones from bulk selection
                                    const filteredIds = filteredLabStudents.map(st => st.id);
                                    setBulkSelectedIds(bulkSelectedIds.filter(id => !filteredIds.includes(id)));
                                  }
                                }}
                                className="w-4 h-4 accent-emerald-600 rounded border-slate-300"
                              />
                              <span>تحديد الكل ({filteredLabStudents.length})</span>
                            </label>
                            {bulkSelectedIds.length > 0 && (
                              <button
                                onClick={() => setBulkSelectedIds([])}
                                className="text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 text-[11px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>إلغاء ({bulkSelectedIds.length})</span>
                              </button>
                            )}
                          </div>
                          
                          {bulkSelectedIds.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setLabPrintMode("bulk");
                                }}
                                className={`flex-1 text-[11px] py-1.5 px-2.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                                  labPrintMode === "bulk"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                }`}
                              >
                                🖨️ تفعيل الطباعة الجماعية ({bulkSelectedIds.length})
                              </button>
                              {labPrintMode === "bulk" && (
                                <button
                                  onClick={() => setLabPrintMode("single")}
                                  className="text-[11px] py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
                                >
                                  عودة للمنفرد
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Student list container */}
                    <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1.5">
                      {students.filter(s => {
                        const normSearch = searchLabQuery.toLowerCase().trim();
                        if (!normSearch) return !s.isArchived;
                        return (s.fullName || "").toLowerCase().includes(normSearch) || (s.id || "").toLowerCase().includes(normSearch);
                      }).map((st) => {
                        const isSelected = st.id === selectedLabStudentId;
                        const isBulkChecked = bulkSelectedIds.includes(st.id);
                        const stClass = classes.find(c => c.id === st.classId);
                        return (
                          <div
                            key={st.id}
                            className={`group w-full p-2 rounded-xl flex items-center gap-2.5 transition border ${
                              isSelected 
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-sm" 
                                : "bg-white hover:bg-slate-50 border-transparent text-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isBulkChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSelectedIds([...bulkSelectedIds, st.id]);
                                } else {
                                  setBulkSelectedIds(bulkSelectedIds.filter(id => id !== st.id));
                                }
                              }}
                              className="w-4 h-4 accent-emerald-600 rounded border-slate-300 cursor-pointer"
                            />
                            
                            <button
                              onClick={() => {
                                setSelectedLabStudentId(st.id);
                                setLabFlip(false);
                              }}
                              className="flex-1 flex items-center gap-2.5 text-right overflow-hidden"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="font-bold text-xs truncate">{st.fullName}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {st.id.toUpperCase()}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                                    {stClass?.name || "غير محدد"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LEFT PANEL: CARD CUSTOMIZER & PREVIEW */}
                  <div className="lg:col-span-8 space-y-6">
                    {labStudent ? (
                      <>
                        {/* Interactive Controls panel */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="font-bold text-sm text-slate-800">
                                {idCardLabTab === "student-card" 
                                  ? "خيارات تخصيص بطاقة الطالب الرسمية" 
                                  : "خيارات تخصيص بطاقة الهوية الرقمية"}
                              </h3>
                              <p className="text-[11px] text-slate-500">اضبط المقياس وتنسيق الطباعة والجهوزية بدقة متناهية.</p>
                            </div>
                            
                            {checkUserPermission(currentUser, currentRole, "id-cards-lab", "print") && (
                              <div className="flex flex-wrap items-center gap-2">
                                {/* 1. Print Both Sides */}
                                <button
                                  onClick={() => handlePrintLabCard("both")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md hover:shadow-lg"
                                  title="طباعة وجه وظهر البطاقة معاً"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>
                                    {labPrintMode === "bulk" 
                                      ? `طباعة الوجهين للدفعة (${bulkSelectedIds.length})` 
                                      : "طباعة الوجهين"}
                                  </span>
                                </button>

                                {/* 2. Print Front Only */}
                                <button
                                  onClick={() => handlePrintLabCard("front")}
                                  className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm hover:shadow-md"
                                  title="طباعة الجهة الأمامية للبطاقة فقط"
                                >
                                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                                  <span>
                                    {labPrintMode === "bulk" 
                                      ? `طباعة الوجه للدفعة (${bulkSelectedIds.length})` 
                                      : "طباعة الوجه فقط"}
                                  </span>
                                </button>

                                {/* 3. Print Back Only */}
                                <button
                                  onClick={() => handlePrintLabCard("back")}
                                  className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm hover:shadow-md"
                                  title="طباعة الجهة الخلفية للبطاقة فقط"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    {labPrintMode === "bulk" 
                                      ? `طباعة الظهر للدفعة (${bulkSelectedIds.length})` 
                                      : "طباعة الظهر فقط"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Scale Slider & Presets */}
                            <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-700 flex justify-between">
                                <span>نسبة تكبير / تصغير البطاقة للطباعة:</span>
                                <span className="text-emerald-700 font-mono font-black bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                                  {Math.round(labScale * 100)}% ({labScale.toFixed(2)}x)
                                </span>
                              </label>

                              {/* Range slider */}
                              <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.05"
                                value={labScale}
                                onChange={(e) => setLabScale(parseFloat(e.target.value))}
                                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                              />

                              {/* Scale presets */}
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "70% (صغيرة)", val: 0.7 },
                                  { label: "85% (بطاقة CR80)", val: 0.85 },
                                  { label: "100% (كاملة)", val: 1.0 },
                                  { label: "120% (كبيرة)", val: 1.2 },
                                  { label: "140% (توضيحية)", val: 1.4 },
                                ].map((preset) => (
                                  <button
                                    key={preset.val}
                                    onClick={() => setLabScale(preset.val)}
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                                      Math.abs(labScale - preset.val) < 0.01
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Layout and Display Options */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="block text-xs font-bold text-slate-700 mb-2">تنسيق عرض الجهات:</span>
                                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px]">
                                    <button
                                      onClick={() => {
                                        setLabViewMode("both");
                                        setLabDisplayType("print");
                                      }}
                                      className={`py-1.5 rounded-lg font-bold transition text-center ${
                                        labViewMode === "both" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      الوجهين
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLabViewMode("front");
                                        setLabDisplayType("print");
                                      }}
                                      className={`py-1.5 rounded-lg font-bold transition text-center ${
                                        labViewMode === "front" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      الوجه
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLabViewMode("back");
                                        setLabDisplayType("print");
                                      }}
                                      className={`py-1.5 rounded-lg font-bold transition text-center ${
                                        labViewMode === "back" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      الظهر
                                    </button>
                                  </div>
                                </div>

                                {/* Print Mode Selector */}
                                <div>
                                  <span className="block text-xs font-bold text-slate-700 mb-2">طريقة المعاينة:</span>
                                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px]">
                                    <button
                                      onClick={() => setLabPrintMode("single")}
                                      className={`py-1.5 rounded-lg font-bold transition text-center ${
                                        labPrintMode === "single" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      منفرد
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (bulkSelectedIds.length === 0) {
                                          setBulkSelectedIds([labStudent.id]);
                                        }
                                        setLabPrintMode("bulk");
                                        setLabDisplayType("print");
                                      }}
                                      className={`py-1.5 rounded-lg font-bold transition text-center ${
                                        labPrintMode === "bulk" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      دفعة ({bulkSelectedIds.length})
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* View style toggle */}
                              <div>
                                <span className="block text-xs font-bold text-slate-700 mb-2">طريقة عرض المعمل:</span>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                                  <button
                                    onClick={() => setLabDisplayType("print")}
                                    className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                                      labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>مخطط الطباعة</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLabDisplayType("3d");
                                      setLabViewMode("both");
                                    }}
                                    className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                                      labDisplayType === "3d" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>معاينة ثلاثية الأبعاد تفاعلية</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tip */}
                          <p className="text-[10px] text-slate-400 font-medium">
                            💡 نصيحة للطباعة الاحترافية: للطباعة على كروت البلاستيك، يوصى بمقياس <span className="font-bold text-emerald-700">85% (بطاقة CR80)</span>. أما للطباعة على ورق مقوى عادي يفضل المقدار <span className="font-bold text-emerald-700">100%</span>.
                          </p>
                        </div>

                        {/* LIVE DISPLAY AREA */}
                        <div className="bg-slate-100 rounded-3xl p-6 border-2 border-dashed border-slate-200 flex justify-center items-start overflow-hidden min-h-[580px] relative">
                          
                          {/* Interactive indicator for 3D mode */}
                          {labDisplayType === "3d" && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm animate-bounce z-20">
                              🔄 انقر فوق الكارت لقلبه
                            </div>
                          )}

                          {/* Dynamic Scaled Container */}
                          <div 
                            id="lab-printable-area" 
                            className="transition-all duration-300 w-full flex justify-center"
                            style={{
                              transform: labDisplayType === "print" ? `scale(${labScale})` : "none",
                              transformOrigin: "top center",
                              marginBottom: labDisplayType === "print" ? `${((idCardLabTab === "student-card" ? 550 : 500) * (labScale - 1)) + 20}px` : "0px",
                            }}
                          >
                            
                            {/* 1. FLAT PRINT MODE */}
                            {labDisplayType === "print" && (
                              labPrintMode === "single" ? (
                                <div className="flex flex-col md:flex-row gap-6 justify-center items-center p-2 bg-transparent">
                                  {/* FRONT SIDE */}
                                  {(labViewMode === "both" || labViewMode === "front") && renderFront(labStudent, labStudentClass)}
                                  {/* BACK SIDE */}
                                  {(labViewMode === "both" || labViewMode === "back") && renderBack(labStudent)}
                                </div>
                              ) : (
                                <div className="space-y-8 bg-transparent p-2 w-full max-w-5xl">
                                  {bulkSelectedIds.length === 0 ? (
                                    <div className="text-center p-12 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto shadow-sm">
                                      <p className="text-slate-600 font-bold text-sm">الرجاء تحديد طالب واحد أو أكثر من القائمة الجانبية.</p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center w-full">
                                      {bulkSelectedIds.map(stId => {
                                        const st = students.find(s => s.id === stId);
                                        if (!st) return null;
                                        const stClass = classes.find(c => c.id === st.classId);
                                        return (
                                          <div key={st.id} className="flex flex-col xl:flex-row gap-4 p-4 bg-white/60 border border-slate-200 rounded-3xl shadow-sm break-inside-avoid print:p-0 print:border-none print:bg-transparent items-center">
                                            {/* FRONT SIDE */}
                                            {(labViewMode === "both" || labViewMode === "front") && renderFront(st, stClass)}
                                            {/* BACK SIDE */}
                                            {(labViewMode === "both" || labViewMode === "back") && renderBack(st)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                            {/* 2. INTERACTIVE 3D FLIP MODE */}
                            {labDisplayType === "3d" && (
                              <div className="flex justify-center items-center py-4">
                                <div 
                                  className="relative cursor-pointer select-none"
                                  style={{
                                    perspective: "1200px",
                                    width: idCardLabTab === "student-card" ? "390px" : "330px",
                                    height: idCardLabTab === "student-card" ? "550px" : "500px",
                                  }}
                                  onClick={() => setLabFlip(!labFlip)}
                                >
                                  <div
                                    className="w-full h-full duration-700 ease-in-out relative"
                                    style={{
                                      transformStyle: "preserve-3d",
                                      transform: labFlip ? "rotateY(180deg)" : "rotateY(0deg)"
                                    }}
                                  >
                                    {/* Front Face */}
                                    <div 
                                      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                                      style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden"
                                      }}
                                    >
                                      {renderFront(labStudent, labStudentClass)}
                                    </div>

                                    {/* Back Face */}
                                    <div 
                                      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                                      style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)"
                                      }}
                                    >
                                      {renderBack(labStudent)}
                                    </div>

                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-sm">
                        يرجى إضافة طلاب نشطين أولاً لتتمكن من معاينة وإصدار البطاقات الذكية.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* TAB: SYSTEM SETTINGS */}
          {activeTab === "settings" && systemSettings && (
            <SettingsManagement
              settings={systemSettings}
              appUsers={appUsers}
              teachers={teachers}
              students={students}
              canManageAccounts={isDirectorRole(currentRole)}
              onCreateAppUser={handleCreateAppUser}
              onResetUserPassword={handleResetUserPassword}
              onSaveTeacher={handleSaveTeacher}
              onNavigateToStaff={() => setActiveTab("teachers")}
              canCreateSettings={checkUserPermission(currentUser, currentRole, "settings", "create")}
              canUpdateSettings={checkUserPermission(currentUser, currentRole, "settings", "update")}
              canDeleteSettings={checkUserPermission(currentUser, currentRole, "settings", "delete")}
              onSaveSettings={handleSaveSystemSettings}
              onSaveAppUser={handleSaveAppUser}
              onDeleteAppUser={handleDeleteAppUser}
              onHarmonizeUsers={handleHarmonizeUsersWithStaff}
            />
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-4 md:px-8 flex items-center justify-between text-[10px] text-slate-500 italic">
        <div>نظام إدارة الأكاديمية وحلقات تحفيظ القرآن الكريم • جمعية الفجر الجديد</div>
        <div>جميع الحقوق محفوظة © 2026</div>
      </footer>

      {/* TEACHER STUDENT FILE & DOSSIER MODAL */}
      {showTeacherStudentFileModal && teacherSelectedStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl overflow-hidden border border-white/10 shrink-0">
                  <StudentAvatar student={teacherSelectedStudent} alt={teacherSelectedStudent.fullName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg font-sans">
                    الملف التعليمي للطالب: {teacherSelectedStudent.fullName}
                  </h3>
                  <p className="text-xs text-emerald-200 font-sans">
                    رقم العضوية: {teacherSelectedStudent.studentNumber || "N/A"} | المستوى الدراسي: {teacherSelectedStudent.educationLevel}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTeacherStudentFileModal(false);
                  setTeacherSelectedStudent(null);
                }} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
              
              {/* LEFT COLUMN: Record Progress Form & Core Updates (7 spans) */}
              <div className="lg:col-span-7 space-y-6">
                
                {(checkUserPermission(currentUser, currentRole, "students", "update") || checkUserPermission(currentUser, currentRole, "teacher-students", "update")) && (
                  <>
                    {/* 1. Core Profile & Teaching Updates */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>تعديل الحالة الراهنة وبيانات التدريس</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">السورة الحالية</label>
                          <input 
                            type="text" 
                            value={teacherSelectedStudent.currentSurah || ""}
                            onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, currentSurah: e.target.value } : null)}
                            placeholder="مثال: البقرة - الآية 142"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">مستوى التجويد الحالي</label>
                          <select 
                            value={teacherSelectedStudent.tajweedLevel || "متوسط"}
                            onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, tajweedLevel: e.target.value as any } : null)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          >
                            <option value="ممتاز">ممتاز (مخارج صحيحة وأحكام كاملة)</option>
                            <option value="متوسط">متوسط (يحتاج لبعض التوجيه)</option>
                            <option value="مبتدئ">مبتدئ (يتعلم القواعد الأساسية)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">عدد الأحزاب المحفوظة فعلياً</label>
                          <input 
                            type="number" 
                            min="0"
                            max="60"
                            value={teacherSelectedStudent.hizbCount ?? 1}
                            onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, hizbCount: Number(e.target.value) } : null)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-mono font-bold text-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">رأي وتوجيهات عامة للمعلم</label>
                          <input 
                            type="text" 
                            placeholder="ملاحظات وسلوكيات الطالب العامة..."
                            value={teacherSelectedStudent.notes || ""}
                            onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, notes: e.target.value } : null)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Daily Assessment Entry Form */}
                    <form onSubmit={handleSaveDailyProgress} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>تسجيل تقييم ومتابعة الحفظ اليومي</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">تاريخ المتابعة</label>
                          <input 
                            type="date" 
                            value={progressDate}
                            onChange={(e) => setProgressDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">الحفظ الجديد (Sabaq)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: من آية 1 إلى آية 15"
                            value={progressMemorization}
                            onChange={(e) => setProgressMemorization(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">المراجعة القريبة (Kum - الأجزاء القريبة)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: سورة البقرة بالكامل"
                            value={progressRevision}
                            onChange={(e) => setProgressRevision(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 text-[11px]">المراجعة البعيدة (Sabqi - القديم)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: الجزء الأول والثاني"
                            value={progressOldRevision}
                            onChange={(e) => setProgressOldRevision(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Rating Selector */}
                      <div className="font-sans">
                        <label className="block text-slate-500 font-bold mb-2 text-[11px]">التقييم والتقدير اليومي</label>
                        <div className="flex flex-wrap gap-2">
                          {(["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setProgressRating(r)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                                progressRating === r 
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Specific notes */}
                      <div className="font-sans">
                        <label className="block text-slate-500 font-bold mb-1 text-[11px]">ملاحظات وتوجيهات الحفظ اليومي</label>
                        <textarea 
                          rows={2}
                          placeholder="توجيهات محددة لهذا اليوم لولي الأمر أو الطالب..."
                          value={progressNotes}
                          onChange={(e) => setProgressNotes(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs leading-relaxed"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3 font-sans">
                        <button
                          type="submit"
                          className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition duration-150 shadow-md flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>حفظ التغييرات وتسجيل المتابعة اليومية</span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: Daily Progress Records History (5 spans) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden max-h-[75vh]">
                <div className="border-b pb-3 flex justify-between items-center shrink-0 font-sans">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>تاريخ وسجلات الحفظ السابقة</span>
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold">
                    {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length} سجلات
                  </span>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 font-sans">
                  {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                      <p className="text-3xl mb-2">📖</p>
                      <p>لا توجد أي سجلات متابعة مسجلة بعد لهذا الطالب.</p>
                    </div>
                  ) : (
                    <div className="relative border-r-2 border-slate-100 mr-2 space-y-5">
                      {dailyProgress
                        .filter(dp => dp.studentId === teacherSelectedStudent.id)
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map(record => (
                          <div key={record.id} className="relative pr-5">
                            {/* Dot timeline */}
                            <div className="absolute top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white"></div>
                            
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2 hover:border-slate-300 transition relative group">
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteDailyProgress(record.id)}
                                className="absolute left-3 top-3 text-slate-400 hover:text-rose-600 transition p-1"
                                title="حذف هذا السجل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-200/50 px-2 py-0.5 rounded-full">
                                  {record.date}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  record.rating === "ممتاز" ? "bg-emerald-100 text-emerald-800" :
                                  record.rating === "جيد جداً" ? "bg-cyan-100 text-cyan-800" :
                                  record.rating === "جيد" ? "bg-amber-100 text-amber-800" :
                                  record.rating === "مقبول" ? "bg-orange-100 text-orange-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  {record.rating}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-[11px] text-slate-700">
                                {record.memorizationPart && (
                                  <p><span className="font-bold text-emerald-800 font-sans">الحفظ الجديد:</span> {record.memorizationPart}</p>
                                )}
                                {record.revisionPart && (
                                  <p><span className="font-bold text-blue-800 font-sans">مراجعة قريبة:</span> {record.revisionPart}</p>
                                )}
                                {record.oldRevisionPart && (
                                  <p><span className="font-bold text-slate-600 font-sans">مراجعة بعيدة:</span> {record.oldRevisionPart}</p>
                                )}
                                {record.notes && (
                                  <div className="bg-white border p-2 rounded-lg mt-1 text-[10px] text-slate-500 border-dashed leading-relaxed">
                                    <span className="font-bold text-slate-700 block mb-0.5 font-sans">ملاحظات التقييم:</span>
                                    {record.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* STUDENT REGISTRATION / EDIT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-emerald-800 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingStudent ? "تعديل ملف الطالب" : "تسجيل طالب جديد في النادي"}</h3>
              <button 
                onClick={() => setShowStudentModal(false)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Student Photo Editor Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="block font-bold text-slate-700">تعديل/تحديد صورة الطالب الشخصية:</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Current Preview */}
                  <div className="relative w-16 h-16 rounded-full border-2 border-emerald-600 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center shadow-inner">
                    {formPhoto ? (
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🧒</span>
                    )}
                    {formPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormPhoto("")}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow"
                        title="إزالة الصورة"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload / Select options */}
                  <div className="flex-1 w-full space-y-2">
                    {/* Drag-and-drop / File Selector */}
                    <div
                      onDragEnter={handleStudentDrag}
                      onDragOver={handleStudentDrag}
                      onDragLeave={handleStudentDrag}
                      onDrop={handleStudentDrop}
                      className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                        studentDragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-white"
                      }`}
                    >
                      <input
                        type="file"
                        id="student-photo-upload"
                        accept="image/*"
                        onChange={handleStudentPhotoUpload}
                        className="hidden"
                      />
                      <label htmlFor="student-photo-upload" className="cursor-pointer block">
                        <p className="font-bold text-slate-700 text-xs">اسحب صورة هنا أو انقر لاختيارها</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (الحد الأقصى 2 ميغابايت)</p>
                      </label>
                    </div>

                    {/* Direct URL input */}
                    <div className="space-y-1">
                      <input
                        type="url"
                        value={formPhoto}
                        onChange={(e) => setFormPhoto(e.target.value)}
                        placeholder="أو ألصق رابط صورة مباشر هنا (URL)..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-[10px] font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatars Selection */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">أو اختر من الرمزيات المسبقة للأطفال بالنادي:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { name: "طالب 1", url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150" },
                      { name: "طالب 2", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150" },
                      { name: "طالب 3", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
                      { name: "طالبة 1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
                      { name: "طالبة 2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
                      { name: "طالبة 3", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150" }
                    ].map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setFormPhoto(preset.url)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition hover:scale-105 shrink-0 relative ${
                          formPhoto === preset.url ? "border-emerald-600 scale-105 shadow-md" : "border-slate-200"
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {formPhoto === preset.url && (
                          <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white font-bold" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الإسم الكامل للطالب:</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="مثال: يوسف الإدريسي"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Birthdate */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تاريخ ازدياد الطالب:</label>
                  <input
                    type="date"
                    required
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Registration Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تاريخ التسجيل بالنادي:</label>
                  <input
                    type="date"
                    required
                    value={formRegistrationDate}
                    onChange={(e) => setFormRegistrationDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الجنس:</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as "ذكر" | "أنثى")}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                {/* Parent name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">إسم الكامل لولي الأمر:</label>
                  <input
                    type="text"
                    required
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="مثال: محمد الإدريسي"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رقم هاتف ولي الأمر (للتواصل السريع والواتساب):</label>
                  <input
                    type="tel"
                    required
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="مثال: 0612345678"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Parent Email */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">البريد الإلكتروني لولي الأمر:</label>
                  <input
                    type="email"
                    value={formParentEmail}
                    onChange={(e) => setFormParentEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Assigned Class */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تعيين الفصل الدراسي / الحلقة:</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quran Progress & Tajweed */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">عدد الأحزاب المحفوظة (من 1 إلى 60):</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={formHizbCount}
                    onChange={(e) => setFormHizbCount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">مستوى التجويد الحالي:</label>
                  <select
                    value={formTajweedLevel}
                    onChange={(e) => setFormTajweedLevel(e.target.value as TajweedLevel)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ممتاز">ممتاز</option>
                    <option value="متوسط">متوسط</option>
                    <option value="ضعيف">ضعيف</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold text-slate-700">السورة أو ربع الحزب الحالي:</label>
                  <input
                    type="text"
                    value={formCurrentSurah}
                    onChange={(e) => setFormCurrentSurah(e.target.value)}
                    placeholder="مثال: سورة الملك ربع الأخير"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Checklist for Administrative Documents */}
              <div className="border-t pt-3">
                <p className="font-bold text-slate-700 mb-2 text-xs">الأوراق والمستندات الإدارية المتوفرة:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formDocParentId}
                      onChange={(e) => setFormDocParentId(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>فوتوكوبي بطاقة ولي الأمر</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formDocBirthCert}
                      onChange={(e) => setFormDocBirthCert(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>عقد ازدياد الطالب</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formDocPhotos}
                      onChange={(e) => setFormDocPhotos(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>صورتان شمسيتان للطالب</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">ملاحظات توجيهية إضافية:</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مستوى الذكاء، سرعة الحفظ، الالتزام بالآداب الإسلامية..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs h-20 resize-none"
                />
              </div>

              {/* Archive Student option */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <p className="block font-bold text-slate-700">حالة الطالب بالنادي (نشط / مؤرشف):</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsArchived}
                    onChange={(e) => setFormIsArchived(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-slate-700">أرشفة هذا الطالب (تغيير حالته إلى غير نشط)</span>
                </label>
                <p className="text-[10px] text-slate-400">الطالب مؤرشف لن يظهر في القائمة الافتراضية للطلاب النشطين، ولن يطالب بسداد الرسوم الجديدة.</p>
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-md"
                >
                  {editingStudent ? "حفظ التعديلات" : "إتمام التسجيل والبدء"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* GRADE REPORT ENTRY MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm">رصد نتيجة اختبار وشهادة</h3>
              <button onClick={() => setShowGradeModal(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-5 space-y-4 text-xs overflow-y-auto">
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الطالب الممتحن:</label>
                <select
                  value={gradeStudentId}
                  onChange={(e) => setGradeStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الجزء أو السور الممتحن فيها:</label>
                <input
                  type="text"
                  required
                  value={gradePortion}
                  onChange={(e) => setGradePortion(e.target.value)}
                  placeholder="مثال: من الحزب 1 إلى 5"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">درجة جودة الحفظ (من 20):</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    required
                    value={gradeMemorization}
                    onChange={(e) => setGradeMemorization(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">درجة جودة التجويد (من 20):</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    required
                    value={gradeTajweed}
                    onChange={(e) => setGradeTajweed(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">التقدير الإجمالي والتحفيزي:</label>
                <select
                  value={gradeOverall}
                  onChange={(e) => setGradeOverall(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">ملاحظات تربوية من المعلم:</label>
                <textarea
                  value={gradeNotes}
                  onChange={(e) => setGradeNotes(e.target.value)}
                  placeholder="سرعة جيدة، انتبه لمخارج الحروف..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs h-16 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition"
                >
                  تسجيل واصدار الشهادة
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 my-8 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm">
                {editingPayment ? "تعديل تفاصيل دفعة مالية" : "إضافة دفعة مالية جديدة"}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs overflow-y-auto">
              
              {/* Select Student */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">الطالب المستهدف:</label>
                <select
                  required
                  value={paymentFormStudentId}
                  onChange={(e) => setPaymentFormStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- اختر الطالب --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} (ولي الأمر: {s.parentName})</option>
                  ))}
                </select>
              </div>

              {/* Year & Month Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">السنة المستهدفة:</label>
                  <select
                    value={paymentFormYear}
                    onChange={(e) => handleFormYearChange(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {Array.from({ length: 2099 - 2026 + 1 }, (_, i) => 2026 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الشهر المستهدف:</label>
                  <select
                    value={paymentFormMonth}
                    onChange={(e) => handleFormMonthChange(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="يناير">يناير</option>
                    <option value="فبراير">فبراير</option>
                    <option value="مارس">مارس</option>
                    <option value="أبريل">أبريل</option>
                    <option value="ماي">ماي</option>
                    <option value="يونيو">يونيو</option>
                    <option value="يوليوز">يوليوز</option>
                    <option value="غشت">غشت</option>
                    <option value="شتمبر">شتمبر</option>
                    <option value="أكتوبر">أكتوبر</option>
                    <option value="نونبر">نونبر</option>
                    <option value="دجنبر">دجنبر</option>
                  </select>
                </div>
              </div>

              {/* Amount field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-700">مبلغ الاشتراك (بالدرهم):</label>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    السعر الافتراضي لهذا الشهر: {getSubscriptionAmount(paymentFormMonth, paymentFormYear)} درهم
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  value={paymentFormAmount}
                  onChange={(e) => setPaymentFormAmount(Number(e.target.value))}
                  placeholder="100"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">حالة الدفع:</label>
                <select
                  value={paymentFormStatus}
                  onChange={(e) => setPaymentFormStatus(e.target.value as "مدفوع" | "غير مدفوع")}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="غير مدفوع">غير مدفوع ❌</option>
                  <option value="مدفوع">مدفوع ✅</option>
                </select>
              </div>

              {/* Conditional fields if PAID */}
              {paymentFormStatus === "مدفوع" && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">تاريخ الأداء:</label>
                      <input
                        type="date"
                        required
                        value={paymentFormDate}
                        onChange={(e) => setPaymentFormDate(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-[11px] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">طريقة الدفع:</label>
                      <select
                        value={paymentFormMethod}
                        onChange={(e) => setPaymentFormMethod(e.target.value as any)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-[11px] font-bold"
                      >
                        <option value="نقداً">نقداً</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                        <option value="شيك">شيك</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">رقم الإيصال:</label>
                    <input
                      type="text"
                      required
                      value={paymentFormReceiptNo}
                      onChange={(e) => setPaymentFormReceiptNo(e.target.value)}
                      placeholder="مثال: REC-2026-102"
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-[11px] font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">ملاحظات إضافية:</label>
                <textarea
                  value={paymentFormNotes}
                  onChange={(e) => setPaymentFormNotes(e.target.value)}
                  placeholder="أي ملاحظات حول الدفع أو الرسوم..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs h-16 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition"
                >
                  حفظ السجل
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MONTHLY ATTENDANCE REPORT MODAL */}
      {showMonthlyReportModal && selectedStudentForReport && (() => {
        const [yearStr, monthStr] = reportYearMonth.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // 0-indexed month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const ARABIC_DAYS_OF_WEEK = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalFridays = 0;

        const daysList = [];

        for (let d = 1; d <= daysInMonth; d++) {
          const currentDate = new Date(year, month, d);
          const dayOfWeek = currentDate.getDay(); // 0: Sun, 5: Fri, 6: Sat
          const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isFriday = dayOfWeek === 5;

          const record = attendance.find(a => a.date === dateString && a.studentId === selectedStudentForReport.id);
          
          let status: "حاضر" | "غائب" | "متأخر" | "غير مرصود" | "عطلة" = "غير مرصود";
          if (isFriday) {
            status = "عطلة";
            totalFridays++;
          } else if (record) {
            status = record.status;
            if (status === "حاضر") totalPresent++;
            else if (status === "متأخر") totalLate++;
            else if (status === "غائب") totalAbsent++;
          }

          daysList.push({
            dayNum: d,
            dateStr: dateString,
            dayName: ARABIC_DAYS_OF_WEEK[dayOfWeek],
            status,
            isFriday,
            notes: record?.notes || "",
          });
        }

        const totalActiveDays = totalPresent + totalLate + totalAbsent;
        const attendanceRate = totalActiveDays > 0 
          ? Math.round(((totalPresent + totalLate) / totalActiveDays) * 100)
          : 100;

        const studentClass = classes.find(c => c.id === selectedStudentForReport.classId);
        const classTeacher = teachers.find(t => t.id === studentClass?.teacherId);

        const handleWhatsAppShare = () => {
          const parentName = selectedStudentForReport.parentName || "ولي الأمر المحترم";
          const studentName = selectedStudentForReport.fullName;
          const monthName = MONTH_NAMES_AR[month];
          const studyDays = daysInMonth - totalFridays;
          
          const messageText = `السلام عليكم ورحمة الله وبركاته،
المحترم(ة) ${parentName}، ولي أمر الطالب(ة) *${studentName}*،

نرسل لكم تقرير الحضور والغياب الشهري الخاص بابنكم(بنتكم) لشهر *${monthName} ${year}*:

📊 *إحصائيات الشهر (باستثناء عطلة الجمعة):*
- عدد أيام الحضور الفعلي: *${totalPresent}* أيام
- عدد مرات التأخير: *${totalLate}* مرات
- عدد أيام الغياب: *${totalAbsent}* أيام
- مجموع الحصص المقررة: *${studyDays}* حصة
- نسبة الالتزام الإجمالية: *${attendanceRate}%*

💡 *ملاحظة:* لا يتم احتساب أيام الجمعة في الكشف لكونها عطلة نهاية الأسبوع الرسمية بالجمعية.

شاكرين لكم حسن تعاونكم وحرصكم على التزام ابنكم ومتابعته المستمرة في حفظ كتاب الله.
*جمعية الفجر الجديد لتحفيظ القرآن والتربية*`;

          const cleanPhone = (phone: string) => {
            const digits = phone.replace(/\D/g, "");
            if (digits.startsWith("0") && digits.length === 10) {
              return "212" + digits.substring(1);
            }
            return digits || phone;
          };

          const rawPhone = selectedStudentForReport.parentPhone || "";
          const targetPhone = cleanPhone(rawPhone);
          const encodedText = encodeURIComponent(messageText);
          const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;
          window.open(whatsappUrl, "_blank");
        };

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 border border-slate-100">
              {/* Modal Header */}
              <div className="p-5 bg-slate-800 text-white flex justify-between items-center no-print">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <span>كشف الحضور والغياب الشهري التفصيلي</span>
                  </h3>
                  <p className="text-[10px] text-slate-300">عرض إحصائيات والتزام الطالب مع إمكانية طباعة تقرير رسمي A4 ومشاركته</p>
                </div>
                <button 
                  onClick={() => {
                    setShowMonthlyReportModal(false);
                    setSelectedStudentForReport(null);
                  }} 
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                
                {/* Report Month Picker (No-Print) */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl no-print">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-700">تحديد الشهر والسنة للتقرير:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="month" 
                      value={reportYearMonth} 
                      onChange={(e) => setReportYearMonth(e.target.value)} 
                      className="p-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-700 bg-white focus:outline-emerald-600 cursor-pointer" 
                    />
                    <span className="text-[10px] text-slate-400 font-medium">اختر شهر الرصد</span>
                  </div>
                </div>

                {/* Printable Area Wrapper */}
                <div id="printable-monthly-report" className="bg-white p-2">
                  <div className="space-y-6">
                    
                    {/* Printable Top Decorative Header */}
                    <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-4">
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 text-sm">جمعية الفجر الجديد لتحفيظ القرآن والتربية</p>
                        <p className="text-[10px] text-emerald-800 font-bold">حلقات التاج والوقار النموذجية بالمملكة المغربية</p>
                        <p className="text-[9px] text-slate-400 font-mono">الرقم المرجعي للأكاديمية: AI-ACAD-2026</p>
                      </div>
                      <div className="text-left">
                        <div className="bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-block shadow-sm">
                          كشف الحضور والغياب الشهري
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-MA')}</p>
                      </div>
                    </div>

                    {/* Info Block Grid */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-bold">معلومات الطالب:</p>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🧒</span>
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm">{selectedStudentForReport.fullName}</p>
                            <p className="text-[10px] text-slate-400">مستوى التجويد: {selectedStudentForReport.tajweedLevel}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-bold">الحلقة والمشرف:</p>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🏫</span>
                          <div>
                            <p className="font-bold text-slate-700 text-xs">{studentClass?.name || "غير محدد"}</p>
                            <p className="text-[10px] text-slate-400">المحفظ: {classTeacher?.fullName || "لم يتم تعيين معلّم"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-bold">الفترة الزمنية للرصد:</p>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">📅</span>
                          <div>
                            <p className="font-extrabold text-emerald-800 text-xs">{MONTH_NAMES_AR[month]} {year}</p>
                            <p className="text-[10px] text-slate-400">الفترة المحددة: {reportYearMonth}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stat Widgets (Excluding Fridays) */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                      
                      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-center">
                        <p className="text-[10px] text-emerald-800 font-bold">حاضر فعلي</p>
                        <p className="text-lg font-black text-emerald-900 mt-1">{totalPresent} أيام</p>
                      </div>

                      <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-center">
                        <p className="text-[10px] text-amber-800 font-bold">تأخير مسجل</p>
                        <p className="text-lg font-black text-amber-900 mt-1">{totalLate} مرات</p>
                      </div>

                      <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl text-center">
                        <p className="text-[10px] text-rose-800 font-bold">غياب مسجل</p>
                        <p className="text-lg font-black text-rose-900 mt-1">{totalAbsent} أيام</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                        <p className="text-[10px] text-slate-500 font-bold">أيام الدراسة المقررة</p>
                        <p className="text-lg font-black text-slate-700 mt-1">{daysInMonth - totalFridays} يوم</p>
                      </div>

                      <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-800 to-teal-800 p-3 rounded-xl text-center text-white shadow-xs">
                        <p className="text-[10px] text-emerald-100 font-bold">نسبة الالتزام</p>
                        <p className="text-lg font-black mt-1">{attendanceRate}%</p>
                      </div>

                    </div>

                    {/* Exclude Friday Note Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                      <span className="text-sm shrink-0">🕌</span>
                      <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                        <strong>تنويه نظام الجمعية الحسابي:</strong> تم رصد وإعداد هذا الكشف باستبعاد <strong>أيام الجمعة ({totalFridays} أيام في هذا الشهر)</strong> تماماً من حساب الإحصائيات الحالية ومجمل أيام الدراسة، عملاً بالنظام الداخلي الذي يعتبر يوم الجمعة عطلة رسمية بالجمعية.
                      </p>
                    </div>

                    {/* Daily List Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-right border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-2.5">اليوم والتاريخ</th>
                            <th className="p-2.5">حالة الرصد</th>
                            <th className="p-2.5">التقييم والملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {daysList.map((day) => {
                            let statusBadge = null;
                            if (day.status === "حاضر") {
                              statusBadge = <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">حاضر ✅</span>;
                            } else if (day.status === "غائب") {
                              statusBadge = <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">غائب ❌</span>;
                            } else if (day.status === "متأخر") {
                              statusBadge = <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">متأخر 🕒</span>;
                            } else if (day.status === "عطلة") {
                              statusBadge = <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-semibold italic text-[10px]">عطلة نهاية الأسبوع 🕌</span>;
                            } else {
                              statusBadge = <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[10px]">غير مسجل بعد ➖</span>;
                            }

                            return (
                              <tr key={day.dayNum} className={`hover:bg-slate-50/40 transition ${day.isFriday ? "bg-slate-50/50" : ""}`}>
                                <td className="p-2.5 font-bold text-slate-700">
                                  <span className="font-mono text-slate-400 text-[10px] ml-1.5">{day.dayNum}</span>
                                  {day.dayName} ، {day.dateStr}
                                </td>
                                <td className="p-2.5">{statusBadge}</td>
                                <td className="p-2.5 text-slate-500 font-medium">
                                  {day.isFriday ? "عطلة الجمعة الرسمية" : day.notes || "لا يوجد ملاحظات مسجلة"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Signatures for Printed Sheet */}
                    <div className="grid grid-cols-3 gap-4 pt-10 border-t-2 border-dashed border-slate-200 mt-12 text-center text-slate-700">
                      <div className="space-y-4">
                        <p className="font-bold text-xs text-slate-800">توقيع المحفظ المشرف</p>
                        <div className="h-10"></div>
                        <p className="text-[10px] text-slate-400">----------------------</p>
                      </div>
                      <div className="space-y-4">
                        <p className="font-bold text-xs text-slate-800">ختم الجمعية الرسمي</p>
                        <div className="h-10"></div>
                        <p className="text-[10px] text-slate-400">----------------------</p>
                      </div>
                      <div className="space-y-4">
                        <p className="font-bold text-xs text-slate-800">توقيع إدارة الأكاديمية</p>
                        <div className="h-10"></div>
                        <p className="text-[10px] text-slate-400">----------------------</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Actions / Print (No-Print) */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t no-print">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMonthlyReportModal(false);
                      setSelectedStudentForReport(null);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>إغلاق الكشف</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* WhatsApp share button */}
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md"
                    >
                      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.292 1.503 4.933 1.505 5.424.004 9.835-4.394 9.839-9.82.002-2.628-1.02-5.1-2.88-6.962C16.621 1.955 14.153.931 11.53.927c-5.432 0-9.843 4.403-9.847 9.827-.001 1.761.478 3.48 1.385 5.016l-.99 3.616 3.73-.976zm12.115-4.43c-.329-.165-1.947-.961-2.246-1.07-.3-.109-.518-.164-.736.164-.218.328-.844 1.07-1.034 1.289-.19.219-.38.246-.709.08-1.353-.678-2.3-1.176-3.21-2.735-.24-.411.24-.381.688-1.277.075-.15.038-.282-.019-.395-.056-.113-.518-1.249-.71-1.711-.186-.447-.373-.387-.518-.394l-.442-.008c-.15 0-.395.056-.601.282-.206.226-.785.767-.785 1.87 0 1.104.8 2.167.912 2.318.112.15 1.573 2.4 3.812 3.367.532.23 1.053.391 1.411.474.56.126 1.07.108 1.473.048.45-.067 1.473-.601 1.68-1.182.206-.581.206-1.08.145-1.183-.06-.103-.218-.164-.547-.329z"/>
                      </svg>
                      <span>مشاركة عبر الواتساب مع ولي الأمر</span>
                    </button>

                    {checkUserPermission(currentUser, currentRole, "attendance", "print") && (
                      <button
                        type="button"
                        onClick={handlePrintReport}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة الكشف على ورقة A4</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* PROFILE EDIT MODAL */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0">
                  {userAvatarInitial}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">الملف الشخصي والحساب</h3>
                  <p className="text-xs text-emerald-200 font-medium">تعديل بيانات الحساب الجاري ({currentRole})</p>
                </div>
              </div>
              {!mustChangePassword && (
                <button
                  type="button"
                  onClick={() => setShowProfileEditModal(false)}
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              {mustChangePassword && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>لأسباب أمنية، يجب اختيار كلمة مرور جديدة (8 أحرف على الأقل) قبل متابعة استعمال المنظومة.</span>
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{profileError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل لصاحب الحساب</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم / معرّف الدخول</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={profilePhone}
                    disabled
                    className="w-full pr-9 pl-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">اسم المستخدم معرّف فريد لا يمكن تعديله إلا من إدارة النظام.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
                <div className="relative mb-3">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type={showProfilePassword ? "text" : "password"}
                    value={profileCurrentPassword}
                    onChange={(e) => setProfileCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                    placeholder="مطلوبة عند تغيير كلمة المرور إذا طال وقت الجلسة"
                  />
                </div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{mustChangePassword ? "كلمة المرور الجديدة" : "تحديث كلمة المرور (اختياري)"}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type={showProfilePassword ? "text" : "password"}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    autoComplete="new-password"
                    required={mustChangePassword}
                    className="w-full pr-9 pl-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                    placeholder="أدخل كلمة مرور جديدة"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => (mustChangePassword ? handleLogout() : setShowProfileEditModal(false))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {mustChangePassword ? "خروج" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:bg-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
