/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import React, { useState } from "react";
import { OtherIncome, SalaryPayment, Expense } from "../../types";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { FinanceManagementProps } from "../FinanceManagement";
import { useConfirm, useToast } from "../../ui";

export function useFinanceForms(props: FinanceManagementProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const {
  students,
  teachers,
  payments,
  otherIncomes,
  salaryPayments,
  expenses,
  activities = [],
  activityParticipants = [],
  activityExpenses = [],
  systemSettings,
  canEditPayments,
  canCreateFinance,
  canUpdateFinance,
  canDeleteFinance,
  canPrintFinance,
  onSaveOtherIncome,
  onDeleteOtherIncome,
  onSaveSalaryPayment,
  onDeleteSalaryPayment,
  onSaveExpense,
  onDeleteExpense,
  onNavigateToActivities
  } = props;

  const canManage = canEditPayments !== false;
  const canCreate = canCreateFinance ?? canManage;
  const canUpdate = canUpdateFinance ?? canManage;
  const canDelete = canDeleteFinance ?? canManage;
  const canPrint = canPrintFinance ?? canManage;
  // Active Section / Tab inside Finance
  const [activeSubTab, setActiveSubTab] = useState<"revenues" | "salaries" | "expenses" | "report">("revenues");

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Column Sorting States
  const [incomeSortKey, setIncomeSortKey] = useState<string | null>(null);
  const [incomeSortDir, setIncomeSortDir] = useState<"asc" | "desc">("asc");

  const [studentPaySortKey, setStudentPaySortKey] = useState<string | null>(null);
  const [studentPaySortDir, setStudentPaySortDir] = useState<"asc" | "desc">("asc");

  const [salarySortKey, setSalarySortKey] = useState<string | null>(null);
  const [salarySortDir, setSalarySortDir] = useState<"asc" | "desc">("asc");

  const [expenseSortKey, setExpenseSortKey] = useState<string | null>(null);
  const [expenseSortDir, setExpenseSortDir] = useState<"asc" | "desc">("asc");

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
        title={`ترتيب حسب ${label} (من الأصغر للأكبر أو العكس)`}
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
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-3 opacity-60 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Modals state
  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);

  const [showSalaryModal, setShowSalaryModal] = useState<boolean>(false);
  const [editingSalary, setEditingSalary] = useState<SalaryPayment | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);

  // --- Income Form State ---
  const [incomeTitle, setIncomeTitle] = useState("");
  const [incomeCategory, setIncomeCategory] = useState<OtherIncome["category"]>("تبرعات");
  const [incomeAmount, setIncomeAmount] = useState<number>(1000);
  const [incomeDate, setIncomeDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [incomeSource, setIncomeSource] = useState<OtherIncome["source"]>("الصندوق");
  const [incomeDonorName, setIncomeDonorName] = useState("");
  const [incomeReceiptNo, setIncomeReceiptNo] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");

  // --- Salary Form State ---
  const [salaryPersonType, setSalaryPersonType] = useState<SalaryPayment["personType"]>("أستاذ / محفظ");
  const [salaryPersonId, setSalaryPersonId] = useState<string>("");
  const [salaryPersonName, setSalaryPersonName] = useState<string>("");
  const [salaryRoleTitle, setSalaryRoleTitle] = useState<string>("");
  const [salaryAmount, setSalaryAmount] = useState<number>(2500);
  const [salaryMonth, setSalaryMonth] = useState<string>("يوليوز");
  const [salaryYear, setSalaryYear] = useState<number>(new Date().getFullYear());
  const [salaryPaymentDate, setSalaryPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState<SalaryPayment["paymentMethod"]>("نقداً");
  const [salaryPaymentSource, setSalaryPaymentSource] = useState<SalaryPayment["paymentSource"]>("الصندوق");
  const [salaryReceiptNo, setSalaryReceiptNo] = useState<string>("");
  const [salaryStatus, setSalaryStatus] = useState<SalaryPayment["status"]>("تم الصرف");
  const [salaryNotes, setSalaryNotes] = useState<string>("");

  // --- Expense Form State ---
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<Expense["category"]>("فواتير وخدمات");
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [expenseSource, setExpenseSource] = useState<Expense["source"]>("الصندوق");
  const [expenseInvoiceNo, setExpenseInvoiceNo] = useState("");
  const [expenseSupplier, setExpenseSupplier] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  // Handler for Opening Income Modal
  const openIncomeModal = (income?: OtherIncome) => {
    if (income) {
      setEditingIncome(income);
      setIncomeTitle(income.title);
      setIncomeCategory(income.category);
      setIncomeAmount(income.amount);
      setIncomeDate(income.date);
      setIncomeSource(income.source);
      setIncomeDonorName(income.donorName || "");
      setIncomeReceiptNo(income.receiptNo || "");
      setIncomeNotes(income.notes || "");
    } else {
      setEditingIncome(null);
      setIncomeTitle("");
      setIncomeCategory("تبرعات");
      setIncomeAmount(1000);
      setIncomeDate(new Date().toISOString().split("T")[0]);
      setIncomeSource("الصندوق");
      setIncomeDonorName("");
      setIncomeReceiptNo(`INC-${Date.now().toString().slice(-5)}`);
      setIncomeNotes("");
    }
    setShowIncomeModal(true);
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeTitle || incomeAmount <= 0) {
      toast.error("يرجى إدخال عنوان ومبلغ الدخل بشكل صحيح.");
      return;
    }
    const newRecord: OtherIncome = {
      id: editingIncome ? editingIncome.id : `inc_${Date.now()}`,
      title: incomeTitle,
      category: incomeCategory,
      amount: Number(incomeAmount),
      date: incomeDate,
      source: incomeSource,
      donorName: incomeDonorName || undefined,
      receiptNo: incomeReceiptNo || undefined,
      notes: incomeNotes || undefined,
    };
    onSaveOtherIncome(newRecord);
    setShowIncomeModal(false);
  };

  // Handler for Opening Salary Modal
  const openSalaryModal = (sal?: SalaryPayment) => {
    if (sal) {
      setEditingSalary(sal);
      setSalaryPersonType(sal.personType);
      setSalaryPersonId(sal.personId || "");
      setSalaryPersonName(sal.personName);
      setSalaryRoleTitle(sal.roleTitle || "");
      setSalaryAmount(sal.amount);
      setSalaryMonth(sal.month);
      setSalaryYear(sal.year);
      setSalaryPaymentDate(sal.paymentDate);
      setSalaryPaymentMethod(sal.paymentMethod);
      setSalaryPaymentSource(sal.paymentSource);
      setSalaryReceiptNo(sal.receiptNo || "");
      setSalaryStatus(sal.status);
      setSalaryNotes(sal.notes || "");
    } else {
      setEditingSalary(null);
      if (teachers.length > 0) {
        const first = teachers[0];
        setSalaryPersonId(first.id);
        setSalaryPersonName(first.fullName);
        setSalaryRoleTitle(first.roleTitle || first.specialty || `${first.category || "أستاذ ومحفظ"}`);
        setSalaryAmount(first.monthlySalary ?? 2500);
        setSalaryPersonType(
          first.category === "إداري / كاتب" ? "إطار إداري" :
          first.category === "عامل نظافة / صيانة" ? "عامل / مستخدم" :
          first.category === "متطوع" ? "أخرى" : "أستاذ / محفظ"
        );
      } else {
        setSalaryPersonId("");
        setSalaryPersonName("");
        setSalaryRoleTitle("محفظ القرآن الكريم");
        setSalaryAmount(2500);
        setSalaryPersonType("أستاذ / محفظ");
      }
      setSalaryMonth("يوليوز");
      setSalaryYear(new Date().getFullYear());
      setSalaryPaymentDate(new Date().toISOString().split("T")[0]);
      setSalaryPaymentMethod("نقداً");
      setSalaryPaymentSource("الصندوق");
      setSalaryReceiptNo(`SAL-${Date.now().toString().slice(-5)}`);
      setSalaryStatus("تم الصرف");
      setSalaryNotes("");
    }
    setShowSalaryModal(true);
  };

  const handleTeacherSelect = (staffId: string) => {
    setSalaryPersonId(staffId);
    const s = teachers.find(item => item.id === staffId);
    if (s) {
      setSalaryPersonName(s.fullName);
      setSalaryRoleTitle(s.roleTitle || s.specialty || `${s.category || "كادر"}`);
      if (s.monthlySalary !== undefined && s.monthlySalary > 0) {
        setSalaryAmount(s.monthlySalary);
      }
      if (s.category === "إداري / كاتب") {
        setSalaryPersonType("إطار إداري");
      } else if (s.category === "عامل نظافة / صيانة") {
        setSalaryPersonType("عامل / مستخدم");
      } else if (s.category === "متطوع") {
        setSalaryPersonType("أخرى");
      } else {
        setSalaryPersonType("أستاذ / محفظ");
      }
    }
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryPersonName || salaryAmount <= 0) {
      toast.error("يرجى إدخال اسم المستفيد والمبلغ بشكل صحيح.");
      return;
    }
    const newRecord: SalaryPayment = {
      id: editingSalary ? editingSalary.id : `sal_${Date.now()}`,
      personType: salaryPersonType,
      personId: salaryPersonId || undefined,
      personName: salaryPersonName,
      roleTitle: salaryRoleTitle || undefined,
      amount: Number(salaryAmount),
      month: salaryMonth,
      year: Number(salaryYear),
      paymentDate: salaryPaymentDate,
      paymentMethod: salaryPaymentMethod,
      paymentSource: salaryPaymentSource,
      receiptNo: salaryReceiptNo || undefined,
      status: salaryStatus,
      notes: salaryNotes || undefined,
    };
    onSaveSalaryPayment(newRecord);
    setShowSalaryModal(false);
  };

  // Quick Auto-Populate Salaries for Active Teachers
  const handleAutoGenerateTeacherSalaries = async () => {
    if (teachers.length === 0) {
      toast.error("لا يوجد أساتذة مسجلين في النظام.");
      return;
    }
    if (!(await confirm({ message: `هل ترغب في توليد مسودة صرف الأجور لجميع الأساتذة النشطين (${teachers.length} أساتذة) لشهر ${salaryMonth} ${salaryYear}؟` }))) {
      return;
    }
    teachers.forEach((t, idx) => {
      if (t.isArchived) return;
      // Check if salary already logged for this teacher/month/year
      const exists = salaryPayments.some(s => s.personId === t.id && s.month === salaryMonth && s.year === Number(salaryYear));
      if (!exists) {
        const autoRecord: SalaryPayment = {
          id: `sal_auto_${t.id}_${Date.now()}_${idx}`,
          personType: "أستاذ / محفظ",
          personId: t.id,
          personName: t.fullName,
          roleTitle: `محفظ القرآن - ${t.specialty}`,
          amount: 2500,
          month: salaryMonth,
          year: Number(salaryYear),
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "نقداً",
          paymentSource: "الصندوق",
          receiptNo: `SAL-${salaryYear}-${idx + 1}`,
          status: "مستحق (قيد الانتظار)",
          notes: `توليد تلقائي لمستحقات أجر شهر ${salaryMonth} ${salaryYear}`
        };
        onSaveSalaryPayment(autoRecord);
      }
    });
    toast.success("تم إنشاء سجلات مستحقات الرواتب للأساتذة بنجاح!");
  };

  // Handler for Opening Expense Modal
  const openExpenseModal = (exp?: Expense) => {
    if (exp) {
      setEditingExpense(exp);
      setExpenseTitle(exp.title);
      setExpenseCategory(exp.category);
      setExpenseAmount(exp.amount);
      setExpenseDate(exp.date);
      setExpenseSource(exp.source);
      setExpenseInvoiceNo(exp.invoiceNo || "");
      setExpenseSupplier(exp.supplier || "");
      setExpenseNotes(exp.notes || "");
    } else {
      setEditingExpense(null);
      setExpenseTitle("");
      setExpenseCategory("فواتير وخدمات");
      setExpenseAmount(500);
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseSource("الصندوق");
      setExpenseInvoiceNo(`INV-${Date.now().toString().slice(-5)}`);
      setExpenseSupplier("");
      setExpenseNotes("");
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) {
      toast.error("يرجى تسجيل بيان المصاريف والمبلغ بشكل صحيح.");
      return;
    }
    const newRecord: Expense = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      title: expenseTitle,
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: expenseDate,
      source: expenseSource,
      invoiceNo: expenseInvoiceNo || undefined,
      supplier: expenseSupplier || undefined,
      notes: expenseNotes || undefined,
    };
    onSaveExpense(newRecord);
    setShowExpenseModal(false);
  };

  return {
    students,
    teachers,
    payments,
    otherIncomes,
    salaryPayments,
    expenses,
    activities,
    activityParticipants,
    activityExpenses,
    systemSettings,
    canEditPayments,
    canCreateFinance,
    canUpdateFinance,
    canDeleteFinance,
    canPrintFinance,
    onSaveOtherIncome,
    onDeleteOtherIncome,
    onSaveSalaryPayment,
    onDeleteSalaryPayment,
    onSaveExpense,
    onDeleteExpense,
    onNavigateToActivities,
    canManage,
    canCreate,
    canUpdate,
    canDelete,
    canPrint,
    activeSubTab,
    setActiveSubTab,
    selectedYear,
    setSelectedYear,
    selectedMonthFilter,
    setSelectedMonthFilter,
    selectedIncomeCategory,
    setSelectedIncomeCategory,
    searchQuery,
    setSearchQuery,
    incomeSortKey,
    setIncomeSortKey,
    incomeSortDir,
    setIncomeSortDir,
    studentPaySortKey,
    setStudentPaySortKey,
    studentPaySortDir,
    setStudentPaySortDir,
    salarySortKey,
    setSalarySortKey,
    salarySortDir,
    setSalarySortDir,
    expenseSortKey,
    setExpenseSortKey,
    expenseSortDir,
    setExpenseSortDir,
    handleToggleSort,
    renderSortableHeader,
    showIncomeModal,
    setShowIncomeModal,
    editingIncome,
    setEditingIncome,
    showSalaryModal,
    setShowSalaryModal,
    editingSalary,
    setEditingSalary,
    showExpenseModal,
    setShowExpenseModal,
    editingExpense,
    setEditingExpense,
    showPrintReportModal,
    setShowPrintReportModal,
    incomeTitle,
    setIncomeTitle,
    incomeCategory,
    setIncomeCategory,
    incomeAmount,
    setIncomeAmount,
    incomeDate,
    setIncomeDate,
    incomeSource,
    setIncomeSource,
    incomeDonorName,
    setIncomeDonorName,
    incomeReceiptNo,
    setIncomeReceiptNo,
    incomeNotes,
    setIncomeNotes,
    salaryPersonType,
    setSalaryPersonType,
    salaryPersonId,
    setSalaryPersonId,
    salaryPersonName,
    setSalaryPersonName,
    salaryRoleTitle,
    setSalaryRoleTitle,
    salaryAmount,
    setSalaryAmount,
    salaryMonth,
    setSalaryMonth,
    salaryYear,
    setSalaryYear,
    salaryPaymentDate,
    setSalaryPaymentDate,
    salaryPaymentMethod,
    setSalaryPaymentMethod,
    salaryPaymentSource,
    setSalaryPaymentSource,
    salaryReceiptNo,
    setSalaryReceiptNo,
    salaryStatus,
    setSalaryStatus,
    salaryNotes,
    setSalaryNotes,
    expenseTitle,
    setExpenseTitle,
    expenseCategory,
    setExpenseCategory,
    expenseAmount,
    setExpenseAmount,
    expenseDate,
    setExpenseDate,
    expenseSource,
    setExpenseSource,
    expenseInvoiceNo,
    setExpenseInvoiceNo,
    expenseSupplier,
    setExpenseSupplier,
    expenseNotes,
    setExpenseNotes,
    openIncomeModal,
    handleSaveIncome,
    openSalaryModal,
    handleTeacherSelect,
    handleSaveSalary,
    handleAutoGenerateTeacherSalaries,
    openExpenseModal,
    handleSaveExpense,
  };
}
