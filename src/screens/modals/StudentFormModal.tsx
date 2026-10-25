/**
 * Fenêtre d'inscription / de modification d'un élève (charte « لوحة الكتّاب »).
 * Mêmes champs, mêmes valeurs et même enregistrement qu'auparavant.
 */
import React from "react";
import { Check, ImagePlus, UserRound, X } from "lucide-react";
import type { TajweedLevel } from "../../types";
import { useApp } from "../../app/AppContext";
import { Button, CheckboxRow, FormField, Input, Modal, Select, Textarea, cx } from "../../ui";

const PRESETS = [
  { name: "طالب 1", url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150" },
  { name: "طالب 2", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150" },
  { name: "طالب 3", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
  { name: "طالبة 1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
  { name: "طالبة 2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  { name: "طالبة 3", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150" },
];

export default function StudentFormModal() {
  const {
    classes, setShowStudentModal, editingStudent,
    formFullName, setFormFullName, formPhoto, setFormPhoto, formBirthDate, setFormBirthDate,
    formRegistrationDate, setFormRegistrationDate, formGender, setFormGender, formParentName, setFormParentName,
    formParentPhone, setFormParentPhone, formParentEmail, setFormParentEmail, formDocParentId, setFormDocParentId,
    formDocBirthCert, setFormDocBirthCert, formDocPhotos, setFormDocPhotos, formHizbCount, setFormHizbCount,
    formCurrentSurah, setFormCurrentSurah, formTajweedLevel, setFormTajweedLevel, formNotes, setFormNotes,
    formClassId, setFormClassId, formIsArchived, setFormIsArchived, studentDragActive,
    handleStudentPhotoUpload, handleStudentDrag, handleStudentDrop, handleSaveStudent,
  } = useApp();
  const close = () => setShowStudentModal(false);

  return (
    <Modal
      modalId="student-form"
      size="lg"
      title={editingStudent ? "تعديل ملف الطالب" : "تسجيل طالب جديد في النادي"}
      subtitle={editingStudent ? editingStudent.fullName : "البيانات الشخصية، ولي الأمر، الحفظ والوثائق الإدارية."}
      onClose={close}
      onSubmit={handleSaveStudent}
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">{editingStudent ? "حفظ التعديلات" : "إتمام التسجيل والبدء"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset className="m-0 p-4 rounded-xl border border-line bg-surface-2 flex flex-col gap-3">
          <legend className="px-1 text-[14px] font-semibold text-ink">صورة الطالب الشخصية</legend>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-[72px] h-[72px] rounded-full border-2 border-gold overflow-hidden shrink-0 bg-sunken flex items-center justify-center">
              {formPhoto ? <img src={formPhoto} alt="معاينة صورة الطالب" className="w-full h-full object-cover" /> : <UserRound className="w-8 h-8 text-ink-3" strokeWidth={1.5} aria-hidden="true" />}
            </div>
            {formPhoto && (
              <Button size="xs" variant="danger" onClick={() => setFormPhoto("")} icon={<X className="w-3.5 h-3.5" />}>إزالة الصورة</Button>
            )}
            <div className="flex-1 w-full flex flex-col gap-2">
              <div
                onDragEnter={handleStudentDrag}
                onDragOver={handleStudentDrag}
                onDragLeave={handleStudentDrag}
                onDrop={handleStudentDrop}
                className={cx("border-[1.5px] border-dashed rounded-xl p-3 text-center transition-colors", studentDragActive ? "border-primary bg-primary-50" : "border-[#CFD2C4] bg-white hover:border-ink-4")}
              >
                <input type="file" id="student-photo-upload" accept="image/*" onChange={handleStudentPhotoUpload} className="sr-only" />
                <label htmlFor="student-photo-upload" className="cursor-pointer flex flex-col items-center gap-1 min-h-11 justify-center">
                  <span className="flex items-center gap-2 font-semibold text-[14px] text-ink"><ImagePlus className="w-4 h-4 text-primary" strokeWidth={1.75} aria-hidden="true" />اسحب صورة هنا أو انقر لاختيارها</span>
                  <span className="text-[12.5px] text-ink-3">JPG، PNG (الحد الأقصى 2 ميغابايت)</span>
                </label>
              </div>
              <Input type="url" dir="ltr" aria-label="رابط صورة مباشر" value={formPhoto} onChange={(e: any) => setFormPhoto(e.target.value)} placeholder="أو ألصق رابط صورة مباشر هنا (URL)..." className="text-[13px]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-ink-2">أو اختر من الرمزيات المسبقة للأطفال بالنادي</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const on = formPhoto === preset.url;
                return (
                  <button
                    type="button"
                    key={preset.url}
                    onClick={() => setFormPhoto(preset.url)}
                    aria-pressed={on}
                    title={preset.name}
                    aria-label={preset.name}
                    className={cx("w-11 h-11 rounded-full overflow-hidden border-2 relative cursor-pointer transition-transform hover:scale-105", on ? "border-gold" : "border-line")}
                  >
                    <img src={preset.url} alt="" className="w-full h-full object-cover" />
                    {on && <span className="absolute inset-0 bg-night/45 flex items-center justify-center"><Check className="w-4 h-4 text-white" strokeWidth={2} aria-hidden="true" /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="الإسم الكامل للطالب">{(id) => <Input id={id} type="text" required value={formFullName} onChange={(e: any) => setFormFullName(e.target.value)} placeholder="مثال: يوسف الإدريسي" />}</FormField>
          <FormField label="تاريخ ازدياد الطالب">{(id) => <Input id={id} type="date" required value={formBirthDate} onChange={(e: any) => setFormBirthDate(e.target.value)} />}</FormField>
          <FormField label="تاريخ التسجيل بالنادي">{(id) => <Input id={id} type="date" required value={formRegistrationDate} onChange={(e: any) => setFormRegistrationDate(e.target.value)} />}</FormField>
          <FormField label="الجنس">
            {(id) => (
              <Select id={id} value={formGender} onChange={(v) => setFormGender(v as "ذكر" | "أنثى")}>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </Select>
            )}
          </FormField>
          <FormField label="الإسم الكامل لولي الأمر">{(id) => <Input id={id} type="text" required value={formParentName} onChange={(e: any) => setFormParentName(e.target.value)} placeholder="مثال: محمد الإدريسي" />}</FormField>
          <FormField label="رقم هاتف ولي الأمر" hint="للتواصل السريع والواتساب.">{(id) => <Input id={id} type="tel" dir="ltr" required value={formParentPhone} onChange={(e: any) => setFormParentPhone(e.target.value)} placeholder="0612345678" className="text-end" />}</FormField>
          <FormField label="البريد الإلكتروني لولي الأمر">{(id) => <Input id={id} type="email" dir="ltr" value={formParentEmail} onChange={(e: any) => setFormParentEmail(e.target.value)} placeholder="example@gmail.com" className="text-end" />}</FormField>
          <FormField label="الفصل الدراسي / الحلقة">
            {(id) => (
              <Select id={id} value={formClassId} onChange={(v) => setFormClassId(v)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="عدد الأحزاب المحفوظة (من 1 إلى 60)">{(id) => <Input id={id} type="number" min={1} max={60} required value={formHizbCount} onChange={(e: any) => setFormHizbCount(Number(e.target.value))} />}</FormField>
          <FormField label="مستوى التجويد الحالي">
            {(id) => (
              <Select id={id} value={formTajweedLevel} onChange={(v) => setFormTajweedLevel(v as TajweedLevel)}>
                <option value="ممتاز">ممتاز</option>
                <option value="متوسط">متوسط</option>
                <option value="ضعيف">ضعيف</option>
              </Select>
            )}
          </FormField>
          <FormField label="السورة أو ربع الحزب الحالي" className="md:col-span-2">{(id) => <Input id={id} type="text" value={formCurrentSurah} onChange={(e: any) => setFormCurrentSurah(e.target.value)} placeholder="مثال: سورة الملك ربع الأخير" />}</FormField>
        </div>

        <fieldset className="m-0 p-0 border-0 border-t border-line-soft pt-4 flex flex-col gap-2">
          <legend className="text-[14px] font-semibold text-ink mb-2">الأوراق والمستندات الإدارية المتوفرة</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <CheckboxRow checked={formDocParentId} onChange={setFormDocParentId}>فوتوكوبي بطاقة ولي الأمر</CheckboxRow>
            <CheckboxRow checked={formDocBirthCert} onChange={setFormDocBirthCert}>عقد ازدياد الطالب</CheckboxRow>
            <CheckboxRow checked={formDocPhotos} onChange={setFormDocPhotos}>صورتان شمسيتان للطالب</CheckboxRow>
          </div>
        </fieldset>

        <FormField label="ملاحظات توجيهية إضافية">{(id) => <Textarea id={id} rows={3} value={formNotes} onChange={(e: any) => setFormNotes(e.target.value)} placeholder="مستوى الذكاء، سرعة الحفظ، الالتزام بالآداب الإسلامية..." className="resize-none" />}</FormField>

        <div className="p-4 rounded-xl border border-line bg-surface-2 flex flex-col gap-2">
          <p className="m-0 text-[14px] font-semibold text-ink">حالة الطالب بالنادي (نشط / مؤرشف)</p>
          <CheckboxRow checked={formIsArchived} onChange={setFormIsArchived}>أرشفة هذا الطالب (تغيير حالته إلى غير نشط)</CheckboxRow>
          <p className="m-0 text-[12.5px] text-ink-3">الطالب المؤرشف لن يظهر في القائمة الافتراضية للطلاب النشطين، ولن يطالب بسداد الرسوم الجديدة.</p>
        </div>
      </div>
    </Modal>
  );
}
