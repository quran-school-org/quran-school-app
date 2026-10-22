/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../../types";
import { StudentAvatar } from "../../utils/studentAvatar";
import { BookOpen, Award, Trash2, Check, X, FileText } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function TeacherStudentFileModal() {
  const {
    students,
    dailyProgress,
    currentUser,
    setShowTeacherStudentFileModal,
    teacherSelectedStudent,
    setTeacherSelectedStudent,
    progressDate,
    setProgressDate,
    progressMemorization,
    setProgressMemorization,
    progressRevision,
    setProgressRevision,
    progressOldRevision,
    setProgressOldRevision,
    progressRating,
    setProgressRating,
    progressNotes,
    setProgressNotes,
    currentRole,
    handleSaveDailyProgress,
    handleDeleteDailyProgress,
  } = useApp();

  return (
    <div data-modal="teacher-student-file" className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
      <div className="bg-surface w-full max-w-4xl overflow-hidden my-8 max-h-[90vh] flex flex-col rounded-3xl border border-line shadow-pop">
        <div className="flex justify-between items-center shrink-0 bg-night text-night-text px-6 py-4 border-b border-night-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl overflow-hidden border border-white/10 shrink-0">
              <StudentAvatar student={teacherSelectedStudent} alt={teacherSelectedStudent.fullName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-sans">
                الملف التعليمي للطالب: {teacherSelectedStudent.fullName}
              </h3>
              <p className="text-[13px] text-primary-200 font-sans">
                رقم العضوية: {teacherSelectedStudent.studentNumber || "N/A"} | المستوى الدراسي: {teacherSelectedStudent.educationLevel}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowTeacherStudentFileModal(false);
              setTeacherSelectedStudent(null);
            }} 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-sand-50">

          {/* LEFT COLUMN: Record Progress Form & Core Updates (7 spans) */}
          <div className="lg:col-span-7 space-y-6">

            {(checkUserPermission(currentUser, currentRole, "students", "update") || checkUserPermission(currentUser, currentRole, "teacher-students", "update")) && (
              <>
                {/* 1. Core Profile & Teaching Updates */}
                <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
                  <h4 className="font-bold text-ink text-[13px] sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                    <BookOpen className="w-4 h-4 text-primary-600" />
                    <span>تعديل الحالة الراهنة وبيانات التدريس</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">السورة الحالية</label>
                      <input 
                        type="text" 
                        value={teacherSelectedStudent.currentSurah || ""}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, currentSurah: e.target.value } : null)}
                        placeholder="مثال: البقرة - الآية 142"
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">مستوى التجويد الحالي</label>
                      <select 
                        value={teacherSelectedStudent.tajweedLevel || "متوسط"}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, tajweedLevel: e.target.value as any } : null)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      >
                        <option value="ممتاز">ممتاز (مخارج صحيحة وأحكام كاملة)</option>
                        <option value="متوسط">متوسط (يحتاج لبعض التوجيه)</option>
                        <option value="مبتدئ">مبتدئ (يتعلم القواعد الأساسية)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">عدد الأحزاب المحفوظة فعلياً</label>
                      <input 
                        type="number" 
                        min="0"
                        max="60"
                        value={teacherSelectedStudent.hizbCount ?? 1}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, hizbCount: Number(e.target.value) } : null)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رأي وتوجيهات عامة للمعلم</label>
                      <input 
                        type="text" 
                        placeholder="ملاحظات وسلوكيات الطالب العامة..."
                        value={teacherSelectedStudent.notes || ""}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Daily Assessment Entry Form */}
                <form onSubmit={handleSaveDailyProgress} className="bg-surface rounded-2xl p-5 border border-line space-y-4">
                  <h4 className="font-bold text-ink text-[13px] sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                    <Award className="w-4 h-4 text-primary-600" />
                    <span>تسجيل تقييم ومتابعة الحفظ اليومي</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ المتابعة</label>
                      <input 
                        type="date" 
                        value={progressDate}
                        onChange={(e) => setProgressDate(e.target.value)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الحفظ الجديد (Sabaq)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: من آية 1 إلى آية 15"
                        value={progressMemorization}
                        onChange={(e) => setProgressMemorization(e.target.value)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المراجعة القريبة (Kum - الأجزاء القريبة)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: سورة البقرة بالكامل"
                        value={progressRevision}
                        onChange={(e) => setProgressRevision(e.target.value)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المراجعة البعيدة (Sabqi - القديم)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: الجزء الأول والثاني"
                        value={progressOldRevision}
                        onChange={(e) => setProgressOldRevision(e.target.value)}
                        className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                      />
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div className="font-sans">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">التقييم والتقدير اليومي</label>
                    <div className="flex flex-wrap gap-2">
                      {(["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setProgressRating(r)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition duration-150 ${
                            progressRating === r 
                              ? "bg-primary-600 border-primary-600 text-white shadow-md"
                              : "bg-sand-50 border-line text-ink-2 hover:bg-sand-100"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific notes */}
                  <div className="font-sans">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملاحظات وتوجيهات الحفظ اليومي</label>
                    <textarea 
                      rows={2}
                      placeholder="توجيهات محددة لهذا اليوم لولي الأمر أو الطالب..."
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ التغييرات وتسجيل المتابعة اليومية</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Daily Progress Records History (5 spans) */}
          <div className="lg:col-span-5 bg-surface rounded-2xl p-5 border border-line flex flex-col h-full overflow-hidden max-h-[75vh]">
            <div className="border-b pb-3 flex justify-between items-center shrink-0 font-sans">
              <h4 className="font-bold text-ink text-[13px] sm:text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <span>تاريخ وسجلات الحفظ السابقة</span>
              </h4>
              <span className="text-[11.5px] bg-sand-100 text-ink-3 font-mono px-2 py-0.5 rounded font-bold">
                {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length} سجلات
              </span>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 font-sans">
              {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length === 0 ? (
                <div className="text-center py-16 text-ink-3 text-[13px] flex flex-col items-center justify-center h-full">
                  <p className="text-3xl mb-2">📖</p>
                  <p>لا توجد أي سجلات متابعة مسجلة بعد لهذا الطالب.</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-line-soft mr-2 space-y-5">
                  {dailyProgress
                    .filter(dp => dp.studentId === teacherSelectedStudent.id)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(record => (
                      <div key={record.id} className="relative pr-5">
                        {/* Dot timeline */}
                        <div className="absolute top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-white"></div>

                        <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-150 space-y-2 hover:border-line-strong transition relative group">
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteDailyProgress(record.id)}
                            className="absolute left-3 top-3 text-ink-3 hover:text-danger-600 transition p-1"
                            title="حذف هذا السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex justify-between items-center">
                            <span className="text-[11.5px] text-ink-3 font-mono font-bold bg-sand-200/50 px-2 py-0.5 rounded-full">
                              {record.date}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              record.rating === "ممتاز" ? "bg-primary-100 text-primary-800" :
                              record.rating === "جيد جداً" ? "bg-primary-100 text-primary-800" :
                              record.rating === "جيد" ? "bg-gold-100 text-gold-800" :
                              record.rating === "مقبول" ? "bg-gold-100 text-gold-800" :
                              "bg-danger-100 text-danger-800"
                            }`}>
                              {record.rating}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[12.5px] text-ink-2">
                            {record.memorizationPart && (
                              <p><span className="font-bold text-primary-800 font-sans">الحفظ الجديد:</span> {record.memorizationPart}</p>
                            )}
                            {record.revisionPart && (
                              <p><span className="font-bold text-primary-800 font-sans">مراجعة قريبة:</span> {record.revisionPart}</p>
                            )}
                            {record.oldRevisionPart && (
                              <p><span className="font-bold text-ink-2 font-sans">مراجعة بعيدة:</span> {record.oldRevisionPart}</p>
                            )}
                            {record.notes && (
                              <div className="bg-white border p-2 rounded-lg mt-1 text-[11.5px] text-ink-3 border-dashed leading-relaxed">
                                <span className="font-bold text-ink-2 block mb-0.5 font-sans">ملاحظات التقييم:</span>
                                {record.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
