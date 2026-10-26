/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState } from "react";
import { Student, Payment, TajweedLevel } from "../../types";
import { MONTHS_AR } from "../../school/businessRules";
import { localIsoDate } from "../attendanceSessions";

export function useUiState() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentArchiveFilter, setStudentArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Modals & Form State
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showGradeModal, setShowGradeModal] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] = useState<string>(() => localIsoDate(new Date()));
  // Enseignant pour lequel la halaqa a déjà été présélectionnée (UI-04) : un choix ultérieur n'est plus écrasé.
  const [attendanceClassPickedFor, setAttendanceClassPickedFor] = useState<string | null>(null);
  
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
  // Notes vides à l'ouverture (UI-11) : saisies au clavier, jamais pré-remplies.
  const [gradeMemorization, setGradeMemorization] = useState("");
  const [gradeTajweed, setGradeTajweed] = useState("");
  // Mention vide tant qu'elle n'est ni proposée (d'après les notes) ni choisie.
  const [gradeOverall, setGradeOverall] = useState<"ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "">("");
  // Vrai quand l'enseignant a choisi lui-même la mention : elle n'est plus recalculée.
  const [gradeOverallManual, setGradeOverallManual] = useState(false);
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
  const [paymentFormYear, setPaymentFormYear] = useState<number>(new Date().getFullYear());
  const [paymentFormMonth, setPaymentFormMonth] = useState<string>(MONTHS_AR[new Date().getMonth()]);
  const [paymentFormAmount, setPaymentFormAmount] = useState<number>(70);
  const [paymentFormStatus, setPaymentFormStatus] = useState<"مدفوع" | "غير مدفوع">("مدفوع");
  const [paymentFormDate, setPaymentFormDate] = useState("");
  const [paymentFormMethod, setPaymentFormMethod] = useState<"نقداً" | "تحويل بنكي" | "شيك">("نقداً");
  const [paymentFormReceiptNo, setPaymentFormReceiptNo] = useState("");
  const [paymentFormNotes, setPaymentFormNotes] = useState("");


  return {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    studentArchiveFilter,
    setStudentArchiveFilter,
    selectedStudent,
    setSelectedStudent,
    showStudentModal,
    setShowStudentModal,
    editingStudent,
    setEditingStudent,
    showGradeModal,
    setShowGradeModal,
    selectedClassId,
    setSelectedClassId,
    attendanceDate,
    setAttendanceDate,
    attendanceClassPickedFor,
    setAttendanceClassPickedFor,
    showTeacherStudentFileModal,
    setShowTeacherStudentFileModal,
    teacherSelectedStudent,
    setTeacherSelectedStudent,
    progressDate,
    setProgressDate,
    progressMemorization,
    setProgressMemorization,
    progressRevision,
    setProgressRevision,
    progressOldRevision,
    setProgressOldRevision,
    progressRating,
    setProgressRating,
    progressNotes,
    setProgressNotes,
    isScanning,
    setIsScanning,
    scanStatus,
    setScanStatus,
    scannerInputValue,
    setScannerInputValue,
    showScannerPanel,
    setShowScannerPanel,
    paymentSortKey,
    setPaymentSortKey,
    paymentSortDir,
    setPaymentSortDir,
    handleTogglePaymentSort,
    idCardLabTab,
    setIdCardLabTab,
    selectedLabStudentId,
    setSelectedLabStudentId,
    labScale,
    setLabScale,
    labViewMode,
    setLabViewMode,
    labDisplayType,
    setLabDisplayType,
    labFlip,
    setLabFlip,
    searchLabQuery,
    setSearchLabQuery,
    bulkSelectedIds,
    setBulkSelectedIds,
    labPrintMode,
    setLabPrintMode,
    selectedStudentForReport,
    setSelectedStudentForReport,
    showMonthlyReportModal,
    setShowMonthlyReportModal,
    reportYearMonth,
    setReportYearMonth,
    showProfileEditModal,
    setShowProfileEditModal,
    profileFullName,
    setProfileFullName,
    profilePassword,
    setProfilePassword,
    profilePhone,
    setProfilePhone,
    showProfilePassword,
    setShowProfilePassword,
    profileCurrentPassword,
    setProfileCurrentPassword,
    profileSaving,
    setProfileSaving,
    profileError,
    setProfileError,
    formFullName,
    setFormFullName,
    formPhoto,
    setFormPhoto,
    formBirthDate,
    setFormBirthDate,
    formRegistrationDate,
    setFormRegistrationDate,
    formGender,
    setFormGender,
    formParentName,
    setFormParentName,
    formParentPhone,
    setFormParentPhone,
    formParentEmail,
    setFormParentEmail,
    formDocParentId,
    setFormDocParentId,
    formDocBirthCert,
    setFormDocBirthCert,
    formDocPhotos,
    setFormDocPhotos,
    formHizbCount,
    setFormHizbCount,
    formCurrentSurah,
    setFormCurrentSurah,
    formTajweedLevel,
    setFormTajweedLevel,
    formNotes,
    setFormNotes,
    formClassId,
    setFormClassId,
    formIsArchived,
    setFormIsArchived,
    studentDragActive,
    setStudentDragActive,
    compressImage,
    handleStudentPhotoUpload,
    handleStudentDrag,
    handleStudentDrop,
    gradeStudentId,
    setGradeStudentId,
    gradePortion,
    setGradePortion,
    gradeMemorization,
    setGradeMemorization,
    gradeTajweed,
    setGradeTajweed,
    gradeOverall,
    setGradeOverall,
    gradeOverallManual,
    setGradeOverallManual,
    gradeNotes,
    setGradeNotes,
    paymentSearchQuery,
    setPaymentSearchQuery,
    attendanceSearchQuery,
    setAttendanceSearchQuery,
    paymentFilterStatus,
    setPaymentFilterStatus,
    paymentFilterDate,
    setPaymentFilterDate,
    showPaymentModal,
    setShowPaymentModal,
    editingPayment,
    setEditingPayment,
    paymentFormStudentId,
    setPaymentFormStudentId,
    paymentFormYear,
    setPaymentFormYear,
    paymentFormMonth,
    setPaymentFormMonth,
    paymentFormAmount,
    setPaymentFormAmount,
    paymentFormStatus,
    setPaymentFormStatus,
    paymentFormDate,
    setPaymentFormDate,
    paymentFormMethod,
    setPaymentFormMethod,
    paymentFormReceiptNo,
    setPaymentFormReceiptNo,
    paymentFormNotes,
    setPaymentFormNotes,
  };
}
