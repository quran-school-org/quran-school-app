/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import React  from "react";
import { RealmSimDB } from "../../db";
import { Grade, Payment } from "../../types";
import { getYearAndMonthFromDate } from "../helpers";
import type { DerivedScope } from "../scope";
import { csvCell } from "../../utils/csv";
import { parseGrade } from "../../utils/gradeMention";
import { formatMoney } from "../../utils/format";
import { useConfirm, useToast } from "../../ui";

export function useGradePaymentActions(s: DerivedScope) {
  const toast = useToast();
  const confirm = useConfirm();
  const {
    addSysNotification,
    editingPayment,
    filteredPayments,
    getSubscriptionAmount,
    gradeMemorization,
    gradeNotes,
    gradeOverall,
    gradePortion,
    gradeStudentId,
    gradeTajweed,
    loadDatabase,
    paymentFilterDate,
    paymentFormAmount,
    paymentFormDate,
    paymentFormMethod,
    paymentFormMonth,
    paymentFormNotes,
    paymentFormReceiptNo,
    paymentFormStatus,
    paymentFormStudentId,
    paymentFormYear,
    payments,
    schoolName,
    setEditingPayment,
    setGradeMemorization,
    setGradeNotes,
    setGradeOverall,
    setGradeOverallManual,
    setGradePortion,
    setGradeStudentId,
    setGradeTajweed,
    setPaymentFormAmount,
    setPaymentFormDate,
    setPaymentFormMethod,
    setPaymentFormMonth,
    setPaymentFormNotes,
    setPaymentFormReceiptNo,
    setPaymentFormStatus,
    setPaymentFormStudentId,
    setPaymentFormYear,
    setShowGradeModal,
    setShowPaymentModal,
    students,
  } = s;

  // Grade processing
  const handleOpenGradeForm = (studentId: string) => {
    setGradeStudentId(studentId);
    setGradePortion("");
    setGradeMemorization("");
    setGradeTajweed("");
    setGradeOverall("");
    setGradeOverallManual(false);
    setGradeNotes("");
    setShowGradeModal(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    // Garde-fou : notes et mention saisies (les champs requis du formulaire le garantissent déjà).
    const mem = parseGrade(gradeMemorization);
    const taj = parseGrade(gradeTajweed);
    if (mem === null || taj === null || !gradeOverall) {
      toast.error("يرجى إدخال درجتي الحفظ والتجويد (من 0 إلى 20) واختيار التقدير.");
      return;
    }
    const newGrade: Grade = {
      id: "g_" + Date.now(),
      studentId: gradeStudentId,
      examDate: new Date().toISOString().split("T")[0],
      testedPortion: gradePortion || "جزء عمّ",
      memorizationGrade: mem,
      tajweedGrade: taj,
      overallGrade: gradeOverall,
      notes: gradeNotes,
      examinerId: "t1"
    };
    RealmSimDB.saveGrade(newGrade);
    const studName = students.find(st => st.id === gradeStudentId)?.fullName || "";
    addSysNotification("إصدار شهادة اختبار", `تم رصد نتيجة اختبار جديدة للطالب ${studName} بتقدير ${gradeOverall}.`, "نجاح", "educators");
    loadDatabase();
    setShowGradeModal(false);
  };

  const handleDeleteGrade = async (id: string) => {
    if (await confirm({ message: "هل أنت متأكد من حذف هذا التقييم؟", tone: "danger" })) {
      RealmSimDB.deleteGrade(id);
      loadDatabase();
    }
  };

  // Payment processing
  const handleTogglePayment = (paymentId: string) => {
    const pay = payments.find(p => p.id === paymentId);
    if (pay) {
      const isPaid = pay.status === "مدفوع";
      const updated: Payment = {
        ...pay,
        status: isPaid ? "غير مدفوع" : "مدفوع",
        paymentDate: !isPaid ? new Date().toISOString().split("T")[0] : "",
        receiptNo: !isPaid ? (pay.receiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000)) : undefined,
        paymentMethod: !isPaid ? (pay.paymentMethod || "نقداً") : undefined
      };
      RealmSimDB.savePayment(updated);
      const studName = students.find(s => s.id === pay.studentId)?.fullName || "";
      addSysNotification(
        "تحديث حالة الدفع",
        `تم تعديل حالة دفعة شهر ${pay.month} للطالب ${studName} إلى [${updated.status}].`,
        "مالي"
      );
      loadDatabase();
    }
  };

  const handleOpenPaymentForm = (pay?: Payment) => {
    if (pay) {
      setEditingPayment(pay);
      setPaymentFormStudentId(pay.studentId || "");
      setPaymentFormYear(pay.year || new Date().getFullYear());
      setPaymentFormMonth(pay.month || "يوليوز");
      setPaymentFormAmount(pay.amount !== undefined ? pay.amount : 70);
      setPaymentFormStatus(pay.status || "غير مدفوع");
      setPaymentFormDate(pay.paymentDate || new Date().toISOString().split("T")[0]);
      setPaymentFormMethod(pay.paymentMethod || "نقداً");
      setPaymentFormReceiptNo(pay.receiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000));
      setPaymentFormNotes(pay.notes || "");
    } else {
      setEditingPayment(null);
      setPaymentFormStudentId(students[0]?.id || "");
      setPaymentFormYear(new Date().getFullYear());
      // Pre-select current month or default
      const months_ar = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
      const currentMonthIndex = new Date().getMonth();
      setPaymentFormMonth(months_ar[currentMonthIndex] || "يوليوز");
      setPaymentFormAmount(getSubscriptionAmount(months_ar[currentMonthIndex] || "يوليوز", new Date().getFullYear()));
      // Cas courant au guichet : le parent vient de payer (UI-12). « غير مدفوع » reste choisissable (échéance).
      setPaymentFormStatus("مدفوع");
      setPaymentFormDate(new Date().toISOString().split("T")[0]);
      setPaymentFormMethod("نقداً");
      setPaymentFormReceiptNo("REC-" + Math.floor(Math.random() * 9000 + 1000));
      setPaymentFormNotes("");
    }
    setShowPaymentModal(true);
  };

  const handleFormMonthChange = (month: string) => {
    setPaymentFormMonth(month);
    setPaymentFormAmount(getSubscriptionAmount(month, paymentFormYear));
  };

  const handleFormYearChange = (year: number) => {
    setPaymentFormYear(year);
    setPaymentFormAmount(getSubscriptionAmount(paymentFormMonth, year));
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFormStudentId) {
      toast.error("يرجى اختيار الطالب.");
      return;
    }
    const newPayment: Payment = {
      id: editingPayment ? editingPayment.id : "p_" + Date.now(),
      studentId: paymentFormStudentId,
      year: Number(paymentFormYear),
      month: paymentFormMonth,
      amount: Number(paymentFormAmount),
      status: paymentFormStatus,
      paymentDate: paymentFormStatus === "مدفوع" ? paymentFormDate : "",
      paymentMethod: paymentFormStatus === "مدفوع" ? paymentFormMethod : undefined,
      receiptNo: paymentFormStatus === "مدفوع" ? (paymentFormReceiptNo || "REC-" + Math.floor(Math.random() * 9000 + 1000)) : undefined,
      notes: paymentFormNotes || undefined
    };

    RealmSimDB.savePayment(newPayment);
    const studName = students.find(s => s.id === paymentFormStudentId)?.fullName || "";

    addSysNotification(
      editingPayment ? "تعديل دفعة مالية" : "إضافة دفعة مالية جديدة",
      `تم ${editingPayment ? "تعديل" : "إضافة"} دفعة شهر ${paymentFormMonth} ${paymentFormYear} للطالب ${studName} بقيمة ${formatMoney(paymentFormAmount)}.`,
      "مالي"
    );

    loadDatabase();
    setShowPaymentModal(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    const pay = payments.find(p => p.id === paymentId);
    if (pay) {
      const studName = students.find(s => s.id === pay.studentId)?.fullName || "";
      if (await confirm({ message: `هل أنت متأكد من حذف دفعة شهر ${pay.month} للطالب ${studName} نهائياً؟`, tone: "danger" })) {
        RealmSimDB.deletePayment(paymentId);
        addSysNotification(
          "حذف دفعة مالية",
          `تم إزالة سجل دفعة شهر ${pay.month} للطالب ${studName} نهائياً من النظام.`,
          "تنبيه"
        );
        loadDatabase();
      }
    }
  };
  const handleWhatsAppShare = (p: Payment) => {
    const stud = students.find(s => s.id === p.studentId);
    if (!stud) return;
    const rawMsg = `السلام عليكم ورحمة الله وبركاته،
المحترم(ة) السيد(ة) *${stud.parentName}*،
نعلمكم بأنه تم استلام دفعة الاشتراك المدرسي الخاصة بالطالب *${stud.fullName}*:
- *الشهر المستهدف*: ${p.month} ${p.year}
- *المبلغ*: ${formatMoney(p.amount)}
- *حالة الدفع*: ${p.status}
- *تاريخ الأداء*: ${p.paymentDate || "—"}
- *رقم الإيصال*: ${p.receiptNo || "—"}
- *طريقة الدفع*: ${p.paymentMethod || "نقداً"}
${p.notes ? `- *ملاحظة*: ${p.notes}\n` : ""}
شاكرين لكم حسن تعاونكم الدائم مع ${schoolName}.`;
    const encodedMsg = encodeURIComponent(rawMsg);
    const phone = (stud?.parentPhone || "").replace(/\s+/g, "");
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "212" + phone.substring(1);
    }
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, "_blank");
  };

  const handleExportPaymentsToCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("لا توجد بيانات سداد لتصديرها.");
      return;
    }

    const headers = [
      "اسم الطالب",
      "اسم ولي الأمر",
      "هاتف ولي الأمر",
      "الشهر",
      "السنة",
      "المبلغ (درهم)",
      "حالة الدفع",
      "تاريخ الدفع",
      "طريقة الدفع",
      "رقم الإيصال",
      "الملاحظات"
    ];

    const rows = filteredPayments.map(p => {
      const stud = students.find(s => s.id === p.studentId);
      return [
        stud?.fullName || "طالب مجهول",
        stud?.parentName || "—",
        stud?.parentPhone || "—",
        p.month,
        p.year,
        p.amount,
        p.status,
        p.paymentDate || "—",
        p.paymentMethod || "—",
        p.receiptNo || "—",
        p.notes || "—"
      ].map(csvCell);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_المدفوعات_${getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    handleOpenGradeForm,
    handleSaveGrade,
    handleDeleteGrade,
    handleTogglePayment,
    handleOpenPaymentForm,
    handleFormMonthChange,
    handleFormYearChange,
    handleSavePayment,
    handleDeletePayment,
    handleWhatsAppShare,
    handleExportPaymentsToCSV,
  };
}
