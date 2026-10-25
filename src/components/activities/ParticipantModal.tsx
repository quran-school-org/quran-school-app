/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ParticipantPaymentStatus } from "../../types";
import { Users, X } from "lucide-react";
import { useActivities } from "./ActivitiesContext";
import { Select } from "../../ui";

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

  return (
    <>
      {/* MODAL 2: Register / Edit Participant */}
      {showParticipantModal && currentActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden bg-night/55 backdrop-blur-[2px]">
          <div className="bg-surface border border-line max-w-lg w-full overflow-hidden my-8 rounded-3xl shadow-pop">
            <div className="p-5 border-b border-line-soft bg-sand-50 flex items-center justify-between">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span>{editingParticipant ? "تعديل بيانات المشارك" : `تسجيل مشارك في "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowParticipantModal(false)}
                className="text-ink-3 hover:text-ink-2 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipantForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">مصدر بيانات المشارك</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartSourceType("student")}
                    className={`py-2 text-[13px] font-bold rounded-xl border transition-all ${
                      partSourceType === "student" ? "bg-primary-100 text-primary-800 border-primary-500" : "bg-sand-50 text-ink-2 border-line"
                    }`}
                  >
                    طالب من الجمعية
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("staff")}
                    className={`py-2 text-[13px] font-bold rounded-xl border transition-all ${
                      partSourceType === "staff" ? "bg-primary-100 text-primary-800 border-primary-500" : "bg-sand-50 text-ink-2 border-line"
                    }`}
                  >
                    أستاذ / كادر
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("custom")}
                    className={`py-2 text-[13px] font-bold rounded-xl border transition-all ${
                      partSourceType === "custom" ? "bg-primary-100 text-primary-800 border-primary-500" : "bg-sand-50 text-ink-2 border-line"
                    }`}
                  >
                    مشارك خارجي
                  </button>
                </div>
              </div>

              {partSourceType === "student" && (
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اختر الطالب المسجل بالجمعية *</label>
                  <Select
                    aria-label="اختر الطالب المسجل بالجمعية"
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
                </div>
              )}

              {partSourceType === "staff" && (
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اختر الأستاذ / الموظف / الإداري *</label>
                  <Select
                    aria-label="اختر الأستاذ / الموظف / الإداري"
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
                </div>
              )}

              {partSourceType === "custom" && (
                <div className="space-y-2">
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الصفة أو المسمى للمشارك (المسمى الوظيفي / الدور) *</label>
                  <input
                    type="text"
                    value={partCustomRole}
                    onChange={(e) => setPartCustomRole(e.target.value)}
                    placeholder="مثال: طالب / محفظ / مؤطر / متطوع / مشارك خارجي..."
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الاسم الكامل للمشارك *</label>
                <input
                  type="text"
                  required
                  value={partFullName}
                  onChange={(e) => setPartFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={partPhone}
                    onChange={(e) => setPartPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">الجنس</label>
                  <Select
                    aria-label="الجنس"
                    value={partGender}
                    onChange={(v) => setPartGender(v as any)}
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </Select>
                </div>
              </div>

              {/* Fee & Payment Section */}
              <div className="bg-sand-50 border border-line rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-[13px] text-ink">بيانات المساهمة والأداء</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المبلغ المطلوب (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partFee}
                      onChange={(e) => setPartFee(Number(e.target.value))}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">المبلغ المدفوع (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partPaidAmount}
                      onChange={(e) => setPartPaidAmount(Number(e.target.value))}
                      className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">حالة الأداء</label>
                    <Select
                      aria-label="حالة الأداء"
                      value={partPaymentStatus}
                      onChange={(v) => setPartPaymentStatus(v as ParticipantPaymentStatus)}
                    >
                      <option value="مدفوع">مدفوع بالكامل</option>
                      <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                      <option value="غير مدفوع">غير مدفوع (مستحق)</option>
                      <option value="معفى">معفى من المساهمة</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">طريقة الدفع</label>
                    <Select
                      aria-label="طريقة الدفع"
                      value={partPaymentMethod}
                      onChange={(v) => setPartPaymentMethod(v as any)}
                    >
                      <option value="نقداً">نقداً</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="شيك">شيك</option>
                      <option value="أخرى">أخرى</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">رقم وصل الأداء</label>
                  <input
                    type="text"
                    value={partReceiptNo}
                    onChange={(e) => setPartReceiptNo(e.target.value)}
                    placeholder="REC-ACT-XXXX"
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">ملاحظات صحية أو حساسية خاصة (اختياري)</label>
                <input
                  type="text"
                  value={partMedicalNotes}
                  onChange={(e) => setPartMedicalNotes(e.target.value)}
                  placeholder="مثال: حساسية ضد الفول السوداني أو الربو..."
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2.5 text-[13px] font-semibold text-ink-2 hover:text-ink"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
                >
                  {editingParticipant ? "حفظ التعديلات" : "تأكيد التسجيل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
