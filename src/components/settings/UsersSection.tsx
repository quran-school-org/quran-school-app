/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Shield, UserPlus, Edit2, Trash2, Check, X, Search, Users, RefreshCw, LayoutGrid, List, CheckCircle2, XCircle, Clock, ShieldCheck, Filter, KeyRound } from "lucide-react";
import { isPrimaryDirector } from "./shared";
import { useSettings } from "./SettingsContext";
import { DataTable, IconButton, Pill, Select, useConfirm, type PillTone, SectionHeader } from "../../ui";
import type { AppUser } from "../../types";

const GOLD_ROLES = ["مدير", "مؤطر", "متطوع"];
const roleTone = (role: string): PillTone => (role === "أخرى" ? "neutral" : GOLD_ROLES.includes(role) ? "warn" : "primary");

export default function UsersSection() {
  const confirm = useConfirm();
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

  const accountName = (user: AppUser) => (isPrimaryDirector(user) && directorName ? directorName : user.fullName);
  const nameBlock = (user: AppUser) => {
    const isAutoSynced = user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_");
    return (
      <span className="font-bold text-ink text-small flex items-center gap-1.5 flex-wrap min-w-0">
        <span className={user.isArchived ? "line-through text-ink-3" : ""}>{accountName(user)}</span>
        {isAutoSynced && (
          <span className="text-small bg-primary-50 text-primary-700 border border-primary-200 px-1.5 rounded-md font-normal" title="حساب مزامن تلقائياً">مزامنة</span>
        )}
        {user.isArchived && (
          <span className="text-small bg-danger-50 text-danger-700 border border-danger-200 px-1.5 rounded-md font-bold" title="شخص مؤرشف في المنظومة">مؤرشف</span>
        )}
      </span>
    );
  };

  return (
    <>
      {/* 2. App Users & Permissions list */}
      {subTab === "users" && (
        <div className="space-y-5" dir="rtl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-5 rounded-3xl border border-sand-200/80">
            <SectionHeader
              level={3}
              size="md"
              icon={<ShieldCheck className="w-5 h-5 text-primary-700" />}
              title="إدارة حسابات المستخدمين والصلاحيات"
              subtitle="إضافة وإدارة حسابات المعلمين والمدراء والطلاب وأولياء الأمور مع التحكم الدقيق في مستويات الوصول."
            />
            {canCreateAccounts && (
              <button
                data-action="open-user-form"
                onClick={() => openUserModal()}
                className="bg-night hover:from-primary-800 hover:to-primary-900 text-white font-bold text-small px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition hover:shadow-primary-900/20 active:scale-95 cursor-pointer shrink-0"
                id="btn-add-new-user"
              >
                <UserPlus className="w-4 h-4 text-gold-300" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-sand-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-small font-bold text-ink-3">إجمالي الحسابات</p>
                <p className="text-lg font-bold text-ink">{appUsers.length}</p>
              </div>
            </div>

            <div className="bg-surface border border-sand-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-small font-bold text-ink-3">الحسابات النشطة</p>
                <p className="text-lg font-bold text-primary-700">{appUsers.filter(u => u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-surface border border-sand-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 text-danger-700 border border-danger-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-small font-bold text-ink-3">الحسابات الموقوفة</p>
                <p className="text-lg font-bold text-danger-600">{appUsers.filter(u => !u.isActive).length}</p>
              </div>
            </div>

            <div className="bg-surface border border-sand-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-small font-bold text-ink-3">المدراء والمسيرون</p>
                <p className="text-lg font-bold text-gold-700">{appUsers.filter(u => u.role === "مدير" || u.role === "إداري").length}</p>
              </div>
            </div>
          </div>

          {/* Sync Notice Banner & Action */}
          <div className="bg-primary-50/80 border border-primary-200/80 text-primary-900 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-small">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="p-1.5 bg-primary-100 text-primary rounded-xl flex items-center justify-center w-8 h-8 shrink-0"><RefreshCw className="w-4 h-4" strokeWidth={1.75} /></span>
              <div>
                <p className="font-bold text-primary-950">المزامنة التلقائية والذكية لحسابات المؤسسة والأدوار:</p>
                <p className="text-ink-2 mt-0.5 leading-relaxed">
                  يطابق النظام أدوار الحسابات الموجودة لـ<strong>المكتب التنفيذي والمسيرين</strong>، <strong>المؤطرين</strong>، <strong>المحفظين والأساتذة</strong>، <strong>المتطوعين</strong>، <strong>عمال النظافة والصيانة</strong>، <strong>أولياء الأمور</strong>، و<strong>الطلاب</strong> مع الأدوار والمسميات الوظيفية المسندة لهم في شؤون العاملين، مع <strong>إيقاف حساب أي شخص يتم أرشفته</strong>. لا يُنشأ أي حساب تلقائياً: يُنشأ كل حساب جديد بكلمة مرور مؤقتة يغيّرها صاحبها عند أول دخول.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5 shrink-0"
              title="مزامنة فورية وتحديث الأدوار مع شؤون العاملين والطلاب"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "جاري المزامنة..." : "مزامنة فورية للأدوار"}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="bg-primary-100/80 border border-primary-300 text-primary-900 px-4 py-2.5 rounded-xl text-small font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-primary-700 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Search, Filters & View Mode Switcher Control Bar */}
          <div className="bg-surface border border-sand-200/80 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-ink-3">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                aria-label="البحث باسم المستخدم أو الاسم الكامل..."
                placeholder="البحث باسم المستخدم أو الاسم الكامل..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3"
              />
              {userSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUserSearchQuery("")}
                  aria-label="مسح البحث"
                  title="مسح البحث"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-3 hover:text-ink-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-ink-3 hidden sm:inline" />
                <Select
                  aria-label="تصفية حسب الدور"
                  value={userRoleFilter}
                  onChange={(v) => setUserRoleFilter(v)}
                  size="sm"
                  className="w-auto"
                >
                  <option value="all">جميع الأدوار</option>
                  <option value="مدير">مدراء ومسيرو الجمعية (رئيس / مدير)</option>
                  <option value="إداري">إداريون وأعضاء المكتب التنفيذي</option>
                  <option value="مؤطر">مؤطرون ومشرفون تربويون</option>
                  <option value="مدرس">أساتذة ومحفظون (حلقات التحفيظ)</option>
                  <option value="متطوع">متطوعون بالأنشطة والفعاليات</option>
                  <option value="عامل نظافة / صيانة">عمال نظافة وصيانة</option>
                  <option value="ولي أمر">أولياء أمور</option>
                  <option value="طالب">طلاب (15+ سنة)</option>
                  <option value="أخرى">أخرى</option>
                </Select>
              </div>

              {/* Status filter */}
              <Select
                aria-label="تصفية حسب حالة الحساب"
                value={userStatusFilter}
                onChange={(v) => setUserStatusFilter(v)}
                size="sm"
                className="w-auto"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">الحسابات النشطة فقط</option>
                <option value="inactive">الحسابات الموقوفة فقط</option>
              </Select>

              {/* View Switcher Toggle (matching dark styled switcher in screenshot) */}
              <div className="flex items-center bg-night border border-night-2 rounded-xl p-1 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setUserViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-small font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "cards"
                      ? "bg-primary-950 text-primary-300 border border-primary-500/80"
                      : "text-night-muted hover:text-night-text hover:bg-night-2"
                  }`}
                  title="عرض البطاقات (كانبان)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">البطاقات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-small font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    userViewMode === "table"
                      ? "bg-primary-950 text-primary-300 border border-primary-500/80"
                      : "text-night-muted hover:text-night-text hover:bg-night-2"
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
            <div className="bg-surface border border-line rounded-2xl p-12 text-center text-ink-3 text-small font-bold">
              <Users className="w-10 h-10 text-sand-400 mx-auto mb-3" />
              <p className="text-sm text-ink-2 font-bold">لا توجد حسابات مطابقة لخيارات البحث أو التصفية الحالية.</p>
              <p className="text-ink-3 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط التصفية.</p>
            </div>
          ) : userViewMode === "table" ? (
            /* ==================== 1. TABLE (cartes sous md : DataTable) ==================== */
            <div className="bg-surface border border-line rounded-2xl overflow-hidden">
              <DataTable
                label="قائمة الحسابات"
                rows={filteredUsers}
                rowKey={(user) => user.id}
                rowClassName={(user) => (!user.isActive ? "bg-danger-50/30 text-ink-3" : undefined)}
                columns={[
                  {
                    id: "name",
                    header: "الاسم الكامل",
                    card: "title",
                    cell: (user) => (
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-small shrink-0 bg-primary-100 text-primary-800 border border-primary-200" aria-hidden="true">
                          {accountName(user).substring(0, 1)}
                        </span>
                        {nameBlock(user)}
                      </div>
                    ),
                    cardCell: nameBlock,
                  },
                  {
                    id: "username",
                    header: "اسم المستخدم",
                    card: "field",
                    cell: (user) => (
                      <span className="inline-flex items-center gap-2 font-mono text-small">
                        <bdi dir="ltr" className="bg-sunken px-2 py-0.5 rounded-lg border border-line font-semibold text-ink-2">@{user.username}</bdi>
                        {user.mustChangePassword && (
                          <span className="text-gold-700 font-bold font-sans text-caption" title="يجب على المستخدم تغيير كلمة المرور عند الدخول">تغيير إلزامي</span>
                        )}
                      </span>
                    ),
                  },
                  {
                    id: "role",
                    header: "الدور",
                    card: "field",
                    cell: (user) => (
                      <div className="flex flex-col items-start gap-1">
                        <Pill tone={roleTone(user.role)}>{user.role}</Pill>
                        {user.roleTitle && user.roleTitle !== user.role && (
                          <span className="text-caption text-ink-3 font-medium" title="المسمى الوظيفي المسند في شؤون العاملين">{user.roleTitle}</span>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "status",
                    header: "الحالة",
                    card: "field",
                    cell: (user) => <Pill tone={user.isActive ? "success" : "danger"} dot>{user.isActive ? "نشط" : user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}</Pill>,
                  },
                  {
                    id: "lastLogin",
                    header: "آخر تسجيل دخول",
                    card: "field",
                    cardLabel: "آخر دخول",
                    cell: (user) => (
                      <span className="inline-flex items-center gap-1.5 text-small">
                        <Clock className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden="true" />
                        <span className={user.lastLogin ? "font-semibold text-ink-2" : "text-ink-3 italic"}>{formatLastLogin(user.lastLogin)}</span>
                      </span>
                    ),
                  },
                  {
                    id: "perms",
                    header: "الصلاحيات والتراخيص",
                    cell: (user) => (
                      <div className="flex flex-wrap gap-1">
                        {user.role === "مدير" ? (
                          <span className="bg-gold-100/80 text-gold-900 border border-gold-300 px-2 py-0.5 rounded text-caption font-bold">كامل الصلاحيات</span>
                        ) : (
                          [
                            ["الطلاب", user.canEditStudents],
                            ["العاملين", user.canEditTeachers],
                            ["الدرجات", user.canEditGrades],
                            ["المالية", user.canEditPayments],
                          ].map(([label, on]) => (
                            <span key={label as string} className={`px-1.5 py-0.5 rounded text-caption border ${on ? "bg-primary-50 text-primary-800 border-primary-200" : "bg-transparent text-ink-3 border-dashed border-line-strong line-through"}`}>{label as string}</span>
                          ))
                        )}
                      </div>
                    ),
                  },
                ]}
                actions={(user) => (
                  <>
                    {canUpdateAccounts && onResetUserPassword && (
                      <IconButton size="sm" label="إعادة تعيين كلمة المرور" onClick={() => handleResetPassword(user)}><KeyRound className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                    {canUpdateAccounts && (
                      <IconButton size="sm" tone="primary" label="تعديل الحساب والصلاحيات" onClick={() => openUserModal(user)}><Edit2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                    {canDeleteAccounts && !isPrimaryDirector(user) && (
                      <IconButton
                        size="sm"
                        tone="danger"
                        label="حذف الحساب نهائياً"
                        onClick={async () => {
                          if (await confirm({ message: `هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`, tone: "danger" })) {
                            onDeleteAppUser(user.id);
                          }
                        }}
                      ><Trash2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                  </>
                )}
              />
            </div>
          ) : (
            /* ==================== 2. CARDS / KANBAN VIEW ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-surface border rounded-2xl p-4 relative transition hover:border-line-strong flex flex-col justify-between ${
                    !user.isActive ? "border-danger-200/80 bg-danger-50/20" : "border-sand-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-caption px-2.5 py-0.5 rounded-full font-bold border ${
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
                          : "bg-sand-100 text-ink border-line"
                      }`}>
                        {user.role}
                      </span>
                      <span className={`text-caption font-bold px-2 py-0.5 rounded border ${
                        user.isActive ? "bg-primary-50 text-primary-600 border-primary-200" : "bg-danger-50 text-danger-600 border-danger-200"
                      }`}>
                        {user.isActive ? "نشط" : user.isArchived ? "موقوف (مؤرشف)" : "موقوف"}
                      </span>
                    </div>

                    <h4 className={`font-bold text-sm mb-0.5 ${user.isArchived ? "line-through text-ink-3" : "text-ink"}`}>
                      {isPrimaryDirector(user) && directorName ? directorName : user.fullName}
                    </h4>
                    {user.roleTitle && user.roleTitle !== user.role && (
                      <p className="text-small text-ink-3 font-medium mb-1">{user.roleTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-small text-ink-3 font-mono">@{user.username}</p>
                      <div className="flex items-center gap-1 bg-sand-100 px-2 py-0.5 rounded-md font-mono text-caption">
                        <span className={`font-bold ${user.mustChangePassword ? "text-gold-700" : "text-ink-2"}`}>
                          {user.mustChangePassword ? "تغيير إلزامي" : "••••••••"}
                        </span>
                        {canUpdateAccounts && onResetUserPassword && (
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            className="text-ink-3 hover:text-primary-700 transition cursor-pointer p-0.5 rounded"
                            title="إعادة تعيين كلمة المرور" aria-label="إعادة تعيين كلمة المرور"
                          >
                            <KeyRound className="w-3 h-3 text-primary-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Last login date info */}
                    <div className="mb-3 flex items-center gap-1.5 text-small text-ink-3 bg-sand-50 p-2 rounded-xl border border-line-soft">
                      <Clock className="w-3.5 h-3.5 text-ink-3" />
                      <span>آخر دخول:</span>
                      <span className="font-bold text-ink-2">{formatLastLogin(user.lastLogin)}</span>
                    </div>

                    {(user.id.startsWith("t_") || user.id.startsWith("p_") || user.id.startsWith("s_")) && (
                      <div className="mb-3 flex items-center gap-1 bg-primary-50 text-primary-800 border border-primary-100 rounded-lg px-2 py-1.5 text-caption font-bold" dir="rtl">
                        <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>مزامنة تلقائية من سجلات {user.role}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-line-soft pt-3 mt-2 text-small text-ink-2">
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

                  <div className="flex gap-2 border-t border-line-soft pt-3 mt-4 justify-end">
                    {canUpdateAccounts && (
                      <button
                        onClick={() => openUserModal(user)}
                        className="p-2 text-primary-600 hover:bg-primary-50 border border-primary-200/60 rounded-xl transition cursor-pointer"
                        title="تعديل الحساب والصلاحيات" aria-label="تعديل الحساب والصلاحيات"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteAccounts && !isPrimaryDirector(user) && (
                      <button
                        onClick={async () => {
                          if (await confirm({ message: `هل أنت متأكد من حذف حساب المستخدم ${user.fullName}؟`, tone: "danger" })) {
                            onDeleteAppUser(user.id);
                          }
                        }}
                        className="p-2 text-danger-600 hover:bg-danger-50 border border-danger-200/60 rounded-xl transition cursor-pointer"
                        title="حذف الحساب نهائياً" aria-label="حذف الحساب نهائياً"
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
