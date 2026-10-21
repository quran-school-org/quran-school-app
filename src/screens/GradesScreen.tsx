/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function GradesScreen() {
  const {
    students,
    teachers,
    grades,
    currentUser,
    currentRole,
    schoolName,
    handleOpenGradeForm,
    handleDeleteGrade,
    handlePrintCertificate,
  } = useApp();

  return (
    <div data-screen="grades" className="space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">نتائج امتحانات الحفظ والتجويد وإصدار الشهادات</h2>
          <p className="text-xs text-slate-500">سجل نتائج الاختبارات الدورية التي يشرف عليها معلمو الحلقات.</p>
        </div>

        {checkUserPermission(currentUser, currentRole, "grades", "create") && (
          <button
            data-action="open-grade-form"
            onClick={() => {
              if (students.length > 0) {
                handleOpenGradeForm(students[0].id);
              } else {
                alert("يرجى تسجيل طلاب أولاً.");
              }
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            رصد نتيجة اختبار جديدة
          </button>
        )}
      </div>

      {/* Grades Table & Certificate generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Grades list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b font-bold text-xs text-slate-700">
            قائمة شهادات الاختبار المعتمدة
          </div>

          <div className="divide-y divide-slate-100">
            {grades.length > 0 ? (
              grades.map((gr) => {
                const stud = students.find(s => s.id === gr.studentId);
                const teacher = teachers.find(t => t.id === gr.examinerId);

                return (
                  <div key={gr.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50/40">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-zinc-950 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {gr.overallGrade}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm">{stud?.fullName || "طالب مجهول"}</h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-500">
                        <p>الامتحان: <span className="font-bold text-slate-700">{gr.testedPortion}</span></p>
                        <p>درجة الحفظ: <span className="font-bold font-mono text-emerald-700">{gr.memorizationGrade}/20</span></p>
                        <p>درجة التجويد: <span className="font-bold font-mono text-emerald-700">{gr.tajweedGrade}/20</span></p>
                        <p className="md:col-span-3">تاريخ الاختبار: <span className="font-mono font-medium">{gr.examDate}</span></p>
                      </div>

                      {gr.notes && (
                        <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 italic">
                          "{gr.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Printable Certificate button simulated with simple alert/print window */}
                      {checkUserPermission(currentUser, currentRole, "grades", "print") && (
                        <button
                          onClick={() => handlePrintCertificate(stud, gr)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          📜 عرض الشهادة التقديرية
                        </button>
                      )}

                      {checkUserPermission(currentUser, currentRole, "grades", "delete") && (
                        <button
                          onClick={() => handleDeleteGrade(gr.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                لم يتم رصد اختبارات أو شهادات تقديرية للطلاب بعد.
              </div>
            )}
          </div>
        </div>

        {/* Certificate Showcase mockup */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-4 border-amber-300 text-center space-y-4 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

          <div className="border border-amber-200 p-4 rounded-xl space-y-3">
            <span className="text-3xl block">📜</span>
            <h3 className="font-serif font-black text-amber-900 text-base">شهادة حفظ وتميز تجويدي</h3>
            <p className="text-[11px] text-amber-800 leading-relaxed font-serif">
              قال رسول الله صلى الله عليه وسلم:<br/>
              <span className="font-bold italic">"الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ"</span>
            </p>

            <div className="h-0.5 bg-gradient-to-l from-transparent via-amber-400 to-transparent my-2" />

            <p className="text-xs text-slate-700 leading-relaxed">
              يصدر النادي شهادات معتمدة مع طباعة أوتوماتيكية للطلاب المتميزين تشجيعاً لهم في مسيرتهم التعليمية مع كتاب الله.
            </p>
          </div>

          <p className="text-[10px] text-amber-700 font-bold">بإشراف {schoolName}</p>
        </div>

      </div>

    </div>
  );
}
