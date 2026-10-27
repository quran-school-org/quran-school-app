/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Wallet, Building2, Edit3, Trash2, Receipt } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { formatMoney, formatNumber } from "../../format/money";
import { useConfirm, SectionHeader } from "../../ui";

import { formatDateAr } from "../../format/date";

export default function ExpensesSection() {
  const confirm = useConfirm();
  const {
    onDeleteExpense,
    canUpdate,
    canDelete,
    activeSubTab,
    expenseSortKey,
    setExpenseSortKey,
    expenseSortDir,
    setExpenseSortDir,
    handleToggleSort,
    renderSortableHeader,
    openExpenseModal,
    totalExpensesAmount,
    sortedExpenses,
    cashBoxExpenses,
    bankAccountExpenses,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* 3. SECTION: EXPENSES & PURCHASES (قسم المصاريف والمشتريات) */}
      {/* ========================================================================================= */}
      {activeSubTab === "expenses" && (
        <div className="space-y-6">
          {/* Sub-cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface p-5 rounded-2xl border border-line flex items-center justify-between">
              <div>
                <span className="text-small font-bold text-ink-3 block mb-1">مصاريف الصندوق النقدي</span>
                <div className="text-2xl font-bold text-gold-700">
                  {formatNumber(cashBoxExpenses)} <span className="text-small text-ink-3 font-normal">د.م</span>
                </div>
                <span className="text-small text-ink-3 mt-1 block">نفقات المشتريات النقدية الصغرى</span>
              </div>
              <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-gold-800">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-line flex items-center justify-between">
              <div>
                <span className="text-small font-bold text-ink-3 block mb-1">مصاريف الحساب البنكي</span>
                <div className="text-2xl font-bold text-primary-800">
                  {formatNumber(bankAccountExpenses)} <span className="text-small text-ink-3 font-normal">د.م</span>
                </div>
                <span className="text-small text-ink-3 mt-1 block">الفواتير والشيكات البنكية</span>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-800">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-danger-900 to-danger-950 text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-small font-medium text-danger-200 block mb-1">إجمالي نفقات التشغيل</span>
                <div className="text-3xl font-bold text-danger-200">
                  {formatNumber(totalExpensesAmount)} <span className="text-small font-normal">د.م</span>
                </div>
                <span className="text-small text-danger-200/70 mt-1 block">بدون احتساب كتلة الأجور</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-danger-300">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Expenses */}
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <SectionHeader
                level={3}
                size="md"
                icon={<Receipt className="w-5 h-5 text-danger-700" />}
                title="جدول المصاريف والمشتريات والفواتير"
                subtitle="تسجيل الفواتير، التجهيزات، صيانة المقر، ومصاريف الأنشطة مع تحديد المصدر المالي."
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-small">
                <thead className="bg-sand-100 text-ink-2 font-bold border-b border-line">
                  <tr>
                    {renderSortableHeader("بيان النفقة / المشتريات", "title", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("نوع النفقة", "category", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المبلغ", "amount", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المصدر المالي", "source", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("المورد / المتاجر", "supplier", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("رقم الفاتورة", "invoiceNo", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    {renderSortableHeader("التاريخ", "date", expenseSortKey, expenseSortDir, (k) => handleToggleSort(k, expenseSortKey, expenseSortDir, setExpenseSortKey, setExpenseSortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-faint">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-ink-3">
                        لا توجد مصاريف أو فواتير مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-sand-50 transition">
                        <td className="p-3 font-bold text-ink">
                          {exp.title}
                          {exp.notes && <p className="text-caption text-ink-3 font-normal">{exp.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-sand-100 text-ink font-semibold px-2.5 py-1 rounded-full text-caption border border-line">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-danger-700 text-sm">
                          {formatMoney(exp.amount)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-caption font-bold ${
                            exp.source === "حساب الجمعية البنكي" 
                              ? "bg-primary-50 text-primary-800 border border-primary-200" 
                              : "bg-gold-50 text-gold-800 border border-gold-200"
                          }`}>
                            {exp.source}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-ink-2">
                          {exp.supplier || "—"}
                        </td>
                        <td className="p-3 text-ink-3 font-mono text-small">
                          {exp.invoiceNo || "—"}
                        </td>
                        <td className="p-3 text-ink-3">
                          {formatDateAr(exp.date)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openExpenseModal(exp)}
                                className="p-1.5 text-ink-2 hover:text-primary-800 hover:bg-sand-100 rounded-lg transition"
                                title="تعديل" aria-label="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={async () => {
                                  if (await confirm({ message: "هل أنت متأكد من حذف هذه النفقة؟", tone: "danger" })) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1.5 text-ink-3 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition"
                                title="حذف" aria-label="حذف"
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
