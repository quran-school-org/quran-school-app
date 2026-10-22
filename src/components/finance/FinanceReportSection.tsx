/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Expense } from "../../types";
import { TrendingUp, TrendingDown, Printer, Coins, PieChart } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function FinanceReportSection() {
  const {
    canPrint,
    activeSubTab,
    setShowPrintReportModal,
    totalStudentFeesAmount,
    totalActivityContributions,
    totalActivityExpenses,
    filteredOtherIncomes,
    totalOtherIncomeAmount,
    grossTotalIncome,
    filteredSalaries,
    totalPaidSalaries,
    filteredExpenses,
    totalExpensesAmount,
    grossTotalExpenses,
    netBalance,
    cashBoxNetBalance,
    bankAccountNetBalance,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* 4. SECTION: FINANCIAL SUMMARY & CLOSING REPORT (تقرير مالي وختامي) */}
      {/* ========================================================================================= */}
      {activeSubTab === "report" && (
        <div className="space-y-6">
          {/* Detailed Financial Dashboard */}
          <div className="bg-surface rounded-3xl border border-line p-6 sm:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line-soft pb-6">
              <div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-primary-800" />
                  <span>التقرير المالي والختامي للجمعية والمؤسسة</span>
                </h3>
                <p className="text-[13px] text-ink-3 mt-1">
                  لوحة قيادة تفصيلية تظهر توازن الميزانية، ومجموع المداخيل والمصاريف للموافقة عليها في الجمع العام.
                </p>
              </div>

              {canPrint && (
                <button
                  onClick={() => setShowPrintReportModal(true)}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة وطباعة التقرير الختامي الرسمية</span>
                </button>
              )}
            </div>

            {/* Income vs Expenses Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gross Income Card */}
              <div className="bg-primary-50/60 rounded-2xl p-5 border border-primary-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-bold text-primary-800">1. مجموع المداخيل الإجمالية</span>
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-primary-900">
                  {grossTotalIncome.toLocaleString()} <span className="text-[13px] font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-[13px] text-primary-900/80 border-t border-primary-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>واجبات التلاميذ الشهرية:</span>
                    <span className="font-bold">{totalStudentFeesAmount.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التبرعات والدعم والأنشطة:</span>
                    <span className="font-bold">{totalOtherIncomeAmount.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>

              {/* Gross Expenses Card */}
              <div className="bg-danger-50/60 rounded-2xl p-5 border border-danger-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-bold text-danger-800">2. مجموع المصاريف والرواتب</span>
                  <TrendingDown className="w-5 h-5 text-danger-600" />
                </div>
                <div className="text-3xl font-bold text-danger-900">
                  {grossTotalExpenses.toLocaleString()} <span className="text-[13px] font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-[13px] text-danger-900/80 border-t border-danger-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>كتلة الأجور المصروفة:</span>
                    <span className="font-bold">{totalPaidSalaries.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مصاريف ونفقات التشغيل:</span>
                    <span className="font-bold">{totalExpensesAmount.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>

              {/* Net Balance Card */}
              <div className={`rounded-2xl p-5 border ${
                netBalance >= 0 
                  ? "bg-gold-50/70 border-gold-300 text-gold-950" 
                  : "bg-danger-50 border-danger-300 text-danger-950"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-bold">3. الرصيد المالي الصافي المتبقي</span>
                  <Coins className="w-5 h-5 text-gold-600" />
                </div>
                <div className="text-3xl font-bold">
                  {netBalance.toLocaleString()} <span className="text-[13px] font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-[13px] border-t border-gold-200/60 pt-3">
                  <div className="flex justify-between">
                    <span>صافي صندوق النقدية:</span>
                    <span className="font-bold">{cashBoxNetBalance.toLocaleString()} د.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>صافي الحساب البنكي:</span>
                    <span className="font-bold">{bankAccountNetBalance.toLocaleString()} د.م</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income and Expenses Detailed Breakdown Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Income Breakdown Box */}
              <div className="bg-sand-50 p-5 rounded-2xl border border-line space-y-3">
                <h4 className="font-bold text-sm text-ink border-b border-line pb-2 flex items-center justify-between">
                  <span>تفاصيل مصادر المداخيل</span>
                  <span className="text-[13px] text-primary-800 font-bold">{grossTotalIncome.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-[13px]">
                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">مستحقات التلاميذ السنوية والشهرية</p>
                      <p className="text-[12.5px] text-ink-3">رسوم الاشتراكات المسددة من الأولياء</p>
                    </div>
                    <span className="font-bold text-primary-800">{totalStudentFeesAmount.toLocaleString()} د.م</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">تبرعات المحسنين والأفراد</p>
                      <p className="text-[12.5px] text-ink-3">تبرعات نقدية وبنكية للمدرسة</p>
                    </div>
                    <span className="font-bold text-primary-800">
                      {filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">دعم المؤسسات والمجالس الجماعية</p>
                      <p className="text-[12.5px] text-ink-3">منح حكومية ومجالس منتخبين</p>
                    </div>
                    <span className="font-bold text-primary-800">
                      {filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">مداخيل ومساهمات الأنشطة والرحلات</p>
                      <p className="text-[12.5px] text-ink-3">مساهمات المشاركين المحصلة آلياً</p>
                    </div>
                    <span className="font-bold text-primary-800">
                      {totalActivityContributions.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">مداخيل متنوعة واشتراكات أخرى</p>
                      <p className="text-[12.5px] text-ink-3">أنشطة ومسابقات ومداخيل أخرى</p>
                    </div>
                    <span className="font-bold text-primary-800">
                      {filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown Box */}
              <div className="bg-sand-50 p-5 rounded-2xl border border-line space-y-3">
                <h4 className="font-bold text-sm text-ink border-b border-line pb-2 flex items-center justify-between">
                  <span>تفاصيل أبواب النفقات والمصاريف</span>
                  <span className="text-[13px] text-danger-800 font-bold">{grossTotalExpenses.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-[13px]">
                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">رواتب ومكافآت الأساتذة والمحفظين</p>
                      <p className="text-[12.5px] text-ink-3">مستحقات التأطير والتحفيظ</p>
                    </div>
                    <span className="font-bold text-danger-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">أجور الأطر الإدارية والعمال</p>
                      <p className="text-[12.5px] text-ink-3">الإدارة، الصيانة والإشراف</p>
                    </div>
                    <span className="font-bold text-danger-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">نفقات ومصاريف الأنشطة والرحلات</p>
                      <p className="text-[12.5px] text-ink-3">كراء الحافلات، الإطعام واللوازم</p>
                    </div>
                    <span className="font-bold text-danger-800">
                      {totalActivityExpenses.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">الفواتير، الماء، الكهرباء والخدمات</p>
                      <p className="text-[12.5px] text-ink-3">استهلاك المقر الإداري والتعليمي</p>
                    </div>
                    <span className="font-bold text-danger-800">
                      {filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-line flex justify-between items-center">
                    <div>
                      <p className="font-bold text-ink">التجهيزات، الصيانة واللوازم العامة</p>
                      <p className="text-[12.5px] text-ink-3">جوائز، أدوات مكتبية وإصلاحات</p>
                    </div>
                    <span className="font-bold text-danger-800">
                      {filteredExpenses.filter(e => e.category !== "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
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
