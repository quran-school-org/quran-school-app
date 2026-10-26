/**
 * Choix de la date de séance (UI-09) : « اليوم », « الحصة السابقة » et un
 * sélecteur jour / mois / année de la charte (jamais de <input type="date">
 * natif, qui suit la langue du navigateur et non celle de l'application).
 */
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button, FormField, Select } from "../../ui";
import { MONTHS_AR } from "../../school/businessRules";
import { parseIsoDate } from "../../app/attendanceSessions";

const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** « السبت 25 أكتوبر 2026 » (mois marocains). */
export function dateLabel(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

const daysIn = (year: number, month0: number) => new Date(year, month0 + 1, 0).getDate();
const pad = (n: number) => String(n).padStart(2, "0");

export default function AttendanceDateBar({ date, today, previousDate, onChange }: { date: string; today: string; previousDate: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const d = parseIsoDate(date);
  const year = d.getFullYear();
  const todayYear = parseIsoDate(today).getFullYear();
  const years = Array.from(new Set([todayYear - 2, todayYear - 1, todayYear, todayYear + 1, year])).sort((a, b) => a - b);

  const set = (y: number, m0: number, day: number) => onChange(`${y}-${pad(m0 + 1)}-${pad(Math.min(day, daysIn(y, m0)))}`);

  return (
    <div data-attendance-date className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={date === today ? "primary" : "outline"} aria-pressed={date === today} data-action="attendance-today" onClick={() => onChange(today)}>اليوم</Button>
        <Button data-action="attendance-previous" onClick={() => onChange(previousDate)}>الحصة السابقة</Button>
        <Button variant="ghost" icon={<CalendarDays className="w-4 h-4" strokeWidth={1.75} />} aria-expanded={open} aria-controls="attendance-date-fields" onClick={() => setOpen((v) => !v)}>
          تغيير التاريخ
        </Button>
      </div>
      {open && (
        <div id="attendance-date-fields" role="group" aria-label="تاريخ الحلقة" className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2 max-w-md">
          <FormField label="رقم اليوم">
            {(id) => (
              <Select id={id} value={String(d.getDate())} onChange={(v) => set(year, d.getMonth(), Number(v))}>
                {Array.from({ length: daysIn(year, d.getMonth()) }, (_, i) => <option key={i + 1} value={String(i + 1)}>{String(i + 1)}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="الشهر">
            {(id) => (
              <Select id={id} value={String(d.getMonth())} onChange={(v) => set(year, Number(v), d.getDate())}>
                {MONTHS_AR.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="السنة">
            {(id) => (
              <Select id={id} value={String(year)} onChange={(v) => set(Number(v), d.getMonth(), d.getDate())}>
                {years.map((y) => <option key={y} value={String(y)}>{String(y)}</option>)}
              </Select>
            )}
          </FormField>
        </div>
      )}
    </div>
  );
}
