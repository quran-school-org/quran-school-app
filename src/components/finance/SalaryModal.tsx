/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Briefcase } from "lucide-react";
import { MONTHS_LIST } from "./shared";
import { useFinance } from "./FinanceContext";

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

  return (
    <>
      {/* ========================================================================================= */}
      {/* MODAL 2: ADD / EDIT SALARY PAYMENT */}
      {/* ========================================================================================= */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl border border-sand-200 shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-primary-800 to-sand-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gold-300" />
                <span>{editingSalary ? "تعديل سجل التعويض والراتب" : "تسجيل وصرف أجر / راتب جديد"}</span>
              </h3>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 text-xs text-sand-700 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">فئة المستفيد</label>
                  <select
                    value={salaryPersonType}
                    onChange={(e) => setSalaryPersonType(e.target.value as any)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                  >
                    <option value="أستاذ / محفظ">أستاذ / محفظ القرآن</option>
                    <option value="إطار إداري">إطار إداري / كاتب</option>
                    <option value="عامل / مستخدم">عامل نظافة / صيانة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">حالة الصرف</label>
                  <select
                    value={salaryStatus}
                    onChange={(e) => setSalaryStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none font-bold"
                  >
                    <option value="تم الصرف">تم الصرف والتأدية</option>
                    <option value="مستحق (قيد الانتظار)">مستحق (قيد الانتظار)</option>
                  </select>
                </div>
              </div>

              {teachers.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-xs text-sand-700">اختر من لائحة الأطر والعاملين المسجلين</label>
                    <span className="text-[10px] text-primary-700 font-bold">يتم ملء الصفة والمبلغ تلقائياً</span>
                  </div>
                  <select
                    value={salaryPersonId}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setSalaryPersonId("");
                        setSalaryPersonName("");
                      } else {
                        handleTeacherSelect(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none font-bold text-xs"
                  >
                    <option value="">-- اختر كادر / عامل من السجل --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.category || "أستاذ"} - {t.roleTitle || t.specialty}) {t.monthlySalary ? `[${t.monthlySalary} د.م]` : ""}
                      </option>
                    ))}
                    <option value="custom">✏️ إدخال يدوي لشخص آخر...</option>
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block font-bold mb-1">اسم المستفيد الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأستاذ محمد العلوي / السيد علي الحارس..."
                  value={salaryPersonName}
                  onChange={(e) => setSalaryPersonName(e.target.value)}
                  className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">الصفة / المسمى الوظيفي</label>
                <input
                  type="text"
                  placeholder="مثال: محفظ فصل النور / مسؤول صيانة ونظافة المقر..."
                  value={salaryRoleTitle}
                  onChange={(e) => setSalaryRoleTitle(e.target.value)}
                  className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ (د.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl font-bold text-sand-900 focus:bg-white focus:border-primary-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">الشهر المستحق</label>
                  <select
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">السنة</label>
                  <input
                    type="number"
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">مصدر الصرف</label>
                  <select
                    value={salaryPaymentSource}
                    onChange={(e) => setSalaryPaymentSource(e.target.value as any)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                  >
                    <option value="الصندوق">الصندوق</option>
                    <option value="حساب الجمعية البنكي">حساب الجمعية البنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">طريقة الدفع</label>
                  <select
                    value={salaryPaymentMethod}
                    onChange={(e) => setSalaryPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                  >
                    <option value="نقداً">نقداً</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={salaryPaymentDate}
                    onChange={(e) => setSalaryPaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">رقم وصل / إذن الصرف</label>
                <input
                  type="text"
                  placeholder="مثال: SAL-2026-07-12"
                  value={salaryReceiptNo}
                  onChange={(e) => setSalaryReceiptNo(e.target.value)}
                  className="w-full p-2.5 bg-sand-50 border border-sand-300 rounded-xl focus:bg-white focus:border-primary-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-700 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-800 hover:bg-primary-900 text-white font-bold shadow-md transition"
                >
                  حفظ أجر المستفيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
