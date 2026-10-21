/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState, useMemo } from "react";
import { ActivityTrip, ActivityParticipant, ActivityExpense, ActivityType, ActivityStatus, ParticipantPaymentStatus, ActivityExpenseCategory } from "../../types";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import type { ActivitiesManagementProps } from "../ActivitiesManagement";

export function useActivitiesForms(props: ActivitiesManagementProps) {
  const {
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
  } = props;

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
        className={`p-3 cursor-pointer select-none hover:bg-sand-200/80 transition rounded-lg ${
          align === "center" ? "text-center" : "text-right"
        }`}
        title={`ترتيب حسب ${label} (انقر للتبديل بين التصاعدي والتنازلي)`}
      >
        <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : "justify-start"}`}>
          <span>{label}</span>
          {isActive ? (
            currentDir === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-primary-800 font-bold shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-primary-800 font-bold shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-sand-500 opacity-60 hover:opacity-100 shrink-0" />
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

  return {
    activities,
    participants,
    activityExpenses,
    students,
    teachers,
    classes,
    systemSettings,
    canManageActivities,
    canCreateActivity,
    canUpdateActivity,
    canDeleteActivity,
    canPrintActivity,
    onSaveActivity,
    onDeleteActivity,
    onSaveParticipant,
    onDeleteParticipant,
    onSaveActivityExpense,
    onDeleteActivityExpense,
    onSyncToFinance,
    onNavigateToFinance,
    selectedActivityId,
    setSelectedActivityId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    activitySortKey,
    setActivitySortKey,
    activitySortDir,
    setActivitySortDir,
    partSearchQuery,
    setPartSearchQuery,
    partTypeFilter,
    setPartTypeFilter,
    partStatusFilter,
    setPartStatusFilter,
    partSortKey,
    setPartSortKey,
    partSortDir,
    setPartSortDir,
    expSearchQuery,
    setExpSearchQuery,
    expCategoryFilter,
    setExpCategoryFilter,
    expSortKey,
    setExpSortKey,
    expSortDir,
    setExpSortDir,
    handleToggleSort,
    renderSortableHeader,
    showActivityModal,
    setShowActivityModal,
    editingActivity,
    setEditingActivity,
    formTitle,
    setFormTitle,
    formType,
    setFormType,
    formStartDate,
    setFormStartDate,
    formEndDate,
    setFormEndDate,
    formLocation,
    setFormLocation,
    formLeaderIds,
    setFormLeaderIds,
    formContributionFee,
    setFormContributionFee,
    formMaxCapacity,
    setFormMaxCapacity,
    formStatus,
    setFormStatus,
    formTargetAudience,
    setFormTargetAudience,
    formDescription,
    setFormDescription,
    formProgramDetails,
    setFormProgramDetails,
    formMeetingPoint,
    setFormMeetingPoint,
    showParticipantModal,
    setShowParticipantModal,
    editingParticipant,
    setEditingParticipant,
    partSourceType,
    setPartSourceType,
    selectedStudentRefId,
    setSelectedStudentRefId,
    selectedStaffRefId,
    setSelectedStaffRefId,
    partFullName,
    setPartFullName,
    partCustomRole,
    setPartCustomRole,
    partPhone,
    setPartPhone,
    partGender,
    setPartGender,
    partFee,
    setPartFee,
    partPaidAmount,
    setPartPaidAmount,
    partPaymentStatus,
    setPartPaymentStatus,
    partPaymentMethod,
    setPartPaymentMethod,
    partReceiptNo,
    setPartReceiptNo,
    partHasParentApproval,
    setPartHasParentApproval,
    partMedicalNotes,
    setPartMedicalNotes,
    partNotes,
    setPartNotes,
    showExpenseModal,
    setShowExpenseModal,
    editingExpense,
    setEditingExpense,
    expTitle,
    setExpTitle,
    expCategory,
    setExpCategory,
    expAmount,
    setExpAmount,
    expDate,
    setExpDate,
    expPaymentMethod,
    setExpPaymentMethod,
    expPaidBy,
    setExpPaidBy,
    expReceiptNo,
    setExpReceiptNo,
    expSupplier,
    setExpSupplier,
    expNotes,
    setExpNotes,
    printType,
    setPrintType,
    selectedParticipantForTicket,
    setSelectedParticipantForTicket,
  };
}
