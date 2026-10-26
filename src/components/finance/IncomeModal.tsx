/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs.
 */
import { Coins } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";

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

  if (!showIncomeModal) return null;
  const close = () => setShowIncomeModal(false);

  return (
    <Modal
      modalId="income-form"
      size="sm"
      icon={<Coins className="w-5 h-5" strokeWidth={1.75} />}
      title={editingIncome ? "تعديل سجل دخل / تبرع" : "تسجيل دخل أو تبرع جديد"}
      onClose={close}
      onSubmit={handleSaveIncome}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">حفظ السجل المالي</Button>
        </>
      }
    >
      <FormField label="بيان / عنوان الدخل *">
        {(id) => (
          <Input
            id={id}
            type="text"
            required
            placeholder="مثال: تبرع كريم لشراء مصاحف / دعم مجلس الجماعة..."
            value={incomeTitle}
            onChange={(e) => setIncomeTitle(e.target.value)}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="نوع الدخل">
          {(id) => (
            <Select id={id} value={incomeCategory} onChange={(v) => setIncomeCategory(v as any)}>
              <option value="تبرعات">تبرعات محسنين</option>
              <option value="دعم حكومي/مؤسساتي">دعم حكومي / مؤسساتي</option>
              <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
              <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
              <option value="أخرى">مداخيل أخرى</option>
            </Select>
          )}
        </FormField>

        <FormField label="المبلغ (د.م) *">
          {(id) => (
            <Input id={id} type="number" required min={1} value={incomeAmount} onChange={(e) => setIncomeAmount(Number(e.target.value))} />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="مكان الإيداع / المصدر">
          {(id) => (
            <Select id={id} value={incomeSource} onChange={(v) => setIncomeSource(v as any)}>
              <option value="الصندوق">الصندوق النقدي</option>
              <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
            </Select>
          )}
        </FormField>

        <FormField label="تاريخ الاستلام">
          {(id) => <Input id={id} type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="اسم المتبرع / الجهة">
          {(id) => (
            <Input id={id} type="text" placeholder="اختياري (مثال: المحسن حاج إبراهيم)" value={incomeDonorName} onChange={(e) => setIncomeDonorName(e.target.value)} />
          )}
        </FormField>

        <FormField label="رقم الإيصال">
          {(id) => (
            <Input id={id} type="text" placeholder="مثال: REC-2026-05" value={incomeReceiptNo} onChange={(e) => setIncomeReceiptNo(e.target.value)} className="font-mono" />
          )}
        </FormField>
      </div>

      <FormField label="ملاحظات إضافية">
        {(id) => (
          <Textarea id={id} rows={2} placeholder="ملاحظات توضيحية حول طبيعة المداخيل..." value={incomeNotes} onChange={(e) => setIncomeNotes(e.target.value)} className="resize-none" />
        )}
      </FormField>
    </Modal>
  );
}
