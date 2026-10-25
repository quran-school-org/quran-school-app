/** « تقدّم الحفظ » : ḥizb mémorisés sur 60 par élève, filtrés par halaqa. */
import { useState } from "react";
import type { Class, Student } from "../../types";
import { Button, Card, CardHeader, FilterChips } from "../../ui";
import { hizbOf } from "../../ui/HifzMap";
import { activeOnly } from "./dashboardData";

export default function HifzProgress({ students, classes, onOpenStudent }: { students: Student[]; classes: Class[]; onOpenStudent?: (s: Student) => void }) {
  const [klass, setKlass] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const active = activeOnly(students);
  const live = classes.filter((c) => !c.isArchived);
  const liveIds = new Set(live.map((c) => c.id));
  const noClass = active.filter((s) => !s.classId || !liveIds.has(s.classId));
  const tabs = [
    { value: "all", label: `الكل (${active.length})` },
    ...live.map((c) => ({ value: c.id, label: `${c.name} (${active.filter((s) => s.classId === c.id).length})` })),
    ...(noClass.length ? [{ value: "none", label: `بلا حلقة (${noClass.length})` }] : []),
  ];
  const filtered = (klass === "all" ? active : klass === "none" ? noClass : active.filter((s) => s.classId === klass))
    .slice()
    .sort((a, b) => hizbOf(b.hizbCount) - hizbOf(a.hizbCount));
  const visible = showAll ? filtered : filtered.slice(0, 10);
  return (
    <Card className="flex flex-col gap-4" aria-labelledby="progress-title">
      <CardHeader
        id="progress-title"
        title="تقدّم الحفظ"
        description="الأحزاب المحفوظة من 60 لكل طالب، من الأعلى إلى الأدنى."
        actions={<FilterChips label="تصفية حسب الحلقة" value={klass} onChange={(v) => { setKlass(v); setShowAll(false); }} options={tabs} />}
      />
      <div className="flex flex-col">
        {visible.map((s) => {
          const h = hizbOf(s.hizbCount);
          return (
            <div key={s.id} className="grid items-center gap-3 sm:gap-4 py-2.5 border-b border-line-faint" style={{ gridTemplateColumns: "minmax(110px, 200px) minmax(0, 1fr) 72px" }}>
              {onOpenStudent ? (
                <button type="button" onClick={() => onOpenStudent(s)} className="text-start bg-transparent border-0 p-0 text-[14.5px] font-medium text-ink truncate cursor-pointer hover:text-primary hover:underline underline-offset-4 min-h-8">
                  {s.fullName}
                </button>
              ) : (
                <span className="text-[14.5px] font-medium truncate">{s.fullName}</span>
              )}
              <div role="img" aria-label={`${s.fullName}، ${h} من 60 حزباً`} className="relative h-3 rounded-[3px] bg-line-soft overflow-hidden">
                <div className="absolute inset-y-0 start-0 bg-primary" style={{ width: `${(h / 60) * 100}%` }} />
                <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to left, transparent 0, transparent calc(100% / 60 - 1.5px), #F8F8F3 calc(100% / 60 - 1.5px), #F8F8F3 calc(100% / 60))" }} />
                <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to left, transparent 0, transparent calc(100% / 6 - 2px), var(--color-gold) calc(100% / 6 - 2px), var(--color-gold) calc(100% / 6))" }} />
              </div>
              <span className="text-[13.5px] text-ink-2 tabular-nums text-end" dir="ltr"><strong className="text-ink">{h}</strong> / 60</span>
            </div>
          );
        })}
        {visible.length === 0 && <p className="m-0 py-5 text-[14px] text-ink-2">لا يوجد طلاب في هذا التصنيف.</p>}
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <span className="text-[13px] text-ink-3">الخط الذهبي كل 10 أحزاب.</span>
        {filtered.length > 10 && (
          <Button size="sm" onClick={() => setShowAll(!showAll)} className="text-primary">{showAll ? "عرض أقل" : `عرض الطلاب الـ${filtered.length}`}</Button>
        )}
      </div>
    </Card>
  );
}
