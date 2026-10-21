/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { useStaff } from "./StaffContext";

export default function StaffFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    contractFilter,
    setContractFilter,
    archiveFilter,
    setArchiveFilter,
    viewMode,
    setViewMode,
    allStaff,
  } = useStaff();

  return (
    <>
      {/* Filter Bar, Search, and Status Buttons */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="البحث بالاسم، المسمى، الهاتف، CIN أو المهام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          {/* Contract Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">جميع أنواع التعاقد</option>
              <option value="عقد عمل دائم">عقد عمل دائم</option>
              <option value="عقد مؤقت / بالساعة">عقد مؤقت / بالساعة</option>
              <option value="مكافأة شهرية">مكافأة شهرية</option>
              <option value="تطوعي">تطوعي</option>
              <option value="منحة تدريب">منحة تدريب</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${viewMode === "table" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              title="عرض كجدول"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Status Tab Filters */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setArchiveFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "active" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              النشطون ({allStaff.filter(t => !t.isArchived).length})
            </button>
            <button
              onClick={() => setArchiveFilter("archived")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "archived" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الأرشيف ({allStaff.filter(t => t.isArchived).length})
            </button>
            <button
              onClick={() => setArchiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                archiveFilter === "all" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الكل ({allStaff.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
