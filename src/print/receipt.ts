/**
 * Reçu de paiement d'une cotisation (fenêtre d'impression).
 * Gabarit HTML déplacé tel quel depuis App.tsx (Lot 2).
 */
import type { Payment, Student, SystemSettings } from "../types";

export function receiptHtml(p: Payment, stud: Student, systemSettings: SystemSettings | null, schoolName: string): string {
  return `
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
  `;
}
