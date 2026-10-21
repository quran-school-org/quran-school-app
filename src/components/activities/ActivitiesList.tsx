/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Compass, MapPin, Calendar, CheckCircle2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "./shared";
import { useActivities } from "./ActivitiesContext";

export default function ActivitiesList() {
  const {
    participants,
    activityExpenses,
    canCreateActivity,
    selectedActivityId,
    setSelectedActivityId,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    activitySortKey,
    setActivitySortKey,
    activitySortDir,
    setActivitySortDir,
    filteredActivities,
    handleOpenAddActivity,
  } = useActivities();

  return (
    <>
      {/* Left Column: Activities List (5 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span>سجل الأنشطة والرحلات</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                {filteredActivities.length}
              </span>
            </h2>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم النشاط أو الوجهة..."
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل الأنواع</option>
                {ACTIVITY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل الحالات</option>
                {ACTIVITY_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Sorting Bar */}
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                <span>ترتيب:</span>
              </span>
              <select
                value={activitySortKey}
                onChange={(e) => setActivitySortKey(e.target.value)}
                className="flex-1 py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="startDate">تاريخ الانطلاق</option>
                <option value="title">الاسم الأبجدي</option>
                <option value="contributionFee">قيمة المساهمة</option>
                <option value="participantsCount">عدد المشاركين</option>
                <option value="status">الحالة</option>
              </select>
              <button
                onClick={() => setActivitySortDir(prev => prev === "asc" ? "desc" : "asc")}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200 flex items-center justify-center shrink-0"
                title={activitySortDir === "asc" ? "ترتيب تصاعدي (انقر للتبديل إلى تنازلي)" : "ترتيب تنازلي (انقر للتبديل إلى تصاعدي)"}
              >
                {activitySortDir === "asc" ? (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                )}
              </button>
            </div>
          </div>

          {/* Activities List Cards */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-0.5">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">لا توجد أنشطة مطابقة للبحث</p>
                {canCreateActivity && (
                  <button
                    onClick={handleOpenAddActivity}
                    className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                  >
                    إضافة أول نشاط
                  </button>
                )}
              </div>
            ) : (
              filteredActivities.map((act) => {
                const isSelected = selectedActivityId === act.id;
                const actParts = participants.filter(p => p.activityId === act.id);
                const actExps = activityExpenses.filter(e => e.activityId === act.id);
                const totalPaid = actParts.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
                const totalExp = actExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                const net = totalPaid - totalExp;

                return (
                  <div
                    key={act.id}
                    data-action="open-activity"
                    onClick={() => setSelectedActivityId(act.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500" 
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          act.type === "رحلة استكشافية" ? "bg-blue-100 text-blue-800" :
                          act.type.includes("مخيم") ? "bg-amber-100 text-amber-800" :
                          act.type.includes("رياضي") ? "bg-emerald-100 text-emerald-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {act.type}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm mt-1.5 line-clamp-1">{act.title}</h3>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        act.status === "مكتمل" ? "bg-slate-100 text-slate-700" :
                        act.status === "قيد التسجيل" ? "bg-emerald-100 text-emerald-800" :
                        act.status === "قيد التنفيذ" ? "bg-blue-100 text-blue-800" :
                        act.status === "ملغى" ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {act.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="line-clamp-1">{act.location}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{act.startDate}</span>
                      </span>
                    </div>

                    {/* Mini Metrics Bar */}
                    <div className="grid grid-cols-3 gap-1 bg-white/80 rounded-lg p-1.5 mt-2.5 border border-slate-100 text-center text-[11px]">
                      <div>
                        <div className="text-slate-400 text-[10px]">المشاركون</div>
                        <div className="font-bold text-slate-700">{actParts.length} {act.maxCapacity ? `/${act.maxCapacity}` : ""}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">المساهمة</div>
                        <div className="font-bold text-emerald-700">{act.contributionFee} د.م</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">الصافي</div>
                        <div className={`font-bold ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {net > 0 ? `+${net}` : net} د.م
                        </div>
                      </div>
                    </div>

                    {act.syncedToFinance && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-2 pt-1 border-t border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>تم الربط المالي وتصدير النتائج للمحاسبة الجمعوية</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
