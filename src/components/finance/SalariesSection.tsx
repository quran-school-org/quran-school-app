/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Edit3, Trash2, CheckCircle, AlertTriangle, Briefcase, RefreshCw } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { formatMoney, formatNumber } from "../../format/money";
import { useConfirm, SectionHeader } from "../../ui";

import { formatDateAr } from "../../format/date";

export default function SalariesSection() {
  const confirm = useConfirm();
  const {
    onDeleteSalaryPayment,
    canCreate,
    canUpdate,
    canDelete,
    activeSubTab,
    salarySortKey,
    setSalarySortKey,
    salarySortDir,
    setSalarySortDir,
    handleToggleSort,
    renderSortableHeader,
    openSalaryModal,
    handleAutoGenerateTeacherSalaries,
    totalPaidSalaries,
    totalPendingSalaries,
    sortedSalaries,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* 2. SECTION: SALARIES & PAYROLL (قسم الأجور والرواتب) */}
      {/* ========================================================================================= */}
      {activeSubTab === "salaries" && (
        <div className="space-y-6">
          {/* Sub-cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface p-5 rounded-2xl border border-line flex items-center justify-between">
              <div>
                <span className="text-small font-bold text-ink-3 block mb-1">إجمالي الرواتب المصروفة</span>
                <div className="text-2xl font-bold text-primary-800">
                  {formatNumber(totalPaidSalaries)} <span className="text-small text-ink-3 font-normal">د.م</span>
                </div>
                <span className="text-small text-primary-600 mt-1 block">تم تحويلها وصرفها بنجاح</span>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-800">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-line flex items-center justify-between">
              <div>
                <span className="text-small font-bold text-ink-3 block mb-1">الرواتب المستحقة (قيد الانتظار)</span>
                <div className="text-2xl font-bold text-gold-700">
                  {formatNumber(totalPendingSalaries)} <span className="text-small text-ink-3 font-normal">د.م</span>
                </div>
                <span className="text-small text-gold-700 mt-1 block">مستحقات واجبة الصرف</span>
              </div>
              <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-gold-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-night to-night-2 text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-small font-medium text-sand-400 block mb-1">مجموع كتلة الأجور والرواتب</span>
                <div className="text-3xl font-bold text-danger-300">
                  {formatNumber(totalPaidSalaries + totalPendingSalaries)} <span className="text-small font-normal">د.م</span>
                </div>
                <span className="text-small text-ink-3 mt-1 block">للأساتذة والأطر والخدمات</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-danger-300">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Salary Payments */}
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <SectionHeader
                level={3}
                size="md"
                icon={<Briefcase className="w-5 h-5 text-primary-800" />}
                title="سجل مستحقات ورواتب الأساتذة، الأطر والعاملين"
                subtitle="تسجيل وإدارة التعويضات الشهرية للمحفظين، الأطر الإدارية وعمال الصيانة والنظافة."
              />

              <div className="flex flex-wrap items-center gap-2">
                {canCreate && (
                  <button
                    onClick={handleAutoGenerateTeacherSalaries}
                    className="bg-gold-100 hover:bg-gold-200 text-gold-900 font-bold px-3.5 py-2 rounded-xl text-small transition flex items-center gap-1.5 border border-gold-300"
                    title="توليد مستحقات جميع الأساتذة لشهر محدد تلقائياً"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>توليد مستحقات الأساتذة تلقائياً</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-small">
                <thead className="bg-sand-100 text-ink-2 font-bold border-b border-line">
                  <tr>
                    {renderSortableHeader("اسم المستفيد", "personName", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الفئة والصفة", "personType", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الشهر / السنة", "monthYear", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("المبلغ (د.م)", "amount", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("مصدر الصرف", "paymentSource", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("طريقة الصرف", "paymentMethod", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("تاريخ الصرف", "paymentDate", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الحالة", "status", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-faint">
                  {sortedSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-ink-3">
                        لا توجد سجلات رواتب مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedSalaries.map((s) => (
                      <tr key={s.id} className="hover:bg-sand-50 transition">
                        <td className="p-3 font-bold text-ink">
                          {s.personName}
                          {s.receiptNo && <p className="text-caption text-ink-3 font-mono font-normal">وصل: {s.receiptNo}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-sand-100 text-ink-2 font-medium px-2.5 py-1 rounded-full text-caption border border-line">
                            {s.personType} {s.roleTitle ? `— ${s.roleTitle}` : ""}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-ink-2">
                          {s.month} {s.year}
                        </td>
                        <td className="p-3 font-bold text-ink text-sm">
                          {formatMoney(s.amount)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-caption font-bold ${
                            s.paymentSource === "حساب الجمعية البنكي" 
                              ? "bg-primary-50 text-primary-800 border border-primary-200" 
                              : "bg-gold-50 text-gold-800 border border-gold-200"
                          }`}>
                            {s.paymentSource}
                          </span>
                        </td>
                        <td className="p-3 text-ink-2">
                          {s.paymentMethod}
                        </td>
                        <td className="p-3 text-ink-3">
                          {formatDateAr(s.paymentDate)}
                        </td>
                        <td className="p-3">
                          {s.status === "تم الصرف" ? (
                            <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-caption px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              تم الصرف
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gold-100 text-gold-800 font-bold text-caption px-2.5 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              قيد الانتظار
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openSalaryModal(s)}
                                className="p-1.5 text-ink-2 hover:text-primary-800 hover:bg-sand-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={async () => {
                                  if (await confirm({ message: "هل أنت متأكد من حذف هذا السجل؟", tone: "danger" })) {
                                    onDeleteSalaryPayment(s.id);
                                  }
                                }}
                                className="p-1.5 text-ink-3 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
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
