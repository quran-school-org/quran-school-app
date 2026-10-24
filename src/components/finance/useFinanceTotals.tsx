/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { openPrintWindow } from "../../print/printWindow";
import { useMemo } from "react";
import type { useFinanceForms } from "./useFinanceForms";

export function useFinanceTotals(s: ReturnType<typeof useFinanceForms>) {
  const {
    students,
    payments,
    otherIncomes,
    salaryPayments,
    expenses,
    activities,
    activityParticipants,
    activityExpenses,
    selectedYear,
    selectedMonthFilter,
    selectedIncomeCategory,
    searchQuery,
    incomeSortKey,
    incomeSortDir,
    studentPaySortKey,
    studentPaySortDir,
    salarySortKey,
    salarySortDir,
    expenseSortKey,
    expenseSortDir,
  } = s;

  // ================= CALCULATIONS & SUMMARIES =================

  // Filtered Student Payments (Paid fees)
  const paidStudentPayments = useMemo(() => {
    return payments.filter(p => {
      if (p.status !== "مدفوع") return false;
      if (selectedYear !== "all" && p.year.toString() !== selectedYear) return false;
      if (selectedMonthFilter !== "all" && p.month !== selectedMonthFilter) return false;
      if (searchQuery) {
        const student = students.find(s => s.id === p.studentId);
        const nameMatch = student ? student.fullName.includes(searchQuery) : false;
        const receiptMatch = p.receiptNo ? p.receiptNo.includes(searchQuery) : false;
        return nameMatch || receiptMatch;
      }
      return true;
    });
  }, [payments, selectedYear, selectedMonthFilter, searchQuery, students]);

  const totalStudentFeesAmount = useMemo(() => {
    return paidStudentPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [paidStudentPayments]);

  // Filtered Activities and Live Activity Participants & Expenses
  const safeActivities = activities || [];
  const safeParticipants = activityParticipants || [];
  const safeActivityExpenses = activityExpenses || [];

  const filteredActivities = useMemo(() => {
    return safeActivities.filter(act => {
      const year = act.startDate ? act.startDate.split("-")[0] : (act.createdAt ? act.createdAt.split("-")[0] : "");
      if (selectedYear !== "all" && year && year !== selectedYear) return false;
      if (searchQuery) {
        const matchTitle = act.title.includes(searchQuery);
        const matchLocation = act.location ? act.location.includes(searchQuery) : false;
        return matchTitle || matchLocation;
      }
      return true;
    });
  }, [safeActivities, selectedYear, searchQuery]);

  const filteredActivityParticipants = useMemo(() => {
    const validActIds = new Set(filteredActivities.map(a => a.id));
    return safeParticipants.filter(p => validActIds.has(p.activityId));
  }, [safeParticipants, filteredActivities]);

  const filteredActivityExpenses = useMemo(() => {
    const validActIds = new Set(filteredActivities.map(a => a.id));
    return safeActivityExpenses.filter(e => validActIds.has(e.activityId));
  }, [safeActivityExpenses, filteredActivities]);

  // Total Activity Contributions Collected (المساهمات المحصلة من الأنشطة)
  const totalActivityContributions = useMemo(() => {
    return filteredActivityParticipants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  }, [filteredActivityParticipants]);

  const totalActivityExpectedFees = useMemo(() => {
    return filteredActivityParticipants.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
  }, [filteredActivityParticipants]);

  // Total Activity Expenses (مصاريف ونفقات الأنشطة والرحلات)
  const totalActivityExpenses = useMemo(() => {
    return filteredActivityExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredActivityExpenses]);

  // Filtered Other Incomes (excluding legacy synthetic sync entries)
  const filteredOtherIncomes = useMemo(() => {
    return otherIncomes.filter(inc => {
      if (inc.id.startsWith("inc_act_")) return false; // Handled directly via live activity contributions
      const year = inc.date.split("-")[0];
      if (selectedYear !== "all" && year !== selectedYear) return false;
      if (selectedIncomeCategory !== "all" && inc.category !== selectedIncomeCategory) return false;
      if (searchQuery) {
        const matchTitle = inc.title.includes(searchQuery);
        const matchDonor = inc.donorName ? inc.donorName.includes(searchQuery) : false;
        const matchReceipt = inc.receiptNo ? inc.receiptNo.includes(searchQuery) : false;
        const matchCategory = inc.category ? inc.category.includes(searchQuery) : false;
        return matchTitle || matchDonor || matchReceipt || matchCategory;
      }
      return true;
    });
  }, [otherIncomes, selectedYear, selectedIncomeCategory, searchQuery]);

  const totalOtherIncomeAmount = useMemo(() => {
    return filteredOtherIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [filteredOtherIncomes]);

  // Gross Total Income = Student Fees + Other Incomes + Activity Contributions!
  const grossTotalIncome = totalStudentFeesAmount + totalOtherIncomeAmount + totalActivityContributions;

  // Filtered Salary Payments
  const filteredSalaries = useMemo(() => {
    return salaryPayments.filter(s => {
      if (selectedYear !== "all" && s.year.toString() !== selectedYear) return false;
      if (selectedMonthFilter !== "all" && s.month !== selectedMonthFilter) return false;
      if (searchQuery) {
        const matchName = s.personName.includes(searchQuery);
        const matchRole = s.roleTitle ? s.roleTitle.includes(searchQuery) : false;
        return matchName || matchRole;
      }
      return true;
    });
  }, [salaryPayments, selectedYear, selectedMonthFilter, searchQuery]);

  const totalPaidSalaries = useMemo(() => {
    return filteredSalaries
      .filter(s => s.status === "تم الصرف")
      .reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSalaries]);

  const totalPendingSalaries = useMemo(() => {
    return filteredSalaries
      .filter(s => s.status === "مستحق (قيد الانتظار)")
      .reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSalaries]);

  // Filtered Operational Expenses (excluding legacy synthetic sync entries)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (exp.id.startsWith("exp_sync_act_")) return false; // Handled directly via live activity expenses
      const year = exp.date.split("-")[0];
      if (selectedYear !== "all" && year !== selectedYear) return false;
      if (searchQuery) {
        const matchTitle = exp.title.includes(searchQuery);
        const matchSupplier = exp.supplier ? exp.supplier.includes(searchQuery) : false;
        const matchInvoice = exp.invoiceNo ? exp.invoiceNo.includes(searchQuery) : false;
        return matchTitle || matchSupplier || matchInvoice;
      }
      return true;
    });
  }, [expenses, selectedYear, searchQuery]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  // Sorted Collections
  const sortedOtherIncomes = useMemo(() => {
    if (!incomeSortKey) return filteredOtherIncomes;
    return [...filteredOtherIncomes].sort((a, b) => {
      let valA = (a as any)[incomeSortKey];
      let valB = (b as any)[incomeSortKey];
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return incomeSortDir === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return incomeSortDir === "asc"
        ? strA.localeCompare(strB, "ar", { numeric: true })
        : strB.localeCompare(strA, "ar", { numeric: true });
    });
  }, [filteredOtherIncomes, incomeSortKey, incomeSortDir]);

  const sortedStudentPayments = useMemo(() => {
    if (!studentPaySortKey) return paidStudentPayments;
    return [...paidStudentPayments].sort((a, b) => {
      let valA: any;
      let valB: any;
      if (studentPaySortKey === "studentName") {
        valA = students.find(s => s.id === a.studentId)?.fullName || "";
        valB = students.find(s => s.id === b.studentId)?.fullName || "";
      } else if (studentPaySortKey === "monthYear") {
        valA = `${a.year}-${a.month}`;
        valB = `${b.year}-${b.month}`;
      } else {
        valA = (a as any)[studentPaySortKey];
        valB = (b as any)[studentPaySortKey];
      }

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return studentPaySortDir === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return studentPaySortDir === "asc"
        ? strA.localeCompare(strB, "ar", { numeric: true })
        : strB.localeCompare(strA, "ar", { numeric: true });
    });
  }, [paidStudentPayments, studentPaySortKey, studentPaySortDir, students]);

  const sortedSalaries = useMemo(() => {
    if (!salarySortKey) return filteredSalaries;
    return [...filteredSalaries].sort((a, b) => {
      let valA: any = (a as any)[salarySortKey];
      let valB: any = (b as any)[salarySortKey];
      if (salarySortKey === "monthYear") {
        valA = `${a.year}-${a.month}`;
        valB = `${b.year}-${b.month}`;
      }
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return salarySortDir === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return salarySortDir === "asc"
        ? strA.localeCompare(strB, "ar", { numeric: true })
        : strB.localeCompare(strA, "ar", { numeric: true });
    });
  }, [filteredSalaries, salarySortKey, salarySortDir]);

  const sortedExpenses = useMemo(() => {
    if (!expenseSortKey) return filteredExpenses;
    return [...filteredExpenses].sort((a, b) => {
      let valA = (a as any)[expenseSortKey];
      let valB = (b as any)[expenseSortKey];
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return expenseSortDir === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return expenseSortDir === "asc"
        ? strA.localeCompare(strB, "ar", { numeric: true })
        : strB.localeCompare(strA, "ar", { numeric: true });
    });
  }, [filteredExpenses, expenseSortKey, expenseSortDir]);

  // Combined Gross Total Expenses = Paid Salaries + General Expenses + Activity Expenses!
  const grossTotalExpenses = totalPaidSalaries + totalExpensesAmount + totalActivityExpenses;

  // Net Balance = Gross Income - Gross Expenses
  const netBalance = grossTotalIncome - grossTotalExpenses;

  // Breakdown by Cash Box vs Bank Account
  const cashBoxIncome = useMemo(() => {
    const studentCash = paidStudentPayments
      .filter(p => !p.paymentMethod || p.paymentMethod === "نقداً")
      .reduce((sum, p) => sum + p.amount, 0);
    const otherCash = filteredOtherIncomes
      .filter(inc => inc.source === "الصندوق")
      .reduce((sum, inc) => sum + inc.amount, 0);
    const actCash = filteredActivityParticipants
      .filter(p => !p.paymentMethod || p.paymentMethod === "نقداً")
      .reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    return studentCash + otherCash + actCash;
  }, [paidStudentPayments, filteredOtherIncomes, filteredActivityParticipants]);

  const bankAccountIncome = useMemo(() => {
    const studentBank = paidStudentPayments
      .filter(p => p.paymentMethod === "تحويل بنكي" || p.paymentMethod === "شيك")
      .reduce((sum, p) => sum + p.amount, 0);
    const otherBank = filteredOtherIncomes
      .filter(inc => inc.source === "حساب الجمعية البنكي")
      .reduce((sum, inc) => sum + inc.amount, 0);
    const actBank = filteredActivityParticipants
      .filter(p => p.paymentMethod === "تحويل بنكي" || p.paymentMethod === "شيك")
      .reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    return studentBank + otherBank + actBank;
  }, [paidStudentPayments, filteredOtherIncomes, filteredActivityParticipants]);

  const cashBoxExpenses = useMemo(() => {
    const salaryCash = filteredSalaries
      .filter(s => s.status === "تم الصرف" && s.paymentSource === "الصندوق")
      .reduce((sum, s) => sum + s.amount, 0);
    const expCash = filteredExpenses
      .filter(exp => exp.source === "الصندوق")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const actExpCash = filteredActivityExpenses
      .filter(e => !e.paymentMethod || e.paymentMethod === "نقداً")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return salaryCash + expCash + actExpCash;
  }, [filteredSalaries, filteredExpenses, filteredActivityExpenses]);

  const bankAccountExpenses = useMemo(() => {
    const salaryBank = filteredSalaries
      .filter(s => s.status === "تم الصرف" && s.paymentSource === "حساب الجمعية البنكي")
      .reduce((sum, s) => sum + s.amount, 0);
    const expBank = filteredExpenses
      .filter(exp => exp.source === "حساب الجمعية البنكي")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const actExpBank = filteredActivityExpenses
      .filter(e => e.paymentMethod === "تحويل بنكي" || e.paymentMethod === "شيك")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return salaryBank + expBank + actExpBank;
  }, [filteredSalaries, filteredExpenses, filteredActivityExpenses]);

  const cashBoxNetBalance = cashBoxIncome - cashBoxExpenses;
  const bankAccountNetBalance = bankAccountIncome - bankAccountExpenses;

  // Print Report Handler
  const handlePrint = () => {
    const reportElement = document.getElementById("printable-financial-statement");
    if (!reportElement) {
      window.print();
      return;
    }

    // Aperçu rendu par React (donc échappé), imprimé avec les styles de l'application.
    const w = openPrintWindow({
      title: "التقرير المالي والختامي - " + selectedYear,
      body: '<main style="max-width: 56rem; margin: 0 auto; padding: 24px;">' + reportElement.innerHTML + "</main>",
      css: "@page { size: A4 portrait; margin: 12mm 10mm; } body { background: #fff !important; } table, tr, .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; } .no-print { display: none !important; }",
      withAppStyles: true,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.",
      delay: 800,
    });
    if (!w) window.print();
  };

  return {
    paidStudentPayments,
    totalStudentFeesAmount,
    safeActivities,
    safeParticipants,
    safeActivityExpenses,
    filteredActivities,
    filteredActivityParticipants,
    filteredActivityExpenses,
    totalActivityContributions,
    totalActivityExpectedFees,
    totalActivityExpenses,
    filteredOtherIncomes,
    totalOtherIncomeAmount,
    grossTotalIncome,
    filteredSalaries,
    totalPaidSalaries,
    totalPendingSalaries,
    filteredExpenses,
    totalExpensesAmount,
    sortedOtherIncomes,
    sortedStudentPayments,
    sortedSalaries,
    sortedExpenses,
    grossTotalExpenses,
    netBalance,
    cashBoxIncome,
    bankAccountIncome,
    cashBoxExpenses,
    bankAccountExpenses,
    cashBoxNetBalance,
    bankAccountNetBalance,
    handlePrint,
  };
}
