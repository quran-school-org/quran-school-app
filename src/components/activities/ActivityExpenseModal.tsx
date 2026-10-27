/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs ; « enregistrer » en variante primaire (plus en rouge).
 */
import { ActivityExpenseCategory } from "../../types";
import { DollarSign } from "lucide-react";
import { EXPENSE_CATEGORIES } from "./shared";
import { useActivities } from "./ActivitiesContext";
import { useEffect } from "react";
import { Button, FormField, Input, Modal, Select } from "../../ui";

export default function ActivityExpenseModal() {
  const {
    showExpenseModal,
    setShowExpenseModal,
    editingExpense,
    expTitle,
    setExpTitle,
    expErrors,
    setExpErrors,
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

  // Erreur de saisie : le focus va au champ fautif (le message est lu par le lecteur d'écran).
  useEffect(() => {
    if (expErrors.title || expErrors.amount) document.querySelector<HTMLElement>('[data-modal="activity-expense-form"] [aria-invalid="true"]')?.focus();
  }, [expErrors]);

  if (!showExpenseModal || !currentActivity) return null;
  const close = () => setShowExpenseModal(false);

  return (
    <Modal
      modalId="activity-expense-form"
      size="base"
      printHidden
      icon={<DollarSign className="w-5 h-5" />}
      title={editingExpense ? "تعديل بيان المصروف" : `تسجيل مصروف لـ "${currentActivity.title}"`}
      onClose={close}
      onSubmit={handleSaveExpenseForm}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">{editingExpense ? "حفظ التغييرات" : "إضافة المصروف"}</Button>
        </>
      }
    >
      <FormField label="بيان / عنوان المصروف *" error={expErrors.title}>
        {(id) => (
          <Input id={id} type="text" required aria-invalid={expErrors.title ? true : undefined} value={expTitle} onChange={(e) => { setExpTitle(e.target.value); if (expErrors.title) setExpErrors({ ...expErrors, title: undefined }); }} placeholder="مثال: كراء حافلة نقل ممتازة سعة 48 مقعداً" />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="الصنف / الفئة *">
          {(id) => (
            <Select id={id} value={expCategory} onChange={(v) => setExpCategory(v as ActivityExpenseCategory)}>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="المبلغ (د.م) *" error={expErrors.amount}>
          {(id) => (
            <Input id={id} type="number" min="1" required aria-invalid={expErrors.amount ? true : undefined} value={expAmount || ""} onChange={(e) => { setExpAmount(Number(e.target.value)); if (expErrors.amount) setExpErrors({ ...expErrors, amount: undefined }); }} placeholder="0.00" />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="تاريخ الصرف *">
          {(id) => <Input id={id} type="date" required value={expDate} onChange={(e) => setExpDate(e.target.value)} />}
        </FormField>

        <FormField label="طريقة الدفع">
          {(id) => (
            <Select id={id} value={expPaymentMethod} onChange={(v) => setExpPaymentMethod(v as any)}>
              <option value="نقداً">نقداً</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="شيك">شيك</option>
            </Select>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="المورد أو الشركة">
          {(id) => <Input id={id} type="text" value={expSupplier} onChange={(e) => setExpSupplier(e.target.value)} placeholder="مثال: شركة الأطلس للنقل" />}
        </FormField>

        <FormField label="رقم الفاتورة / الوصل">
          {(id) => <Input id={id} type="text" value={expReceiptNo} onChange={(e) => setExpReceiptNo(e.target.value)} placeholder="FAC-2026-XXXX" className="font-mono" />}
        </FormField>
      </div>

      <FormField label="القائم بالأداء / المسؤول">
        {(id) => <Input id={id} type="text" value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)} placeholder="أمين المال أو المشرف" />}
      </FormField>
    </Modal>
  );
}
