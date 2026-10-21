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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                <span>{editingActivity ? "تعديل بيانات النشاط/الرحلة" : "إنشاء نشاط أو رحلة جديدة"}</span>
              </h3>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivityForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم / عنوان النشاط أو الرحلة *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: رحلة استكشافية إلى شلالات أوزود ومغارة سيدي مجبر"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع النشاط *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ActivityType)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة النشاط *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACTIVITY_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البداية / الانطلاق *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ النهاية / العودة (اختياري)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المكان أو الوجهة *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="مثال: شلالات أوزود - إقليم أزيلال"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نقطة وساعة التجمع والانطلاق</label>
                  <input
                    type="text"
                    value={formMeetingPoint}
                    onChange={(e) => setFormMeetingPoint(e.target.value)}
                    placeholder="مثال: مقر الجمعية الرئيسي (الساعة 07:00 صباحاً)"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Target Audience Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المستهدفة *</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="form-target-audience-list"
                    required
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    placeholder="اختر من القائمة أو اكتب الفئة المستهدفة يدوياً (مثال: الطالبات فقط، أمهات الطالبات...)"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <datalist id="form-target-audience-list">
                    {TARGET_AUDIENCE_PRESETS.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium ml-1">خيارات سريعة:</span>
                    {["الطالبات فقط", "الطلاب فقط", "الجميع (طلاب، أطر، أولياء أمور)", "الكوادر والمدرسين فقط", "أولياء الأمور"].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormTargetAudience(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          formTargetAudience === tag
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-slate-200"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ المساهمة الرمزية للشخص (د.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={formContributionFee}
                    onChange={(e) => setFormContributionFee(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطاقة الاستيعابية القصوى (عدد المقاعد)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxCapacity}
                    onChange={(e) => setFormMaxCapacity(Number(e.target.value))}
                    placeholder="مثال: 45 مقعداً"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المؤطرون والمشرفون المعتمدون</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-32 overflow-y-auto space-y-1.5">
                  {teachers.map(t => {
                    const isChecked = formLeaderIds.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
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
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{t.fullName}</span>
                        <span className="text-[10px] text-slate-400">({t.category || t.specialty || "مؤطر"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أهداف النشاط والوصف</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف مختصر للنشاط وأهدافه التربوية والترفيهية..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البرنامج الزمني والتفصيلي</label>
                <textarea
                  rows={3}
                  value={formProgramDetails}
                  onChange={(e) => setFormProgramDetails(e.target.value)}
                  placeholder="تفاصيل المحطات، الوجبات، الأنشطة والمسابقات وساعة العودة..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
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
