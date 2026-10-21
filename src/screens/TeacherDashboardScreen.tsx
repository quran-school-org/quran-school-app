/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { StudentAvatar } from "../utils/studentAvatar";
import { Users, BookOpen } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function TeacherDashboardScreen() {
  const {
    students,
    classes,
    setShowTeacherStudentFileModal,
    setTeacherSelectedStudent,
    setProgressDate,
    setProgressMemorization,
    setProgressRevision,
    setProgressOldRevision,
    setProgressNotes,
    activeTeacher,
    teacherClasses,
    teacherStudents,
    getStudentAttendanceRate,
    teacherAverageAttendance,
    teacherAverageHizb,
    teacherFurthestHizb,
  } = useApp();

  return (
    <div data-screen="teacher-dashboard" className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header Welcome Banner */}
      <div className="bg-gradient-to-l from-primary-800 to-primary-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="bg-gold-400 text-sand-950 font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full font-sans">بوابة المدرس والمحفّظ</span>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight mt-1 font-sans">
              مرحباً بك، {activeTeacher?.fullName || "المحفظ الفاضل"} 👋
            </h2>
            <p className="text-xs md:text-sm text-primary-100 max-w-xl leading-relaxed font-sans">
              تتيح لك هذه اللوحة استعراض الحلقات والطلاب المسندين إليك، وإدخال بيانات الحفظ اليومية، ومتابعة تطور مستويات التجويد لطلابك.
            </p>
          </div>
          {activeTeacher?.specialty && (
            <div className="bg-primary-700/50 border border-primary-500/30 rounded-2xl p-4 text-xs font-sans">
              <p className="font-bold text-gold-300">التخصص الحالي:</p>
              <p className="text-white mt-1">{activeTeacher.specialty}</p>
              {activeTeacher.trainingCourses && activeTeacher.trainingCourses.length > 0 && (
                <p className="text-primary-200 mt-1.5 text-[10px]">
                  🎓 {activeTeacher.trainingCourses[0]}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <p className="text-xs font-bold text-sand-500 mb-1 font-sans">الحلقات المسندة</p>
          <h3 className="text-3xl font-black text-sand-800 font-mono">{teacherClasses.length}</h3>
          <div className="mt-2 text-[11px] text-primary-600 font-bold flex items-center gap-1 font-sans">
            <span>📚 فصول دراسية نشطة</span>
          </div>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <p className="text-xs font-bold text-sand-500 mb-1 font-sans">إجمالي طلابي</p>
          <h3 className="text-3xl font-black text-sand-800 font-mono">{teacherStudents.length}</h3>
          <div className="mt-2 text-[11px] text-primary-600 font-bold flex items-center gap-1 font-sans">
            <span>🧑‍🎓 طالباً تحت إشرافك</span>
          </div>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <p className="text-xs font-bold text-sand-500 mb-1 font-sans">متوسط نسبة الحضور</p>
          <h3 className="text-3xl font-black text-sand-800 font-mono">{teacherAverageAttendance}%</h3>
          <div className="mt-2 w-full bg-sand-100 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${teacherAverageAttendance}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <p className="text-xs font-bold text-sand-500 mb-1 font-sans">أبعد حزب بلغه طالب</p>
          <h3 className="text-3xl font-black text-primary-700 font-mono">{teacherFurthestHizb} <span className="text-sm font-normal text-sand-500">حزب</span></h3>
          <div className="mt-2 text-[11px] text-sand-500 font-bold flex items-center justify-between font-sans">
            <span>📖 أقصى حفظ مسجل</span>
            <span className="text-primary-700 font-mono">المعدل: {teacherAverageHizb}</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Left = My Classes, Right = Students Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MY CLASSES LIST (1 Column) */}
        <div className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b pb-3 flex justify-between items-center font-sans">
            <h3 className="font-extrabold text-sand-800 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-600" />
              <span>الحلقات والحلقات الدراسية المسندة</span>
            </h3>
            <span className="text-[10px] bg-sand-100 text-sand-500 font-mono px-2 py-0.5 rounded font-bold">
              {teacherClasses.length} حلقات
            </span>
          </div>

          {teacherClasses.length === 0 ? (
            <div className="text-center py-8 text-sand-500 text-xs font-sans">
              <p>📭 لم يتم إسناد أي حلقات لك بعد في النظام.</p>
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {teacherClasses.map(cls => {
                const classStudents = students.filter(s => s.classId === cls.id && !s.isArchived);
                return (
                  <div key={cls.id} className="p-4 bg-sand-50 border border-sand-200 rounded-xl hover:border-primary-500 transition">
                    <h4 className="font-bold text-sand-800 text-xs sm:text-sm">{cls.name}</h4>
                    <p className="text-[10px] text-sand-500 mt-1 leading-relaxed">🕒 {cls.schedule}</p>
                    <div className="mt-3 flex justify-between items-center text-[11px]">
                      <span className="text-sand-500 font-bold">عدد الطلاب:</span>
                      <span className="font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full font-mono">
                        {classStudents.length} / {cls.maxStudents} طالب
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MY STUDENTS TABLE & FILE TRIGGER (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-sand-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 font-sans">
            <div>
              <h3 className="font-extrabold text-sand-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                <span>قائمة الطلاب المسجلين بحلقاتك</span>
              </h3>
              <p className="text-[10px] text-sand-500 mt-0.5">انقر على "فتح ملف المتابعة" لتسجيل الحفظ ومراجعة الطالب.</p>
            </div>
            <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1 rounded-full font-bold">
              إجمالي طلابك: {teacherStudents.length} طلاب
            </span>
          </div>

          {teacherStudents.length === 0 ? (
            <div className="text-center py-12 text-sand-500 text-xs flex-1 flex flex-col items-center justify-center font-sans">
              <p className="text-2xl mb-2">🧒</p>
              <p>لا يوجد طلاب مسجلون بحلقاتك حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 font-sans">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sand-100 text-sand-500 font-bold">
                    <th className="py-2.5 px-3">اسم الطالب</th>
                    <th className="py-2.5 px-2">الحفظ الفعلي</th>
                    <th className="py-2.5 px-2">السورة الحالية</th>
                    <th className="py-2.5 px-2">التجويد</th>
                    <th className="py-2.5 px-2">نسبة الحضور</th>
                    <th className="py-2.5 px-2 text-center">الملف التعليمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-50 font-medium">
                  {teacherStudents.map(student => {
                    const attRate = getStudentAttendanceRate(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-sand-50 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-sand-100 border shrink-0">
                              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover animate-fade-in" />
                            </div>
                            <div>
                              <p className="font-bold text-sand-800">{student.fullName}</p>
                              <p className="text-[9px] text-sand-500">
                                {classes.find(c => c.id === student.classId)?.name || "بدون فصل"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-primary-700 font-bold">
                          {student.hizbCount} حزب
                        </td>
                        <td className="py-3 px-2 text-gold-700 font-bold font-sans">
                          {student.currentSurah || "غير محدد"}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            student.tajweedLevel === "ممتاز" ? "bg-primary-100 text-primary-800" :
                            student.tajweedLevel === "متوسط" ? "bg-gold-100 text-gold-800" :
                            "bg-danger-100 text-danger-800"
                          }`}>
                            {student.tajweedLevel}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sand-700 font-bold">{attRate}%</span>
                            <div className="w-12 bg-sand-100 rounded-full h-1">
                              <div className={`h-1 rounded-full ${attRate >= 80 ? "bg-primary-600" : attRate >= 50 ? "bg-gold-500" : "bg-danger-500"}`} style={{ width: `${attRate}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            data-action="open-teacher-student-file"
                            onClick={() => {
                              setTeacherSelectedStudent(student);
                              setProgressMemorization("");
                              setProgressRevision("");
                              setProgressOldRevision("");
                              setProgressNotes("");
                              setProgressDate(new Date().toISOString().split("T")[0]);
                              setShowTeacherStudentFileModal(true);
                            }}
                            className="bg-primary-50 hover:bg-primary-600 hover:text-white text-primary-800 border border-primary-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150"
                          >
                            📝 متابعة الحفظ والتجويد
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
