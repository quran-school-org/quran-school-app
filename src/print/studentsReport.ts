/**
 * Rapport de la liste des élèves (fenêtre d'impression).
 * Gabarit HTML déplacé tel quel depuis App.tsx (Lot 2).
 */
import { escapeHtml } from "../security/html";
import type { Payment, Student, SystemSettings } from "../types";

export function studentsReportHtml(reportTitle: string, tableRows: string, totalCount: number, maleCount: number, femaleCount: number, avgHizb: number, systemSettings: SystemSettings | null, schoolName: string): string {
  return `
      <html dir="rtl" lang="ar">
        <head>
          <title>${escapeHtml(reportTitle)}</title>
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
                    <img src="${escapeHtml(systemSettings.associationLogo)}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  </div>
                ` : ''}
                <div>
                  <h1 class="text-2xl font-black text-emerald-800" style="font-size: 24px; font-weight: 900; color: #065f46; margin: 0;">${escapeHtml(schoolName)}</h1>
                  <p class="text-xs text-slate-500 font-medium mt-1" style="margin: 4px 0 0 0;">تقرير كشف شؤون الطلاب والتقدم الدراسي</p>
                </div>
              </div>
              <div class="text-left" style="text-align: left;">
                <p class="text-xs text-slate-400">تاريخ التقرير:</p>
                <p class="text-xs font-mono font-bold text-slate-700">${escapeHtml(new Date().toLocaleDateString("ar-MA"))}</p>
              </div>
            </div>

            <div class="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200" style="text-align: center; background-color: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 class="text-base font-bold text-slate-800">${escapeHtml(reportTitle)}</h2>
              <p class="text-xs text-slate-500 mt-1">نسخة مطبوعة من سجلات الطلاب والتقدم الدراسي الحالية</p>
            </div>

            <div class="grid grid-cols-3 gap-4" style="display: grid; grid-template-cols: repeat(3, minmax(0, 1fr)); gap: 16px;">
              <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-emerald-700 font-bold block" style="font-size: 10px; color: #047857; font-weight: 700; display: block;">إجمالي الطلاب في الكشف</span>
                <span class="text-lg font-black font-mono text-emerald-800" style="font-size: 18px; font-weight: 900; color: #065f46;">${escapeHtml(totalCount)} طالب</span>
              </div>
              <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center" style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-amber-700 font-bold block" style="font-size: 10px; color: #b45309; font-weight: 700; display: block;">التوزيع حسب الجنس</span>
                <span class="text-sm font-bold text-amber-800 block mt-1" style="color: #92400e;">${escapeHtml(maleCount)} ذكور / ${escapeHtml(femaleCount)} إناث</span>
              </div>
              <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px; text-align: center;">
                <span class="text-[10px] text-blue-700 font-bold block" style="font-size: 10px; color: #1d4ed8; font-weight: 700; display: block;">متوسط الحفظ الفعلي</span>
                <span class="text-lg font-black font-mono text-blue-800" style="font-size: 18px; font-weight: 900; color: #1e40af;">${escapeHtml(avgHizb)} حزب</span>
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
              <p>${escapeHtml(schoolName)} • إدارة شؤون الطلاب</p>
              <p>الصفحة 1 من 1</p>
            </div>
          </div>
        </body>
      </html>
  `;
}
