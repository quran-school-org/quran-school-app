/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState } from "react";
import { AppUser, UserRole, UserPermissions, getDefaultPermissionsForRole } from "../../types";
import { MIN_NEW_PASSWORD_LENGTH } from "../../security/accounts";
import type { FeeOverride } from "../../types";
import { generateUniqueUsername } from "../../db";
import { isPrimaryDirector } from "./shared";
import type { SettingsManagementProps } from "../SettingsManagement";

export function useSettingsState(props: SettingsManagementProps) {
  const {
  settings,
  appUsers,
  teachers = [],
  students = [],
  canManageAccounts = false,
  canCreateSettings,
  canUpdateSettings,
  canDeleteSettings,
  onSaveSettings,
  onSaveAppUser,
  onCreateAppUser,
  onResetUserPassword,
  onDeleteAppUser,
  onSaveTeacher,
  onNavigateToStaff,
  onHarmonizeUsers
  } = props;
  const canCreate = canCreateSettings ?? true;
  const canUpdate = canUpdateSettings ?? true;
  const canDelete = canDeleteSettings ?? true;
  // Les règles Firestore réservent l'écriture des comptes au directeur.
  const canCreateAccounts = canCreate && canManageAccounts;
  const canUpdateAccounts = canUpdate && canManageAccounts;
  const canDeleteAccounts = canDelete && canManageAccounts;

  // Tabs for sub-settings
  const [subTab, setSubTab] = useState<"general" | "users">("general");

  // User search, filter & view mode state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userViewMode, setUserViewMode] = useState<"table" | "cards">("table");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [userFormSaving, setUserFormSaving] = useState(false);
  // Rattacher un compte existant (même personne dans plusieurs écoles) au lieu d'en créer un.
  const [formAttachExisting, setFormAttachExisting] = useState(false);
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

  // Lot 0 : les mots de passe ne sont plus stockés ni affichables. Le directeur
  // peut seulement définir un mot de passe provisoire (Cloud Function).
  const handleResetPassword = async (user: AppUser) => {
    if (!onResetUserPassword) return;
    const newPassword = window.prompt(
      `كلمة مرور مؤقتة جديدة لحساب ${user.fullName} (${MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل). سيُطلب من المستخدم تغييرها عند الدخول:`
    );
    if (newPassword === null) return;
    await onResetUserPassword(user, newPassword);
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
      String(user.fullName ?? "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      String(user.username ?? "").toLowerCase().includes(userSearchQuery.toLowerCase());
    
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
  // Paramètres métier de l'école (multi-écoles)
  const [openingYear, setOpeningYear] = useState<number | "">(settings.openingYear ?? "");
  const [openingMonth, setOpeningMonth] = useState<string>(settings.openingMonth || "");
  const [feeOverrides, setFeeOverrides] = useState<FeeOverride[]>(settings.feeOverrides || []);
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
  // Liens explicites (Lot 0) : fiche du personnel ou élèves rattachés au compte
  const [formLinkedTeacherId, setFormLinkedTeacherId] = useState("");
  const [formLinkedStudentIds, setFormLinkedStudentIds] = useState<string[]>([]);
  const [linkedStudentSearch, setLinkedStudentSearch] = useState("");
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
      openingYear: openingYear === "" ? undefined : Number(openingYear),
      openingMonth: openingMonth || undefined,
      feeOverrides: feeOverrides
        .filter((o) => Number(o.year) > 0 && o.month && Number.isFinite(Number(o.amount)))
        .map((o) => ({ year: Number(o.year), month: o.month, amount: Number(o.amount) })),
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
      setFormFullName(isPrimaryDirector(user) && directorName ? directorName : user.fullName);
      setFormPassword("");
      setFormLinkedTeacherId(user.linkedTeacherId || (user.id.startsWith("t_") ? user.id.slice(2) : ""));
      setFormLinkedStudentIds(
        user.linkedStudentIds && user.linkedStudentIds.length > 0
          ? user.linkedStudentIds
          : (user.id.startsWith("s_") || user.id.startsWith("p_")) ? [user.id.slice(2)] : []
      );
      setLinkedStudentSearch("");
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
      setFormLinkedTeacherId("");
      setFormLinkedStudentIds([]);
      setLinkedStudentSearch("");
      setFormAttachExisting(false);
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
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName) {
      alert("الرجاء ملء الاسم الكامل.");
      return;
    }
    if (!editingUser && !formAttachExisting && formPassword.length < MIN_NEW_PASSWORD_LENGTH) {
      alert(`يجب أن تتكون كلمة المرور من ${MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل.`);
      return;
    }

    // Ensure username is generated if blank or duplicate
    const existingUsernames = appUsers
      .filter(u => u.id !== editingUser?.id)
      .map(u => u.username);

    let finalUsername = (formUsername || "").trim().toLowerCase();
    if (editingUser) {
      // Le nom d'utilisateur d'un compte existant ne change pas (il porte l'email de connexion).
      finalUsername = editingUser.username;
    } else if (formAttachExisting) {
      if (!finalUsername) {
        alert("يرجى إدخال اسم المستخدم للحساب الموجود.");
        return;
      }
    } else if (!finalUsername || existingUsernames.includes(finalUsername)) {
      finalUsername = generateUniqueUsername(formFullName, existingUsernames);
    }

    const isFamilyRole = formRole === "طالب" || formRole === "ولي أمر";
    const userToSave: AppUser = {
      // On conserve les champs techniques du compte (authUid, liens, lastLogin…).
      ...(editingUser || {}),
      id: editingUser ? editingUser.id : `u_${Date.now()}`,
      username: finalUsername,
      fullName: formFullName,
      role: formRole,
      linkedTeacherId: !isFamilyRole && formLinkedTeacherId ? formLinkedTeacherId : undefined,
      linkedStudentIds: isFamilyRole ? formLinkedStudentIds.slice(0, 30) : [],
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

    if (isPrimaryDirector(userToSave) && formFullName.trim()) {
      setDirectorName(formFullName.trim());
    }

    setUserFormSaving(true);
    try {
      if (editingUser) {
        await onSaveAppUser(userToSave);
        setShowUserModal(false);
      } else if (onCreateAppUser) {
        const ok = await onCreateAppUser(userToSave, formAttachExisting ? "" : formPassword);
        if (ok) setShowUserModal(false);
      }
    } finally {
      setUserFormSaving(false);
    }
  };


  return {
    settings,
    appUsers,
    teachers,
    students,
    canManageAccounts,
    canCreateSettings,
    canUpdateSettings,
    canDeleteSettings,
    onSaveSettings,
    onSaveAppUser,
    onCreateAppUser,
    onResetUserPassword,
    onDeleteAppUser,
    onSaveTeacher,
    onNavigateToStaff,
    onHarmonizeUsers,
    canCreate,
    canUpdate,
    canDelete,
    canCreateAccounts,
    canUpdateAccounts,
    canDeleteAccounts,
    subTab,
    setSubTab,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    userViewMode,
    setUserViewMode,
    showFormPassword,
    setShowFormPassword,
    userFormSaving,
    setUserFormSaving,
    formAttachExisting,
    setFormAttachExisting,
    isSyncing,
    setIsSyncing,
    syncSuccessMsg,
    setSyncSuccessMsg,
    handleTriggerSync,
    handleResetPassword,
    formatLastLogin,
    filteredUsers,
    associationName,
    setAssociationName,
    generalSupervisorName,
    setGeneralSupervisorName,
    associationPhone,
    setAssociationPhone,
    associationEmail,
    setAssociationEmail,
    associationAddress,
    setAssociationAddress,
    associationLogo,
    setAssociationLogo,
    directorName,
    setDirectorName,
    subscriptionFee,
    setSubscriptionFee,
    currency,
    setCurrency,
    openingYear,
    setOpeningYear,
    openingMonth,
    setOpeningMonth,
    feeOverrides,
    setFeeOverrides,
    allowSelfRegistration,
    setAllowSelfRegistration,
    showStampOnReceipts,
    setShowStampOnReceipts,
    stampText,
    setStampText,
    foundingDate,
    setFoundingDate,
    licenseNumber,
    setLicenseNumber,
    bankRIB,
    setBankRIB,
    activeAcademicSeason,
    setActiveAcademicSeason,
    mottoVision,
    setMottoVision,
    receiptPrefixFormat,
    setReceiptPrefixFormat,
    internalBylaws,
    setInternalBylaws,
    footerNotice,
    setFooterNotice,
    isDragging,
    setIsDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLogoChange,
    processLogoFile,
    handleRemoveLogo,
    showUserModal,
    setShowUserModal,
    editingUser,
    setEditingUser,
    formUsername,
    setFormUsername,
    formFullName,
    setFormFullName,
    formPassword,
    setFormPassword,
    formLinkedTeacherId,
    setFormLinkedTeacherId,
    formLinkedStudentIds,
    setFormLinkedStudentIds,
    linkedStudentSearch,
    setLinkedStudentSearch,
    formRole,
    setFormRole,
    formIsActive,
    setFormIsActive,
    formCanEditStudents,
    setFormCanEditStudents,
    formCanEditTeachers,
    setFormCanEditTeachers,
    formCanEditGrades,
    setFormCanEditGrades,
    formCanEditPayments,
    setFormCanEditPayments,
    formTeacherTakeAttendance,
    setFormTeacherTakeAttendance,
    formTeacherRecordGrades,
    setFormTeacherRecordGrades,
    formTeacherWriteBehaviorReports,
    setFormTeacherWriteBehaviorReports,
    formTeacherEditOwnStudents,
    setFormTeacherEditOwnStudents,
    formTeacherSendAlertsToParents,
    setFormTeacherSendAlertsToParents,
    formParentViewOwnStats,
    setFormParentViewOwnStats,
    formParentViewOwnAttendance,
    setFormParentViewOwnAttendance,
    formParentViewCertificates,
    setFormParentViewCertificates,
    formParentViewOwnPayments,
    setFormParentViewOwnPayments,
    formParentUpdateContactInfo,
    setFormParentUpdateContactInfo,
    formParentRegisterInActivities,
    setFormParentRegisterInActivities,
    formPermissions,
    setFormPermissions,
    handleSettingsSubmit,
    handleFullNameChange,
    handleAutoGenerateUsername,
    openUserModal,
    handleUserSubmit,
  };
}

export type SettingsState = ReturnType<typeof useSettingsState>;
