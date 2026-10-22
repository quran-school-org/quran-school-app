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
    <div data-modal="grade-form" className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
      <div className="bg-surface w-full max-w-md overflow-hidden my-8 max-h-[90vh] flex flex-col rounded-3xl border border-line shadow-pop">
        <div className="flex justify-between items-center shrink-0 bg-night text-night-text px-6 py-4 border-b border-night-line">
          <h3 className="font-bold text-sm">رصد نتيجة اختبار وشهادة</h3>
          <button onClick={() => setShowGradeModal(false)} className="text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveGrade} className="p-5 space-y-4 text-[13px] overflow-y-auto">

          <div className="space-y-1">
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الطالب الممتحن:</label>
            <select
              value={gradeStudentId}
              onChange={(e) => setGradeStudentId(e.target.value)}
              className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الجزء أو السور الممتحن فيها:</label>
            <input
              type="text"
              required
              value={gradePortion}
              onChange={(e) => setGradePortion(e.target.value)}
              placeholder="مثال: من الحزب 1 إلى 5"
              className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">درجة جودة الحفظ (من 20):</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                required
                value={gradeMemorization}
                onChange={(e) => setGradeMemorization(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">درجة جودة التجويد (من 20):</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                required
                value={gradeTajweed}
                onChange={(e) => setGradeTajweed(Number(e.target.value))}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">التقدير الإجمالي والتحفيزي:</label>
            <select
              value={gradeOverall}
              onChange={(e) => setGradeOverall(e.target.value as any)}
              className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
            >
              <option value="ممتاز">ممتاز</option>
              <option value="جيد جداً">جيد جداً</option>
              <option value="جيد">جيد</option>
              <option value="مقبول">مقبول</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملاحظات تربوية من المعلم:</label>
            <textarea
              value={gradeNotes}
              onChange={(e) => setGradeNotes(e.target.value)}
              placeholder="سرعة جيدة، انتبه لمخارج الحروف..."
              className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full h-16 resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={() => setShowGradeModal(false)}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
            >
              تسجيل واصدار الشهادة
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
