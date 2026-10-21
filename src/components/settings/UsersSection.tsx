/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Shield, UserPlus, Edit2, Trash2, Check, X, Search, Users, RefreshCw, LayoutGrid, List, CheckCircle2, XCircle, Clock, ShieldCheck, Filter, KeyRound } from "lucide-react";
import { isPrimaryDirector } from "./shared";
import { useSettings } from "./SettingsContext";

export default function UsersSection() {
  const {
    appUsers,
    onResetUserPassword,
    onDeleteAppUser,
    canCreateAccounts,
    canUpdateAccounts,
    canDeleteAccounts,
    subTab,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    userViewMode,
    setUserViewMode,
    isSyncing,
    syncSuccessMsg,
    handleTriggerSync,
    handleResetPassword,
    formatLastLogin,
    filteredUsers,
    directorName,
    openUserModal,
  } = useSettings();

  return (
    <>
      {/* 2. App Users & Permissions list */}
      {subTab === "users" && (
        <div className="space-y-5" dir="rtl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>إدارة حسابات المستخدمين والصلاحيات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">إضافة وإدارة حسابات المعلمين والمدراء والطلاب وأولياء الأمور مع التحكم الدقيق في مستويات الوصول.</p>
            </div>
            {canCreateAccounts && (
              <button
                data-action="open-user-form"
                onClick={() => openUserModal()}
                className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0"
                id="btn-add-new-user"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">إجمالي الحسابات</p>
                <p className="text-lg font-black text-slate-800">{appUsers.length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">الحسابات النشطة</p>
                <p className="text-lg font-black text-emerald-700">{appUsers.filter(u => u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">الحسابات الموقوفة</p>
                <p className="text-lg font-black text-rose-600">{appUsers.filter(u => !u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">المدراء والمسيرون</p>
                <p className="text-lg font-black text-amber-700">{appUsers.filter(u => u.role === "مدير" || u.role === "إداري").length}</p>
              </div>
            </div>
          </div>

          {/* Sync Notice Banner & Action */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center justify-center w-7 h-7 shrink-0">⚙️</span>
              <div>
                <p className="font-bold text-emerald-950">المزامنة التلقائية والذكية لحسابات المؤسسة والأدوار:</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  يقوم النظام تلقائياً بمزامنة حسابات <strong>المكتب التنفيذي والمسيرين</strong>، <strong>المؤطرين</strong>، <strong>المحفظين والأساتذة</strong>، <strong>المتطوعين</strong>، <strong>عمال النظافة والصيانة</strong>، <strong>أولياء الأمور</strong>، و<strong>الطلاب</strong> بدقة مع مطابقة الأدوار والمسميات الوظيفية المسندة لهم في شؤون العاملين، مع <strong>الإيقاف التلقائي لحساب أي شخص يتم أرشفته</strong>. كلمة المرور الافتراضية: <span className="font-mono bg-white border border-emerald-200 px-1.5 py-0.2 rounded text-emerald-800 font-bold">123</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
              title="مزامنة فورية وتحديث الأدوار مع شؤون العاملين والطلاب"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "جاري المزامنة..." : "مزامنة فورية للأدوار"}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Search, Filters & View Mode Switcher Control Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="البحث باسم المستخدم أو الاسم الكامل..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-sans bg-slate-50/50 focus:bg-white"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
                >
                  <option value="all">جميع الأدوار</option>
                  <option value="مدير">مدراء ومسيرو الجمعية (رئيس / مدير)</option>
                  <option value="إداري">إداريون وأعضاء المكتب التنفيذي</option>
                  <option value="مؤطر">مؤطرون ومشرفون تربويون</option>
                  <option value="مدرس">أساتذة ومحفظون (حلقات التحفيظ)</option>
                  <option value="متطوع">متطوعون بالأنشطة والفعاليات 🤝</option>
                  <option value="عامل نظافة / صيانة">عمال نظافة وصيانة 🧹</option>
                  <option value="ولي أمر">أولياء أمور</option>
                  <option value="طالب">طلاب (15+ سنة)</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">الحسابات النشطة فقط</option>
                <option value="inactive">الحسابات الموقوفة فقط</option>
              </select>

              {/* View Switcher Toggle (matching dark styled switcher in screenshot) */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setUserViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "cards"
                      ? "bg-teal-950 text-teal-300 border border-teal-500/80 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                  title="عرض البطاقات (كانبان)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">البطاقات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "table"
                      ? "bg-teal-950 text-teal-300 border border-teal-500/80 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                  title="عرض القائمة والجدول المنظم"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">جدول منظم</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-bold">لا توجد حسابات مطابقة لخيارات البحث أو التصفية الحالية.</p>
              <p className="text-slate-400 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط التصفية.</p>
            </div>
          ) : userViewMode === "table" ? (
            /* ==================== 1. ORGANIZED TABLE VIEW ==================== */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px] tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">الاسم الكامل</th>
                      <th className="py-3.5 px-4">اسم المستخدم</th>
                      <th className="py-3.5 px-4">الدور</th>
                      <th className="py-3.5 px-4">آخر تسجيل دخول</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">الصلاحيات والتراخيص</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredUsers.map((user) => {
                      const isAutoSynced = user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_");
                      const displayFullName = isPrimaryDirector(user) && directorName ? directorName : user.fullName;
                      return (
                        <tr
                          key={user.id}
                          className={`transition hover:bg-slate-50/80 ${
                            !user.isActive ? "bg-rose-50/30 text-slate-500" : ""
                          }`}
                        >
                          {/* Full Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                user.role === "مدير"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : user.role === "إداري"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : user.role === "مؤطر"
                                  ? "bg-orange-100 text-orange-800 border border-orange-200"
                                  : user.role === "مدرس"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : user.role === "متطوع"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-teal-100 text-teal-800 border border-teal-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-sky-100 text-sky-800 border border-sky-200"
                                  : user.role === "طالب"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}>
                                {displayFullName.substring(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className={user.isArchived ? "line-through text-slate-400" : ""}>{displayFullName}</span>
                                  {isAutoSynced && (
                                    <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded-md font-normal" title="حساب مزامن تلقائياً">
                                      مزامنة
                                    </span>
                                  )}
                                  {user.isArchived && (
                                    <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-md font-bold" title="شخص مؤرشف في المنظومة">
                                      مؤرشف
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username & Password */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] dir-ltr text-right">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 font-semibold text-slate-700">
                                @{user.username}
                              </span>
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px]">
                                <span className={`font-bold tracking-wider ${user.mustChangePassword ? "text-amber-700" : "text-slate-600"}`} title={user.mustChangePassword ? "يجب على المستخدم تغيير كلمة المرور عند الدخول" : "كلمة المرور محفوظة بشكل آمن ولا يمكن عرضها"}>
                                  {user.mustChangePassword ? "تغيير إلزامي" : "••••••••"}
                                </span>
                                {canUpdateAccounts && onResetUserPassword && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(user)}
                                    className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5 rounded"
                                    title="إعادة تعيين كلمة المرور"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                user.role === "مدير"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : user.role === "إداري"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : user.role === "مؤطر"
                                  ? "bg-orange-50 text-orange-800 border-orange-200"
                                  : user.role === "مدرس"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : user.role === "متطوع"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-sky-50 text-sky-800 border-sky-200"
                                  : user.role === "طالب"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : "bg-slate-50 text-slate-800 border-slate-200"
                              }`}>
                                {user.role === "متطوع" && "🤝 "}
                                {user.role === "عامل نظافة / صيانة" && "🧹 "}
                                {user.role === "مدرس" && "👨‍🏫 "}
                                {user.role === "مؤطر" && "🌟 "}
                                {user.role === "إداري" && "📋 "}
                                {user.role === "مدير" && "👑 "}
                                {user.role === "ولي أمر" && "👨‍👧‍👦 "}
                                {user.role === "طالب" && "🎓 "}
                                <span>{user.role}</span>
                              </span>
                              {user.roleTitle && user.roleTitle !== user.role && (
                                <span className="text-[10px] text-slate-500 font-medium" title="المسمى الوظيفي المسند في شؤون العاملين">
                                  {user.roleTitle}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Login Date */}
                          <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className={user.lastLogin ? "font-semibold text-slate-700" : "text-slate-400 italic"}>
                                {formatLastLogin(user.lastLogin)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>نشط</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>{user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}</span>
                              </span>
                            )}
                          </td>

                          {/* Permissions summary */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.role === "مدير" ? (
                                <span className="bg-amber-100/80 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  كامل الصلاحيات
                                </span>
                              ) : (
                                <>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditStudents ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    الطلاب
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditTeachers ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    العاملين
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditGrades ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    الدرجات
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditPayments ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"}`}>
                                    المالية
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {canUpdateAccounts && (
                                <button
                                  onClick={() => openUserModal(user)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-xl transition cursor-pointer"
                                  title="تعديل الحساب والصلاحيات"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDeleteAccounts && !isPrimaryDirector(user) && (
                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`)) {
                                      onDeleteAppUser(user.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition cursor-pointer"
                                  title="حذف الحساب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ==================== 2. CARDS / KANBAN VIEW ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs relative transition hover:border-slate-300 flex flex-col justify-between ${
                    !user.isActive ? "opacity-75 border-rose-200/80 bg-rose-50/20" : "border-slate-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        user.role === "مدير"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : user.role === "إداري"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : user.role === "مؤطر"
                          ? "bg-orange-100 text-orange-800 border-orange-200"
                          : user.role === "مدرس"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : user.role === "متطوع"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : user.role === "عامل نظافة / صيانة"
                          ? "bg-teal-100 text-teal-800 border-teal-200"
                          : user.role === "ولي أمر"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : user.role === "طالب"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}>
                        {user.role === "متطوع" && "🤝 "}
                        {user.role === "عامل نظافة / صيانة" && "🧹 "}
                        {user.role === "مدرس" && "👨‍🏫 "}
                        {user.role === "مؤطر" && "🌟 "}
                        {user.role === "إداري" && "📋 "}
                        {user.role === "مدير" && "👑 "}
                        {user.role}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        user.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}>
                        {user.isActive ? "نشط" : user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}
                      </span>
                    </div>

                    <h4 className={`font-bold text-sm mb-0.5 ${user.isArchived ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {isPrimaryDirector(user) && directorName ? directorName : user.fullName}
                    </h4>
                    {user.roleTitle && user.roleTitle !== user.role && (
                      <p className="text-[11px] text-slate-500 font-medium mb-1">{user.roleTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        <span className={`font-bold ${user.mustChangePassword ? "text-amber-700" : "text-slate-700"}`}>
                          {user.mustChangePassword ? "تغيير إلزامي" : "••••••••"}
                        </span>
                        {canUpdateAccounts && onResetUserPassword && (
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5 rounded"
                            title="إعادة تعيين كلمة المرور"
                          >
                            <KeyRound className="w-3 h-3 text-emerald-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Last login date info */}
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>آخر دخول:</span>
                      <span className="font-bold text-slate-700">{formatLastLogin(user.lastLogin)}</span>
                    </div>

                    {(user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_")) && (
                      <div className="mb-3 flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-100 rounded-lg px-2 py-1.5 text-[10px] font-bold" dir="rtl">
                        <span>🔄</span>
                        <span>مزامنة تلقائية من سجلات {user.role}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-2 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>تعديل الطلاب:</span>
                        {user.canEditStudents ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل المعلمين:</span>
                        {user.canEditTeachers ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الامتحانات:</span>
                        {user.canEditGrades ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الرسوم والمالية:</span>
                        {user.canEditPayments ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3 mt-4 justify-end">
                    {canUpdateAccounts && (
                      <button
                        onClick={() => openUserModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-xl transition cursor-pointer"
                        title="تعديل الحساب والصلاحيات"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteAccounts && !isPrimaryDirector(user) && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`)) {
                            onDeleteAppUser(user.id);
                          }
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition cursor-pointer"
                        title="حذف الحساب نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
