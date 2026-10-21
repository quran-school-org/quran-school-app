/**
 * Certificat d'examen (fenêtre d'impression).
 * Gabarit HTML déplacé tel quel depuis App.tsx (Lot 2).
 */
import type { Payment, Student, SystemSettings } from "../types";

export function certificateHtml(stud: any, gr: any, associationName: string, associationLogo: string, systemSettings: SystemSettings | null): string {
  return `
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
  `;
}
