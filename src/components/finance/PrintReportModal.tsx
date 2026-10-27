/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 * Aperçu sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu ;
 * barre d'actions et en-tête masqués à l'impression.
 */
import { Printer, FileText } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { formatMoney, formatNumber } from "../../format/money";
import { Button, Ltr, Modal } from "../../ui";

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

  if (!showPrintReportModal) return null;
  const close = () => setShowPrintReportModal(false);

  return (
    <Modal
      modalId="finance-print-report"
      size="lg"
      print
      flush
      icon={<FileText className="w-5 h-5" strokeWidth={1.75} />}
      title="معاينة التقرير المالي والختامي المعتمد"
      onClose={close}
      footer={
        canPrint ? (
          <Button variant="primary" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>طباعة فورية / حفظ PDF</Button>
        ) : undefined
      }
    >
      <div className="p-8 sm:p-12 space-y-8 bg-white text-ink font-serif" id="printable-financial-statement" data-theme="bleu-nuit">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-primary-900 pb-6">
          <div className="text-right space-y-1">
            <p className="font-bold text-[13px] text-ink-2">المملكة المغربية</p>
            <h2 className="text-xl font-bold text-primary-950">
              {systemSettings?.associationName || "إدارة الجمعية"}
            </h2>
            <p className="text-[13px] text-ink-3">
              {systemSettings?.associationAddress || ""}
            </p>
            <p className="text-[13px] text-ink-3">
              الهاتف: {systemSettings?.associationPhone || ""} {systemSettings?.associationEmail ? `| البريد: ${systemSettings.associationEmail}` : ""}
            </p>
          </div>

          <div className="text-center">
            {systemSettings?.associationLogo ? (
              <img
                src={systemSettings.associationLogo}
                alt={systemSettings?.associationName || "شعار الجمعية"}
                className="w-20 h-20 object-contain mx-auto mb-1 rounded-2xl border border-line p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 bg-primary-800 text-gold-300 rounded-2xl flex items-center justify-center mx-auto mb-1 border-2 border-gold-400 font-bold text-2xl shadow-inner">
                {(() => { const w = (systemSettings?.associationName || "").split(" ").filter(Boolean); return w[1] || w[0] || ""; })()}
              </div>
            )}
            <span className="text-[11.5px] text-ink-3 block font-sans font-medium">
              {systemSettings?.foundingDate
                ? `تأسست سنة ${systemSettings.foundingDate.includes("-") ? systemSettings.foundingDate.split("-")[0] : systemSettings.foundingDate}`
                : ""}
            </span>
          </div>

          <div className="text-left space-y-1 font-sans text-[13px]">
            <p className="font-bold text-ink">التاريخ: {new Date().toLocaleDateString("ar-MA")}</p>
            <p className="text-ink-3">السنة المالية: {selectedYear}</p>
            <p className="text-ink-3">الرقم المرجعي: FIN-REP-{selectedYear}-01</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 my-4">
          <h1 className="text-2xl font-bold text-primary-950 underline decoration-gold-400 decoration-2 underline-offset-8">
            التقرير المالي والختامي للجمعية
          </h1>
          <p className="text-[13px] text-ink-2 font-sans pt-1">
            عن الفترة الممتدة خلال السنة المالية {selectedYear}
          </p>
        </div>

        {/* Table A: Revenues */}
        <div className="space-y-2 break-inside-avoid">
          <h3 className="font-bold text-sm text-primary-900 border-r-4 border-primary-800 pr-2">
            أولاً: جدول الإيرادات والمداخيل المقبوضة
          </h3>
          <table className="w-full text-right text-[13px] border border-line-strong border-collapse">
            <thead>
              <tr className="bg-primary-900 text-white font-bold">
                <th className="border border-line-strong p-2">الباب / مصدر الدخل</th>
                <th className="border border-line-strong p-2">نوع المداخيل</th>
                <th className="border border-line-strong p-2">توضيحات إضافية</th>
                <th className="border border-line-strong p-2 text-left">المبلغ (د.م)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-line-strong p-2 font-bold">واجبات اشتراك التلاميذ الشهرية</td>
                <td className="border border-line-strong p-2">اشتراكات دراسية</td>
                <td className="border border-line-strong p-2 text-ink-2">مجموع المقبوضات الشهرية من الأولياء</td>
                <td className="border border-line-strong p-2 font-bold text-primary-900 text-left">
                  {formatMoney(totalStudentFeesAmount)}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">تبرعات المحسنين والهبات</td>
                <td className="border border-line-strong p-2">تبرعات عينية ونقدية</td>
                <td className="border border-line-strong p-2 text-ink-2">دعم المحسنين لتجهيز المدرسة والقرآنيات</td>
                <td className="border border-line-strong p-2 font-bold text-primary-900 text-left">
                  {formatMoney(filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">منح الجمعيات والمجالس المؤسساتية</td>
                <td className="border border-line-strong p-2">دعم عمومي</td>
                <td className="border border-line-strong p-2 text-ink-2">منح الجماعة والشركاء المؤسساتيين</td>
                <td className="border border-line-strong p-2 font-bold text-primary-900 text-left">
                  {formatMoney(filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">مداخيل ومساهمات الأنشطة والرحلات</td>
                <td className="border border-line-strong p-2">أنشطة ورحلات</td>
                <td className="border border-line-strong p-2 text-ink-2">مساهمات المشاركين المحصلة آلياً</td>
                <td className="border border-line-strong p-2 font-bold text-primary-900 text-left">
                  {formatMoney(totalActivityContributions)}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">مداخيل متنوعة أخرى واشتراكات</td>
                <td className="border border-line-strong p-2">أنشطة ومسابقات</td>
                <td className="border border-line-strong p-2 text-ink-2">مشاركات ومداخيل متنوعة</td>
                <td className="border border-line-strong p-2 font-bold text-primary-900 text-left">
                  {formatMoney(filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr className="bg-primary-50 font-bold text-primary-950">
                <td colSpan={3} className="border border-line-strong p-2 text-right">
                  مجموع الإيرادات والمداخيل الكلية (أ)
                </td>
                <td className="border border-line-strong p-2 text-left text-sm">
                  {formatMoney(grossTotalIncome)}
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
          <table className="w-full text-right text-[13px] border border-line-strong border-collapse">
            <thead>
              <tr className="bg-sand-800 text-white font-bold">
                <th className="border border-line-strong p-2">الباب / نوع النفقة</th>
                <th className="border border-line-strong p-2">فئة المصاريف</th>
                <th className="border border-line-strong p-2">توضيحات إضافية</th>
                <th className="border border-line-strong p-2 text-left">المبلغ بالدرهم (MAD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-line-strong p-2 font-bold">أجور ومستحقات الأساتذة والمحفظين</td>
                <td className="border border-line-strong p-2">كتلة الأجور</td>
                <td className="border border-line-strong p-2 text-ink-2">تعويضات التأطير والتحفيظ لشيوخ المدرسة</td>
                <td className="border border-line-strong p-2 font-bold text-danger-900 text-left">
                  {formatMoney(filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">أجور الأطر الإدارية وعمال الصيانة</td>
                <td className="border border-line-strong p-2">كتلة الأجور</td>
                <td className="border border-line-strong p-2 text-ink-2">التعويضات الإدارية ونظافة المقر</td>
                <td className="border border-line-strong p-2 font-bold text-danger-900 text-left">
                  {formatMoney(filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">نفقات ومصاريف الأنشطة والرحلات</td>
                <td className="border border-line-strong p-2">أنشطة ورحلات</td>
                <td className="border border-line-strong p-2 text-ink-2">كراء حافلات، إطعام وتأطير الأنشطة</td>
                <td className="border border-line-strong p-2 font-bold text-danger-900 text-left">
                  {formatMoney(totalActivityExpenses)}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">استهلاك الماء والكهرباء والإنترنت</td>
                <td className="border border-line-strong p-2">فواتير وخدمات</td>
                <td className="border border-line-strong p-2 text-ink-2">استهلاك المقر الإداري وقاعات التحفيظ</td>
                <td className="border border-line-strong p-2 font-bold text-danger-900 text-left">
                  {formatMoney(filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr>
                <td className="border border-line-strong p-2 font-bold">المشتريات والتجهيزات والجوائز والصيانة</td>
                <td className="border border-line-strong p-2">تشغيل وتجهيز</td>
                <td className="border border-line-strong p-2 text-ink-2">دروع التكريم، مستلزمات مكتبية وصيانة أجهزة</td>
                <td className="border border-line-strong p-2 font-bold text-danger-900 text-left">
                  {formatMoney(filteredExpenses.filter(e => e.category !== "فواتير وخدمات").reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr className="bg-danger-50 font-bold text-danger-950">
                <td colSpan={3} className="border border-line-strong p-2 text-right">
                  مجموع المصاريف والنفقات الكلية (ب)
                </td>
                <td className="border border-line-strong p-2 text-left text-sm">
                  {formatMoney(grossTotalExpenses)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Balance Box */}
        <div className="bg-gold-50/80 border-2 border-gold-300 rounded-2xl p-4 flex items-center justify-between text-ink break-inside-avoid">
          <div>
            <h4 className="font-bold text-sm">خلاصة الرصيد المالي الصافي للجمعية (أ - ب)</h4>
            <p className="text-[13px] text-ink-2">
              {netBalance >= 0 
                ? "فائض مالي إيجابي مرحل للسنة الموالية" 
                : "عجز مالي يتطلب التغطية من الاحتياطي"}
            </p>
          </div>
          <div className="text-2xl font-bold text-primary-900 dir-ltr">
            <Ltr>{formatNumber(netBalance, { signed: true })}</Ltr> د.م
          </div>
        </div>

        {/* Signatures & Seal Block */}
        <div className="pt-8 border-t border-line-strong space-y-6 break-inside-avoid">
          <div className="grid grid-cols-4 gap-4 text-center text-[13px] font-sans items-start">
            {/* Treasurer */}
            <div className="space-y-2 border border-line p-3 rounded-xl bg-sand-50/50">
              <p className="font-bold text-ink">أمين المال للجمعية</p>
              <p className="font-bold text-primary-900">{systemSettings?.treasurerName || "-"}</p>
              <div className="pt-6 text-ink-3 font-serif text-[11.5px]">(التوقيع والإمضاء)</div>
            </div>

            {/* School Director */}
            <div className="space-y-2 border border-line p-3 rounded-xl bg-sand-50/50">
              <p className="font-bold text-ink">المدير المسؤول للمدرسة</p>
              <p className="font-bold text-primary-900">{systemSettings?.directorName || "-"}</p>
              <div className="pt-6 text-ink-3 font-serif text-[11.5px]">(التوقيع والإمضاء)</div>
            </div>

            {/* Association President */}
            <div className="space-y-2 border border-line p-3 rounded-xl bg-sand-50/50">
              <p className="font-bold text-ink">رئيس الجمعية</p>
              <p className="font-bold text-primary-900">{systemSettings?.presidentName || "-"}</p>
              <div className="pt-6 text-ink-3 font-serif text-[11.5px]">(التوقيع والإمضاء)</div>
            </div>

            {/* Official Seal */}
            <div className="space-y-1 flex flex-col items-center justify-center p-2">
              <div className="w-20 h-20 border-2 border-dashed border-primary-800 rounded-full flex items-center justify-center text-[12.5px] text-primary-900 font-bold p-1.5 text-center opacity-85 bg-primary-50/30">
                {systemSettings?.stampText || "خاتم الجمعية الرسمي"}
              </div>
              <p className="text-[12.5px] text-ink-3 font-medium">مصادق عليه - سلا</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
