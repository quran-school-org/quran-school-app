/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Student } from "../../types";
import { TrendingUp, Plus, Edit3, Trash2, Filter, CheckCircle, AlertTriangle, Coins, CreditCard, Compass, Users, ExternalLink } from "lucide-react";
import { MONTHS_LIST } from "./shared";
import { useFinance } from "./FinanceContext";

export default function RevenuesSection() {
  const {
    students,
    onDeleteOtherIncome,
    onNavigateToActivities,
    canCreate,
    canUpdate,
    canDelete,
    activeSubTab,
    selectedMonthFilter,
    setSelectedMonthFilter,
    selectedIncomeCategory,
    setSelectedIncomeCategory,
    incomeSortKey,
    setIncomeSortKey,
    incomeSortDir,
    setIncomeSortDir,
    studentPaySortKey,
    setStudentPaySortKey,
    studentPaySortDir,
    setStudentPaySortDir,
    handleToggleSort,
    renderSortableHeader,
    openIncomeModal,
    paidStudentPayments,
    totalStudentFeesAmount,
    safeActivities,
    filteredActivityParticipants,
    totalActivityContributions,
    totalActivityExpectedFees,
    filteredOtherIncomes,
    totalOtherIncomeAmount,
    grossTotalIncome,
    sortedOtherIncomes,
    sortedStudentPayments,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* 1. SECTION: REVENUES & INCOME (قسم الإيرادات والمداخيل) */}
      {/* ========================================================================================= */}
      {activeSubTab === "revenues" && (
        <div className="space-y-6">
          {/* Sub-cards summary (4 cards with Activities Contributions included) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">المداخيل الأخرى (تبرعات/دعم)</span>
                <div className="text-xl font-extrabold text-teal-800">
                  {totalOtherIncomeAmount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">عدد السجلات: {filteredOtherIncomes.length} تبرع/دعم</span>
              </div>
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-800">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">واجبات التلاميذ (تلقائي)</span>
                <div className="text-xl font-extrabold text-emerald-800">
                  {totalStudentFeesAmount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">عدد المقبوضات: {paidStudentPayments.length} إيصال</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 block mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  مساهمات الأنشطة والرحلات (تلقائي)
                </span>
                <div className="text-xl font-extrabold text-blue-800">
                  {totalActivityContributions.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-blue-600/80 mt-1 block">
                  من أصل {totalActivityExpectedFees.toLocaleString()} د.م واجبة ({filteredActivityParticipants.filter(p => (Number(p.paidAmount) || 0) > 0).length} مشارك أدى)
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-100/80 rounded-xl flex items-center justify-center text-blue-700">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-200 block mb-1">مجموع الإيرادات الكلي</span>
                <div className="text-2xl font-black text-amber-300">
                  {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-emerald-200/70 mt-1 block">شاملة للرسوم والتبرعات والأنشطة</span>
              </div>
              <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-300">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section A: Other Incomes (Donations, Grants, Support) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-teal-700" />
                  <span>المداخيل الأخرى (تبرعات، دعم مؤسساتي، اشتراكات جمعية)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  سجل التبرعات من المحسنين، المنح والمساعدات، واشتراكات الأعضاء الداعمين.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* فلتر نوع الدخل */}
                <div className="flex items-center gap-2 bg-white border border-slate-300/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <label htmlFor="income-category-filter" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    نوع الدخل:
                  </label>
                  <select
                    id="income-category-filter"
                    value={selectedIncomeCategory}
                    onChange={(e) => setSelectedIncomeCategory(e.target.value)}
                    className="text-xs bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all">جميع أنواع المداخيل</option>
                    <option value="تبرعات">تبرعات</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي/مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                {canCreate && (
                  <button
                    data-action="open-income-form"
                    onClick={() => openIncomeModal()}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دخل / تبرع جديد</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("عنوان الدخل / التبرع", "title", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("نوع الدخل", "category", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("المبلغ", "amount", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("المتبرع / الجهة", "donorName", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("مكان الإيداع", "source", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("تاريخ الاستلام", "date", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    {renderSortableHeader("رقم الإيصال", "receiptNo", incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedOtherIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        لا توجد مداخيل أو تبرعات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    sortedOtherIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {inc.title}
                          {inc.notes && <p className="text-[10px] text-slate-400 font-normal">{inc.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-teal-50 text-teal-800 font-semibold px-2.5 py-1 rounded-full text-[10px] border border-teal-200">
                            {inc.category}
                          </span>
                        </td>
                        <td className="p-3 font-black text-emerald-800 text-sm">
                          {inc.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {inc.donorName || "فاعل خير"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inc.source === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {inc.source}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {inc.date}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {inc.receiptNo || "—"}
                        </td>
                        <td className="p-3">
                          {(canUpdate || canDelete) && (
                            <div className="flex items-center justify-center gap-1">
                              {canUpdate && (
                                <button
                                  onClick={() => openIncomeModal(inc)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا السجل المالي؟")) {
                                      onDeleteOtherIncome(inc.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Activity & Trip Contributions (Synced automatically from Activities Module) */}
          <div className="bg-white rounded-3xl border border-blue-200/80 shadow-sm overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-700" />
                  <span>مساهمات ومداخيل الأنشطة والرحلات (مربوطة ومحصلة تلقائياً)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتم استجلاب واحتساب مساهمات المشاركين في الأنشطة والرحلات بشكل آلي ومباشر وإدراجها ضمن المداخيل الإجمالية.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span>إجمالي المحصل:</span>
                  <span className="font-black text-emerald-700">{totalActivityContributions.toLocaleString()} د.م</span>
                </div>

                {onNavigateToActivities && (
                  <button
                    onClick={onNavigateToActivities}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>إدارة الأنشطة والرحلات</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">النشاط / الرحلة</th>
                    <th className="p-3">اسم المشارك</th>
                    <th className="p-3">الصفة / النوع</th>
                    <th className="p-3">المساهمة الواجبة</th>
                    <th className="p-3">المبلغ المحصل</th>
                    <th className="p-3">المتبقي</th>
                    <th className="p-3">طريقة الأداء</th>
                    <th className="p-3">تاريخ الأداء</th>
                    <th className="p-3 text-center">حالة الأداء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivityParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        لا توجد مساهمات مسجلة للمشاركين في الأنشطة والرحلات حالياً.
                      </td>
                    </tr>
                  ) : (
                    filteredActivityParticipants.map((p) => {
                      const act = safeActivities.find(a => a.id === p.activityId);
                      const requiredFee = Number(p.fee !== undefined && p.fee !== null ? p.fee : (act?.contributionFee ?? 0));
                      const paidAmount = Number(p.paidAmount) || 0;
                      const remaining = Math.max(0, requiredFee - paidAmount);
                      const participantName = p.fullName || (p as any).participantName || "مشارك";
                      const roleDisplay = p.participantType || "مشارك";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{act ? act.title : `نشاط #${p.activityId}`}</span>
                            </span>
                            {act?.startDate && <p className="text-[10px] text-slate-400 font-normal">{act.startDate}</p>}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {participantName}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200">
                              {roleDisplay}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            {p.paymentStatus === "معفى" && requiredFee === 0 ? "معفى (0 د.م)" : `${requiredFee.toLocaleString()} د.م`}
                          </td>
                          <td className="p-3 font-black text-emerald-700">
                            {paidAmount.toLocaleString()} د.م
                          </td>
                          <td className="p-3 font-semibold text-slate-500">
                            {remaining > 0 ? (
                              <span className="text-amber-700 font-bold">{remaining.toLocaleString()} د.م</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {p.paymentDate || "—"}
                          </td>
                          <td className="p-3 text-center">
                            {p.paymentStatus === "معفى" ? (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                                معفى
                              </span>
                            ) : p.paymentStatus === "مدفوع" || (requiredFee > 0 && paidAmount >= requiredFee) ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                مدفوع
                              </span>
                            ) : paidAmount > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                مدفوع جزئياً
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-rose-200">
                                غير مدفوع
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Student Monthly Fees (Synced automatically) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-800" />
                  <span>مداخيل مستحقات وواجبات التلاميذ الشهرية (مربوطة تلقائياً)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتم مزامنة واستجلاب هذه المداخيل تلقائياً من قسم "الرسوم والمدفوعات" فور تسديدها.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700"
                >
                  <option value="all">جميع الشهور</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("الطالب / المكتتب", "studentName", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("الشهر / السنة", "monthYear", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("المبلغ المدفوع", "amount", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("طريقة الأداء", "paymentMethod", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("رقم الإيصال", "receiptNo", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("تاريخ التسديد", "paymentDate", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                    {renderSortableHeader("الحالة", "status", studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStudentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400">
                        لا توجد مداخيل مدفوعة مسجلة للتلاميذ وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedStudentPayments.map((p) => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">
                            {student ? student.fullName : `طالب #${p.studentId}`}
                          </td>
                          <td className="p-3 font-semibold text-slate-600">
                            {p.month} {p.year}
                          </td>
                          <td className="p-3 font-bold text-emerald-800">
                            {p.amount} د.م
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-full text-[11px] border border-slate-200">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">
                            {p.receiptNo || "—"}
                          </td>
                          <td className="p-3 text-slate-500">
                            {p.paymentDate}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              مدفوع ومسجل
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
