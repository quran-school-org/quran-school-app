/**
 * Portail de l'enseignant (charte « لوحة الكتّاب ») : la séance du jour et l'appel en premier,
 * puis ses halaqas et ses élèves (ligne entièrement cliquable vers le suivi du ḥifẓ).
 */
import { StudentAvatar } from "../utils/studentAvatar";
import { BookOpen, ChevronLeft, Clock3, UserCheck, Users } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, KpiGrid, KpiTile, Ltr, PageHeader, Pill, ProgressBar } from "../ui";
import { useApp } from "../app/AppContext";
import { formatClock, isAutoAbsence, localIsoDate, todaySession, type SessionState } from "../app/attendanceSessions";

const SESSION_PILL: Record<Exclude<SessionState, "none">, { tone: "primary" | "success" | "neutral"; label: string }> = {
  upcoming: { tone: "neutral", label: "لم تبدأ بعد" },
  ongoing: { tone: "success", label: "الحصة جارية" },
  done: { tone: "neutral", label: "انتهت الحصة" },
};

export default function TeacherDashboardScreen() {
  const {
    students,
    classes,
    attendance,
    setActiveTab,
    setSelectedClassId,
    setAttendanceDate,
    setAttendanceClassPickedFor,
    setShowTeacherStudentFileModal,
    setTeacherSelectedStudent,
    setProgressDate,
    setProgressMemorization,
    setProgressRevision,
    setProgressOldRevision,
    setProgressNotes,
    activeTeacher,
    teacherClasses,
    teacherStudents,
    getStudentAttendanceRate,
    teacherAverageAttendance,
    teacherAverageHizb,
    teacherFurthestHizb,
  } = useApp();

  const openFile = (student: any) => {
    setTeacherSelectedStudent(student);
    setProgressMemorization("");
    setProgressRevision("");
    setProgressOldRevision("");
    setProgressNotes("");
    setProgressDate(new Date().toISOString().split("T")[0]);
    setShowTeacherStudentFileModal(true);
  };
  const TAJWEED_TONE: Record<string, any> = { "ممتاز": "success", "متوسط": "warn" };

  // UI-16 : séance du jour, état de l'appel, accès direct à l'appel avec la bonne halaqa.
  const now = new Date();
  const today = localIsoDate(now);
  const session = todaySession(teacherClasses, now);
  const focus = session?.cls || teacherClasses.find((c) => !c.isArchived) || null;
  const focusStudents = focus ? students.filter((s) => s.classId === focus.id && !s.isArchived) : [];
  const recorded = focusStudents.filter((s) => {
    const rec = attendance.find((a) => a.date === today && a.studentId === s.id);
    return rec && !isAutoAbsence(rec);
  }).length;
  const callState = focusStudents.length === 0 ? "" : recorded === 0 ? "لم يبدأ الرصد بعد" : recorded >= focusStudents.length ? "اكتمل الرصد" : `تم رصد ${recorded} من ${focusStudents.length} طالب`;
  const goToAttendance = () => {
    if (focus) setSelectedClassId(focus.id);
    if (activeTeacher) setAttendanceClassPickedFor(activeTeacher.id);
    setAttendanceDate(today);
    setActiveTab("attendance");
  };

  return (
    <div data-screen="teacher-dashboard" className="flex flex-col gap-6" dir="rtl">
      <PageHeader eyebrow={`مرحباً بك، ${activeTeacher?.fullName || "المحفظ الفاضل"}`} title="لوحة المحفّظ" />

      {focus && (
        <Card data-card="today-session" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" aria-labelledby="today-title">
          <div className="flex flex-col gap-2 min-w-0">
            <h2 id="today-title" className="m-0 font-display font-semibold text-title text-primary">{session ? "حصة اليوم" : "لا حصة اليوم"}</h2>
            <p className="m-0 font-semibold text-lead text-ink">{focus.name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-4 h-4 text-gold-700" strokeWidth={1.75} aria-hidden="true" />
                {session && session.info.start !== null ? <Ltr>{formatClock(session.info.start)}{session.info.end !== null ? ` - ${formatClock(session.info.end)}` : ""}</Ltr> : focus.schedule}
              </span>
              {session && session.info.state !== "none" && <Pill tone={SESSION_PILL[session.info.state].tone} dot>{SESSION_PILL[session.info.state].label}</Pill>}
              {session && callState && <span data-call-state>{callState}</span>}
            </div>
          </div>
          <Button variant={session ? "primary" : "outline"} data-action="take-attendance" className="w-full sm:w-auto shrink-0" onClick={goToAttendance} icon={<UserCheck className="w-5 h-5" strokeWidth={1.75} />}>
            تسجيل الحضور
          </Button>
        </Card>
      )}

      <KpiGrid label="مؤشرات حلقاتي" min={160}>
        <KpiTile size="md" label="الحلقات المسندة" value={teacherClasses.length} hint="فصول دراسية نشطة" />
        <KpiTile size="md" label="إجمالي طلابي" value={teacherStudents.length} hint="طالباً تحت إشرافك" />
        <KpiTile size="md" label="متوسط نسبة الحضور" value={<Ltr>{teacherAverageAttendance}%</Ltr>}>
          <ProgressBar value={teacherAverageAttendance} height={6} className="flex-none mt-2" label={`متوسط الحضور ${teacherAverageAttendance}%`} />
        </KpiTile>
        <KpiTile size="md" label="أبعد حزب بلغه طالب" value={teacherFurthestHizb} unit="حزب" hint={`المعدل: ${teacherAverageHizb}`} />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="flex flex-col gap-3" aria-labelledby="my-classes-title">
          <CardHeader id="my-classes-title" icon={<BookOpen className="w-5 h-5" strokeWidth={1.75} />} title="الحلقات المسندة" actions={<Pill tone="neutral">{teacherClasses.length} حلقات</Pill>} />
          {teacherClasses.length === 0 ? (
            <EmptyState title="لا حلقات">لم يتم إسناد أي حلقات لك بعد في النظام.</EmptyState>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {teacherClasses.map((cls) => {
                const classStudents = students.filter((s) => s.classId === cls.id && !s.isArchived);
                return (
                  <li key={cls.id} className="p-3.5 rounded-xl border border-line bg-white flex flex-col gap-2">
                    <span className="font-semibold text-body text-ink">{cls.name}</span>
                    <span className="flex items-center gap-1.5 text-small text-ink-2"><Clock3 className="w-3.5 h-3.5 text-gold-700" strokeWidth={1.75} aria-hidden="true" />{cls.schedule}</span>
                    <span className="flex justify-between items-center text-small">
                      <span className="text-ink-3">عدد الطلاب</span>
                      <Pill tone="primary">{classStudents.length} / {cls.maxStudents} طالب</Pill>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card padded={false} className="lg:col-span-2 overflow-hidden" aria-labelledby="my-students-title">
          <div className="px-5 py-4 border-b border-line-soft">
            <CardHeader
              id="my-students-title"
              icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
              title="قائمة الطلاب المسجلين بحلقاتك"
              description="اضغط على اسم الطالب لتسجيل الحفظ ومراجعته."
              actions={<Pill tone="primary">إجمالي طلابك: {teacherStudents.length} طلاب</Pill>}
            />
          </div>
          {teacherStudents.length === 0 ? (
            <div className="p-5"><EmptyState title="لا طلاب">لا يوجد طلاب مسجلون بحلقاتك حالياً.</EmptyState></div>
          ) : (
            <ul aria-label="طلابي" className="m-0 p-0 list-none divide-y divide-line-faint">
              {teacherStudents.map((student) => {
                const attRate = getStudentAttendanceRate(student.id);
                const className = classes.find((c) => c.id === student.classId)?.name || "بدون فصل";
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      data-action="open-teacher-student-file"
                      aria-label={`متابعة الحفظ والتجويد: ${student.fullName}`}
                      onClick={() => openFile(student)}
                      className="w-full min-h-16 px-4 sm:px-5 py-3 flex items-center gap-3 bg-transparent border-0 text-start cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-full overflow-hidden bg-sunken border border-line shrink-0">
                        <StudentAvatar student={student} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0 flex-1 md:flex-none md:w-44">
                        <span className="font-semibold text-ink">{student.fullName}</span>
                        <span className="text-small text-ink-3">{className}</span>
                        <span className="md:hidden flex flex-wrap items-center gap-x-3 text-small text-ink-2">
                          <span><strong className="tabular-nums text-primary">{student.hizbCount}</strong> حزب</span>
                          <span>{student.currentSurah || "غير محدد"}</span>
                          <span>الحضور <Ltr>{attRate}%</Ltr></span>
                        </span>
                      </span>
                      <span className="hidden md:flex items-center gap-6 flex-1 min-w-0 text-body text-ink-2">
                        <span className="whitespace-nowrap w-16"><strong className="tabular-nums text-primary">{student.hizbCount}</strong> حزب</span>
                        <span className="flex-1 min-w-[6rem]">{student.currentSurah || "غير محدد"}</span>
                        <span className="flex items-center gap-2 w-36 shrink-0">
                          <Ltr className="font-semibold w-10">{attRate}%</Ltr>
                          <ProgressBar value={attRate} height={6} tone={attRate >= 80 ? "success" : attRate >= 50 ? "gold" : "danger"} label={`نسبة الحضور ${attRate}%`} />
                        </span>
                      </span>
                      <Pill tone={TAJWEED_TONE[student.tajweedLevel] || "danger"} className="shrink-0">{student.tajweedLevel}</Pill>
                      <ChevronLeft className="w-5 h-5 text-ink-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
