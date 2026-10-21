/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { db } from "../firebase";
import { Teacher, Attendance } from "../types";
import AttendanceChart from "../components/AttendanceChart";
import TeacherPerformanceChart from "../components/TeacherPerformanceChart";
import { Users, BookOpen, Award, CreditCard, Check, ShieldAlert, RefreshCw, Info, Database } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function DashboardScreen() {
  const {
    students,
    teachers,
    classes,
    attendance,
    grades,
    notifications,
    setActiveTab,
    schoolName,
    totalStudentsCount,
    advancedStudentsCount,
    excellentTajweedCount,
    averageTajweedCount,
    weakTajweedCount,
    tajweedSuccessPercent,
    totalPaymentsCollected,
    totalUnpaidCount,
    handleBackupRealmDB,
    handleRestoreRealmDB,
  } = useApp();

  return (
    <div data-screen="dashboard" className="space-y-6">

      {/* Header Info Banner */}
      <div className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-zinc-950 font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full">الذكاء الاصطناعي متاح</span>
              <span className="bg-emerald-700/80 border border-emerald-500/30 text-white font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full flex items-center gap-1">
                🟢 متصل بالذاكرة المحلية (RealmDB)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black">لوحة الإحصائيات لـ{schoolName}</h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              مرحباً بك في النظام التربوي الذكي الخاص بمركز القرآن الكريم. تتيح لك هذه المنصة متابعة شؤون الحلقات والطلاب ومستويات التجويد والرسوم الإدارية بطريقة رقمية ميسرة.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
            <button
              onClick={handleBackupRealmDB}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 transition shadow w-full"
              id="manual-db-backup-btn"
              title="تحميل نسخة احتياطية كاملة من قاعدة البيانات كملف JSON"
            >
              <Database className="w-4.5 h-4.5 text-emerald-300 animate-pulse" />
              <span>تنزيل نسخة احتياطية كاملة (JSON)</span>
            </button>

            <input
              type="file"
              id="restore-backup-file-input"
              accept=".json"
              onChange={handleRestoreRealmDB}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById("restore-backup-file-input")?.click()}
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 transition shadow w-full"
              id="manual-db-restore-btn"
              title="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي"
            >
              <RefreshCw className="w-4.5 h-4.5 text-amber-400" />
              <span>استرجاع نسخة احتياطية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold">إجمالي الطلاب</p>
            <p className="text-3xl font-black text-slate-800 mt-1 font-mono">{totalStudentsCount}</p>
            <span className="text-[10px] text-emerald-600 font-bold">نشطون حالياً</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold">حفظ متقدم (20+ حزب)</p>
            <p className="text-3xl font-black text-slate-800 mt-1 font-mono">{advancedStudentsCount}</p>
            <span className="text-[10px] text-emerald-600 font-bold">مشاريع الختم</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold">المدفوعات المحصلة</p>
            <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">{totalPaymentsCollected} <span className="text-sm">درهم</span></p>
            <span className="text-[10px] text-amber-600 font-bold">{totalUnpaidCount} دفعات معلقة</span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold">جودة التجويد العامة</p>
            <p className="text-xl font-black text-slate-800 mt-1">
              {excellentTajweedCount} ممتاز / {averageTajweedCount} متوسط / {weakTajweedCount} ضعيف
            </p>
            <span className="text-[10px] text-emerald-600 font-bold">
              {tajweedSuccessPercent}% بمستوى طيب أو متميز
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Teacher performance evaluation chart */}
      <TeacherPerformanceChart
        teachers={teachers}
        classes={classes}
        students={students}
        grades={grades}
      />

      {/* Attendance comparison chart */}
      <AttendanceChart 
        students={students}
        classes={classes}
        attendance={attendance}
      />

      {/* Quick overview of lists & interactive chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visual statistics - SVG generated chart of memorization breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm">مستويات حفظ الطلاب الحاليين (بالأحزاب)</h3>
            <span className="text-xs text-slate-400">توزيع الطلاب</span>
          </div>

          {/* SVG Chart visualization representing student progress visually */}
          <div className="relative pt-2">
            <div className="flex flex-col gap-4">
              {students.map((st) => {
                const percent = Math.min((st.hizbCount / 60) * 100, 100);
                return (
                  <div key={st.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{st.fullName}</span>
                      <span className="text-slate-500 font-mono">{st.hizbCount} حزب / 60 ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-gradient-to-l from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
            <p className="font-bold text-emerald-800">ملاحظة تنظيمية:</p>
            <p>يهدف النادي لمساعدة جميع الأطفال والشيوخ في {schoolName} لختم كتاب الله وضبط مخارج الحروف بتجويد ممتاز.</p>
          </div>
        </div>

        {/* Important notices & notifications right side */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">تنبيهات إدارية هامة</h3>
              <span className="text-xs text-rose-500 font-bold">تتطلب إجراءً</span>
            </div>

            <div className="space-y-3">
              {/* Alert about missing documents */}
              {students.some(s => !s.docBirthCert || !s.docParentId || !s.docPhotos) ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-xs text-amber-950">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">أوراق إدارية ناقصة لبعض الطلاب</p>
                    <p className="text-amber-800 mt-0.5">تأكد من مراجعة مستندات الطلاب الجدد واستكمالها.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-xs text-emerald-950">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">الأوراق الإدارية مكتملة</p>
                    <p className="text-emerald-800 mt-0.5">جميع مستندات الطلاب مسجلة بشكل سليم.</p>
                  </div>
                </div>
              )}

              {/* Unpaid alerts */}
              {totalUnpaidCount > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 text-xs text-rose-950">
                  <CreditCard className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">رسوم غير مدفوعة معلقة</p>
                    <p className="text-rose-800 mt-0.5">هناك {totalUnpaidCount} مستحقات معلقة لشهر يوليوز والأشهر السابقة.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button 
              onClick={() => setActiveTab("students")} 
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
            >
              الانتقال إلى كشف الطلاب والوثائق
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
