/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs.
 */
import { Briefcase } from "lucide-react";
import { MONTHS_LIST } from "./shared";
import { useFinance } from "./FinanceContext";
import { Button, FormField, Input, Modal, Select } from "../../ui";
import { formatMoney } from "../../format/money";

export default function SalaryModal() {
  const {
    teachers,
    showSalaryModal,
    setShowSalaryModal,
    editingSalary,
    salaryPersonType,
    setSalaryPersonType,
    salaryPersonId,
    setSalaryPersonId,
    salaryPersonName,
    setSalaryPersonName,
    salaryRoleTitle,
    setSalaryRoleTitle,
    salaryAmount,
    setSalaryAmount,
    salaryMonth,
    setSalaryMonth,
    salaryYear,
    setSalaryYear,
    salaryPaymentDate,
    setSalaryPaymentDate,
    salaryPaymentMethod,
    setSalaryPaymentMethod,
    salaryPaymentSource,
    setSalaryPaymentSource,
    salaryReceiptNo,
    setSalaryReceiptNo,
    salaryStatus,
    setSalaryStatus,
    handleTeacherSelect,
    handleSaveSalary,
  } = useFinance();

  if (!showSalaryModal) return null;
  const close = () => setShowSalaryModal(false);

  return (
    <Modal
      modalId="salary-form"
      size="base"
      icon={<Briefcase className="w-5 h-5" strokeWidth={1.75} />}
      title={editingSalary ? "تعديل سجل التعويض والراتب" : "تسجيل وصرف أجر / راتب جديد"}
      onClose={close}
      onSubmit={handleSaveSalary}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">حفظ أجر المستفيد</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="فئة المستفيد">
          {(id) => (
            <Select id={id} value={salaryPersonType} onChange={(v) => setSalaryPersonType(v as any)}>
              <option value="أستاذ / محفظ">أستاذ / محفظ القرآن</option>
              <option value="إطار إداري">إطار إداري / كاتب</option>
              <option value="عامل / مستخدم">عامل نظافة / صيانة</option>
              <option value="أخرى">أخرى</option>
            </Select>
          )}
        </FormField>

        <FormField label="حالة الصرف">
          {(id) => (
            <Select id={id} value={salaryStatus} onChange={(v) => setSalaryStatus(v as any)}>
              <option value="تم الصرف">تم الصرف والتأدية</option>
              <option value="مستحق (قيد الانتظار)">مستحق (قيد الانتظار)</option>
            </Select>
          )}
        </FormField>
      </div>

      {teachers.length > 0 ? (
        <FormField label="اختر من لائحة الأطر والعاملين المسجلين" hint={<span className="text-caption text-primary-700 font-bold">يتم ملء الصفة والمبلغ تلقائياً</span>}>
          {(id) => (
            <Select
              id={id}
              value={salaryPersonId}
              onChange={(v) => {
                if (v === "custom") {
                  setSalaryPersonId("");
                  setSalaryPersonName("");
                } else {
                  handleTeacherSelect(v);
                }
              }}
            >
              <option value="">-- اختر كادر / عامل من السجل --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.category || "أستاذ"} - {t.roleTitle || t.specialty}) {t.monthlySalary ? `[${formatMoney(t.monthlySalary)}]` : ""}
                </option>
              ))}
              <option value="custom">إدخال يدوي لشخص آخر...</option>
            </Select>
          )}
        </FormField>
      ) : null}

      <FormField label="اسم المستفيد الكامل *">
        {(id) => (
          <Input
            id={id}
            type="text"
            required
            placeholder="مثال: الأستاذ محمد العلوي / السيد علي الحارس..."
            value={salaryPersonName}
            onChange={(e) => setSalaryPersonName(e.target.value)}
          />
        )}
      </FormField>

      <FormField label="الصفة / المسمى الوظيفي">
        {(id) => (
          <Input
            id={id}
            type="text"
            placeholder="مثال: محفظ فصل النور / مسؤول صيانة ونظافة المقر..."
            value={salaryRoleTitle}
            onChange={(e) => setSalaryRoleTitle(e.target.value)}
          />
        )}
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="المبلغ (د.م) *">
          {(id) => (
            <Input id={id} type="number" required min={1} value={salaryAmount} onChange={(e) => setSalaryAmount(Number(e.target.value))} />
          )}
        </FormField>

        <FormField label="الشهر المستحق">
          {(id) => (
            <Select id={id} value={salaryMonth} onChange={(v) => setSalaryMonth(v)}>
              {MONTHS_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="السنة">
          {(id) => <Input id={id} type="number" value={salaryYear} onChange={(e) => setSalaryYear(Number(e.target.value))} />}
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="مصدر الصرف">
          {(id) => (
            <Select id={id} value={salaryPaymentSource} onChange={(v) => setSalaryPaymentSource(v as any)}>
              <option value="الصندوق">الصندوق</option>
              <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
            </Select>
          )}
        </FormField>

        <FormField label="طريقة الدفع">
          {(id) => (
            <Select id={id} value={salaryPaymentMethod} onChange={(v) => setSalaryPaymentMethod(v as any)}>
              <option value="نقداً">نقداً</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="شيك">شيك بنكي</option>
            </Select>
          )}
        </FormField>

        <FormField label="تاريخ الصرف">
          {(id) => <Input id={id} type="date" value={salaryPaymentDate} onChange={(e) => setSalaryPaymentDate(e.target.value)} />}
        </FormField>
      </div>

      <FormField label="رقم وصل / إذن الصرف">
        {(id) => (
          <Input id={id} type="text" placeholder="مثال: SAL-2026-07-12" value={salaryReceiptNo} onChange={(e) => setSalaryReceiptNo(e.target.value)} className="font-mono" />
        )}
      </FormField>
    </Modal>
  );
}
