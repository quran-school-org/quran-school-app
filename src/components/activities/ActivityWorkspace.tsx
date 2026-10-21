/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Compass, MapPin, Calendar, Users, DollarSign, Plus, Edit3, Trash2, Printer, CheckCircle2, TrendingUp, Search, FileText, RefreshCw, CheckCircle, Info, Filter } from "lucide-react";
import { EXPENSE_CATEGORIES } from "./shared";
import { useActivities } from "./ActivitiesContext";

export default function ActivityWorkspace() {
  const {
    participants,
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

  return (
    <>
      {/* Right Column: Selected Activity Detailed Workspace (8 cols) */}
      <div className="lg:col-span-8">
        {currentActivity ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
            {/* Activity Detailed Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      {currentActivity.type}
                    </span>
                    <span className="bg-white/10 text-white text-xs px-2.5 py-0.5 rounded-full">
                      الحالة: {currentActivity.status}
                    </span>
                    {currentActivity.syncedToFinance && (
                      <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                        <CheckCircle2 className="w-3 h-3" />
                        مرتبط بمالية الجمعية
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-2 tracking-tight">{currentActivity.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentActivity.location}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>التاريخ: {currentActivity.startDate} {currentActivity.endDate ? `إلى ${currentActivity.endDate}` : ""}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>واجب المساهمة: {currentActivity.contributionFee} د.م</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {canUpdateActivity && (
                    <button
                      onClick={() => handleOpenEditActivity(currentActivity)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل النشاط</span>
                    </button>
                  )}
                  {canDeleteActivity && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف النشاط "${currentActivity.title}" وجميع سجلات المشاركين ومصاريفه؟`)) {
                          onDeleteActivity(currentActivity.id);
                          setSelectedActivityId(null);
                        }
                      }}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "overview"
                    ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>نظرة عامة والبرنامج</span>
              </button>

              <button
                onClick={() => setActiveTab("participants")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "participants"
                    ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>المشاركون والمساهمات</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {currentParticipants.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("expenses")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "expenses"
                    ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>مصاريف النشاط</span>
                <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {currentExpenses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("finance")}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "finance"
                    ? "border-emerald-600 text-emerald-800 bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>الميزانية والربط المالي</span>
                {currentActivity.syncedToFinance && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    تم الربط
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Overview & Program */}
            {activeTab === "overview" && (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-medium">الفئة المستهدفة</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {currentActivity.targetAudience || "الجميع (طلاب، أطر، أولياء أمور)"}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-medium">نقطة وساعة الانطلاق</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{currentActivity.meetingPoint || "مقر الجمعية"}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs text-slate-500 font-medium">المؤطرون والمشرفون</div>
                    <div className="text-sm font-bold text-emerald-800 mt-1">
                      {currentActivity.leaderNames && currentActivity.leaderNames.length > 0 
                        ? currentActivity.leaderNames.join("، ") 
                        : "لم يتم التحديد بعد"}
                    </div>
                  </div>
                </div>

                {currentActivity.description && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-1.5">الأهداف والوصف العام</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{currentActivity.description}</p>
                  </div>
                )}

                {currentActivity.programDetails ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-900 mb-1.5">البرنامج الزمني والتفصيلي</h4>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{currentActivity.programDetails}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    لم يتم إدخال تفاصيل البرنامج الزمني بعد. يمكنك إضافته عبر زر تعديل النشاط.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Participants & Contributions Tracker */}
            {activeTab === "participants" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">لائحة المشاركين والمساهمات</h3>
                    <p className="text-xs text-slate-500">تسجيل الطلاب والعاملين وتتبع المبالغ المدفوعة ووصولات الأداء</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenAddParticipant}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تسجيل مشارك جديد</span>
                    </button>

                    {canPrintActivity && (
                      <button
                        onClick={() => setPrintType("participants-list")}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة لائحة المشاركين</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Participants Filter and Sort Bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      placeholder="بحث بالاسم، رقم الهاتف، أو رقم الوصل..."
                      className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={partTypeFilter}
                      onChange={(e) => setPartTypeFilter(e.target.value)}
                      className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="all">كل الصفات والمشاركين</option>
                      <option value="طالب">طالب</option>
                      {availablePartRoles.filter(r => r !== "طالب").map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>

                    <select
                      value={partStatusFilter}
                      onChange={(e) => setPartStatusFilter(e.target.value)}
                      className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">كل حالات الأداء</option>
                      <option value="مدفوع">مدفوع</option>
                      <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                      <option value="غير مدفوع">غير مدفوع</option>
                      <option value="معفى">معفى</option>
                    </select>

                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                      العدد: {filteredParticipants.length} / {currentParticipants.length}
                    </span>
                  </div>
                </div>

                {/* Participants Table */}
                {currentParticipants.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">لم يتم تسجيل أي مشارك في هذا النشاط بعد</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      يمكنك إضافة الطلاب المسجلين بالجمعية أو الأطر الإدارية والتربوية أو مشاركين خارجيين
                    </p>
                    <button
                      onClick={handleOpenAddParticipant}
                      className="mt-3 inline-flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تسجيل أول مشارك</span>
                    </button>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">لا توجد نتائج مطابقة لبحث المشاركين</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center">#</th>
                          {renderSortableHeader("المشارك", "fullName", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("الصفة", "participantType", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("الهاتف", "phone", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("الواجب", "fee", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("المدفوع", "paidAmount", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("حالة الأداء", "paymentStatus", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          {renderSortableHeader("رقم الوصل", "receiptNo", partSortKey, partSortDir, (k) => handleToggleSort(k, partSortKey, partSortDir, setPartSortKey, setPartSortDir))}
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredParticipants.map((part, idx) => (
                          <tr key={part.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">
                              {part.fullName}
                              {part.medicalNotes && (
                                <span className="block text-[10px] text-amber-700 font-normal mt-0.5">
                                  ⚠️ {part.medicalNotes}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {(() => {
                                const role = getParticipantRole(part);
                                const badgeClass = getRoleBadgeStyle(role);

                                return (
                                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs ${badgeClass}`}>
                                    {role}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-3 font-mono text-slate-600">{part.phone || "—"}</td>
                            <td className="p-3 font-semibold text-slate-700">
                              {(() => {
                                const feeVal = resolveParticipantFee(part);
                                const statusInfo = resolvePaymentStatusInfo(part);
                                if (statusInfo.status === "معفى" && feeVal === 0) {
                                  return <span className="text-blue-700 font-bold">معفى (0 د.م)</span>;
                                }
                                return <span>{feeVal.toLocaleString()} د.م</span>;
                              })()}
                            </td>
                            <td className="p-3 font-bold text-emerald-700">
                              {resolveParticipantPaid(part).toLocaleString()} د.م
                            </td>
                            <td className="p-3">
                              {(() => {
                                const statusInfo = resolvePaymentStatusInfo(part);
                                return (
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">{part.receiptNo || "—"}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  title="طباعة بطاقة المشارك"
                                  onClick={() => {
                                     setSelectedParticipantForTicket(part);
                                     setPrintType("participant-ticket");
                                  }}
                                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  title="تعديل بيانات المشارك والدفع"
                                  onClick={() => handleOpenEditParticipant(part)}
                                  className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  title="حذف المشارك"
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف المشارك "${part.fullName}"؟`)) {
                                      onDeleteParticipant(part.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Activity Expenses Ledger */}
            {activeTab === "expenses" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">مصاريف النشاط والرحلة</h3>
                    <p className="text-xs text-slate-500">تسجيل كراء الحافلة، كراء الفضاء، التغذية، التأمين وباقي التكاليف</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddExpense}
                      className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة نفقة / مصروف</span>
                    </button>
                  </div>
                </div>

                {/* Expenses Filter Bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={expSearchQuery}
                      onChange={(e) => setExpSearchQuery(e.target.value)}
                      placeholder="بحث ببيان المصروف، المورد، أو رقم الفاتورة..."
                      className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={expCategoryFilter}
                      onChange={(e) => setExpCategoryFilter(e.target.value)}
                      className="py-1.5 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">كل الفئات والمصاريف</option>
                      {EXPENSE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shrink-0">
                      العدد: {filteredExpenses.length} / {currentExpenses.length}
                    </span>
                  </div>
                </div>

                {currentExpenses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">لم يتم تسجيل أي مصاريف لهذا النشاط بعد</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      سجل نفقات النقل والتنقل، الوجبات، وتأجير الفضاءات لحساب الميزانية التقديرية بدقة
                    </p>
                    <button
                      onClick={handleOpenAddExpense}
                      className="mt-3 inline-flex items-center gap-1.5 bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة أول مصروف</span>
                    </button>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">لا توجد مصاريف مطابقة للبحث</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center">#</th>
                          {renderSortableHeader("بيان المصروف", "title", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          {renderSortableHeader("الفئة / الصنف", "category", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          {renderSortableHeader("المبلغ", "amount", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          {renderSortableHeader("التاريخ", "date", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          {renderSortableHeader("المورد / الجهة", "supplier", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          {renderSortableHeader("رقم الفاتورة/الوصل", "receiptOrInvoiceNo", expSortKey, expSortDir, (k) => handleToggleSort(k, expSortKey, expSortDir, setExpSortKey, setExpSortDir))}
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map((exp, idx) => (
                          <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800">{exp.title}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-rose-700">{exp.amount.toLocaleString()} د.م</td>
                            <td className="p-3 text-slate-600 font-mono">{exp.date}</td>
                            <td className="p-3 text-slate-700">{exp.supplier || "—"}</td>
                            <td className="p-3 font-mono text-slate-500">{exp.receiptOrInvoiceNo || "—"}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  title="تعديل المصروف"
                                  onClick={() => handleOpenEditExpense(exp)}
                                  className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  title="حذف المصروف"
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من حذف المصروف "${exp.title}"؟`)) {
                                      onDeleteActivityExpense(exp.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Financial Balance & Sync with Accounting */}
            {activeTab === "finance" && (
              <div className="p-5 space-y-6">
                {/* Financial Balance Summary Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400">كشف الميزانية المستقلة للنشاط</span>
                      <h3 className="text-lg font-bold mt-0.5">{currentActivity.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPrintActivity && (
                        <button
                          onClick={() => setPrintType("financial-report")}
                          className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-white/10"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة التقرير المالي الرسمي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                      <div className="text-xs text-slate-400 font-medium">إجمالي المداخيل والمساهمات</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">
                        +{currentFinances.totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        من أصل {currentFinances.totalExpected.toLocaleString()} د.م متوقعة
                      </div>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                      <div className="text-xs text-slate-400 font-medium">إجمالي المصاريف المؤداة</div>
                      <div className="text-2xl font-bold text-rose-400 mt-1">
                        -{currentFinances.totalSpent.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        موزعة على {currentExpenses.length} بنود مصاريف
                      </div>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                      <div className="text-xs text-slate-400 font-medium">النتيجة الصافية للنشاط</div>
                      <div className={`text-2xl font-bold mt-1 ${currentFinances.netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {currentFinances.netBalance >= 0 ? `+${currentFinances.netBalance.toLocaleString()}` : currentFinances.netBalance.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {currentFinances.netBalance > 0 ? "فائض مالي يُحول لمالية الجمعية" : currentFinances.netBalance < 0 ? "عجز مالي يغطى من الجمعية" : "ميزانية متوازنة تماماً"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Association Accounting Automatic Sync Box */}
                <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-emerald-950 text-sm">الربط المالي التلقائي مع المحاسبة والمالية الجمعوية</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/90 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            ربط تلقائي فوري مفعّل
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed max-w-2xl">
                          يتم احتساب وربط صافي هذا النشاط ({currentFinances.netBalance >= 0 ? `فائض +${currentFinances.netBalance.toLocaleString()} د.م` : `عجز ${currentFinances.netBalance.toLocaleString()} د.م`}) تلقائياً ومباشرة مع القيود المحاسبية ورصيد الصندوق للجمعية بدون الحاجة لأي تصدير يدوي.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {onNavigateToFinance && (
                        <button
                          onClick={onNavigateToFinance}
                          title="الانتقال إلى المحاسبة والمالية الجمعوية لمعاينة القيود والتقارير"
                          className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>معاينة في المحاسبة</span>
                        </button>
                      )}
                      <button
                        onClick={handleSyncActivityFinance}
                        title="تحديث فوري والتحقق من المزامنة"
                        className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تحقق من المزامنة</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        القيد المالي المباشر: {currentFinances.netBalance > 0 
                          ? `مقيد آلياً كـ [فائض إيرادات أنشطة +${currentFinances.netBalance.toLocaleString()} د.م]`
                          : currentFinances.netBalance < 0 
                          ? `مقيد آلياً كـ [تغطية عجز أنشطة ${Math.abs(currentFinances.netBalance).toLocaleString()} د.م]`
                          : `ميزانية متوازنة ومضبوطة بالكامل (0 د.م)`
                        }
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono">
                      (مساهمات: +{currentFinances.totalCollected.toLocaleString()} د.م | مصاريف: -{currentFinances.totalSpent.toLocaleString()} د.م)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">اختر نشاطاً أو رحلة من القائمة</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              يمكنك الاطلاع على تفاصيل البرنامج، تسجيل المشاركين، تتبع المصاريف، وتصدير الصافي إلى المحاسبة
            </p>
            {canCreateActivity && (
              <button
                onClick={handleOpenAddActivity}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء نشاط جديد الآن</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
