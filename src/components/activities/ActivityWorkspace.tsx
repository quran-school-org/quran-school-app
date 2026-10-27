/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Compass, MapPin, Calendar, Users, DollarSign, Plus, Edit3, Trash2, Printer, CheckCircle2, TrendingUp, Search, FileText, RefreshCw, CheckCircle, Info } from "lucide-react";
import { EXPENSE_CATEGORIES } from "./shared";
import { useActivities } from "./ActivitiesContext";
import { DataTable, IconButton, Ltr, Select, SectionHeader, useConfirm, type DataColumn } from "../../ui";
import type { ActivityExpense, ActivityParticipant } from "../../types";
import { formatMoney, formatNumber } from "../../format/money";
import { formatDateAr, formatDateRangeAr } from "../../format/date";

export default function ActivityWorkspace() {
  const confirm = useConfirm();
  const {
    canCreateActivity,
    canUpdateActivity,
    canDeleteActivity,
    canPrintActivity,
    onDeleteActivity,
    onDeleteParticipant,
    onDeleteActivityExpense,
    onNavigateToFinance,
    setSelectedActivityId,
    activeTab,
    setActiveTab,
    partSearchQuery,
    setPartSearchQuery,
    partTypeFilter,
    setPartTypeFilter,
    partStatusFilter,
    setPartStatusFilter,
    partSortKey,
    setPartSortKey,
    partSortDir,
    setPartSortDir,
    expSearchQuery,
    setExpSearchQuery,
    expCategoryFilter,
    setExpCategoryFilter,
    expSortKey,
    setExpSortKey,
    expSortDir,
    setExpSortDir,
    handleToggleSort,
    renderSortableHeader,
    setPrintType,
    setSelectedParticipantForTicket,
    getParticipantRole,
    resolveParticipantFee,
    resolveParticipantPaid,
    resolvePaymentStatusInfo,
    getRoleBadgeStyle,
    currentActivity,
    currentParticipants,
    availablePartRoles,
    currentExpenses,
    currentFinances,
    filteredParticipants,
    filteredExpenses,
    handleOpenAddActivity,
    handleOpenEditActivity,
    handleOpenAddParticipant,
    handleOpenEditParticipant,
    handleOpenAddExpense,
    handleOpenEditExpense,
    handleSyncActivityFinance,
  } = useActivities();

  const sortPart = (label: string, key: string) =>
    renderSortableHeader(label, key, partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir));
  const sortExp = (label: string, key: string) =>
    renderSortableHeader(label, key, expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir));

  const participantColumns: DataColumn<ActivityParticipant>[] = [
    { id: "n", header: "#", className: "text-ink-3 font-mono text-center", cell: (part) => filteredParticipants.indexOf(part) + 1 },
    {
      id: "fullName", header: sortPart("المشارك", "fullName"), card: "title", className: "font-bold text-ink",
      cell: (part) => (
        <>
          {part.fullName}
          {part.medicalNotes && (
            <span className="block text-caption text-gold-800 font-normal mt-0.5">
              <span className="sr-only">ملاحظة صحية: </span>{part.medicalNotes}
            </span>
          )}
        </>
      ),
    },
    {
      id: "role", header: sortPart("الصفة", "participantType"), card: "field",
      cell: (part) => {
        const role = getParticipantRole(part);
        return <span className={`px-2.5 py-1 rounded-lg font-bold text-small inline-flex items-center gap-1 ${getRoleBadgeStyle(role)}`}>{role}</span>;
      },
    },
    { id: "phone", header: sortPart("الهاتف", "phone"), className: "font-mono text-ink-2", cell: (part) => part.phone || "—" },
    {
      id: "fee", header: sortPart("الواجب", "fee"), className: "font-semibold text-ink-2",
      cell: (part) => {
        const feeVal = resolveParticipantFee(part);
        if (resolvePaymentStatusInfo(part).status === "معفى" && feeVal === 0) return <span className="text-primary-700 font-bold">معفى (0 د.م)</span>;
        return <span>{formatMoney(feeVal)}</span>;
      },
    },
    { id: "paid", header: sortPart("المدفوع", "paidAmount"), card: "field", className: "font-bold text-primary-700", cell: (part) => formatMoney(resolveParticipantPaid(part)) },
    {
      id: "status", header: sortPart("حالة الأداء", "paymentStatus"), card: "field",
      cell: (part) => {
        const statusInfo = resolvePaymentStatusInfo(part);
        return <span className={`px-2.5 py-1 rounded-full font-bold text-caption inline-flex items-center gap-1 ${statusInfo.badgeClass}`}>{statusInfo.label}</span>;
      },
    },
    { id: "receiptNo", header: sortPart("رقم الوصل", "receiptNo"), className: "font-mono text-ink-3", cell: (part) => part.receiptNo || "—" },
  ];

  const expenseColumns: DataColumn<ActivityExpense>[] = [
    { id: "n", header: "#", className: "text-ink-3 font-mono text-center", cell: (exp) => filteredExpenses.indexOf(exp) + 1 },
    { id: "title", header: sortExp("بيان المصروف", "title"), card: "title", className: "font-bold text-ink", cell: (exp) => exp.title },
    {
      id: "category", header: sortExp("الفئة / الصنف", "category"), card: "field",
      cell: (exp) => <span className="bg-sand-100 text-ink-2 px-2 py-0.5 rounded-md font-semibold text-caption">{exp.category}</span>,
    },
    { id: "amount", header: sortExp("المبلغ", "amount"), card: "field", className: "font-bold text-danger-700", cell: (exp) => formatMoney(exp.amount) },
    { id: "date", header: sortExp("التاريخ", "date"), card: "field", className: "text-ink-2", cell: (exp) => formatDateAr(exp.date) },
    { id: "supplier", header: sortExp("المورد / الجهة", "supplier"), className: "text-ink-2", cell: (exp) => exp.supplier || "—" },
    { id: "receipt", header: sortExp("رقم الفاتورة/الوصل", "receiptOrInvoiceNo"), className: "font-mono text-ink-3", cell: (exp) => exp.receiptOrInvoiceNo || "—" },
  ];

  return (
    <>
      {/* Right Column: Selected Activity Detailed Workspace (8 cols) */}
      <div className="xl:col-span-8 min-w-0">
        {currentActivity ? (
          <div className="bg-surface rounded-2xl border border-sand-200/80 overflow-hidden space-y-0">
            {/* Activity Detailed Header */}
            <div className="p-5 bg-gradient-to-r from-night via-night-2 to-primary-950 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 text-small px-2.5 py-0.5 rounded-full font-semibold">
                      {currentActivity.type}
                    </span>
                    <span className="bg-white/10 text-white text-small px-2.5 py-0.5 rounded-full">
                      الحالة: {currentActivity.status}
                    </span>
                    {currentActivity.syncedToFinance && (
                      <span className="bg-primary-400/20 text-primary-300 text-small px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-primary-400/30">
                        <CheckCircle2 className="w-3 h-3" />
                        مرتبط بمالية الجمعية
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-2 tracking-tight">{currentActivity.title}</h2>
                  <div className="flex items-center gap-4 text-small text-sand-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-400" />
                      <span>{currentActivity.location}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-400" />
                      <span>التاريخ: <bdi>{formatDateRangeAr(currentActivity.startDate, currentActivity.endDate)}</bdi></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary-400" />
                      <span>واجب المساهمة: {formatMoney(currentActivity.contributionFee)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {canUpdateActivity && (
                    <button
                      onClick={() => handleOpenEditActivity(currentActivity)}
                      className="bg-white/10 hover:bg-white/20 text-white text-small font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل النشاط</span>
                    </button>
                  )}
                  {canDeleteActivity && (
                    <button
                      onClick={async () => {
                        if (await confirm({ message: `هل أنت متأكد من حذف النشاط "${currentActivity.title}" وجميع سجلات المشاركين ومصاريفه؟`, tone: "danger" })) {
                          onDeleteActivity(currentActivity.id);
                          setSelectedActivityId(null);
                        }
                      }}
                      className="bg-danger-500/20 hover:bg-danger-500/30 text-danger-300 border border-danger-500/30 text-small font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-line bg-sand-50/80 px-4 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-4 text-small font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "overview"
                    ? "border-primary-600 text-primary-800 bg-white rounded-t-lg"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>نظرة عامة والبرنامج</span>
              </button>

              <button
                onClick={() => setActiveTab("participants")}
                className={`py-3 px-4 text-small font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "participants"
                    ? "border-primary-600 text-primary-800 bg-white rounded-t-lg"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>المشاركون والمساهمات</span>
                <span className="bg-primary-100 text-primary-800 text-caption px-1.5 py-0.5 rounded-full font-bold">
                  {currentParticipants.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("expenses")}
                className={`py-3 px-4 text-small font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "expenses"
                    ? "border-primary-600 text-primary-800 bg-white rounded-t-lg"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>مصاريف النشاط</span>
                <span className="bg-danger-100 text-danger-800 text-caption px-1.5 py-0.5 rounded-full font-bold">
                  {currentExpenses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("finance")}
                className={`py-3 px-4 text-small font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "finance"
                    ? "border-primary-600 text-primary-800 bg-white rounded-t-lg"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>الميزانية والربط المالي</span>
                {currentActivity.syncedToFinance && (
                  <span className="bg-primary-600 text-white text-caption px-1.5 py-0.5 rounded-full font-bold">
                    تم الربط
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Overview & Program */}
            {activeTab === "overview" && (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-sand-50 border border-line rounded-xl p-4">
                    <div className="text-small text-ink-3 font-medium">الفئة المستهدفة</div>
                    <div className="text-sm font-bold text-ink mt-1">
                      {currentActivity.targetAudience || "الجميع (طلاب، أطر، أولياء أمور)"}
                    </div>
                  </div>
                  <div className="bg-sand-50 border border-line rounded-xl p-4">
                    <div className="text-small text-ink-3 font-medium">نقطة وساعة الانطلاق</div>
                    <div className="text-sm font-bold text-ink mt-1">{currentActivity.meetingPoint || "مقر الجمعية"}</div>
                  </div>
                  <div className="bg-sand-50 border border-line rounded-xl p-4">
                    <div className="text-small text-ink-3 font-medium">المؤطرون والمشرفون</div>
                    <div className="text-sm font-bold text-primary-800 mt-1">
                      {currentActivity.leaderNames && currentActivity.leaderNames.length > 0 
                        ? currentActivity.leaderNames.join("، ") 
                        : "لم يتم التحديد بعد"}
                    </div>
                  </div>
                </div>

                {currentActivity.description && (
                  <div className="bg-sand-50 border border-line rounded-xl p-4">
                    <h4 className="text-small font-bold text-ink-2 mb-1.5">الأهداف والوصف العام</h4>
                    <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{currentActivity.description}</p>
                  </div>
                )}

                {currentActivity.programDetails ? (
                  <div className="bg-primary-50/50 border border-primary-200 rounded-xl p-4">
                    <h4 className="text-small font-bold text-primary-900 mb-1.5">البرنامج الزمني والتفصيلي</h4>
                    <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{currentActivity.programDetails}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-sand-50 rounded-xl border border-dashed border-line text-small text-ink-3">
                    لم يتم إدخال تفاصيل البرنامج الزمني بعد. يمكنك إضافته عبر زر تعديل النشاط.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Participants & Contributions Tracker */}
            {activeTab === "participants" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-soft pb-3">
                  <SectionHeader level={3} size="md" title="لائحة المشاركين والمساهمات" subtitle="تسجيل الطلاب والعاملين وتتبع المبالغ المدفوعة ووصولات الأداء" />

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenAddParticipant}
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تسجيل مشارك جديد</span>
                    </button>

                    {canPrintActivity && (
                      <button
                        onClick={() => setPrintType("participants-list")}
                        className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-body font-semibold transition-colors cursor-pointer gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة لائحة المشاركين</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Participants Filter and Sort Bar */}
                <div className="bg-sand-50 p-3 rounded-xl border border-line flex flex-wrap items-center justify-between gap-2.5">
                  <div className="relative flex-[1_1_16rem] min-w-0">
                    <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                      type="text"
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      placeholder="بحث بالاسم، رقم الهاتف، أو رقم الوصل..."
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pe-3 ps-9"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      aria-label="تصفية حسب الصفة"
                      value={partTypeFilter}
                      onChange={(v) => setPartTypeFilter(v)}
                      size="sm"
                      className="w-auto"
                    >
                      <option value="all">كل الصفات والمشاركين</option>
                      <option value="طالب">طالب</option>
                      {availablePartRoles.filter(r => r !== "طالب").map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </Select>

                    <Select
                      aria-label="تصفية حسب حالة الأداء"
                      value={partStatusFilter}
                      onChange={(v) => setPartStatusFilter(v)}
                      size="sm"
                      className="w-auto"
                    >
                      <option value="all">كل حالات الأداء</option>
                      <option value="مدفوع">مدفوع</option>
                      <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                      <option value="غير مدفوع">غير مدفوع</option>
                      <option value="معفى">معفى</option>
                    </Select>

                    <span className="text-small font-semibold text-ink-3 bg-white px-2 py-1.5 rounded-lg border border-line shrink-0">
                      العدد: {filteredParticipants.length} / {currentParticipants.length}
                    </span>
                  </div>
                </div>

                {/* Participants Table */}
                {currentParticipants.length === 0 ? (
                  <div className="text-center py-12 bg-sand-50 rounded-xl border border-dashed border-line p-4">
                    <Users className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                    <h4 className="font-bold text-ink-2 text-sm">لم يتم تسجيل أي مشارك في هذا النشاط بعد</h4>
                    <p className="text-small text-ink-3 mt-1 max-w-sm mx-auto">
                      يمكنك إضافة الطلاب المسجلين بالجمعية أو الأطر الإدارية والتربوية أو مشاركين خارجيين
                    </p>
                    <button
                      onClick={handleOpenAddParticipant}
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 mt-3 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تسجيل أول مشارك</span>
                    </button>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 bg-sand-50 rounded-xl border border-line p-4">
                    <Search className="w-8 h-8 text-sand-400 mx-auto mb-2" />
                    <p className="text-small text-ink-3 font-medium">لا توجد نتائج مطابقة لبحث المشاركين</p>
                  </div>
                ) : (
                  <div className="border border-line rounded-xl overflow-hidden">
                    <DataTable
                      label="لائحة المشاركين والمساهمات"
                      rows={filteredParticipants}
                      rowKey={(part) => part.id}
                      columns={participantColumns}
                      actions={(part) => (
                        <>
                          <IconButton
                            size="sm"
                            label="طباعة بطاقة المشارك"
                            onClick={() => {
                              setSelectedParticipantForTicket(part);
                              setPrintType("participant-ticket");
                            }}
                          ><FileText className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                          <IconButton size="sm" label="تعديل بيانات المشارك والدفع" onClick={() => handleOpenEditParticipant(part)}><Edit3 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                          <IconButton
                            size="sm"
                            tone="danger"
                            label="حذف المشارك"
                            onClick={async () => {
                              if (await confirm({ message: `هل أنت متأكد من حذف المشارك "${part.fullName}"؟`, tone: "danger" })) {
                                onDeleteParticipant(part.id);
                              }
                            }}
                          ><Trash2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                        </>
                      )}
                      actionsHeader="إجراءات"
                      dense
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Activity Expenses Ledger */}
            {activeTab === "expenses" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-soft pb-3">
                  <SectionHeader level={3} size="md" title="مصاريف النشاط والرحلة" subtitle="تسجيل كراء الحافلة، كراء الفضاء، التغذية، التأمين وباقي التكاليف" />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddExpense}
                      className="bg-danger-700 hover:bg-danger-800 text-white text-small font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة نفقة / مصروف</span>
                    </button>
                  </div>
                </div>

                {/* Expenses Filter Bar */}
                <div className="bg-sand-50 p-3 rounded-xl border border-line flex flex-wrap items-center justify-between gap-2.5">
                  <div className="relative flex-[1_1_16rem] min-w-0">
                    <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                      type="text"
                      value={expSearchQuery}
                      onChange={(e) => setExpSearchQuery(e.target.value)}
                      placeholder="بحث ببيان المصروف، المورد، أو رقم الفاتورة..."
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pe-3 ps-9"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      aria-label="تصفية حسب فئة المصروف"
                      value={expCategoryFilter}
                      onChange={(v) => setExpCategoryFilter(v)}
                      size="sm"
                      className="w-auto"
                    >
                      <option value="all">كل الفئات والمصاريف</option>
                      {EXPENSE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>

                    <span className="text-small font-semibold text-ink-3 bg-white px-2 py-1.5 rounded-lg border border-line shrink-0">
                      العدد: {filteredExpenses.length} / {currentExpenses.length}
                    </span>
                  </div>
                </div>

                {currentExpenses.length === 0 ? (
                  <div className="text-center py-12 bg-sand-50 rounded-xl border border-dashed border-line p-4">
                    <DollarSign className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                    <h4 className="font-bold text-ink-2 text-sm">لم يتم تسجيل أي مصاريف لهذا النشاط بعد</h4>
                    <p className="text-small text-ink-3 mt-1 max-w-sm mx-auto">
                      سجل نفقات النقل والتنقل، الوجبات، وتأجير الفضاءات لحساب الميزانية التقديرية بدقة
                    </p>
                    <button
                      onClick={handleOpenAddExpense}
                      className="mt-3 inline-flex items-center gap-1.5 bg-danger-700 text-white text-small font-semibold px-3.5 py-2 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة أول مصروف</span>
                    </button>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-8 bg-sand-50 rounded-xl border border-line p-4">
                    <Search className="w-8 h-8 text-sand-400 mx-auto mb-2" />
                    <p className="text-small text-ink-3 font-medium">لا توجد مصاريف مطابقة للبحث</p>
                  </div>
                ) : (
                  <div className="border border-line rounded-xl overflow-hidden">
                    <DataTable
                      label="مصاريف النشاط والرحلة"
                      rows={filteredExpenses}
                      rowKey={(exp) => exp.id}
                      columns={expenseColumns}
                      actions={(exp) => (
                        <>
                          <IconButton size="sm" label="تعديل المصروف" onClick={() => handleOpenEditExpense(exp)}><Edit3 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                          <IconButton
                            size="sm"
                            tone="danger"
                            label="حذف المصروف"
                            onClick={async () => {
                              if (await confirm({ message: `هل أنت متأكد من حذف المصروف "${exp.title}"؟`, tone: "danger" })) {
                                onDeleteActivityExpense(exp.id);
                              }
                            }}
                          ><Trash2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                        </>
                      )}
                      actionsHeader="إجراءات"
                      dense
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Financial Balance & Sync with Accounting */}
            {activeTab === "finance" && (
              <div className="p-5 space-y-6">
                {/* Financial Balance Summary Card */}
                <div className="bg-night text-white rounded-2xl p-6 border border-night-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-night-2 pb-4">
                    <div>
                      <span className="text-small font-semibold text-primary-400">كشف الميزانية المستقلة للنشاط</span>
                      <h3 className="text-lg font-bold mt-0.5">{currentActivity.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPrintActivity && (
                        <button
                          onClick={() => setPrintType("financial-report")}
                          className="bg-white/10 hover:bg-white/20 text-white text-small font-medium px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-white/10"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة التقرير المالي الرسمي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div className="bg-night-2/80 rounded-xl p-4 border border-night-line">
                      <div className="text-small text-ink-3 font-medium">إجمالي المداخيل والمساهمات</div>
                      <div className="text-2xl font-bold text-primary-400 mt-1">
                        <Ltr>{formatNumber(currentFinances.totalCollected, { signed: true })}</Ltr> <span className="text-small font-normal text-ink-3">د.م</span>
                      </div>
                      <div className="text-small text-ink-3 mt-1">
                        من أصل {formatMoney(currentFinances.totalExpected)} متوقعة
                      </div>
                    </div>

                    <div className="bg-night-2/80 rounded-xl p-4 border border-night-line">
                      <div className="text-small text-ink-3 font-medium">إجمالي المصاريف المؤداة</div>
                      <div className="text-2xl font-bold text-danger-400 mt-1">
                        <Ltr>{formatNumber(-currentFinances.totalSpent)}</Ltr> <span className="text-small font-normal text-ink-3">د.م</span>
                      </div>
                      <div className="text-small text-ink-3 mt-1">
                        موزعة على {currentExpenses.length} بنود مصاريف
                      </div>
                    </div>

                    <div className="bg-night-2/80 rounded-xl p-4 border border-night-line">
                      <div className="text-small text-ink-3 font-medium">النتيجة الصافية للنشاط</div>
                      <div className={`text-2xl font-bold mt-1 ${currentFinances.netBalance >= 0 ? "text-primary-400" : "text-danger-400"}`}>
                        <Ltr>{formatNumber(currentFinances.netBalance, { signed: true })}</Ltr> <span className="text-small font-normal text-ink-3">د.م</span>
                      </div>
                      <div className="text-small text-ink-3 mt-1">
                        {currentFinances.netBalance > 0 ? "فائض مالي يُحول لمالية الجمعية" : currentFinances.netBalance < 0 ? "عجز مالي يغطى من الجمعية" : "ميزانية متوازنة تماماً"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Association Accounting Automatic Sync Box */}
                <div className="bg-gradient-to-l from-primary-50 to-primary-50 border border-primary-200/90 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-[1_1_26rem] min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-primary-950 text-sm">الربط المالي التلقائي مع المحاسبة والمالية الجمعوية</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100/90 border border-primary-300 text-primary-800 rounded-full text-caption font-bold whitespace-nowrap shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse"></span>
                            ربط تلقائي فوري مفعّل
                          </span>
                        </div>
                        <p className="text-small text-primary-800 mt-1 leading-relaxed max-w-2xl">
                          يتم احتساب وربط صافي هذا النشاط ({currentFinances.netBalance >= 0 ? `فائض ${formatMoney(currentFinances.netBalance)}` : `عجز ${formatMoney(Math.abs(currentFinances.netBalance))}`}) تلقائياً ومباشرة مع القيود المحاسبية ورصيد الصندوق للجمعية بدون الحاجة لأي تصدير يدوي.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 max-w-full">
                      {onNavigateToFinance && (
                        <button
                          onClick={onNavigateToFinance}
                          title="الانتقال إلى المحاسبة والمالية الجمعوية لمعاينة القيود والتقارير"
                          className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 w-full sm:w-auto max-w-full justify-center gap-1.5 text-center"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>معاينة في المحاسبة</span>
                        </button>
                      )}
                      <button
                        onClick={handleSyncActivityFinance}
                        title="تحديث فوري والتحقق من المزامنة"
                        className="w-full sm:w-auto max-w-full min-h-11 bg-white hover:bg-primary-50 text-primary-800 border border-primary-300 text-small font-semibold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                        <span>تحقق من المزامنة</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-primary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-small text-primary-900">
                    <div className="flex items-start gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary-600 shrink-0" />
                      <span className="font-medium">
                        القيد المالي المباشر: {currentFinances.netBalance > 0 
                          ? `مقيد آلياً كـ [فائض إيرادات أنشطة ${formatMoney(currentFinances.netBalance)}]`
                          : currentFinances.netBalance < 0 
                          ? `مقيد آلياً كـ [تغطية عجز أنشطة ${formatMoney(Math.abs(currentFinances.netBalance))}]`
                          : `ميزانية متوازنة ومضبوطة بالكامل (0 د.م)`
                        }
                      </span>
                    </div>
                    <div className="text-small text-primary-700 font-mono">
                      (مساهمات: {formatMoney(currentFinances.totalCollected)} | مصاريف: {formatMoney(currentFinances.totalSpent)})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-line p-12 text-center">
            <Compass className="w-12 h-12 text-sand-400 mx-auto mb-3" />
            <h3 className="font-bold text-primary-800 text-base">اختر نشاطاً أو رحلة من القائمة</h3>
            <p className="text-small text-ink-3 mt-1 max-w-sm mx-auto">
              يمكنك الاطلاع على تفاصيل البرنامج، تسجيل المشاركين، تتبع المصاريف، وتصدير الصافي إلى المحاسبة
            </p>
            {canCreateActivity && (
              <button
                onClick={handleOpenAddActivity}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 mt-4 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نشاط جديد الآن</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
