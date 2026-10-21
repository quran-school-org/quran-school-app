/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Wallet, Building2, Plus, Edit3, Trash2, Receipt } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function ExpensesSection() {
  const {
    expenses,
    onDeleteExpense,
    canCreate,
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">مصاريف الصندوق النقدي</span>
                <div className="text-2xl font-extrabold text-amber-700">
                  {cashBoxExpenses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">نفقات المشتريات النقدية الصغرى</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">مصاريف الحساب البنكي</span>
                <div className="text-2xl font-extrabold text-blue-800">
                  {bankAccountExpenses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">الفواتير والشيكات البنكية</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-800">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-rose-200 block mb-1">إجمالي نفقات التشغيل</span>
                <div className="text-3xl font-black text-rose-200">
                  {totalExpensesAmount.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-rose-200/70 mt-1 block">بدون احتساب كتلة الأجور</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-300">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Expenses */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-700" />
                  <span>جدول المصاريف والمشتريات والفواتير</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تسجيل الفواتير، التجهيزات، صيانة المقر، ومصاريف الأنشطة مع تحديد المصدر المالي.
                </p>
              </div>

              {canCreate && (
                <button
                  data-action="open-expense-form"
                  onClick={() => openExpenseModal()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل فاتورة / نفقة جديدة</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        لا توجد مصاريف أو فواتير مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {exp.title}
                          {exp.notes && <p className="text-[10px] text-slate-400 font-normal">{exp.notes}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-black text-rose-700 text-sm">
                          {exp.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            exp.source === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {exp.source}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {exp.supplier || "—"}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {exp.invoiceNo || "—"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {exp.date}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openExpenseModal(exp)}
                                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذه النفقة؟")) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
