/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs.
 */
import { ActivityType, ActivityStatus } from "../../types";
import { useId } from "react";
import { Compass } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, TARGET_AUDIENCE_PRESETS } from "./shared";
import { useActivities } from "./ActivitiesContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";

export default function ActivityFormModal() {
  const {
    teachers,
    showActivityModal,
    setShowActivityModal,
    editingActivity,
    formTitle,
    setFormTitle,
    formType,
    setFormType,
    formStartDate,
    setFormStartDate,
    formEndDate,
    setFormEndDate,
    formLocation,
    setFormLocation,
    formLeaderIds,
    setFormLeaderIds,
    formContributionFee,
    setFormContributionFee,
    formMaxCapacity,
    setFormMaxCapacity,
    formStatus,
    setFormStatus,
    formTargetAudience,
    setFormTargetAudience,
    formDescription,
    setFormDescription,
    formProgramDetails,
    setFormProgramDetails,
    formMeetingPoint,
    setFormMeetingPoint,
    handleSaveActivityForm,
  } = useActivities();

  const leadersLabelId = useId();
  if (!showActivityModal) return null;
  const close = () => setShowActivityModal(false);

  return (
    <Modal
      modalId="activity-form"
      size="md"
      printHidden
      icon={<Compass className="w-5 h-5" />}
      title={editingActivity ? "تعديل بيانات النشاط/الرحلة" : "إنشاء نشاط أو رحلة جديدة"}
      onClose={close}
      onSubmit={handleSaveActivityForm}
      bodyClassName="space-y-4"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">{editingActivity ? "حفظ التعديلات" : "إنشاء النشاط"}</Button>
        </>
      }
    >
      <FormField label="اسم / عنوان النشاط أو الرحلة *">
        {(id) => (
          <Input
            id={id}
            type="text"
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="مثال: رحلة استكشافية إلى شلالات أوزود ومغارة سيدي مجبر"
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="نوع النشاط *">
          {(id) => (
            <Select id={id} value={formType} onChange={(v) => setFormType(v as ActivityType)}>
              {ACTIVITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="حالة النشاط *">
          {(id) => (
            <Select id={id} value={formStatus} onChange={(v) => setFormStatus(v as ActivityStatus)}>
              {ACTIVITY_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="تاريخ البداية / الانطلاق *">
          {(id) => <Input id={id} type="date" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />}
        </FormField>

        <FormField label="تاريخ النهاية / العودة (اختياري)">
          {(id) => <Input id={id} type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="المكان أو الوجهة *">
          {(id) => (
            <Input id={id} type="text" required value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="مثال: شلالات أوزود - إقليم أزيلال" />
          )}
        </FormField>

        <FormField label="نقطة وساعة التجمع والانطلاق">
          {(id) => (
            <Input id={id} type="text" value={formMeetingPoint} onChange={(e) => setFormMeetingPoint(e.target.value)} placeholder="مثال: مقر الجمعية الرئيسي (الساعة 07:00 صباحاً)" />
          )}
        </FormField>
      </div>

      {/* Target Audience Field */}
      <FormField label="الفئة المستهدفة *">
        {(id) => (
          <div className="space-y-1.5">
            <Input
              id={id}
              type="text"
              list="form-target-audience-list"
              required
              value={formTargetAudience}
              onChange={(e) => setFormTargetAudience(e.target.value)}
              placeholder="اختر من القائمة أو اكتب الفئة المستهدفة يدوياً (مثال: الطالبات فقط، أمهات الطالبات...)"
            />
            <datalist id="form-target-audience-list">
              {TARGET_AUDIENCE_PRESETS.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>

            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[11.5px] text-ink-3 font-medium ml-1">خيارات سريعة:</span>
              {["الطالبات فقط", "الطلاب فقط", "الجميع (طلاب، أطر، أولياء أمور)", "الكوادر والمدرسين فقط", "أولياء الأمور"].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFormTargetAudience(tag)}
                  className={`text-[11.5px] px-2 py-0.5 rounded-lg border transition ${
                    formTargetAudience === tag
                      ? "bg-primary-600 text-white border-primary-600 font-bold"
                      : "bg-sand-100 text-ink-2 hover:bg-primary-50 hover:text-primary-800 border-line"
                  }`}
                >
                  {tag === "الجميع (طلاب، أطر، أولياء أمور)" ? "الجميع" : tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="مبلغ المساهمة الرمزية للشخص (د.م)">
          {(id) => <Input id={id} type="number" min="0" value={formContributionFee} onChange={(e) => setFormContributionFee(Number(e.target.value))} />}
        </FormField>

        <FormField label="الطاقة الاستيعابية القصوى (عدد المقاعد)">
          {(id) => (
            <Input id={id} type="number" min="1" value={formMaxCapacity} onChange={(e) => setFormMaxCapacity(Number(e.target.value))} placeholder="مثال: 45 مقعداً" />
          )}
        </FormField>
      </div>

      <div role="group" aria-labelledby={leadersLabelId} className="flex flex-col gap-1.5">
        <span id={leadersLabelId} className="text-[13.5px] font-semibold text-ink-2">المؤطرون والمشرفون المعتمدون</span>
        <div className="border border-line rounded-xl p-3 bg-sand-50 max-h-32 overflow-y-auto space-y-1.5">
          {teachers.map(t => {
            const isChecked = formLeaderIds.includes(t.id);
            return (
              <label key={t.id} className="flex items-center gap-2 text-[13px] text-ink-2 cursor-pointer hover:text-ink">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormLeaderIds([...formLeaderIds, t.id]);
                    } else {
                      setFormLeaderIds(formLeaderIds.filter(id => id !== t.id));
                    }
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>{t.fullName}</span>
                <span className="text-[11.5px] text-ink-3">({t.category || t.specialty || "مؤطر"})</span>
              </label>
            );
          })}
        </div>
      </div>

      <FormField label="أهداف النشاط والوصف">
        {(id) => (
          <Textarea id={id} rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="وصف مختصر للنشاط وأهدافه التربوية والترفيهية..." />
        )}
      </FormField>

      <FormField label="البرنامج الزمني والتفصيلي">
        {(id) => (
          <Textarea id={id} rows={3} value={formProgramDetails} onChange={(e) => setFormProgramDetails(e.target.value)} placeholder="تفاصيل المحطات، الوجبات، الأنشطة والمسابقات وساعة العودة..." />
        )}
      </FormField>
    </Modal>
  );
}
