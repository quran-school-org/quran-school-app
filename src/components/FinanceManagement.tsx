import React, { useState, useMemo } from "react";
import { 
  Student, Teacher, Payment, SystemSettings, OtherIncome, SalaryPayment, Expense,
  ActivityTrip, ActivityParticipant, ActivityExpense
} from "../types";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Building2, Plus, Edit3, Trash2, 
  Printer, FileText, Search, Filter, CheckCircle, AlertTriangle, Calendar, 
  Coins, Receipt, ShoppingBag, Briefcase, ChevronRight, UserCheck, CreditCard, 
  PieChart, RefreshCw, Layers, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown,
  Compass, Users, MapPin, ExternalLink
} from "lucide-react";

interface FinanceManagementProps {
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  otherIncomes: OtherIncome[];
  salaryPayments: SalaryPayment[];
  expenses: Expense[];
  activities?: ActivityTrip[];
  activityParticipants?: ActivityParticipant[];
  activityExpenses?: ActivityExpense[];
  systemSettings: SystemSettings | null;
  canEditPayments?: boolean;
  canCreateFinance?: boolean;
  canUpdateFinance?: boolean;
  canDeleteFinance?: boolean;
  canPrintFinance?: boolean;
  onSaveOtherIncome: (income: OtherIncome) => void;
  onDeleteOtherIncome: (id: string) => void;
  onSaveSalaryPayment: (salary: SalaryPayment) => void;
  onDeleteSalaryPayment: (id: string) => void;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToActivities?: () => void;
}

const MONTHS_LIST = [
  "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", 
  "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"
];

export default function FinanceManagement({
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
}: FinanceManagementProps) {
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
        className={`p-3 cursor-pointer select-none hover:bg-slate-200/80 transition rounded-lg ${
          align === "center" ? "text-center" : "text-right"
        }`}
        title={`ترتيب حسب ${label} (من الأصغر للأكبر أو العكس)`}
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
      alert("يرجى إدخال عنوان ومبلغ الدخل بشكل صحيح.");
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
      alert("يرجى إدخال اسم المستفيد والمبلغ بشكل صحيح.");
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
  const handleAutoGenerateTeacherSalaries = () => {
    if (teachers.length === 0) {
      alert("لا يوجد أساتذة مسجلين في النظام.");
      return;
    }
    if (!confirm(`هل ترغب في توليد مسودة صرف الأجور لجميع الأساتذة النشطين (${teachers.length} أساتذة) لشهر ${salaryMonth} ${salaryYear}؟`)) {
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
    alert("تم إنشاء سجلات مستحقات الرواتب للأساتذة بنجاح!");
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
      alert("يرجى تسجيل بيان المصاريف والمبلغ بشكل صحيح.");
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

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>التقرير المالي والختامي - ${selectedYear}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&display=swap');
            @page {
              size: A4 portrait;
              margin: 12mm 10mm;
            }
            body {
              font-family: 'Cairo', 'Amiri', serif !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              box-shadow: none !important;
            }
            .no-print, .print\\:hidden {
              display: none !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body class="bg-white p-6">
          <div class="max-w-4xl mx-auto">
            ${reportElement.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 700);
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div data-screen="finance" className="space-y-6">
      {/* Top Main Title & Action Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                النظام المالي الموحد للجمعيات
              </span>
              <span className="bg-white/10 text-white/80 text-xs px-2.5 py-1 rounded-full">
                السنة المالية: {selectedYear}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              إدارة المحاسبة والمالية الجمعوية
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              تتبع شامل وإلكتروني لمستحقات التلاميذ، الأجور والرواتب، المصاريف والنفقات، وإعداد التقرير المالي والختامي المعتمد للجمعية.
            </p>
          </div>

          {canPrint && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowPrintReportModal(true)}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-5 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير المالي الختامي</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Finance Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-700/50">
          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">إجمالي المداخيل</span>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">رسوم تلاميذ + تبرعات ودعم</span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">إجمالي المصاريف والرواتب</span>
            <div className="text-2xl font-black text-rose-300 mt-1">
              {grossTotalExpenses.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">أجور مصروفة + مشتريات وفواتير</span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">الرصيد الصافي المتبقي</span>
            <div className={`text-2xl font-black mt-1 ${netBalance >= 0 ? "text-amber-300" : "text-rose-400"}`}>
              {netBalance.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">
              {netBalance >= 0 ? "فائض مالية الجمعية" : "عجز مالية الجمعية"}
            </span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">توزيع الأرصدة الحالية</span>
            <div className="text-xs font-bold text-white mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-200">الصندوق:</span>
                <span className="font-bold text-amber-300">{cashBoxNetBalance.toLocaleString()} د.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">البنك:</span>
                <span className="font-bold text-teal-300">{bankAccountNetBalance.toLocaleString()} د.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs (The 4 doors requested) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            data-subtab="revenues"
            onClick={() => setActiveSubTab("revenues")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "revenues"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-800 hover:bg-white/60"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>1. قسم الإيرادات والمداخيل</span>
          </button>

          <button
            data-subtab="salaries"
            onClick={() => setActiveSubTab("salaries")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "salaries"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-800 hover:bg-white/60"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>2. قسم الأجور والرواتب</span>
          </button>

          <button
            data-subtab="expenses"
            onClick={() => setActiveSubTab("expenses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "expenses"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-800 hover:bg-white/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. قسم المصاريف والمشتريات</span>
          </button>

          <button
            data-subtab="report"
            onClick={() => setActiveSubTab("report")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "report"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-800 hover:bg-white/60"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>4. تقرير مالي وختامي</span>
          </button>
        </div>

        {/* Global Year/Search Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الإيصال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none w-48"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none"
          >
            {[0, 1, 2].map((d) => {
              const y = new Date().getFullYear() - d;
              return <option key={y} value={String(y)}>السنة المالية {y}</option>;
            })}
            <option value="all">جميع السنوات</option>
          </select>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 1. SECTION: REVENUES & INCOME (قسم الإيرادات والمداخيل) */}
      {/* ========================================================================================= */}
      {activeSubTab === "revenues" && (
        <div className="space-y-6">
          {/* Sub-cards summary (4 cards with Activities Contributions included) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">المداخيل الأخرى (تبرعات/دعم)</span>
                <div className="text-xl font-extrabold text-teal-800">
                  {totalOtherIncomeAmount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">عدد السجلات: {filteredOtherIncomes.length} تبرع/دعم</span>
              </div>
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-800">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">واجبات التلاميذ (تلقائي)</span>
                <div className="text-xl font-extrabold text-emerald-800">
                  {totalStudentFeesAmount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">عدد المقبوضات: {paidStudentPayments.length} إيصال</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 block mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  مساهمات الأنشطة والرحلات (تلقائي)
                </span>
                <div className="text-xl font-extrabold text-blue-800">
                  {totalActivityContributions.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-blue-600/80 mt-1 block">
                  من أصل {totalActivityExpectedFees.toLocaleString()} د.م واجبة ({filteredActivityParticipants.filter(p => (Number(p.paidAmount) || 0) > 0).length} مشارك أدى)
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-100/80 rounded-xl flex items-center justify-center text-blue-700">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-200 block mb-1">مجموع الإيرادات الكلي</span>
                <div className="text-2xl font-black text-amber-300">
                  {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-emerald-200/70 mt-1 block">شاملة للرسوم والتبرعات والأنشطة</span>
              </div>
              <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-300">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section A: Other Incomes (Donations, Grants, Support) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-teal-700" />
                  <span>المداخيل الأخرى (تبرعات، دعم مؤسساتي، اشتراكات جمعية)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  سجل التبرعات من المحسنين، المنح والمساعدات، واشتراكات الأعضاء الداعمين.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* فلتر نوع الدخل */}
                <div className="flex items-center gap-2 bg-white border border-slate-300/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <label htmlFor="income-category-filter" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    نوع الدخل:
                  </label>
                  <select
                    id="income-category-filter"
                    value={selectedIncomeCategory}
                    onChange={(e) => setSelectedIncomeCategory(e.target.value)}
                    className="text-xs bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all">جميع أنواع المداخيل</option>
                    <option value="تبرعات">تبرعات</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي/مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                {canCreate && (
                  <button
                    data-action="open-income-form"
                    onClick={() => openIncomeModal()}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دخل / تبرع جديد</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("عنوان الدخل / التبرع", "title", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("نوع الدخل", "category", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("المبلغ", "amount", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("المتبرع / الجهة", "donorName", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("مكان الإيداع", "source", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("تاريخ الاستلام", "date", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("رقم الإيصال", "receiptNo", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedOtherIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        لا توجد مداخيل أو تبرعات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    sortedOtherIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {inc.title}
                          {inc.notes && <p className="text-[10px] text-slate-400 font-normal">{inc.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-teal-50 text-teal-800 font-semibold px-2.5 py-1 rounded-full text-[10px] border border-teal-200">
                            {inc.category}
                          </span>
                        </td>
                        <td className="p-3 font-black text-emerald-800 text-sm">
                          {inc.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {inc.donorName || "فاعل خير"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inc.source === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {inc.source}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {inc.date}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {inc.receiptNo || "—"}
                        </td>
                        <td className="p-3">
                          {(canUpdate || canDelete) && (
                            <div className="flex items-center justify-center gap-1">
                              {canUpdate && (
                                <button
                                  onClick={() => openIncomeModal(inc)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا السجل المالي؟")) {
                                      onDeleteOtherIncome(inc.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Activity & Trip Contributions (Synced automatically from Activities Module) */}
          <div className="bg-white rounded-3xl border border-blue-200/80 shadow-sm overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-700" />
                  <span>مساهمات ومداخيل الأنشطة والرحلات (مربوطة ومحصلة تلقائياً)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتم استجلاب واحتساب مساهمات المشاركين في الأنشطة والرحلات بشكل آلي ومباشر وإدراجها ضمن المداخيل الإجمالية.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span>إجمالي المحصل:</span>
                  <span className="font-black text-emerald-700">{totalActivityContributions.toLocaleString()} د.م</span>
                </div>

                {onNavigateToActivities && (
                  <button
                    onClick={onNavigateToActivities}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>إدارة الأنشطة والرحلات</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">النشاط / الرحلة</th>
                    <th className="p-3">اسم المشارك</th>
                    <th className="p-3">الصفة / النوع</th>
                    <th className="p-3">المساهمة الواجبة</th>
                    <th className="p-3">المبلغ المحصل</th>
                    <th className="p-3">المتبقي</th>
                    <th className="p-3">طريقة الأداء</th>
                    <th className="p-3">تاريخ الأداء</th>
                    <th className="p-3 text-center">حالة الأداء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivityParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        لا توجد مساهمات مسجلة للمشاركين في الأنشطة والرحلات حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredActivityParticipants.map((p) => {
                      const act = safeActivities.find(a => a.id === p.activityId);
                      const requiredFee = Number(p.fee !== undefined && p.fee !== null ? p.fee : (act?.contributionFee ?? 0));
                      const paidAmount = Number(p.paidAmount) || 0;
                      const remaining = Math.max(0, requiredFee - paidAmount);
                      const participantName = p.fullName || (p as any).participantName || "مشارك";
                      const roleDisplay = p.participantType || "مشارك";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{act ? act.title : `نشاط #${p.activityId}`}</span>
                            </span>
                            {act?.startDate && <p className="text-[10px] text-slate-400 font-normal">{act.startDate}</p>}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {participantName}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200">
                              {roleDisplay}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            {p.paymentStatus === "معفى" && requiredFee === 0 ? "معفى (0 د.م)" : `${requiredFee.toLocaleString()} د.م`}
                          </td>
                          <td className="p-3 font-black text-emerald-700">
                            {paidAmount.toLocaleString()} د.م
                          </td>
                          <td className="p-3 font-semibold text-slate-500">
                            {remaining > 0 ? (
                              <span className="text-amber-700 font-bold">{remaining.toLocaleString()} د.م</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {p.paymentDate || "—"}
                          </td>
                          <td className="p-3 text-center">
                            {p.paymentStatus === "معفى" ? (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                                معفى
                              </span>
                            ) : p.paymentStatus === "مدفوع" || (requiredFee > 0 && paidAmount >= requiredFee) ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                مدفوع
                              </span>
                            ) : paidAmount > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                مدفوع جزئياً
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-rose-200">
                                غير مدفوع
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Student Monthly Fees (Synced automatically) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-800" />
                  <span>مداخيل مستحقات وواجبات التلاميذ الشهرية (مربوطة تلقائياً)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتم مزامنة واستجلاب هذه المداخيل تلقائياً من قسم "الرسوم والمدفوعات" فور تسديدها.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700"
                >
                  <option value="all">جميع الشهور</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("الطالب / المكتتب", "studentName", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("الشهر / السنة", "monthYear", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("المبلغ المدفوع", "amount", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("طريقة الأداء", "paymentMethod", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("رقم الإيصال", "receiptNo", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("تاريخ التسديد", "paymentDate", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("الحالة", "status", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStudentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400">
                        لا توجد مداخيل مدفوعة مسجلة للتلاميذ وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedStudentPayments.map((p) => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">
                            {student ? student.fullName : `طالب #${p.studentId}`}
                          </td>
                          <td className="p-3 font-semibold text-slate-600">
                            {p.month} {p.year}
                          </td>
                          <td className="p-3 font-bold text-emerald-800">
                            {p.amount} د.م
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-[11px] border border-slate-200">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {p.receiptNo || "—"}
                          </td>
                          <td className="p-3 text-slate-500">
                            {p.paymentDate}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              مدفوع ومسجل
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 2. SECTION: SALARIES & PAYROLL (قسم الأجور والرواتب) */}
      {/* ========================================================================================= */}
      {activeSubTab === "salaries" && (
        <div className="space-y-6">
          {/* Sub-cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الرواتب المصروفة</span>
                <div className="text-2xl font-extrabold text-emerald-800">
                  {totalPaidSalaries.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-emerald-600 mt-1 block">تم تحويلها وصرفها بنجاح</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">الرواتب المستحقة (قيد الانتظار)</span>
                <div className="text-2xl font-extrabold text-amber-700">
                  {totalPendingSalaries.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-amber-600 mt-1 block">مستحقات واجبة الصرف</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-300 block mb-1">مجموع كتلة الأجور والرواتب</span>
                <div className="text-3xl font-black text-rose-300">
                  {(totalPaidSalaries + totalPendingSalaries).toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">للأساتذة والأطر والخدمات</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-300">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Salary Payments */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-800" />
                  <span>سجل مستحقات ورواتب الأساتذة، الأطر والعاملين</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تسجيل وإدارة التعويضات الشهرية للمحفظين، الأطر الإدارية وعمال الصيانة والنظافة.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canCreate && (
                  <>
                    <button
                      onClick={handleAutoGenerateTeacherSalaries}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-amber-300"
                      title="توليد مستحقات جميع الأساتذة لشهر محدد تلقائياً"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>توليد مستحقات الأساتذة تلقائياً</span>
                    </button>

                    <button
                      data-action="open-salary-form"
                      onClick={() => openSalaryModal()}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>صرف / تسجيل أجر جديد</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("اسم المستفيد", "personName", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الفئة والصفة", "personType", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الشهر / السنة", "monthYear", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("المبلغ (د.م)", "amount", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("مصدر الصرف", "paymentSource", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("طريقة الصرف", "paymentMethod", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("تاريخ الصرف", "paymentDate", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الحالة", "status", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        لا توجد سجلات رواتب مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedSalaries.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {s.personName}
                          {s.receiptNo && <p className="text-[10px] text-slate-400 font-mono font-normal">وصل: {s.receiptNo}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                            {s.personType} {s.roleTitle ? `— ${s.roleTitle}` : ""}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {s.month} {s.year}
                        </td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          {s.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.paymentSource === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {s.paymentSource}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {s.paymentMethod}
                        </td>
                        <td className="p-3 text-slate-500">
                          {s.paymentDate}
                        </td>
                        <td className="p-3">
                          {s.status === "تم الصرف" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              تم الصرف
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              قيد الانتظار
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openSalaryModal(s)}
                                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
                                    onDeleteSalaryPayment(s.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 3. SECTION: EXPENSES & PURCHASES (قسم المصاريف والمشتريات) */}
      {/* ========================================================================================= */}
      {activeSubTab === "expenses" && (
        <div className="space-y-6">
          {/* Sub-cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">مصاريف الصندوق النقدي</span>
                <div className="text-2xl font-extrabold text-amber-700">
                  {cashBoxExpenses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">نفقات المشتريات النقدية الصغرى</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">مصاريف الحساب البنكي</span>
                <div className="text-2xl font-extrabold text-blue-800">
                  {bankAccountExpenses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">الفواتير والشيكات البنكية</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-rose-200 block mb-1">إجمالي نفقات التشغيل</span>
                <div className="text-3xl font-black text-rose-200">
                  {totalExpensesAmount.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-rose-200/70 mt-1 block">بدون احتساب كتلة الأجور</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-300">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Expenses */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-700" />
                  <span>جدول المصاريف والمشتريات والفواتير</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تسجيل الفواتير، التجهيزات، صيانة المقر، ومصاريف الأنشطة مع تحديد المصدر المالي.
                </p>
              </div>

              {canCreate && (
                <button
                  data-action="open-expense-form"
                  onClick={() => openExpenseModal()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل فاتورة / نفقة جديدة</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("بيان النفقة / المشتريات", "title", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("نوع النفقة", "category", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المبلغ", "amount", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المصدر المالي", "source", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المورد / المتاجر", "supplier", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("رقم الفاتورة", "invoiceNo", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("التاريخ", "date", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        لا توجد مصاريف أو فواتير مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {exp.title}
                          {exp.notes && <p className="text-[10px] text-slate-400 font-normal">{exp.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-700 text-sm">
                          {exp.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            exp.source === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {exp.source}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {exp.supplier || "—"}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {exp.invoiceNo || "—"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {exp.date}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openExpenseModal(exp)}
                                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذه النفقة؟")) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 4. SECTION: FINANCIAL SUMMARY & CLOSING REPORT (تقرير مالي وختامي) */}
      {/* ========================================================================================= */}
      {activeSubTab === "report" && (
        <div className="space-y-6">
          {/* Detailed Financial Dashboard */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-emerald-800" />
                  <span>التقرير المالي والختامي للجمعية والمؤسسة</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  لوحة قيادة تفصيلية تظهر توازن الميزانية، ومجموع المداخيل والمصاريف للموافقة عليها في الجمع العام.
                </p>
              </div>

              {canPrint && (
                <button
                  onClick={() => setShowPrintReportModal(true)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة وطباعة التقرير الختامي الرسمية</span>
                </button>
              )}
            </div>

            {/* Income vs Expenses Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gross Income Card */}
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-emerald-800">1. مجموع المداخيل الإجمالية</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-900">
                  {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-emerald-900/80 border-t border-emerald-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>واجبات التلاميذ الشهرية:</span>
                    <span className="font-bold">{totalStudentFeesAmount.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التبرعات والدعم والأنشطة:</span>
                    <span className="font-bold">{totalOtherIncomeAmount.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>

              {/* Gross Expenses Card */}
              <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-rose-800">2. مجموع المصاريف والرواتب</span>
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-3xl font-black text-rose-900">
                  {grossTotalExpenses.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-rose-900/80 border-t border-rose-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>كتلة الأجور المصروفة:</span>
                    <span className="font-bold">{totalPaidSalaries.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مصاريف ونفقات التشغيل:</span>
                    <span className="font-bold">{totalExpensesAmount.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>

              {/* Net Balance Card */}
              <div className={`rounded-2xl p-5 border ${
                netBalance >= 0 
                  ? "bg-amber-50/70 border-amber-300 text-amber-950" 
                  : "bg-red-50 border-red-300 text-red-950"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold">3. الرصيد المالي الصافي المتبقي</span>
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-black">
                  {netBalance.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs border-t border-amber-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>صافي صندوق النقدية:</span>
                    <span className="font-bold">{cashBoxNetBalance.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>صافي الحساب البنكي:</span>
                    <span className="font-bold">{bankAccountNetBalance.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income and Expenses Detailed Breakdown Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Income Breakdown Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>تفاصيل مصادر المداخيل</span>
                  <span className="text-xs text-emerald-800 font-extrabold">{grossTotalIncome.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مستحقات التلاميذ السنوية والشهرية</p>
                      <p className="text-[11px] text-slate-500">رسوم الاشتراكات المسددة من الأولياء</p>
                    </div>
                    <span className="font-black text-emerald-800">{totalStudentFeesAmount.toLocaleString()} د.م</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">تبرعات المحسنين والأفراد</p>
                      <p className="text-[11px] text-slate-500">تبرعات نقدية وبنكية للمدرسة</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">دعم المؤسسات والمجالس الجماعية</p>
                      <p className="text-[11px] text-slate-500">منح حكومية ومجالس منتخبين</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مداخيل ومساهمات الأنشطة والرحلات</p>
                      <p className="text-[11px] text-slate-500">مساهمات المشاركين المحصلة آلياً</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {totalActivityContributions.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مداخيل متنوعة واشتراكات أخرى</p>
                      <p className="text-[11px] text-slate-500">أنشطة ومسابقات ومداخيل أخرى</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>تفاصيل أبواب النفقات والمصاريف</span>
                  <span className="text-xs text-rose-800 font-extrabold">{grossTotalExpenses.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">رواتب ومكافآت الأساتذة والمحفظين</p>
                      <p className="text-[11px] text-slate-500">مستحقات التأطير والتحفيظ</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">أجور الأطر الإدارية والعمال</p>
                      <p className="text-[11px] text-slate-500">الإدارة، الصيانة والإشراف</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">نفقات ومصاريف الأنشطة والرحلات</p>
                      <p className="text-[11px] text-slate-500">كراء الحافلات، الإطعام واللوازم</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {totalActivityExpenses.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">الفواتير، الماء، الكهرباء والخدمات</p>
                      <p className="text-[11px] text-slate-500">استهلاك المقر الإداري والتعليمي</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">التجهيزات، الصيانة واللوازم العامة</p>
                      <p className="text-[11px] text-slate-500">جوائز، أدوات مكتبية وإصلاحات</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredExpenses.filter(e => e.category !== "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 1: ADD / EDIT OTHER INCOME */}
      {/* ========================================================================================= */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-300" />
                <span>{editingIncome ? "تعديل سجل دخل / تبرع" : "تسجيل دخل أو تبرع جديد"}</span>
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">بيان / عنوان الدخل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تبرع كريم لشراء مصاحف / دعم مجلس الجماعة..."
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نوع الدخل</label>
                  <select
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="تبرعات">تبرعات محسنين</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي / مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">مداخيل أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">المبلغ (بالدرهم) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">مكان الإيداع / المصدر</label>
                  <select
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="الصندوق">الصندوق النقدي</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ الاستلام</label>
                  <input
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">اسم المتبرع / الجهة</label>
                  <input
                    type="text"
                    placeholder="اختياري (مثال: المحسن حاج إبراهيم)"
                    value={incomeDonorName}
                    onChange={(e) => setIncomeDonorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الإيصال</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-2026-05"
                    value={incomeReceiptNo}
                    onChange={(e) => setIncomeReceiptNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توضيحية حول طبيعة المداخيل..."
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md transition"
                >
                  حفظ السجل المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 2: ADD / EDIT SALARY PAYMENT */}
      {/* ========================================================================================= */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-300" />
                <span>{editingSalary ? "تعديل سجل التعويض والراتب" : "تسجيل وصرف أجر / راتب جديد"}</span>
              </h3>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">فئة المستفيد</label>
                  <select
                    value={salaryPersonType}
                    onChange={(e) => setSalaryPersonType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="أستاذ / محفظ">أستاذ / محفظ القرآن</option>
                    <option value="إطار إداري">إطار إداري / كاتب</option>
                    <option value="عامل / مستخدم">عامل نظافة / صيانة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">حالة الصرف</label>
                  <select
                    value={salaryStatus}
                    onChange={(e) => setSalaryStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-bold"
                  >
                    <option value="تم الصرف">تم الصرف والتأدية</option>
                    <option value="مستحق (قيد الانتظار)">مستحق (قيد الانتظار)</option>
                  </select>
                </div>
              </div>

              {teachers.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-xs text-slate-700">اختر من لائحة الأطر والعاملين المسجلين</label>
                    <span className="text-[10px] text-emerald-700 font-bold">يتم ملء الصفة والمبلغ تلقائياً</span>
                  </div>
                  <select
                    value={salaryPersonId}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setSalaryPersonId("");
                        setSalaryPersonName("");
                      } else {
                        handleTeacherSelect(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-bold text-xs"
                  >
                    <option value="">-- اختر كادر / عامل من السجل --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.category || "أستاذ"} - {t.roleTitle || t.specialty}) {t.monthlySalary ? `[${t.monthlySalary} د.م]` : ""}
                      </option>
                    ))}
                    <option value="custom">✏️ إدخال يدوي لشخص آخر...</option>
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block font-bold mb-1">اسم المستفيد الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأستاذ محمد العلوي / السيد علي الحارس..."
                  value={salaryPersonName}
                  onChange={(e) => setSalaryPersonName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">الصفة / المسمى الوظيفي</label>
                <input
                  type="text"
                  placeholder="مثال: محفظ فصل النور / مسؤول صيانة ونظافة المقر..."
                  value={salaryRoleTitle}
                  onChange={(e) => setSalaryRoleTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ (د.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">الشهر المستحق</label>
                  <select
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">السنة</label>
                  <input
                    type="number"
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">مصدر الصرف</label>
                  <select
                    value={salaryPaymentSource}
                    onChange={(e) => setSalaryPaymentSource(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="الصندوق">الصندوق</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">طريقة الدفع</label>
                  <select
                    value={salaryPaymentMethod}
                    onChange={(e) => setSalaryPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={salaryPaymentDate}
                    onChange={(e) => setSalaryPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">رقم وصل / إذن الصرف</label>
                <input
                  type="text"
                  placeholder="مثال: SAL-2026-07-12"
                  value={salaryReceiptNo}
                  onChange={(e) => setSalaryReceiptNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md transition"
                >
                  حفظ أجر المستفيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 3: ADD / EDIT EXPENSE */}
      {/* ========================================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-rose-900 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-300" />
                <span>{editingExpense ? "تعديل سجل النفقة" : "تسجيل نفقة أو فاتورة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">بيان النفقة / المشتريات *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة الكهرباء / شراء جوائز وختم الأحزاب / أدوات مكتبية..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نوع / فئة النفقة</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none"
                  >
                    <option value="فواتير وخدمات">فواتير وخدمات (ماء، كهرباء...)</option>
                    <option value="مشتريات وتجهيزات">مشتريات وتجهيزات مكتبية</option>
                    <option value="أنشطة وحفلات">أنشطة وحفلات وجوائز</option>
                    <option value="صيانة وإصلاحات">صيانة وإصلاح المقر</option>
                    <option value="ضيافة وتنقل">ضيافة وتنقلات</option>
                    <option value="أخرى">مصاريف أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">المبلغ (د.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700 focus:bg-white focus:border-rose-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المصدر المالي</label>
                  <select
                    value={expenseSource}
                    onChange={(e) => setExpenseSource(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none"
                  >
                    <option value="الصندوق">الصندوق النقدي</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ النفقة</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">اسم المورد / الشركات</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة الكهرباء / مكتبة النجاح"
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الفاتورة / الوصل</label>
                  <input
                    type="text"
                    placeholder="مثال: INV-2026-102"
                    value={expenseInvoiceNo}
                    onChange={(e) => setExpenseInvoiceNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ملاحظات توضيحية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول سبب وسياق هذه النفقة..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold shadow-md transition"
                >
                  حفظ النفقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 4: OFFICIAL PRINTABLE FINANCIAL REPORT MODAL */}
      {/* ========================================================================================= */}
      {showPrintReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">معاينة التقرير المالي والختامي المعتمد</span>
              </div>

              <div className="flex items-center gap-3">
                {canPrint && (
                  <button
                    onClick={handlePrint}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة فورية / حفظ PDF</span>
                  </button>
                )}

                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Statement Area */}
            <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-serif" id="printable-financial-statement">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-6">
                <div className="text-right space-y-1">
                  <p className="font-bold text-xs text-slate-600">المملكة المغربية</p>
                  <h2 className="text-xl font-bold text-emerald-950">
                    {systemSettings?.associationName || "إدارة الجمعية"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {systemSettings?.associationAddress || ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    الهاتف: {systemSettings?.associationPhone || ""} {systemSettings?.associationEmail ? `| البريد: ${systemSettings.associationEmail}` : ""}
                  </p>
                </div>

                <div className="text-center">
                  {systemSettings?.associationLogo ? (
                    <img
                      src={systemSettings.associationLogo}
                      alt={systemSettings?.associationName || "شعار الجمعية"}
                      className="w-20 h-20 object-contain mx-auto mb-1 rounded-2xl border border-slate-200 p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-emerald-800 text-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-1 border-2 border-amber-400 font-bold text-2xl shadow-inner">
                      {(() => { const w = (systemSettings?.associationName || "").split(" ").filter(Boolean); return w[1] || w[0] || ""; })()}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 block font-sans font-medium">
                    {systemSettings?.foundingDate
                      ? `تأسست سنة ${systemSettings.foundingDate.includes("-") ? systemSettings.foundingDate.split("-")[0] : systemSettings.foundingDate}`
                      : ""}
                  </span>
                </div>

                <div className="text-left space-y-1 font-sans text-xs">
                  <p className="font-bold text-slate-800">التاريخ: {new Date().toLocaleDateString("ar-MA")}</p>
                  <p className="text-slate-500">السنة المالية: {selectedYear}</p>
                  <p className="text-slate-500">الرقم المرجعي: FIN-REP-{selectedYear}-01</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 my-4">
                <h1 className="text-2xl font-black text-emerald-950 underline decoration-amber-400 decoration-2 underline-offset-8">
                  التقرير المالي والختامي للجمعية
                </h1>
                <p className="text-xs text-slate-600 font-sans pt-1">
                  عن الفترة الممتدة خلال السنة المالية {selectedYear}
                </p>
              </div>

              {/* Table A: Revenues */}
              <div className="space-y-2 break-inside-avoid">
                <h3 className="font-bold text-sm text-emerald-900 border-r-4 border-emerald-800 pr-2">
                  أولاً: جدول الإيرادات والمداخيل المقبوضة
                </h3>
                <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold">
                      <th className="border border-slate-300 p-2">الباب / مصدر الدخل</th>
                      <th className="border border-slate-300 p-2">نوع المداخيل</th>
                      <th className="border border-slate-300 p-2">توضيحات إضافية</th>
                      <th className="border border-slate-300 p-2 text-left">المبلغ بالدرهم (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">واجبات اشتراك التلاميذ الشهرية</td>
                      <td className="border border-slate-300 p-2">اشتراكات دراسية</td>
                      <td className="border border-slate-300 p-2 text-slate-600">مجموع المقبوضات الشهرية من الأولياء</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-900 text-left">
                        {totalStudentFeesAmount.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">تبرعات المحسنين والهبات</td>
                      <td className="border border-slate-300 p-2">تبرعات عينية ونقدية</td>
                      <td className="border border-slate-300 p-2 text-slate-600">دعم المحسنين لتجهيز المدرسة والقرآنيات</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">منح الجمعيات والمجالس المؤسساتية</td>
                      <td className="border border-slate-300 p-2">دعم عمومي</td>
                      <td className="border border-slate-300 p-2 text-slate-600">منح الجماعة والشركاء المؤسساتيين</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">مداخيل ومساهمات الأنشطة والرحلات</td>
                      <td className="border border-slate-300 p-2">أنشطة ورحلات</td>
                      <td className="border border-slate-300 p-2 text-slate-600">مساهمات المشاركين المحصلة آلياً</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-900 text-left">
                        {totalActivityContributions.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">مداخيل متنوعة أخرى واشتراكات</td>
                      <td className="border border-slate-300 p-2">أنشطة ومسابقات</td>
                      <td className="border border-slate-300 p-2 text-slate-600">مشاركات ومداخيل متنوعة</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 font-black text-emerald-950">
                      <td colSpan={3} className="border border-slate-300 p-2 text-right">
                        مجموع الإيرادات والمداخيل الكلية (أ)
                      </td>
                      <td className="border border-slate-300 p-2 text-left text-sm">
                        {grossTotalIncome.toLocaleString()} د.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table B: Expenses */}
              <div className="space-y-2 break-inside-avoid">
                <h3 className="font-bold text-sm text-rose-900 border-r-4 border-rose-800 pr-2">
                  ثانياً: جدول المصاريف والنفقات المنجزة
                </h3>
                <table className="w-full text-right text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-300 p-2">الباب / نوع النفقة</th>
                      <th className="border border-slate-300 p-2">فئة المصاريف</th>
                      <th className="border border-slate-300 p-2">توضيحات إضافية</th>
                      <th className="border border-slate-300 p-2 text-left">المبلغ بالدرهم (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">أجور ومستحقات الأساتذة والمحفظين</td>
                      <td className="border border-slate-300 p-2">كتلة الأجور</td>
                      <td className="border border-slate-300 p-2 text-slate-600">تعويضات التأطير والتحفيظ لشيوخ المدرسة</td>
                      <td className="border border-slate-300 p-2 font-bold text-rose-900 text-left">
                        {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">أجور الأطر الإدارية وعمال الصيانة</td>
                      <td className="border border-slate-300 p-2">كتلة الأجور</td>
                      <td className="border border-slate-300 p-2 text-slate-600">التعويضات الإدارية ونظافة المقر</td>
                      <td className="border border-slate-300 p-2 font-bold text-rose-900 text-left">
                        {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">نفقات ومصاريف الأنشطة والرحلات</td>
                      <td className="border border-slate-300 p-2">أنشطة ورحلات</td>
                      <td className="border border-slate-300 p-2 text-slate-600">كراء حافلات، إطعام وتأطير الأنشطة</td>
                      <td className="border border-slate-300 p-2 font-bold text-rose-900 text-left">
                        {totalActivityExpenses.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">استهلاك الماء والكهرباء والإنترنت</td>
                      <td className="border border-slate-300 p-2">فواتير وخدمات</td>
                      <td className="border border-slate-300 p-2 text-slate-600">استهلاك المقر الإداري وقاعات التحفيظ</td>
                      <td className="border border-slate-300 p-2 font-bold text-rose-900 text-left">
                        {filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold">المشتريات والتجهيزات والجوائز والصيانة</td>
                      <td className="border border-slate-300 p-2">تشغيل وتجهيز</td>
                      <td className="border border-slate-300 p-2 text-slate-600">دروع التكريم، مستلزمات مكتبية وصيانة أجهزة</td>
                      <td className="border border-slate-300 p-2 font-bold text-rose-900 text-left">
                        {filteredExpenses.filter(e => e.category !== "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr className="bg-rose-50 font-black text-rose-950">
                      <td colSpan={3} className="border border-slate-300 p-2 text-right">
                        مجموع المصاريف والنفقات الكلية (ب)
                      </td>
                      <td className="border border-slate-300 p-2 text-left text-sm">
                        {grossTotalExpenses.toLocaleString()} د.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Balance Box */}
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between text-slate-900 break-inside-avoid">
                <div>
                  <h4 className="font-bold text-sm">خلاصة الرصيد المالي الصافي للجمعية (أ - ب)</h4>
                  <p className="text-xs text-slate-600">
                    {netBalance >= 0 
                      ? "فائض مالي إيجابي مرحل للسنة الموالية" 
                      : "عجز مالي يتطلب التغطية من الاحتياطي"}
                  </p>
                </div>
                <div className="text-2xl font-black text-emerald-900 dir-ltr">
                  {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()} د.م
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-8 border-t border-slate-300 space-y-6 break-inside-avoid">
                <div className="grid grid-cols-4 gap-4 text-center text-xs font-sans items-start">
                  {/* Treasurer */}
                  <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                    <p className="font-bold text-slate-800">أمين المال للجمعية</p>
                    <p className="font-bold text-emerald-900">{systemSettings?.treasurerName || "-"}</p>
                    <div className="pt-6 text-slate-400 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* School Director */}
                  <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                    <p className="font-bold text-slate-800">المدير المسؤول للمدرسة</p>
                    <p className="font-bold text-emerald-900">{systemSettings?.directorName || "-"}</p>
                    <div className="pt-6 text-slate-400 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* Association President */}
                  <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                    <p className="font-bold text-slate-800">رئيس الجمعية</p>
                    <p className="font-bold text-emerald-900">{systemSettings?.presidentName || "-"}</p>
                    <div className="pt-6 text-slate-400 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* Official Seal */}
                  <div className="space-y-1 flex flex-col items-center justify-center p-2">
                    <div className="w-20 h-20 border-2 border-dashed border-emerald-800 rounded-full flex items-center justify-center text-[9px] text-emerald-900 font-bold p-1.5 text-center opacity-85 bg-emerald-50/30">
                      {systemSettings?.stampText || "خاتم الجمعية الرسمي"}
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">مصادق عليه - سلا</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
