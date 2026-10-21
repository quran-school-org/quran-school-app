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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-emerald-800" />
                  <span>التقرير المالي والختامي للجمعية والمؤسسة</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  لوحة قيادة تفصيلية تظهر توازن الميزانية، ومجموع المداخيل والمصاريف للموافقة عليها في الجمع العام.
                </p>
              </div>

              {canPrint && (
                <button
                  onClick={() => setShowPrintReportModal(true)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة وطباعة التقرير الختامي الرسمية</span>
                </button>
              )}
            </div>

            {/* Income vs Expenses Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gross Income Card */}
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-emerald-800">1. مجموع المداخيل الإجمالية</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-900">
                  {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-emerald-900/80 border-t border-emerald-200/60 pt-3">
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
              <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-rose-800">2. مجموع المصاريف والرواتب</span>
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-3xl font-black text-rose-900">
                  {grossTotalExpenses.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-rose-900/80 border-t border-rose-200/60 pt-3">
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
                  ? "bg-amber-50/70 border-amber-300 text-amber-950" 
                  : "bg-red-50 border-red-300 text-red-950"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold">3. الرصيد المالي الصافي المتبقي</span>
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-3xl font-black">
                  {netBalance.toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs border-t border-amber-200/60 pt-3">
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
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>تفاصيل مصادر المداخيل</span>
                  <span className="text-xs text-emerald-800 font-extrabold">{grossTotalIncome.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مستحقات التلاميذ السنوية والشهرية</p>
                      <p className="text-[11px] text-slate-500">رسوم الاشتراكات المسددة من الأولياء</p>
                    </div>
                    <span className="font-black text-emerald-800">{totalStudentFeesAmount.toLocaleString()} د.م</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">تبرعات المحسنين والأفراد</p>
                      <p className="text-[11px] text-slate-500">تبرعات نقدية وبنكية للمدرسة</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category === "تبرعات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">دعم المؤسسات والمجالس الجماعية</p>
                      <p className="text-[11px] text-slate-500">منح حكومية ومجالس منتخبين</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category === "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مداخيل ومساهمات الأنشطة والرحلات</p>
                      <p className="text-[11px] text-slate-500">مساهمات المشاركين المحصلة آلياً</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {totalActivityContributions.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">مداخيل متنوعة واشتراكات أخرى</p>
                      <p className="text-[11px] text-slate-500">أنشطة ومسابقات ومداخيل أخرى</p>
                    </div>
                    <span className="font-black text-emerald-800">
                      {filteredOtherIncomes.filter(i => i.category !== "تبرعات" && i.category !== "دعم حكومي/مؤسساتي").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>تفاصيل أبواب النفقات والمصاريف</span>
                  <span className="text-xs text-rose-800 font-extrabold">{grossTotalExpenses.toLocaleString()} د.م</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">رواتب ومكافآت الأساتذة والمحفظين</p>
                      <p className="text-[11px] text-slate-500">مستحقات التأطير والتحفيظ</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType === "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">أجور الأطر الإدارية والعمال</p>
                      <p className="text-[11px] text-slate-500">الإدارة، الصيانة والإشراف</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredSalaries.filter(s => s.status === "تم الصرف" && s.personType !== "أستاذ / محفظ").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">نفقات ومصاريف الأنشطة والرحلات</p>
                      <p className="text-[11px] text-slate-500">كراء الحافلات، الإطعام واللوازم</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {totalActivityExpenses.toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">الفواتير، الماء، الكهرباء والخدمات</p>
                      <p className="text-[11px] text-slate-500">استهلاك المقر الإداري والتعليمي</p>
                    </div>
                    <span className="font-black text-rose-800">
                      {filteredExpenses.filter(e => e.category === "فواتير وخدمات").reduce((s, x) => s + x.amount, 0).toLocaleString()} د.م
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">التجهيزات، الصيانة واللوازم العامة</p>
                      <p className="text-[11px] text-slate-500">جوائز، أدوات مكتبية وإصلاحات</p>
                    </div>
                    <span className="font-black text-rose-800">
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
