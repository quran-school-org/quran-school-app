/**
 * Comptabilité : sections (recettes, salaires, dépenses, rapport), recherche et
 * exercice (charte « لوحة الكتّاب »). Mêmes états qu'auparavant.
 */
import React from "react";
import { Briefcase, Coins, PieChart, Receipt, Search } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { SearchInput, SegmentedControl, Select } from "../../ui";

const ic = (C: any) => <C className="w-4 h-4" strokeWidth={1.75} />;

export default function FinanceFilterBar() {
  const { activeSubTab, setActiveSubTab, selectedYear, setSelectedYear, searchQuery, setSearchQuery } = useFinance();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SegmentedControl
        label="أقسام المحاسبة"
        value={activeSubTab}
        onChange={setActiveSubTab}
        options={[
          { value: "revenues", label: "الإيرادات والمداخيل", icon: ic(Coins), attrs: { "data-subtab": "revenues" } },
          { value: "salaries", label: "الأجور والرواتب", icon: ic(Briefcase), attrs: { "data-subtab": "salaries" } },
          { value: "expenses", label: "المصاريف والمشتريات", icon: ic(Receipt), attrs: { "data-subtab": "expenses" } },
          { value: "report", label: "تقرير مالي وختامي", icon: ic(PieChart), attrs: { "data-subtab": "report" } },
        ]}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <SearchInput aria-label="بحث في السجلات المالية" icon={<Search className="w-4 h-4" strokeWidth={1.75} />} placeholder="بحث بالاسم أو رقم الإيصال..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-56" />
        <Select aria-label="السنة المالية" value={selectedYear} onChange={(e: any) => setSelectedYear(e.target.value)} className="w-auto">
          {[0, 1, 2].map((d) => {
            const y = new Date().getFullYear() - d;
            return <option key={y} value={String(y)}>السنة المالية {y}</option>;
          })}
          <option value="all">جميع السنوات</option>
        </Select>
      </div>
    </div>
  );
}
