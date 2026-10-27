/**
 * Accueil « ملخص » des familles (parent, élève ; UI-01, D89) : une carte par
 * enfant qui répond à « était-il là, où en est-il, suis-je à jour ? ».
 * Lecture seule. Données déjà filtrées sur les enfants du compte : halaqas
 * (lisibles par tous les membres), élèves, présences, examens, paiements
 * (parents seulement). Le محفظ n'est affiché que si sa fiche est lisible
 * (le personnel pédagogique la lit, pas les familles : UI-03).
 */
import type { ReactNode } from "react";
import { Award, BookOpen, CalendarCheck, CreditCard, GraduationCap, UserRound } from "lucide-react";
import { useApp } from "../app/AppContext";
import { navLabel } from "../shell/navModel";
import { StudentAvatar } from "../utils/studentAvatar";
import { Button, Card, EmptyState, HifzBar, PageHeader, Pill, hizbOf, type PillTone } from "../ui";
import { ABSENCE_WINDOW_DAYS, countStatuses, feeOfMonth, lastGradeOf, monthLabel, recentSessions, sessionsOf } from "./family/familySummary";
import { formatDateAr } from "../format/date";
import { formatMoney } from "../format/money";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} aria-hidden="true" />;
const OVERALL_TONE: Record<string, PillTone> = { "ممتاز": "gold", "جيد جداً": "success", "جيد": "primary", "مقبول": "neutral" };

function Line({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-line-faint last:border-b-0">
      <span className="mt-0.5 text-gold-700 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <span className="text-[13px] text-ink-2">{label}</span>
        <div className="text-[14.5px] text-ink">{children}</div>
      </div>
    </div>
  );
}

export default function FamilyHomeScreen() {
  const {
    students, classes, teachers, attendance, grades, payments, currentRole, getSubscriptionAmount,
    setSelectedStudent, setActiveTab,
  } = useApp();
  const isParent = currentRole === "ولي أمر";
  const now = new Date();
  const month = monthLabel(now);
  const open = (st: (typeof students)[number], tab: string) => { setSelectedStudent(st); setActiveTab(tab); };

  return (
    <div data-screen="home" className="flex flex-col gap-6">
      <PageHeader
        title={navLabel(currentRole, "home")}
        description={isParent ? "أين وصل أبناؤك: الحفظ، الحضور، آخر امتحان ورسوم هذا الشهر." : "أين وصلت: حفظك، حضورك وآخر امتحان لك."}
      />

      {students.length === 0 ? (
        <EmptyState icon={ic(UserRound, "w-8 h-8")} title="لا يوجد ملف مرتبط بحسابك">
          لم يُربط حسابك بأي طالب بعد. تواصل مع إدارة المدرسة لربطه.
        </EmptyState>
      ) : (
        <div className={students.length > 1 ? "grid grid-cols-1 xl:grid-cols-2 gap-6 items-start" : "grid grid-cols-1 max-w-3xl gap-6"}>
          {students.map((st) => {
            const klass = classes.find((c) => c.id === st.classId);
            const teacher = klass ? teachers.find((t) => t.id === klass.teacherId) : undefined;
            const hizb = hizbOf(st.hizbCount);
            const exam = lastGradeOf(grades, st.id);
            const recent = countStatuses(recentSessions(sessionsOf(attendance, st.id), now));
            const fee = feeOfMonth(payments, st.id, now);
            return (
              <Card key={st.id} as="article" data-child={st.id} aria-labelledby={`child-${st.id}`} className="flex flex-col gap-4">
                <header className="flex items-center gap-3.5">
                  <span className="w-14 h-14 rounded-full overflow-hidden bg-sunken border-2 border-gold shrink-0">
                    <StudentAvatar student={st} alt="" className="w-full h-full object-cover" />
                  </span>
                  <div className="min-w-0">
                    <h2 id={`child-${st.id}`} className="m-0 font-display font-semibold text-[22px] leading-snug text-primary">{st.fullName}</h2>
                    <p className="m-0 text-[14px] text-ink-2">
                      {klass ? klass.name : "بلا حلقة"}
                      {st.isArchived && <> · <Pill tone="neutral">مؤرشف</Pill></>}
                    </p>
                  </div>
                </header>

                <div className="flex flex-col">
                  {teacher && (
                    <Line icon={ic(GraduationCap)} label="المحفظ">{teacher.fullName}</Line>
                  )}
                  <Line icon={ic(BookOpen)} label="الحفظ">
                    <div className="flex flex-col gap-2">
                      <HifzBar hizb={hizb} label={`${st.fullName}، ${hizb} من 60 حزباً`} />
                      <span className="text-[13.5px] text-ink-2"><strong className="text-ink tabular-nums">{hizb}</strong> / 60 حزباً{st.currentSurah ? <> · السورة الحالية: {st.currentSurah}</> : null}</span>
                    </div>
                  </Line>
                  <Line icon={ic(Award)} label="آخر امتحان">
                    {exam ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <Pill tone={OVERALL_TONE[exam.overallGrade] || "neutral"}>{exam.overallGrade}</Pill>
                          <span className="text-[13.5px] text-ink-2">{exam.testedPortion}</span>
                        </span>
                        <span className="text-[13.5px] text-ink-2">
                          الحفظ <strong className="text-ink tabular-nums">{exam.memorizationGrade}/20</strong> · التجويد <strong className="text-ink tabular-nums">{exam.tajweedGrade}/20</strong> · {formatDateAr(exam.examDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-ink-2">لم يُرصد أي امتحان بعد.</span>
                    )}
                  </Line>
                  <Line icon={ic(CalendarCheck)} label={`الحضور في آخر ${ABSENCE_WINDOW_DAYS} يوماً`}>
                    <span className="flex flex-wrap items-center gap-2">
                      <Pill tone={recent.absent > 0 ? "danger" : "success"}>{recent.absent > 0 ? `${recent.absent} غياب` : "بلا غياب"}</Pill>
                      {recent.late > 0 && <Pill tone="warn">{recent.late} تأخر</Pill>}
                    </span>
                  </Line>
                  {isParent && (
                    <Line icon={ic(CreditCard)} label={`رسوم ${month}`}>
                      {fee.kind === "paid" && <Pill tone="success">مدفوع</Pill>}
                      {fee.kind === "unpaid" && (
                        <span className="flex flex-wrap items-center gap-2">
                          <Pill tone="danger">غير مدفوع</Pill>
                          <span className="text-[13.5px] text-ink-2"><strong className="text-ink tabular-nums">{formatMoney(fee.payment.amount || getSubscriptionAmount(fee.payment.month, Number(fee.payment.year)))}</strong></span>
                        </span>
                      )}
                      {fee.kind === "none" && <span className="text-ink-2">لا توجد رسوم مسجلة لهذا الشهر.</span>}
                    </Line>
                  )}
                </div>

                <footer className="flex flex-wrap gap-2.5 pt-1">
                  <Button size="sm" variant="primary" data-action="open-child-file" onClick={() => open(st, "students")}>ملف الطالب</Button>
                  <Button size="sm" data-action="open-child-attendance" onClick={() => open(st, "attendance")}>سجل الحضور</Button>
                  <Button size="sm" data-action="open-child-grades" onClick={() => open(st, "grades")}>النتائج</Button>
                </footer>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
