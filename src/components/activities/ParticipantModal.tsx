/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs.
 */
import { ParticipantPaymentStatus } from "../../types";
import { useId } from "react";
import { Users } from "lucide-react";
import { useActivities } from "./ActivitiesContext";
import { Button, FormField, Input, Modal, Select } from "../../ui";

export default function ParticipantModal() {
  const {
    students,
    showParticipantModal,
    setShowParticipantModal,
    editingParticipant,
    partSourceType,
    setPartSourceType,
    selectedStudentRefId,
    setSelectedStudentRefId,
    selectedStaffRefId,
    setSelectedStaffRefId,
    partFullName,
    setPartFullName,
    partCustomRole,
    setPartCustomRole,
    partPhone,
    setPartPhone,
    partGender,
    setPartGender,
    partFee,
    setPartFee,
    partPaidAmount,
    setPartPaidAmount,
    partPaymentStatus,
    setPartPaymentStatus,
    partPaymentMethod,
    setPartPaymentMethod,
    partReceiptNo,
    setPartReceiptNo,
    partMedicalNotes,
    setPartMedicalNotes,
    allStaff,
    currentActivity,
    handleSaveParticipantForm,
  } = useActivities();

  const sourceLabelId = useId();
  if (!showParticipantModal || !currentActivity) return null;
  const close = () => setShowParticipantModal(false);

  const sourceButton = (type: "student" | "staff" | "custom", label: string) => (
    <button
      type="button"
      aria-pressed={partSourceType === type}
      onClick={() => setPartSourceType(type)}
      className={`py-2 text-[13px] font-bold rounded-xl border transition-all ${
        partSourceType === type ? "bg-primary-100 text-primary-800 border-primary-500" : "bg-sand-50 text-ink-2 border-line"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      modalId="participant-form"
      size="base"
      printHidden
      icon={<Users className="w-5 h-5" />}
      title={editingParticipant ? "تعديل بيانات المشارك" : `تسجيل مشارك في "${currentActivity.title}"`}
      onClose={close}
      onSubmit={handleSaveParticipantForm}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">{editingParticipant ? "حفظ التعديلات" : "تأكيد التسجيل"}</Button>
        </>
      }
    >
      <div role="group" aria-labelledby={sourceLabelId} className="flex flex-col gap-1.5">
        <span id={sourceLabelId} className="text-[13.5px] font-semibold text-ink-2">مصدر بيانات المشارك</span>
        <div className="grid grid-cols-3 gap-2">
          {sourceButton("student", "طالب من الجمعية")}
          {sourceButton("staff", "أستاذ / كادر")}
          {sourceButton("custom", "مشارك خارجي")}
        </div>
      </div>

      {partSourceType === "student" && (
        <FormField label="اختر الطالب المسجل بالجمعية *">
          {(id) => (
            <Select
              id={id}
              value={selectedStudentRefId}
              onChange={(v) => {
                setSelectedStudentRefId(v);
                const st = students.find(s => s.id === v);
                if (st) {
                  setPartFullName(st.fullName);
                  setPartPhone(st.parentPhone);
                  setPartGender(st.gender);
                }
              }}
              required
            >
              <option value="">-- اختر طالباً --</option>
              {students.filter(s => !s.isArchived).map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.parentPhone})</option>
              ))}
            </Select>
          )}
        </FormField>
      )}

      {partSourceType === "staff" && (
        <FormField label="اختر الأستاذ / الموظف / الإداري *">
          {(id) => (
            <Select
              id={id}
              value={selectedStaffRefId}
              onChange={(v) => {
                setSelectedStaffRefId(v);
                const st = allStaff.find(t => t.id === v);
                if (st) {
                  setPartFullName(st.fullName);
                  setPartPhone(st.phone);
                  setPartCustomRole(st.roleTitle?.trim() || st.category || st.specialty || "كادر الجمعية");
                }
              }}
              required
            >
              <option value="">-- اختر كادراً أو موظفاً أو أستاذاً --</option>
              {allStaff.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName} — [{t.roleTitle || t.category || t.specialty || "كادر"}]
                </option>
              ))}
            </Select>
          )}
        </FormField>
      )}

      {partSourceType === "custom" && (
        <FormField label="الصفة أو المسمى للمشارك (المسمى الوظيفي / الدور) *">
          {(id) => (
            <div className="space-y-2">
              <Input
                id={id}
                type="text"
                value={partCustomRole}
                onChange={(e) => setPartCustomRole(e.target.value)}
                placeholder="مثال: طالب / محفظ / مؤطر / متطوع / مشارك خارجي..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[12.5px] text-ink-3 font-bold self-center ml-1">اقتراحات سريعة:</span>
                {[
                  "طالب",
                  "محفظ",
                  "مدير المدرسة المسؤول (المدير التنفيذي)",
                  "رئيس الجمعية",
                  "الكاتب العام للجمعية",
                  "أمين مال الجمعية",
                  "مؤطر",
                  "متطوع",
                  "مشارك خارجي"
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPartCustomRole(r)}
                    className={`text-[12.5px] px-2 py-1 rounded-lg border transition-all ${
                      partCustomRole === r
                        ? "bg-primary-600 text-white border-primary-600 font-bold"
                        : "bg-sand-100 hover:bg-sand-200 text-ink-2 border-line"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </FormField>
      )}

      <FormField label="الاسم الكامل للمشارك *">
        {(id) => <Input id={id} type="text" required value={partFullName} onChange={(e) => setPartFullName(e.target.value)} placeholder="الاسم الكامل" />}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="رقم الهاتف للتواصل">
          {(id) => <Input id={id} type="text" value={partPhone} onChange={(e) => setPartPhone(e.target.value)} placeholder="06XXXXXXXX" className="font-mono" />}
        </FormField>

        <FormField label="الجنس">
          {(id) => (
            <Select id={id} value={partGender} onChange={(v) => setPartGender(v as any)}>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </Select>
          )}
        </FormField>
      </div>

      {/* Fee & Payment Section */}
      <div className="bg-sand-50 border border-line rounded-xl p-4 space-y-3">
        <h4 className="font-bold text-[13px] text-ink">بيانات المساهمة والأداء</h4>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="المبلغ المطلوب (د.م)">
            {(id) => <Input id={id} type="number" min="0" value={partFee} onChange={(e) => setPartFee(Number(e.target.value))} />}
          </FormField>

          <FormField label="المبلغ المدفوع (د.م)">
            {(id) => <Input id={id} type="number" min="0" value={partPaidAmount} onChange={(e) => setPartPaidAmount(Number(e.target.value))} />}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="حالة الأداء">
            {(id) => (
              <Select id={id} value={partPaymentStatus} onChange={(v) => setPartPaymentStatus(v as ParticipantPaymentStatus)}>
                <option value="مدفوع">مدفوع بالكامل</option>
                <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                <option value="غير مدفوع">غير مدفوع (مستحق)</option>
                <option value="معفى">معفى من المساهمة</option>
              </Select>
            )}
          </FormField>

          <FormField label="طريقة الدفع">
            {(id) => (
              <Select id={id} value={partPaymentMethod} onChange={(v) => setPartPaymentMethod(v as any)}>
                <option value="نقداً">نقداً</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="شيك">شيك</option>
                <option value="أخرى">أخرى</option>
              </Select>
            )}
          </FormField>
        </div>

        <FormField label="رقم وصل الأداء">
          {(id) => <Input id={id} type="text" value={partReceiptNo} onChange={(e) => setPartReceiptNo(e.target.value)} placeholder="REC-ACT-XXXX" className="font-mono" />}
        </FormField>
      </div>

      <FormField label="ملاحظات صحية أو حساسية خاصة (اختياري)">
        {(id) => <Input id={id} type="text" value={partMedicalNotes} onChange={(e) => setPartMedicalNotes(e.target.value)} placeholder="مثال: حساسية ضد الفول السوداني أو الربو..." />}
      </FormField>
    </Modal>
  );
}
