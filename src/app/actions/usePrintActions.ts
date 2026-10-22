/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { escapeHtml } from "../../security/html";
import { receiptHtml } from "../../print/receipt";
import { certificateHtml } from "../../print/certificate";
import { paymentsReportHtml } from "../../print/paymentsReport";
import { studentsReportHtml } from "../../print/studentsReport";
import { singleCardHtml } from "../../print/idCards";
import { bulkCardsHtml } from "../../print/idCards";
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

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال.");
      return;
    }

    printWindow.document.write(receiptHtml(p, stud, systemSettings, schoolName));
    printWindow.document.close();
  };
  const handlePrintCertificate = (stud: any, gr: any) => {
    if (!stud) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الشهادة.");
      return;
    }

    const associationName = schoolName;
    const associationLogo = systemSettings?.associationLogo || "";

    printWindow.document.write(certificateHtml(stud, gr, associationName, associationLogo, systemSettings));
    printWindow.document.close();
  };

  const handlePrintFinancialReport = () => {
    if (filteredPayments.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    const { year: filterYear } = getYearAndMonthFromDate(paymentFilterDate);
    const reportTitle = `التقرير المالي للدفوعات والاشتراكات - لعام ${filterYear || new Date().getFullYear()}`;

    const tableRows = filteredPayments.map(p => {
      const stud = students.find(s => s.id === p.studentId);
      return `
        <tr class="border-b border-slate-100 text-xs">
          <td class="p-2 text-right" style="padding: 8px; text-align: right;">${escapeHtml(stud?.fullName || "طالب مجهول")}<br/><span class="text-[9px] text-slate-400">ولي الأمر: ${escapeHtml(stud?.parentName || "—")}</span></td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${escapeHtml(p.month)} / ${escapeHtml(p.year)}</td>
          <td class="p-2 text-center font-mono font-bold" style="padding: 8px; text-align: center;">${escapeHtml(p.amount)} درهم</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${escapeHtml(p.status === "مدفوع" ? "مدفوع ✓" : "غير مدفوع ❌")}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${escapeHtml(p.paymentDate || "—")}</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${escapeHtml(p.paymentMethod || "—")}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${escapeHtml(p.receiptNo || "—")}</td>
        </tr>
      `;
    }).join("");

    const totalCollected = filteredPayments.filter(p => p.status === "مدفوع").reduce((sum, p) => sum + p.amount, 0);
    const totalPending = filteredPayments.filter(p => p.status === "غير مدفوع").reduce((sum, p) => sum + p.amount, 0);

    printWindow.document.write(paymentsReportHtml(reportTitle, tableRows, filteredPayments, totalCollected, totalPending, systemSettings, schoolName));
    printWindow.document.close();
  };
  const handlePrintStudentsReport = () => {
    if (filteredStudents.length === 0) {
      alert("لا توجد بيانات طلاب لتصديرها.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
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
      const statusColor = s.isArchived ? "color: #b45309; background-color: #fffbeb;" : "color: #047857; background-color: #ecfdf5;";

      return `
        <tr class="border-b border-slate-100 text-xs">
          <td class="p-3 text-right font-bold text-slate-800" style="padding: 12px; text-align: right;">${escapeHtml(s.fullName)}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${escapeHtml(s.birthDate)}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${escapeHtml(s.gender)}</td>
          <td class="p-3 text-right text-slate-600" style="padding: 12px; text-align: right;">
            <div class="font-medium text-slate-700">${escapeHtml(parentName)}</div>
            <div class="text-[10px] text-slate-400 font-mono">${escapeHtml(parentPhone)}</div>
          </td>
          <td class="p-3 text-right" style="padding: 12px; text-align: right;">
            <div class="font-bold text-emerald-800">${escapeHtml(s.hizbCount)} حزب</div>
            <div class="text-[10px] text-amber-600 font-medium">${escapeHtml(s.currentSurah || "—")}</div>
          </td>
          <td class="p-3 text-center font-bold text-slate-700" style="padding: 12px; text-align: center;">${escapeHtml(s.tajweedLevel)}</td>
          <td class="p-3 text-center" style="padding: 12px; text-align: center;">
            <span class="px-2 py-1 rounded text-[10px] font-bold" style="padding: 4px 8px; border-radius: 4px; font-weight: 700; ${escapeHtml(statusColor)}">${escapeHtml(statusText)}</span>
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(studentsReportHtml(reportTitle, tableRows, totalCount, maleCount, femaleCount, avgHizb, systemSettings, schoolName));
    printWindow.document.close();
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

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الكارت.");
        return;
      }

      printWindow.document.write(singleCardHtml(labStudent, sideSuffix, printSide, labScale, printContent));
      printWindow.document.close();

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

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الكروت.");
        return;
      }

      printWindow.document.write(bulkCardsHtml(sideSuffix, printSide, labScale, printContent));
      printWindow.document.close();

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
