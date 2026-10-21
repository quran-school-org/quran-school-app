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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-sand-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-sand-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-700" />
                <span>إدارة حسابات المستخدمين والصلاحيات</span>
              </h3>
              <p className="text-xs text-sand-500 mt-1">إضافة وإدارة حسابات المعلمين والمدراء والطلاب وأولياء الأمور مع التحكم الدقيق في مستويات الوصول.</p>
            </div>
            {canCreateAccounts && (
              <button
                data-action="open-user-form"
                onClick={() => openUserModal()}
                className="bg-gradient-to-r from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-primary-900/20 active:scale-95 cursor-pointer shrink-0"
                id="btn-add-new-user"
              >
                <UserPlus className="w-4 h-4 text-gold-300" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-sand-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-sand-500">إجمالي الحسابات</p>
                <p className="text-lg font-black text-sand-800">{appUsers.length}</p>
              </div>
            </div>

            <div className="bg-white border border-sand-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-sand-500">الحسابات النشطة</p>
                <p className="text-lg font-black text-primary-700">{appUsers.filter(u => u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-sand-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 text-danger-700 border border-danger-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-sand-500">الحسابات الموقوفة</p>
                <p className="text-lg font-black text-danger-600">{appUsers.filter(u => !u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-white border border-sand-200/80 p-3.5 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-sand-500">المدراء والمسيرون</p>
                <p className="text-lg font-black text-gold-700">{appUsers.filter(u => u.role === "مدير" || u.role === "إداري").length}</p>
              </div>
            </div>
          </div>

          {/* Sync Notice Banner & Action */}
          <div className="bg-primary-50/80 border border-primary-200/80 text-primary-900 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <span className="p-1.5 bg-primary-100 text-primary-800 rounded-xl font-bold flex items-center justify-center w-7 h-7 shrink-0">⚙️</span>
              <div>
                <p className="font-bold text-primary-950">المزامنة التلقائية والذكية لحسابات المؤسسة والأدوار:</p>
                <p className="text-sand-600 mt-0.5 leading-relaxed">
                  يقوم النظام تلقائياً بمزامنة حسابات <strong>المكتب التنفيذي والمسيرين</strong>، <strong>المؤطرين</strong>، <strong>المحفظين والأساتذة</strong>، <strong>المتطوعين</strong>، <strong>عمال النظافة والصيانة</strong>، <strong>أولياء الأمور</strong>، و<strong>الطلاب</strong> بدقة مع مطابقة الأدوار والمسميات الوظيفية المسندة لهم في شؤون العاملين، مع <strong>الإيقاف التلقائي لحساب أي شخص يتم أرشفته</strong>. كلمة المرور الافتراضية: <span className="font-mono bg-white border border-primary-200 px-1.5 py-0.2 rounded text-primary-800 font-bold">123</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
              title="مزامنة فورية وتحديث الأدوار مع شؤون العاملين والطلاب"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "جاري المزامنة..." : "مزامنة فورية للأدوار"}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="bg-primary-100/80 border border-primary-300 text-primary-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-primary-700 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Search, Filters & View Mode Switcher Control Bar */}
          <div className="bg-white border border-sand-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-sand-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="البحث باسم المستخدم أو الاسم الكامل..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-sand-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition font-sans bg-sand-50/50 focus:bg-white"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-sand-500 hover:text-sand-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sand-500 hidden sm:inline" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-sand-300 rounded-xl text-xs bg-white text-sand-700 font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition cursor-pointer"
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
                className="px-3 py-2 border border-sand-300 rounded-xl text-xs bg-white text-sand-700 font-bold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">الحسابات النشطة فقط</option>
                <option value="inactive">الحسابات الموقوفة فقط</option>
              </select>

              {/* View Switcher Toggle (matching dark styled switcher in screenshot) */}
              <div className="flex items-center bg-sand-900 border border-sand-800 rounded-xl p-1 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setUserViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "cards"
                      ? "bg-primary-950 text-primary-300 border border-primary-500/80 shadow-xs"
                      : "text-sand-500 hover:text-sand-200 hover:bg-sand-800/60"
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
                      ? "bg-primary-950 text-primary-300 border border-primary-500/80 shadow-xs"
                      : "text-sand-500 hover:text-sand-200 hover:bg-sand-800/60"
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
            <div className="bg-white border border-sand-200 rounded-2xl p-12 text-center text-sand-500 text-xs font-bold shadow-xs">
              <Users className="w-10 h-10 text-sand-400 mx-auto mb-3" />
              <p className="text-sm text-sand-600 font-bold">لا توجد حسابات مطابقة لخيارات البحث أو التصفية الحالية.</p>
              <p className="text-sand-500 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط التصفية.</p>
            </div>
          ) : userViewMode === "table" ? (
            /* ==================== 1. ORGANIZED TABLE VIEW ==================== */
            <div className="bg-white border border-sand-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-sand-900 text-sand-200 uppercase font-bold text-[11px] tracking-wider border-b border-sand-800">
                      <th className="py-3.5 px-4">الاسم الكامل</th>
                      <th className="py-3.5 px-4">اسم المستخدم</th>
                      <th className="py-3.5 px-4">الدور</th>
                      <th className="py-3.5 px-4">آخر تسجيل دخول</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">الصلاحيات والتراخيص</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100 font-sans">
                    {filteredUsers.map((user) => {
                      const isAutoSynced = user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_");
                      const displayFullName = isPrimaryDirector(user) && directorName ? directorName : user.fullName;
                      return (
                        <tr
                          key={user.id}
                          className={`transition hover:bg-sand-50/80 ${
                            !user.isActive ? "bg-danger-50/30 text-sand-500" : ""
                          }`}
                        >
                          {/* Full Name */}
                          <td className="py-3.5 px-4 font-bold text-sand-800">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                user.role === "مدير"
                                  ? "bg-gold-100 text-gold-800 border border-gold-200"
                                  : user.role === "إداري"
                                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                                  : user.role === "مؤطر"
                                  ? "bg-gold-100 text-gold-800 border border-gold-200"
                                  : user.role === "مدرس"
                                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                                  : user.role === "متطوع"
                                  ? "bg-gold-100 text-gold-800 border border-gold-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                                  : user.role === "طالب"
                                  ? "bg-primary-100 text-primary-800 border border-primary-200"
                                  : "bg-sand-100 text-sand-800 border border-sand-200"
                              }`}>
                                {displayFullName.substring(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold text-sand-800 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className={user.isArchived ? "line-through text-sand-500" : ""}>{displayFullName}</span>
                                  {isAutoSynced && (
                                    <span className="text-[9px] bg-primary-50 text-primary-700 border border-primary-200 px-1.5 py-0.2 rounded-md font-normal" title="حساب مزامن تلقائياً">
                                      مزامنة
                                    </span>
                                  )}
                                  {user.isArchived && (
                                    <span className="text-[9px] bg-danger-50 text-danger-700 border border-danger-200 px-1.5 py-0.2 rounded-md font-bold" title="شخص مؤرشف في المنظومة">
                                      مؤرشف
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username & Password */}
                          <td className="py-3.5 px-4 font-mono text-sand-600 text-[11px] dir-ltr text-right">
                            <div className="flex items-center gap-2">
                              <span className="bg-sand-100 px-2 py-0.5 rounded-lg border border-sand-200/80 font-semibold text-sand-700">
                                @{user.username}
                              </span>
                              <div className="flex items-center gap-1 bg-sand-50 border border-sand-200 px-2 py-0.5 rounded-lg text-[10px]">
                                <span className={`font-bold tracking-wider ${user.mustChangePassword ? "text-gold-700" : "text-sand-600"}`} title={user.mustChangePassword ? "يجب على المستخدم تغيير كلمة المرور عند الدخول" : "كلمة المرور محفوظة بشكل آمن ولا يمكن عرضها"}>
                                  {user.mustChangePassword ? "تغيير إلزامي" : "••••••••"}
                                </span>
                                {canUpdateAccounts && onResetUserPassword && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(user)}
                                    className="text-sand-500 hover:text-primary-700 transition cursor-pointer p-0.5 rounded"
                                    title="إعادة تعيين كلمة المرور"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-primary-600" />
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
                                  ? "bg-gold-50 text-gold-800 border-gold-200"
                                  : user.role === "إداري"
                                  ? "bg-primary-50 text-primary-800 border-primary-200"
                                  : user.role === "مؤطر"
                                  ? "bg-gold-50 text-gold-800 border-gold-200"
                                  : user.role === "مدرس"
                                  ? "bg-primary-50 text-primary-800 border-primary-200"
                                  : user.role === "متطوع"
                                  ? "bg-gold-50 text-gold-800 border-gold-200"
                                  : user.role === "عامل نظافة / صيانة"
                                  ? "bg-primary-50 text-primary-800 border-primary-200"
                                  : user.role === "ولي أمر"
                                  ? "bg-primary-50 text-primary-800 border-primary-200"
                                  : user.role === "طالب"
                                  ? "bg-primary-50 text-primary-800 border-primary-200"
                                  : "bg-sand-50 text-sand-800 border-sand-200"
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
                                <span className="text-[10px] text-sand-500 font-medium" title="المسمى الوظيفي المسند في شؤون العاملين">
                                  {user.roleTitle}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Login Date */}
                          <td className="py-3.5 px-4 text-sand-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-sand-500 shrink-0" />
                              <span className={user.lastLogin ? "font-semibold text-sand-700" : "text-sand-500 italic"}>
                                {formatLastLogin(user.lastLogin)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                                <span>نشط</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-danger-50 text-danger-700 border border-danger-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger-500"></span>
                                <span>{user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}</span>
                              </span>
                            )}
                          </td>

                          {/* Permissions summary */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.role === "مدير" ? (
                                <span className="bg-gold-100/80 text-gold-900 border border-gold-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  كامل الصلاحيات
                                </span>
                              ) : (
                                <>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditStudents ? "bg-primary-50 text-primary-800 border-primary-200" : "bg-sand-100 text-sand-500 border-sand-200 line-through opacity-60"}`}>
                                    الطلاب
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditTeachers ? "bg-primary-50 text-primary-800 border-primary-200" : "bg-sand-100 text-sand-500 border-sand-200 line-through opacity-60"}`}>
                                    العاملين
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditGrades ? "bg-primary-50 text-primary-800 border-primary-200" : "bg-sand-100 text-sand-500 border-sand-200 line-through opacity-60"}`}>
                                    الدرجات
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.canEditPayments ? "bg-primary-50 text-primary-800 border-primary-200" : "bg-sand-100 text-sand-500 border-sand-200 line-through opacity-60"}`}>
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
                                  className="p-1.5 text-primary-600 hover:bg-primary-50 border border-primary-200/60 rounded-xl transition cursor-pointer"
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
                                  className="p-1.5 text-danger-600 hover:bg-danger-50 border border-danger-200/60 rounded-xl transition cursor-pointer"
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
                  className={`bg-white border rounded-2xl p-4 shadow-xs relative transition hover:border-sand-300 flex flex-col justify-between ${
                    !user.isActive ? "opacity-75 border-danger-200/80 bg-danger-50/20" : "border-sand-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        user.role === "مدير"
                          ? "bg-gold-100 text-gold-800 border-gold-200"
                          : user.role === "إداري"
                          ? "bg-primary-100 text-primary-800 border-primary-200"
                          : user.role === "مؤطر"
                          ? "bg-gold-100 text-gold-800 border-gold-200"
                          : user.role === "مدرس"
                          ? "bg-primary-100 text-primary-800 border-primary-200"
                          : user.role === "متطوع"
                          ? "bg-gold-100 text-gold-800 border-gold-200"
                          : user.role === "عامل نظافة / صيانة"
                          ? "bg-primary-100 text-primary-800 border-primary-200"
                          : user.role === "ولي أمر"
                          ? "bg-primary-100 text-primary-800 border-primary-200"
                          : user.role === "طالب"
                          ? "bg-primary-100 text-primary-800 border-primary-200"
                          : "bg-sand-100 text-sand-800 border-sand-200"
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
                        user.isActive ? "bg-primary-50 text-primary-600 border-primary-200" : "bg-danger-50 text-danger-600 border-danger-200"
                      }`}>
                        {user.isActive ? "نشط" : user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}
                      </span>
                    </div>

                    <h4 className={`font-bold text-sm mb-0.5 ${user.isArchived ? "line-through text-sand-500" : "text-sand-800"}`}>
                      {isPrimaryDirector(user) && directorName ? directorName : user.fullName}
                    </h4>
                    {user.roleTitle && user.roleTitle !== user.role && (
                      <p className="text-[11px] text-sand-500 font-medium mb-1">{user.roleTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-sand-500 font-mono">@{user.username}</p>
                      <div className="flex items-center gap-1 bg-sand-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        <span className={`font-bold ${user.mustChangePassword ? "text-gold-700" : "text-sand-700"}`}>
                          {user.mustChangePassword ? "تغيير إلزامي" : "••••••••"}
                        </span>
                        {canUpdateAccounts && onResetUserPassword && (
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            className="text-sand-500 hover:text-primary-700 transition cursor-pointer p-0.5 rounded"
                            title="إعادة تعيين كلمة المرور"
                          >
                            <KeyRound className="w-3 h-3 text-primary-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Last login date info */}
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-sand-500 bg-sand-50 p-2 rounded-xl border border-sand-100">
                      <Clock className="w-3.5 h-3.5 text-sand-500" />
                      <span>آخر دخول:</span>
                      <span className="font-bold text-sand-700">{formatLastLogin(user.lastLogin)}</span>
                    </div>

                    {(user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_")) && (
                      <div className="mb-3 flex items-center gap-1 bg-primary-50 text-primary-800 border border-primary-100 rounded-lg px-2 py-1.5 text-[10px] font-bold" dir="rtl">
                        <span>🔄</span>
                        <span>مزامنة تلقائية من سجلات {user.role}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-sand-100 pt-3 mt-2 text-[11px] text-sand-600">
                      <div className="flex items-center justify-between">
                        <span>تعديل الطلاب:</span>
                        {user.canEditStudents ? <Check className="w-4 h-4 text-primary-600" /> : <X className="w-4 h-4 text-danger-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل المعلمين:</span>
                        {user.canEditTeachers ? <Check className="w-4 h-4 text-primary-600" /> : <X className="w-4 h-4 text-danger-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الامتحانات:</span>
                        {user.canEditGrades ? <Check className="w-4 h-4 text-primary-600" /> : <X className="w-4 h-4 text-danger-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل الرسوم والمالية:</span>
                        {user.canEditPayments ? <Check className="w-4 h-4 text-primary-600" /> : <X className="w-4 h-4 text-danger-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-sand-100 pt-3 mt-4 justify-end">
                    {canUpdateAccounts && (
                      <button
                        onClick={() => openUserModal(user)}
                        className="p-2 text-primary-600 hover:bg-primary-50 border border-primary-200/60 rounded-xl transition cursor-pointer"
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
                        className="p-2 text-danger-600 hover:bg-danger-50 border border-danger-200/60 rounded-xl transition cursor-pointer"
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
