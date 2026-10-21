/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Search, Filter, Coins, Receipt, Briefcase, PieChart } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function FinanceFilterBar() {
  const {
    expenses,
    activeSubTab,
    setActiveSubTab,
    selectedYear,
    setSelectedYear,
    searchQuery,
    setSearchQuery,
  } = useFinance();

  return (
    <>
      {/* Global Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sand-200 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs (The 4 doors requested) */}
        <div className="flex flex-wrap items-center gap-2 bg-sand-100 p-1.5 rounded-2xl">
          <button
            data-subtab="revenues"
            onClick={() => setActiveSubTab("revenues")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "revenues"
                ? "bg-primary-800 text-white shadow-md"
                : "text-sand-600 hover:text-primary-800 hover:bg-white/60"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>1. قسم الإيرادات والمداخيل</span>
          </button>

          <button
            data-subtab="salaries"
            onClick={() => setActiveSubTab("salaries")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "salaries"
                ? "bg-primary-800 text-white shadow-md"
                : "text-sand-600 hover:text-primary-800 hover:bg-white/60"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>2. قسم الأجور والرواتب</span>
          </button>

          <button
            data-subtab="expenses"
            onClick={() => setActiveSubTab("expenses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "expenses"
                ? "bg-primary-800 text-white shadow-md"
                : "text-sand-600 hover:text-primary-800 hover:bg-white/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. قسم المصاريف والمشتريات</span>
          </button>

          <button
            data-subtab="report"
            onClick={() => setActiveSubTab("report")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === "report"
                ? "bg-primary-800 text-white shadow-md"
                : "text-sand-600 hover:text-primary-800 hover:bg-white/60"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>4. تقرير مالي وختامي</span>
          </button>
        </div>

        {/* Global Year/Search Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-sand-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الإيصال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 pl-3 py-1.5 text-xs bg-sand-50 border border-sand-200 rounded-xl focus:bg-white focus:border-primary-500 focus:outline-none w-48"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs bg-sand-50 border border-sand-200 rounded-xl px-3 py-1.5 font-bold text-sand-700 focus:outline-none"
          >
            {[0, 1, 2].map((d) => {
              const y = new Date().getFullYear() - d;
              return <option key={y} value={String(y)}>السنة المالية {y}</option>;
            })}
            <option value="all">جميع السنوات</option>
          </select>
        </div>
      </div>
    </>
  );
}
