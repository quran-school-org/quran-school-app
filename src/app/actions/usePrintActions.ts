/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
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

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال استلام رسوم - ${stud.fullName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 20px;
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="max-w-md mx-auto border-2 border-dashed border-slate-300 p-6 rounded-2xl space-y-6 mt-10">
            <div class="text-center space-y-2">
              ${systemSettings?.associationLogo ? `
                <div class="w-16 h-16 mx-auto flex items-center justify-center bg-white rounded-xl overflow-hidden p-1">
                  <img src="${systemSettings.associationLogo}" class="max-w-full max-h-full object-contain" />
                </div>
              ` : `
                <span class="text-4xl">🌅</span>
              `}
              <h2 class="text-xl font-bold text-emerald-800">${schoolName}</h2>
              <p class="text-xs text-slate-500 font-medium">برعاية ${schoolName} • وصل استلام مالي</p>
            </div>
            
            <div class="border-t border-b border-slate-100 py-4 my-4 space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">رقم الإيصال:</span>
                <span class="font-mono font-bold text-slate-800">${p.receiptNo || "—"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">تاريخ الأداء:</span>
                <span class="font-mono text-slate-700">${p.paymentDate || "—"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">اسم الطالب:</span>
                <span class="font-bold text-slate-800">${stud.fullName}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">ولي الأمر:</span>
                <span class="text-slate-700">${stud.parentName}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">الفترة المستحقة:</span>
                <span class="font-semibold text-emerald-800">شهر ${p.month} ${p.year}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">طريقة الأداء:</span>
                <span class="font-semibold text-slate-800">${p.paymentMethod || "نقداً"}</span>
              </div>
              ${p.notes ? `
              <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                ملاحظات: ${p.notes}
              </div>
              ` : ""}
            </div>

            <div class="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center">
              <span class="text-xs block font-medium">المبلغ المستلم</span>
              <span class="text-2xl font-black font-mono">${p.amount} درهم</span>
            </div>

            <div class="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              شكرًا لكم على ثقتكم والتزامكم • ${schoolName}
            </div>
          </div>
        </body>
      </html>
    `);
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

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>شهادة تقديرية - ${stud.fullName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              background-color: #fafaf9;
              color: #1c1917;
              padding: 0;
              margin: 0;
            }
            .certificate-container {
              font-family: 'Amiri', serif;
            }
          </style>
        </head>
        <body class="flex items-center justify-center min-h-screen p-4" onload="window.print(); setTimeout(window.close, 1500);">
          <div class="certificate-container w-full max-w-4xl bg-white border-[16px] border-double border-amber-600 rounded-3xl p-12 text-center relative shadow-2xl overflow-hidden my-4">
            <div class="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-amber-600 rounded-tr-xl opacity-80"></div>
            <div class="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-amber-600 rounded-tl-xl opacity-80"></div>
            <div class="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-amber-600 rounded-br-xl opacity-80"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-amber-600 rounded-bl-xl opacity-80"></div>
            
            <div class="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

            <div class="flex justify-between items-center border-b border-amber-200 pb-6 mb-8">
              <div class="text-right">
                <h3 class="text-sm font-bold text-amber-900 font-sans tracking-tight">${associationName}</h3>
                <p class="text-[11px] text-amber-700 font-sans mt-1">نادي القرآن الكريم وتجويده</p>
                <p class="text-[9px] text-slate-400 font-sans">تاريخ الاختبار: ${gr.examDate}</p>
              </div>
              
              <div class="w-20 h-20 bg-white border-2 border-amber-400 rounded-2xl flex items-center justify-center p-1.5 shadow-md overflow-hidden shrink-0">
                ${associationLogo ? `
                  <img src="${associationLogo}" class="max-w-full max-h-full object-contain" />
                ` : `
                  <svg class="w-full h-full text-amber-600" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="46" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
                    <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#d97706" />
                    <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
                  </svg>
                `}
              </div>
              
              <div class="text-left text-xs font-sans text-amber-900 font-semibold">
                <span class="bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">الرقم الترتيبي: ${gr.id.slice(-5).toUpperCase()}</span>
              </div>
            </div>

            <div class="my-6">
              <h1 class="text-4xl font-extrabold text-amber-800 tracking-wide mb-2">شَـهَـادَة تَقْـدِيـر وَتَمِـيُّـز</h1>
              <div class="h-1 w-40 bg-gradient-to-l from-transparent via-amber-600 to-transparent mx-auto my-3"></div>
            </div>

            <p class="text-sm text-emerald-800 font-bold italic max-w-lg mx-auto mb-8 bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
              "الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ"<br/>
              <span class="text-[11px] text-emerald-600 font-sans not-italic block mt-1">— حديث شريف مروي عن عائشة رضي الله عنها</span>
            </p>

            <div class="space-y-6 text-lg text-slate-800 max-w-2xl mx-auto leading-relaxed">
              <p>
                بكل فخر واعتزاز، تشهد إدارة <span class="font-bold text-amber-900 font-sans">${associationName}</span> لنادي القرآن الكريم أن الطالب / الطالبة:
              </p>
              
              <div class="my-6">
                <h2 class="text-3xl font-black text-emerald-950 underline decoration-amber-500 decoration-wavy decoration-2 underline-offset-8 py-2 inline-block font-sans">${stud.fullName}</h2>
              </div>

              <p class="text-base">
                قد اجتاز بنجاح وتفوق اختبار حفظ وتجويد القرآن الكريم في الجزء المبارك:
              </p>
              
              <div class="bg-amber-50/70 border border-amber-200/50 rounded-2xl px-6 py-2.5 max-w-md mx-auto my-4 text-amber-950 font-bold text-xl">
                [ ${gr.testedPortion} ]
              </div>

              <p class="text-base">
                وحصل على تقدير عام <span class="font-bold text-emerald-800 font-sans">${gr.overallGrade}</span> بمعدل مشرف ينم عن جد ومثابرة:
              </p>
              
              <div class="flex justify-center gap-8 text-xs font-sans font-bold my-4">
                <span class="bg-slate-100 border px-4 py-2 rounded-xl text-slate-700">درجة الحفظ: <span class="text-emerald-700 font-mono text-sm">${gr.memorizationGrade}</span> / 20</span>
                <span class="bg-slate-100 border px-4 py-2 rounded-xl text-slate-700">درجة التجويد: <span class="text-emerald-700 font-mono text-sm">${gr.tajweedGrade}</span> / 20</span>
              </div>

              ${gr.notes ? `
                <div class="p-3.5 bg-amber-50/30 rounded-xl text-sm text-amber-900 italic max-w-lg mx-auto border border-amber-100/50 mt-4">
                  "ملاحظة وتوجيه المدرس: ${gr.notes}"
                </div>
              ` : ''}

              <p class="text-base text-slate-600 mt-6">
                سائلين المولى عز وجل له دوام التوفيق والسداد، والختم القريب لكتاب الله تعالى بالبركة والقبول والرضوان.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-dashed border-amber-200">
              <div class="text-right">
                <p class="text-xs text-slate-400 font-sans mb-6">توقيع وختم الإدارة:</p>
                <div class="h-16 flex items-center justify-start">
                  ${systemSettings?.showStampOnReceipts ? `
                    <div class="border border-red-500/30 text-red-600 rounded-full px-4 py-1.5 inline-block text-xs font-black rotate-[-3deg] border-dashed">
                      ★ ${systemSettings.stampText || "إدارة النادي"} ★
                    </div>
                  ` : `
                    <span class="text-slate-300 italic text-xs">موقع ومعتمد</span>
                  `}
                </div>
              </div>
              <div class="text-left">
                <p class="text-xs text-slate-400 font-sans mb-6">توقيع محفظ الحلقة:</p>
                <div class="h-16 flex items-center justify-end">
                  <span class="text-slate-400 font-serif italic text-sm">أستاذ الحلقة</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
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
          <td class="p-2 text-right" style="padding: 8px; text-align: right;">${stud?.fullName || "طالب مجهول"}<br/><span class="text-[9px] text-slate-400">ولي الأمر: ${stud?.parentName || "—"}</span></td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.month} / ${p.year}</td>
          <td class="p-2 text-center font-mono font-bold" style="padding: 8px; text-align: center;">${p.amount} درهم</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.status === "مدفوع" ? "مدفوع ✓" : "غير مدفوع ❌"}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${p.paymentDate || "—"}</td>
          <td class="p-2 text-center" style="padding: 8px; text-align: center;">${p.paymentMethod || "—"}</td>
          <td class="p-2 text-center font-mono" style="padding: 8px; text-align: center;">${p.receiptNo || "—"}</td>
        </tr>
      `;
    }).join("");

    const totalCollected = filteredPayments.filter(p => p.status === "مدفوع").reduce((sum, p) => sum + p.amount, 0);
    const totalPending = filteredPayments.filter(p => p.status === "غير مدفوع").reduce((sum, p) => sum + p.amount, 0);

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${reportTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 40px;
            }
            @media print {
              body { padding: 0px; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="space-y-6">
            <div class="flex justify-between items-center border-b-2 border-emerald-800 pb-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #065f46; padding-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${systemSettings?.associationLogo ? `
                  <div style="width: 50px; height: 50px; background-color: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; shrink-0;">
                    <img src="${systemSettings.associationLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </div>
                ` : ''}
                <div>
                  <h1 class="text-2xl font-black text-emerald-800" style="font-size: 24px; font-weight: 900; color: #065f46; margin: 0;">${schoolName}</h1>
                  <p class="text-xs text-slate-500 font-medium mt-1" style="margin: 4px 0 0 0;">التقرير المالي التفصيلي للاشتراكات والرسوم الإدارية</p>
                </div>
              </div>
              <div class="text-left" style="text-align: left;">
                <p class="text-xs text-slate-400">تاريخ إصدار التقرير:</p>
                <p class="text-xs font-mono font-bold text-slate-700">${new Date().toLocaleDateString("ar-MA")}</p>
              </div>
            </div>

            <div class="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200" style="text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 class="text-base font-bold text-slate-800">${reportTitle}</h2>
              <p class="text-xs text-slate-500 mt-1">عدد السجلات الإجمالي في التقرير: ${filteredPayments.length} معاملة</p>
            </div>

            <div class="grid grid-cols-3 gap-4" style="display: grid; grid-template-cols: repeat(3, minmax(0, 1fr)); gap: 16px;">
              <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-emerald-700 font-bold block" style="font-size: 10px; color: #047857; font-weight: 700; display: block;">إجمالي المداخيل المحصلة</span>
                <span class="text-lg font-black font-mono text-emerald-800" style="font-size: 18px; font-weight: 900; color: #065f46;">${totalCollected} درهم</span>
              </div>
              <div class="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center" style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-rose-700 font-bold block" style="font-size: 10px; color: #be123c; font-weight: 700; display: block;">إجمالي المستحقات المعلقة</span>
                <span class="text-lg font-black font-mono text-rose-800" style="font-size: 18px; font-weight: 900; color: #9f1239;">${totalPending} درهم</span>
              </div>
              <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-blue-700 font-bold block" style="font-size: 10px; color: #1d4ed8; font-weight: 700; display: block;">المجموع المتوقع للدفعة</span>
                <span class="text-lg font-black font-mono text-blue-800" style="font-size: 18px; font-weight: 900; color: #1e40af;">${totalCollected + totalPending} درهم</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden mt-6" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px;">
              <table class="w-full text-right text-xs" style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px;">
                <thead class="bg-slate-100 text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <tr>
                    <th class="p-2 text-right" style="padding: 8px;">اسم الطالب</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">الفترة</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">المبلغ</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">حالة السداد</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">تاريخ الدفع</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">طريقة الدفع</th>
                    <th class="p-2 text-center" style="padding: 8px; text-align: center;">رقم الوصل</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="flex justify-between items-center pt-8 border-t text-[10px] text-slate-400 mt-10" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; margin-top: 40px; font-size: 10px; color: #94a3b8;">
              <p>${schoolName} • إدارة الحسابات والمالية</p>
              <p>الصفحة 1 من 1</p>
            </div>
          </div>
        </body>
      </html>
    `);
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
          <td class="p-3 text-right font-bold text-slate-800" style="padding: 12px; text-align: right;">${s.fullName}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${s.birthDate}</td>
          <td class="p-3 text-center text-slate-600" style="padding: 12px; text-align: center;">${s.gender}</td>
          <td class="p-3 text-right text-slate-600" style="padding: 12px; text-align: right;">
            <div class="font-medium text-slate-700">${parentName}</div>
            <div class="text-[10px] text-slate-400 font-mono">${parentPhone}</div>
          </td>
          <td class="p-3 text-right" style="padding: 12px; text-align: right;">
            <div class="font-bold text-emerald-800">${s.hizbCount} حزب</div>
            <div class="text-[10px] text-amber-600 font-medium">${s.currentSurah || "—"}</div>
          </td>
          <td class="p-3 text-center font-bold text-slate-700" style="padding: 12px; text-align: center;">${s.tajweedLevel}</td>
          <td class="p-3 text-center" style="padding: 12px; text-align: center;">
            <span class="px-2 py-1 rounded text-[10px] font-bold" style="padding: 4px 8px; border-radius: 4px; font-weight: 700; ${statusColor}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${reportTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif !important;
              background-color: white !important;
              color: #0f172a !important;
              padding: 40px;
            }
            @media print {
              body { padding: 0px; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(window.close, 1000);">
          <div class="space-y-6">
            <div class="flex justify-between items-center border-b-2 border-emerald-800 pb-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #065f46; padding-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${systemSettings?.associationLogo ? `
                  <div style="width: 50px; height: 50px; background-color: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; shrink-0;">
                    <img src="${systemSettings.associationLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </div>
                ` : ''}
                <div>
                  <h1 class="text-2xl font-black text-emerald-800" style="font-size: 24px; font-weight: 900; color: #065f46; margin: 0;">${schoolName}</h1>
                  <p class="text-xs text-slate-500 font-medium mt-1" style="margin: 4px 0 0 0;">تقرير كشف شؤون الطلاب والتقدم الدراسي</p>
                </div>
              </div>
              <div class="text-left" style="text-align: left;">
                <p class="text-xs text-slate-400">تاريخ التقرير:</p>
                <p class="text-xs font-mono font-bold text-slate-700">${new Date().toLocaleDateString("ar-MA")}</p>
              </div>
            </div>

            <div class="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200" style="text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 class="text-base font-bold text-slate-800">${reportTitle}</h2>
              <p class="text-xs text-slate-500 mt-1">نسخة مطبوعة من سجلات الطلاب والتقدم الدراسي الحالية</p>
            </div>

            <div class="grid grid-cols-3 gap-4" style="display: grid; grid-template-cols: repeat(3, minmax(0, 1fr)); gap: 16px;">
              <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-emerald-700 font-bold block" style="font-size: 10px; color: #047857; font-weight: 700; display: block;">إجمالي الطلاب في الكشف</span>
                <span class="text-lg font-black font-mono text-emerald-800" style="font-size: 18px; font-weight: 900; color: #065f46;">${totalCount} طالب</span>
              </div>
              <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center" style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-amber-700 font-bold block" style="font-size: 10px; color: #b45309; font-weight: 700; display: block;">التوزيع حسب الجنس</span>
                <span class="text-sm font-bold text-amber-800 block mt-1" style="color: #92400e;">${maleCount} ذكور / ${femaleCount} إناث</span>
              </div>
              <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-blue-700 font-bold block" style="font-size: 10px; color: #1d4ed8; font-weight: 700; display: block;">متوسط الحفظ الفعلي</span>
                <span class="text-lg font-black font-mono text-blue-800" style="font-size: 18px; font-weight: 900; color: #1e40af;">${avgHizb} حزب</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden mt-6" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px;">
              <table class="w-full text-right text-xs" style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px;">
                <thead class="bg-slate-100 text-slate-700" style="background-color: #f1f5f9; color: #334155;">
                  <tr>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">الاسم الكامل</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">تاريخ الميلاد</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">الجنس</th>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">ولي الأمر / الهاتف</th>
                    <th class="p-3 text-right" style="padding: 12px; text-align: right; background-color: #f1f5f9;">التقدم في الحفظ</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">مستوى التجويد</th>
                    <th class="p-3 text-center" style="padding: 12px; text-align: center; background-color: #f1f5f9;">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="flex justify-between items-center pt-8 border-t text-[10px] text-slate-400 mt-10" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; margin-top: 40px; font-size: 10px; color: #94a3b8;">
              <p>${schoolName} • إدارة شؤون الطلاب</p>
              <p>الصفحة 1 من 1</p>
            </div>
          </div>
        </body>
      </html>
    `);
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

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>بطاقة الطالب - ${labStudent.fullName}${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 0;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              @page {
                margin: 0;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  padding: 0;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: center center; display: flex; justify-content: center; align-items: center; gap: 24px; padding: 20px;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 600);
              };
            </script>
          </body>
        </html>
      `);
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

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>الطباعة الجماعية للبطاقات${sideSuffix}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: 'Cairo', 'Amiri', serif, sans-serif;
                background-color: white;
                margin: 0;
                padding: 1.5cm;
                direction: rtl;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 1cm;
                size: auto;
              }
              @media print {
                body {
                  background-color: transparent;
                  padding: 0;
                }
                .break-inside-avoid {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                ${printSide === "front" ? `
                [id*="-back-"], [id*="-back"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
                ${printSide === "back" ? `
                [id*="-front-"], [id*="-front"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                ` : ""}
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(${labScale}); transform-origin: top center; width: 100%;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 800);
              };
            </script>
          </body>
        </html>
      `);
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
