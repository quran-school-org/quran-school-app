import React, { useState, useMemo } from "react";
import { 
  ActivityTrip, ActivityParticipant, ActivityExpense, 
  Student, Teacher, Class, SystemSettings, ActivityType, ActivityStatus,
  ParticipantType, ParticipantPaymentStatus, ActivityExpenseCategory
} from "../types";
import { 
  Compass, MapPin, Calendar, Users, DollarSign, Plus, Edit3, Trash2, 
  Printer, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  ArrowRight, Search, FileText, Check, X, ShieldAlert,
  Download, RefreshCw, Send, CheckCircle, Info,
  ArrowUpDown, ArrowUp, ArrowDown, Filter
} from "lucide-react";

interface ActivitiesManagementProps {
  activities: ActivityTrip[];
  participants: ActivityParticipant[];
  activityExpenses: ActivityExpense[];
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  systemSettings: SystemSettings | null;
  canManageActivities?: boolean;
  canCreateActivity?: boolean;
  canUpdateActivity?: boolean;
  canDeleteActivity?: boolean;
  canPrintActivity?: boolean;
  onSaveActivity: (activity: ActivityTrip) => void;
  onDeleteActivity: (id: string) => void;
  onSaveParticipant: (participant: ActivityParticipant) => void;
  onDeleteParticipant: (id: string) => void;
  onSaveActivityExpense: (expense: ActivityExpense) => void;
  onDeleteActivityExpense: (id: string) => void;
  onSyncToFinance: (activity: ActivityTrip, netBalance: number, totalContributions: number, totalExpenses: number) => void;
  onNavigateToFinance?: () => void;
}

const ACTIVITY_TYPES: ActivityType[] = [
  "رحلة استكشافية",
  "مخيم قرآني صيفي/ربيعي",
  "نشاط تربوي وثقافي",
  "دوري رياضي",
  "حفل تكريم ومهرجان",
  "زيارة ميدانية ومعرض",
  "أخرى"
];

const ACTIVITY_STATUSES: ActivityStatus[] = [
  "مخطط له",
  "قيد التسجيل",
  "قيد التنفيذ",
  "مكتمل",
  "ملغى"
];

const EXPENSE_CATEGORIES: ActivityExpenseCategory[] = [
  "كراء حافلة وتنقل",
  "كراء فضاء أو مزرعة أو مسبح",
  "تغذية ومأكولات ومشروبات",
  "جوائز وشواهد وميداليات",
  "تأمين ورسوم دخول مزارات",
  "عتاد ولوازم تنشيط وورشات",
  "ضيافة وتنقل المؤطرين",
  "أخرى"
];

const TARGET_AUDIENCE_PRESETS = [
  "الجميع (طلاب، أطر، أولياء أمور)",
  "الطلاب فقط",
  "الطالبات فقط",
  "الطلاب والعاملين",
  "الكوادر والمدرسين فقط",
  "أولياء الأمور",
  "أمهات الطالبات",
  "أطفال التعليم الأولي",
  "عام"
];

export default function ActivitiesManagement({
  activities,
  participants,
  activityExpenses,
  students,
  teachers,
  classes,
  systemSettings,
  canManageActivities = true,
  canCreateActivity = true,
  canUpdateActivity = true,
  canDeleteActivity = true,
  canPrintActivity = true,
  onSaveActivity,
  onDeleteActivity,
  onSaveParticipant,
  onDeleteParticipant,
  onSaveActivityExpense,
  onDeleteActivityExpense,
  onSyncToFinance,
  onNavigateToFinance
}: ActivitiesManagementProps) {
  // Selected Activity for Detail View / Modal
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "expenses" | "finance">("overview");

  // Filter & Sort States for Activities List
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activitySortKey, setActivitySortKey] = useState<string>("startDate");
  const [activitySortDir, setActivitySortDir] = useState<"asc" | "desc">("desc");

  // Filter & Sort States for Participants
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partTypeFilter, setPartTypeFilter] = useState<string>("all");
  const [partStatusFilter, setPartStatusFilter] = useState<string>("all");
  const [partSortKey, setPartSortKey] = useState<string | null>("participantType");
  const [partSortDir, setPartSortDir] = useState<"asc" | "desc">("asc");

  // Filter & Sort States for Expenses
  const [expSearchQuery, setExpSearchQuery] = useState("");
  const [expCategoryFilter, setExpCategoryFilter] = useState<string>("all");
  const [expSortKey, setExpSortKey] = useState<string | null>("date");
  const [expSortDir, setExpSortDir] = useState<"asc" | "desc">("desc");

  // Sorting Toggle Handler
  const handleToggleSort = (
    key: string,
    currentKey: string | null,
    currentDir: "asc" | "desc",
    setKey: (k: string | null) => void,
    setDir: (d: "asc" | "desc") => void
  ) => {
    if (currentKey === key) {
      if (currentDir === "asc") {
        setDir("desc");
      } else {
        setKey(null);
        setDir("asc");
      }
    } else {
      setKey(key);
      setDir("asc");
    }
  };

  // Sortable Header Component Helper
  const renderSortableHeader = (
    label: string,
    key: string,
    currentKey: string | null,
    currentDir: "asc" | "desc",
    onSort: (key: string) => void,
    align: "right" | "center" = "right"
  ) => {
    const isActive = currentKey === key;
    return (
      <th
        onClick={() => onSort(key)}
        className={`p-3 cursor-pointer select-none hover:bg-slate-200/80 transition rounded-lg ${
          align === "center" ? "text-center" : "text-right"
        }`}
        title={`ترتيب حسب ${label} (انقر للتبديل بين التصاعدي والتنازلي)`}
      >
        <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : "justify-start"}`}>
          <span>{label}</span>
          {isActive ? (
            currentDir === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-800 font-bold shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-800 font-bold shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Activity Modal State (Create / Edit)
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityTrip | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<ActivityType>("رحلة استكشافية");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formLeaderIds, setFormLeaderIds] = useState<string[]>([]);
  const [formContributionFee, setFormContributionFee] = useState<number>(100);
  const [formMaxCapacity, setFormMaxCapacity] = useState<number>(45);
  const [formStatus, setFormStatus] = useState<ActivityStatus>("قيد التسجيل");
  const [formTargetAudience, setFormTargetAudience] = useState<string>("الجميع (طلاب، أطر، أولياء أمور)");
  const [formDescription, setFormDescription] = useState("");
  const [formProgramDetails, setFormProgramDetails] = useState("");
  const [formMeetingPoint, setFormMeetingPoint] = useState("");

  // Participant Form State
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ActivityParticipant | null>(null);
  const [partSourceType, setPartSourceType] = useState<"student" | "staff" | "custom">("student");
  const [selectedStudentRefId, setSelectedStudentRefId] = useState("");
  const [selectedStaffRefId, setSelectedStaffRefId] = useState("");
  const [partFullName, setPartFullName] = useState("");
  const [partCustomRole, setPartCustomRole] = useState("مشارك خارجي");
  const [partPhone, setPartPhone] = useState("");
  const [partGender, setPartGender] = useState<"ذكر" | "أنثى">("ذكر");
  const [partFee, setPartFee] = useState<number>(100);
  const [partPaidAmount, setPartPaidAmount] = useState<number>(100);
  const [partPaymentStatus, setPartPaymentStatus] = useState<ParticipantPaymentStatus>("مدفوع");
  const [partPaymentMethod, setPartPaymentMethod] = useState<"نقداً" | "تحويل بنكي" | "شيك" | "أخرى">("نقداً");
  const [partReceiptNo, setPartReceiptNo] = useState("");
  const [partHasParentApproval, setPartHasParentApproval] = useState(true);
  const [partMedicalNotes, setPartMedicalNotes] = useState("");
  const [partNotes, setPartNotes] = useState("");

  // Expense Form State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ActivityExpense | null>(null);
  const [expTitle, setExpTitle] = useState("");
  const [expCategory, setExpCategory] = useState<ActivityExpenseCategory>("كراء حافلة وتنقل");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState<"نقداً" | "تحويل بنكي" | "شيك">("نقداً");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expReceiptNo, setExpReceiptNo] = useState("");
  const [expSupplier, setExpSupplier] = useState("");
  const [expNotes, setExpNotes] = useState("");

  // Print Modals
  const [printType, setPrintType] = useState<"participants-list" | "financial-report" | "parent-consent" | "participant-ticket" | null>(null);
  const [selectedParticipantForTicket, setSelectedParticipantForTicket] = useState<ActivityParticipant | null>(null);

  // Dynamic staff list merged with settings (المشرف العام والمدير التنفيذي وباقي العاملين والمدرسين)
  const allStaff = useMemo<Teacher[]>(() => {
    const list = [...teachers];

    const supervisorName = systemSettings?.generalSupervisorName?.trim();
    if (supervisorName && !list.some(t => t.id === "settings_supervisor" || (t.roleTitle?.includes("المشرف العام") && t.fullName === supervisorName))) {
      list.unshift({
        id: "settings_supervisor",
        fullName: supervisorName,
        photo: "",
        phone: systemSettings?.associationPhone || "06.74.633.108",
        whatsapp: systemSettings?.associationPhone || "06.74.633.108",
        specialty: "إشراف عام وتسيير جمعوي وتربوي",
        category: "إداري / كاتب",
        roleTitle: "المشرف العام للجمعية والنادي",
        contractType: "تطوعي",
        monthlySalary: 0,
        isArchived: false,
        joinedDate: systemSettings?.foundingDate || "2024-01-01"
      });
    }

    const directorName = systemSettings?.directorName?.trim();
    if (directorName && !list.some(t => t.id === "settings_director" || (t.roleTitle?.includes("المدير التنفيذي") && t.fullName === directorName))) {
      list.unshift({
        id: "settings_director",
        fullName: directorName,
        photo: "",
        phone: systemSettings?.associationPhone || "06.74.633.108",
        whatsapp: systemSettings?.associationPhone || "06.74.633.108",
        specialty: "إدارة تربوية وتدبير تنفيذي",
        category: "إداري / كاتب",
        roleTitle: "مدير المدرسة المسؤول (المدير التنفيذي)",
        contractType: "عقد عمل دائم",
        monthlySalary: 3500,
        isArchived: false,
        joinedDate: systemSettings?.foundingDate || "2024-01-01"
      });
    }

    return list;
  }, [teachers, systemSettings]);

  // Helper to extract the exact Job Title / Role (المسمى الوظيفي / الصفة) from Staff & Teachers Management
  const getParticipantRole = (part: ActivityParticipant | null | undefined): string => {
    if (!part) return "";
    if (part.participantType === "طالب") return "طالب";

    // 1. Match by referenceId in allStaff
    if (part.referenceId) {
      const staffMember = allStaff.find(t => t.id === part.referenceId);
      if (staffMember) {
        return staffMember.roleTitle?.trim() || staffMember.category || staffMember.specialty || part.participantType;
      }
    }

    // 2. Match by Full Name in allStaff
    const cleanName = part.fullName?.trim();
    if (cleanName) {
      const staffByName = allStaff.find(t => t.fullName?.trim() === cleanName);
      if (staffByName) {
        return staffByName.roleTitle?.trim() || staffByName.category || staffByName.specialty || part.participantType;
      }
    }

    // 3. Fallback to participantType
    return part.participantType || "مشارك خارجي";
  };

  // Exact custom role rank helper according to required hierarchy:
  // 1. طالب | 2. محفظ | 3. مدير المدرسة المسؤول (المدير التنفيذي) | 4. رئيس الجمعية | 5. الكاتب العام للجمعية | 6. أمين مال الجمعية | 7. مؤطر | 8. متطوع | 9. مشارك خارجي
  const getRoleRank = (role: string | null | undefined): number => {
    const r = (role || "").trim();
    if (!r) return 99;

    // 1. طالب
    if (r === "طالب" || r.startsWith("طالب")) return 1;

    // 2. محفظ / أستاذ
    if (
      r.includes("محفظ") ||
      r.includes("أستاذ") ||
      r.includes("تحفيظ") ||
      r.includes("تجويد") ||
      r.includes("مدرس")
    ) return 2;

    // 3. مدير المدرسة المسؤول (المدير التنفيذي)
    if (
      r.includes("مدير المدرسة") ||
      r.includes("المدير التنفيذي") ||
      (r.includes("مدير") && !r.includes("رئيس"))
    ) return 3;

    // 4. رئيس الجمعية / المشرف العام
    if (
      r.includes("رئيس الجمعية") ||
      r.includes("المشرف العام") ||
      r === "رئيس"
    ) return 4;

    // 5. الكاتب العام للجمعية
    if (
      r.includes("الكاتب العام") ||
      r.includes("كاتب الجمعية") ||
      r.includes("كاتب") ||
      r.includes("إداري / كاتب")
    ) return 5;

    // 6. أمين مال الجمعية
    if (
      r.includes("أمين مال") ||
      r.includes("أمين المال") ||
      r.includes("مالية") ||
      r.includes("المحاسب")
    ) return 6;

    // 7. مؤطر
    if (
      r.includes("مؤطر") ||
      r.includes("إشراف") ||
      r.includes("مشرف") ||
      r.includes("تأطير")
    ) return 7;

    // 8. متطوع
    if (r.includes("متطوع") || r.includes("تطوع")) return 8;

    // 9. مشارك خارجي
    if (
      r.includes("مشارك خارجي") ||
      r.includes("مشارك") ||
      r.includes("ولي أمر") ||
      r.includes("مرافق") ||
      r.includes("ضيف")
    ) return 9;

    return 10;
  };

  // Helper to safely resolve participant fee with fallbacks
  const resolveParticipantFee = (p: ActivityParticipant): number => {
    if (p.fee !== undefined && p.fee !== null && !isNaN(Number(p.fee))) {
      return Number(p.fee);
    }
    if ((p as any).assignedFee !== undefined && !isNaN(Number((p as any).assignedFee))) {
      return Number((p as any).assignedFee);
    }
    if (p.paymentStatus === "معفى") return 0;
    return currentActivity ? Number(currentActivity.contributionFee || 0) : 0;
  };

  // Helper to safely resolve participant paid amount
  const resolveParticipantPaid = (p: ActivityParticipant): number => {
    if (p.paidAmount !== undefined && p.paidAmount !== null && !isNaN(Number(p.paidAmount))) {
      return Number(p.paidAmount);
    }
    return 0;
  };

  // Helper to safely resolve payment status descriptor
  const resolvePaymentStatusInfo = (p: ActivityParticipant) => {
    const fee = resolveParticipantFee(p);
    const paid = resolveParticipantPaid(p);
    const rawStatus = (p.paymentStatus || "") as string;

    if (rawStatus === "معفى" || (fee === 0 && paid === 0 && p.participantType !== "طالب")) {
      return {
        label: "معفى",
        shortLabel: "معفى",
        status: "معفى" as ParticipantPaymentStatus,
        colorClass: "text-blue-800",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200"
      };
    }

    if (rawStatus === "مدفوع" || rawStatus === "مؤدى بالكامل" || rawStatus === "خالص" || (paid >= fee && fee > 0)) {
      return {
        label: "مدفوع",
        shortLabel: "مدفوع",
        status: "مدفوع" as ParticipantPaymentStatus,
        colorClass: "text-emerald-800",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
      };
    }

    if (rawStatus === "مدفوع جزئياً" || rawStatus === "مؤدى جزئياً" || rawStatus === "تسبيق" || (paid > 0 && paid < fee)) {
      return {
        label: "مدفوع جزئياً",
        shortLabel: "مدفوع جزئياً",
        status: "مدفوع جزئياً" as ParticipantPaymentStatus,
        colorClass: "text-amber-800",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200"
      };
    }

    return {
      label: "غير مدفوع",
      shortLabel: "غير مدفوع",
      status: "غير مدفوع" as ParticipantPaymentStatus,
      colorClass: "text-rose-800",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-200"
    };
  };
  const getRoleBadgeStyle = (role: string) => {
    const rank = getRoleRank(role);
    switch (rank) {
      case 1: // طالب
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 2: // محفظ / أستاذ
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 3: // مدير المدرسة المسؤول (المدير التنفيذي)
        return "bg-purple-100 text-purple-900 border-purple-200";
      case 4: // رئيس الجمعية
        return "bg-amber-100 text-amber-900 border-amber-200";
      case 5: // الكاتب العام للجمعية
        return "bg-indigo-100 text-indigo-900 border-indigo-200";
      case 6: // أمين مال الجمعية
        return "bg-teal-100 text-teal-900 border-teal-200";
      case 7: // مؤطر
        return "bg-cyan-100 text-cyan-900 border-cyan-200";
      case 8: // متطوع
        return "bg-orange-100 text-orange-900 border-orange-200";
      case 9: // مشارك خارجي
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Selected Activity object
  const currentActivity = useMemo(() => {
    return activities.find(a => a.id === selectedActivityId) || null;
  }, [activities, selectedActivityId]);

  // Selected Activity's participants and expenses
  const currentParticipants = useMemo(() => {
    if (!selectedActivityId) return [];
    return participants.filter(p => p.activityId === selectedActivityId);
  }, [participants, selectedActivityId]);

  // Distinct roles among current participants for filtering, sorted by the custom hierarchy order
  const availablePartRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    currentParticipants.forEach(p => {
      const r = getParticipantRole(p);
      if (r) rolesSet.add(r);
    });
    return Array.from(rolesSet).sort((a, b) => {
      const rankA = getRoleRank(a);
      const rankB = getRoleRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b, "ar");
    });
  }, [currentParticipants, allStaff]);

  // Sorted printable participants list
  const printableParticipants = useMemo(() => {
    return [...currentParticipants].sort((a, b) => {
      const roleA = getParticipantRole(a);
      const roleB = getParticipantRole(b);
      const rankA = getRoleRank(roleA);
      const rankB = getRoleRank(roleB);
      if (rankA !== rankB) return rankA - rankB;
      return (a.fullName || "").localeCompare(b.fullName || "", "ar");
    });
  }, [currentParticipants, allStaff]);

  const currentExpenses = useMemo(() => {
    if (!selectedActivityId) return [];
    return activityExpenses.filter(e => e.activityId === selectedActivityId);
  }, [activityExpenses, selectedActivityId]);

  // Financial calculations for selected activity
  const currentFinances = useMemo(() => {
    const totalCollected = currentParticipants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const totalExpected = currentParticipants.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
    const totalSpent = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netBalance = totalCollected - totalSpent;
    const remainingUnpaid = totalExpected - totalCollected;

    return {
      totalCollected,
      totalExpected,
      totalSpent,
      netBalance,
      remainingUnpaid,
      isSurplus: netBalance >= 0
    };
  }, [currentParticipants, currentExpenses]);

  // Global Statistics across all activities
  const globalStats = useMemo(() => {
    const totalActs = activities.length;
    const activeOrUpcoming = activities.filter(a => a.status === "قيد التسجيل" || a.status === "مخطط له" || a.status === "قيد التنفيذ").length;
    const totalParts = participants.length;
    const totalIncome = participants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const totalSpend = activityExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalNet = totalIncome - totalSpend;

    return {
      totalActs,
      activeOrUpcoming,
      totalParts,
      totalIncome,
      totalSpend,
      totalNet
    };
  }, [activities, participants, activityExpenses]);

  // Filtered & Sorted activities list
  const filteredActivities = useMemo(() => {
    const list = activities.filter(a => {
      const matchQuery = 
        searchQuery === "" || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = typeFilter === "all" || a.type === typeFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;

      return matchQuery && matchType && matchStatus;
    });

    return list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (activitySortKey === "title") {
        valA = a.title || "";
        valB = b.title || "";
        return activitySortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
      } else if (activitySortKey === "contributionFee") {
        valA = Number(a.contributionFee) || 0;
        valB = Number(b.contributionFee) || 0;
        return activitySortDir === "asc" ? valA - valB : valB - valA;
      } else if (activitySortKey === "status") {
        valA = a.status || "";
        valB = b.status || "";
        return activitySortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
      } else if (activitySortKey === "participantsCount") {
        valA = participants.filter(p => p.activityId === a.id).length;
        valB = participants.filter(p => p.activityId === b.id).length;
        return activitySortDir === "asc" ? valA - valB : valB - valA;
      } else {
        // Default: startDate
        valA = new Date(a.startDate).getTime() || 0;
        valB = new Date(b.startDate).getTime() || 0;
        return activitySortDir === "asc" ? valA - valB : valB - valA;
      }
    });
  }, [activities, searchQuery, typeFilter, statusFilter, activitySortKey, activitySortDir, participants]);

  // Filtered & Sorted participants list for selected activity
  const filteredParticipants = useMemo(() => {
    let list = currentParticipants.filter(p => {
      const matchQuery = 
        partSearchQuery === "" ||
        p.fullName.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(partSearchQuery)) ||
        (p.receiptNo && p.receiptNo.toLowerCase().includes(partSearchQuery.toLowerCase()));

      const role = getParticipantRole(p);
      const matchType = partTypeFilter === "all" || p.participantType === partTypeFilter || role === partTypeFilter;
      const matchStatus = partStatusFilter === "all" || p.paymentStatus === partStatusFilter;

      return matchQuery && matchType && matchStatus;
    });

    if (partSortKey) {
      list = [...list].sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (partSortKey === "fullName") {
          valA = a.fullName || "";
          valB = b.fullName || "";
          return partSortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
        } else if (partSortKey === "participantType") {
          const roleA = getParticipantRole(a);
          const roleB = getParticipantRole(b);
          const rankA = getRoleRank(roleA);
          const rankB = getRoleRank(roleB);
          if (rankA !== rankB) {
            return partSortDir === "asc" ? rankA - rankB : rankB - rankA;
          }
          return (a.fullName || "").localeCompare(b.fullName || "", "ar");
        } else if (partSortKey === "phone") {
          valA = a.phone || "";
          valB = b.phone || "";
          return partSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (partSortKey === "fee") {
          valA = Number(a.fee) || 0;
          valB = Number(b.fee) || 0;
          return partSortDir === "asc" ? valA - valB : valB - valA;
        } else if (partSortKey === "paidAmount") {
          valA = Number(a.paidAmount) || 0;
          valB = Number(b.paidAmount) || 0;
          return partSortDir === "asc" ? valA - valB : valB - valA;
        } else if (partSortKey === "paymentStatus") {
          valA = a.paymentStatus || "";
          valB = b.paymentStatus || "";
          return partSortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
        } else if (partSortKey === "receiptNo") {
          valA = a.receiptNo || "";
          valB = b.receiptNo || "";
          return partSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    } else {
      // Default: sort by Role Hierarchy rank, then by name
      list = [...list].sort((a, b) => {
        const roleA = getParticipantRole(a);
        const roleB = getParticipantRole(b);
        const rankA = getRoleRank(roleA);
        const rankB = getRoleRank(roleB);
        if (rankA !== rankB) return rankA - rankB;
        return (a.fullName || "").localeCompare(b.fullName || "", "ar");
      });
    }

    return list;
  }, [currentParticipants, partSearchQuery, partTypeFilter, partStatusFilter, partSortKey, partSortDir, allStaff]);

  // Filtered & Sorted expenses list for selected activity
  const filteredExpenses = useMemo(() => {
    let list = currentExpenses.filter(e => {
      const matchQuery = 
        expSearchQuery === "" ||
        e.title.toLowerCase().includes(expSearchQuery.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(expSearchQuery.toLowerCase())) ||
        (e.receiptOrInvoiceNo && e.receiptOrInvoiceNo.toLowerCase().includes(expSearchQuery.toLowerCase()));

      const matchCategory = expCategoryFilter === "all" || e.category === expCategoryFilter;

      return matchQuery && matchCategory;
    });

    if (expSortKey) {
      list = [...list].sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (expSortKey === "title") {
          valA = a.title || "";
          valB = b.title || "";
          return expSortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
        } else if (expSortKey === "category") {
          valA = a.category || "";
          valB = b.category || "";
          return expSortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
        } else if (expSortKey === "amount") {
          valA = Number(a.amount) || 0;
          valB = Number(b.amount) || 0;
          return expSortDir === "asc" ? valA - valB : valB - valA;
        } else if (expSortKey === "date") {
          valA = new Date(a.date).getTime() || 0;
          valB = new Date(b.date).getTime() || 0;
          return expSortDir === "asc" ? valA - valB : valB - valA;
        } else if (expSortKey === "supplier") {
          valA = a.supplier || "";
          valB = b.supplier || "";
          return expSortDir === "asc" ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
        } else if (expSortKey === "receiptOrInvoiceNo") {
          valA = a.receiptOrInvoiceNo || "";
          valB = b.receiptOrInvoiceNo || "";
          return expSortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }

    return list;
  }, [currentExpenses, expSearchQuery, expCategoryFilter, expSortKey, expSortDir]);

  // Reset / Open Activity Modal
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setFormTitle("");
    setFormType("رحلة استكشافية");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate("");
    setFormLocation("");
    setFormLeaderIds([]);
    setFormContributionFee(100);
    setFormMaxCapacity(45);
    setFormStatus("قيد التسجيل");
    setFormTargetAudience("الجميع (طلاب، أطر، أولياء أمور)");
    setFormDescription("");
    setFormProgramDetails("");
    setFormMeetingPoint("مقر الجمعية");
    setShowActivityModal(true);
  };

  const handleOpenEditActivity = (activity: ActivityTrip) => {
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormType(activity.type);
    setFormStartDate(activity.startDate);
    setFormEndDate(activity.endDate || "");
    setFormLocation(activity.location);
    setFormLeaderIds(activity.leaderIds || []);
    setFormContributionFee(activity.contributionFee);
    setFormMaxCapacity(activity.maxCapacity || 45);
    setFormStatus(activity.status);
    setFormTargetAudience(activity.targetAudience);
    setFormDescription(activity.description || "");
    setFormProgramDetails(activity.programDetails || "");
    setFormMeetingPoint(activity.meetingPoint || "");
    setShowActivityModal(true);
  };

  const handleSaveActivityForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("يرجى إدخال عنوان أو اسم النشاط/الرحلة.");
      return;
    }

    const leaderNamesList = formLeaderIds.map(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher ? teacher.fullName : id;
    });

    const newActivity: ActivityTrip = {
      id: editingActivity ? editingActivity.id : `act_${Date.now()}`,
      title: formTitle.trim(),
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate ? formEndDate : undefined,
      location: formLocation.trim() || "غير محدد",
      leaderIds: formLeaderIds,
      leaderNames: leaderNamesList,
      contributionFee: Number(formContributionFee) || 0,
      maxCapacity: Number(formMaxCapacity) || undefined,
      status: formStatus,
      targetAudience: formTargetAudience,
      description: formDescription.trim(),
      programDetails: formProgramDetails.trim(),
      meetingPoint: formMeetingPoint.trim(),
      createdAt: editingActivity ? editingActivity.createdAt : new Date().toISOString().split("T")[0],
      syncedToFinance: editingActivity ? editingActivity.syncedToFinance : false,
      syncedFinanceDate: editingActivity ? editingActivity.syncedFinanceDate : undefined,
      syncedNetBalance: editingActivity ? editingActivity.syncedNetBalance : undefined,
    };

    onSaveActivity(newActivity);
    setShowActivityModal(false);
    if (!selectedActivityId) {
      setSelectedActivityId(newActivity.id);
    }
  };

  // Participant Form Handlers
  const handleOpenAddParticipant = () => {
    if (!selectedActivityId) return;
    setEditingParticipant(null);
    setPartSourceType("student");
    setSelectedStudentRefId("");
    setSelectedStaffRefId("");
    setPartFullName("");
    setPartCustomRole("مشارك خارجي");
    setPartPhone("");
    setPartGender("ذكر");
    const defaultFee = currentActivity ? currentActivity.contributionFee : 100;
    setPartFee(defaultFee);
    setPartPaidAmount(defaultFee);
    setPartPaymentStatus("مدفوع");
    setPartPaymentMethod("نقداً");
    setPartReceiptNo(`REC-ACT-${Math.floor(1000 + Math.random() * 9000)}`);
    setPartHasParentApproval(true);
    setPartMedicalNotes("");
    setPartNotes("");
    setShowParticipantModal(true);
  };

  const handleOpenEditParticipant = (part: ActivityParticipant) => {
    setEditingParticipant(part);
    const resolvedRole = getParticipantRole(part);

    if (part.participantType === "طالب") {
      setPartSourceType("student");
      setSelectedStudentRefId(part.referenceId || "");
      setPartCustomRole("طالب");
    } else if (
      allStaff.some(t => t.id === part.referenceId || t.fullName?.trim() === part.fullName?.trim()) ||
      part.participantType === "أستاذ / محفظ" ||
      part.participantType === "عامل / إداري"
    ) {
      setPartSourceType("staff");
      const matchedStaff = allStaff.find(t => t.id === part.referenceId || t.fullName?.trim() === part.fullName?.trim());
      setSelectedStaffRefId(matchedStaff ? matchedStaff.id : (part.referenceId || ""));
      setPartCustomRole(resolvedRole);
    } else {
      setPartSourceType("custom");
      setPartCustomRole(resolvedRole || part.participantType || "مشارك خارجي");
    }
    setPartFullName(part.fullName);
    setPartPhone(part.phone || "");
    setPartGender(part.gender || "ذكر");
    setPartFee(part.fee);
    setPartPaidAmount(part.paidAmount);
    setPartPaymentStatus(part.paymentStatus);
    setPartPaymentMethod(part.paymentMethod || "نقداً");
    setPartReceiptNo(part.receiptNo || "");
    setPartHasParentApproval(part.hasParentApproval !== false);
    setPartMedicalNotes(part.medicalNotes || "");
    setPartNotes(part.notes || "");
    setShowParticipantModal(true);
  };

  const handleSaveParticipantForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return;

    let finalName = partFullName.trim();
    let refId = undefined;
    let clsId = undefined;
    let derivedType: ParticipantType = "مشارك خارجي";

    if (partSourceType === "student") {
      const student = students.find(s => s.id === selectedStudentRefId);
      if (student) {
        finalName = student.fullName;
        refId = student.id;
        clsId = student.classId;
      }
      derivedType = "طالب";
    } else if (partSourceType === "staff") {
      const staff = allStaff.find(t => t.id === selectedStaffRefId);
      if (staff) {
        finalName = staff.fullName;
        refId = staff.id;
        // خذ صفة المشارك من المسمى الوظيفي في إدارة شؤون العاملين والمدرسين
        derivedType = staff.roleTitle?.trim() || staff.category || staff.specialty || "كادر الجمعية";
      }
    } else {
      derivedType = partCustomRole.trim() || "مشارك خارجي";
    }

    if (!finalName) {
      alert("يرجى تحديد أو كتابة اسم المشارك.");
      return;
    }

    // Determine payment status if auto-adjusted
    let calculatedStatus = partPaymentStatus;
    if (partPaymentStatus !== "معفى") {
      if (partPaidAmount >= partFee && partFee > 0) {
        calculatedStatus = "مدفوع";
      } else if (partPaidAmount > 0 && partPaidAmount < partFee) {
        calculatedStatus = "مدفوع جزئياً";
      } else if (partPaidAmount === 0 && partFee > 0) {
        calculatedStatus = "غير مدفوع";
      }
    }

    const newParticipant: ActivityParticipant = {
      id: editingParticipant ? editingParticipant.id : `part_${Date.now()}`,
      activityId: selectedActivityId,
      participantType: derivedType,
      referenceId: refId,
      fullName: finalName,
      phone: partPhone.trim() || undefined,
      gender: partGender,
      classId: clsId,
      fee: Number(partFee) || 0,
      paidAmount: Number(partPaidAmount) || 0,
      paymentStatus: calculatedStatus,
      paymentDate: partPaidAmount > 0 ? (editingParticipant?.paymentDate || new Date().toISOString().split("T")[0]) : undefined,
      paymentMethod: partPaymentMethod,
      receiptNo: partReceiptNo.trim() || undefined,
      hasParentApproval: partHasParentApproval,
      medicalNotes: partMedicalNotes.trim() || undefined,
      notes: partNotes.trim() || undefined,
      registeredAt: editingParticipant ? editingParticipant.registeredAt : new Date().toISOString().split("T")[0],
    };

    onSaveParticipant(newParticipant);
    setShowParticipantModal(false);
  };

  // Expense Form Handlers
  const handleOpenAddExpense = () => {
    if (!selectedActivityId) return;
    setEditingExpense(null);
    setExpTitle("");
    setExpCategory("كراء حافلة وتنقل");
    setExpAmount(0);
    setExpDate(new Date().toISOString().split("T")[0]);
    setExpPaymentMethod("نقداً");
    setExpPaidBy(systemSettings?.treasurerName || "أمين المال");
    setExpReceiptNo(`EXP-ACT-${Math.floor(1000 + Math.random() * 9000)}`);
    setExpSupplier("");
    setExpNotes("");
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: ActivityExpense) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpCategory(exp.category);
    setExpAmount(exp.amount);
    setExpDate(exp.date);
    setExpPaymentMethod(exp.paymentMethod);
    setExpPaidBy(exp.paidBy || "");
    setExpReceiptNo(exp.receiptOrInvoiceNo || "");
    setExpSupplier(exp.supplier || "");
    setExpNotes(exp.notes || "");
    setShowExpenseModal(true);
  };

  const handleSaveExpenseForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return;
    if (!expTitle.trim()) {
      alert("يرجى إدخال وصف أو اسم المصروف.");
      return;
    }
    if (expAmount <= 0) {
      alert("يرجى إدخال مبلغ المصروف بشكل صحيح.");
      return;
    }

    const newExpense: ActivityExpense = {
      id: editingExpense ? editingExpense.id : `exp_act_${Date.now()}`,
      activityId: selectedActivityId,
      title: expTitle.trim(),
      category: expCategory,
      amount: Number(expAmount),
      date: expDate,
      paymentMethod: expPaymentMethod,
      paidBy: expPaidBy.trim() || undefined,
      receiptOrInvoiceNo: expReceiptNo.trim() || undefined,
      supplier: expSupplier.trim() || undefined,
      notes: expNotes.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString().split("T")[0],
    };

    onSaveActivityExpense(newExpense);
    setShowExpenseModal(false);
  };

  // Sync to Finance Section Handler (Quick Live Refresh)
  const handleSyncActivityFinance = () => {
    if (!currentActivity) return;
    const { totalCollected, totalSpent, netBalance } = currentFinances;

    onSyncToFinance(currentActivity, netBalance, totalCollected, totalSpent);
    alert(`✅ الربط المالي التلقائي نشط ومباشر!\n\nتم التحقق من مزامنة نشاط "${currentActivity.title}" لحظياً مع قيود المحاسبة والمالية الجمعوية:\n• إجمالي المساهمات المحصلة: ${totalCollected.toLocaleString()} د.م\n• إجمالي المصاريف الفعلية: ${totalSpent.toLocaleString()} د.م\n• الصافي المقيد تلقائياً: ${netBalance > 0 ? `فائض +${netBalance.toLocaleString()} د.م` : netBalance < 0 ? `عجز ${netBalance.toLocaleString()} د.م` : "متوازن (0 د.م)"}`);
  };

  return (
    <div id="activities-management-module" className="space-y-6">
      {/* Main Dashboard Interactive UI (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        {/* Top Header & Stats */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة الأنشطة والرحلات</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  النسخة الاحترافية
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                تخطيط الرحلات والمخيمات، تسجيل المشاركين وتتبع المساهمات، ضبط المصاريف والربط المالي التلقائي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canCreateActivity && (
              <button
                id="btn-add-new-activity"
                onClick={handleOpenAddActivity}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نشاط / رحلة جديدة</span>
              </button>
            )}
            {onNavigateToFinance && (
              <button
                id="btn-nav-to-finance"
                onClick={onNavigateToFinance}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-medium transition-all text-sm border border-slate-200"
              >
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>المحاسبة والمالية الجمعوية</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">إجمالي الأنشطة والرحلات</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalActs} <span className="text-xs font-normal text-slate-500">({globalStats.activeOrUpcoming} جارية/قادمة)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">المشاركون المسجلون</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalParts} <span className="text-xs font-normal text-slate-500">مشارك ومستفيد</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">المساهمات المحصلة</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {globalStats.totalIncome.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.م</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${globalStats.totalNet >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} flex items-center justify-center shrink-0`}>
              {globalStats.totalNet >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">الصافي المالي العام للأنشطة</div>
              <div className={`text-xl font-bold mt-0.5 ${globalStats.totalNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {globalStats.totalNet >= 0 ? `+${globalStats.totalNet.toLocaleString()}` : globalStats.totalNet.toLocaleString()} <span className="text-xs font-normal text-slate-500">د.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column or Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Activities List (5 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span>سجل الأنشطة والرحلات</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {filteredActivities.length}
                </span>
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم النشاط أو الوجهة..."
                  className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">كل الأنواع</option>
                  {ACTIVITY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">كل الحالات</option>
                  {ACTIVITY_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  <span>ترتيب:</span>
                </span>
                <select
                  value={activitySortKey}
                  onChange={(e) => setActivitySortKey(e.target.value)}
                  className="flex-1 py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="startDate">تاريخ الانطلاق</option>
                  <option value="title">الاسم الأبجدي</option>
                  <option value="contributionFee">قيمة المساهمة</option>
                  <option value="participantsCount">عدد المشاركين</option>
                  <option value="status">الحالة</option>
                </select>
                <button
                  onClick={() => setActivitySortDir(prev => prev === "asc" ? "desc" : "asc")}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200 flex items-center justify-center shrink-0"
                  title={activitySortDir === "asc" ? "ترتيب تصاعدي (انقر للتبديل إلى تنازلي)" : "ترتيب تنازلي (انقر للتبديل إلى تصاعدي)"}
                >
                  {activitySortDir === "asc" ? (
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                  )}
                </button>
              </div>
            </div>

            {/* Activities List Cards */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-0.5">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">لا توجد أنشطة مطابقة للبحث</p>
                  {canCreateActivity && (
                    <button
                      onClick={handleOpenAddActivity}
                      className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                    >
                      إضافة أول نشاط
                    </button>
                  )}
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const isSelected = selectedActivityId === act.id;
                  const actParts = participants.filter(p => p.activityId === act.id);
                  const actExps = activityExpenses.filter(e => e.activityId === act.id);
                  const totalPaid = actParts.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
                  const totalExp = actExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                  const net = totalPaid - totalExp;

                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500" 
                          : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            act.type === "رحلة استكشافية" ? "bg-blue-100 text-blue-800" :
                            act.type.includes("مخيم") ? "bg-amber-100 text-amber-800" :
                            act.type.includes("رياضي") ? "bg-emerald-100 text-emerald-800" :
                            "bg-purple-100 text-purple-800"
                          }`}>
                            {act.type}
                          </span>
                          <h3 className="font-bold text-slate-800 text-sm mt-1.5 line-clamp-1">{act.title}</h3>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          act.status === "مكتمل" ? "bg-slate-100 text-slate-700" :
                          act.status === "قيد التسجيل" ? "bg-emerald-100 text-emerald-800" :
                          act.status === "قيد التنفيذ" ? "bg-blue-100 text-blue-800" :
                          act.status === "ملغى" ? "bg-rose-100 text-rose-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {act.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="line-clamp-1">{act.location}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.startDate}</span>
                        </span>
                      </div>

                      {/* Mini Metrics Bar */}
                      <div className="grid grid-cols-3 gap-1 bg-white/80 rounded-lg p-1.5 mt-2.5 border border-slate-100 text-center text-[11px]">
                        <div>
                          <div className="text-slate-400 text-[10px]">المشاركون</div>
                          <div className="font-bold text-slate-700">{actParts.length} {act.maxCapacity ? `/${act.maxCapacity}` : ""}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">المساهمة</div>
                          <div className="font-bold text-emerald-700">{act.contributionFee} د.م</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">الصافي</div>
                          <div className={`font-bold ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {net > 0 ? `+${net}` : net} د.م
                          </div>
                        </div>
                      </div>

                      {act.syncedToFinance && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-2 pt-1 border-t border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>تم الربط المالي وتصدير النتائج للمحاسبة الجمعوية</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Activity Detailed Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {currentActivity ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
              {/* Activity Detailed Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        {currentActivity.type}
                      </span>
                      <span className="bg-white/10 text-white text-xs px-2.5 py-0.5 rounded-full">
                        الحالة: {currentActivity.status}
                      </span>
                      {currentActivity.syncedToFinance && (
                        <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                          <CheckCircle2 className="w-3 h-3" />
                          مرتبط بمالية الجمعية
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold mt-2 tracking-tight">{currentActivity.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentActivity.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>التاريخ: {currentActivity.startDate} {currentActivity.endDate ? `إلى ${currentActivity.endDate}` : ""}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>واجب المساهمة: {currentActivity.contributionFee} د.م</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {canUpdateActivity && (
                      <button
                        onClick={() => handleOpenEditActivity(currentActivity)}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل النشاط</span>
                      </button>
                    )}
                    {canDeleteActivity && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف النشاط "${currentActivity.title}" وجميع سجلات المشاركين ومصاريفه؟`)) {
                            onDeleteActivity(currentActivity.id);
                            setSelectedActivityId(null);
                          }
                        }}
                        className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "overview"
                      ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span>نظرة عامة والبرنامج</span>
                </button>

                <button
                  onClick={() => setActiveTab("participants")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "participants"
                      ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>المشاركون والمساهمات</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {currentParticipants.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "expenses"
                      ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>مصاريف النشاط</span>
                  <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {currentExpenses.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("finance")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "finance"
                      ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>الميزانية والربط المالي</span>
                  {currentActivity.syncedToFinance && (
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      تم الربط
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Overview & Program */}
              {activeTab === "overview" && (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 font-medium">الفئة المستهدفة</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">
                        {currentActivity.targetAudience || "الجميع (طلاب، أطر، أولياء أمور)"}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 font-medium">نقطة وساعة الانطلاق</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{currentActivity.meetingPoint || "مقر الجمعية"}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 font-medium">المؤطرون والمشرفون</div>
                      <div className="text-sm font-bold text-emerald-800 mt-1">
                        {currentActivity.leaderNames && currentActivity.leaderNames.length > 0 
                          ? currentActivity.leaderNames.join("، ") 
                          : "لم يتم التحديد بعد"}
                      </div>
                    </div>
                  </div>

                  {currentActivity.description && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-700 mb-1.5">الأهداف والوصف العام</h4>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{currentActivity.description}</p>
                    </div>
                  )}

                  {currentActivity.programDetails ? (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-emerald-900 mb-1.5">البرنامج الزمني والتفصيلي</h4>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{currentActivity.programDetails}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      لم يتم إدخال تفاصيل البرنامج الزمني بعد. يمكنك إضافته عبر زر تعديل النشاط.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Participants & Contributions Tracker */}
              {activeTab === "participants" && (
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">لائحة المشاركين والمساهمات</h3>
                      <p className="text-xs text-slate-500">تسجيل الطلاب والعاملين وتتبع المبالغ المدفوعة ووصولات الأداء</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleOpenAddParticipant}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تسجيل مشارك جديد</span>
                      </button>

                      {canPrintActivity && (
                        <button
                          onClick={() => setPrintType("participants-list")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة لائحة المشاركين</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Participants Filter and Sort Bar */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={partSearchQuery}
                        onChange={(e) => setPartSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم، رقم الهاتف، أو رقم الوصل..."
                        className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={partTypeFilter}
                        onChange={(e) => setPartTypeFilter(e.target.value)}
                        className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        <option value="all">كل الصفات والمشاركين</option>
                        <option value="طالب">طالب</option>
                        {availablePartRoles.filter(r => r !== "طالب").map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>

                      <select
                        value={partStatusFilter}
                        onChange={(e) => setPartStatusFilter(e.target.value)}
                        className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">كل حالات الأداء</option>
                        <option value="مدفوع">مدفوع</option>
                        <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                        <option value="غير مدفوع">غير مدفوع</option>
                        <option value="معفى">معفى</option>
                      </select>

                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                        العدد: {filteredParticipants.length} / {currentParticipants.length}
                      </span>
                    </div>
                  </div>

                  {/* Participants Table */}
                  {currentParticipants.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-700 text-sm">لم يتم تسجيل أي مشارك في هذا النشاط بعد</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        يمكنك إضافة الطلاب المسجلين بالجمعية أو الأطر الإدارية والتربوية أو مشاركين خارجيين
                      </p>
                      <button
                        onClick={handleOpenAddParticipant}
                        className="mt-3 inline-flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تسجيل أول مشارك</span>
                      </button>
                    </div>
                  ) : filteredParticipants.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">لا توجد نتائج مطابقة لبحث المشاركين</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-center">#</th>
                            {renderSortableHeader("المشارك", "fullName", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("الصفة", "participantType", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("الهاتف", "phone", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("الواجب", "fee", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("المدفوع", "paidAmount", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("حالة الأداء", "paymentStatus", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            {renderSortableHeader("رقم الوصل", "receiptNo", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                            <th className="p-3 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredParticipants.map((part, idx) => (
                            <tr key={part.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-800">
                                {part.fullName}
                                {part.medicalNotes && (
                                  <span className="block text-[10px] text-amber-700 font-normal mt-0.5">
                                    ⚠️ {part.medicalNotes}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {(() => {
                                  const role = getParticipantRole(part);
                                  const badgeClass = getRoleBadgeStyle(role);

                                  return (
                                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs ${badgeClass}`}>
                                      {role}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3 font-mono text-slate-600">{part.phone || "—"}</td>
                              <td className="p-3 font-semibold text-slate-700">
                                {(() => {
                                  const feeVal = resolveParticipantFee(part);
                                  const statusInfo = resolvePaymentStatusInfo(part);
                                  if (statusInfo.status === "معفى" && feeVal === 0) {
                                    return <span className="text-blue-700 font-bold">معفى (0 د.م)</span>;
                                  }
                                  return <span>{feeVal.toLocaleString()} د.م</span>;
                                })()}
                              </td>
                              <td className="p-3 font-bold text-emerald-700">
                                {resolveParticipantPaid(part).toLocaleString()} د.م
                              </td>
                              <td className="p-3">
                                {(() => {
                                  const statusInfo = resolvePaymentStatusInfo(part);
                                  return (
                                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${statusInfo.badgeClass}`}>
                                      {statusInfo.label}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">{part.receiptNo || "—"}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    title="طباعة بطاقة المشارك"
                                    onClick={() => {
                                       setSelectedParticipantForTicket(part);
                                       setPrintType("participant-ticket");
                                    }}
                                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    title="تعديل بيانات المشارك والدفع"
                                    onClick={() => handleOpenEditParticipant(part)}
                                    className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    title="حذف المشارك"
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف المشارك "${part.fullName}"؟`)) {
                                        onDeleteParticipant(part.id);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Activity Expenses Ledger */}
              {activeTab === "expenses" && (
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">مصاريف النشاط والرحلة</h3>
                      <p className="text-xs text-slate-500">تسجيل كراء الحافلة، كراء الفضاء، التغذية، التأمين وباقي التكاليف</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenAddExpense}
                        className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة نفقة / مصروف</span>
                      </button>
                    </div>
                  </div>

                  {/* Expenses Filter Bar */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={expSearchQuery}
                        onChange={(e) => setExpSearchQuery(e.target.value)}
                        placeholder="بحث ببيان المصروف، المورد، أو رقم الفاتورة..."
                        className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={expCategoryFilter}
                        onChange={(e) => setExpCategoryFilter(e.target.value)}
                        className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">كل الفئات والمصاريف</option>
                        {EXPENSE_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                        العدد: {filteredExpenses.length} / {currentExpenses.length}
                      </span>
                    </div>
                  </div>

                  {currentExpenses.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                      <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="font-bold text-slate-700 text-sm">لم يتم تسجيل أي مصاريف لهذا النشاط بعد</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        سجل نفقات النقل والتنقل، الوجبات، وتأجير الفضاءات لحساب الميزانية التقديرية بدقة
                      </p>
                      <button
                        onClick={handleOpenAddExpense}
                        className="mt-3 inline-flex items-center gap-1.5 bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة أول مصروف</span>
                      </button>
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">لا توجد مصاريف مطابقة للبحث</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-center">#</th>
                            {renderSortableHeader("بيان المصروف", "title", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            {renderSortableHeader("الفئة / الصنف", "category", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            {renderSortableHeader("المبلغ", "amount", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            {renderSortableHeader("التاريخ", "date", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            {renderSortableHeader("المورد / الجهة", "supplier", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            {renderSortableHeader("رقم الفاتورة/الوصل", "receiptOrInvoiceNo", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                            <th className="p-3 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredExpenses.map((exp, idx) => (
                            <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-800">{exp.title}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-rose-700">{exp.amount.toLocaleString()} د.م</td>
                              <td className="p-3 text-slate-600 font-mono">{exp.date}</td>
                              <td className="p-3 text-slate-700">{exp.supplier || "—"}</td>
                              <td className="p-3 font-mono text-slate-500">{exp.receiptOrInvoiceNo || "—"}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    title="تعديل المصروف"
                                    onClick={() => handleOpenEditExpense(exp)}
                                    className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="حذف المصروف"
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف المصروف "${exp.title}"؟`)) {
                                        onDeleteActivityExpense(exp.id);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Financial Balance & Sync with Accounting */}
              {activeTab === "finance" && (
                <div className="p-5 space-y-6">
                  {/* Financial Balance Summary Card */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-semibold text-emerald-400">كشف الميزانية المستقلة للنشاط</span>
                        <h3 className="text-lg font-bold mt-0.5">{currentActivity.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {canPrintActivity && (
                          <button
                            onClick={() => setPrintType("financial-report")}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-white/10"
                          >
                            <Printer className="w-4 h-4" />
                            <span>طباعة التقرير المالي الرسمي</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <div className="text-xs text-slate-400 font-medium">إجمالي المداخيل والمساهمات</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">
                          +{currentFinances.totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          من أصل {currentFinances.totalExpected.toLocaleString()} د.م متوقعة
                        </div>
                      </div>

                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <div className="text-xs text-slate-400 font-medium">إجمالي المصاريف المؤداة</div>
                        <div className="text-2xl font-bold text-rose-400 mt-1">
                          -{currentFinances.totalSpent.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          موزعة على {currentExpenses.length} بنود مصاريف
                        </div>
                      </div>

                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <div className="text-xs text-slate-400 font-medium">النتيجة الصافية للنشاط</div>
                        <div className={`text-2xl font-bold mt-1 ${currentFinances.netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {currentFinances.netBalance >= 0 ? `+${currentFinances.netBalance.toLocaleString()}` : currentFinances.netBalance.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {currentFinances.netBalance > 0 ? "فائض مالي يُحول لمالية الجمعية" : currentFinances.netBalance < 0 ? "عجز مالي يغطى من الجمعية" : "ميزانية متوازنة تماماً"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Association Accounting Automatic Sync Box */}
                  <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-emerald-950 text-sm">الربط المالي التلقائي مع المحاسبة والمالية الجمعوية</h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/90 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              ربط تلقائي فوري مفعّل
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800 mt-1 leading-relaxed max-w-2xl">
                            يتم احتساب وربط صافي هذا النشاط ({currentFinances.netBalance >= 0 ? `فائض +${currentFinances.netBalance.toLocaleString()} د.م` : `عجز ${currentFinances.netBalance.toLocaleString()} د.م`}) تلقائياً ومباشرة مع القيود المحاسبية ورصيد الصندوق للجمعية بدون الحاجة لأي تصدير يدوي.
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {onNavigateToFinance && (
                          <button
                            onClick={onNavigateToFinance}
                            title="الانتقال إلى المحاسبة والمالية الجمعوية لمعاينة القيود والتقارير"
                            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>معاينة في المحاسبة</span>
                          </button>
                        )}
                        <button
                          onClick={handleSyncActivityFinance}
                          title="تحديث فوري والتحقق من المزامنة"
                          className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تحقق من المزامنة</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                          القيد المالي المباشر: {currentFinances.netBalance > 0 
                            ? `مقيد آلياً كـ [فائض إيرادات أنشطة +${currentFinances.netBalance.toLocaleString()} د.م]`
                            : currentFinances.netBalance < 0 
                            ? `مقيد آلياً كـ [تغطية عجز أنشطة ${Math.abs(currentFinances.netBalance).toLocaleString()} د.م]`
                            : `ميزانية متوازنة ومضبوطة بالكامل (0 د.م)`
                          }
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono">
                        (مساهمات: +{currentFinances.totalCollected.toLocaleString()} د.م | مصاريف: -{currentFinances.totalSpent.toLocaleString()} د.م)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">اختر نشاطاً أو رحلة من القائمة</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                يمكنك الاطلاع على تفاصيل البرنامج، تسجيل المشاركين، تتبع المصاريف، وتصدير الصافي إلى المحاسبة
              </p>
              {canCreateActivity && (
                <button
                  onClick={handleOpenAddActivity}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء نشاط جديد الآن</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* MODAL 1: Create / Edit Activity */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                <span>{editingActivity ? "تعديل بيانات النشاط/الرحلة" : "إنشاء نشاط أو رحلة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivityForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم / عنوان النشاط أو الرحلة *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: رحلة استكشافية إلى شلالات أوزود ومغارة سيدي مجبر"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع النشاط *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ActivityType)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة النشاط *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACTIVITY_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البداية / الانطلاق *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ النهاية / العودة (اختياري)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المكان أو الوجهة *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="مثال: شلالات أوزود - إقليم أزيلال"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نقطة وساعة التجمع والانطلاق</label>
                  <input
                    type="text"
                    value={formMeetingPoint}
                    onChange={(e) => setFormMeetingPoint(e.target.value)}
                    placeholder="مثال: مقر الجمعية الرئيسي (الساعة 07:00 صباحاً)"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Target Audience Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المستهدفة *</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="form-target-audience-list"
                    required
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    placeholder="اختر من القائمة أو اكتب الفئة المستهدفة يدوياً (مثال: الطالبات فقط، أمهات الطالبات...)"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <datalist id="form-target-audience-list">
                    {TARGET_AUDIENCE_PRESETS.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium ml-1">خيارات سريعة:</span>
                    {["الطالبات فقط", "الطلاب فقط", "الجميع (طلاب، أطر، أولياء أمور)", "الكوادر والمدرسين فقط", "أولياء الأمور"].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormTargetAudience(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          formTargetAudience === tag
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-slate-200"
                        }`}
                      >
                        {tag === "الجميع (طلاب، أطر، أولياء أمور)" ? "الجميع" : tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ المساهمة الرمزية للشخص (د.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={formContributionFee}
                    onChange={(e) => setFormContributionFee(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطاقة الاستيعابية القصوى (عدد المقاعد)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxCapacity}
                    onChange={(e) => setFormMaxCapacity(Number(e.target.value))}
                    placeholder="مثال: 45 مقعداً"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المؤطرون والمشرفون المعتمدون</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-32 overflow-y-auto space-y-1.5">
                  {teachers.map(t => {
                    const isChecked = formLeaderIds.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormLeaderIds([...formLeaderIds, t.id]);
                            } else {
                              setFormLeaderIds(formLeaderIds.filter(id => id !== t.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{t.fullName}</span>
                        <span className="text-[10px] text-slate-400">({t.category || t.specialty || "مؤطر"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أهداف النشاط والوصف</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للنشاط وأهدافه التربوية والترفيهية..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البرنامج الزمني والتفصيلي</label>
                <textarea
                  rows={3}
                  value={formProgramDetails}
                  onChange={(e) => setFormProgramDetails(e.target.value)}
                  placeholder="تفاصيل المحطات، الوجبات، الأنشطة والمسابقات وساعة العودة..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {editingActivity ? "حفظ التعديلات" : "إنشاء النشاط"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register / Edit Participant */}
      {showParticipantModal && currentActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>{editingParticipant ? "تعديل بيانات المشارك" : `تسجيل مشارك في "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowParticipantModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipantForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مصدر بيانات المشارك</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartSourceType("student")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "student" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    طالب من الجمعية
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("staff")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "staff" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    أستاذ / كادر
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("custom")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "custom" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    مشارك خارجي
                  </button>
                </div>
              </div>

              {partSourceType === "student" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اختر الطالب المسجل بالجمعية *</label>
                  <select
                    value={selectedStudentRefId}
                    onChange={(e) => {
                      setSelectedStudentRefId(e.target.value);
                      const st = students.find(s => s.id === e.target.value);
                      if (st) {
                        setPartFullName(st.fullName);
                        setPartPhone(st.parentPhone);
                        setPartGender(st.gender);
                      }
                    }}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر طالباً --</option>
                    {students.filter(s => !s.isArchived).map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.parentPhone})</option>
                    ))}
                  </select>
                </div>
              )}

              {partSourceType === "staff" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اختر الأستاذ / الموظف / الإداري *</label>
                  <select
                    value={selectedStaffRefId}
                    onChange={(e) => {
                      setSelectedStaffRefId(e.target.value);
                      const st = allStaff.find(t => t.id === e.target.value);
                      if (st) {
                        setPartFullName(st.fullName);
                        setPartPhone(st.phone);
                        setPartCustomRole(st.roleTitle?.trim() || st.category || st.specialty || "كادر الجمعية");
                      }
                    }}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- اختر كادراً أو موظفاً أو أستاذاً --</option>
                    {allStaff.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} — [{t.roleTitle || t.category || t.specialty || "كادر"}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {partSourceType === "custom" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">الصفة أو المسمى للمشارك (المسمى الوظيفي / الدور) *</label>
                  <input
                    type="text"
                    value={partCustomRole}
                    onChange={(e) => setPartCustomRole(e.target.value)}
                    placeholder="مثال: طالب / محفظ / مؤطر / متطوع / مشارك خارجي..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 font-bold self-center ml-1">اقتراحات سريعة:</span>
                    {[
                      "طالب",
                      "محفظ",
                      "مدير المدرسة المسؤول (المدير التنفيذي)",
                      "رئيس الجمعية",
                      "الكاتب العام للجمعية",
                      "أمين مال الجمعية",
                      "مؤطر",
                      "متطوع",
                      "مشارك خارجي"
                    ].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPartCustomRole(r)}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                          partCustomRole === r
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل للمشارك *</label>
                <input
                  type="text"
                  required
                  value={partFullName}
                  onChange={(e) => setPartFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={partPhone}
                    onChange={(e) => setPartPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجنس</label>
                  <select
                    value={partGender}
                    onChange={(e) => setPartGender(e.target.value as any)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              {/* Fee & Payment Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-800">بيانات المساهمة والأداء</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">المبلغ المطلوب (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partFee}
                      onChange={(e) => setPartFee(Number(e.target.value))}
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">المبلغ المدفوع (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partPaidAmount}
                      onChange={(e) => setPartPaidAmount(Number(e.target.value))}
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">حالة الأداء</label>
                    <select
                      value={partPaymentStatus}
                      onChange={(e) => setPartPaymentStatus(e.target.value as ParticipantPaymentStatus)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="مدفوع">مدفوع بالكامل</option>
                      <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                      <option value="غير مدفوع">غير مدفوع (مستحق)</option>
                      <option value="معفى">معفى من المساهمة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">طريقة الدفع</label>
                    <select
                      value={partPaymentMethod}
                      onChange={(e) => setPartPaymentMethod(e.target.value as any)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="نقداً">نقداً</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="شيك">شيك</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم وصل الأداء</label>
                  <input
                    type="text"
                    value={partReceiptNo}
                    onChange={(e) => setPartReceiptNo(e.target.value)}
                    placeholder="REC-ACT-XXXX"
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات صحية أو حساسية خاصة (اختياري)</label>
                <input
                  type="text"
                  value={partMedicalNotes}
                  onChange={(e) => setPartMedicalNotes(e.target.value)}
                  placeholder="مثال: حساسية ضد الفول السوداني أو الربو..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {editingParticipant ? "حفظ التعديلات" : "تأكيد التسجيل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create / Edit Expense */}
      {showExpenseModal && currentActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" />
                <span>{editingExpense ? "تعديل بيان المصروف" : `تسجيل مصروف لـ "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بيان / عنوان المصروف *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثال: كراء حافلة نقل ممتازة سعة 48 مقعداً"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصنف / الفئة *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ActivityExpenseCategory)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ بالدرهم *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmount || ""}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد أو الشركة</label>
                  <input
                    type="text"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="مثال: شركة الأطلس للنقل"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة / الوصل</label>
                  <input
                    type="text"
                    value={expReceiptNo}
                    onChange={(e) => setExpReceiptNo(e.target.value)}
                    placeholder="FAC-2026-XXXX"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القائم بالأداء / المسؤول</label>
                <input
                  type="text"
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                  placeholder="أمين المال أو المشرف"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {editingExpense ? "حفظ التعديلات" : "تسجيل المصروف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL: Official Moroccan Association Printable Document */}
      {printType && currentActivity && (
        <div
          id="printable-activity-modal-wrapper"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-transparent print:overflow-visible print:block"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden my-6 flex flex-col print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:rounded-none">
            
            {/* Screen Top Action Header (Hidden on Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {printType === "participants-list" && "معاينة طباعة لائحة المشاركين الرسمية"}
                  {printType === "financial-report" && "معاينة طباعة التقرير المالي والمحاسبي للنشاط"}
                  {printType === "participant-ticket" && "معاينة طباعة بطاقة المشارك المعتمدة"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوثيقة الآن</span>
                </button>
                <button
                  onClick={() => setPrintType(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl transition-all cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Container */}
            <div
              id="printable-activity-sheet"
              className="p-8 sm:p-12 space-y-6 bg-white text-slate-900 font-sans print:p-0 print:m-0 print:space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible text-right"
              dir="rtl"
            >
              {/* 1. Official Moroccan Association Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Right Header Section */}
                  <div className="text-right space-y-1">
                    <div className="text-xs font-bold text-slate-500 tracking-wider">المملكة المغربية</div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      {systemSettings?.associationName || "جمعية الفجر الجديد لتحفيظ القرآن الكريم"}
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {systemSettings?.associationAddress || "مقر الجمعية الرئيسي"}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      الهاتف: {systemSettings?.associationPhone || "06.74.633.108"} {systemSettings?.associationEmail ? ` | البريد: ${systemSettings.associationEmail}` : ""}
                    </p>
                  </div>

                  {/* Center Header Section: Logo & Emblem */}
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    {systemSettings?.associationLogo ? (
                      <img
                        src={systemSettings.associationLogo}
                        alt="شعار الجمعية"
                        className="h-16 w-16 object-contain mb-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl mb-1 shadow-sm">
                        <Compass className="w-8 h-8" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-500">
                      إدارة الأنشطة والرحلات المعتمدة
                    </span>
                  </div>

                  {/* Left Header Section: Date, Season & Serial Reference */}
                  <div className="text-left space-y-1">
                    <div className="inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-md">
                      وثيقة إدارية رسمية
                    </div>
                    <div className="text-xs text-slate-700 font-medium mt-1">
                      التاريخ: <span className="font-mono font-bold">{new Date().toLocaleDateString('ar-MA')}</span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      الموسم: <span className="font-bold">{systemSettings?.activeAcademicSeason || "2026/2027"}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      المرجع: ACT-{currentActivity.id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Document Title & Activity Metadata Banner */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 break-inside-avoid">
                <div className="text-center pb-2 border-b border-slate-200">
                  <h1 className="text-lg font-black text-slate-900">
                    {printType === "participants-list" && "لائحة المشاركين والمؤطرين المعتمدة"}
                    {printType === "financial-report" && "التقرير المالي والمحاسبي المعتمد للنشاط"}
                    {printType === "participant-ticket" && "بطاقة وشارة مشارك معتمدة"}
                  </h1>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 font-medium block">اسم النشاط:</span>
                    <span className="font-bold text-slate-900">{currentActivity.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">نوع النشاط:</span>
                    <span className="font-bold text-slate-900">{currentActivity.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">الوجهة أو المكان:</span>
                    <span className="font-bold text-slate-900">{currentActivity.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">تاريخ الانطلاق:</span>
                    <span className="font-bold font-mono text-slate-900">{currentActivity.startDate} {currentActivity.endDate ? `إلى ${currentActivity.endDate}` : ""}</span>
                  </div>
                </div>

                {currentActivity.leaderIds && currentActivity.leaderIds.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">المؤطرون والمشرفون المعتمدون: </span>
                    <span className="font-bold text-slate-800">
                      {allStaff.filter(t => currentActivity.leaderIds.includes(t.id)).map(t => `${t.fullName} (${t.roleTitle || t.category || "مؤطر"})`).join(" • ") || "الإدارة التربوية"}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Document Body Content */}

              {/* OPTION A: Participants List Table */}
              {printType === "participants-list" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                          <th className="p-2.5 border border-slate-400 text-center w-10">#</th>
                          <th className="p-2.5 border border-slate-400">الاسم الكامل للمشارك</th>
                          <th className="p-2.5 border border-slate-400 text-center">الصفة / المسمى الوظيفي</th>
                          <th className="p-2.5 border border-slate-400 text-center">الهاتف</th>
                          <th className="p-2.5 border border-slate-400 text-center">المساهمة الواجبة</th>
                          <th className="p-2.5 border border-slate-400 text-center">المبلغ المؤدى</th>
                          <th className="p-2.5 border border-slate-400 text-center">حالة الأداء</th>
                          <th className="p-2.5 border border-slate-400 text-center">رقم الوصل</th>
                          <th className="p-2.5 border border-slate-400 text-center w-28">توقيع الحضور</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printableParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-slate-500 border border-slate-400">
                              لا يوجد مشاركون مسجلون في هذا النشاط بعد.
                            </td>
                          </tr>
                        ) : (
                          printableParticipants.map((p, i) => {
                            const feeVal = resolveParticipantFee(p);
                            const paidVal = resolveParticipantPaid(p);
                            const statusInfo = resolvePaymentStatusInfo(p);

                            return (
                              <tr key={p.id} className={i % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                                <td className="p-2 border border-slate-400 text-center font-mono font-bold text-slate-700">{i + 1}</td>
                                <td className="p-2 border border-slate-400 font-bold text-slate-900">{p.fullName}</td>
                                <td className="p-2 border border-slate-400 text-center font-bold text-slate-800">{getParticipantRole(p)}</td>
                                <td className="p-2 border border-slate-400 text-center font-mono text-slate-700">{p.phone || "—"}</td>
                                <td className="p-2 border border-slate-400 text-center font-mono text-slate-800 font-bold">
                                  {statusInfo.status === "معفى" && feeVal === 0 ? "معفى (0 د.م)" : `${feeVal.toLocaleString()} د.م`}
                                </td>
                                <td className="p-2 border border-slate-400 text-center font-mono font-bold text-emerald-800">
                                  {paidVal.toLocaleString()} د.م
                                </td>
                                <td className="p-2 border border-slate-400 text-center font-bold">
                                  <span className={statusInfo.colorClass}>
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-400 text-center font-mono text-slate-600">{p.receiptNo || "—"}</td>
                                <td className="p-2 border border-slate-400"></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {printableParticipants.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                            <td colSpan={4} className="p-2.5 border border-slate-400 text-right">
                              المجموع العام: {printableParticipants.length} مشارك ومؤطر
                            </td>
                            <td className="p-2.5 border border-slate-400 text-center font-mono font-bold text-slate-900">
                              {printableParticipants.reduce((sum, p) => sum + resolveParticipantFee(p), 0).toLocaleString()} د.م
                            </td>
                            <td className="p-2.5 border border-slate-400 text-center font-mono text-emerald-900 font-extrabold">
                              {printableParticipants.reduce((sum, p) => sum + resolveParticipantPaid(p), 0).toLocaleString()} د.م
                            </td>
                            <td colSpan={3} className="p-2.5 border border-slate-400 text-center text-[11px] text-slate-700 font-semibold">
                              {(() => {
                                const paidCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "مدفوع").length;
                                const partialCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "مدفوع جزئياً").length;
                                const exemptCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "معفى").length;
                                const unpaidCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "غير مدفوع").length;

                                return (
                                  <span>
                                    مدفوع: <strong className="text-emerald-800">{paidCount}</strong> | 
                                    مدفوع جزئياً: <strong className="text-amber-800">{partialCount}</strong> | 
                                    معفى: <strong className="text-blue-800">{exemptCount}</strong> | 
                                    غير مدفوع: <strong className="text-rose-800">{unpaidCount}</strong>
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* OPTION B: Financial Report Table */}
              {printType === "financial-report" && (
                <div className="space-y-6">
                  {/* Financial Balance Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 text-center break-inside-avoid">
                    <div className="border border-emerald-300 p-3.5 rounded-xl bg-emerald-50/70">
                      <div className="text-xs font-bold text-emerald-900">إجمالي المداخيل المحصلة</div>
                      <div className="text-xl font-extrabold text-emerald-800 mt-1 font-mono">
                        {currentFinances.totalCollected.toLocaleString()} د.م
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">مساهمات المشاركين المسجلة</div>
                    </div>
                    
                    <div className="border border-rose-300 p-3.5 rounded-xl bg-rose-50/70">
                      <div className="text-xs font-bold text-rose-900">إجمالي المصاريف والنفقات</div>
                      <div className="text-xl font-extrabold text-rose-800 mt-1 font-mono">
                        {currentFinances.totalSpent.toLocaleString()} د.م
                      </div>
                      <div className="text-[10px] text-rose-700 mt-0.5 font-medium">جميع فواتير وأوصال الصرف</div>
                    </div>

                    <div className={`border p-3.5 rounded-xl ${currentFinances.netBalance >= 0 ? "border-emerald-300 bg-emerald-50/40" : "border-amber-300 bg-amber-50/40"}`}>
                      <div className="text-xs font-bold text-slate-900">الصافي المالي للنشاط</div>
                      <div className={`text-xl font-extrabold mt-1 font-mono ${currentFinances.netBalance >= 0 ? "text-emerald-800" : "text-amber-800"}`}>
                        {currentFinances.netBalance >= 0 ? `+${currentFinances.netBalance.toLocaleString()}` : currentFinances.netBalance.toLocaleString()} د.م
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                        {currentFinances.netBalance >= 0 ? "فائض مالي يُرحّل للخزينة" : "عجز مالي مغطى من صندوق الجمعية"}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Expenses Table */}
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-slate-900">تفاصيل بنود المصاريف والنفقات المنفذة:</div>
                    <table className="w-full text-right text-xs border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                          <th className="p-2.5 border border-slate-400 text-center w-10">#</th>
                          <th className="p-2.5 border border-slate-400">بيان / عنوان المصروف</th>
                          <th className="p-2.5 border border-slate-400 text-center">الصنف / الفئة</th>
                          <th className="p-2.5 border border-slate-400 text-center">المبلغ (د.م)</th>
                          <th className="p-2.5 border border-slate-400 text-center">طريقة الدفع</th>
                          <th className="p-2.5 border border-slate-400 text-center">المورد / الجهة</th>
                          <th className="p-2.5 border border-slate-400 text-center">رقم الفاتورة / الوصل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-500 border border-slate-400">
                              لا توجد مصاريف مسجلة لهذا النشاط بعد.
                            </td>
                          </tr>
                        ) : (
                          currentExpenses.map((e, idx) => (
                            <tr key={e.id} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                              <td className="p-2 border border-slate-400 text-center font-mono font-bold text-slate-700">{idx + 1}</td>
                              <td className="p-2 border border-slate-400 font-bold text-slate-900">{e.title}</td>
                              <td className="p-2 border border-slate-400 text-center font-medium text-slate-700">{e.category}</td>
                              <td className="p-2 border border-slate-400 text-center font-mono font-bold text-rose-800">{e.amount.toLocaleString()} د.م</td>
                              <td className="p-2 border border-slate-400 text-center text-slate-700">{e.paymentMethod}</td>
                              <td className="p-2 border border-slate-400 text-center text-slate-700">{e.supplier || "—"}</td>
                              <td className="p-2 border border-slate-400 text-center font-mono text-slate-600">{e.receiptOrInvoiceNo || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {currentExpenses.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                            <td colSpan={3} className="p-2.5 border border-slate-400 text-right">
                              مجموع النفقات والمصاريف:
                            </td>
                            <td className="p-2.5 border border-slate-400 text-center font-mono text-rose-900 font-extrabold">
                              {currentFinances.totalSpent.toLocaleString()} د.م
                            </td>
                            <td colSpan={3} className="p-2.5 border border-slate-400 text-center text-[11px] text-slate-600">
                              عدد فواتير وأوصال المصاريف: {currentExpenses.length}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Accounting Statement Note */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed break-inside-avoid">
                    <span className="font-bold text-slate-900 block mb-1">إشهاد ومصادقة محاسبية:</span>
                    يشهد المكتب التنفيذي للجمعية أن جميع المداخيل والمصاريف المذكورة أعلاه صحيحة ومدعمة بالوثائق الإثباتية والفواتير القانونية، وتم تقييد الصافي المالي ضمن الحسابات الجمعوية المعتمدة.
                  </div>
                </div>
              )}

              {/* OPTION C: Single Participant Pass Ticket */}
              {printType === "participant-ticket" && selectedParticipantForTicket && (
                <div className="border-2 border-slate-900 rounded-2xl p-6 bg-slate-50 text-right space-y-4 max-w-md mx-auto break-inside-avoid shadow-sm">
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div>
                      <span className="bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                        شارة مشارك معتمدة
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">{selectedParticipantForTicket.fullName}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">الصفة / المسمى الوظيفي:</span>
                      <span className="font-bold text-slate-800">{getParticipantRole(selectedParticipantForTicket)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">الهاتف:</span>
                      <span className="font-bold font-mono text-slate-800">{selectedParticipantForTicket.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">النشاط / الرحلة:</span>
                      <span className="font-bold text-slate-800">{currentActivity.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">تاريخ الانطلاق:</span>
                      <span className="font-bold font-mono text-slate-800">{currentActivity.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">المساهمة المؤداة:</span>
                      <span className="font-bold font-mono text-emerald-800">{selectedParticipantForTicket.paidAmount} د.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">رقم الوصل:</span>
                      <span className="font-bold font-mono text-slate-800">{selectedParticipantForTicket.receiptNo || "خالص"}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
                    <span>خاتم وتأشيرة الإدارة:</span>
                    <span className="font-mono">{new Date().toLocaleDateString('ar-MA')}</span>
                  </div>
                  <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                    موضع خاتم وتأشيرة المشرف العام
                  </div>
                </div>
              )}

              {/* 4. Official Signatures & Seal Section */}
              <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center break-inside-avoid">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">المشرف العام / الكاتب العام</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {systemSettings?.generalSupervisorName || systemSettings?.secretaryGeneralName || "...................."}
                  </div>
                  <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[10px] text-slate-400">توقيع المشرف</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">أمين مال الجمعية</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {systemSettings?.treasurerName || "...................."}
                  </div>
                  <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[10px] text-slate-400">توقيع أمين المال</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">رئيس الجمعية</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {systemSettings?.presidentName || "...................."}
                  </div>
                  <div className="h-16 border border-dashed border-slate-400 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-slate-400">الخاتم الرسمي والتوقيع</span>
                  </div>
                </div>
              </div>

              {/* 5. Document Micro Footer */}
              <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 break-inside-avoid">
                وثيقة إدارية ومحاسبية رسمية صادرة عن منظومة الجمعية • {systemSettings?.associationName || "جمعية الفجر الجديد لتحفيظ القرآن الكريم"} • صفحة معتمدة
              </div>
            </div>

            {/* Screen Bottom Action Toolbar (Hidden on Print) */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
              <button
                onClick={() => setPrintType(null)}
                className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  ملاحظة: اضغط على طباعة لفتح نافذة الطابعة بحجم A4 المعتمد
                </span>
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوثيقة الآن</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
