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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-300" />
                <span>{editingIncome ? "تعديل سجل دخل / تبرع" : "تسجيل دخل أو تبرع جديد"}</span>
              </h3>
              <button
                onClick={() => setShowIncomeModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto">
              <div>
                <label className="block font-bold mb-1">بيان / عنوان الدخل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تبرع كريم لشراء مصاحف / دعم مجلس الجماعة..."
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نوع الدخل</label>
                  <select
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">مكان الإيداع / المصدر</label>
                  <select
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الإيصال</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-2026-05"
                    value={incomeReceiptNo}
                    onChange={(e) => setIncomeReceiptNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md transition"
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
