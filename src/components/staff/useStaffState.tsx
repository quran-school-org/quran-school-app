/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState, useMemo } from "react";
import { Teacher, StaffCategory, ContractType, UserRole } from "../../types";
import type { TeacherManagementProps } from "../TeacherManagement";
import { canReadStaffPrivate } from "../../security/access";
import { stripStaffPrivate } from "../../security/staffPrivate";
import { useToast } from "../../ui";

export function useStaffState(props: TeacherManagementProps) {
  const toast = useToast();
  const {
  teachers,
  classes,
  currentRole,
  systemSettings,
  canEditTeachers,
  canCreateTeachers,
  canUpdateTeachers,
  canDeleteTeachers,
  onSaveTeacher,
  onArchiveToggle,
  onDeleteTeacher
  } = props;
  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<"all" | "active" | "archived">("active");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Print Badge Modal State
  const [badgeStaff, setBadgeStaff] = useState<Teacher | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);

  // Form inputs
  const [formCategory, setFormCategory] = useState<StaffCategory>("أستاذ / محفظ");
  const [formFullName, setFormFullName] = useState("");
  const [formRoleTitle, setFormRoleTitle] = useState("");
  const [formCinNumber, setFormCinNumber] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEmergencyContact, setFormEmergencyContact] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formContractType, setFormContractType] = useState<ContractType>("مكافأة شهرية");
  const [formMonthlySalary, setFormMonthlySalary] = useState<number>(2000);
  const [formWorkSchedule, setFormWorkSchedule] = useState("");
  const [formAssignedAreas, setFormAssignedAreas] = useState("");
  const [formDuties, setFormDuties] = useState("");
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formCoursesString, setFormCoursesString] = useState("");
  const [formJoinedDate, setFormJoinedDate] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const canCreate = canCreateTeachers ?? canEditTeachers ?? (currentRole === "مدير");
  const canUpdate = canUpdateTeachers ?? canEditTeachers ?? (currentRole === "مدير");
  const canDelete = canDeleteTeachers ?? (currentRole === "مدير");

  // Dynamic staff list merged with settings (المشرف العام والمدير التنفيذي)
  const allStaff = useMemo<Teacher[]>(() => {
    const dynamicItems: Teacher[] = [];

    // 1. المشرف العام من وثيقة الإعدادات
    const supervisorName = systemSettings?.generalSupervisorName?.trim();
    if (supervisorName) {
      const existingSupervisor = teachers.find(
        t => t.id === "settings_supervisor" || (t.roleTitle?.includes("المشرف العام") && t.fullName === supervisorName)
      );

      dynamicItems.push({
        id: "settings_supervisor",
        fullName: supervisorName,
        photo: existingSupervisor?.photo || "",
        phone: existingSupervisor?.phone || systemSettings?.associationPhone || "",
        whatsapp: existingSupervisor?.whatsapp || systemSettings?.associationPhone || "",
        email: existingSupervisor?.email || systemSettings?.associationEmail || "",
        specialty: existingSupervisor?.specialty || "إشراف عام وتسيير جمعوي وتربوي",
        trainingCourses: existingSupervisor?.trainingCourses || ["التسيير الجمعوي", "الإشراف التربوي والقيادة"],
        isArchived: false,
        joinedDate: existingSupervisor?.joinedDate || systemSettings?.foundingDate || "2024-01-01",
        category: "إداري / كاتب",
        roleTitle: "المشرف العام للجمعية والنادي",
        contractType: existingSupervisor?.contractType || "تطوعي",
        monthlySalary: existingSupervisor?.monthlySalary ?? 0,
        cinNumber: existingSupervisor?.cinNumber || "",
        duties: existingSupervisor?.duties || "الإشراف العام وتوجيه السياسات التربوية والإدارية للنادي والجمعية، ومتابعة القرارات الاستراتيجية",
        assignedAreas: existingSupervisor?.assignedAreas || "الإدارة العامة، مجلس التسيير، النادي القرآني",
        emergencyContact: existingSupervisor?.emergencyContact || "",
        workSchedule: existingSupervisor?.workSchedule || "متابعة دورية واجتماعات أسبوعية",
        birthDate: existingSupervisor?.birthDate || "",
        address: existingSupervisor?.address || systemSettings?.associationAddress || "",
        isFromSettings: true,
        settingsKey: "generalSupervisor"
      });
    }

    // 2. مدير المدرسة المسؤول (المدير التنفيذي) من وثيقة الإعدادات
    const directorName = systemSettings?.directorName?.trim();
    if (directorName) {
      const existingDirector = teachers.find(
        t => t.id === "settings_director" || (t.roleTitle?.includes("المدير التنفيذي") && t.fullName === directorName)
      );

      dynamicItems.push({
        id: "settings_director",
        fullName: directorName,
        photo: existingDirector?.photo || "",
        phone: existingDirector?.phone || systemSettings?.associationPhone || "",
        whatsapp: existingDirector?.whatsapp || systemSettings?.associationPhone || "",
        email: existingDirector?.email || systemSettings?.associationEmail || "",
        specialty: existingDirector?.specialty || "إدارة تربوية وتدبير تنفيذي",
        trainingCourses: existingDirector?.trainingCourses || ["التدبير الإداري", "الإدارة المدرسية والتربوية"],
        isArchived: false,
        joinedDate: existingDirector?.joinedDate || systemSettings?.foundingDate || "2024-01-01",
        category: "إداري / كاتب",
        roleTitle: "مدير المدرسة المسؤول (المدير التنفيذي)",
        contractType: existingDirector?.contractType || "عقد عمل دائم",
        monthlySalary: existingDirector?.monthlySalary ?? 3500,
        cinNumber: existingDirector?.cinNumber || "",
        duties: existingDirector?.duties || "التدبير اليومي والتنفيذي للنادي، الإشراف على الأطر والأساتذة، تدبير شؤون الطلاب، وتنسيق الجداول والمتابعة الإدارية",
        assignedAreas: existingDirector?.assignedAreas || "الإدارة التنفيذية، فصول ومرافق النادي",
        emergencyContact: existingDirector?.emergencyContact || "",
        workSchedule: existingDirector?.workSchedule || "من الإثنين إلى السبت (الدوام الكامل)",
        birthDate: existingDirector?.birthDate || "",
        address: existingDirector?.address || systemSettings?.associationAddress || "",
        isFromSettings: true,
        settingsKey: "director"
      });
    }

    // Filter out duplicates from database
    const regularStaff = teachers.filter(t => {
      if (t.id === "settings_supervisor" || t.id === "settings_director") return false;
      if (supervisorName && t.roleTitle?.includes("المشرف العام") && t.fullName === supervisorName) return false;
      if (directorName && t.roleTitle?.includes("المدير التنفيذي") && t.fullName === directorName) return false;
      return true;
    });

    const merged = [...dynamicItems, ...regularStaff];
    // Fiches RH (salaire, CIN, contrat…) : bureau seulement (D42). Pour les autres
    // rôles, elles ne viennent pas du serveur ; on retire aussi les valeurs par
    // défaut des fiches synthétiques ci-dessus (ex. salaire du directeur).
    return canReadStaffPrivate(currentRole as UserRole) ? merged : merged.map((t) => stripStaffPrivate(t) as Teacher);
  }, [teachers, systemSettings, currentRole]);

  // Statistics calculation
  const stats = useMemo(() => {
    const activeStaff = allStaff.filter(t => !t.isArchived);
    const totalCount = activeStaff.length;
    const boardCount = activeStaff.filter(t => t.category === "عضو مكتب تنفيذي / مسير").length;
    const teachersCount = activeStaff.filter(t => !t.category || t.category === "أستاذ / محفظ").length;
    const adminsCount = activeStaff.filter(t => t.category === "إداري / كاتب").length;
    const mentorsCount = activeStaff.filter(t => t.category === "مؤطر / مشرف تربوي").length;
    const cleanersCount = activeStaff.filter(t => t.category === "عامل نظافة / صيانة").length;
    const volunteersCount = activeStaff.filter(t => t.category === "متطوع").length;
    const totalPayroll = activeStaff.reduce((sum, t) => sum + (t.monthlySalary || 0), 0);

    return {
      totalCount,
      boardCount,
      teachersCount,
      adminsCount,
      mentorsCount,
      cleanersCount,
      volunteersCount,
      totalPayroll,
      archivedCount: allStaff.filter(t => t.isArchived).length
    };
  }, [allStaff]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open form for add/edit
  const handleOpenForm = (teacher?: Teacher, presetCategory?: StaffCategory) => {
    if (teacher ? !canUpdate : !canCreate) return;

    if (teacher) {
      setEditingTeacher(teacher);
      setFormCategory(teacher.category || "أستاذ / محفظ");
      setFormFullName(teacher.fullName);
      setFormRoleTitle(teacher.roleTitle || "");
      setFormCinNumber(teacher.cinNumber || "");
      setFormPhone(teacher.phone);
      setFormWhatsapp(teacher.whatsapp || "");
      setFormEmail(teacher.email || "");
      setFormEmergencyContact(teacher.emergencyContact || "");
      setFormSpecialty(teacher.specialty || "");
      setFormContractType(teacher.contractType || "مكافأة شهرية");
      setFormMonthlySalary(teacher.monthlySalary ?? 2000);
      setFormWorkSchedule(teacher.workSchedule || "");
      setFormAssignedAreas(teacher.assignedAreas || "");
      setFormDuties(teacher.duties || "");
      setFormPhoto(teacher.photo || "");
      setFormJoinedDate(teacher.joinedDate || new Date().toISOString().split("T")[0]);
      setFormBirthDate(teacher.birthDate || "");
      setFormAddress(teacher.address || "");

      // Find all classes currently assigned to this teacher
      const assigned = classes.filter(c => c.teacherId === teacher.id).map(c => c.id);
      setFormClassIds(assigned);

      setFormCoursesString((teacher.trainingCourses || []).join("، "));
    } else {
      const cat = presetCategory || "أستاذ / محفظ";
      setEditingTeacher(null);
      setFormCategory(cat);
      setFormFullName("");
      setFormRoleTitle(
        cat === "عضو مكتب تنفيذي / مسير" ? "عضو المكتب التنفيذي" :
        cat === "أستاذ / محفظ" ? "محفظ ومدرس القرآن الكريم" :
        cat === "إداري / كاتب" ? "كاتب إداري بالجمعية" :
        cat === "مؤطر / مشرف تربوي" ? "مؤطر ومشرف الأنشطة" :
        cat === "عامل نظافة / صيانة" ? "مسؤول نظافة وصيانة المقر" :
        cat === "متطوع" ? "متطوع بالأنشطة والفعاليات" : ""
      );
      setFormCinNumber("");
      setFormPhone("");
      setFormWhatsapp("");
      setFormEmail("");
      setFormEmergencyContact("");
      setFormSpecialty(
        cat === "عضو مكتب تنفيذي / مسير" ? "تسيير جمعوي وتدبير إداري" :
        cat === "أستاذ / محفظ" ? "تجويد وقراءات برواية ورش" :
        cat === "إداري / كاتب" ? "تسيير إداري وسكرتارية" :
        cat === "مؤطر / مشرف تربوي" ? "تأطير وتنشيط تربوي" :
        cat === "عامل نظافة / صيانة" ? "نظافة وصيانة المرافق" :
        cat === "متطوع" ? "مساعدة عامة وتنظيم" : ""
      );
      setFormContractType(
        cat === "عضو مكتب تنفيذي / مسير" ? "تطوعي" :
        cat === "متطوع" ? "تطوعي" :
        cat === "عامل نظافة / صيانة" ? "مكافأة شهرية" :
        cat === "إداري / كاتب" ? "عقد عمل دائم" : "مكافأة شهرية"
      );
      setFormMonthlySalary(cat === "عضو مكتب تنفيذي / مسير" ? 0 : cat === "متطوع" ? 0 : cat === "عامل نظافة / صيانة" ? 1500 : 2500);
      setFormWorkSchedule(
        cat === "عضو مكتب تنفيذي / مسير" ? "اجتماعات دورية وتتبع أنشطة الجمعية" :
        cat === "أستاذ / محفظ" ? "السبت والأحد 09:00 - 12:00" :
        cat === "عامل نظافة / صيانة" ? "يومياً صباحاً ومساءً" :
        cat === "إداري / كاتب" ? "من الإثنين إلى الجمعة 09:00 - 17:00" : "أيام الأنشطة والعطل"
      );
      setFormAssignedAreas(
        cat === "عضو مكتب تنفيذي / مسير" ? "المكتب التنفيذي واللجان الوظيفية" :
        cat === "عامل نظافة / صيانة" ? "المسجد، قاعات الدراسة، المرافق الصحية والساحة" :
        cat === "إداري / كاتب" ? "المكتب الإداري والاستقبال" : ""
      );
      setFormDuties("");
      setFormClassIds([]);
      setFormCoursesString("");
      setFormPhoto("");
      setFormJoinedDate(new Date().toISOString().split("T")[0]);
      setFormBirthDate("");
      setFormAddress("");
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formPhone) {
      toast.error("الرجاء ملء الاسم الكامل ورقم الهاتف على الأقل.");
      return;
    }

    // Split training courses string by comma or arabic comma
    const courses = formCoursesString
      .split(/[،,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const teacherToSave: Teacher = {
      id: editingTeacher ? editingTeacher.id : "t_" + Date.now(),
      fullName: formFullName,
      photo: formPhoto || editingTeacher?.photo || "",
      phone: formPhone,
      whatsapp: formWhatsapp || formPhone,
      email: formEmail,
      specialty: formSpecialty || formRoleTitle || "شؤون عامة",
      trainingCourses: courses,
      isArchived: editingTeacher ? (editingTeacher.isArchived || false) : false,
      joinedDate: formJoinedDate || (editingTeacher ? editingTeacher.joinedDate : new Date().toISOString().split("T")[0]),
      
      // Extended Staff Fields
      category: formCategory,
      roleTitle: formRoleTitle || formSpecialty,
      contractType: formContractType,
      monthlySalary: Number(formMonthlySalary) || 0,
      cinNumber: formCinNumber.trim(),
      duties: formDuties,
      assignedAreas: formAssignedAreas,
      emergencyContact: formEmergencyContact,
      workSchedule: formWorkSchedule,
      birthDate: formBirthDate,
      address: formAddress
    };

    onSaveTeacher(teacherToSave, formClassIds);
    setShowModal(false);
  };

  // Filtered teachers & staff list
  const filteredTeachers = useMemo(() => {
    return allStaff.filter(t => {
      const cat = t.category || "أستاذ / محفظ";
      
      // Category filter
      if (categoryFilter !== "all" && cat !== categoryFilter) {
        return false;
      }

      // Contract filter
      if (contractFilter !== "all" && t.contractType !== contractFilter) {
        return false;
      }

      // Archive filter
      const isTeacherArchived = t.isArchived === true;
      if (archiveFilter === "active" && isTeacherArchived) return false;
      if (archiveFilter === "archived" && !isTeacherArchived) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (t.fullName || "").toLowerCase().includes(q);
        const matchesSpecialty = (t.specialty || "").toLowerCase().includes(q);
        const matchesRole = (t.roleTitle || "").toLowerCase().includes(q);
        const matchesPhone = (t.phone || "").includes(q);
        const matchesCin = (t.cinNumber || "").toLowerCase().includes(q);
        const matchesAreas = (t.assignedAreas || "").toLowerCase().includes(q);
        const matchesDuties = (t.duties || "").toLowerCase().includes(q);

        return matchesName || matchesSpecialty || matchesRole || matchesPhone || matchesCin || matchesAreas || matchesDuties;
      }

      return true;
    });
  }, [allStaff, categoryFilter, contractFilter, archiveFilter, searchQuery]);

  const openBadgeModal = (staff: Teacher) => {
    setBadgeStaff(staff);
    setShowBadgeModal(true);
  };

  const handleStaffDelete = (staff: Teacher) => {
    if (staff.isFromSettings) {
      toast.error(`⚠️ لا يمكن حذف (${staff.roleTitle || staff.fullName}) من هنا مباشرة لأنه مربوط ديناميكياً بوثيقة الإعدادات العامة (المشرف العام / المدير التنفيذي).\n\nلتعديل اسمه أو إزالته، يرجى التوجه إلى صفحة "إعدادات الجمعية والمدرسة".`);
      return;
    }
    onDeleteTeacher(staff.id);
  };

  const handleStaffArchive = (staff: Teacher) => {
    if (staff.isFromSettings) {
      toast.error(`⚠️ هذا الحساب (${staff.roleTitle || staff.fullName}) منصب قيادي مربوط بالإعدادات العامة للجمعية.`);
      return;
    }
    onArchiveToggle(staff.id);
  };


  return {
    teachers,
    classes,
    currentRole,
    systemSettings,
    canEditTeachers,
    canCreateTeachers,
    canUpdateTeachers,
    canDeleteTeachers,
    onSaveTeacher,
    onArchiveToggle,
    onDeleteTeacher,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    contractFilter,
    setContractFilter,
    archiveFilter,
    setArchiveFilter,
    viewMode,
    setViewMode,
    showModal,
    setShowModal,
    editingTeacher,
    setEditingTeacher,
    badgeStaff,
    setBadgeStaff,
    showBadgeModal,
    setShowBadgeModal,
    showDirectoryModal,
    setShowDirectoryModal,
    formCategory,
    setFormCategory,
    formFullName,
    setFormFullName,
    formRoleTitle,
    setFormRoleTitle,
    formCinNumber,
    setFormCinNumber,
    formPhone,
    setFormPhone,
    formWhatsapp,
    setFormWhatsapp,
    formEmail,
    setFormEmail,
    formEmergencyContact,
    setFormEmergencyContact,
    formSpecialty,
    setFormSpecialty,
    formContractType,
    setFormContractType,
    formMonthlySalary,
    setFormMonthlySalary,
    formWorkSchedule,
    setFormWorkSchedule,
    formAssignedAreas,
    setFormAssignedAreas,
    formDuties,
    setFormDuties,
    formClassIds,
    setFormClassIds,
    formCoursesString,
    setFormCoursesString,
    formJoinedDate,
    setFormJoinedDate,
    formBirthDate,
    setFormBirthDate,
    formAddress,
    setFormAddress,
    formPhoto,
    setFormPhoto,
    dragActive,
    setDragActive,
    canCreate,
    canUpdate,
    canDelete,
    allStaff,
    stats,
    handlePhotoUpload,
    handleDrag,
    handleDrop,
    handleOpenForm,
    handleSubmit,
    filteredTeachers,
    openBadgeModal,
    handleStaffDelete,
    handleStaffArchive,
  };
}

export type StaffState = ReturnType<typeof useStaffState>;
