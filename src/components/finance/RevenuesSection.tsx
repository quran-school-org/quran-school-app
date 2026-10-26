/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Plus, Edit3, Trash2, Filter, CheckCircle, AlertTriangle, Coins, CreditCard, Compass, ExternalLink } from "lucide-react";
import { MONTHS_LIST } from "./shared";
import { useFinance } from "./FinanceContext";
import { Select } from "../../ui";
import { formatMoney } from "../../utils/format";

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
          {/* Répartition des recettes en une ligne (UI-19) : le total est celui de l'en-tête de la page. */}
          <dl
            aria-label="توزيع المداخيل"
            data-block="income-breakdown"
            className="m-0 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden"
          >
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-[13px] font-semibold text-ink-2">رسوم التلاميذ</dt>
              <dd className="m-0 text-[20px] font-bold text-primary tabular-nums">{formatMoney(totalStudentFeesAmount)}</dd>
              <dd className="m-0 text-[12.5px] text-ink-3">{paidStudentPayments.length} إيصال</dd>
            </div>
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-[13px] font-semibold text-ink-2">تبرعات ودعم</dt>
              <dd className="m-0 text-[20px] font-bold text-primary tabular-nums">{formatMoney(totalOtherIncomeAmount)}</dd>
              <dd className="m-0 text-[12.5px] text-ink-3">{filteredOtherIncomes.length} سجل</dd>
            </div>
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-[13px] font-semibold text-ink-2">مساهمات الأنشطة والرحلات</dt>
              <dd className="m-0 text-[20px] font-bold text-primary tabular-nums">{formatMoney(totalActivityContributions)}</dd>
              <dd className="m-0 text-[12.5px] text-ink-3">من أصل {formatMoney(totalActivityExpectedFees)} واجبة ({filteredActivityParticipants.filter(p => (Number(p.paidAmount) || 0) > 0).length} مشارك أدى)</dd>
            </div>
          </dl>

          {/* Section A: Other Incomes (Donations, Grants, Support) */}
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary-700" />
                  <span>المداخيل الأخرى (تبرعات، دعم مؤسساتي، اشتراكات جمعية)</span>
                </h3>
                <p className="text-[13px] text-ink-3 mt-0.5">
                  سجل التبرعات من المحسنين، المنح والمساعدات، واشتراكات الأعضاء الداعمين.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* فلتر نوع الدخل */}
                <div className="flex items-center gap-2 bg-white border border-sand-300/80 rounded-xl px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <label htmlFor="income-category-filter" className="text-[13px] font-bold text-ink-2 whitespace-nowrap">
                    نوع الدخل:
                  </label>
                  <Select
                    id="income-category-filter"
                    value={selectedIncomeCategory}
                    onChange={(v) => setSelectedIncomeCategory(v)}
                    variant="bare"
                    size="sm"
                    className="w-auto"
                    triggerClassName="text-[13px] font-bold"
                  >
                    <option value="all">جميع أنواع المداخيل</option>
                    <option value="تبرعات">تبرعات</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي/مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">أخرى</option>
                  </Select>
                </div>

                {canCreate && (
                  <button
                    data-action="open-income-form"
                    onClick={() => openIncomeModal()}
                    className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دخل / تبرع جديد</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-sand-100 text-ink-2 font-bold border-b border-line">
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
                <tbody className="divide-y divide-line-faint">
                  {sortedOtherIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-ink-3">
                        لا توجد مداخيل أو تبرعات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    sortedOtherIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-sand-50 transition">
                        <td className="p-3 font-bold text-ink">
                          {inc.title}
                          {inc.notes && <p className="text-[11.5px] text-ink-3 font-normal">{inc.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-primary-50 text-primary-800 font-semibold px-2.5 py-1 rounded-full text-[11.5px] border border-primary-200">
                            {inc.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-primary-800 text-sm">
                          {formatMoney(inc.amount)}
                        </td>
                        <td className="p-3 font-medium text-ink-2">
                          {inc.donorName || "فاعل خير"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
                            inc.source === "حساب الجمعية البنكي" 
                              ? "bg-primary-50 text-primary-800 border border-primary-200" 
                              : "bg-gold-50 text-gold-800 border border-gold-200"
                          }`}>
                            {inc.source}
                          </span>
                        </td>
                        <td className="p-3 text-ink-3">
                          {inc.date}
                        </td>
                        <td className="p-3 text-ink-3 font-mono text-[12.5px]">
                          {inc.receiptNo || "—"}
                        </td>
                        <td className="p-3">
                          {(canUpdate || canDelete) && (
                            <div className="flex items-center justify-center gap-1">
                              {canUpdate && (
                                <button
                                  onClick={() => openIncomeModal(inc)}
                                  className="p-1.5 text-ink-2 hover:text-primary-800 hover:bg-sand-100 rounded-lg transition"
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
                                  className="p-1.5 text-ink-3 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition"
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
          <div className="bg-surface rounded-3xl border border-primary-200/80 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-primary-50/60 to-primary-50/40 border-b border-primary-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary-700" />
                  <span>مساهمات ومداخيل الأنشطة والرحلات (مربوطة ومحصلة تلقائياً)</span>
                </h3>
                <p className="text-[13px] text-ink-3 mt-0.5">
                  يتم استجلاب واحتساب مساهمات المشاركين في الأنشطة والرحلات بشكل آلي ومباشر وإدراجها ضمن المداخيل الإجمالية.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-primary-100/70 border border-primary-200 px-3 py-1.5 rounded-xl text-[13px] font-bold text-primary-900 flex items-center gap-1.5">
                  <span>إجمالي المحصل:</span>
                  <span className="font-bold text-primary-700">{formatMoney(totalActivityContributions)}</span>
                </div>

                {onNavigateToActivities && (
                  <button
                    onClick={onNavigateToActivities}
                    className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                  >
                    <span>إدارة الأنشطة والرحلات</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-sand-100 text-ink-2 font-bold border-b border-line">
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
                <tbody className="divide-y divide-line-faint">
                  {filteredActivityParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-ink-3">
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
                        <tr key={p.id} className="hover:bg-sand-50 transition">
                          <td className="p-3 font-bold text-ink">
                            <span className="flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                              <span>{act ? act.title : `نشاط #${p.activityId}`}</span>
                            </span>
                            {act?.startDate && <p className="text-[11.5px] text-ink-3 font-normal">{act.startDate}</p>}
                          </td>
                          <td className="p-3 font-bold text-ink">
                            {participantName}
                          </td>
                          <td className="p-3">
                            <span className="bg-sand-100 text-ink-2 px-2 py-0.5 rounded-md text-[11.5px] font-medium border border-line">
                              {roleDisplay}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-ink-2">
                            {p.paymentStatus === "معفى" && requiredFee === 0 ? "معفى (0 د.م)" : `${formatMoney(requiredFee)}`}
                          </td>
                          <td className="p-3 font-bold text-primary-700">
                            {formatMoney(paidAmount)}
                          </td>
                          <td className="p-3 font-semibold text-ink-3">
                            {remaining > 0 ? (
                              <span className="text-gold-700 font-bold">{formatMoney(remaining)}</span>
                            ) : (
                              <span className="text-ink-3">—</span>
                            )}
                          </td>
                          <td className="p-3 text-ink-2">
                            <span className="bg-sand-100 px-2.5 py-1 rounded-full text-[11.5px] border border-line">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-ink-3 font-mono text-[12.5px]">
                            {p.paymentDate || "—"}
                          </td>
                          <td className="p-3 text-center">
                            {p.paymentStatus === "معفى" ? (
                              <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-[11.5px] px-2.5 py-1 rounded-full border border-primary-200">
                                معفى
                              </span>
                            ) : p.paymentStatus === "مدفوع" || (requiredFee > 0 && paidAmount >= requiredFee) ? (
                              <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-[11.5px] px-2.5 py-1 rounded-full border border-primary-200">
                                <CheckCircle className="w-3 h-3" />
                                مدفوع
                              </span>
                            ) : paidAmount > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-gold-100 text-gold-800 font-bold text-[11.5px] px-2.5 py-1 rounded-full border border-gold-200">
                                <AlertTriangle className="w-3 h-3" />
                                مدفوع جزئياً
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-danger-100 text-danger-800 font-bold text-[11.5px] px-2.5 py-1 rounded-full border border-danger-200">
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
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-800" />
                  <span>مداخيل مستحقات وواجبات التلاميذ الشهرية (مربوطة تلقائياً)</span>
                </h3>
                <p className="text-[13px] text-ink-3 mt-0.5">
                  يتم مزامنة واستجلاب هذه المداخيل تلقائياً من قسم "الرسوم والمدفوعات" فور تسديدها.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedMonthFilter}
                  onChange={(v) => setSelectedMonthFilter(v)}
                  aria-label="تصفية حسب الشهر"
                  size="sm"
                  className="w-auto"
                >
                  <option value="all">جميع الشهور</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-sand-100 text-ink-2 font-bold border-b border-line">
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
                <tbody className="divide-y divide-line-faint">
                  {sortedStudentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-ink-3">
                        لا توجد مداخيل مدفوعة مسجلة للتلاميذ وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedStudentPayments.map((p) => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id} className="hover:bg-sand-50 transition">
                          <td className="p-3 font-bold text-ink">
                            {student ? student.fullName : `طالب #${p.studentId}`}
                          </td>
                          <td className="p-3 font-semibold text-ink-2">
                            {p.month} {p.year}
                          </td>
                          <td className="p-3 font-bold text-primary-800">
                            {formatMoney(p.amount)}
                          </td>
                          <td className="p-3 text-ink-2">
                            <span className="bg-sand-100 px-2.5 py-1 rounded-full text-[12.5px] border border-line">
                              {p.paymentMethod || "نقداً"}
                            </span>
                          </td>
                          <td className="p-3 text-ink-3 font-mono text-[12.5px]">
                            {p.receiptNo || "—"}
                          </td>
                          <td className="p-3 text-ink-3">
                            {p.paymentDate}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-[11.5px] px-2.5 py-1 rounded-full">
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
