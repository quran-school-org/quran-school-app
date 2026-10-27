/** « تحتاج إجراءً » : alertes calculées à partir des données réelles de l'école. */
import React from "react";
import { BookOpen, CheckCircle2, CreditCard, ShieldAlert, UserCheck } from "lucide-react";
import type { Attendance, Class, Payment, Student, Teacher } from "../../types";
import { ActionAlert, Card, CardHeader, TextAction } from "../../ui";
import { classPlacement, classesWithoutTeacher, missingDocuments, studentsLabel, weeklyAttendance } from "./dashboardData";

const icon = (C: any) => <C className="w-5 h-5" strokeWidth={1.75} />;

export default function ActionNeeded({ students, classes, teachers, attendance, payments, canGo, go, wide = false }: {
  students: Student[]; classes: Class[]; teachers: Teacher[]; attendance: Attendance[]; payments: Payment[];
  canGo: (tab: string) => boolean; go: (tab: string) => void;
  /** Pleine largeur (bloc remonté sous les chiffres clés) : les alertes se répartissent sur deux colonnes. */
  wide?: boolean;
}) {
  const missing = missingDocuments(students);
  const noTeacher = classesWithoutTeacher(classes, teachers);
  const { unplaced } = classPlacement(students, classes);
  const week = weeklyAttendance(attendance, null);
  const unpaid = payments.filter((p) => p.status === "غير مدفوع");
  const link = (tab: string, label: string) => (canGo(tab) ? <TextAction onClick={() => go(tab)}>{label}</TextAction> : undefined);

  const items: React.ReactNode[] = [];
  if (missing.length > 0) {
    items.push(
      <ActionAlert key="docs" tone="danger" icon={icon(ShieldAlert)} title={`${studentsLabel(missing.length)} بوثائق ناقصة`} action={link("students", "مراجعة الملفات")}>
        البطاقة الوطنية لولي الأمر أو عقد الازدياد أو الصور غير مسجّلة في الملف.
      </ActionAlert>,
    );
  }
  if (noTeacher.length > 0 || unplaced > 0) {
    const inside = noTeacher.reduce((a, c) => a + students.filter((s) => !s.isArchived && s.classId === c.id).length, 0);
    const title = noTeacher.length === 1 ? `${noTeacher[0].name} بلا محفّظ` : noTeacher.length > 1 ? `${noTeacher.length} حلقات بلا محفّظ` : `${studentsLabel(unplaced)} بلا حلقة`;
    const parts: string[] = [];
    if (noTeacher.length > 0) parts.push(`${studentsLabel(inside)} ${inside === 1 ? "مسجّل" : "مسجّلون"} دون مشرف`);
    if (unplaced > 0 && noTeacher.length > 0) parts.push(`و${studentsLabel(unplaced)} بلا حلقة`);
    items.push(
      <ActionAlert key="classes" tone="warn" icon={icon(BookOpen)} title={title} action={link("classes", "تنظيم الحلقات")}>
        {noTeacher.length > 0 ? `${parts.join("، ")}.` : "أسندهم إلى حلقة ليظهر تقدّمهم في تقارير المحفّظين."}
      </ActionAlert>,
    );
  }
  if (unpaid.length > 0) {
    const sum = unpaid.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    items.push(
      <ActionAlert key="fees" tone="warn" icon={icon(CreditCard)} title={`${unpaid.length} ${unpaid.length > 10 ? "دفعة" : "دفعات"} غير مسدّدة`} action={link("payments", "متابعة الرسوم")}>
        مجموع المستحقات المعلّقة {sum} درهم.
      </ActionAlert>,
    );
  }
  if (week.thisAvg === null) {
    items.push(
      <ActionAlert key="att" tone="neutral" icon={icon(UserCheck)} title="لا حضور مسجّل هذا الأسبوع" action={link("attendance", "تسجيل الحضور")}>
        تُحسب نسب الحضور بعد تسجيل أول حصة في الأسبوع.
      </ActionAlert>,
    );
  }
  return (
    <Card data-block="action-needed" className={wide ? "flex flex-col gap-3.5" : "flex-[1_1_300px] flex flex-col gap-3.5"} aria-labelledby="actions-title">
      <CardHeader id="actions-title" title="تحتاج إجراءً" />
      {items.length > 0 ? (wide ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">{items}</div> : items) : (
        <ActionAlert tone="success" icon={icon(CheckCircle2)} title="لا شيء يحتاج إجراءً الآن">
          الوثائق مكتملة، والحلقات مؤطّرة، والحضور مسجّل هذا الأسبوع.
        </ActionAlert>
      )}
    </Card>
  );
}
