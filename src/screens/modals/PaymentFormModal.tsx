/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Student } from "../../types";
import { X } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function PaymentFormModal() {
  const {
    students,
    setShowPaymentModal,
    editingPayment,
    paymentFormStudentId,
    setPaymentFormStudentId,
    paymentFormYear,
    paymentFormMonth,
    paymentFormAmount,
    setPaymentFormAmount,
    paymentFormStatus,
    setPaymentFormStatus,
    paymentFormDate,
    setPaymentFormDate,
    paymentFormMethod,
    setPaymentFormMethod,
    paymentFormReceiptNo,
    setPaymentFormReceiptNo,
    paymentFormNotes,
    setPaymentFormNotes,
    getSubscriptionAmount,
    handleFormMonthChange,
    handleFormYearChange,
    handleSavePayment,
  } = useApp();

  return (
    <div data-modal="payment-form" className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-sand-100 my-8 max-h-[90vh] flex flex-col">
        <div className="p-4 bg-primary-800 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm">
            {editingPayment ? "تعديل تفاصيل دفعة مالية" : "إضافة دفعة مالية جديدة"}
          </h3>
          <button onClick={() => setShowPaymentModal(false)} className="text-white hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs overflow-y-auto">

          {/* Select Student */}
          <div className="space-y-1">
            <label className="block font-bold text-sand-700">الطالب المستهدف:</label>
            <select
              required
              value={paymentFormStudentId}
              onChange={(e) => setPaymentFormStudentId(e.target.value)}
              className="w-full p-2 border border-sand-300 rounded-lg text-xs"
            >
              <option value="">-- اختر الطالب --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} (ولي الأمر: {s.parentName})</option>
              ))}
            </select>
          </div>

          {/* Year & Month Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-sand-700">السنة المستهدفة:</label>
              <select
                value={paymentFormYear}
                onChange={(e) => handleFormYearChange(Number(e.target.value))}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-bold"
              >
                {Array.from({ length: 2099 - 2026 + 1 }, (_, i) => 2026 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-sand-700">الشهر المستهدف:</label>
              <select
                value={paymentFormMonth}
                onChange={(e) => handleFormMonthChange(e.target.value)}
                className="w-full p-2 border border-sand-300 rounded-lg text-xs font-bold"
              >
                <option value="يناير">يناير</option>
                <option value="فبراير">فبراير</option>
                <option value="مارس">مارس</option>
                <option value="أبريل">أبريل</option>
                <option value="ماي">ماي</option>
                <option value="يونيو">يونيو</option>
                <option value="يوليوز">يوليوز</option>
                <option value="غشت">غشت</option>
                <option value="شتمبر">شتمبر</option>
                <option value="أكتوبر">أكتوبر</option>
                <option value="نونبر">نونبر</option>
                <option value="دجنبر">دجنبر</option>
              </select>
            </div>
          </div>

          {/* Amount field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-sand-700">مبلغ الاشتراك (بالدرهم):</label>
              <span className="text-[9px] text-primary-700 font-bold bg-primary-50 px-1.5 py-0.5 rounded">
                السعر الافتراضي لهذا الشهر: {getSubscriptionAmount(paymentFormMonth, paymentFormYear)} درهم
              </span>
            </div>
            <input
              type="number"
              required
              min={0}
              value={paymentFormAmount}
              onChange={(e) => setPaymentFormAmount(Number(e.target.value))}
              placeholder="100"
              className="w-full p-2 border border-sand-300 rounded-lg text-xs font-mono font-bold"
            />
          </div>

          {/* Status Select */}
          <div className="space-y-1">
            <label className="block font-bold text-sand-700">حالة الدفع:</label>
            <select
              value={paymentFormStatus}
              onChange={(e) => setPaymentFormStatus(e.target.value as "مدفوع" | "غير مدفوع")}
              className="w-full p-2 border border-sand-300 rounded-lg text-xs font-bold"
            >
              <option value="غير مدفوع">غير مدفوع ❌</option>
              <option value="مدفوع">مدفوع ✅</option>
            </select>
          </div>

          {/* Conditional fields if PAID */}
          {paymentFormStatus === "مدفوع" && (
            <div className="p-3 bg-sand-50 rounded-xl space-y-3 border border-sand-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-sand-600">تاريخ الأداء:</label>
                  <input
                    type="date"
                    required
                    value={paymentFormDate}
                    onChange={(e) => setPaymentFormDate(e.target.value)}
                    className="w-full p-1.5 border border-sand-300 rounded-lg text-[11px] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-sand-600">طريقة الدفع:</label>
                  <select
                    value={paymentFormMethod}
                    onChange={(e) => setPaymentFormMethod(e.target.value as any)}
                    className="w-full p-1.5 border border-sand-300 rounded-lg text-[11px] font-bold"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-sand-600">رقم الإيصال:</label>
                <input
                  type="text"
                  required
                  value={paymentFormReceiptNo}
                  onChange={(e) => setPaymentFormReceiptNo(e.target.value)}
                  placeholder="مثال: REC-2026-102"
                  className="w-full p-1.5 border border-sand-300 rounded-lg text-[11px] font-mono font-bold"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="block font-bold text-sand-700">ملاحظات إضافية:</label>
            <textarea
              value={paymentFormNotes}
              onChange={(e) => setPaymentFormNotes(e.target.value)}
              placeholder="أي ملاحظات حول الدفع أو الرسوم..."
              className="w-full p-2 border border-sand-300 rounded-lg text-xs h-16 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-1.5 bg-sand-100 hover:bg-sand-200 rounded-lg text-sand-700 font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-lg transition"
            >
              حفظ السجل
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
