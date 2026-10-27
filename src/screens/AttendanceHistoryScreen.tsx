/**
 * Présences en LECTURE SEULE (UI-02, D89) : par élève, les séances de la plus
 * récente à la plus ancienne. Pour les familles (lignes déjà filtrées sur leurs
 * enfants par l'abonnement et les règles) et pour la pédagogie hors مدير / مدرس
 * (إداري, مؤطر : les règles leur donnent la lecture, pas la saisie ici).
 */
import { useMemo, useState } from "react";
import { UserCheck } from "lucide-react";
import { useApp } from "../app/AppContext";
import { isFamilyRole } from "../security/access";
import { navLabel } from "../shell/navModel";
import { Card, CardHeader, EmptyState, FilterChips, FormField, PageHeader, Pagination, Pill, Select, usePagination, type PillTone } from "../ui";
import { countStatuses, sessionsOf } from "./family/familySummary";
import { formatDateAr } from "../format/date";

/** Séances par page (les tailles de D83 ne concernent que les élèves et les attestations). */
const SESSIONS_PER_PAGE = 12;
const TONE: Record<string, PillTone> = { "حاضر": "success", "متأخر": "warn", "غائب": "danger" };

function weekday(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("ar-MA-u-nu-latn", { weekday: "long" }).format(d);
  } catch {
    return "";
  }
}

export default function AttendanceHistoryScreen() {
  const { students, classes, attendance, currentRole, selectedStudent } = useApp();
  const family = isFamilyRole(currentRole);
  const list = useMemo(() => students.filter((s) => family || !s.isArchived), [students, family]);
  const [pickedId, setPickedId] = useState<string>(selectedStudent?.id || "");
  const student = list.find((s) => s.id === pickedId) || list[0] || null;
  const sessions = useMemo(() => (student ? sessionsOf(attendance, student.id) : []), [attendance, student]);
  const counts = countStatuses(sessions);
  const pg = usePagination(sessions, SESSIONS_PER_PAGE, student?.id || "");
  const klass = student ? classes.find((c) => c.id === student.classId) : undefined;
  const description = currentRole === "ولي أمر"
    ? "حضور أبنائك في كل حصة، من الأحدث إلى الأقدم."
    : currentRole === "طالب"
      ? "حضورك في كل حصة، من الأحدث إلى الأقدم."
      : "اطّلع على سجل حضور كل طالب، من الأحدث إلى الأقدم. التسجيل من اختصاص المحفّظ والمدير.";

  return (
    <div data-screen="attendance-history" className="flex flex-col gap-6">
      <PageHeader title={navLabel(currentRole, "attendance")} description={description} />

      {!student ? (
        <EmptyState icon={<UserCheck className="w-8 h-8" strokeWidth={1.5} />} title="لا يوجد طلاب">لا يوجد طالب يمكن عرض حضوره.</EmptyState>
      ) : (
        <>
          {list.length > 1 && (family ? (
            <FilterChips label="الطالب" value={student.id} onChange={setPickedId} options={list.map((s) => ({ value: s.id, label: s.fullName }))} />
          ) : (
            <FormField label="الطالب" className="max-w-md">
              {(id) => <Select id={id} value={student.id} onChange={setPickedId} options={list.map((s) => ({ value: s.id, label: s.fullName }))} />}
            </FormField>
          ))}

          <Card padded={false} className="overflow-hidden" aria-labelledby="attendance-history-title">
            <div className="px-5 py-4 border-b border-line-soft">
              <CardHeader
                id="attendance-history-title"
                title={student.fullName}
                description={klass?.name}
                actions={
                  <span className="flex flex-wrap gap-2" data-attendance-counts="">
                    <Pill tone="success">{counts.present} حاضر</Pill>
                    <Pill tone="warn">{counts.late} متأخر</Pill>
                    <Pill tone="danger">{counts.absent} غائب</Pill>
                  </span>
                }
              />
            </div>
            {sessions.length === 0 ? (
              <div className="p-5"><EmptyState icon={<UserCheck className="w-8 h-8" strokeWidth={1.5} />} title="لا حصص مسجلة">لم يُسجَّل حضور هذا الطالب بعد.</EmptyState></div>
            ) : (
              <ul data-attendance-list="" className="m-0 p-0 list-none divide-y divide-line-faint">
                {pg.pageItems.map((a) => (
                  <li key={a.id} data-session={a.date} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                    <span className="flex flex-col min-w-0">
                      <span className="text-body font-semibold text-ink">{weekday(a.date)}</span>
                      <span className="text-small text-ink-2">{formatDateAr(a.date)}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 justify-end">
                      {a.notes && <span className="text-small text-ink-3 max-w-[40ch]">{a.notes}</span>}
                      <Pill tone={TONE[a.status] || "neutral"}>{a.status}</Pill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {sessions.length > 0 && (
              <div className="px-5 py-3.5 border-t border-line-soft">
                <Pagination
                  data-pagination="attendance"
                  label="ترقيم صفحات سجل الحضور"
                  page={pg.page}
                  pageCount={pg.pageCount}
                  onPageChange={pg.setPage}
                  summary={`الحصص ${pg.start}–${pg.end} من ${pg.total}`}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
