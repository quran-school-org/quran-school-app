/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Receipt } from "lucide-react";
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
            <div className="bg-gradient-to-r from-danger-900 to-sand-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-danger-300" />
                <span>{editingExpense ? "تعديل سجل النفقة" : "تسجيل نفقة أو فاتورة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-[13px] text-ink-2 overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">بيان النفقة / المشتريات *</label>
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
                  <label className="block font-bold mb-1">نوع / فئة النفقة</label>
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
                  <label className="block font-bold mb-1">المبلغ (د.م) *</label>
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
                  <label className="block font-bold mb-1">المصدر المالي</label>
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
                  <label className="block font-bold mb-1">تاريخ النفقة</label>
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
                  <label className="block font-bold mb-1">اسم المورد / الشركات</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة الكهرباء / مكتبة النجاح"
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الفاتورة / الوصل</label>
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
                <label className="block font-bold mb-1">ملاحظات توضيحية</label>
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
