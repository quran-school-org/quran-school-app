import React, { useState, useMemo } from "react";
import { Teacher, Class, SystemSettings, StaffCategory, ContractType } from "../types";
import {
  UserPlus, Edit2, Archive, Mail, Phone, Plus, Trash2, BookOpen, Award, Search, Check, X,
  Briefcase, Calendar, MessageCircle, AlertCircle, RefreshCw, Printer, Shield, Sparkles,
  UserCheck, Users, Clock, DollarSign, MapPin, FileText, Download, Filter, LayoutGrid, List,
  HeartHandshake, Brush, Building, ChevronRight, Eye
} from "lucide-react";

interface TeacherManagementProps {
  teachers: Teacher[];
  classes: Class[];
  currentRole: string;
  systemSettings?: SystemSettings | null;
  canEditTeachers?: boolean;
  canCreateTeachers?: boolean;
  canUpdateTeachers?: boolean;
  canDeleteTeachers?: boolean;
  onSaveTeacher: (teacher: Teacher, assignedClassIds?: string[]) => void;
  onArchiveToggle: (teacherId: string) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

// Category Configuration & Colors
export const STAFF_CATEGORIES_CONFIG: Record<StaffCategory, { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }> = {
  "عضو مكتب تنفيذي / مسير": {
    label: "أعضاء المكتب والمسيرون",
    icon: "🏛️",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-700 text-white"
  },
  "أستاذ / محفظ": {
    label: "أساتذة ومحفظين",
    icon: "👨‍🏫",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-700 text-white"
  },
  "مؤطر / مشرف تربوي": {
    label: "مؤطرون ومشرفون",
    icon: "🌟",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    badgeBg: "bg-blue-700 text-white"
  },
  "إداري / كاتب": {
    label: "إداريون وكتاب",
    icon: "📋",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    badgeBg: "bg-purple-700 text-white"
  },
  "عامل نظافة / صيانة": {
    label: "عمال نظافة وصيانة",
    icon: "🧹",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    badgeBg: "bg-teal-700 text-white"
  },
  "متطوع": {
    label: "متطوعون",
    icon: "🤝",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    badgeBg: "bg-amber-700 text-white"
  },
  "أخرى": {
    label: "أخرى",
    icon: "👤",
    bg: "bg-slate-50",
    text: "text-slate-800",
    border: "border-slate-200",
    badgeBg: "bg-slate-700 text-white"
  }
};

export default function TeacherManagement({
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
}: TeacherManagementProps) {
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
        phone: existingSupervisor?.phone || systemSettings?.associationPhone || "06.74.633.108",
        whatsapp: existingSupervisor?.whatsapp || systemSettings?.associationPhone || "06.74.633.108",
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
        phone: existingDirector?.phone || systemSettings?.associationPhone || "06.74.633.108",
        whatsapp: existingDirector?.whatsapp || systemSettings?.associationPhone || "06.74.633.108",
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

    return [...dynamicItems, ...regularStaff];
  }, [teachers, systemSettings]);

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
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت.");
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
        alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت.");
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
      alert("الرجاء ملء الاسم الكامل ورقم الهاتف على الأقل.");
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
      alert(`⚠️ لا يمكن حذف (${staff.roleTitle || staff.fullName}) من هنا مباشرة لأنه مربوط ديناميكياً بوثيقة الإعدادات العامة (المشرف العام / المدير التنفيذي).\n\nلتعديل اسمه أو إزالته، يرجى التوجه إلى صفحة "إعدادات الجمعية والمدرسة".`);
      return;
    }
    onDeleteTeacher(staff.id);
  };

  const handleStaffArchive = (staff: Teacher) => {
    if (staff.isFromSettings) {
      alert(`⚠️ هذا الحساب (${staff.roleTitle || staff.fullName}) منصب قيادي مربوط بالإعدادات العامة للجمعية.`);
      return;
    }
    onArchiveToggle(staff.id);
  };

  return (
    <div data-screen="teachers" className="space-y-6" dir="rtl">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              إدارة شؤون العاملين والمدرسين
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل شامل لتسيير المحفظين، الأطر الإدارية، المشرفين والمؤطرين، عمال النظافة والصيانة، والمتطوعين مع بطاقات العمل.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDirectoryModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="طباعة الدليل الكامل للعاملين"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة لائحة الطاقم</span>
          </button>

          {canCreate && (
            <button
              data-action="open-staff-form"
              onClick={() => handleOpenForm(undefined, categoryFilter !== "all" ? (categoryFilter as StaffCategory) : undefined)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة كادر / عامل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Total Active Staff */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold text-slate-600">إجمالي الطاقم</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800">{stats.totalCount}</div>
          <p className="text-[10px] text-emerald-600 font-semibold">طاقم نشط ومسجل</p>
        </div>

        {/* Executive Board */}
        <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-indigo-700">
            <span className="text-[11px] font-bold">أعضاء المكتب</span>
            <span className="text-sm">🏛️</span>
          </div>
          <div className="text-xl font-extrabold text-indigo-800">{stats.boardCount}</div>
          <p className="text-[10px] text-indigo-700 font-medium">مسيرون وأعضاء</p>
        </div>

        {/* Teachers */}
        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-[11px] font-bold">محفظون وأساتذة</span>
            <span className="text-sm">👨‍🏫</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-800">{stats.teachersCount}</div>
          <p className="text-[10px] text-emerald-700 font-medium">مشرفين على الحلقات</p>
        </div>

        {/* Admins */}
        <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-purple-700">
            <span className="text-[11px] font-bold">إداريون وكتاب</span>
            <span className="text-sm">📋</span>
          </div>
          <div className="text-xl font-extrabold text-purple-800">{stats.adminsCount}</div>
          <p className="text-[10px] text-purple-700 font-medium">شؤون الإدارة والكتابة</p>
        </div>

        {/* Mentors */}
        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-[11px] font-bold">مؤطرون ومشرفون</span>
            <span className="text-sm">🌟</span>
          </div>
          <div className="text-xl font-extrabold text-blue-800">{stats.mentorsCount}</div>
          <p className="text-[10px] text-blue-700 font-medium">الأنشطة والتربية</p>
        </div>

        {/* Cleaners & Maintenance */}
        <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-teal-700">
            <span className="text-[11px] font-bold">نظافة وصيانة</span>
            <span className="text-sm">🧹</span>
          </div>
          <div className="text-xl font-extrabold text-teal-800">{stats.cleanersCount}</div>
          <p className="text-[10px] text-teal-700 font-medium">مرافق المقر والمسجد</p>
        </div>

        {/* Volunteers */}
        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-[11px] font-bold">متطوعون</span>
            <span className="text-sm">🤝</span>
          </div>
          <div className="text-xl font-extrabold text-amber-800">{stats.volunteersCount}</div>
          <p className="text-[10px] text-amber-700 font-medium">مساهمات تطوعية</p>
        </div>
      </div>

      {/* Categories Tabs Selector */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            categoryFilter === "all"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>الكل ({allStaff.filter(t => archiveFilter === "archived" ? t.isArchived : !t.isArchived).length})</span>
        </button>

        {(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => {
          const cfg = STAFF_CATEGORIES_CONFIG[cat];
          const count = allStaff.filter(t => (t.category || "أستاذ / محفظ") === cat && (archiveFilter === "archived" ? t.isArchived : !t.isArchived)).length;
          const isSelected = categoryFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? `${cfg.badgeBg} shadow-xs`
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar, Search, and Status Buttons */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="البحث بالاسم، المسمى، الهاتف، CIN أو المهام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          {/* Contract Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">جميع أنواع التعاقد</option>
              <option value="عقد عمل دائم">عقد عمل دائم</option>
              <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
              <option value="مكافأة شهرية">مكافأة شهرية</option>
              <option value="تطوعي">تطوعي</option>
              <option value="منحة تدريب">منحة تدريب</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title="عرض كجدول"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Status Tab Filters */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setArchiveFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "active" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              النشطون ({allStaff.filter(t => !t.isArchived).length})
            </button>
            <button
              onClick={() => setArchiveFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "archived" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الأرشيف ({allStaff.filter(t => t.isArchived).length})
            </button>
            <button
              onClick={() => setArchiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "all" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الكل ({allStaff.length})
            </button>
          </div>
        </div>
      </div>

      {/* Staff Grid or Table View */}
      {filteredTeachers.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((staff) => {
              const cat = staff.category || "أستاذ / محفظ";
              const catCfg = STAFF_CATEGORIES_CONFIG[cat] || STAFF_CATEGORIES_CONFIG["أستاذ / محفظ"];
              const assignedClasses = classes.filter(c => c.teacherId === staff.id);

              return (
                <div
                  key={staff.id}
                  className={`bg-white rounded-2xl shadow-xs border ${
                    staff.isArchived 
                      ? "border-amber-200 bg-amber-50/10" 
                      : "border-slate-200 hover:border-slate-300"
                  } p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200`}
                >
                  {/* Category Tag Header */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}>
                      <span>{catCfg.icon}</span>
                      <span>{staff.category || "أستاذ / محفظ"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {staff.isFromSettings && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs" title="مربوط ديناميكياً من وثيقة الإعدادات العامة">
                          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>مربوط بالإعدادات</span>
                        </span>
                      )}

                      {staff.contractType && !staff.isFromSettings && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {staff.contractType}
                        </span>
                      )}

                      {staff.isArchived && (
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          مؤرشف
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Top Block with Photo & Name */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{catCfg.icon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate" title={staff.fullName}>
                          {staff.fullName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
                          {staff.roleTitle || staff.specialty}
                        </p>
                        {staff.cinNumber && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            CIN: <span className="font-bold text-slate-600">{staff.cinNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info & Direct Actions */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>الهاتف:</span>
                        </span>
                        <a
                          href={`tel:${staff.phone}`}
                          className="font-mono font-bold text-slate-800 hover:text-emerald-700 hover:underline"
                        >
                          {staff.phone}
                        </a>
                      </div>

                      {staff.whatsapp && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>الواتساب:</span>
                          </span>
                          <a
                            href={`https://wa.me/${staff.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <span>{staff.whatsapp}</span>
                          </a>
                        </div>
                      )}

                      {staff.email && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>البريد:</span>
                          </span>
                          <a
                            href={`mailto:${staff.email}`}
                            className="font-mono truncate max-w-[140px] text-slate-700 hover:underline"
                            title={staff.email}
                          >
                            {staff.email}
                          </a>
                        </div>
                      )}

                      {staff.workSchedule && (
                        <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>أوقات العمل:</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[160px]" title={staff.workSchedule}>
                            {staff.workSchedule}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Classes (Teachers) or Assigned Areas (Cleaners / Staff) */}
                    {cat === "أستاذ / محفظ" ? (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">الفصول والحلقات المسندة:</span>
                        {assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.map(c => (
                              <span key={c.id} className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-bold border border-emerald-100">
                                🏫 {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-600 italic text-[11px] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/20 inline-block">
                            ⚠️ لا توجد حلقة مسندة حالياً
                          </span>
                        )}
                      </div>
                    ) : staff.assignedAreas ? (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">المرافق والمهام المكلف بها:</span>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-700 font-medium">
                          📍 {staff.assignedAreas}
                        </div>
                      </div>
                    ) : null}

                    {/* Duties Summary if present */}
                    {staff.duties && (
                      <div className="space-y-1 text-xs">
                        <span className="block font-bold text-slate-500">المهام والمسؤوليات:</span>
                        <p className="text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed">
                          {staff.duties}
                        </p>
                      </div>
                    )}

                    {/* Monthly Salary / Stipend Tag */}
                    {(staff.monthlySalary !== undefined && staff.monthlySalary > 0) && (
                      <div className="flex items-center justify-between text-xs bg-emerald-50/40 p-2 rounded-lg border border-emerald-100/60">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          المكافأة / الراتب الشهري:
                        </span>
                        <span className="font-bold text-emerald-800 font-mono">
                          {staff.monthlySalary.toLocaleString()} د.م
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="border-t pt-3 mt-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {/* Print Badge Button */}
                      <button
                        onClick={() => openBadgeModal(staff)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-slate-200"
                        title="طباعة بطاقة العمل أو شارة الصدر"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>شارة العمل</span>
                      </button>

                      {canUpdate && (
                        <button
                          onClick={() => handleOpenForm(staff)}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-emerald-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canUpdate && (
                        <button
                          onClick={() => handleStaffArchive(staff)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 border ${
                            staff.isArchived
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          <Archive className="w-3 h-3" />
                          <span>{staff.isArchived ? "إلغاء الأرشفة" : "أرشفة"}</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleStaffDelete(staff)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition border border-transparent hover:border-rose-200"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Roster View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">الكادر / العامل</th>
                  <th className="p-3.5">الفئة والمسمى الوظيفي</th>
                  <th className="p-3.5">معلومات الاتصال</th>
                  <th className="p-3.5">نوع التعاقد</th>
                  <th className="p-3.5">المكافأة الشهرية</th>
                  <th className="p-3.5">المهام / الفصول</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((staff) => {
                  const cat = staff.category || "أستاذ / محفظ";
                  const catCfg = STAFF_CATEGORIES_CONFIG[cat] || STAFF_CATEGORIES_CONFIG["أستاذ / محفظ"];
                  const assignedClasses = classes.filter(c => c.teacherId === staff.id);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                            {staff.photo ? (
                              <img src={staff.photo} alt={staff.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{catCfg.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{staff.fullName}</span>
                              {staff.isFromSettings && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded" title="مربوط تلقائياً من الإعدادات">
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>إعدادات</span>
                                </span>
                              )}
                            </div>
                            {staff.cinNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">CIN: {staff.cinNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${catCfg.bg} ${catCfg.text}`}>
                            {catCfg.icon} {staff.category || "أستاذ / محفظ"}
                          </span>
                          <div className="text-xs text-slate-700 font-semibold">{staff.roleTitle || staff.specialty}</div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="text-slate-700">{staff.phone}</div>
                          {staff.email && <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{staff.email}</div>}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {staff.contractType || "مكافأة شهرية"}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-emerald-800 font-mono">
                        {staff.monthlySalary ? `${staff.monthlySalary.toLocaleString()} د.م` : "-"}
                      </td>

                      <td className="p-3.5">
                        {cat === "أستاذ / محفظ" ? (
                          assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedClasses.map(c => (
                                <span key={c.id} className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">غير مسند</span>
                          )
                        ) : (
                          <span className="text-slate-600 text-[11px] truncate block max-w-[150px]" title={staff.assignedAreas || staff.duties}>
                            {staff.assignedAreas || staff.duties || "-"}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openBadgeModal(staff)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                            title="شارة العمل"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenForm(staff)}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleStaffDelete(staff)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
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
        )
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">لا يوجد عاملون أو أطر مطابقون للبحث أو الفلتر المختار</h4>
          <p className="text-xs text-slate-400">تأكد من كتابة الاسم أو التخصص بشكل صحيح أو قم بتبديل الفئات أعلاه.</p>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col" dir="rtl">
            {/* Modal Header */}
            <div className="p-5 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base">
                    {editingTeacher ? "📝 تعديل ملف الكادر / العامل" : "👤 تسجيل كادر أو عامل جديد"}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    أدخل المعلومات الإدارية والمهنية وتفاصيل التعاقد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
              {/* Dynamic settings notice if staff is from settings */}
              {editingTeacher?.isFromSettings && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 text-indigo-900">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">منصب قيادي مربوط تلقائياً من وثيقة الإعدادات</p>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      هذا المنصب ({editingTeacher.roleTitle}) يتم استيراد اسمه وصلاحياته مباشرة من صفحة <strong>إعدادات الجمعية والمدرسة</strong>. يمكنك هنا استكمال وتعديل رقم الهاتف، بطاقة التعريف، الصورة، وباقي البيانات الإدارية.
                    </p>
                  </div>
                </div>
              )}

              {/* Category Selector Tabs inside modal */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  فئة الكادر / نوع الوظيفة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => {
                    const cfg = STAFF_CATEGORIES_CONFIG[cat];
                    const isSel = formCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setFormCategory(cat);
                          if (!editingTeacher) {
                            if (cat === "أستاذ / محفظ") {
                              setFormRoleTitle("محفظ ومدرس القرآن الكريم");
                              setFormSpecialty("تجويد وقراءات برواية ورش");
                              setFormMonthlySalary(2500);
                            } else if (cat === "إداري / كاتب") {
                              setFormRoleTitle("كاتب إداري وسكرتارية");
                              setFormSpecialty("تسيير إداري ومعلوميات");
                              setFormMonthlySalary(3000);
                            } else if (cat === "مؤطر / مشرف تربوي") {
                              setFormRoleTitle("مؤطر الأنشطة والمخيمات");
                              setFormSpecialty("تأطير وتنشيط تربوي");
                              setFormMonthlySalary(2000);
                            } else if (cat === "عامل نظافة / صيانة") {
                              setFormRoleTitle("مسؤول نظافة وصيانة المقر");
                              setFormSpecialty("نظافة وصيانة المرافق");
                              setFormAssignedAreas("المسجد، قاعات التحفيظ، المرافق الصحية");
                              setFormMonthlySalary(1500);
                            } else if (cat === "متطوع") {
                              setFormRoleTitle("متطوع باللجنة الثقافية والتنظيمية");
                              setFormSpecialty("مساعدة عامة وتنظيم");
                              setFormContractType("تطوعي");
                              setFormMonthlySalary(0);
                            }
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                          isSel
                            ? `${cfg.bg} ${cfg.border} border-2 shadow-2xs font-bold ${cfg.text}`
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-base">{cfg.icon}</span>
                        <span className="text-xs">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="block font-bold text-slate-700">الصورة الشخصية للكادر / العامل:</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-full border-2 border-emerald-600 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center shadow-inner">
                    {formPhoto ? (
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[formCategory]?.icon || "👤"}</span>
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

                  <div className="flex-1 w-full space-y-2">
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                        dragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-white"
                      }`}
                    >
                      <input
                        type="file"
                        id="staff-photo-upload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label htmlFor="staff-photo-upload" className="cursor-pointer block">
                        <p className="font-bold text-slate-700 text-xs">اسحب صورة هنا أو انقر لاختيارها</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (الحد الأقصى 2 ميغابايت)</p>
                      </label>
                    </div>

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

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">
                      الاسم الكامل <span className="text-rose-500">*</span>
                    </label>
                    {editingTeacher?.isFromSettings && (
                      <span className="text-[10px] text-indigo-700 font-medium">مستورد من الإعدادات</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="مثال: عبد الرحيم السملالي"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Role Title */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    المسمى الوظيفي / الصفة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="مثال: محفظ حلقة النور / كاتب الجمعية / مسؤول النظافة..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* CIN */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    رقم البطاقة الوطنية للتعريف (CIN)
                  </label>
                  <input
                    type="text"
                    value={formCinNumber}
                    onChange={(e) => setFormCinNumber(e.target.value.toUpperCase())}
                    placeholder="مثال: AB123456"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                {/* Specialty / Skills */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    التخصص أو المهارات
                  </label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="مثال: قراءات ورش / إدارة وسكرتارية / صيانة عامة..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    رقم الهاتف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0612345678"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="0612345678"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@alfajr.org"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">هاتف الطوارئ / قريب</label>
                  <input
                    type="tel"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    placeholder="0698765432"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Contract Type */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">نوع التعاقد أو التطوع</label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value as ContractType)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800"
                  >
                    <option value="مكافأة شهرية">مكافأة شهرية</option>
                    <option value="عقد عمل دائم">عقد عمل دائم</option>
                    <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
                    <option value="تطوعي">تطوعي (بدون أجر)</option>
                    <option value="منحة تدريب">منحة تدريب</option>
                  </select>
                </div>

                {/* Monthly Salary / Stipend */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الراتب أو المكافأة الشهرية (د.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMonthlySalary}
                    onChange={(e) => setFormMonthlySalary(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 font-mono"
                  />
                </div>

                {/* Work Schedule */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">أوقات وساعات العمل</label>
                  <input
                    type="text"
                    value={formWorkSchedule}
                    onChange={(e) => setFormWorkSchedule(e.target.value)}
                    placeholder="مثال: السبت والأحد 08:30 - 12:30 أو يومياً 16:00 - 19:00"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Joining Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تاريخ الالتحاق بالجمعية</label>
                  <input
                    type="date"
                    value={formJoinedDate}
                    onChange={(e) => setFormJoinedDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Assigned Areas (Facility staff, Admins, etc.) */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  المرافق أو الأماكن أو اللجان المكلف بها
                </label>
                <input
                  type="text"
                  value={formAssignedAreas}
                  onChange={(e) => setFormAssignedAreas(e.target.value)}
                  placeholder="مثال: مسجد الجمعية، قاعات التحفيظ بالطابق الأول، الإدارة والاستقبال..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Assigned Classes (Only for Teachers / Mentors) */}
              {(formCategory === "أستاذ / محفظ" || formCategory === "مؤطر / مشرف تربوي") && (
                <div className="space-y-2 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                  <label className="block font-bold text-emerald-900 text-xs">
                    🏫 الفصول والحلقات الدراسية المسندة:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {classes.map(c => {
                      const isChecked = formClassIds.includes(c.id);
                      const isAssignedToOther = c.teacherId && c.teacherId !== editingTeacher?.id;
                      return (
                        <label key={c.id} className="flex items-start gap-2 p-2 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition bg-white/70">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormClassIds([...formClassIds, c.id]);
                              } else {
                                setFormClassIds(formClassIds.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                          />
                          <div className="text-right">
                            <p className="font-bold text-slate-700 text-xs">{c.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{c.schedule}</p>
                            {isAssignedToOther && (
                              <span className="inline-block text-[8px] bg-amber-50 text-amber-700 px-1 rounded mt-0.5">
                                مسند لمعلم آخر
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duties & Responsibilities */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  المهام والمسؤوليات الموكلة إليه بالتفصيل
                </label>
                <textarea
                  value={formDuties}
                  onChange={(e) => setFormDuties(e.target.value)}
                  placeholder="مثال: تنظيف وتعقيم قاعات التحفيظ يومياً، تجهيز المصاحف والسبورات، مراقبة التجهيزات الصوتية..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs h-20 resize-none"
                />
              </div>

              {/* Training Courses & Certifications */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  سجل الشواهد والدورات التدريبية (افصل بينها بفاصلة)
                </label>
                <textarea
                  value={formCoursesString}
                  onChange={(e) => setFormCoursesString(e.target.value)}
                  placeholder="مثال: الإجازة في التجويد، دورة الإسعافات الأولية، شهادة في التدبير الإداري..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs h-16 resize-none"
                />
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition text-xs shadow-md"
                >
                  {editingTeacher ? "حفظ التغييرات" : "تسجيل الكادر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT STAFF BADGE / ID CARD MODAL */}
      {showBadgeModal && badgeStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-6 flex flex-col" dir="rtl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">معاينة بطاقة العمل والشارة المهنية</span>
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-slate-100">
              {/* Badge Container (Printable Area) */}
              <div id="staff-badge-print-area" className="w-[320px] bg-white rounded-2xl shadow-lg border-2 border-emerald-800 overflow-hidden text-right font-sans relative">
                {/* Badge Top Header */}
                <div className="bg-emerald-800 text-white p-3.5 text-center relative">
                  <div className="text-[10px] font-medium opacity-90">{systemSettings?.associationName || ""}</div>
                  <div className="text-xs font-black tracking-wide mt-0.5">بطاقة التعريف المهنية والشارة</div>
                  <div className="text-[9px] opacity-75 mt-0.5">الموسم: {systemSettings?.activeAcademicSeason || ""}</div>
                </div>

                {/* Badge Body */}
                <div className="p-4 space-y-3">
                  {/* Photo & Role */}
                  <div className="flex items-center gap-3">
                    <div className="w-18 h-18 rounded-xl overflow-hidden border-2 border-emerald-700 bg-slate-50 shrink-0 flex items-center justify-center shadow-xs">
                      {badgeStaff.photo ? (
                        <img src={badgeStaff.photo} alt={badgeStaff.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[badgeStaff.category || "أستاذ / محفظ"]?.icon || "👤"}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm">{badgeStaff.fullName}</div>
                      <div className="text-xs font-bold text-emerald-800 mt-0.5">{badgeStaff.roleTitle || badgeStaff.specialty}</div>
                      <span className="inline-block text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded mt-1">
                        {badgeStaff.category || "أستاذ / محفظ"}
                      </span>
                    </div>
                  </div>

                  {/* Badge Details Grid */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1.5 font-mono">
                    {badgeStaff.cinNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">رقم البطاقة (CIN):</span>
                        <span className="font-bold text-slate-900">{badgeStaff.cinNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">رقم الهاتف:</span>
                      <span className="font-bold text-slate-900">{badgeStaff.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">نوع التعاقد:</span>
                      <span className="font-bold text-slate-900 font-sans">{badgeStaff.contractType || "مكافأة شهرية"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">تاريخ الالتحاق:</span>
                      <span className="font-bold text-slate-900">{badgeStaff.joinedDate}</span>
                    </div>
                  </div>

                  {/* QR Code & Signature Seal */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <div className="text-[9px] text-slate-400 space-y-0.5">
                      <p className="font-bold text-slate-700 font-sans">ختم وتوقيع الإدارة</p>
                      <p className="font-sans text-[8px]">صالحة للموسم الحالي</p>
                    </div>

                    <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`STAFF:${badgeStaff.id}:${badgeStaff.fullName}:${badgeStaff.category || "Staff"}`)}`}
                        alt="QR Code"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Badge Bottom Stripe */}
                <div className="bg-slate-900 text-white text-[8px] py-1 text-center font-mono">
                  ID: {badgeStaff.id} • {systemSettings?.associationPhone || "06.74.633.108"}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-between gap-3">
              <button
                onClick={() => setShowBadgeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الشارة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT OFFICIAL STAFF DIRECTORY ROSTER MODAL */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col" dir="rtl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">لائحة الطاقم الإداري والتربوي والعاملين بالجمعية</span>
              </div>
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Official Document Header */}
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <div className="text-xs text-slate-500">{systemSettings?.associationName || ""}</div>
                <h3 className="text-lg font-black text-slate-900">سجل وحصر شؤون العاملين والأطر</h3>
                <p className="text-xs text-slate-500">الموسم الدراسي: {systemSettings?.activeAcademicSeason || ""}</p>
              </div>

              {/* Table */}
              <table className="w-full text-right text-xs border border-slate-200">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                  <tr>
                    <th className="p-2 border-l border-slate-200">#</th>
                    <th className="p-2 border-l border-slate-200">الاسم الكامل</th>
                    <th className="p-2 border-l border-slate-200">الفئة</th>
                    <th className="p-2 border-l border-slate-200">المسمى والمهام</th>
                    <th className="p-2 border-l border-slate-200">CIN</th>
                    <th className="p-2 border-l border-slate-200">الهاتف</th>
                    <th className="p-2 border-l border-slate-200">نوع العقد</th>
                    <th className="p-2">المكافأة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allStaff.filter(t => !t.isArchived).map((staff, idx) => (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-center border-l border-slate-200">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-900 border-l border-slate-200">{staff.fullName}</td>
                      <td className="p-2 border-l border-slate-200">{staff.category || "أستاذ / محفظ"}</td>
                      <td className="p-2 border-l border-slate-200">{staff.roleTitle || staff.specialty}</td>
                      <td className="p-2 font-mono border-l border-slate-200">{staff.cinNumber || "-"}</td>
                      <td className="p-2 font-mono border-l border-slate-200">{staff.phone}</td>
                      <td className="p-2 border-l border-slate-200">{staff.contractType || "مكافأة شهرية"}</td>
                      <td className="p-2 font-mono font-bold text-emerald-800">
                        {staff.monthlySalary ? `${staff.monthlySalary} د.م` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">توقيع الكاتب العام</p>
                  <p className="text-[10px] text-slate-400 mt-8">{systemSettings?.secretaryGeneralName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">أمين المال</p>
                  <p className="text-[10px] text-slate-400 mt-8">{systemSettings?.treasurerName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">رئيس الجمعية</p>
                  <p className="text-[10px] text-slate-400 mt-8">{systemSettings?.presidentName || "........................"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوثيقة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
