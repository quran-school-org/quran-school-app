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
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn bg-night/55 backdrop-blur-[2px]" style={{ direction: "rtl" }}>
          <div className="bg-surface border border-line w-full max-w-lg overflow-hidden my-8 animate-scaleIn max-h-[90vh] flex flex-col rounded-3xl shadow-pop">
            <div className="bg-night p-5 text-night-text flex justify-between items-center shrink-0 border-b border-night-line">
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

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 text-[13px] text-ink-2 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">فئة المستفيد</label>
                  <select
                    value={salaryPersonType}
                    onChange={(e) => setSalaryPersonType(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  >
                    <option value="تم الصرف">تم الصرف والتأدية</option>
                    <option value="مستحق (قيد الانتظار)">مستحق (قيد الانتظار)</option>
                  </select>
                </div>
              </div>

              {teachers.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[13.5px] font-semibold text-ink-2 mb-1.5">اختر من لائحة الأطر والعاملين المسجلين</label>
                    <span className="text-[11.5px] text-primary-700 font-bold">يتم ملء الصفة والمبلغ تلقائياً</span>
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">الصفة / المسمى الوظيفي</label>
                <input
                  type="text"
                  placeholder="مثال: محفظ فصل النور / مسؤول صيانة ونظافة المقر..."
                  value={salaryRoleTitle}
                  onChange={(e) => setSalaryRoleTitle(e.target.value)}
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">الشهر المستحق</label>
                  <select
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">مصدر الصرف</label>
                  <select
                    value={salaryPaymentSource}
                    onChange={(e) => setSalaryPaymentSource(e.target.value as any)}
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                    className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
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
                  className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface hover:bg-surface-2 text-ink text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55"
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
