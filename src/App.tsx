import React from "react";
import { RealmSimDB } from "./db";
import { db } from "./firebase";
import { Student, Teacher, Class, Attendance, Payment, TajweedLevel, checkUserPermission } from "./types";
import { isDirectorRole } from "./security/access";
import { SchoolContext, type SchoolContextValue } from "./school/SchoolContext";
import SchoolPicker from "./school/SchoolPicker";
import SchoolSwitcher from "./school/SchoolSwitcher";
import { StudentAvatar } from "./utils/studentAvatar";
import StudentCard from "./components/StudentCard";
import TeacherManagement from "./components/TeacherManagement";
import ClassManagement from "./components/ClassManagement";
import AttendanceChart from "./components/AttendanceChart";
import TeacherPerformanceChart from "./components/TeacherPerformanceChart";
import SettingsManagement from "./components/SettingsManagement";
import FinanceManagement from "./components/FinanceManagement";
import ActivitiesManagement from "./components/ActivitiesManagement";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, BookOpen, UserCheck, Award, CreditCard, Bell, Sparkles, Plus, Search, Trash2, Edit3, Check, X, Phone, Calendar, ShieldAlert, RefreshCw, Eye, Download, Info, Briefcase, Printer, FileText, Archive, Database, QrCode, Camera, Volume2, Keyboard, MapPin, Settings, Globe, Facebook, Lock, User, LogIn, LogOut, EyeOff, LayoutDashboard, Coins, ArrowUpDown, ArrowUp, ArrowDown, Menu, Compass } from "lucide-react";
import { getYearAndMonthFromDate } from "./app/helpers";
import { useAppController } from "./app/useAppController";

export default function App() {
  const s = useAppController();
  const {
    students,
    teachers,
    classes,
    attendance,
    grades,
    payments,
    notifications,
    systemSettings,
    appUsers,
    dailyProgress,
    otherIncomes,
    salaryPayments,
    expenses,
    activities,
    activityParticipants,
    activityExpenses,
    firestoreQuotaExceeded,
    syncStatus,
    currentUser,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    loginError,
    loginLoading,
    authChecking,
    authUid,
    activeSchoolId,
    schools,
    userProfile,
    isSuperAdmin,
    showSchoolPicker,
    schoolError,
    schoolBusy,
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
    aiReport,
    setAiReport,
    aiLoading,
    aiError,
    showStudentModal,
    setShowStudentModal,
    editingStudent,
    showGradeModal,
    setShowGradeModal,
    selectedClassId,
    setSelectedClassId,
    attendanceDate,
    setAttendanceDate,
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
    paymentSortDir,
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
    showProfilePassword,
    setShowProfilePassword,
    profileCurrentPassword,
    setProfileCurrentPassword,
    profileSaving,
    profileError,
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
    paymentFormStudentId,
    setPaymentFormStudentId,
    paymentFormYear,
    paymentFormMonth,
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
    currentRole,
    activeSchool,
    schoolName,
    getSubscriptionAmount,
    loadDatabase,
    handleSelectSchool,
    handleCreateSchool,
    handleOpenSchoolPicker,
    handleLogout,
    handleLoginSubmit,
    filteredStudents,
    parentStudentsCount,
    parentFurthestHizb,
    currentStudentObj,
    accountOwnerName,
    userAvatarInitial,
    mustChangePassword,
    activeTeacher,
    teacherClasses,
    teacherStudents,
    userNotifications,
    totalStudentsCount,
    advancedStudentsCount,
    excellentTajweedCount,
    averageTajweedCount,
    weakTajweedCount,
    tajweedSuccessPercent,
    getStudentAttendanceRate,
    teacherAverageAttendance,
    teacherAverageHizb,
    furthestHizb,
    teacherFurthestHizb,
    isStaffOrAdmin,
    totalPaymentsCollected,
    totalUnpaidCount,
    totalUnpaidAmount,
    sortedPayments,
    paymentChartData,
    handleSaveDailyProgress,
    handleDeleteDailyProgress,
    handleOpenStudentForm,
    handleSaveStudent,
    handleDeleteStudent,
    handleToggleArchiveStudent,
    handleSaveTeacher,
    handleArchiveTeacherToggle,
    handleDeleteTeacher,
    handleSaveClass,
    handleArchiveClassToggle,
    handleDeleteClass,
    getConsecutiveAbsences,
    handleSendAbsenceWarning,
    handleToggleAttendance,
    playBeep,
    handleScannedValue,
    handlePrintReport,
    handleOpenGradeForm,
    handleSaveGrade,
    handleDeleteGrade,
    handleTogglePayment,
    handleOpenPaymentForm,
    handleFormMonthChange,
    handleFormYearChange,
    handleSavePayment,
    handleDeletePayment,
    handleWhatsAppShare,
    handleExportPaymentsToCSV,
    handleSaveOtherIncome,
    handleDeleteOtherIncome,
    handleSaveSalaryPayment,
    handleDeleteSalaryPayment,
    handleSaveExpense,
    handleDeleteExpense,
    handleSaveActivity,
    handleDeleteActivity,
    handleSaveActivityParticipant,
    handleDeleteActivityParticipant,
    handleSaveActivityExpense,
    handleDeleteActivityExpense,
    handleSyncActivityToFinance,
    handlePrintReceipt,
    handlePrintCertificate,
    handlePrintFinancialReport,
    handlePrintStudentsReport,
    handlePrintLabCard,
    handleExportStudentsCSV,
    handleExportStudentsJSON,
    handleBackupRealmDB,
    handleRestoreRealmDB,
    handleSaveSystemSettings,
    handleSaveAppUser,
    handleCreateAppUser,
    handleResetUserPassword,
    handleDeleteAppUser,
    handleHarmonizeUsersWithStaff,
    handleGenerateAIReport,
    handleOpenProfileModal,
    handleSaveProfile,
  } = s;

  if (!currentUser && authUid && showSchoolPicker) {
    return (
      <SchoolPicker
        schools={schools}
        memberSchoolIds={userProfile?.schoolIds || []}
        isSuperAdmin={isSuperAdmin}
        userName={userProfile?.displayName || userProfile?.username || ""}
        busy={schoolBusy}
        error={schoolError}
        onSelect={handleSelectSchool}
        onCreate={handleCreateSchool}
        onLogout={() => handleLogout()}
      />
    );
  }

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
      <div data-screen="login" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden animate-fade-in" dir="rtl">
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
                {schoolName}
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
                <p className="text-[10px] text-slate-400 mt-1 mr-1">استخدم اسم المستخدم الذي زودتك به إدارة الجمعية (وليس الاسم الكامل أو رقم الهاتف).</p>
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

  const schoolContextValue: SchoolContextValue = {
    schoolId: activeSchoolId,
    school: activeSchool,
    schools,
    memberSchoolIds: userProfile?.schoolIds || [],
    member: currentUser,
    role: currentUser ? currentRole : null,
    settings: systemSettings,
    schoolName,
    isSuperAdmin,
    switchSchool: (id: string) => { handleSelectSchool(id); },
    openSchoolPicker: handleOpenSchoolPicker,
  };

  return (
    <SchoolContext.Provider value={schoolContextValue}>
    <div data-app-shell className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white" dir="rtl">
      
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
                <span className="truncate">{schoolName}</span>
                <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-amber-500 text-zinc-950 font-bold px-2 py-0.5 rounded-full shrink-0">نادي القرآن</span>
              </h1>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium truncate">
                لوحة التحكم الشاملة • برعاية {schoolName}
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

            {/* Sélecteur d'école (plusieurs écoles ou super-admin) */}
            <SchoolSwitcher />

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
              data-action="open-profile"
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
          <aside data-nav="mobile" className="relative w-72 max-w-[85vw] bg-emerald-950 text-emerald-100 flex flex-col p-4 shrink-0 shadow-2xl overflow-y-auto z-10 border-l border-emerald-900 h-full">
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
                      data-tab="dashboard"
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
                      data-tab="teacher-dashboard"
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
                      data-tab="students"
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
                      data-tab="teachers"
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
                      data-tab="attendance"
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
                      data-tab="grades"
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
                      data-tab="payments"
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
                      data-tab="finance"
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
                      data-tab="activities"
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
                      data-tab="classes"
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
                      data-tab="notifications"
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
                      data-tab="id-cards-lab"
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
                      data-tab="settings"
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
        <aside data-nav="desktop" className="hidden md:flex w-64 bg-emerald-950 text-emerald-100 flex-col p-4 shrink-0 border-l border-emerald-900">
          
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
                    data-tab="dashboard"
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
                    data-tab="teacher-dashboard"
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
                    data-tab="students"
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
                    data-tab="teachers"
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
                    data-tab="attendance"
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
                    data-tab="grades"
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
                    data-tab="payments"
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
                    data-tab="finance"
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
                    data-tab="activities"
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
                    data-tab="classes"
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
                    data-tab="notifications"
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
                    data-tab="id-cards-lab"
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
                    data-tab="settings"
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
            <div data-screen="teacher-dashboard" className="space-y-6 animate-fade-in" dir="rtl">
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
                                    data-action="open-teacher-student-file"
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
            <div data-screen="dashboard" className="space-y-6">
              
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
                    <h2 className="text-2xl md:text-3xl font-black">لوحة الإحصائيات لـ{schoolName}</h2>
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
                    <p>يهدف النادي لمساعدة جميع الأطفال والشيوخ في {schoolName} لختم كتاب الله وضبط مخارج الحروف بتجويد ممتاز.</p>
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
            <div data-screen="students" className="space-y-6">
              
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
                      data-action="open-student-form"
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
                              const rawMsg = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) ${selectedStudent.fullName} المحترم(ة)... ${schoolName}.`;
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
                              <h4 className="font-bold text-amber-400 text-sm">التقرير التربوي الذكي لـ{schoolName}</h4>
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
            <div data-screen="attendance" className="space-y-6">
              
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
                                    data-action="open-monthly-report"
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
            <div data-screen="grades" className="space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">نتائج امتحانات الحفظ والتجويد وإصدار الشهادات</h2>
                  <p className="text-xs text-slate-500">سجل نتائج الاختبارات الدورية التي يشرف عليها معلمو الحلقات.</p>
                </div>

                {checkUserPermission(currentUser, currentRole, "grades", "create") && (
                  <button
                    data-action="open-grade-form"
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
                  
                  <p className="text-[10px] text-amber-700 font-bold">بإشراف {schoolName}</p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: PAYMENTS & ADMINISTRATIVE FEES */}
          {activeTab === "payments" && (
            <div data-screen="payments" className="space-y-6">
              
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
                      data-action="open-payment-form"
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
                  <span className="text-[10px] text-slate-500 font-medium">مبلغ الاشتراك الأساسي: {getSubscriptionAmount("", 0)} {systemSettings?.currency || "درهم"} / شهر{(systemSettings?.feeOverrides || []).length > 0 ? ` (تعريفات خاصة: ${(systemSettings?.feeOverrides || []).map((o) => `${o.month} ${o.year}: ${o.amount}`).join("، ")})` : ""}</span>
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
            <div data-screen="notifications" className="space-y-6">
              
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
                        <h3 className="text-xs font-bold tracking-wide text-amber-400">{schoolName}</h3>
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
                    <p className="text-[9px] text-zinc-400 mt-1">تلتزم إدارة {schoolName} بالمحافظة على تميز الطلاب</p>
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
                        <span>{schoolName}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-blue-800">
                        <Facebook className="w-3 h-3 text-blue-600" />
                        <span>{schoolName}</span>
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
                      <p className="text-[9px] text-teal-800 font-extrabold font-mono mt-0.5">{(systemSettings?.activeAcademicSeason || "").replace("/", "-")}</p>
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
                                  <span className="text-[5px] text-red-500/70 scale-75">{schoolName}</span>
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
              <div data-screen="id-cards-lab" className="space-y-6" style={{ direction: "rtl" }}>
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
        <div>نظام إدارة الأكاديمية وحلقات تحفيظ القرآن الكريم • {schoolName}</div>
        <div>جميع الحقوق محفوظة © {new Date().getFullYear()}</div>
      </footer>

      {/* TEACHER STUDENT FILE & DOSSIER MODAL */}
      {showTeacherStudentFileModal && teacherSelectedStudent && (
        <div data-modal="teacher-student-file" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
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
        <div data-modal="student-form" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
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
        <div data-modal="grade-form" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
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
        <div data-modal="payment-form" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
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
*${schoolName}*`;

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
          <div data-modal="monthly-report" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
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
                        <p className="font-extrabold text-slate-800 text-sm">{schoolName}</p>
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
        <div data-modal="profile" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" dir="rtl">
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
    </SchoolContext.Provider>
  );
}
