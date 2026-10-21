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
    <div data-modal="teacher-student-file" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="p-5 bg-emerald-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl overflow-hidden border border-white/10 shrink-0">
              <StudentAvatar student={teacherSelectedStudent} alt={teacherSelectedStudent.fullName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-sans">
                الملف التعليمي للطالب: {teacherSelectedStudent.fullName}
              </h3>
              <p className="text-xs text-emerald-200 font-sans">
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

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">

          {/* LEFT COLUMN: Record Progress Form & Core Updates (7 spans) */}
          <div className="lg:col-span-7 space-y-6">

            {(checkUserPermission(currentUser, currentRole, "students", "update") || checkUserPermission(currentUser, currentRole, "teacher-students", "update")) && (
              <>
                {/* 1. Core Profile & Teaching Updates */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>تعديل الحالة الراهنة وبيانات التدريس</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">السورة الحالية</label>
                      <input 
                        type="text" 
                        value={teacherSelectedStudent.currentSurah || ""}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, currentSurah: e.target.value } : null)}
                        placeholder="مثال: البقرة - الآية 142"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">مستوى التجويد الحالي</label>
                      <select 
                        value={teacherSelectedStudent.tajweedLevel || "متوسط"}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, tajweedLevel: e.target.value as any } : null)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      >
                        <option value="ممتاز">ممتاز (مخارج صحيحة وأحكام كاملة)</option>
                        <option value="متوسط">متوسط (يحتاج لبعض التوجيه)</option>
                        <option value="مبتدئ">مبتدئ (يتعلم القواعد الأساسية)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">عدد الأحزاب المحفوظة فعلياً</label>
                      <input 
                        type="number" 
                        min="0"
                        max="60"
                        value={teacherSelectedStudent.hizbCount ?? 1}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, hizbCount: Number(e.target.value) } : null)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">رأي وتوجيهات عامة للمعلم</label>
                      <input 
                        type="text" 
                        placeholder="ملاحظات وسلوكيات الطالب العامة..."
                        value={teacherSelectedStudent.notes || ""}
                        onChange={(e) => setTeacherSelectedStudent(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Daily Assessment Entry Form */}
                <form onSubmit={handleSaveDailyProgress} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2 border-b pb-2 font-sans">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>تسجيل تقييم ومتابعة الحفظ اليومي</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">تاريخ المتابعة</label>
                      <input 
                        type="date" 
                        value={progressDate}
                        onChange={(e) => setProgressDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">الحفظ الجديد (Sabaq)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: من آية 1 إلى آية 15"
                        value={progressMemorization}
                        onChange={(e) => setProgressMemorization(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">المراجعة القريبة (Kum - الأجزاء القريبة)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: سورة البقرة بالكامل"
                        value={progressRevision}
                        onChange={(e) => setProgressRevision(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-[11px]">المراجعة البعيدة (Sabqi - القديم)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: الجزء الأول والثاني"
                        value={progressOldRevision}
                        onChange={(e) => setProgressOldRevision(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div className="font-sans">
                    <label className="block text-slate-500 font-bold mb-2 text-[11px]">التقييم والتقدير اليومي</label>
                    <div className="flex flex-wrap gap-2">
                      {(["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setProgressRating(r)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                            progressRating === r 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific notes */}
                  <div className="font-sans">
                    <label className="block text-slate-500 font-bold mb-1 text-[11px]">ملاحظات وتوجيهات الحفظ اليومي</label>
                    <textarea 
                      rows={2}
                      placeholder="توجيهات محددة لهذا اليوم لولي الأمر أو الطالب..."
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition duration-150 shadow-md flex items-center gap-2"
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
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden max-h-[75vh]">
            <div className="border-b pb-3 flex justify-between items-center shrink-0 font-sans">
              <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>تاريخ وسجلات الحفظ السابقة</span>
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold">
                {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length} سجلات
              </span>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 font-sans">
              {dailyProgress.filter(dp => dp.studentId === teacherSelectedStudent.id).length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                  <p className="text-3xl mb-2">📖</p>
                  <p>لا توجد أي سجلات متابعة مسجلة بعد لهذا الطالب.</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-100 mr-2 space-y-5">
                  {dailyProgress
                    .filter(dp => dp.studentId === teacherSelectedStudent.id)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(record => (
                      <div key={record.id} className="relative pr-5">
                        {/* Dot timeline */}
                        <div className="absolute top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white"></div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2 hover:border-slate-300 transition relative group">
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteDailyProgress(record.id)}
                            className="absolute left-3 top-3 text-slate-400 hover:text-rose-600 transition p-1"
                            title="حذف هذا السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-200/50 px-2 py-0.5 rounded-full">
                              {record.date}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              record.rating === "ممتاز" ? "bg-emerald-100 text-emerald-800" :
                              record.rating === "جيد جداً" ? "bg-cyan-100 text-cyan-800" :
                              record.rating === "جيد" ? "bg-amber-100 text-amber-800" :
                              record.rating === "مقبول" ? "bg-orange-100 text-orange-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {record.rating}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-slate-700">
                            {record.memorizationPart && (
                              <p><span className="font-bold text-emerald-800 font-sans">الحفظ الجديد:</span> {record.memorizationPart}</p>
                            )}
                            {record.revisionPart && (
                              <p><span className="font-bold text-blue-800 font-sans">مراجعة قريبة:</span> {record.revisionPart}</p>
                            )}
                            {record.oldRevisionPart && (
                              <p><span className="font-bold text-slate-600 font-sans">مراجعة بعيدة:</span> {record.oldRevisionPart}</p>
                            )}
                            {record.notes && (
                              <div className="bg-white border p-2 rounded-lg mt-1 text-[10px] text-slate-500 border-dashed leading-relaxed">
                                <span className="font-bold text-slate-700 block mb-0.5 font-sans">ملاحظات التقييم:</span>
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
