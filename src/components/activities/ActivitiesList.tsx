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
        <div className="bg-surface rounded-2xl border border-sand-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-primary flex items-center gap-2">
              <span>سجل الأنشطة والرحلات</span>
              <span className="bg-sand-100 text-ink-2 text-[13px] px-2 py-0.5 rounded-full font-semibold">
                {filteredActivities.length}
              </span>
            </h2>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم النشاط أو الوجهة..."
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pl-3 pr-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
              >
                <option value="all">كل الأنواع</option>
                {ACTIVITY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full"
              >
                <option value="all">كل الحالات</option>
                {ACTIVITY_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Sorting Bar */}
            <div className="flex items-center gap-1.5 pt-1 text-[13px]">
              <span className="text-ink-3 text-[12.5px] font-medium shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-primary-700" />
                <span>ترتيب:</span>
              </span>
              <select
                value={activitySortKey}
                onChange={(e) => setActivitySortKey(e.target.value)}
                className="flex-1 py-1 px-2 text-[13px] bg-sand-50 border border-line rounded-lg text-ink-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="startDate">تاريخ الانطلاق</option>
                <option value="title">الاسم الأبجدي</option>
                <option value="contributionFee">قيمة المساهمة</option>
                <option value="participantsCount">عدد المشاركين</option>
                <option value="status">الحالة</option>
              </select>
              <button
                onClick={() => setActivitySortDir(prev => prev === "asc" ? "desc" : "asc")}
                className="p-1.5 bg-sand-100 hover:bg-sand-200 text-ink-2 rounded-lg transition border border-line flex items-center justify-center shrink-0"
                title={activitySortDir === "asc" ? "ترتيب تصاعدي (انقر للتبديل إلى تنازلي)" : "ترتيب تنازلي (انقر للتبديل إلى تصاعدي)"}
              >
                {activitySortDir === "asc" ? (
                  <ArrowUp className="w-3.5 h-3.5 text-primary-700 font-bold" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-primary-700 font-bold" />
                )}
              </button>
            </div>
          </div>

          {/* Activities List Cards */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-0.5">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 bg-sand-50 rounded-xl border border-dashed border-line p-4">
                <Compass className="w-8 h-8 text-sand-400 mx-auto mb-2" />
                <p className="text-[13px] text-ink-3 font-medium">لا توجد أنشطة مطابقة للبحث</p>
                {canCreateActivity && (
                  <button
                    onClick={handleOpenAddActivity}
                    className="mt-2 text-[13px] text-primary-700 hover:text-primary-800 font-semibold underline"
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
                        ? "bg-primary-50/70 border-primary-500 ring-1 ring-primary-500" 
                        : "bg-white border-line hover:border-primary-300 hover:bg-sand-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[12.5px] font-bold px-2 py-0.5 rounded-md ${
                          act.type === "رحلة استكشافية" ? "bg-primary-100 text-primary-800" :
                          act.type.includes("مخيم") ? "bg-gold-100 text-gold-800" :
                          act.type.includes("رياضي") ? "bg-primary-100 text-primary-800" :
                          "bg-primary-100 text-primary-800"
                        }`}>
                          {act.type}
                        </span>
                        <h3 className="font-bold text-primary text-sm mt-1.5 line-clamp-1">{act.title}</h3>
                      </div>

                      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        act.status === "مكتمل" ? "bg-sand-100 text-ink-2" :
                        act.status === "قيد التسجيل" ? "bg-primary-100 text-primary-800" :
                        act.status === "قيد التنفيذ" ? "bg-primary-100 text-primary-800" :
                        act.status === "ملغى" ? "bg-danger-100 text-danger-800" :
                        "bg-gold-100 text-gold-800"
                      }`}>
                        {act.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[13px] text-ink-3 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-ink-3" />
                        <span className="line-clamp-1">{act.location}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-ink-3" />
                        <span>{act.startDate}</span>
                      </span>
                    </div>

                    {/* Mini Metrics Bar */}
                    <div className="grid grid-cols-3 gap-1 bg-white/80 rounded-lg p-1.5 mt-2.5 border border-line-soft text-center text-[12.5px]">
                      <div>
                        <div className="text-ink-3 text-[11.5px]">المشاركون</div>
                        <div className="font-bold text-ink-2">{actParts.length} {act.maxCapacity ? `/${act.maxCapacity}` : ""}</div>
                      </div>
                      <div>
                        <div className="text-ink-3 text-[11.5px]">المساهمة</div>
                        <div className="font-bold text-primary-700">{act.contributionFee} د.م</div>
                      </div>
                      <div>
                        <div className="text-ink-3 text-[11.5px]">الصافي</div>
                        <div className={`font-bold ${net >= 0 ? "text-primary-700" : "text-danger-700"}`}>
                          {net > 0 ? `+${net}` : net} د.م
                        </div>
                      </div>
                    </div>

                    {act.syncedToFinance && (
                      <div className="flex items-center gap-1 text-[11.5px] text-primary-700 font-semibold mt-2 pt-1 border-t border-primary-100">
                        <CheckCircle2 className="w-3 h-3 text-primary-600" />
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
