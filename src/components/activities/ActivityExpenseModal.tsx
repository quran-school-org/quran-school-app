/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ActivityExpenseCategory } from "../../types";
import { DollarSign, X } from "lucide-react";
import { EXPENSE_CATEGORIES } from "./shared";
import { useActivities } from "./ActivitiesContext";
import { Select } from "../../ui";

export default function ActivityExpenseModal() {
  const {
    showExpenseModal,
    setShowExpenseModal,
    editingExpense,
    expTitle,
    setExpTitle,
    expCategory,
    setExpCategory,
    expAmount,
    setExpAmount,
    expDate,
    setExpDate,
    expPaymentMethod,
    setExpPaymentMethod,
    expPaidBy,
    setExpPaidBy,
    expReceiptNo,
    setExpReceiptNo,
    expSupplier,
    setExpSupplier,
    currentActivity,
    handleSaveExpenseForm,
  } = useActivities();

  return (
    <>
      {/* MODAL 3: Create / Edit Expense */}
      {showExpenseModal && currentActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden bg-night/55 backdrop-blur-[2px]">
          <div className="bg-surface border border-line max-w-lg w-full overflow-hidden my-8 rounded-3xl shadow-pop">
            <div className="p-5 border-b border-line-soft bg-sand-50 flex items-center justify-between">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-danger-600" />
                <span>{editingExpense ? "تعديل بيان المصروف" : `تسجيل مصروف لـ "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-ink-3 hover:text-ink-2 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">بيان / عنوان المصروف *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثال: كراء حافلة نقل ممتازة سعة 48 مقعداً"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الصنف / الفئة *</label>
                  <Select
                    aria-label="الصنف / الفئة"
                    value={expCategory}
                    onChange={(v) => setExpCategory(v as ActivityExpenseCategory)}
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المبلغ بالدرهم *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmount || ""}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">طريقة الدفع</label>
                  <Select
                    aria-label="طريقة الدفع"
                    value={expPaymentMethod}
                    onChange={(v) => setExpPaymentMethod(v as any)}
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المورد أو الشركة</label>
                  <input
                    type="text"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="مثال: شركة الأطلس للنقل"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الفاتورة / الوصل</label>
                  <input
                    type="text"
                    value={expReceiptNo}
                    onChange={(e) => setExpReceiptNo(e.target.value)}
                    placeholder="FAC-2026-XXXX"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">القائم بالأداء / المسؤول</label>
                <input
                  type="text"
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                  placeholder="أمين المال أو المشرف"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 text-[13px] font-semibold text-ink-2 hover:text-ink"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-danger-700 hover:bg-danger-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  {editingExpense ? "حفظ التعديلات" : "تسجيل المصروف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
