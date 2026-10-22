/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ActivityType, ActivityStatus } from "../../types";
import { Compass, X } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, TARGET_AUDIENCE_PRESETS } from "./shared";
import { useActivities } from "./ActivitiesContext";

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

  return (
    <>
      {/* MODAL 1: Create / Edit Activity */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden bg-night/55 backdrop-blur-[2px]">
          <div className="bg-surface border border-line max-w-2xl w-full overflow-hidden my-8 rounded-3xl shadow-pop">
            <div className="p-5 border-b border-line-soft bg-sand-50 flex items-center justify-between">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary-600" />
                <span>{editingActivity ? "تعديل بيانات النشاط/الرحلة" : "إنشاء نشاط أو رحلة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-ink-3 hover:text-ink-2 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivityForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-right">
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اسم / عنوان النشاط أو الرحلة *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: رحلة استكشافية إلى شلالات أوزود ومغارة سيدي مجبر"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نوع النشاط *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ActivityType)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">حالة النشاط *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    {ACTIVITY_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ البداية / الانطلاق *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">تاريخ النهاية / العودة (اختياري)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المكان أو الوجهة *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="مثال: شلالات أوزود - إقليم أزيلال"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">نقطة وساعة التجمع والانطلاق</label>
                  <input
                    type="text"
                    value={formMeetingPoint}
                    onChange={(e) => setFormMeetingPoint(e.target.value)}
                    placeholder="مثال: مقر الجمعية الرئيسي (الساعة 07:00 صباحاً)"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              {/* Target Audience Field */}
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الفئة المستهدفة *</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="form-target-audience-list"
                    required
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    placeholder="اختر من القائمة أو اكتب الفئة المستهدفة يدوياً (مثال: الطالبات فقط، أمهات الطالبات...)"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">مبلغ المساهمة الرمزية للشخص (د.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={formContributionFee}
                    onChange={(e) => setFormContributionFee(Number(e.target.value))}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الطاقة الاستيعابية القصوى (عدد المقاعد)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxCapacity}
                    onChange={(e) => setFormMaxCapacity(Number(e.target.value))}
                    placeholder="مثال: 45 مقعداً"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المؤطرون والمشرفون المعتمدون</label>
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

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">أهداف النشاط والوصف</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للنشاط وأهدافه التربوية والترفيهية..."
                  className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">البرنامج الزمني والتفصيلي</label>
                <textarea
                  rows={3}
                  value={formProgramDetails}
                  onChange={(e) => setFormProgramDetails(e.target.value)}
                  placeholder="تفاصيل المحطات، الوجبات، الأنشطة والمسابقات وساعة العودة..."
                  className="py-2.5 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2.5 text-[13px] font-semibold text-ink-2 hover:text-ink"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
                >
                  {editingActivity ? "حفظ التعديلات" : "إنشاء النشاط"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
