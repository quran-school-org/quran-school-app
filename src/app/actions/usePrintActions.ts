/**
 * Impressions (reçu, attestation, rapports, cartes) : fenêtres ouvertes par
 * openPrintWindow (titre échappé, polices de la charte, plus de CDN Tailwind).
 * Toute donnée insérée dans un gabarit est échappée (C-01).
 */
import { escapeHtml } from "../../security/html";
import { RECEIPT_CSS, receiptHtml } from "../../print/receipt";
import { CERTIFICATE_CSS, certificateHtml } from "../../print/certificate";
import { paymentsReportHtml } from "../../print/paymentsReport";
import { studentsReportHtml } from "../../print/studentsReport";
import { bulkCardsHtml, idCardsCss, singleCardHtml } from "../../print/idCards";
import { DOC_CSS } from "../../print/docStyles";
import { openPrintWindow } from "../../print/printWindow";
import { Payment } from "../../types";
import { getYearAndMonthFromDate } from "../helpers";
import type { DerivedScope } from "../scope";

export function usePrintActions(s: DerivedScope) {
  const {
    addSysNotification,
    bulkSelectedIds,
    filteredPayments,
    filteredStudents,
    labPrintMode,
    labScale,
    paymentFilterDate,
    schoolName,
    selectedLabStudentId,
    students,
    systemSettings,
  } = s;

  const handlePrintReceipt = (p: Payment) => {
    const stud = students.find(s => s.id === p.studentId);
    if (!stud) return;

    openPrintWindow({
      title: "إيصال استلام رسوم - " + stud.fullName,
      body: receiptHtml(p, stud, systemSettings, schoolName),
      css: DOC_CSS + RECEIPT_CSS,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال.",
    });
  };
  const handlePrintCertificate = (stud: any, gr: any) => {
    if (!stud) return;

    const associationName = schoolName;
    const associationLogo = systemSettings?.associationLogo || "";

    openPrintWindow({
      title: "شهادة تقديرية - " + stud.fullName,
      body: certificateHtml(stud, gr, associationName, associationLogo, systemSettings),
      css: DOC_CSS + CERTIFICATE_CSS,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة الشهادة.",
      closeAfter: false,
    });
  };

  const handlePrintFinancialReport = () => {
    if (filteredPayments.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const { year: filterYear } = getYearAndMonthFromDate(paymentFilterDate);
    const reportTitle = `التقرير المالي للدفوعات والاشتراكات - لعام ${filterYear || new Date().getFullYear()}`;

    const tableRows = filteredPayments.map(p => {
      const stud = students.find(s => s.id === p.studentId);
      return `
        <tr>
          <td><span class="strong">${escapeHtml(stud?.fullName || "طالب مجهول")}</span><br/><span class="muted">ولي الأمر: ${escapeHtml(stud?.parentName || "—")}</span></td>
          <td class="c">${escapeHtml(p.month)} / ${escapeHtml(p.year)}</td>
          <td class="c strong">${escapeHtml(p.amount)} درهم</td>
          <td class="c"><span class="pill ${escapeHtml(p.status === "مدفوع" ? "ok" : "ko")}">${escapeHtml(p.status === "مدفوع" ? "مدفوع" : "غير مدفوع")}</span></td>
          <td class="c ltr">${escapeHtml(p.paymentDate || "—")}</td>
          <td class="c">${escapeHtml(p.paymentMethod || "—")}</td>
          <td class="c ltr">${escapeHtml(p.receiptNo || "—")}</td>
        </tr>
      `;
    }).join("");

    const totalCollected = filteredPayments.filter(p => p.status === "مدفوع").reduce((sum, p) => sum + p.amount, 0);
    const totalPending = filteredPayments.filter(p => p.status === "غير مدفوع").reduce((sum, p) => sum + p.amount, 0);

    openPrintWindow({
      title: reportTitle,
      body: paymentsReportHtml(reportTitle, tableRows, filteredPayments, totalCollected, totalPending, systemSettings, schoolName),
      css: DOC_CSS,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.",
    });
  };
  const handlePrintStudentsReport = () => {
    if (filteredStudents.length === 0) {
      alert("لا توجد بيانات طلاب لتصديرها.");
      return;
    }

    const reportTitle = "تقرير كشف الطلاب والتقدم الدراسي";
    
    const totalCount = filteredStudents.length;
    const maleCount = filteredStudents.filter(s => s.gender === "ذكر").length;
    const femaleCount = filteredStudents.filter(s => s.gender === "أنثى").length;
    const avgHizb = totalCount > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.hizbCount, 0) / totalCount * 10) / 10 : 0;

    const tableRows = filteredStudents.map(s => {
      const parentName = s.parentName || "—";
      const parentPhone = s.parentPhone || "—";
      const statusText = s.isArchived ? "مؤرشف" : "نشط";
      const statusClass = s.isArchived ? "warn" : "ok";

      return `
        <tr>
          <td class="strong">${escapeHtml(s.fullName)}</td>
          <td class="c ltr">${escapeHtml(s.birthDate)}</td>
          <td class="c">${escapeHtml(s.gender)}</td>
          <td>
            <div>${escapeHtml(parentName)}</div>
            <div class="muted ltr">${escapeHtml(parentPhone)}</div>
          </td>
          <td>
            <div class="accent">${escapeHtml(s.hizbCount)} حزب</div>
            <div class="muted gold">${escapeHtml(s.currentSurah || "—")}</div>
          </td>
          <td class="c strong">${escapeHtml(s.tajweedLevel)}</td>
          <td class="c"><span class="pill ${escapeHtml(statusClass)}">${escapeHtml(statusText)}</span></td>
        </tr>
      `;
    }).join("");

    openPrintWindow({
      title: reportTitle,
      body: studentsReportHtml(reportTitle, tableRows, totalCount, maleCount, femaleCount, avgHizb, systemSettings, schoolName),
      css: DOC_CSS,
      blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.",
    });
  };

  const handlePrintLabCard = (printSide: "both" | "front" | "back" = "both") => {
    let sideSuffix = "";
    if (printSide === "front") sideSuffix = " (الوجه فقط)";
    else if (printSide === "back") sideSuffix = " (الظهر فقط)";
    else sideSuffix = " (الوجهين)";

    if (labPrintMode === "single") {
      if (!selectedLabStudentId) {
        alert("الرجاء اختيار طالب أولاً.");
        return;
      }
      const labStudent = students.find(s => s.id === selectedLabStudentId);
      if (!labStudent) return;

      const printContent = document.getElementById("lab-printable-area");
      if (!printContent) {
        alert("تعذر العثور على منطقة معاينة الكارت.");
        return;
      }

      const w = openPrintWindow({
        title: "بطاقة الطالب - " + labStudent.fullName + sideSuffix,
        body: singleCardHtml(labScale, printContent),
        css: idCardsCss(printSide, "single"),
        withAppStyles: true,
        blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة الكارت.",
        delay: 600,
      });
      if (!w) return;

      addSysNotification(
        "طباعة بطاقة الهوية",
        `تم إرسال بطاقة الطالب(ة) ${labStudent.fullName}${sideSuffix} للطباعة بالمقياس المخصص: ${Math.round(labScale * 100)}%`,
        "نجاح"
      );
    } else {
      if (bulkSelectedIds.length === 0) {
        alert("الرجاء تحديد طالب واحد على الأقل من القائمة الجانبية للطباعة الجماعية.");
        return;
      }

      const printContent = document.getElementById("lab-printable-area");
      if (!printContent) {
        alert("تعذر العثور على منطقة معاينة الكروت.");
        return;
      }

      const w = openPrintWindow({
        title: "الطباعة الجماعية للبطاقات" + sideSuffix,
        body: bulkCardsHtml(labScale, printContent),
        css: idCardsCss(printSide, "bulk"),
        withAppStyles: true,
        blockedMessage: "يرجى السماح بالنوافذ المنبثقة لطباعة الكروت.",
        delay: 800,
      });
      if (!w) return;

      addSysNotification(
        "الطباعة الجماعية",
        `تم إرسال عدد ${bulkSelectedIds.length} بطاقات${sideSuffix} للطباعة الجماعية بالمقياس المخصص: ${Math.round(labScale * 100)}%`,
        "نجاح"
      );
    }
  };

  return {
    handlePrintReceipt,
    handlePrintCertificate,
    handlePrintFinancialReport,
    handlePrintStudentsReport,
    handlePrintLabCard,
  };
}
