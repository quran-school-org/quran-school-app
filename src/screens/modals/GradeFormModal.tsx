/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { X } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function GradeFormModal() {
  const {
    students,
    setShowGradeModal,
    gradeStudentId,
    setGradeStudentId,
    gradePortion,
    setGradePortion,
    gradeMemorization,
    setGradeMemorization,
    gradeTajweed,
    setGradeTajweed,
    gradeOverall,
    setGradeOverall,
    gradeNotes,
    setGradeNotes,
    handleSaveGrade,
  } = useApp();

  return (
    <div data-modal="grade-form" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="p-4 bg-emerald-800 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm">رصد نتيجة اختبار وشهادة</h3>
          <button onClick={() => setShowGradeModal(false)} className="text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveGrade} className="p-5 space-y-4 text-xs overflow-y-auto">

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">الطالب الممتحن:</label>
            <select
              value={gradeStudentId}
              onChange={(e) => setGradeStudentId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">الجزء أو السور الممتحن فيها:</label>
            <input
              type="text"
              required
              value={gradePortion}
              onChange={(e) => setGradePortion(e.target.value)}
              placeholder="مثال: من الحزب 1 إلى 5"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">درجة جودة الحفظ (من 20):</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                required
                value={gradeMemorization}
                onChange={(e) => setGradeMemorization(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">درجة جودة التجويد (من 20):</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                required
                value={gradeTajweed}
                onChange={(e) => setGradeTajweed(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">التقدير الإجمالي والتحفيزي:</label>
            <select
              value={gradeOverall}
              onChange={(e) => setGradeOverall(e.target.value as any)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value="ممتاز">ممتاز</option>
              <option value="جيد جداً">جيد جداً</option>
              <option value="جيد">جيد</option>
              <option value="مقبول">مقبول</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">ملاحظات تربوية من المعلم:</label>
            <textarea
              value={gradeNotes}
              onChange={(e) => setGradeNotes(e.target.value)}
              placeholder="سرعة جيدة، انتبه لمخارج الحروف..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs h-16 resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={() => setShowGradeModal(false)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition"
            >
              تسجيل واصدار الشهادة
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
