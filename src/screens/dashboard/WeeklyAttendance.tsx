/** « الحضور هذا الأسبوع » : taux quotidien comparé à la semaine précédente. */
import { useState } from "react";
import type { Attendance, Class, Student } from "../../types";
import { Card, CardHeader, Ltr, Select } from "../../ui";
import { weeklyAttendance } from "./dashboardData";
import { formatDateAr } from "../../format/date";
import { localIsoDate, scheduledWeekdays, sessionInfo, settledAttendance } from "../../app/attendanceSessions";

export default function WeeklyAttendance({ attendance, classes, students }: { attendance: Attendance[]; classes: Class[]; students: Student[] }) {
  const [classId, setClassId] = useState("all");
  const live = classes.filter((c) => !c.isArchived);
  const ids = classId === "all" ? null : new Set(students.filter((s) => s.classId === classId).map((s) => s.id));
  const className = classId === "all" ? "جميع الحلقات" : live.find((c) => c.id === classId)?.name || "";
  const now = new Date();
  // UI-20 : une séance n'est comptée qu'une fois terminée ; seuls les jours de séance sont affichés.
  const w = weeklyAttendance(settledAttendance(attendance, students, live, now), ids, now);
  const scope = classId === "all" ? live : live.filter((c) => c.id === classId);
  const weekdays = scheduledWeekdays(scope);
  const todayIso = localIsoDate(now);
  const todayStates = scope.map((c) => sessionInfo(c, todayIso, now).state);
  const running = todayStates.includes("ongoing");
  const pending = running || todayStates.includes("upcoming");
  // index 0 = samedi ; getDay() : 0 = dimanche.
  const shown = w.thisWeek
    .map((d, i) => ({ d, last: w.lastWeek[i], i }))
    .filter(({ d, last, i }) => weekdays.has((i + 6) % 7) || d.records > 0 || last.records > 0);
  const pendingDay = (date: string, rate: number | null) => date === todayIso && pending && rate === null;
  const pendingLabel = running ? "الحصة جارية" : "لم تبدأ بعد";
  const aria = (day: string, rate: number | null, lastRate: number | null, date: string) =>
    pendingDay(date, rate) ? `${day}: ${pendingLabel}` : `${day}: ${rate === null ? "لا تسجيل" : rate + "%"}، الأسبوع الماضي ${lastRate === null ? "لا تسجيل" : lastRate + "%"}`;
  // Aucun relevé cette semaine (constat 20) : message explicite au lieu de cases vides.
  const empty = w.thisAvg === null;
  // Une phrase par élément : chacune se traduit séparément en mode français.
  const emptyLines = [
    classId === "all" ? "لم يُسجَّل حضور هذا الأسبوع بعد." : `لم يُسجَّل حضور هذا الأسبوع بعد في ${className}.`,
    w.lastRecord ? `آخر حصة مسجّلة: ${formatDateAr(w.lastRecord)}.` : "",
    running ? "الحصة جارية الآن، وتُحتسب نسبتها عند انتهائها." : pending ? "لم تبدأ حصة اليوم بعد." : "تظهر المقارنة هنا بعد أول تسجيل للحضور.",
  ].filter(Boolean);
  const pct = (r: number | null) => (r === null ? "لا بيانات" : <Ltr>{r}%</Ltr>);

  return (
    <Card className="flex flex-col gap-[18px]" aria-labelledby="att-title">
      <CardHeader
        id="att-title"
        title="الحضور هذا الأسبوع"
        description="نسبة الحضور اليومية مقارنة بالأسبوع الماضي."
        actions={
          <label className="flex items-center gap-2 text-body text-ink-2">
            الحلقة
            <Select aria-label="الحلقة" value={classId} onChange={(v) => setClassId(v)} size="sm" className="w-auto">
              <option value="all">جميع الحلقات</option>
              {live.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </label>
        }
      />
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-body text-ink-2">
        <span>هذا الأسبوع <strong className="text-ink tabular-nums">{pct(w.thisAvg)}</strong></span>
        <span>الأسبوع الماضي <strong className="text-ink tabular-nums">{pct(w.lastAvg)}</strong></span>
        {!empty && (
          <span className="flex items-center gap-4 text-small">
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[2px] bg-primary" />هذا الأسبوع</span>
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[2px] bg-primary-200" />الأسبوع الماضي</span>
          </span>
        )}
      </div>

      {empty || shown.length === 0 ? (
        <p data-weekly="empty" className="m-0 text-center text-body leading-[1.7] text-ink-2 bg-surface-2 px-4.5 py-6 rounded-xl border-[1.5px] border-dashed border-line-strong">{emptyLines.map((line, i) => <span key={i}>{i > 0 && " "}{line}</span>)}</p>
      ) : (
        <>
          {/* Téléphone : une barre horizontale par jour de séance. */}
          <ul data-weekly="rows" className="sm:hidden m-0 p-0 list-none flex flex-col gap-3">
            {shown.map(({ d, last }) => (
              <li key={d.date} role="img" aria-label={aria(d.day, d.rate, last.rate, d.date)} className="flex items-center gap-3">
                <span className="w-[4.5rem] shrink-0 text-small text-ink-3">{d.day}</span>
                {pendingDay(d.date, d.rate) ? (
                  <span className="flex-1 text-small font-semibold text-ink-2">{pendingLabel}</span>
                ) : (
                  <>
                    <span aria-hidden="true" className="flex-1 flex flex-col gap-1">
                      <span className="block h-3 rounded-full bg-primary" style={{ width: `${d.rate ?? 0}%`, minWidth: d.rate ? undefined : 0 }} />
                      <span className="block h-2 rounded-full bg-primary-200" style={{ width: `${last.rate ?? 0}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-end text-small font-bold text-ink tabular-nums">{d.rate === null ? "—" : <Ltr>{d.rate}%</Ltr>}</span>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div data-weekly="columns" className="hidden sm:grid gap-3" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
            {shown.map(({ d, last }) => (
              <div key={d.date} className="flex flex-col items-center gap-2">
                {pendingDay(d.date, d.rate) ? (
                  <div role="img" aria-label={aria(d.day, d.rate, last.rate, d.date)} className="w-full h-[130px] rounded-[10px] border-[1.5px] border-dashed border-line-strong bg-surface-2 flex items-center justify-center text-center px-2 text-small font-semibold text-ink-2">{pendingLabel}</div>
                ) : (
                  <div role="img" aria-label={aria(d.day, d.rate, last.rate, d.date)} className="w-full h-[130px] rounded-[10px] bg-surface-2 border border-line-soft flex items-end justify-center gap-1.5 px-2 pt-6 pb-1.5">
                    <span className="w-1/3 rounded-t-[4px] bg-primary-200" style={{ height: `${last.rate ?? 0}%` }} />
                    <span className="w-1/3 rounded-t-[4px] bg-primary relative" style={{ height: `${d.rate ?? 0}%` }}>
                      {d.rate !== null && <span className="absolute -top-5 inset-x-[-12px] text-center text-caption font-bold text-ink tabular-nums"><Ltr>{d.rate}%</Ltr></span>}
                    </span>
                  </div>
                )}
                <span className="text-small text-ink-3">{d.day}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
