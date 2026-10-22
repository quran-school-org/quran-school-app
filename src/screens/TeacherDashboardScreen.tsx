/**
 * Portail de l'enseignant (charte « لوحة الكتّاب ») : ses halaqas, ses élèves, le suivi du ḥifẓ.
 */
import { StudentAvatar } from "../utils/studentAvatar";
import React from "react";
import { BookOpen, Clock3, NotebookPen, Users } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, KpiGrid, KpiTile, PageHeader, Pill, ProgressBar, Table, TableWrap, Td, Th, Tr } from "../ui";
import { useApp } from "../app/AppContext";

export default function TeacherDashboardScreen() {
  const {
    students,
    classes,
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

  return (
    <div data-screen="teacher-dashboard" className="flex flex-col gap-6" dir="rtl">
      <PageHeader
        eyebrow="بوابة المدرس والمحفّظ"
        title={`مرحباً بك، ${activeTeacher?.fullName || "المحفظ الفاضل"}`}
        description="تتيح لك هذه اللوحة استعراض الحلقات والطلاب المسندين إليك، وإدخال بيانات الحفظ اليومية، ومتابعة تطور مستويات التجويد لطلابك."
        actions={
          activeTeacher?.specialty && (
            <div className="rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px]">
              <p className="m-0 text-ink-3">التخصص الحالي</p>
              <p className="m-0 font-semibold text-ink">{activeTeacher.specialty}</p>
              {activeTeacher.trainingCourses && activeTeacher.trainingCourses.length > 0 && <p className="m-0 mt-1 text-[12.5px] text-ink-2">{activeTeacher.trainingCourses[0]}</p>}
            </div>
          )
        }
      />

      <KpiGrid label="مؤشرات حلقاتي" min={160}>
        <KpiTile size="md" label="الحلقات المسندة" value={teacherClasses.length} hint="فصول دراسية نشطة" />
        <KpiTile size="md" label="إجمالي طلابي" value={teacherStudents.length} hint="طالباً تحت إشرافك" />
        <KpiTile size="md" label="متوسط نسبة الحضور" value={`${teacherAverageAttendance}%`}>
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
                    <span className="font-semibold text-[15px] text-ink">{cls.name}</span>
                    <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2"><Clock3 className="w-3.5 h-3.5 text-gold-700" strokeWidth={1.75} aria-hidden="true" />{cls.schedule}</span>
                    <span className="flex justify-between items-center text-[13px]">
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
              description='انقر على "متابعة الحفظ والتجويد" لتسجيل الحفظ ومراجعة الطالب.'
              actions={<Pill tone="primary">إجمالي طلابك: {teacherStudents.length} طلاب</Pill>}
            />
          </div>
          {teacherStudents.length === 0 ? (
            <div className="p-5"><EmptyState title="لا طلاب">لا يوجد طلاب مسجلون بحلقاتك حالياً.</EmptyState></div>
          ) : (
            <TableWrap label="طلابي">
              <Table>
                <thead>
                  <tr>
                    <Th>اسم الطالب</Th>
                    <Th>الحفظ الفعلي</Th>
                    <Th>السورة الحالية</Th>
                    <Th>التجويد</Th>
                    <Th>نسبة الحضور</Th>
                    <Th className="text-center">الملف التعليمي</Th>
                  </tr>
                </thead>
                <tbody>
                  {teacherStudents.map((student) => {
                    const attRate = getStudentAttendanceRate(student.id);
                    return (
                      <Tr key={student.id}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-full overflow-hidden bg-sunken border border-line shrink-0">
                              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
                            </span>
                            <span className="flex flex-col">
                              <span className="font-semibold text-ink">{student.fullName}</span>
                              <span className="text-[12.5px] text-ink-3">{classes.find((c) => c.id === student.classId)?.name || "بدون فصل"}</span>
                            </span>
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap"><strong className="tabular-nums text-primary">{student.hizbCount}</strong> حزب</Td>
                        <Td>{student.currentSurah || "غير محدد"}</Td>
                        <Td><Pill tone={TAJWEED_TONE[student.tajweedLevel] || "danger"}>{student.tajweedLevel}</Pill></Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <span className="tabular-nums font-semibold text-ink-2 w-10">{attRate}%</span>
                            <ProgressBar value={attRate} height={6} tone={attRate >= 80 ? "success" : attRate >= 50 ? "gold" : "danger"} label={`نسبة الحضور ${attRate}%`} />
                          </div>
                        </Td>
                        <Td className="text-center">
                          <Button size="sm" className="whitespace-nowrap" data-action="open-teacher-student-file" onClick={() => openFile(student)} icon={<NotebookPen className="w-3.5 h-3.5" strokeWidth={1.75} />}>
                            متابعة الحفظ والتجويد
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
}
