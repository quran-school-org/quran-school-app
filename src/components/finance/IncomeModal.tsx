/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Coins } from "lucide-react";
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
            <div className="bg-night p-5 text-night-text flex justify-between items-center shrink-0 border-b border-night-line">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold-300" />
                <span>{editingIncome ? "تعديل سجل دخل / تبرع" : "تسجيل دخل أو تبرع جديد"}</span>
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 space-y-4 text-[13px] text-ink-2 overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">بيان / عنوان الدخل *</label>
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
                  <label className="block font-bold mb-1">نوع الدخل</label>
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
                  <label className="block font-bold mb-1">المبلغ (بالدرهم) *</label>
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
                  <label className="block font-bold mb-1">مكان الإيداع / المصدر</label>
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
                  <label className="block font-bold mb-1">تاريخ الاستلام</label>
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
                  <label className="block font-bold mb-1">اسم المتبرع / الجهة</label>
                  <input
                    type="text"
                    placeholder="اختياري (مثال: المحسن حاج إبراهيم)"
                    value={incomeDonorName}
                    onChange={(e) => setIncomeDonorName(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الإيصال</label>
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
                <label className="block font-bold mb-1">ملاحظات إضافية</label>
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
