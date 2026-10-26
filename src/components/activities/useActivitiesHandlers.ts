/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, {  } from "react";
import { ActivityTrip, ActivityParticipant, ActivityExpense, ParticipantType } from "../../types";
import type { useActivitiesForms } from "./useActivitiesForms";
import type { useActivitiesData } from "./useActivitiesData";
import { formatMoney } from "../../utils/format";
import { useToast } from "../../ui";

export function useActivitiesHandlers(s: ReturnType<typeof useActivitiesForms> & ReturnType<typeof useActivitiesData>) {
  const toast = useToast();
  const {
    students,
    teachers,
    systemSettings,
    onSaveActivity,
    onSaveParticipant,
    onSaveActivityExpense,
    onSyncToFinance,
    selectedActivityId,
    setSelectedActivityId,
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
    setShowExpenseModal,
    editingExpense,
    setEditingExpense,
    expTitle,
    setExpTitle,
    setExpErrors,
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
    allStaff,
    getParticipantRole,
    currentActivity,
    currentFinances,
  } = s;

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
      toast.error("يرجى إدخال عنوان أو اسم النشاط/الرحلة.");
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
      toast.error("يرجى تحديد أو كتابة اسم المشارك.");
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
    setExpErrors({});
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
    setExpErrors({});
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
    setExpErrors({});
    if (!expTitle.trim()) {
      setExpErrors({ title: "يرجى إدخال وصف أو اسم المصروف." });
      return;
    }
    if (expAmount <= 0) {
      setExpErrors({ amount: "يرجى إدخال مبلغ المصروف بشكل صحيح." });
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
    toast.success(`✅ الربط المالي التلقائي نشط ومباشر!\n\nتم التحقق من مزامنة نشاط "${currentActivity.title}" لحظياً مع قيود المحاسبة والمالية الجمعوية:\n• إجمالي المساهمات المحصلة: ${formatMoney(totalCollected)}\n• إجمالي المصاريف الفعلية: ${formatMoney(totalSpent)}\n• الصافي المقيد تلقائياً: ${netBalance > 0 ? `فائض +${formatMoney(netBalance)}` : netBalance < 0 ? `عجز ${formatMoney(netBalance)}` : "متوازن (0 د.م)"}`);
  };

  return {
    handleOpenAddActivity,
    handleOpenEditActivity,
    handleSaveActivityForm,
    handleOpenAddParticipant,
    handleOpenEditParticipant,
    handleSaveParticipantForm,
    handleOpenAddExpense,
    handleOpenEditExpense,
    handleSaveExpenseForm,
    handleSyncActivityFinance,
  };
}
