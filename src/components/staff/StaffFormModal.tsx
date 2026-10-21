/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { StaffCategory, ContractType } from "../../types";
import { UserPlus, Phone, X, Sparkles } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG } from "./shared";
import { useStaff } from "./StaffContext";

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

  return (
    <>
      {/* ADD / EDIT STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col" dir="rtl">
            {/* Modal Header */}
            <div className="p-5 bg-emerald-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base">
                    {editingTeacher ? "📝 تعديل ملف الكادر / العامل" : "👤 تسجيل كادر أو عامل جديد"}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    أدخل المعلومات الإدارية والمهنية وتفاصيل التعاقد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
              {/* Dynamic settings notice if staff is from settings */}
              {editingTeacher?.isFromSettings && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 text-indigo-900">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">منصب قيادي مربوط تلقائياً من وثيقة الإعدادات</p>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      هذا المنصب ({editingTeacher.roleTitle}) يتم استيراد اسمه وصلاحياته مباشرة من صفحة <strong>إعدادات الجمعية والمدرسة</strong>. يمكنك هنا استكمال وتعديل رقم الهاتف، بطاقة التعريف، الصورة، وباقي البيانات الإدارية.
                    </p>
                  </div>
                </div>
              )}

              {/* Category Selector Tabs inside modal */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  فئة الكادر / نوع الوظيفة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => {
                    const cfg = STAFF_CATEGORIES_CONFIG[cat];
                    const isSel = formCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
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
                        }}
                        className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                          isSel
                            ? `${cfg.bg} ${cfg.border} border-2 shadow-2xs font-bold ${cfg.text}`
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-base">{cfg.icon}</span>
                        <span className="text-xs">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="block font-bold text-slate-700">الصورة الشخصية للكادر / العامل:</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-full border-2 border-emerald-600 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center shadow-inner">
                    {formPhoto ? (
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[formCategory]?.icon || "👤"}</span>
                    )}
                    {formPhoto && (
                      <button
                        type="button"
                        onClick={() => setFormPhoto("")}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow"
                        title="إزالة الصورة"
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
                        dragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-white"
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
                        <p className="font-bold text-slate-700 text-xs">اسحب صورة هنا أو انقر لاختيارها</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG (الحد الأقصى 2 ميغابايت)</p>
                      </label>
                    </div>

                    <input
                      type="url"
                      value={formPhoto}
                      onChange={(e) => setFormPhoto(e.target.value)}
                      placeholder="أو ألصق رابط صورة مباشر هنا (URL)..."
                      className="w-full p-2 border border-slate-300 rounded-lg text-[10px] font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-slate-700">
                      الاسم الكامل <span className="text-rose-500">*</span>
                    </label>
                    {editingTeacher?.isFromSettings && (
                      <span className="text-[10px] text-indigo-700 font-medium">مستورد من الإعدادات</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="مثال: عبد الرحيم السملالي"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Role Title */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    المسمى الوظيفي / الصفة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="مثال: محفظ حلقة النور / كاتب الجمعية / مسؤول النظافة..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* CIN */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    رقم البطاقة الوطنية للتعريف (CIN)
                  </label>
                  <input
                    type="text"
                    value={formCinNumber}
                    onChange={(e) => setFormCinNumber(e.target.value.toUpperCase())}
                    placeholder="مثال: AB123456"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                {/* Specialty / Skills */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    التخصص أو المهارات
                  </label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="مثال: قراءات ورش / إدارة وسكرتارية / صيانة عامة..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    رقم الهاتف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0612345678"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="0612345678"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@alfajr.org"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">هاتف الطوارئ / قريب</label>
                  <input
                    type="tel"
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    placeholder="0698765432"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Contract Type */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">نوع التعاقد أو التطوع</label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value as ContractType)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800"
                  >
                    <option value="مكافأة شهرية">مكافأة شهرية</option>
                    <option value="عقد عمل دائم">عقد عمل دائم</option>
                    <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
                    <option value="تطوعي">تطوعي (بدون أجر)</option>
                    <option value="منحة تدريب">منحة تدريب</option>
                  </select>
                </div>

                {/* Monthly Salary / Stipend */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">الراتب أو المكافأة الشهرية (د.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMonthlySalary}
                    onChange={(e) => setFormMonthlySalary(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 font-mono"
                  />
                </div>

                {/* Work Schedule */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">أوقات وساعات العمل</label>
                  <input
                    type="text"
                    value={formWorkSchedule}
                    onChange={(e) => setFormWorkSchedule(e.target.value)}
                    placeholder="مثال: السبت والأحد 08:30 - 12:30 أو يومياً 16:00 - 19:00"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Joining Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">تاريخ الالتحاق بالجمعية</label>
                  <input
                    type="date"
                    value={formJoinedDate}
                    onChange={(e) => setFormJoinedDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Assigned Areas (Facility staff, Admins, etc.) */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  المرافق أو الأماكن أو اللجان المكلف بها
                </label>
                <input
                  type="text"
                  value={formAssignedAreas}
                  onChange={(e) => setFormAssignedAreas(e.target.value)}
                  placeholder="مثال: مسجد الجمعية، قاعات التحفيظ بالطابق الأول، الإدارة والاستقبال..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Assigned Classes (Only for Teachers / Mentors) */}
              {(formCategory === "أستاذ / محفظ" || formCategory === "مؤطر / مشرف تربوي") && (
                <div className="space-y-2 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                  <label className="block font-bold text-emerald-900 text-xs">
                    🏫 الفصول والحلقات الدراسية المسندة:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {classes.map(c => {
                      const isChecked = formClassIds.includes(c.id);
                      const isAssignedToOther = c.teacherId && c.teacherId !== editingTeacher?.id;
                      return (
                        <label key={c.id} className="flex items-start gap-2 p-2 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition bg-white/70">
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
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                          />
                          <div className="text-right">
                            <p className="font-bold text-slate-700 text-xs">{c.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{c.schedule}</p>
                            {isAssignedToOther && (
                              <span className="inline-block text-[8px] bg-amber-50 text-amber-700 px-1 rounded mt-0.5">
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
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  المهام والمسؤوليات الموكلة إليه بالتفصيل
                </label>
                <textarea
                  value={formDuties}
                  onChange={(e) => setFormDuties(e.target.value)}
                  placeholder="مثال: تنظيف وتعقيم قاعات التحفيظ يومياً، تجهيز المصاحف والسبورات، مراقبة التجهيزات الصوتية..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs h-20 resize-none"
                />
              </div>

              {/* Training Courses & Certifications */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  سجل الشواهد والدورات التدريبية (افصل بينها بفاصلة)
                </label>
                <textarea
                  value={formCoursesString}
                  onChange={(e) => setFormCoursesString(e.target.value)}
                  placeholder="مثال: الإجازة في التجويد، دورة الإسعافات الأولية، شهادة في التدبير الإداري..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs h-16 resize-none"
                />
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition text-xs shadow-md"
                >
                  {editingTeacher ? "حفظ التغييرات" : "تسجيل الكادر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
