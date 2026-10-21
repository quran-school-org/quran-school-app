/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Printer, ShieldCheck } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function FinanceHeader() {
  const {
    canPrint,
    selectedYear,
    setShowPrintReportModal,
    grossTotalIncome,
    grossTotalExpenses,
    netBalance,
    cashBoxNetBalance,
    bankAccountNetBalance,
  } = useFinance();

  return (
    <>
      {/* Top Main Title & Action Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                النظام المالي الموحد للجمعيات
              </span>
              <span className="bg-white/10 text-white/80 text-xs px-2.5 py-1 rounded-full">
                السنة المالية: {selectedYear}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              إدارة المحاسبة والمالية الجمعوية
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              تتبع شامل وإلكتروني لمستحقات التلاميذ، الأجور والرواتب، المصاريف والنفقات، وإعداد التقرير المالي والختامي المعتمد للجمعية.
            </p>
          </div>

          {canPrint && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowPrintReportModal(true)}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-5 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير المالي الختامي</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Finance Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-emerald-700/50">
          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">إجمالي المداخيل</span>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {grossTotalIncome.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">رسوم تلاميذ + تبرعات ودعم</span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">إجمالي المصاريف والرواتب</span>
            <div className="text-2xl font-black text-rose-300 mt-1">
              {grossTotalExpenses.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">أجور مصروفة + مشتريات وفواتير</span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">الرصيد الصافي المتبقي</span>
            <div className={`text-2xl font-black mt-1 ${netBalance >= 0 ? "text-amber-300" : "text-rose-400"}`}>
              {netBalance.toLocaleString()} <span className="text-xs font-normal">د.م</span>
            </div>
            <span className="text-[11px] text-emerald-200/60 mt-1 block">
              {netBalance >= 0 ? "فائض مالية الجمعية" : "عجز مالية الجمعية"}
            </span>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-600/30">
            <span className="text-emerald-200/70 text-xs font-medium block">توزيع الأرصدة الحالية</span>
            <div className="text-xs font-bold text-white mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-200">الصندوق:</span>
                <span className="font-bold text-amber-300">{cashBoxNetBalance.toLocaleString()} د.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">البنك:</span>
                <span className="font-bold text-teal-300">{bankAccountNetBalance.toLocaleString()} د.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
