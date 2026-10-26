/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu,
 * étiquettes reliées aux champs.
 */
import { StaffCategory, ContractType } from "../../types";
import { useId } from "react";
import { UserPlus, X, Sparkles } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG, DEFAULT_STAFF_ICON } from "./shared";
import { useStaff } from "./StaffContext";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../ui";

export default function StaffFormModal() {
  const {
    classes,
    showModal,
    setShowModal,
    editingTeacher,
    formCategory,
    setFormCategory,
    formFullName,
    setFormFullName,
    formRoleTitle,
    setFormRoleTitle,
    formCinNumber,
    setFormCinNumber,
    formPhone,
    setFormPhone,
    formWhatsapp,
    setFormWhatsapp,
    formEmail,
    setFormEmail,
    formEmergencyContact,
    setFormEmergencyContact,
    formSpecialty,
    setFormSpecialty,
    formContractType,
    setFormContractType,
    formMonthlySalary,
    setFormMonthlySalary,
    formWorkSchedule,
    setFormWorkSchedule,
    formAssignedAreas,
    setFormAssignedAreas,
    formDuties,
    setFormDuties,
    formClassIds,
    setFormClassIds,
    formCoursesString,
    setFormCoursesString,
    formJoinedDate,
    setFormJoinedDate,
    formPhoto,
    setFormPhoto,
    dragActive,
    handlePhotoUpload,
    handleDrag,
    handleDrop,
    handleSubmit,
  } = useStaff();

  const categoryLabelId = useId();
  const classesLabelId = useId();
  if (!showModal) return null;
  const close = () => setShowModal(false);

  /** Choix de la catégorie : préremplit l'intitulé, la spécialité et le salaire d'une nouvelle fiche (inchangé). */
  const pickCategory = (cat: StaffCategory) => {
    setFormCategory(cat);
    if (!editingTeacher) {
      if (cat === "أستاذ / محفظ") {
        setFormRoleTitle("محفظ ومدرس القرآن الكريم");
        setFormSpecialty("تجويد وقراءات برواية ورش");
        setFormMonthlySalary(2500);
      } else if (cat === "إداري / كاتب") {
        setFormRoleTitle("كاتب إداري وسكرتارية");
        setFormSpecialty("تسيير إداري ومعلوميات");
        setFormMonthlySalary(3000);
      } else if (cat === "مؤطر / مشرف تربوي") {
        setFormRoleTitle("مؤطر الأنشطة والمخيمات");
        setFormSpecialty("تأطير وتنشيط تربوي");
        setFormMonthlySalary(2000);
      } else if (cat === "عامل نظافة / صيانة") {
        setFormRoleTitle("مسؤول نظافة وصيانة المقر");
        setFormSpecialty("نظافة وصيانة المرافق");
        setFormAssignedAreas("المسجد، قاعات التحفيظ، المرافق الصحية");
        setFormMonthlySalary(1500);
      } else if (cat === "متطوع") {
        setFormRoleTitle("متطوع باللجنة الثقافية والتنظيمية");
        setFormSpecialty("مساعدة عامة وتنظيم");
        setFormContractType("تطوعي");
        setFormMonthlySalary(0);
      }
    }
  };

  return (
    <Modal
      modalId="staff-form"
      size="md"
      tone="night"
      icon={<UserPlus className="w-5 h-5" />}
      title={editingTeacher ? "تعديل ملف الكادر / العامل" : "تسجيل كادر أو عامل جديد"}
      subtitle="أدخل المعلومات الإدارية والمهنية وتفاصيل التعاقد"
      onClose={close}
      onSubmit={handleSubmit}
      bodyClassName="space-y-4 text-[13px]"
      footer={
        <>
          <Button onClick={close}>إلغاء</Button>
          <Button type="submit" variant="primary">{editingTeacher ? "حفظ التغييرات" : "تسجيل الكادر"}</Button>
        </>
      }
    >
      {/* Dynamic settings notice if staff is from settings */}
      {editingTeacher?.isFromSettings && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3.5 flex items-start gap-3 text-primary-900">
          <Sparkles className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div className="text-[13px] space-y-1">
            <p className="font-bold">منصب قيادي مربوط تلقائياً من وثيقة الإعدادات</p>
            <p className="text-[12.5px] text-primary-700 leading-relaxed">
              هذا المنصب ({editingTeacher.roleTitle}) يتم استيراد اسمه وصلاحياته مباشرة من صفحة <strong>إعدادات الجمعية والمدرسة</strong>. يمكنك هنا استكمال وتعديل رقم الهاتف، بطاقة التعريف، الصورة، وباقي البيانات الإدارية.
            </p>
          </div>
        </div>
      )}

      {/* Category Selector Tabs inside modal */}
      <div role="group" aria-labelledby={categoryLabelId} className="space-y-1.5">
        <span id={categoryLabelId} className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">
          فئة الكادر / نوع الوظيفة <span className="text-danger-500">*</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => {
            const cfg = STAFF_CATEGORIES_CONFIG[cat];
            const isSel = formCategory === cat;
            return (
              <button
                type="button"
                key={cat}
                aria-pressed={isSel}
                onClick={() => pickCategory(cat)}
                className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                  isSel
                    ? `${cfg.bg} ${cfg.border} border-2 shadow-2xs font-bold ${cfg.text}`
                    : "border-line bg-white hover:bg-sand-50 text-ink-2"
                }`}
              >
                <span className="text-base">{cfg.icon}</span>
                <span className="text-[13px]">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="bg-sand-50 p-4 rounded-xl border border-line space-y-3">
        <p className="block font-bold text-ink-2">الصورة الشخصية للكادر / العامل:</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-16 h-16 rounded-full border-2 border-primary-600 overflow-hidden shrink-0 bg-sand-100 flex items-center justify-center shadow-inner">
            {formPhoto ? (
              <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[formCategory]?.icon || DEFAULT_STAFF_ICON}</span>
            )}
            {formPhoto && (
              <button
                type="button"
                onClick={() => setFormPhoto("")}
                className="absolute -top-1 -right-1 bg-danger-600 text-white rounded-full p-0.5 hover:bg-danger-700 shadow"
                title="إزالة الصورة"
                aria-label="إزالة الصورة"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 w-full space-y-2">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer ${
                dragActive ? "border-primary-600 bg-primary-50" : "border-line-strong hover:border-sand-400 bg-white"
              }`}
            >
              <input
                type="file"
                id="staff-photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label htmlFor="staff-photo-upload" className="cursor-pointer block">
                <p className="font-bold text-ink-2 text-[13px]">اسحب صورة هنا أو انقر لاختيارها</p>
                <p className="text-[11.5px] text-ink-3 mt-0.5">JPG, PNG (الحد الأقصى 2 ميغابايت)</p>
              </label>
            </div>

            <Input
              type="url"
              aria-label="أو ألصق رابط صورة مباشر هنا (URL)..."
              value={formPhoto}
              onChange={(e) => setFormPhoto(e.target.value)}
              placeholder="أو ألصق رابط صورة مباشر هنا (URL)..."
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <FormField
          label={<>الاسم الكامل <span className="text-danger-500">*</span></>}
          hint={editingTeacher?.isFromSettings ? <span className="text-[11.5px] text-primary-700 font-medium">مستورد من الإعدادات</span> : undefined}
        >
          {(id) => <Input id={id} type="text" required value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="مثال: عبد الرحيم السملالي" />}
        </FormField>

        {/* Role Title */}
        <FormField label={<>المسمى الوظيفي / الصفة <span className="text-danger-500">*</span></>}>
          {(id) => (
            <Input id={id} type="text" required value={formRoleTitle} onChange={(e) => setFormRoleTitle(e.target.value)} placeholder="مثال: محفظ حلقة النور / كاتب الجمعية / مسؤول النظافة..." />
          )}
        </FormField>

        {/* CIN */}
        <FormField label="رقم البطاقة الوطنية للتعريف (CIN)">
          {(id) => (
            <Input id={id} type="text" value={formCinNumber} onChange={(e) => setFormCinNumber(e.target.value.toUpperCase())} placeholder="مثال: AB123456" className="font-mono" />
          )}
        </FormField>

        {/* Specialty / Skills */}
        <FormField label="التخصص أو المهارات">
          {(id) => (
            <Input id={id} type="text" value={formSpecialty} onChange={(e) => setFormSpecialty(e.target.value)} placeholder="مثال: قراءات ورش / إدارة وسكرتارية / صيانة عامة..." />
          )}
        </FormField>

        {/* Phone */}
        <FormField label={<>رقم الهاتف <span className="text-danger-500">*</span></>}>
          {(id) => <Input id={id} type="tel" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0612345678" className="font-mono" />}
        </FormField>

        {/* WhatsApp */}
        <FormField label="رقم الواتساب">
          {(id) => <Input id={id} type="tel" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="0612345678" className="font-mono" />}
        </FormField>

        {/* Email */}
        <FormField label="البريد الإلكتروني">
          {(id) => <Input id={id} type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="staff@alfajr.org" className="font-mono" />}
        </FormField>

        {/* Emergency Contact */}
        <FormField label="هاتف الطوارئ / قريب">
          {(id) => <Input id={id} type="tel" value={formEmergencyContact} onChange={(e) => setFormEmergencyContact(e.target.value)} placeholder="0698765432" className="font-mono" />}
        </FormField>

        {/* Contract Type */}
        <FormField label="نوع التعاقد أو التطوع">
          {(id) => (
            <Select id={id} value={formContractType} onChange={(v) => setFormContractType(v as ContractType)}>
              <option value="مكافأة شهرية">مكافأة شهرية</option>
              <option value="عقد عمل دائم">عقد عمل دائم</option>
              <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
              <option value="تطوعي">تطوعي (بدون أجر)</option>
              <option value="منحة تدريب">منحة تدريب</option>
            </Select>
          )}
        </FormField>

        {/* Monthly Salary / Stipend */}
        <FormField label="الراتب أو المكافأة الشهرية (د.م)">
          {(id) => <Input id={id} type="number" min={0} value={formMonthlySalary} onChange={(e) => setFormMonthlySalary(Number(e.target.value))} className="font-mono" />}
        </FormField>

        {/* Work Schedule */}
        <FormField label="أوقات وساعات العمل">
          {(id) => (
            <Input id={id} type="text" value={formWorkSchedule} onChange={(e) => setFormWorkSchedule(e.target.value)} placeholder="مثال: السبت والأحد 08:30 - 12:30 أو يومياً 16:00 - 19:00" />
          )}
        </FormField>

        {/* Joining Date */}
        <FormField label="تاريخ الالتحاق بالجمعية">
          {(id) => <Input id={id} type="date" value={formJoinedDate} onChange={(e) => setFormJoinedDate(e.target.value)} className="font-mono" />}
        </FormField>
      </div>

      {/* Assigned Areas (Facility staff, Admins, etc.) */}
      <FormField label="المرافق أو الأماكن أو اللجان المكلف بها">
        {(id) => (
          <Input id={id} type="text" value={formAssignedAreas} onChange={(e) => setFormAssignedAreas(e.target.value)} placeholder="مثال: مسجد الجمعية، قاعات التحفيظ بالطابق الأول، الإدارة والاستقبال..." />
        )}
      </FormField>

      {/* Assigned Classes (Only for Teachers / Mentors) */}
      {(formCategory === "أستاذ / محفظ" || formCategory === "مؤطر / مشرف تربوي") && (
        <div role="group" aria-labelledby={classesLabelId} className="space-y-2 bg-primary-50/40 p-3.5 rounded-xl border border-primary-100">
          <span id={classesLabelId} className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">
            الفصول والحلقات الدراسية المسندة:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
            {classes.map(c => {
              const isChecked = formClassIds.includes(c.id);
              const isAssignedToOther = c.teacherId && c.teacherId !== editingTeacher?.id;
              return (
                <label key={c.id} className="flex items-start gap-2 p-2 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-line transition bg-white/70">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormClassIds([...formClassIds, c.id]);
                      } else {
                        setFormClassIds(formClassIds.filter(id => id !== c.id));
                      }
                    }}
                    className="rounded border-line-strong text-primary-600 focus:ring-primary-500 w-4 h-4 mt-0.5"
                  />
                  <div className="text-right">
                    <p className="font-bold text-ink-2 text-[13px]">{c.name}</p>
                    <p className="text-[12.5px] text-ink-3 font-mono">{c.schedule}</p>
                    {isAssignedToOther && (
                      <span className="inline-block text-[11.5px] bg-gold-50 text-gold-700 px-1 rounded mt-0.5">
                        مسند لمعلم آخر
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Duties & Responsibilities */}
      <FormField label="المهام والمسؤوليات الموكلة إليه بالتفصيل">
        {(id) => (
          <Textarea
            id={id}
            value={formDuties}
            onChange={(e) => setFormDuties(e.target.value)}
            placeholder="مثال: تنظيف وتعقيم قاعات التحفيظ يومياً، تجهيز المصاحف والسبورات، مراقبة التجهيزات الصوتية..."
            className="h-20 resize-none"
          />
        )}
      </FormField>

      {/* Training Courses & Certifications */}
      <FormField label="سجل الشواهد والدورات التدريبية (افصل بينها بفاصلة)">
        {(id) => (
          <Textarea
            id={id}
            value={formCoursesString}
            onChange={(e) => setFormCoursesString(e.target.value)}
            placeholder="مثال: الإجازة في التجويد، دورة الإسعافات الأولية، شهادة في التدبير الإداري..."
            className="h-16 resize-none"
          />
        )}
      </FormField>
    </Modal>
  );
}
