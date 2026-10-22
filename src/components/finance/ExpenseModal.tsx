/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Receipt, X } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function ExpenseModal() {
  const {
    showExpenseModal,
    setShowExpenseModal,
    editingExpense,
    expenseTitle,
    setExpenseTitle,
    expenseCategory,
    setExpenseCategory,
    expenseAmount,
    setExpenseAmount,
    expenseDate,
    setExpenseDate,
    expenseSource,
    setExpenseSource,
    expenseInvoiceNo,
    setExpenseInvoiceNo,
    expenseSupplier,
    setExpenseSupplier,
    expenseNotes,
    setExpenseNotes,
    handleSaveExpense,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* MODAL 3: ADD / EDIT EXPENSE */}
      {/* ========================================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
          <div className="bg-surface border border-line w-full max-w-md overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col rounded-3xl shadow-pop">
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-line-soft shrink-0">
              <h3 className="m-0 font-display font-semibold text-[20px] text-primary flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gold-700" strokeWidth={1.75} aria-hidden="true" />
                <span>{editingExpense ? "تعديل سجل النفقة" : "تسجيل نفقة أو فاتورة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                type="button"
                aria-label="إغلاق"
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-line bg-white text-ink-2 hover:border-primary hover:text-primary cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-[13px] text-ink-2 overflow-y-auto">
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">بيان النفقة / المشتريات *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة الكهرباء / شراء جوائز وختم الأحزاب / أدوات مكتبية..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نوع / فئة النفقة</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    <option value="فواتير وخدمات">فواتير وخدمات (ماء، كهرباء...)</option>
                    <option value="مشتريات وتجهيزات">مشتريات وتجهيزات مكتبية</option>
                    <option value="أنشطة وحفلات">أنشطة وحفلات وجوائز</option>
                    <option value="صيانة وإصلاحات">صيانة وإصلاح المقر</option>
                    <option value="ضيافة وتنقل">ضيافة وتنقلات</option>
                    <option value="أخرى">مصاريف أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المبلغ (د.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المصدر المالي</label>
                  <select
                    value={expenseSource}
                    onChange={(e) => setExpenseSource(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    <option value="الصندوق">الصندوق النقدي</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ النفقة</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المورد / الشركات</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة الكهرباء / مكتبة النجاح"
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الفاتورة / الوصل</label>
                  <input
                    type="text"
                    placeholder="مثال: INV-2026-102"
                    value={expenseInvoiceNo}
                    onChange={(e) => setExpenseInvoiceNo(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملاحظات توضيحية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول سبب وسياق هذه النفقة..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-danger-800 hover:bg-danger-900 text-white font-bold shadow-md transition"
                >
                  حفظ النفقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
