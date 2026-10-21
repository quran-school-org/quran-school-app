/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Student, checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import StudentCard from "../components/StudentCard";
import { Sparkles, Plus, Search, Trash2, Edit3, Check, X, Phone, RefreshCw, Eye, Download, Archive } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function StudentsScreen() {
  const {
    students,
    classes,
    currentUser,
    searchQuery,
    setSearchQuery,
    studentArchiveFilter,
    setStudentArchiveFilter,
    selectedStudent,
    setSelectedStudent,
    aiReport,
    setAiReport,
    aiLoading,
    aiError,
    currentRole,
    schoolName,
    filteredStudents,
    handleOpenStudentForm,
    handleDeleteStudent,
    handleToggleArchiveStudent,
    handlePrintStudentsReport,
    handleExportStudentsCSV,
    handleExportStudentsJSON,
    handleGenerateAIReport,
  } = useApp();

  return (
    <div data-screen="students" className="space-y-6">

      {/* Header Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-sand-800">
            {currentRole === "طالب"
              ? "ملفي الشخصي وسجل الحفظ القرآني"
              : currentRole === "ولي أمر"
              ? "متابعة الأبناء وسجلات الحفظ"
              : "إدارة ملفات الطلاب والوثائق الإدارية"}
          </h2>
          <p className="text-xs text-sand-500">
            {currentRole === "طالب"
              ? "استعراض مقدار الحفظ الحالي، مستوى التجويد، والوثائق الإدارية المعتمدة."
              : "سجل معلومات الطلاب، تتبع أوراقهم، ومقدار حفظهم وتجويدهم."}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-sand-500" />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو ولي الأمر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-sand-300 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-600"
            />
          </div>

          <select
            value={studentArchiveFilter}
            onChange={(e) => setStudentArchiveFilter(e.target.value as "active" | "archived" | "all")}
            className="p-2 border border-sand-300 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-600 font-bold text-sand-700 cursor-pointer"
          >
            <option value="active">الطلاب النشطون</option>
            <option value="archived">الطلاب المؤرشفون</option>
            <option value="all">الكل (نشط ومؤرشف)</option>
          </select>

          {checkUserPermission(currentUser, currentRole, "students", "print") && (
            <div className="relative group shrink-0">
              <button className="bg-sand-100 hover:bg-sand-200 text-sand-700 border border-sand-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm h-full" id="export-students-dropdown-btn">
                <Download className="w-4 h-4 text-sand-500" />
                <span>تصدير البيانات</span>
              </button>
              <div className="absolute left-0 md:right-0 md:left-auto top-full mt-1 bg-white border border-sand-200 rounded-xl shadow-lg hidden group-hover:block hover:block z-50 min-w-[160px] overflow-hidden" id="export-students-menu">
                <button
                  onClick={handleExportStudentsCSV}
                  className="w-full text-right px-4 py-2.5 hover:bg-sand-50 text-xs text-sand-700 transition font-bold"
                  id="export-students-csv-btn"
                >
                  📄 تصدير بصيغة CSV
                </button>
                <button
                  onClick={handleExportStudentsJSON}
                  className="w-full text-right px-4 py-2.5 hover:bg-sand-50 text-xs text-sand-700 border-t border-sand-100 transition font-bold"
                  id="export-students-json-btn"
                >
                  ⚙️ تصدير بصيغة JSON
                </button>
                <button
                  onClick={handlePrintStudentsReport}
                  className="w-full text-right px-4 py-2.5 hover:bg-sand-50 text-xs text-sand-700 border-t border-sand-100 transition font-bold flex items-center gap-1.5"
                  id="export-students-pdf-btn"
                >
                  🖨️ تصدير PDF / طباعة
                </button>
              </div>
            </div>
          )}

          {checkUserPermission(currentUser, currentRole, "students", "create") && (
            <button
              data-action="open-student-form"
              onClick={() => handleOpenStudentForm()}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              إضافة طالب جديد
            </button>
          )}
        </div>
      </div>

      {/* Main Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Students Table List */}
        <div className="bg-white rounded-2xl shadow-sm border border-sand-200 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 bg-sand-50/50 border-b border-sand-100 font-bold text-xs text-sand-700 flex justify-between items-center">
            <span>قائمة طلاب النادي</span>
            <span className="text-[10px] text-sand-500">تم العثور على {filteredStudents.length} طالب</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-sand-50 text-sand-500 uppercase text-[10px] border-b">
                <tr>
                  <th className="p-3">الطالب</th>
                  <th className="p-3">ولي الأمر والهاتف</th>
                  <th className="p-3 text-center">أحزاب القرآن</th>
                  <th className="p-3 text-center">التجويد</th>
                  <th className="p-3 text-center">الأوراق الإدارية</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => (
                    <tr 
                      key={st.id} 
                      onClick={() => {
                        setSelectedStudent(st);
                        setAiReport(null);
                      }}
                      className={`cursor-pointer transition-colors ${
                        selectedStudent?.id === st.id ? "bg-primary-50/40 border-r-4 border-primary-600" : "hover:bg-sand-50"
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-sand-100 shrink-0 border border-sand-200 flex items-center justify-center">
                            <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`font-bold ${st.isArchived ? "text-sand-500 line-through" : "text-sand-800"}`}>{st.fullName}</p>
                              {st.isArchived && (
                                <span className="bg-sand-100 text-sand-500 border border-sand-200 px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0">
                                  مؤرشف
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-sand-500">ازدياد: {st.birthDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-sand-700">{st.parentName}</p>
                        <p className="text-[10px] text-sand-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-sand-500 inline" /> {st.parentPhone}
                        </p>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-primary-800 text-sm">
                        {st.hizbCount} حزب
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          st.tajweedLevel === "ممتاز" 
                            ? "bg-primary-100 text-primary-800" 
                            : st.tajweedLevel === "متوسط" 
                            ? "bg-primary-100 text-primary-800" 
                            : "bg-danger-100 text-danger-800"
                        }`}>
                          {st.tajweedLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1.5" title="البطاقة الوطنية لولي الأمر / عقد الازدياد / صورتان">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docParentId ? "bg-primary-50 text-primary-700 border border-primary-200" : "bg-sand-100 text-sand-500"}`}>
                            بطاقة
                          </span>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docBirthCert ? "bg-primary-50 text-primary-700 border border-primary-200" : "bg-sand-100 text-sand-500"}`}>
                            عقد
                          </span>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${st.docPhotos ? "bg-primary-50 text-primary-700 border border-primary-200" : "bg-sand-100 text-sand-500"}`}>
                            صور
                          </span>
                        </div>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          {checkUserPermission(currentUser, currentRole, "students", "update") && (
                            <>
                              <button 
                                onClick={() => handleOpenStudentForm(st)} 
                                className="p-1 hover:bg-sand-100 rounded text-sand-600 transition" 
                                title="تعديل الطالب"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleToggleArchiveStudent(st.id, st.fullName)} 
                                className={`p-1 rounded transition ${st.isArchived ? "hover:bg-primary-50 text-primary-600" : "hover:bg-gold-50 text-gold-600"}`}
                                title={st.isArchived ? "إلغاء الأرشفة (تنشيط)" : "أرشفة الطالب"}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {checkUserPermission(currentUser, currentRole, "students", "delete") && (
                            <button 
                              onClick={() => handleDeleteStudent(st.id, st.fullName)} 
                              className="p-1 hover:bg-danger-50 rounded text-danger-600 transition" 
                              title="حذف الطالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => { setSelectedStudent(st); setAiReport(null); }}
                            className="p-1 hover:bg-primary-50 rounded text-primary-700 transition" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sand-500">
                      لا يوجد طلاب مسجلون يطابقون خيارات البحث الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detailed Dossier, Printable Member Card & AI Progress Analyzer */}
        <div className="space-y-6">
          {selectedStudent ? (
            <>
              {/* DOSSIER CARD */}
              <div className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sand-800 text-sm">ملف الطالب الرقمي</h3>
                  <span className="text-[10px] bg-sand-100 text-sand-500 font-mono px-2 py-0.5 rounded">
                    {selectedStudent.id.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-sand-100 border-2 border-primary-500 shrink-0">
                    <StudentAvatar student={selectedStudent} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sand-800 text-base">{selectedStudent.fullName}</h4>
                    <p className="text-xs text-sand-500">{classes.find(c => c.id === selectedStudent.classId)?.name || "فصل غير معين"}</p>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="bg-sand-50 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-sand-500">الجنس:</span>
                    <span className="font-semibold text-sand-800">{selectedStudent.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">تاريخ الازدياد:</span>
                    <span className="font-semibold text-sand-800 font-mono">{selectedStudent.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">تاريخ التسجيل:</span>
                    <span className="font-semibold text-sand-800 font-mono">{selectedStudent.registrationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">اسم ولي الأمر:</span>
                    <span className="font-semibold text-sand-800">{selectedStudent.parentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sand-500">هاتف ولي الأمر:</span>
                    <span className="font-semibold text-sand-800 font-mono">{selectedStudent.parentPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500 font-bold text-primary-800">الحفظ الفعلي:</span>
                    <span className="font-bold text-primary-700 font-mono">{selectedStudent.hizbCount} حزب من القرآن</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">السورة الحالية:</span>
                    <span className="font-semibold text-sand-800 text-gold-600">{selectedStudent.currentSurah}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">مستوى التجويد:</span>
                    <span className="font-bold text-sand-800">{selectedStudent.tajweedLevel}</span>
                  </div>
                </div>

                {/* WhatsApp Message Button */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      const phone = (selectedStudent?.parentPhone || "").replace(/\s+/g, "");
                      let formattedPhone = phone;
                      if (phone.startsWith("0")) {
                        formattedPhone = "212" + phone.substring(1);
                      }
                      const rawMsg = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) ${selectedStudent.fullName} المحترم(ة)... ${schoolName}.`;
                      const encodedMsg = encodeURIComponent(rawMsg);
                      window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, "_blank");
                    }}
                    className="w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 hover:shadow-sm"
                    id="whatsapp-contact-parent-btn"
                  >
                    <svg className="w-4 h-4 fill-primary-600" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                    </svg>
                    <span>مراسلة ولي الأمر عبر واتساب</span>
                  </button>
                </div>

                {/* Administrative documents status list */}
                <div className="border-t pt-3">
                  <p className="text-xs font-bold text-sand-700 mb-2">الوثائق والملفات الإدارية المقدمة:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-sand-50 p-2 rounded-lg">
                      {selectedStudent.docParentId ? (
                        <Check className="w-4 h-4 text-primary-600 font-bold" />
                      ) : (
                        <X className="w-4 h-4 text-danger-500 font-bold" />
                      )}
                      <span>فوتوكوبي من البطاقة الوطنية لولي الأمر</span>
                    </div>
                    <div className="flex items-center gap-2 bg-sand-50 p-2 rounded-lg">
                      {selectedStudent.docBirthCert ? (
                        <Check className="w-4 h-4 text-primary-600 font-bold" />
                      ) : (
                        <X className="w-4 h-4 text-danger-500 font-bold" />
                      )}
                      <span>عقد ازدياد الطالب</span>
                    </div>
                    <div className="flex items-center gap-2 bg-sand-50 p-2 rounded-lg">
                      {selectedStudent.docPhotos ? (
                        <Check className="w-4 h-4 text-primary-600 font-bold" />
                      ) : (
                        <X className="w-4 h-4 text-danger-500 font-bold" />
                      )}
                      <span>صورتان شمسيتان حديثتان</span>
                    </div>
                  </div>
                </div>

                {selectedStudent.notes && (
                  <div className="bg-gold-50/50 border border-gold-200 rounded-xl p-3 text-xs text-gold-900">
                    <p className="font-bold">ملاحظات المعلم:</p>
                    <p className="mt-1 leading-relaxed text-sand-700">{selectedStudent.notes}</p>
                  </div>
                )}

                {/* AI ANALYSIS TRIGGERS */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => handleGenerateAIReport(selectedStudent)}
                    disabled={aiLoading}
                    className="w-full py-2.5 bg-gradient-to-l from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-gold-300 animate-pulse" />
                    {aiLoading ? "جاري توليد التقرير بالذكاء الاصطناعي..." : "تحليل تقدم الطالب بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>

              {/* AI GENERATED PROGRESS PORTAL (CONDITIONAL) */}
              {(aiReport || aiLoading || aiError) && (
                <div className="bg-sand-900 text-sand-100 rounded-2xl shadow-xl p-6 border-4 border-gold-400 space-y-4">
                  <div className="flex justify-between items-center border-b border-sand-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold-400" />
                      <h4 className="font-bold text-gold-400 text-sm">التقرير التربوي الذكي لـ{schoolName}</h4>
                    </div>
                    <span className="text-[10px] bg-sand-800 text-sand-500 px-2 py-0.5 rounded">موجه بالذكاء الاصطناعي</span>
                  </div>

                  {aiLoading && (
                    <div className="py-8 flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
                      <p className="text-xs text-sand-500">يقوم الذكاء الاصطناعي بتحليل جودة التلاوة ومستوى الحفظ والمواظبة على الفصول حالياً...</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3 bg-danger-950/50 border border-danger-900 rounded-xl text-xs text-danger-300">
                      {aiError}
                    </div>
                  )}

                  {aiReport && (
                    <div className="space-y-4 text-xs leading-relaxed">
                      {/* 1. Summary */}
                      <div className="space-y-1">
                        <p className="font-bold text-gold-300">📊 ملخص الأداء والتقدم:</p>
                        <p className="text-sand-400 bg-sand-950/50 p-3 rounded-lg border border-sand-800">{aiReport.summary}</p>
                      </div>

                      {/* 2. Tajweed Tips */}
                      <div className="space-y-1">
                        <p className="font-bold text-gold-300">📖 نصائح عملية للتجويد والتلاوة:</p>
                        <ul className="list-disc pr-4 space-y-1.5 text-sand-400">
                          {aiReport.tajweedTips?.map((tip: string, idx: number) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Suggested Study Plan */}
                      <div className="space-y-1">
                        <p className="font-bold text-gold-300">📅 خطة حفظ ومراجعة مقترحة:</p>
                        <p className="text-sand-400 bg-sand-950/50 p-3 rounded-lg border border-sand-800">{aiReport.studyPlan}</p>
                      </div>

                      {/* 4. Parent message */}
                      <div className="space-y-1">
                        <p className="font-bold text-primary-400">🏠 رسالة لولي الأمر في البيت:</p>
                        <p className="text-sand-400 bg-sand-950/50 p-3 rounded-lg border border-sand-800 italic">"{aiReport.parentMessage}"</p>
                      </div>

                      {/* 5. Recommended Surahs */}
                      <div className="space-y-1">
                        <p className="font-bold text-gold-300">🎯 سور يوصى بتمتينها وتثبيتها:</p>
                        <div className="flex gap-2">
                          {aiReport.recommendedSurahs?.map((surah: string, idx: number) => (
                            <span key={idx} className="bg-primary-900/40 text-primary-300 px-2.5 py-1 rounded-full border border-primary-800/60 font-medium text-[10px]">
                              {surah}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DYNAMIC REAL-TIME GENERATED STUDENT CARD (PORTAL VIEW) */}
              <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
                <div className="p-4 bg-sand-50 border-b flex justify-between items-center">
                  <h4 className="text-xs font-bold text-sand-800">معاينة بطاقة الطالب للاستخدام والتصدير</h4>
                  <span className="text-[10px] text-primary-700 font-bold">بشعار الجمعية</span>
                </div>
                <div className="p-4 bg-sand-100 flex justify-center">
                  <StudentCard 
                    student={selectedStudent} 
                    studentClass={classes.find(c => c.id === selectedStudent.classId)} 
                    canPrint={checkUserPermission(currentUser, currentRole, "students", "print")}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-sand-100 rounded-2xl border-2 border-dashed border-sand-300 p-8 text-center text-sand-500 text-xs">
              الرجاء اختيار طالب من القائمة لعرض تفاصيله وبطاقته أو إجراء تحليلات تقدمه التجويدي بالذكاء الاصطناعي.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
