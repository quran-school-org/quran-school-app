/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { StaffCategory } from "../../types";
import { Users } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG } from "./shared";
import { useStaff } from "./StaffContext";

export default function StaffCategoryTabs() {
  const {
    categoryFilter,
    setCategoryFilter,
    archiveFilter,
    allStaff,
  } = useStaff();

  return (
    <>
      {/* Categories Tabs Selector */}
      <div className="bg-white p-2 rounded-2xl border border-sand-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            categoryFilter === "all"
              ? "bg-sand-800 text-white shadow-xs"
              : "text-sand-600 hover:bg-sand-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>الكل ({allStaff.filter(t => archiveFilter === "archived" ? t.isArchived : !t.isArchived).length})</span>
        </button>

        {(Object.keys(STAFF_CATEGORIES_CONFIG) as StaffCategory[]).map((cat) => {
          const cfg = STAFF_CATEGORIES_CONFIG[cat];
          const count = allStaff.filter(t => (t.category || "أستاذ / محفظ") === cat && (archiveFilter === "archived" ? t.isArchived : !t.isArchived)).length;
          const isSelected = categoryFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? `${cfg.badgeBg} shadow-xs`
                  : "text-sand-600 hover:bg-sand-100"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? "bg-white/20 text-white" : "bg-sand-200 text-sand-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
