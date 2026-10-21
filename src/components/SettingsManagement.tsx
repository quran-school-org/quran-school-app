import React, { useState } from "react";
import { SystemSettings, AppUser, UserRole, UserPermissions, getDefaultPermissionsForRole, Teacher } from "../types";
import { PermissionMatrixEditor } from "./PermissionMatrixEditor";
import { generateUniqueUsername } from "../db";
import { 
  Building, Phone, Mail, MapPin, Shield, UserPlus, Edit2, Trash2, Lock, 
  Check, X, DollarSign, ToggleLeft, ToggleRight, Save, UserCheck, AlertTriangle,
  Upload, Image as ImageIcon, Search, Landmark, FileCheck, CreditCard, Users,
  Award, Scroll, Calendar, Tag, Info, FileText, Plus, Sparkles, RefreshCw,
  LayoutGrid, List, Table, CheckCircle2, XCircle, Clock, ShieldCheck, Eye, EyeOff, Activity, Filter
} from "lucide-react";

interface SettingsManagementProps {
  settings: SystemSettings;
  appUsers: AppUser[];
  teachers?: Teacher[];
  canCreateSettings?: boolean;
  canUpdateSettings?: boolean;
  canDeleteSettings?: boolean;
  onSaveSettings: (settings: SystemSettings) => void;
  onSaveAppUser: (user: AppUser) => void;
  onDeleteAppUser: (userId: string) => void;
  onSaveTeacher?: (teacher: Teacher, assignedClassIds?: string[]) => void;
  onNavigateToStaff?: () => void;
  onHarmonizeUsers?: () => void;
}

export default function SettingsManagement({
  settings,
  appUsers,
  teachers = [],
  canCreateSettings,
  canUpdateSettings,
  canDeleteSettings,
  onSaveSettings,
  onSaveAppUser,
  onDeleteAppUser,
  onSaveTeacher,
  onNavigateToStaff,
  onHarmonizeUsers
}: SettingsManagementProps) {
  const canCreate = canCreateSettings ?? true;
  const canUpdate = canUpdateSettings ?? true;
  const canDelete = canDeleteSettings ?? true;

  // Tabs for sub-settings
  const [subTab, setSubTab] = useState<"general" | "users">("general");

  // User search, filter & view mode state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userViewMode, setUserViewMode] = useState<"table" | "cards">("table");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [revealedUserPasswords, setRevealedUserPasswords] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState("");

  const handleTriggerSync = () => {
    setIsSyncing(true);
    if (onHarmonizeUsers) {
      onHarmonizeUsers();
    }
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg("تمت مطابقة وتحديث أدوار جميع المستخدمين مع شؤون العاملين وإيقاف حسابات المؤرشفين بنجاح!");
      setTimeout(() => setSyncSuccessMsg(""), 4500);
    }, 600);
  };

  const toggleRevealPassword = (userId: string) => {
    setRevealedUserPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const formatLastLogin = (lastLoginStr?: string) => {
    if (!lastLoginStr) return "لم يسجل الدخول بعد";
    try {
      const date = new Date(lastLoginStr);
      if (isNaN(date.getTime())) return lastLoginStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "الآن (نشط)";
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return `اليوم ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
      }
      return `${date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })} ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return lastLoginStr;
    }
  };

  const filteredUsers = appUsers.filter((user) => {
    const matchesSearch = 
      (user.fullName || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(userSearchQuery.toLowerCase());
    
    const matchesRole = 
      userRoleFilter === "all" || user.role === userRoleFilter;

    const matchesStatus = 
      userStatusFilter === "all" ||
      (userStatusFilter === "active" && user.isActive) ||
      (userStatusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // General settings state
  const [associationName, setAssociationName] = useState(settings.associationName);
  const [generalSupervisorName, setGeneralSupervisorName] = useState(settings.generalSupervisorName || "");
  const [associationPhone, setAssociationPhone] = useState(settings.associationPhone);
  const [associationEmail, setAssociationEmail] = useState(settings.associationEmail);
  const [associationAddress, setAssociationAddress] = useState(settings.associationAddress);
  const [associationLogo, setAssociationLogo] = useState(settings.associationLogo);
  const [directorName, setDirectorName] = useState(settings.directorName);
  const [subscriptionFee, setSubscriptionFee] = useState(settings.subscriptionFee);
  const [currency, setCurrency] = useState(settings.currency);
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(settings.allowSelfRegistration);
  const [showStampOnReceipts, setShowStampOnReceipts] = useState(settings.showStampOnReceipts);
  const [stampText, setStampText] = useState(settings.stampText);

  // 1. البيانات القانونية والتأسيسية
  const [foundingDate, setFoundingDate] = useState(settings.foundingDate || "");
  const [licenseNumber, setLicenseNumber] = useState(settings.licenseNumber || "");
  const [bankRIB, setBankRIB] = useState(settings.bankRIB || "");

  // 2. إعدادات النّظم والمطبوعات الاحترافية
  const [activeAcademicSeason, setActiveAcademicSeason] = useState(settings.activeAcademicSeason || "2026/2027");
  const [mottoVision, setMottoVision] = useState(settings.mottoVision || "");
  const [receiptPrefixFormat, setReceiptPrefixFormat] = useState(settings.receiptPrefixFormat || "REC-{YEAR}-{NO}");
  const [internalBylaws, setInternalBylaws] = useState(settings.internalBylaws || "");
  const [footerNotice, setFooterNotice] = useState(settings.footerNotice || "");

  // Logo uploading states & handlers
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processLogoFile(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processLogoFile(file);
  };

  const processLogoFile = (file: File | undefined) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت حفظاً على مساحة التخزين.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssociationLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setAssociationLogo("");
  };

  // App users state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  // User form state
  const [formUsername, setFormUsername] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("مدرس");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCanEditStudents, setFormCanEditStudents] = useState(true);
  const [formCanEditTeachers, setFormCanEditTeachers] = useState(false);
  const [formCanEditGrades, setFormCanEditGrades] = useState(true);
  const [formCanEditPayments, setFormCanEditPayments] = useState(false);

  // Teachers detailed permissions form state
  const [formTeacherTakeAttendance, setFormTeacherTakeAttendance] = useState(true);
  const [formTeacherRecordGrades, setFormTeacherRecordGrades] = useState(true);
  const [formTeacherWriteBehaviorReports, setFormTeacherWriteBehaviorReports] = useState(true);
  const [formTeacherEditOwnStudents, setFormTeacherEditOwnStudents] = useState(true);
  const [formTeacherSendAlertsToParents, setFormTeacherSendAlertsToParents] = useState(true);

  // Students & Parents detailed permissions form state
  const [formParentViewOwnStats, setFormParentViewOwnStats] = useState(false);
  const [formParentViewOwnAttendance, setFormParentViewOwnAttendance] = useState(false);
  const [formParentViewCertificates, setFormParentViewCertificates] = useState(false);
  const [formParentViewOwnPayments, setFormParentViewOwnPayments] = useState(false);
  const [formParentUpdateContactInfo, setFormParentUpdateContactInfo] = useState(false);
  const [formParentRegisterInActivities, setFormParentRegisterInActivities] = useState(false);

  // Odoo CRUD Permission Matrix State
  const [formPermissions, setFormPermissions] = useState<UserPermissions>({});

  // Handle general settings submit
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSaveSettings({
      ...settings,
      associationName,
      associationPhone,
      associationEmail,
      associationAddress,
      associationLogo,
      generalSupervisorName,
      directorName,
      subscriptionFee: Number(subscriptionFee),
      currency,
      allowSelfRegistration,
      showStampOnReceipts,
      stampText,

      // 1. البيانات القانونية والتأسيسية
      foundingDate,
      licenseNumber,
      bankRIB,

      // 2. إعدادات النّظم والمطبوعات الاحترافية
      activeAcademicSeason,
      mottoVision,
      receiptPrefixFormat,
      internalBylaws,
      footerNotice,
    });
  };

  // Auto generate username helper
  const handleFullNameChange = (name: string) => {
    setFormFullName(name);
    // If creating a new user, auto-populate a unique username based on the full name
    if (!editingUser) {
      const existingUsernames = appUsers.map(u => u.username);
      const autoUname = generateUniqueUsername(name, existingUsernames);
      setFormUsername(autoUname);
    }
  };

  const handleAutoGenerateUsername = () => {
    if (!formFullName.trim()) return;
    const existingUsernames = appUsers
      .filter(u => u.id !== editingUser?.id)
      .map(u => u.username);
    const autoUname = generateUniqueUsername(formFullName, existingUsernames);
    setFormUsername(autoUname);
  };

  // Open user modal
  const openUserModal = (user?: AppUser) => {
    if (user) {
      setEditingUser(user);
      setFormUsername(user.username);
      setFormFullName((user.id === "u1" || user.username === "admin_alfajr") && directorName ? directorName : user.fullName);
      setFormPassword(user.password || "");
      setFormRole(user.role);
      setFormIsActive(user.isActive);
      setFormCanEditStudents(user.canEditStudents);
      setFormCanEditTeachers(user.canEditTeachers);
      setFormCanEditGrades(user.canEditGrades);
      setFormCanEditPayments(user.canEditPayments);

      // Teachers permissions (default to true for backward compatibility if undefined)
      setFormTeacherTakeAttendance(user.teacherTakeAttendance !== false);
      setFormTeacherRecordGrades(user.teacherRecordGrades !== false);
      setFormTeacherWriteBehaviorReports(user.teacherWriteBehaviorReports !== false);
      setFormTeacherEditOwnStudents(user.teacherEditOwnStudents !== false);
      setFormTeacherSendAlertsToParents(user.teacherSendAlertsToParents !== false);

      // Students & Parents permissions (default to true for student/parent roles, false for teachers)
      const isStudentOrParent = user.role === "طالب" || user.role === "ولي أمر";
      setFormParentViewOwnStats(user.parentViewOwnStats ?? isStudentOrParent);
      setFormParentViewOwnAttendance(user.parentViewOwnAttendance ?? isStudentOrParent);
      setFormParentViewCertificates(user.parentViewCertificates ?? isStudentOrParent);
      setFormParentViewOwnPayments(user.parentViewOwnPayments ?? isStudentOrParent);
      setFormParentUpdateContactInfo(user.parentUpdateContactInfo ?? isStudentOrParent);
      setFormParentRegisterInActivities(user.parentRegisterInActivities ?? isStudentOrParent);

      // CRUD Permissions Matrix
      setFormPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
    } else {
      setEditingUser(null);
      setFormUsername("");
      setFormFullName("");
      setFormPassword("");
      setFormRole("مدرس");
      setFormIsActive(true);
      setFormCanEditStudents(true);
      setFormCanEditTeachers(false);
      setFormCanEditGrades(true);
      setFormCanEditPayments(false);

      // Default values for new teacher user
      setFormTeacherTakeAttendance(true);
      setFormTeacherRecordGrades(true);
      setFormTeacherWriteBehaviorReports(true);
      setFormTeacherEditOwnStudents(true);
      setFormTeacherSendAlertsToParents(true);

      // Default values for parent/student are false for a new teacher user
      setFormParentViewOwnStats(false);
      setFormParentViewOwnAttendance(false);
      setFormParentViewCertificates(false);
      setFormParentViewOwnPayments(false);
      setFormParentUpdateContactInfo(false);
      setFormParentRegisterInActivities(false);

      // CRUD Permissions Matrix for new user
      setFormPermissions(getDefaultPermissionsForRole("مدرس"));
    }
    setShowUserModal(true);
  };

  // Save app user
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName) {
      alert("الرجاء ملء الاسم الكامل.");
      return;
    }

    // Ensure username is generated if blank or duplicate
    const existingUsernames = appUsers
      .filter(u => u.id !== editingUser?.id)
      .map(u => u.username);

    let finalUsername = (formUsername || "").trim().toLowerCase();
    if (!finalUsername || existingUsernames.includes(finalUsername)) {
      finalUsername = generateUniqueUsername(formFullName, existingUsernames);
    }

    const userToSave: AppUser = {
      id: editingUser ? editingUser.id : `u_${Date.now()}`,
      username: finalUsername,
      fullName: formFullName,
      password: formPassword || "123",
      role: formRole,
      isActive: formIsActive,
      canEditStudents: Boolean(formPermissions?.students?.create || formPermissions?.students?.update),
      canEditTeachers: Boolean(formPermissions?.teachers?.create || formPermissions?.teachers?.update),
      canEditGrades: Boolean(formPermissions?.grades?.create || formPermissions?.grades?.update),
      canEditPayments: Boolean(formPermissions?.payments?.create || formPermissions?.payments?.update || formPermissions?.finance?.create || formPermissions?.finance?.update),
      
      // Teachers permissions
      teacherTakeAttendance: formTeacherTakeAttendance,
      teacherRecordGrades: formTeacherRecordGrades,
      teacherWriteBehaviorReports: formTeacherWriteBehaviorReports,
      teacherEditOwnStudents: formTeacherEditOwnStudents,
      teacherSendAlertsToParents: formTeacherSendAlertsToParents,

      // Students & Parents permissions
      parentViewOwnStats: formParentViewOwnStats,
      parentViewOwnAttendance: formParentViewOwnAttendance,
      parentViewCertificates: formParentViewCertificates,
      parentViewOwnPayments: formParentViewOwnPayments,
      parentUpdateContactInfo: formParentUpdateContactInfo,
      parentRegisterInActivities: formParentRegisterInActivities,

      // Odoo CRUD Matrix Permissions
      permissions: formPermissions,
    };

    if ((userToSave.id === "u1" || userToSave.username === "admin_alfajr") && formFullName.trim()) {
      setDirectorName(formFullName.trim());
    }

    onSaveAppUser(userToSave);
    setShowUserModal(false);
  };

  return (
    <div className="space-y-6" id="settings-management-panel">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab("general")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            subTab === "general"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="btn-subtab-general"
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>إعدادات الجمعية والمدرسة</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab("users")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            subTab === "users"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="btn-subtab-users"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>إدارة المستخدمين والصلاحيات</span>
          </div>
        </button>
      </div>

      {/* 1. General Association Settings */}
      {subTab === "general" && (
        <form onSubmit={handleSettingsSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Basic Association Info */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>معلومات المؤسسة والاتصال الرئيسية</span>
              </h3>
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">اسم الجمعية / المدرسة <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">اسم المشرف العام <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={generalSupervisorName}
                  onChange={(e) => setGeneralSupervisorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-bold text-slate-800"
                  placeholder="مثال: د. عبد العالي العلمي"
                  id="input-general-supervisor-name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">اسم مدير المدرسة المسؤول (المدير التنفيذي) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-bold"
                  placeholder="مثال: الشيخ عبد الرحمن السلاوي"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">رقم الهاتف <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><Phone className="w-4 h-4" /></span>
                    <input
                      type="text"
                      required
                      value={associationPhone}
                      onChange={(e) => setAssociationPhone(e.target.value)}
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      required
                      value={associationEmail}
                      onChange={(e) => setAssociationEmail(e.target.value)}
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none font-mono text-left bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">العنوان الجغرافي المقر الرسمي <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400"><MapPin className="w-4 h-4" /></span>
                  <textarea
                    required
                    rows={2}
                    value={associationAddress}
                    onChange={(e) => setAssociationAddress(e.target.value)}
                    className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">شعار المؤسسة الرسمي</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-white ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    id="logo-upload-input"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  
                  {associationLogo ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-24 h-24 bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex items-center justify-center overflow-hidden">
                        <img
                          src={associationLogo}
                          alt="Association Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <label
                          htmlFor="logo-upload-input"
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          تغيير الشعار
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          حذف الشعار
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload-input" className="cursor-pointer flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="text-emerald-700 font-bold">انقر لرفع الشعار</span> أو اسحب الملف وأفلته هنا
                      </div>
                      <p className="text-[10px] text-slate-400">تدعم صور PNG, JPG حتى 2 ميغابايت</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Legal & Founding Info */}
            <div className="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80">
              <h3 className="text-sm font-bold text-amber-950 border-b border-amber-200 pb-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-700" />
                <span>البيانات القانونية والتأسيسية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">سنة / تاريخ التأسيس</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><Calendar className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={foundingDate}
                      onChange={(e) => setFoundingDate(e.target.value)}
                      placeholder="مثال: 2018-05-15 أو 2018"
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">رقم الترخيص / وصل الإيداع القانوني</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><FileCheck className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="مثال: وصل إيداع نهائي رقم 1422 / سلا"
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الحساب البنكي للجمعية (RIB)</label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-slate-400"><CreditCard className="w-4 h-4" /></span>
                  <input
                    type="text"
                    value={bankRIB}
                    onChange={(e) => setBankRIB(e.target.value)}
                    placeholder="مثال: 230 780 0001234567890123 45 (البنك)"
                    className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5">يُدرج الحساب البنكي في الفواتير والتقارير المالية والوصولات الرسمية.</p>
              </div>

              {/* General Financial Rules & Toggles included here for symmetry */}
              <div className="border-t border-amber-200/60 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الرسوم المرجعية والتفضيلات</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">رسوم الاشتراك الشهري المرجعية</label>
                    <input
                      type="number"
                      required
                      value={subscriptionFee}
                      onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">العملة الرسمية</label>
                    <input
                      type="text"
                      required
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Systems & Professional Publications Settings */}
            <div className="space-y-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80">
              <h3 className="text-sm font-bold text-emerald-950 border-b border-emerald-200 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>إعدادات النّظم والمطبوعات الاحترافية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">الموسم الدراسي النشط <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><Tag className="w-4 h-4" /></span>
                    <input
                      type="text"
                      required
                      value={activeAcademicSeason}
                      onChange={(e) => setActiveAcademicSeason(e.target.value)}
                      placeholder="مثال: 2026/2027"
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">صيغة ترقيم الوصولات</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400"><FileText className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={receiptPrefixFormat}
                      onChange={(e) => setReceiptPrefixFormat(e.target.value)}
                      placeholder="مثال: REC-{YEAR}-{NO}"
                      className="w-full pr-10 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الشعار اللفظي / الرؤية المؤسساتية</label>
                <input
                  type="text"
                  value={mottoVision}
                  onChange={(e) => setMottoVision(e.target.value)}
                  placeholder="مثال: نحو جيل قرآني متخلق بأخلاق القرآن..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white font-medium italic text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">شروط وأحكام القانون الداخلي (تدرج باستمارة التسجيل)</label>
                <textarea
                  rows={3}
                  value={internalBylaws}
                  onChange={(e) => setInternalBylaws(e.target.value)}
                  placeholder="أدخل نصوص البنود الرئيسية للقانون الداخلي للمدرسة..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">نص الترويسة السفلي (للوصلات والشهادات الرسمية)</label>
                <input
                  type="text"
                  value={footerNotice}
                  onChange={(e) => setFooterNotice(e.target.value)}
                  placeholder="أدخل النص الختامي السفلية للمطبوعات..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white text-slate-600 text-[11px]"
                />
              </div>

              {/* Stamp & Registration Toggles */}
              <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">السماح بالتسجيل الذاتي للطلاب الجدد</p>
                    <p className="text-[10px] text-slate-400">تفعيل خيار التسجيل الإلكتروني عبر البوابات.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowSelfRegistration(!allowSelfRegistration)}
                    className="text-emerald-600 hover:text-emerald-700 transition"
                  >
                    {allowSelfRegistration ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">إظهار خاتم وتوقيع الإدارة على وصولات الدفع</p>
                    <p className="text-[10px] text-slate-400">تضمين التوقيع الرسمي تلقائياً عند طباعة الوصل.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStampOnReceipts(!showStampOnReceipts)}
                    className="text-emerald-600 hover:text-emerald-700 transition"
                  >
                    {showStampOnReceipts ? (
                      <ToggleRight className="w-9 h-9" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-400" />
                    )}
                  </button>
                </div>

                {showStampOnReceipts && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700">نص الختم المعتمد</label>
                    <input
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      placeholder="مثال: إدارة مدرسة الفجر الجديد القرآنية - سلا"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            {canUpdate && (
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3.5 rounded-2xl flex items-center gap-2 transition shadow-lg hover:shadow-emerald-900/20 active:scale-95 cursor-pointer"
                id="btn-save-general-settings"
              >
                <Save className="w-4 h-4" />
                <span>حفظ جميع إعدادات المؤسسة والمطبوعات</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* 2. App Users & Permissions list */}
      {subTab === "users" && (
        <div className="space-y-5" dir="rtl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>إدارة حسابات المستخدمين والصلاحيات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">إضافة وإدارة حسابات المعلمين والمدراء والطلاب وأولياء الأمور مع التحكم الدقيق في مستويات الوصول.</p>
            </div>
            {canCreate && (
              <button
                onClick={() => openUserModal()}
                className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0"
                id="btn-add-new-user"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">إجمالي الحسابات</p>
                <p className="text-lg font-black text-slate-800">{appUsers.length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">الحسابات النشطة</p>
                <p className="text-lg font-black text-emerald-700">{appUsers.filter(u => u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">الحسابات الموقوفة</p>
                <p className="text-lg font-black text-rose-600">{appUsers.filter(u => !u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">المدراء والمسيرون</p>
                <p className="text-lg font-black text-amber-700">{appUsers.filter(u => u.role === "مدير" || u.role === "إداري").length}</p>
              </div>
            </div>
          </div>

          {/* Sync Notice Banner & Action */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center justify-center w-7 h-7 shrink-0">⚙️</span>
              <div>
                <p className="font-bold text-emerald-950">المزامنة التلقائية والذكية لحسابات المؤسسة والأدوار:</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  يقوم النظام تلقائياً بمزامنة حسابات <strong>المكتب التنفيذي والمسيرين</strong>، <strong>المؤطرين</strong>، <strong>المحفظين والأساتذة</strong>، <strong>المتطوعين</strong>، <strong>عمال النظافة والصيانة</strong>، <strong>أولياء الأمور</strong>، و<strong>الطلاب</strong> بدقة مع مطابقة الأدوار والمسميات الوظيفية المسندة لهم في شؤون العاملين، مع <strong>الإيقاف التلقائي لحساب أي شخص يتم أرشفته</strong>. كلمة المرور الافتراضية: <span className="font-mono bg-white border border-emerald-200 px-1.5 py-0.2 rounded text-emerald-800 font-bold">123</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
              title="مزامنة فورية وتحديث الأدوار مع شؤون العاملين والطلاب"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "جاري المزامنة..." : "مزامنة فورية للأدوار"}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Search, Filters & View Mode Switcher Control Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="البحث باسم المستخدم أو الاسم الكامل..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-sans bg-slate-50/50 focus:bg-white"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
                >
                  <option value="all">جميع الأدوار</option>
                  <option value="مدير">مدراء ومسيرو الجمعية (رئيس / مدير)</option>
                  <option value="إداري">إداريون وأعضاء المكتب التنفيذي</option>
                  <option value="مؤطر">مؤطرون ومشرفون تربويون</option>
                  <option value="مدرس">أساتذة ومحفظون (حلقات التحفيظ)</option>
                  <option value="متطوع">متطوعون بالأنشطة والفعاليات 🤝</option>
                  <option value="عامل نظافة / صيانة">عمال نظافة وصيانة 🧹</option>
                  <option value="ولي أمر">أولياء أمور</option>
                  <option value="طالب">طلاب (15+ سنة)</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">الحسابات النشطة فقط</option>
                <option value="inactive">الحسابات الموقوفة فقط</option>
              </select>

              {/* View Switcher Toggle (matching dark styled switcher in screenshot) */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setUserViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "cards"
                      ? "bg-teal-950 text-teal-300 border border-teal-500/80 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                  title="عرض البطاقات (كانبان)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">البطاقات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "table"
                      ? "bg-teal-950 text-teal-300 border border-teal-500/80 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                  title="عرض القائمة والجدول المنظم"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">جدول منظم</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-bold">لا توجد حسابات مطابقة لخيارات البحث أو التصفية الحالية.</p>
              <p className="text-slate-400 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط التصفية.</p>
            </div>
          ) : userViewMode === "table" ? (
            /* ==================== 1. ORGANIZED TABLE VIEW ==================== */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px] tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">الاسم الكامل</th>
                      <th className="py-3.5 px-4">اسم المستخدم</th>
                      <th className="py-3.5 px-4">الدور</th>
                      <th className="py-3.5 px-4">آخر تسجيل دخول</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">الصلاحيات والتراخيص</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredUsers.map((user) => {
                      const isAutoSynced = user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_");
                      const displayFullName = (user.id === "u1" || user.username === "admin_alfajr") && directorName ? directorName : user.fullName;
                      return (
                        <tr
                          key={user.id}
                          className={`transition hover:bg-slate-50/80 ${
                            !user.isActive ? "bg-rose-50/30 text-slate-500" : ""
                          }`}
                        >
                          {/* Full Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                user.role === "مدير"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : user.role === "إداري"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : user.role === "مؤطر"
                                  ? "bg-orange-100 text-orange-800 border border-orange-200"
                                  : user.role === "مدرس"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : user.role === "متطوع"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-teal-100 text-teal-800 border border-teal-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-sky-100 text-sky-800 border border-sky-200"
                                  : user.role === "طالب"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}>
                                {displayFullName.substring(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className={user.isArchived ? "line-through text-slate-400" : ""}>{displayFullName}</span>
                                  {isAutoSynced && (
                                    <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-md font-normal" title="حساب مزامن تلقائياً">
                                      مزامنة
                                    </span>
                                  )}
                                  {user.isArchived && (
                                    <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-md font-bold" title="شخص مؤرشف في المنظومة">
                                      مؤرشف
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username & Password */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] dir-ltr text-right">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 font-semibold text-slate-700">
                                @{user.username}
                              </span>
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px]">
                                <span className="text-slate-600 font-bold tracking-wider">
                                  {revealedUserPasswords[user.id] ? (user.password || "123") : "••••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealPassword(user.id)}
                                  className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5 rounded"
                                  title={revealedUserPasswords[user.id] ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                  {revealedUserPasswords[user.id] ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                user.role === "مدير"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : user.role === "إداري"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : user.role === "مؤطر"
                                  ? "bg-orange-50 text-orange-800 border-orange-200"
                                  : user.role === "مدرس"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : user.role === "متطوع"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-sky-50 text-sky-800 border-sky-200"
                                  : user.role === "طالب"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : "bg-slate-50 text-slate-800 border-slate-200"
                              }`}>
                                {user.role === "متطوع" && "🤝 "}
                                {user.role === "عامل نظافة / صيانة" && "🧹 "}
                                {user.role === "مدرس" && "👨‍🏫 "}
                                {user.role === "مؤطر" && "🌟 "}
                                {user.role === "إداري" && "📋 "}
                                {user.role === "مدير" && "👑 "}
                                {user.role === "ولي أمر" && "👨‍👧‍👦 "}
                                {user.role === "طالب" && "🎓 "}
                                <span>{user.role}</span>
                              </span>
                              {user.roleTitle && user.roleTitle !== user.role && (
                                <span className="text-[10px] text-slate-500 font-medium" title="المسمى الوظيفي المسند في شؤون العاملين">
                                  {user.roleTitle}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Login Date */}
                          <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className={user.lastLogin ? "font-semibold text-slate-700" : "text-slate-400 italic"}>
                                {formatLastLogin(user.lastLogin)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>نشط</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>{user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}</span>
                              </span>
                            )}
                          </td>

                          {/* Permissions summary */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.role === "مدير" ? (
                                <span className="bg-amber-100/80 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  كامل الصلاحيات
                                </span>
                              ) : (
                                <>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditStudents ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    الطلاب
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditTeachers ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    العاملين
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditGrades ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    الدرجات
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditPayments ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    المالية
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {canUpdate && (
                                <button
                                  onClick={() => openUserModal(user)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-xl transition cursor-pointer"
                                  title="تعديل الحساب والصلاحيات"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && user.username !== "admin_alfajr" && (
                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`)) {
                                      onDeleteAppUser(user.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition cursor-pointer"
                                  title="حذف الحساب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ==================== 2. CARDS / KANBAN VIEW ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs relative transition hover:border-slate-300 flex flex-col justify-between ${
                    !user.isActive ? "opacity-75 border-rose-200/80 bg-rose-50/20" : "border-slate-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        user.role === "مدير"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : user.role === "إداري"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : user.role === "مؤطر"
                          ? "bg-orange-100 text-orange-800 border-orange-200"
                          : user.role === "مدرس"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : user.role === "متطوع"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : user.role === "عامل نظافة / صيانة"
                          ? "bg-teal-100 text-teal-800 border-teal-200"
                          : user.role === "ولي أمر"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : user.role === "طالب"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}>
                        {user.role === "متطوع" && "🤝 "}
                        {user.role === "عامل نظافة / صيانة" && "🧹 "}
                        {user.role === "مدرس" && "👨‍🏫 "}
                        {user.role === "مؤطر" && "🌟 "}
                        {user.role === "إداري" && "📋 "}
                        {user.role === "مدير" && "👑 "}
                        {user.role}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        user.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}>
                        {user.isActive ? "نشط" : user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}
                      </span>
                    </div>

                    <h4 className={`font-bold text-sm mb-0.5 ${user.isArchived ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {(user.id === "u1" || user.username === "admin_alfajr") && directorName ? directorName : user.fullName}
                    </h4>
                    {user.roleTitle && user.roleTitle !== user.role && (
                      <p className="text-[11px] text-slate-500 font-medium mb-1">{user.roleTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        <span className="text-slate-700 font-bold">
                          {revealedUserPasswords[user.id] ? (user.password || "123") : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRevealPassword(user.id)}
                          className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5 rounded"
                          title={revealedUserPasswords[user.id] ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        >
                          {revealedUserPasswords[user.id] ? <EyeOff className="w-3 h-3 text-rose-500" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Last login date info */}
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>آخر دخول:</span>
                      <span className="font-bold text-slate-700">{formatLastLogin(user.lastLogin)}</span>
                    </div>

                    {(user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_")) && (
                      <div className="mb-3 flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-100 rounded-lg px-2 py-1.5 text-[10px] font-bold" dir="rtl">
                        <span>🔄</span>
                        <span>مزامنة تلقائية من سجلات {user.role}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-2 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>تعديل الطلاب:</span>
                        {user.canEditStudents ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل المعلمين:</span>
                        {user.canEditTeachers ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الامتحانات:</span>
                        {user.canEditGrades ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الرسوم والمالية:</span>
                        {user.canEditPayments ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3 mt-4 justify-end">
                    {canUpdate && (
                      <button
                        onClick={() => openUserModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-xl transition cursor-pointer"
                        title="تعديل الحساب والصلاحيات"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && user.username !== "admin_alfajr" && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`)) {
                            onDeleteAppUser(user.id);
                          }
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition cursor-pointer"
                        title="حذف الحساب نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* App User Modals */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="app-user-form-modal" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl lg:max-w-5xl overflow-hidden my-6 animate-scaleIn max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base">{editingUser ? "تعديل حساب المستخدم" : "إضافة حساب مستخدم جديد"}</h3>
                <p className="text-[10px] text-emerald-200 mt-1">قم بملء البيانات وتخصيص مستويات الوصول بكل دقة.</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="block text-xs font-bold text-slate-700">الاسم الكامل <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="مثال: ذ. مصطفى العلوي"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="block text-xs font-bold text-slate-700">اسم المستخدم (Username) <span className="text-rose-500">*</span></label>
                    {editingUser?.username !== "admin_alfajr" && (
                      <button
                        type="button"
                        onClick={handleAutoGenerateUsername}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                        title="توليد اسم مستخدم فريد تلقائياً بناءً على الاسم الكامل"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>توليد تلقائي</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={editingUser?.username === "admin_alfajr"}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="mustafa_alawi"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none font-mono text-left"
                  />
                  <p className="text-[10px] text-slate-500">يتم توليده تلقائياً بشكل فريد من الاسم الكامل لمنع التشابه.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">كلمة المرور / الرمز السري <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute right-3 top-3 text-slate-400 pointer-events-none"><Lock className="w-3.5 h-3.5" /></span>
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-9 pl-9 p-2.5 border border-slate-300 rounded-xl text-xs focus:border-emerald-600 focus:outline-none font-mono text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute left-2.5 top-2.5 p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title={showFormPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">نوع الصلاحية الافتراضية</label>
                  <select
                    value={formRole}
                    disabled={editingUser?.username === "admin_alfajr"}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormRole(newRole);
                      // Auto-apply roles preset
                      if (newRole === "مدير") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(true);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(true);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      } else if (newRole === "إداري") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(true);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(true);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      } else if (newRole === "مؤطر") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(false);
                      } else if (newRole === "مدرس") {
                        setFormCanEditStudents(true);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(true);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(true);
                        setFormTeacherRecordGrades(true);
                        setFormTeacherWriteBehaviorReports(true);
                        setFormTeacherEditOwnStudents(true);
                        setFormTeacherSendAlertsToParents(true);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(false);
                      } else if (newRole === "متطوع" || newRole === "عامل نظافة / صيانة" || newRole === "أخرى") {
                        setFormCanEditStudents(false);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(false);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(false);
                        setFormTeacherRecordGrades(false);
                        setFormTeacherWriteBehaviorReports(false);
                        setFormTeacherEditOwnStudents(false);
                        setFormTeacherSendAlertsToParents(false);

                        // Parents/Students
                        setFormParentViewOwnStats(false);
                        setFormParentViewOwnAttendance(false);
                        setFormParentViewCertificates(false);
                        setFormParentViewOwnPayments(false);
                        setFormParentUpdateContactInfo(false);
                        setFormParentRegisterInActivities(newRole === "متطوع");
                      } else {
                        // Student or Parent
                        setFormCanEditStudents(false);
                        setFormCanEditTeachers(false);
                        setFormCanEditGrades(false);
                        setFormCanEditPayments(false);

                        // Teachers
                        setFormTeacherTakeAttendance(false);
                        setFormTeacherRecordGrades(false);
                        setFormTeacherWriteBehaviorReports(false);
                        setFormTeacherEditOwnStudents(false);
                        setFormTeacherSendAlertsToParents(false);

                        // Parents/Students
                        setFormParentViewOwnStats(true);
                        setFormParentViewOwnAttendance(true);
                        setFormParentViewCertificates(true);
                        setFormParentViewOwnPayments(true);
                        setFormParentUpdateContactInfo(true);
                        setFormParentRegisterInActivities(true);
                      }

                      // Update permissions matrix to match new role
                      setFormPermissions(getDefaultPermissionsForRole(newRole));
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="مدير">مدير (Director - كامل الصلاحيات)</option>
                    <option value="إداري">إداري / عضو مكتب تنفيذي (Administrator)</option>
                    <option value="مؤطر">مؤطر / مشرف تربوي (Mentor / Supervisor)</option>
                    <option value="مدرس">أستاذ / محفظ (Teacher)</option>
                    <option value="متطوع">متطوع بالأنشطة والفعاليات (Volunteer)</option>
                    <option value="عامل نظافة / صيانة">عامل نظافة وصيانة (Maintenance / Cleaning)</option>
                    <option value="ولي أمر">ولي أمر (Parent Portal)</option>
                    <option value="طالب">طالب (Student Portal - 15+ سنة)</option>
                    <option value="أخرى">أخرى (Other)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">حالة الحساب</label>
                  <select
                    value={formIsActive ? "active" : "blocked"}
                    disabled={editingUser?.username === "admin_alfajr"}
                    onChange={(e) => setFormIsActive(e.target.value === "active")}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="active">نشط ومفعل</option>
                    <option value="blocked">موقوف / مجمد</option>
                  </select>
                </div>
              </div>

              {/* Odoo CRUD Permission Matrix */}
              <div className="border-t pt-4 text-right" dir="rtl">
                <PermissionMatrixEditor
                  permissions={formPermissions}
                  onChange={setFormPermissions}
                  role={formRole}
                  disabled={editingUser?.username === "admin_alfajr"}
                />
              </div>

              {editingUser?.username === "admin_alfajr" && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start gap-2 text-[10px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>حساب المدير الأساسي (@admin_alfajr) له الصلاحيات المطلقة دائماً ولا يمكن تعديل نوع حسابه أو حظره لضمان عدم انقطاع الوصول إلى النظام.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow"
                  id="btn-confirm-save-user"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
