/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState, useMemo } from "react";
import { ActivityParticipant, Teacher, ParticipantPaymentStatus } from "../../types";
import type { useActivitiesForms } from "./useActivitiesForms";

export function useActivitiesData(s: ReturnType<typeof useActivitiesForms>) {
  const {
    activities,
    participants,
    activityExpenses,
    teachers,
    systemSettings,
    selectedActivityId,
    searchQuery,
    typeFilter,
    statusFilter,
    activitySortKey,
    activitySortDir,
    partSearchQuery,
    partTypeFilter,
    partStatusFilter,
    partSortKey,
    partSortDir,
    expSearchQuery,
    expCategoryFilter,
    expSortKey,
    expSortDir,
  } = s;

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
        colorClass: "text-primary-800",
        badgeClass: "bg-primary-100 text-primary-800 border-primary-200"
      };
    }

    if (rawStatus === "مدفوع" || rawStatus === "مؤدى بالكامل" || rawStatus === "خالص" || (paid >= fee && fee > 0)) {
      return {
        label: "مدفوع",
        shortLabel: "مدفوع",
        status: "مدفوع" as ParticipantPaymentStatus,
        colorClass: "text-primary-800",
        badgeClass: "bg-primary-100 text-primary-800 border-primary-200"
      };
    }

    if (rawStatus === "مدفوع جزئياً" || rawStatus === "مؤدى جزئياً" || rawStatus === "تسبيق" || (paid > 0 && paid < fee)) {
      return {
        label: "مدفوع جزئياً",
        shortLabel: "مدفوع جزئياً",
        status: "مدفوع جزئياً" as ParticipantPaymentStatus,
        colorClass: "text-gold-800",
        badgeClass: "bg-gold-100 text-gold-800 border-gold-200"
      };
    }

    return {
      label: "غير مدفوع",
      shortLabel: "غير مدفوع",
      status: "غير مدفوع" as ParticipantPaymentStatus,
      colorClass: "text-danger-800",
      badgeClass: "bg-danger-100 text-danger-800 border-danger-200"
    };
  };
  const getRoleBadgeStyle = (role: string) => {
    const rank = getRoleRank(role);
    switch (rank) {
      case 1: // طالب
        return "bg-primary-100 text-primary-800 border-primary-200";
      case 2: // محفظ / أستاذ
        return "bg-primary-100 text-primary-800 border-primary-200";
      case 3: // مدير المدرسة المسؤول (المدير التنفيذي)
        return "bg-primary-100 text-primary-900 border-primary-200";
      case 4: // رئيس الجمعية
        return "bg-gold-100 text-gold-900 border-gold-200";
      case 5: // الكاتب العام للجمعية
        return "bg-primary-100 text-primary-900 border-primary-200";
      case 6: // أمين مال الجمعية
        return "bg-primary-100 text-primary-900 border-primary-200";
      case 7: // مؤطر
        return "bg-primary-100 text-primary-900 border-primary-200";
      case 8: // متطوع
        return "bg-gold-100 text-gold-900 border-gold-200";
      case 9: // مشارك خارجي
      default:
        return "bg-sand-100 text-sand-700 border-sand-200";
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

  return {
    allStaff,
    getParticipantRole,
    getRoleRank,
    resolveParticipantFee,
    resolveParticipantPaid,
    resolvePaymentStatusInfo,
    getRoleBadgeStyle,
    currentActivity,
    currentParticipants,
    availablePartRoles,
    printableParticipants,
    currentExpenses,
    currentFinances,
    globalStats,
    filteredActivities,
    filteredParticipants,
    filteredExpenses,
  };
}
