/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs ; « enregistrer » en variante primaire (plus en rouge).
 */
import { Receipt } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";

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

  if (!showExpenseModal) return null;
  const close = () => setShowExpenseModal(false);

  return (
    <Modal
      modalId="expense-form"
      size="sm"
      icon={<Receipt className="w-5 h-5" strokeWidth={1.75} />}
      title={editingExpense ? "تعديل سجل النفقة" : "تسجيل نفقة أو فاتورة جديدة"}
      onClose={close}
      onSubmit={handleSaveExpense}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">حفظ النفقة</Button>
        </>
      }
    >
      <FormField label="بيان النفقة / المشتريات *">
        {(id) => (
          <Input
            id={id}
            type="text"
            required
            placeholder="مثال: فاتورة الكهرباء / شراء جوائز وختم الأحزاب / أدوات مكتبية..."
            value={expenseTitle}
            onChange={(e) => setExpenseTitle(e.target.value)}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="نوع / فئة النفقة">
          {(id) => (
            <Select id={id} value={expenseCategory} onChange={(v) => setExpenseCategory(v as any)}>
              <option value="فواتير وخدمات">فواتير وخدمات (ماء، كهرباء...)</option>
              <option value="مشتريات وتجهيزات">مشتريات وتجهيزات مكتبية</option>
              <option value="أنشطة وحفلات">أنشطة وحفلات وجوائز</option>
              <option value="صيانة وإصلاحات">صيانة وإصلاح المقر</option>
              <option value="ضيافة وتنقل">ضيافة وتنقلات</option>
              <option value="أخرى">مصاريف أخرى</option>
            </Select>
          )}
        </FormField>

        <FormField label="المبلغ (د.م) *">
          {(id) => (
            <Input id={id} type="number" required min={1} value={expenseAmount} onChange={(e) => setExpenseAmount(Number(e.target.value))} />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="المصدر المالي">
          {(id) => (
            <Select id={id} value={expenseSource} onChange={(v) => setExpenseSource(v as any)}>
              <option value="الصندوق">الصندوق النقدي</option>
              <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
            </Select>
          )}
        </FormField>

        <FormField label="تاريخ النفقة">
          {(id) => <Input id={id} type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="اسم المورد / الشركات">
          {(id) => (
            <Input id={id} type="text" placeholder="مثال: شركة الكهرباء / مكتبة النجاح" value={expenseSupplier} onChange={(e) => setExpenseSupplier(e.target.value)} />
          )}
        </FormField>

        <FormField label="رقم الفاتورة / الوصل">
          {(id) => (
            <Input id={id} type="text" placeholder="مثال: INV-2026-102" value={expenseInvoiceNo} onChange={(e) => setExpenseInvoiceNo(e.target.value)} className="font-mono" />
          )}
        </FormField>
      </div>

      <FormField label="ملاحظات توضيحية">
        {(id) => (
          <Textarea id={id} rows={2} placeholder="ملاحظات حول سبب وسياق هذه النفقة..." value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} className="resize-none" />
        )}
      </FormField>
    </Modal>
  );
}
