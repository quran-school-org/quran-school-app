/**
 * Filtre par catégorie du personnel (puces de la charte, défilement horizontal en mobile).
 */
import { StaffCategory } from "../../types";
import { FilterChips } from "../../ui";
import { STAFF_CATEGORIES_CONFIG } from "./shared";
import { useStaff } from "./StaffContext";

export default function StaffCategoryTabs() {
  const { categoryFilter, setCategoryFilter, archiveFilter, allStaff } = useStaff();
  const inScope = (t: any) => (archiveFilter === "archived" ? t.isArchived : !t.isArchived);
  const options = [
    { value: "all", label: `الكل (${allStaff.filter(inScope).length})` },
    ...(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => ({
      value: cat,
      label: `${STAFF_CATEGORIES_CONFIG[cat].label} (${allStaff.filter((t) => (t.category || "أستاذ / محفظ") === cat && inScope(t)).length})`,
    })),
  ];
  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <FilterChips label="تصفية حسب الفئة" value={categoryFilter} onChange={setCategoryFilter} options={options} className="flex-nowrap sm:flex-wrap min-w-max sm:min-w-0" />
    </div>
  );
}
