/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Liste filtrable des activités (charte « لوحة الكتّاب »), même logique qu'auparavant.
 */
import { Compass, MapPin, Calendar, CheckCircle2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "./shared";
import { useActivities } from "./ActivitiesContext";
import { Button, Card, CountBadge, EmptyState, IconButton, Ltr, Pill, SearchInput, Select, cx } from "../../ui";

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

  const TYPE_TONE = (t: string) => (t.includes("مخيم") ? "warn" : "primary");
  const STATUS_TONE: Record<string, any> = { "مكتمل": "neutral", "قيد التسجيل": "primary", "قيد التنفيذ": "success", "ملغى": "danger", "مخطط له": "warn" };

  return (
    <div className="xl:col-span-4 min-w-0">
      <Card className="flex flex-col gap-3" aria-labelledby="activities-list-title">
        <h2 id="activities-list-title" className="m-0 flex items-center gap-2 font-display font-semibold text-[20px] text-primary">
          سجل الأنشطة والرحلات <CountBadge value={filteredActivities.length} tone="gold" />
        </h2>

        <SearchInput aria-label="بحث في الأنشطة" icon={<Search className="w-4 h-4" strokeWidth={1.75} />} value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} placeholder="بحث باسم النشاط أو الوجهة..." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
          <Select aria-label="نوع النشاط" value={typeFilter} onChange={(v) => setTypeFilter(v)}>
            <option value="all">كل الأنواع</option>
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select aria-label="حالة النشاط" value={statusFilter} onChange={(v) => setStatusFilter(v)}>
            <option value="all">كل الحالات</option>
            {ACTIVITY_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2 text-[13px] min-w-0">
          <span className="text-ink-3 shrink-0 flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />ترتيب</span>
          <Select aria-label="ترتيب الأنشطة" value={activitySortKey} onChange={(v) => setActivitySortKey(v)} className="flex-1">
            <option value="startDate">تاريخ الانطلاق</option>
            <option value="title">الاسم الأبجدي</option>
            <option value="contributionFee">قيمة المساهمة</option>
            <option value="participantsCount">عدد المشاركين</option>
            <option value="status">الحالة</option>
          </Select>
          <IconButton
            label={activitySortDir === "asc" ? "ترتيب تصاعدي (انقر للتبديل إلى تنازلي)" : "ترتيب تنازلي (انقر للتبديل إلى تصاعدي)"}
            onClick={() => setActivitySortDir((prev: string) => (prev === "asc" ? "desc" : "asc"))}
          >
            {activitySortDir === "asc" ? <ArrowUp className="w-4 h-4" strokeWidth={1.75} /> : <ArrowDown className="w-4 h-4" strokeWidth={1.75} />}
          </IconButton>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[620px] overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <EmptyState
              icon={<Compass className="w-8 h-8" strokeWidth={1.5} />}
              title="لا توجد أنشطة مطابقة للبحث"
              action={canCreateActivity ? <Button size="sm" onClick={handleOpenAddActivity}>إضافة أول نشاط</Button> : undefined}
            />
          ) : (
            filteredActivities.map((act) => {
              const isSelected = selectedActivityId === act.id;
              const actParts = participants.filter((p) => p.activityId === act.id);
              const actExps = activityExpenses.filter((e) => e.activityId === act.id);
              const totalPaid = actParts.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
              const totalExp = actExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const net = totalPaid - totalExp;
              return (
                <button
                  type="button"
                  key={act.id}
                  data-action="open-activity"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedActivityId(act.id)}
                  className={cx(
                    "w-full text-start p-3.5 rounded-xl border cursor-pointer transition-colors flex flex-col gap-2",
                    isSelected ? "bg-primary-50 border-primary ring-1 ring-primary" : "bg-white border-line hover:border-ink-4",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-1.5 w-full min-w-0">
                    <Pill tone={TYPE_TONE(act.type)} className="max-w-full whitespace-normal! text-start">{act.type}</Pill>
                    <Pill tone={STATUS_TONE[act.status] || "neutral"} className="max-w-full whitespace-normal! text-start">{act.status}</Pill>
                  </span>
                  <span className="font-semibold text-[15px] text-ink line-clamp-1 w-full">{act.title}</span>
                  <span className="flex flex-wrap items-center gap-3 text-[13px] text-ink-3">
                    <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" /><span className="line-clamp-1">{act.location}</span></span>
                    <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /><Ltr>{act.startDate}</Ltr></span>
                  </span>
                  <span className="grid grid-cols-3 gap-1 w-full rounded-lg bg-surface-2 border border-line-soft p-1.5 text-center text-[12.5px] [&>span]:min-w-0 [&>span]:break-words">
                    <span className="flex flex-col"><span className="text-ink-3 text-[11.5px]">المشاركون</span><strong className="text-ink-2 tabular-nums">{actParts.length} {act.maxCapacity ? `/${act.maxCapacity}` : ""}</strong></span>
                    <span className="flex flex-col"><span className="text-ink-3 text-[11.5px]">المساهمة</span><strong className="text-primary tabular-nums">{act.contributionFee} د.م</strong></span>
                    <span className="flex flex-col"><span className="text-ink-3 text-[11.5px]">الصافي</span><strong className={cx("tabular-nums", net >= 0 ? "text-success-700" : "text-danger")}><bdi>{net > 0 ? `+${net}` : net}</bdi> د.م</strong></span>
                  </span>
                  {act.syncedToFinance && (
                    <span className="flex items-center gap-1 text-[12px] text-success-700 font-semibold pt-1.5 border-t border-line-soft w-full">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />تم الربط المالي وتصدير النتائج للمحاسبة الجمعوية
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
