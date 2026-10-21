/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import { Users, BookOpen, UserCheck, Award, CreditCard, Bell, X, Briefcase, QrCode, Settings, LayoutDashboard, Coins, Menu, Compass } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function MobileDrawer() {
  const {
    students,
    teachers,
    classes,
    attendance,
    grades,
    payments,
    notifications,
    activities,
    currentUser,
    activeTab,
    setActiveTab,
    setIsMobileMenuOpen,
    setSelectedStudent,
    currentRole,
    parentStudentsCount,
    parentFurthestHizb,
    currentStudentObj,
    teacherStudents,
    userNotifications,
    totalStudentsCount,
    furthestHizb,
    teacherFurthestHizb,
    isStaffOrAdmin,
  } = useApp();

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" dir="rtl">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      <aside data-nav="mobile" className="relative w-72 max-w-[85vw] bg-emerald-950 text-emerald-100 flex flex-col p-4 shrink-0 shadow-2xl overflow-y-auto z-10 border-l border-emerald-900 h-full">
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-emerald-900">
          <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
            <Menu className="w-4 h-4" />
            القائمة الرئيسية
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-xl hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant stats card */}
        <div 
          onClick={() => {
            if (currentRole === "طالب") {
              setActiveTab("students");
              if (currentStudentObj) setSelectedStudent(currentStudentObj);
            } else if (currentRole === "مدرس") {
              setActiveTab("dashboard");
            } else if (currentRole === "ولي أمر") {
              setActiveTab("students");
            } else {
              setActiveTab("dashboard");
            }
            setIsMobileMenuOpen(false);
          }}
          className="mb-4 p-3 bg-emerald-900/40 hover:bg-emerald-900/60 transition rounded-xl border border-emerald-800 cursor-pointer"
          title={currentRole === "طالب" ? "الانتقال إلى ملف الحفظ والتجويد الشخصي" : "استعراض الإحصائيات"}
        >
          <p className="text-[9px] text-amber-400 tracking-wider font-bold mb-1 uppercase">
            {isStaffOrAdmin
              ? "إحصائيات الإدارة"
              : currentRole === "مدرس"
              ? "إحصائيات الحلقة"
              : currentRole === "ولي أمر"
              ? "ملخص أبنائك"
              : "ملخص الحفظ الشخصي"}
          </p>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                {isStaffOrAdmin
                  ? totalStudentsCount
                  : currentRole === "مدرس"
                  ? teacherStudents.length
                  : currentRole === "ولي أمر"
                  ? parentStudentsCount
                  : currentStudentObj
                  ? currentStudentObj.hizbCount
                  : 0}
              </span>
              <span className="text-[10px] text-emerald-300 mr-1.5">
                {currentRole === "طالب" ? "حزب محفوظ" : currentRole === "ولي أمر" ? "أبناء" : "طلاب"}
              </span>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold font-mono text-amber-300">
                {currentRole === "طالب"
                  ? (currentStudentObj ? (currentStudentObj.tajweedLevel || "متوسط") : "-")
                  : isStaffOrAdmin
                  ? `${furthestHizb} حزب`
                  : currentRole === "مدرس"
                  ? `${teacherFurthestHizb} حزب`
                  : `${parentFurthestHizb} حزب`}
              </span>
              <p className="text-[9px] text-emerald-300 leading-none">
                {currentRole === "طالب" ? "مستوى التجويد" : "أبعد حزب بلغه طالب"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {(() => {
          const canReadDashboard = checkUserPermission(currentUser, currentRole, "dashboard", "read");
          const canReadStudents = checkUserPermission(currentUser, currentRole, "students", "read");
          const canReadTeachers = checkUserPermission(currentUser, currentRole, "teachers", "read");
          const canReadAttendance = checkUserPermission(currentUser, currentRole, "attendance", "read");
          const canReadGrades = checkUserPermission(currentUser, currentRole, "grades", "read");
          const canReadPayments = checkUserPermission(currentUser, currentRole, "payments", "read");
          const canReadFinance = checkUserPermission(currentUser, currentRole, "finance", "read");
          const canReadActivities = checkUserPermission(currentUser, currentRole, "activities", "read");
          const canReadClasses = checkUserPermission(currentUser, currentRole, "classes", "read");
          const canReadNotifications = checkUserPermission(currentUser, currentRole, "notifications", "read");
          const canReadIdCards = checkUserPermission(currentUser, currentRole, "id-cards-lab", "read");
          const canReadSettings = checkUserPermission(currentUser, currentRole, "settings", "read");

          return (
            <nav className="space-y-1 flex-1">
              {canReadDashboard && currentRole !== "مدرس" && (
                <button
                  data-tab="dashboard"
                  onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>لوحة البيانات والتحليل</span>
                </button>
              )}

              {currentRole === "مدرس" && canReadDashboard && (
                <button
                  data-tab="teacher-dashboard"
                  onClick={() => { setActiveTab("teacher-dashboard"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "teacher-dashboard" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>لوحة تحكم المعلم</span>
                </button>
              )}

              {canReadStudents && (
                <button
                  data-tab="students"
                  onClick={() => { setActiveTab("students"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "students" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentRole === "ولي أمر"
                      ? "متابعة أبنائي والطلاب"
                      : currentRole === "طالب"
                      ? "ملفي الشخصي وسجل الحفظ"
                      : currentRole === "مدرس"
                      ? "طلاب الحلقة الدراسية"
                      : "إدارة ملفات الطلاب"}
                  </span>
                </button>
              )}

              {canReadTeachers && (
                <button
                  data-tab="teachers"
                  onClick={() => { setActiveTab("teachers"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "teachers" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>شؤون العاملين والمدرسين</span>
                </button>
              )}

              {canReadAttendance && (
                <button
                  data-tab="attendance"
                  onClick={() => { setActiveTab("attendance"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "attendance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentRole === "ولي أمر" || currentRole === "طالب"
                      ? "متابعة الحضور والغياب"
                      : "تسجيل الحضور والغياب"}
                  </span>
                </button>
              )}

              {canReadGrades && (
                <button
                  data-tab="grades"
                  onClick={() => { setActiveTab("grades"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "grades" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentRole === "ولي أمر" || currentRole === "طالب"
                      ? "نتائج الامتحانات والشهادات"
                      : "الامتحانات والشهادات"}
                  </span>
                </button>
              )}

              {canReadPayments && (
                <button
                  data-tab="payments"
                  onClick={() => { setActiveTab("payments"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "payments" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentRole === "ولي أمر"
                      ? "سجل الرسوم والمدفوعات"
                      : "الرسوم والمدفوعات"}
                  </span>
                </button>
              )}

              {canReadFinance && (
                <button
                  data-tab="finance"
                  onClick={() => { setActiveTab("finance"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "finance" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>المحاسبة والمالية الجمعوية</span>
                </button>
              )}

              {canReadActivities && (
                <button
                  data-tab="activities"
                  onClick={() => { setActiveTab("activities"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "activities" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>إدارة الأنشطة والرحلات</span>
                </button>
              )}

              {canReadClasses && (
                <button
                  data-tab="classes"
                  onClick={() => { setActiveTab("classes"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "classes" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>الفصول والحلقات الدراسية</span>
                </button>
              )}

              {canReadNotifications && (
                <button
                  data-tab="notifications"
                  onClick={() => { setActiveTab("notifications"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm justify-between ${
                    activeTab === "notifications" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span>صندوق الإشعارات</span>
                  </div>
                  {userNotifications.filter(n => !n.isRead).length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {userNotifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
              )}

              {canReadIdCards && (
                <button
                  data-tab="id-cards-lab"
                  onClick={() => { setActiveTab("id-cards-lab"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "id-cards-lab" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>معمل بطاقات الهوية</span>
                </button>
              )}

              {canReadSettings && (
                <button
                  data-tab="settings"
                  onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition font-medium text-sm ${
                    activeTab === "settings" ? "bg-emerald-800 text-white shadow-md border-r-4 border-amber-400" : "hover:bg-emerald-900/50 opacity-80"
                  }`}
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>الإعدادات والمستخدمين</span>
                </button>
              )}
            </nav>
          );
        })()}
      </aside>
    </div>
  );
}
