/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ActivityExpenseCategory } from "../../types";
import { DollarSign, X } from "lucide-react";
import { EXPENSE_CATEGORIES } from "./shared";
import { useActivities } from "./ActivitiesContext";

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" />
                <span>{editingExpense ? "تعديل بيان المصروف" : `تسجيل مصروف لـ "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بيان / عنوان المصروف *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثال: كراء حافلة نقل ممتازة سعة 48 مقعداً"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الصنف / الفئة *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ActivityExpenseCategory)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ بالدرهم *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmount || ""}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد أو الشركة</label>
                  <input
                    type="text"
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="مثال: شركة الأطلس للنقل"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة / الوصل</label>
                  <input
                    type="text"
                    value={expReceiptNo}
                    onChange={(e) => setExpReceiptNo(e.target.value)}
                    placeholder="FAC-2026-XXXX"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القائم بالأداء / المسؤول</label>
                <input
                  type="text"
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                  placeholder="أمين المال أو المشرف"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
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
