/**
 * Examens et attestations (charte « لوحة الكتّاب ») : synthèse des résultats,
 * liste des examens validés, encart d'attestation. Mêmes actions et mêmes droits.
 * Liste du plus récent au plus ancien, filtrable (élève, halaqa, mention,
 * période) et paginée par 20 (D83, ./grades/gradeFilters.ts).
 */
import { useMemo, useState } from "react";
import { Award, FileBadge2, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { checkUserPermission } from "../types";
import { useApp } from "../app/AppContext";
import { isFamilyRole } from "../security/access";
import { navLabel } from "../shell/navModel";
import { Button, Card, EmptyState, GeometricPattern, IconButton, KpiGrid, KpiTile, Ltr, PAGE_SIZES, PageHeader, Pagination, Pill, ProgressBar, SearchInput, Select, usePagination } from "../ui";
import { ALL, EMPTY_GRADE_FILTERS, OVERALL_GRADES, filterGrades, isFiltered, periodOptions, type GradeFilters } from "./grades/gradeFilters";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} aria-hidden="true" />;
const OVERALL_TONE: Record<string, any> = { "ممتاز": "gold", "جيد جداً": "success", "جيد": "primary", "مقبول": "neutral" };
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

export default function GradesScreen() {
  const { students, teachers, classes, grades, currentUser, currentRole, schoolName, handleOpenGradeForm, handleDeleteGrade, handlePrintCertificate } = useApp();
  const [filters, setFilters] = useState<GradeFilters>(EMPTY_GRADE_FILTERS);
  const set = (patch: Partial<GradeFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const visible = useMemo(() => filterGrades(grades, students, filters), [grades, students, filters]);
  const periods = useMemo(() => periodOptions(grades), [grades]);
  const pg = usePagination(visible, PAGE_SIZES.certificates, JSON.stringify(filters));
  const can = (a: "create" | "delete" | "print") => checkUserPermission(currentUser, currentRole, "grades", a);
  const mem = avg(grades.map((g) => Number(g.memorizationGrade) || 0));
  const taj = avg(grades.map((g) => Number(g.tajweedGrade) || 0));
  const excellent = grades.filter((g) => g.overallGrade === "ممتاز").length;
  const family = isFamilyRole(currentRole);
  // UI-21 : sous 8 résultats, ni recherche ni filtres (sauf si un filtre est déjà actif).
  const showFilters = grades.length >= PAGE_SIZES.students || isFiltered(filters);
  const description = currentRole === "ولي أمر"
    ? "نتائج أبنائك وشهاداتهم."
    : currentRole === "طالب"
      ? "نتائجك وشهاداتك."
      : "نتائج امتحانات الحفظ والتجويد التي يشرف عليها معلمو الحلقات، وإصدار الشهادات التقديرية.";

  return (
    <div data-screen="grades" className="flex flex-col gap-6">
      <PageHeader
        title={navLabel(currentRole, "grades")}
        description={description}
        actions={
          can("create") && (
            <Button
              variant="primary"
              data-action="open-grade-form"
              icon={ic(Plus, "w-[18px] h-[18px]")}
              onClick={() => {
                if (students.length > 0) handleOpenGradeForm(students[0].id);
                else alert("يرجى تسجيل طلاب أولاً.");
              }}
            >
              رصد نتيجة اختبار جديدة
            </Button>
          )
        }
      />

      <KpiGrid label="ملخص النتائج" min={170}>
        <KpiTile size="md" label="اختبارات مرصودة" value={grades.length} unit="اختبار" />
        <KpiTile size="md" label="معدل الحفظ" value={mem} unit="/ 20" />
        <KpiTile size="md" label="معدل التجويد" value={taj} unit="/ 20" />
        <KpiTile size="md" label="تقدير ممتاز" value={excellent} unit="طالب" />
      </KpiGrid>

      <div className={family ? "grid grid-cols-1 gap-6 items-start" : "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"}>
        <Card padded={false} className={family ? "overflow-hidden" : "lg:col-span-2 overflow-hidden"} aria-labelledby="grades-title">
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-line-soft">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 id="grades-title" className="m-0 font-display font-semibold text-[20px] text-primary">قائمة شهادات الاختبار المعتمدة</h2>
              <span className="text-[13.5px] text-ink-2">النتائج: <strong className="text-ink tabular-nums">{visible.length}</strong></span>
            </div>
            {grades.length > 0 && showFilters && (
              <div data-grade-filters="" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SearchInput
                  icon={ic(Search)}
                  aria-label="بحث باسم الطالب أو الامتحان"
                  placeholder="بحث باسم الطالب أو الامتحان..."
                  value={filters.query}
                  onChange={(e: any) => set({ query: e.target.value })}
                  className="sm:col-span-3"
                />
                <Select aria-label="الحلقة" data-filter="class" value={filters.classId} onChange={(v) => set({ classId: v })}>
                  <option value={ALL}>جميع الحلقات</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select aria-label="التقدير" data-filter="overall" value={filters.overall} onChange={(v) => set({ overall: v })}>
                  <option value={ALL}>جميع التقديرات</option>
                  {OVERALL_GRADES.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
                <Select aria-label="الفترة" data-filter="period" value={filters.period} onChange={(v) => set({ period: v })} options={[{ value: ALL, label: "جميع الفترات" }, ...periods]} />
              </div>
            )}
            {isFiltered(filters) && (
              <Button size="xs" variant="ghost" className="self-start" icon={ic(RotateCcw, "w-3.5 h-3.5")} onClick={() => setFilters(EMPTY_GRADE_FILTERS)}>
                إعادة تعيين الفلاتر
              </Button>
            )}
          </div>
          {grades.length === 0 ? (
            <div className="p-5"><EmptyState icon={ic(Award, "w-8 h-8")} title="لا نتائج بعد">لم يتم رصد اختبارات أو شهادات تقديرية للطلاب بعد.</EmptyState></div>
          ) : visible.length === 0 ? (
            <div className="p-5"><EmptyState icon={ic(Search, "w-8 h-8")} title="لا نتائج">لا توجد شهادات تطابق خيارات البحث الحالية.</EmptyState></div>
          ) : (
            <ul data-grade-list="" className="m-0 p-0 list-none divide-y divide-line-faint">
              {pg.pageItems.map((gr) => {
                const stud = students.find((s) => s.id === gr.studentId);
                const teacher = teachers.find((t) => t.id === gr.examinerId);
                return (
                  <li key={gr.id} data-grade={gr.id} data-exam-date={gr.examDate} className="px-5 py-4 flex flex-col md:flex-row justify-between gap-4 hover:bg-surface-2">
                    <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 font-sans font-semibold text-[15px] text-ink">{stud?.fullName || "طالب مجهول"}</h3>
                        <Pill tone={OVERALL_TONE[gr.overallGrade] || "neutral"}>{gr.overallGrade}</Pill>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-3">
                        <span>الامتحان: <strong className="font-semibold text-ink-2">{gr.testedPortion}</strong></span>
                        <span>تاريخ الاختبار: <Ltr className="text-ink-2">{gr.examDate}</Ltr></span>
                        {teacher && <span>الممتحن: <span className="text-ink-2">{teacher.fullName}</span></span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                        <div className="flex flex-col gap-1">
                          <span className="flex justify-between text-[12.5px] text-ink-2"><span>درجة الحفظ</span><strong className="tabular-nums text-primary">{gr.memorizationGrade}/20</strong></span>
                          <ProgressBar value={Number(gr.memorizationGrade) || 0} max={20} height={6} className="flex-none" label={`درجة الحفظ ${gr.memorizationGrade} من 20`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="flex justify-between text-[12.5px] text-ink-2"><span>درجة التجويد</span><strong className="tabular-nums text-primary">{gr.tajweedGrade}/20</strong></span>
                          <ProgressBar value={Number(gr.tajweedGrade) || 0} max={20} height={6} tone="gold" className="flex-none" label={`درجة التجويد ${gr.tajweedGrade} من 20`} />
                        </div>
                      </div>
                      {gr.notes && <p className="m-0 text-[13px] bg-surface-2 border border-line-soft rounded-lg px-3 py-2 text-ink-2">«{gr.notes}»</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {can("print") && (
                        <Button size="sm" onClick={() => handlePrintCertificate(stud, gr)} icon={ic(FileBadge2)}>عرض الشهادة التقديرية</Button>
                      )}
                      {can("delete") && (
                        <IconButton size="sm" tone="danger" label="حذف نتيجة الاختبار" onClick={() => handleDeleteGrade(gr.id)}>{ic(Trash2)}</IconButton>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {visible.length > 0 && (
            <div className="px-5 py-3.5 border-t border-line-soft">
              <Pagination
                data-pagination="grades"
                label="ترقيم صفحات قائمة الشهادات"
                page={pg.page}
                pageCount={pg.pageCount}
                onPageChange={pg.setPage}
                summary={`الشهادات ${pg.start}–${pg.end} من ${pg.total}`}
              />
            </div>
          )}
        </Card>

        {!family && <aside aria-label="الشهادة التقديرية" className="relative overflow-hidden rounded-2xl bg-night text-night-text p-6 text-center flex flex-col gap-4">
          <GeometricPattern opacity={0.18} />
          <div className="relative flex flex-col items-center gap-3 rounded-xl border border-gold/40 p-5">
            <span className="w-12 h-12 rounded-full bg-gold/15 text-gold flex items-center justify-center">{ic(Award, "w-6 h-6")}</span>
            <h2 className="m-0 font-display font-semibold text-[20px] text-gold-100">شهادة حفظ وتميز تجويدي</h2>
            <p className="m-0 font-quran text-[17px] leading-loose text-night-text">
              قال رسول الله صلى الله عليه وسلم:<br />
              «الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ»
            </p>
            <span aria-hidden="true" className="block h-px w-2/3 bg-gradient-to-l from-transparent via-gold to-transparent" />
            <p className="m-0 text-[13.5px] text-night-muted leading-relaxed">يصدر النادي شهادات معتمدة مع طباعة أوتوماتيكية للطلاب المتميزين تشجيعاً لهم في مسيرتهم التعليمية مع كتاب الله.</p>
          </div>
          <p className="relative m-0 text-[12.5px] font-semibold text-gold">بإشراف {schoolName}</p>
        </aside>}
      </div>
    </div>
  );
}
