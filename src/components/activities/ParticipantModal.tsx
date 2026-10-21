/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { ParticipantPaymentStatus } from "../../types";
import { Users, X } from "lucide-react";
import { useActivities } from "./ActivitiesContext";

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>{editingParticipant ? "تعديل بيانات المشارك" : `تسجيل مشارك في "${currentActivity.title}"`}</span>
              </h3>
              <button
                onClick={() => setShowParticipantModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipantForm} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مصدر بيانات المشارك</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartSourceType("student")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "student" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    طالب من الجمعية
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("staff")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "staff" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    أستاذ / كادر
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartSourceType("custom")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      partSourceType === "custom" ? "bg-emerald-100 text-emerald-800 border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    مشارك خارجي
                  </button>
                </div>
              </div>

              {partSourceType === "student" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اختر الطالب المسجل بالجمعية *</label>
                  <select
                    value={selectedStudentRefId}
                    onChange={(e) => {
                      setSelectedStudentRefId(e.target.value);
                      const st = students.find(s => s.id === e.target.value);
                      if (st) {
                        setPartFullName(st.fullName);
                        setPartPhone(st.parentPhone);
                        setPartGender(st.gender);
                      }
                    }}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر طالباً --</option>
                    {students.filter(s => !s.isArchived).map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.parentPhone})</option>
                    ))}
                  </select>
                </div>
              )}

              {partSourceType === "staff" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اختر الأستاذ / الموظف / الإداري *</label>
                  <select
                    value={selectedStaffRefId}
                    onChange={(e) => {
                      setSelectedStaffRefId(e.target.value);
                      const st = allStaff.find(t => t.id === e.target.value);
                      if (st) {
                        setPartFullName(st.fullName);
                        setPartPhone(st.phone);
                        setPartCustomRole(st.roleTitle?.trim() || st.category || st.specialty || "كادر الجمعية");
                      }
                    }}
                    required
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- اختر كادراً أو موظفاً أو أستاذاً --</option>
                    {allStaff.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} — [{t.roleTitle || t.category || t.specialty || "كادر"}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {partSourceType === "custom" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">الصفة أو المسمى للمشارك (المسمى الوظيفي / الدور) *</label>
                  <input
                    type="text"
                    value={partCustomRole}
                    onChange={(e) => setPartCustomRole(e.target.value)}
                    placeholder="مثال: طالب / محفظ / مؤطر / متطوع / مشارك خارجي..."
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 font-bold self-center ml-1">اقتراحات سريعة:</span>
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
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                          partCustomRole === r
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل للمشارك *</label>
                <input
                  type="text"
                  required
                  value={partFullName}
                  onChange={(e) => setPartFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={partPhone}
                    onChange={(e) => setPartPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الجنس</label>
                  <select
                    value={partGender}
                    onChange={(e) => setPartGender(e.target.value as any)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              {/* Fee & Payment Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-800">بيانات المساهمة والأداء</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">المبلغ المطلوب (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partFee}
                      onChange={(e) => setPartFee(Number(e.target.value))}
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">المبلغ المدفوع (د.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={partPaidAmount}
                      onChange={(e) => setPartPaidAmount(Number(e.target.value))}
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">حالة الأداء</label>
                    <select
                      value={partPaymentStatus}
                      onChange={(e) => setPartPaymentStatus(e.target.value as ParticipantPaymentStatus)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="مدفوع">مدفوع بالكامل</option>
                      <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                      <option value="غير مدفوع">غير مدفوع (مستحق)</option>
                      <option value="معفى">معفى من المساهمة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">طريقة الدفع</label>
                    <select
                      value={partPaymentMethod}
                      onChange={(e) => setPartPaymentMethod(e.target.value as any)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="نقداً">نقداً</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="شيك">شيك</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم وصل الأداء</label>
                  <input
                    type="text"
                    value={partReceiptNo}
                    onChange={(e) => setPartReceiptNo(e.target.value)}
                    placeholder="REC-ACT-XXXX"
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات صحية أو حساسية خاصة (اختياري)</label>
                <input
                  type="text"
                  value={partMedicalNotes}
                  onChange={(e) => setPartMedicalNotes(e.target.value)}
                  placeholder="مثال: حساسية ضد الفول السوداني أو الربو..."
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
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
