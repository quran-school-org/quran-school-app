/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Printer, FileText } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function PrintReportModal() {
  const {
    systemSettings,
    canPrint,
    selectedYear,
    showPrintReportModal,
    setShowPrintReportModal,
    totalStudentFeesAmount,
    totalActivityContributions,
    totalActivityExpenses,
    filteredOtherIncomes,
    grossTotalIncome,
    filteredSalaries,
    filteredExpenses,
    grossTotalExpenses,
    netBalance,
    handlePrint,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* MODAL 4: OFFICIAL PRINTABLE FINANCIAL REPORT MODAL */}
      {/* ========================================================================================= */}
      {showPrintReportModal && (
        <div className="fixed inset-0 bg-sand-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 border border-sand-200 max-h-[90vh] flex flex-col">
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="p-4 bg-sand-900 text-white flex justify-between items-center print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-400" />
                <span className="font-bold text-sm">معاينة التقرير المالي والختامي المعتمد</span>
              </div>

              <div className="flex items-center gap-3">
                {canPrint && (
                  <button
                    onClick={handlePrint}
                    className="bg-gold-400 hover:bg-gold-500 text-sand-950 font-bold px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة فورية / حفظ PDF</span>
                  </button>
                )}

                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="text-sand-400 hover:text-white p-1 rounded-lg text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Statement Area */}
            <div className="p-8 sm:p-12 space-y-8 bg-white text-sand-900 font-serif" id="printable-financial-statement">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-primary-900 pb-6">
                <div className="text-right space-y-1">
                  <p className="font-bold text-xs text-sand-600">المملكة المغربية</p>
                  <h2 className="text-xl font-bold text-primary-950">
                    {systemSettings?.associationName || "إدارة الجمعية"}
                  </h2>
                  <p className="text-xs text-sand-500">
                    {systemSettings?.associationAddress || ""}
                  </p>
                  <p className="text-xs text-sand-500">
                    الهاتف: {systemSettings?.associationPhone || ""} {systemSettings?.associationEmail ? `| البريد: ${systemSettings.associationEmail}` : ""}
                  </p>
                </div>

                <div className="text-center">
                  {systemSettings?.associationLogo ? (
                    <img
                      src={systemSettings.associationLogo}
                      alt={systemSettings?.associationName || "شعار الجمعية"}
                      className="w-20 h-20 object-contain mx-auto mb-1 rounded-2xl border border-sand-200 p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary-800 text-gold-300 rounded-2xl flex items-center justify-center mx-auto mb-1 border-2 border-gold-400 font-bold text-2xl shadow-inner">
                      {(() => { const w = (systemSettings?.associationName || "").split(" ").filter(Boolean); return w[1] || w[0] || ""; })()}
                    </div>
                  )}
                  <span className="text-[10px] text-sand-500 block font-sans font-medium">
                    {systemSettings?.foundingDate
                      ? `تأسست سنة ${systemSettings.foundingDate.includes("-") ? systemSettings.foundingDate.split("-")[0] : systemSettings.foundingDate}`
                      : ""}
                  </span>
                </div>

                <div className="text-left space-y-1 font-sans text-xs">
                  <p className="font-bold text-sand-800">التاريخ: {new Date().toLocaleDateString("ar-MA")}</p>
                  <p className="text-sand-500">السنة المالية: {selectedYear}</p>
                  <p className="text-sand-500">الرقم المرجعي: FIN-REP-{selectedYear}-01</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 my-4">
                <h1 className="text-2xl font-black text-primary-950 underline decoration-gold-400 decoration-2 underline-offset-8">
                  التقرير المالي والختامي للجمعية
                </h1>
                <p className="text-xs text-sand-600 font-sans pt-1">
                  عن الفترة الممتدة خلال السنة المالية {selectedYear}
                </p>
              </div>

              {/* Table A: Revenues */}
              <div className="space-y-2 break-inside-avoid">
                <h3 className="font-bold text-sm text-primary-900 border-r-4 border-primary-800 pr-2">
                  أولاً: جدول الإيرادات والمداخيل المقبوضة
                </h3>
                <table className="w-full text-right text-xs border border-sand-300 border-collapse">
                  <thead>
                    <tr className="bg-primary-900 text-white font-bold">
                      <th className="border border-sand-300 p-2">الباب / مصدر الدخل</th>
                      <th className="border border-sand-300 p-2">نوع المداخيل</th>
                      <th className="border border-sand-300 p-2">توضيحات إضافية</th>
                      <th className="border border-sand-300 p-2 text-left">المبلغ بالدرهم (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">واجبات اشتراك التلاميذ الشهرية</td>
                      <td className="border border-sand-300 p-2">اشتراكات دراسية</td>
                      <td className="border border-sand-300 p-2 text-sand-600">مجموع المقبوضات الشهرية من الأولياء</td>
                      <td className="border border-sand-300 p-2 font-bold text-primary-900 text-left">
                        {totalStudentFeesAmount.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">تبرعات المحسنين والهبات</td>
                      <td className="border border-sand-300 p-2">تبرعات عينية ونقدية</td>
                      <td className="border border-sand-300 p-2 text-sand-600">دعم المحسنين لتجهيز المدرسة والقرآنيات</td>
                      <td className="border border-sand-300 p-2 font-bold text-primary-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">منح الجمعيات والمجالس المؤسساتية</td>
                      <td className="border border-sand-300 p-2">دعم عمومي</td>
                      <td className="border border-sand-300 p-2 text-sand-600">منح الجماعة والشركاء المؤسساتيين</td>
                      <td className="border border-sand-300 p-2 font-bold text-primary-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">مداخيل ومساهمات الأنشطة والرحلات</td>
                      <td className="border border-sand-300 p-2">أنشطة ورحلات</td>
                      <td className="border border-sand-300 p-2 text-sand-600">مساهمات المشاركين المحصلة آلياً</td>
                      <td className="border border-sand-300 p-2 font-bold text-primary-900 text-left">
                        {totalActivityContributions.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">مداخيل متنوعة أخرى واشتراكات</td>
                      <td className="border border-sand-300 p-2">أنشطة ومسابقات</td>
                      <td className="border border-sand-300 p-2 text-sand-600">مشاركات ومداخيل متنوعة</td>
                      <td className="border border-sand-300 p-2 font-bold text-primary-900 text-left">
                        {filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr className="bg-primary-50 font-black text-primary-950">
                      <td colSpan={3} className="border border-sand-300 p-2 text-right">
                        مجموع الإيرادات والمداخيل الكلية (أ)
                      </td>
                      <td className="border border-sand-300 p-2 text-left text-sm">
                        {grossTotalIncome.toLocaleString()} د.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table B: Expenses */}
              <div className="space-y-2 break-inside-avoid">
                <h3 className="font-bold text-sm text-danger-900 border-r-4 border-danger-800 pr-2">
                  ثانياً: جدول المصاريف والنفقات المنجزة
                </h3>
                <table className="w-full text-right text-xs border border-sand-300 border-collapse">
                  <thead>
                    <tr className="bg-sand-800 text-white font-bold">
                      <th className="border border-sand-300 p-2">الباب / نوع النفقة</th>
                      <th className="border border-sand-300 p-2">فئة المصاريف</th>
                      <th className="border border-sand-300 p-2">توضيحات إضافية</th>
                      <th className="border border-sand-300 p-2 text-left">المبلغ بالدرهم (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">أجور ومستحقات الأساتذة والمحفظين</td>
                      <td className="border border-sand-300 p-2">كتلة الأجور</td>
                      <td className="border border-sand-300 p-2 text-sand-600">تعويضات التأطير والتحفيظ لشيوخ المدرسة</td>
                      <td className="border border-sand-300 p-2 font-bold text-danger-900 text-left">
                        {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">أجور الأطر الإدارية وعمال الصيانة</td>
                      <td className="border border-sand-300 p-2">كتلة الأجور</td>
                      <td className="border border-sand-300 p-2 text-sand-600">التعويضات الإدارية ونظافة المقر</td>
                      <td className="border border-sand-300 p-2 font-bold text-danger-900 text-left">
                        {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">نفقات ومصاريف الأنشطة والرحلات</td>
                      <td className="border border-sand-300 p-2">أنشطة ورحلات</td>
                      <td className="border border-sand-300 p-2 text-sand-600">كراء حافلات، إطعام وتأطير الأنشطة</td>
                      <td className="border border-sand-300 p-2 font-bold text-danger-900 text-left">
                        {totalActivityExpenses.toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">استهلاك الماء والكهرباء والإنترنت</td>
                      <td className="border border-sand-300 p-2">فواتير وخدمات</td>
                      <td className="border border-sand-300 p-2 text-sand-600">استهلاك المقر الإداري وقاعات التحفيظ</td>
                      <td className="border border-sand-300 p-2 font-bold text-danger-900 text-left">
                        {filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-sand-300 p-2 font-bold">المشتريات والتجهيزات والجوائز والصيانة</td>
                      <td className="border border-sand-300 p-2">تشغيل وتجهيز</td>
                      <td className="border border-sand-300 p-2 text-sand-600">دروع التكريم، مستلزمات مكتبية وصيانة أجهزة</td>
                      <td className="border border-sand-300 p-2 font-bold text-danger-900 text-left">
                        {filteredExpenses.filter(e => e.category !== "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                      </td>
                    </tr>
                    <tr className="bg-danger-50 font-black text-danger-950">
                      <td colSpan={3} className="border border-sand-300 p-2 text-right">
                        مجموع المصاريف والنفقات الكلية (ب)
                      </td>
                      <td className="border border-sand-300 p-2 text-left text-sm">
                        {grossTotalExpenses.toLocaleString()} د.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Balance Box */}
              <div className="bg-gold-50/80 border-2 border-gold-300 rounded-2xl p-4 flex items-center justify-between text-sand-900 break-inside-avoid">
                <div>
                  <h4 className="font-bold text-sm">خلاصة الرصيد المالي الصافي للجمعية (أ - ب)</h4>
                  <p className="text-xs text-sand-600">
                    {netBalance >= 0 
                      ? "فائض مالي إيجابي مرحل للسنة الموالية" 
                      : "عجز مالي يتطلب التغطية من الاحتياطي"}
                  </p>
                </div>
                <div className="text-2xl font-black text-primary-900 dir-ltr">
                  {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()} د.م
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-8 border-t border-sand-300 space-y-6 break-inside-avoid">
                <div className="grid grid-cols-4 gap-4 text-center text-xs font-sans items-start">
                  {/* Treasurer */}
                  <div className="space-y-2 border border-sand-200 p-3 rounded-xl bg-sand-50/50">
                    <p className="font-bold text-sand-800">أمين المال للجمعية</p>
                    <p className="font-bold text-primary-900">{systemSettings?.treasurerName || "-"}</p>
                    <div className="pt-6 text-sand-500 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* School Director */}
                  <div className="space-y-2 border border-sand-200 p-3 rounded-xl bg-sand-50/50">
                    <p className="font-bold text-sand-800">المدير المسؤول للمدرسة</p>
                    <p className="font-bold text-primary-900">{systemSettings?.directorName || "-"}</p>
                    <div className="pt-6 text-sand-500 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* Association President */}
                  <div className="space-y-2 border border-sand-200 p-3 rounded-xl bg-sand-50/50">
                    <p className="font-bold text-sand-800">رئيس الجمعية</p>
                    <p className="font-bold text-primary-900">{systemSettings?.presidentName || "-"}</p>
                    <div className="pt-6 text-sand-500 font-serif text-[10px]">(التوقيع والإمضاء)</div>
                  </div>

                  {/* Official Seal */}
                  <div className="space-y-1 flex flex-col items-center justify-center p-2">
                    <div className="w-20 h-20 border-2 border-dashed border-primary-800 rounded-full flex items-center justify-center text-[9px] text-primary-900 font-bold p-1.5 text-center opacity-85 bg-primary-50/30">
                      {systemSettings?.stampText || "خاتم الجمعية الرسمي"}
                    </div>
                    <p className="text-[9px] text-sand-500 font-medium">مصادق عليه - سلا</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
