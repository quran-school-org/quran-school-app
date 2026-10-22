/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Coins, X } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function IncomeModal() {
  const {
    showIncomeModal,
    setShowIncomeModal,
    editingIncome,
    incomeTitle,
    setIncomeTitle,
    incomeCategory,
    setIncomeCategory,
    incomeAmount,
    setIncomeAmount,
    incomeDate,
    setIncomeDate,
    incomeSource,
    setIncomeSource,
    incomeDonorName,
    setIncomeDonorName,
    incomeReceiptNo,
    setIncomeReceiptNo,
    incomeNotes,
    setIncomeNotes,
    handleSaveIncome,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* MODAL 1: ADD / EDIT OTHER INCOME */}
      {/* ========================================================================================= */}
      {showIncomeModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
          <div className="bg-surface border border-line w-full max-w-md overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col rounded-3xl shadow-pop">
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-line-soft shrink-0">
              <h3 className="m-0 font-display font-semibold text-[20px] text-primary flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold-700" strokeWidth={1.75} aria-hidden="true" />
                <span>{editingIncome ? "تعديل سجل دخل / تبرع" : "تسجيل دخل أو تبرع جديد"}</span>
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                type="button"
                aria-label="إغلاق"
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-line bg-white text-ink-2 hover:border-primary hover:text-primary cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 space-y-4 text-[13px] text-ink-2 overflow-y-auto">
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">بيان / عنوان الدخل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تبرع كريم لشراء مصاحف / دعم مجلس الجماعة..."
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نوع الدخل</label>
                  <select
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    <option value="تبرعات">تبرعات محسنين</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي / مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">مداخيل أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المبلغ (بالدرهم) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(Number(e.target.value))}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">مكان الإيداع / المصدر</label>
                  <select
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    <option value="الصندوق">الصندوق النقدي</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ الاستلام</label>
                  <input
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم المتبرع / الجهة</label>
                  <input
                    type="text"
                    placeholder="اختياري (مثال: المحسن حاج إبراهيم)"
                    value={incomeDonorName}
                    onChange={(e) => setIncomeDonorName(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الإيصال</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-2026-05"
                    value={incomeReceiptNo}
                    onChange={(e) => setIncomeReceiptNo(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توضيحية حول طبيعة المداخيل..."
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
                >
                  حفظ السجل المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
