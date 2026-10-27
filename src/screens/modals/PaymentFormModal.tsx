/**
 * Fenêtre d'ajout / de modification d'une cotisation mensuelle (charte « لوحة الكتّاب »).
 * Mêmes champs, mêmes valeurs et même enregistrement qu'auparavant.
 */
import { useApp } from "../../app/AppContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";
import { formatMoney } from "../../format/money";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتمبر", "أكتوبر", "نونبر", "دجنبر"];
const YEARS = Array.from({ length: 2099 - 2026 + 1 }, (_, i) => 2026 + i);

export default function PaymentFormModal() {
  const {
    students, setShowPaymentModal, editingPayment, paymentFormStudentId, setPaymentFormStudentId, paymentFormYear,
    paymentFormMonth, paymentFormAmount, setPaymentFormAmount, paymentFormStatus, setPaymentFormStatus, paymentFormDate,
    setPaymentFormDate, paymentFormMethod, setPaymentFormMethod, paymentFormReceiptNo, setPaymentFormReceiptNo,
    paymentFormNotes, setPaymentFormNotes, getSubscriptionAmount, handleFormMonthChange, handleFormYearChange, handleSavePayment,
  } = useApp();
  const close = () => setShowPaymentModal(false);

  return (
    <Modal
      modalId="payment-form"
      size="sm"
      title={editingPayment ? "تعديل تفاصيل دفعة مالية" : "إضافة دفعة مالية جديدة"}
      onClose={close}
      onSubmit={handleSavePayment}
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">حفظ الدفعة</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="الطالب المستهدف">
          {(id) => (
            <Select id={id} required value={paymentFormStudentId} onChange={(v) => setPaymentFormStudentId(v)}>
              <option value="">-- اختر الطالب --</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} (ولي الأمر: {s.parentName})</option>)}
            </Select>
          )}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="السنة المستهدفة">
            {(id) => (
              <Select id={id} value={paymentFormYear} onChange={(v) => handleFormYearChange(Number(v))}>
                {YEARS.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="الشهر المستهدف">
            {(id) => (
              <Select id={id} value={paymentFormMonth} onChange={(v) => handleFormMonthChange(v)}>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            )}
          </FormField>
        </div>
        <FormField label="مبلغ الاشتراك (د.م)" hint={`السعر الافتراضي لهذا الشهر: ${formatMoney(getSubscriptionAmount(paymentFormMonth, paymentFormYear))}`}>
          {(id) => <Input id={id} type="number" required min={0} value={paymentFormAmount} onChange={(e: any) => setPaymentFormAmount(Number(e.target.value))} placeholder="100" className="tabular-nums" />}
        </FormField>
        <FormField label="حالة الدفع" hint={paymentFormStatus === "مدفوع" ? undefined : "يُسجَّل كمستحق معلّق بلا إيصال، ويمكن تسديده لاحقاً من قائمة الرسوم."}>
          {(id) => (
            <Select id={id} value={paymentFormStatus} onChange={(v) => setPaymentFormStatus(v as "مدفوع" | "غير مدفوع")}>
              <option value="مدفوع">مدفوع</option>
              <option value="غير مدفوع">غير مدفوع (مستحق لاحقاً)</option>
            </Select>
          )}
        </FormField>
        {paymentFormStatus === "مدفوع" && (
          <div className="p-4 rounded-xl border border-line bg-surface-2 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="تاريخ الأداء">
                {(id) => <Input id={id} type="date" required value={paymentFormDate} onChange={(e: any) => setPaymentFormDate(e.target.value)} />}
              </FormField>
              <FormField label="طريقة الدفع">
                {(id) => (
                  <Select id={id} value={paymentFormMethod} onChange={(v) => setPaymentFormMethod(v as any)}>
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </Select>
                )}
              </FormField>
            </div>
            <FormField label="رقم الإيصال">
              {(id) => <Input id={id} type="text" dir="ltr" required value={paymentFormReceiptNo} onChange={(e: any) => setPaymentFormReceiptNo(e.target.value)} placeholder="مثال: REC-2026-102" className="text-end" />}
            </FormField>
          </div>
        )}
        <FormField label="ملاحظات إضافية">
          {(id) => <Textarea id={id} rows={2} value={paymentFormNotes} onChange={(e: any) => setPaymentFormNotes(e.target.value)} placeholder="أي ملاحظات حول الدفع أو الرسوم..." className="resize-none" />}
        </FormField>
      </div>
    </Modal>
  );
}
