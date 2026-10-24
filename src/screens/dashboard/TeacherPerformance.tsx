/** « أداء المحفّظين » : moyennes ḥifẓ / tajwīd ou effectif par muḥaffiẓ (maquette). */
import { useState } from "react";
import type { Class, Grade, Student, Teacher } from "../../types";
import { Card, CardHeader, InitialAvatar, ProgressBar, SegmentedControl, TextAction } from "../../ui";
import { bestClass, studentsLabel, teacherPerformance } from "./dashboardData";

export default function TeacherPerformance({ teachers, classes, students, grades, onAssign }: { teachers: Teacher[]; classes: Class[]; students: Student[]; grades: Grade[]; onAssign?: () => void }) {
  const [mode, setMode] = useState<"scores" | "load">("scores");
  const perf = teacherPerformance(teachers, classes, students, grades);
  const examCount = perf.reduce((a, p) => a + p.exams, 0);
  const best = bestClass(classes, students, grades);
  const muhaffizLabel = perf.length === 1 ? "محفّظ واحد" : perf.length === 2 ? "محفّظان" : `${perf.length} محفّظين`;
  return (
    <Card className="flex-[2_1_520px] flex flex-col gap-[18px]" aria-labelledby="perf-title">
      <CardHeader
        id="perf-title"
        title="أداء المحفّظين"
        description="معدل درجات طلاب كل محفّظ في الحفظ والتجويد، من نتائج الاختبارات المسجّلة."
        actions={
          <SegmentedControl
            label="المؤشر"
            value={mode}
            onChange={setMode}
            options={[{ value: "scores", label: "الحفظ والتجويد" }, { value: "load", label: "عدد الطلاب" }]}
          />
        }
      />
      <div className="flex flex-wrap gap-x-7 gap-y-2 text-[14px] text-ink-2">
        <span><strong className="text-ink tabular-nums">{examCount}</strong> اختبار مسجّل</span>
        <span><strong className="text-ink tabular-nums">{perf.length}</strong> {perf.length > 2 ? "محفّظين" : perf.length === 2 ? "محفّظان" : "محفّظ"}</span>
        {best && <span>أفضل حلقة: <strong className="text-ink">{best.name}</strong></span>}
      </div>
      {perf.length === 0 ? (
        <p className="m-0 py-5 text-[14px] text-ink-2">لا يوجد محفّظون مسجّلون في شؤون العاملين بعد.</p>
      ) : (
        <div className="flex flex-col border-t border-line-soft" aria-label={muhaffizLabel}>
          {perf.map((p, i) => {
            const has = p.classes.length > 0;
            return (
              <div key={p.teacher.id} className={"flex flex-wrap items-center gap-x-6 gap-y-3 py-4" + (i < perf.length - 1 ? " border-b border-line-soft" : "")}>
                <div className="flex items-center gap-3 flex-[1_1_200px] min-w-0">
                  <InitialAvatar name={p.teacher.fullName} tone={has ? "primary" : "muted"} />
                  <span className="flex flex-col min-w-0">
                    <span className="font-semibold text-[15px] truncate">{p.teacher.fullName}</span>
                    <span className="text-[13px] text-ink-3">{has ? `${p.classes.map((c) => c.name).join("، ")}، ${studentsLabel(p.students)}` : "لا حلقة مسندة"}</span>
                  </span>
                </div>
                {!has ? (
                  <div className="flex-[2_1_280px] flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[13.5px] text-ink-2">
                    <span>لا تظهر له نتائج حتى تُسند إليه حلقة.</span>
                    {onAssign && <span className="text-primary"><TextAction onClick={onAssign}>إسناد حلقة</TextAction></span>}
                  </div>
                ) : mode === "scores" ? (
                  <div className="flex-[2_1_280px] flex flex-col gap-2">
                    {p.exams === 0 ? (
                      <span className="text-[13.5px] text-ink-2">لا اختبارات مسجّلة لطلابه بعد.</span>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 text-[13px]">
                          <span className="w-12 text-ink-2">الحفظ</span>
                          <ProgressBar value={p.memo || 0} max={20} label={`الحفظ ${p.memo} من 20`} />
                          <span className="w-12 font-bold tabular-nums" dir="ltr">{p.memo}/20</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px]">
                          <span className="w-12 text-ink-2">التجويد</span>
                          <ProgressBar value={p.tajweed || 0} max={20} tone="gold" label={`التجويد ${p.tajweed} من 20`} />
                          <span className="w-12 font-bold tabular-nums" dir="ltr">{p.tajweed}/20</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-[2_1_280px] flex items-center gap-2.5 text-[13px]">
                    <ProgressBar value={p.students} max={p.capacity || p.students || 1} label={`${p.students} من ${p.capacity} مقعداً`} />
                    <span className="font-bold tabular-nums whitespace-nowrap">{p.students} / {p.capacity} مقعداً</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="m-0 text-[13px] text-ink-3 leading-relaxed">المعدل = مجموع درجات اختبارات طلاب المحفّظ ÷ عدد تلك الاختبارات.</p>
    </Card>
  );
}
