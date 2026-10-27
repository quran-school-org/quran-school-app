/**
 * Tableau de bord « لوحة الكتّاب » (maquette design/Main.dc.html), branché sur
 * les données réelles de l'école active.
 */
import { useMemo, useState } from "react";
import { useApp } from "../app/AppContext";
import { buildNavGroups, visibleTabs } from "../shell/navModel";
import { HifzMap, KpiGrid, KpiTile, Legend, PageHeader, StackedBar, TextAction } from "../ui";
import ActionNeeded from "./dashboard/ActionNeeded";
import HifzProgress from "./dashboard/HifzProgress";
import TeacherPerformance from "./dashboard/TeacherPerformance";
import WeeklyAttendance from "./dashboard/WeeklyAttendance";
import { actionAlertCount, busiestHizb, classPlacement, classesLabel } from "./dashboard/dashboardData";
import { CURRENCY, formatNumber } from "../format/money";

const TAJWEED = [
  { key: "ممتاز", color: "var(--color-primary)" },
  { key: "متوسط", color: "var(--color-primary-400)" },
  { key: "ضعيف", color: "var(--color-gold)" },
];

export default function DashboardScreen() {
  const {
    students, teachers, classes, attendance, grades, payments, systemSettings, currentUser, currentRole,
    setActiveTab, setSelectedStudent, totalStudentsCount, advancedStudentsCount,
    excellentTajweedCount, averageTajweedCount, weakTajweedCount, totalPaymentsCollected, totalUnpaidCount,
  } = useApp();

  const tabs = useMemo(() => visibleTabs(buildNavGroups({ currentUser, currentRole, unread: 0 })), [currentUser, currentRole]);
  const canGo = (t: string) => tabs.includes(t);
  const go = (t: string) => setActiveTab(t);
  const active = students.filter((s) => !s.isArchived);
  const [sel, setSel] = useState<number | null>(null);
  const selected = sel ?? busiestHizb(students);
  const placement = classPlacement(students, classes);
  const currencyShort = /درهم/.test(systemSettings?.currency || "درهم") ? CURRENCY : systemSettings?.currency || "";
  const canSeeFees = canGo("payments") || canGo("finance");
  // « تحتاج إجراءً » remonte sous les chiffres clés (avant la carte du ḥifẓ) dès qu'il y a une alerte (D100).
  const urgent = actionAlertCount(students, classes, teachers, canSeeFees ? payments : []) > 0;
  const actionBlock = (wide: boolean) => (
    <ActionNeeded students={students} classes={classes} teachers={teachers} attendance={attendance} payments={canSeeFees ? payments : []} canGo={canGo} go={go} wide={wide} />
  );
  const hifzMap = <HifzMap students={active.map((s) => ({ id: s.id, name: s.fullName, hizb: s.hizbCount }))} selected={selected} onSelect={setSel} />;

  return (
    <div data-screen="dashboard" className="flex flex-col gap-6">
      <PageHeader
        title="لوحة الكتّاب"
        description="حال الحلقات والطلاب والمالية في نظرة واحدة."
      />

      {!urgent && hifzMap}

      <KpiGrid label="مؤشرات رئيسية">
        <KpiTile
          label="الطلاب النشطون"
          value={totalStudentsCount}
          hint={placement.unplaced > 0 ? `${placement.placed} في ${classesLabel(placement.usedClassCount)}، و${placement.unplaced} بلا حلقة بعد` : `جميعهم في ${classesLabel(placement.usedClassCount || placement.liveClasses.length)}`}
        />
        <KpiTile label="بلغوا 20 حزباً فأكثر" value={advancedStudentsCount} hint="مرشحون للختم لاحقاً" />
        <KpiTile
          label="الرسوم المحصّلة"
          value={canSeeFees ? formatNumber(totalPaymentsCollected) : "—"}
          unit={canSeeFees ? currencyShort : undefined}
        >
          {!canSeeFees ? (
            <span className="text-small text-ink-3">غير متاحة لهذا الحساب</span>
          ) : totalUnpaidCount > 0 ? (
            <span className="text-small font-semibold text-danger">
              {canGo("payments") ? <TextAction onClick={() => go("payments")}>{totalUnpaidCount} دفعات غير مسدّدة</TextAction> : `${totalUnpaidCount} دفعات غير مسدّدة`}
            </span>
          ) : (
            <span className="text-small font-semibold text-success-700">لا دفعات متأخرة</span>
          )}
        </KpiTile>
        <KpiTile label="مستوى التجويد">
          <div className="flex flex-col gap-2.5 mt-1">
            <StackedBar
              segments={[
                { label: "ممتاز", value: excellentTajweedCount, color: TAJWEED[0].color },
                { label: "متوسط", value: averageTajweedCount, color: TAJWEED[1].color },
                { label: "ضعيف", value: weakTajweedCount, color: TAJWEED[2].color },
              ]}
            />
            <Legend
              items={[
                { label: `ممتاز ${excellentTajweedCount}`, color: TAJWEED[0].color },
                { label: `متوسط ${averageTajweedCount}`, color: TAJWEED[1].color },
                { label: `ضعيف ${weakTajweedCount}`, color: TAJWEED[2].color },
              ]}
            />
          </div>
        </KpiTile>
      </KpiGrid>

      {urgent && actionBlock(true)}
      {urgent && hifzMap}

      <div className="flex flex-wrap gap-6 items-stretch">
        <TeacherPerformance teachers={teachers} classes={classes} students={students} grades={grades} onAssign={canGo("classes") ? () => go("classes") : undefined} />
        {!urgent && actionBlock(false)}
      </div>

      <WeeklyAttendance attendance={attendance} classes={classes} students={students} />

      <HifzProgress
        students={students}
        classes={classes}
        onOpenStudent={canGo("students") ? (s) => { setSelectedStudent(s); go("students"); } : undefined}
      />
    </div>
  );
}
