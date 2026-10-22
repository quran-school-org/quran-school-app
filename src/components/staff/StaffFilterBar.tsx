/**
 * Recherche, type de contrat, affichage (cartes / tableau) et statut d'archivage.
 */
import { Search, LayoutGrid, List } from "lucide-react";
import { SearchInput, SegmentedControl, Select } from "../../ui";
import { useStaff } from "./StaffContext";

export default function StaffFilterBar() {
  const { searchQuery, setSearchQuery, contractFilter, setContractFilter, archiveFilter, setArchiveFilter, viewMode, setViewMode, allStaff } = useStaff();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 flex-[1_1_420px]">
        <SearchInput
          icon={<Search className="w-4 h-4" strokeWidth={1.75} />}
          aria-label="البحث في الطاقم"
          placeholder="البحث بالاسم، المسمى، الهاتف، CIN أو المهام..."
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
          className="flex-[1_1_260px] max-w-md"
        />
        <Select aria-label="نوع التعاقد" value={contractFilter} onChange={(e: any) => setContractFilter(e.target.value)} className="w-auto">
          <option value="all">جميع أنواع التعاقد</option>
          <option value="عقد عمل دائم">عقد عمل دائم</option>
          <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
          <option value="مكافأة شهرية">مكافأة شهرية</option>
          <option value="تطوعي">تطوعي</option>
          <option value="منحة تدريب">منحة تدريب</option>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <SegmentedControl
          label="طريقة العرض"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "grid", label: <span className="sr-only">عرض كبطاقات</span>, icon: <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />, attrs: { title: "عرض كبطاقات" } },
            { value: "table", label: <span className="sr-only">عرض كجدول</span>, icon: <List className="w-4 h-4" strokeWidth={1.75} />, attrs: { title: "عرض كجدول" } },
          ]}
        />
        <SegmentedControl
          label="حالة الأرشفة"
          value={archiveFilter}
          onChange={setArchiveFilter}
          options={[
            { value: "active", label: `النشطون (${allStaff.filter((t) => !t.isArchived).length})` },
            { value: "archived", label: `الأرشيف (${allStaff.filter((t) => t.isArchived).length})` },
            { value: "all", label: `الكل (${allStaff.length})` },
          ]}
        />
      </div>
    </div>
  );
}
