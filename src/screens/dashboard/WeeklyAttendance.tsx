/** « الحضور هذا الأسبوع » : taux quotidien comparé à la semaine précédente. */
import { useState } from "react";
import type { Attendance, Class, Student } from "../../types";
import { Card, CardHeader, Select } from "../../ui";
import { weeklyAttendance } from "./dashboardData";

const fmt = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat("ar-MA-u-nu-latn", { day: "numeric", month: "long" }).format(new Date(y, m - 1, day));
  } catch {
    return d;
  }
};

export default function WeeklyAttendance({ attendance, classes, students }: { attendance: Attendance[]; classes: Class[]; students: Student[] }) {
  const [classId, setClassId] = useState("all");
  const live = classes.filter((c) => !c.isArchived);
  const ids = classId === "all" ? null : new Set(students.filter((s) => s.classId === classId).map((s) => s.id));
  const w = weeklyAttendance(attendance, ids);
  const className = classId === "all" ? "جميع الحلقات" : live.find((c) => c.id === classId)?.name || "";
  const empty = w.thisAvg === null;
  return (
    <Card className="flex flex-col gap-[18px]" aria-labelledby="att-title">
      <CardHeader
        id="att-title"
        title="الحضور هذا الأسبوع"
        description="نسبة الحضور اليومية مقارنة بالأسبوع الماضي."
        actions={
          <label className="flex items-center gap-2 text-[14px] text-ink-2">
            الحلقة
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="min-h-10 w-auto">
              <option value="all">جميع الحلقات</option>
              {live.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </label>
        }
      />
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-ink-2">
        <span>هذا الأسبوع <strong className="text-ink tabular-nums">{w.thisAvg === null ? "لا بيانات" : `${w.thisAvg}%`}</strong></span>
        <span>الأسبوع الماضي <strong className="text-ink tabular-nums">{w.lastAvg === null ? "لا بيانات" : `${w.lastAvg}%`}</strong></span>
        {!empty && (
          <span className="flex items-center gap-4 text-[13px]">
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[2px] bg-primary" />هذا الأسبوع</span>
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[2px] bg-primary-200" />الأسبوع الماضي</span>
          </span>
        )}
      </div>
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[420px]">
          {w.thisWeek.map((d, i) => {
            const last = w.lastWeek[i];
            return (
              <div key={d.date} className="flex flex-col items-center gap-2">
                {empty ? (
                  <div aria-hidden="true" className="w-full h-[130px] rounded-[10px] border-[1.5px] border-dashed border-[#CFD2C4] bg-surface-2" />
                ) : (
                  <div role="img" aria-label={`${d.day}: ${d.rate === null ? "لا تسجيل" : d.rate + "%"}، الأسبوع الماضي ${last.rate === null ? "لا تسجيل" : last.rate + "%"}`} className="w-full h-[130px] rounded-[10px] bg-surface-2 border border-line-soft flex items-end justify-center gap-1.5 px-2 pt-6 pb-1.5">
                    <span className="w-1/3 rounded-t-[4px] bg-primary-200" style={{ height: `${last.rate ?? 0}%` }} />
                    <span className="w-1/3 rounded-t-[4px] bg-primary relative" style={{ height: `${d.rate ?? 0}%` }}>
                      {d.rate !== null && <span className="absolute -top-5 inset-x-[-12px] text-center text-[11.5px] font-bold text-ink tabular-nums">{d.rate}%</span>}
                    </span>
                  </div>
                )}
                <span className="text-[13px] text-ink-3">{d.day}</span>
              </div>
            );
          })}
        </div>
        {empty && (
          <div className="absolute inset-x-0 top-0 bottom-7 flex items-center justify-center p-4">
            <p className="m-0 max-w-[46ch] text-center text-[14.5px] leading-[1.7] text-ink-2 bg-surface px-4.5 py-3 rounded-xl border border-line-soft">
              {w.lastRecord
                ? `لم تُسجَّل أي حصة في ${className} منذ ${fmt(w.lastRecord)}. تظهر المقارنة هنا بعد أول تسجيل للحضور.`
                : `لم تُسجَّل أي حصة في ${className} بعد. تظهر المقارنة هنا بعد أول تسجيل للحضور.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
