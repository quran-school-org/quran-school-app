/**
 * Tableau de bord « لوحة الكتّاب » (maquette design/Main.dc.html), branché sur
 * les données réelles de l'école active.
 */
import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useApp } from "../app/AppContext";
import { buildNavGroups, visibleTabs } from "../shell/navModel";
import { Button, HifzMap, KpiGrid, KpiTile, Legend, PageHeader, StackedBar, TextAction } from "../ui";
import ActionNeeded from "./dashboard/ActionNeeded";
import HifzProgress from "./dashboard/HifzProgress";
import TeacherPerformance from "./dashboard/TeacherPerformance";
import WeeklyAttendance from "./dashboard/WeeklyAttendance";
import { busiestHizb, classPlacement, classesLabel } from "./dashboard/dashboardData";

const TAJWEED = [
  { key: "ممتاز", color: "#1B3A6B" },
  { key: "متوسط", color: "#5B7FB0" },
  { key: "ضعيف", color: "#D4A017" },
];

export default function DashboardScreen() {
  const {
    students, teachers, classes, attendance, grades, payments, systemSettings, currentUser, currentRole,
    setActiveTab, setSelectedStudent, totalStudentsCount, advancedStudentsCount,
    excellentTajweedCount, averageTajweedCount, weakTajweedCount, totalPaymentsCollected, totalUnpaidCount,
    handleBackupRealmDB, handleRestoreRealmDB,
  } = useApp();

  const tabs = useMemo(() => visibleTabs(buildNavGroups({ currentUser, currentRole, unread: 0 })), [currentUser, currentRole]);
  const canGo = (t: string) => tabs.includes(t);
  const go = (t: string) => setActiveTab(t);
  const active = students.filter((s) => !s.isArchived);
  const [sel, setSel] = useState<number | null>(null);
  const selected = sel ?? busiestHizb(students);
  const placement = classPlacement(students, classes);
  const currencyShort = /درهم/.test(systemSettings?.currency || "درهم") ? "د.م" : systemSettings?.currency || "";
  const canSeeFees = canGo("payments") || canGo("finance");

  return (
    <div data-screen="dashboard" className="flex flex-col gap-6">
      <PageHeader
        title="لوحة الكتّاب"
        description="حال الحلقات والطلاب والمالية في نظرة واحدة."
        actions={
          <>
            <Button id="manual-db-backup-btn" onClick={handleBackupRealmDB} title="تحميل نسخة احتياطية كاملة من قاعدة البيانات كملف JSON" icon={<Download className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
              تنزيل نسخة احتياطية
            </Button>
            <input type="file" id="restore-backup-file-input" accept=".json" onChange={handleRestoreRealmDB} className="hidden" />
            <Button id="manual-db-restore-btn" onClick={() => document.getElementById("restore-backup-file-input")?.click()} title="استرجاع قاعدة البيانات كاملة من ملف JSON احتياطي" icon={<RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
              استرجاع نسخة
            </Button>
          </>
        }
      />

      <HifzMap students={active.map((s) => ({ id: s.id, name: s.fullName, hizb: s.hizbCount }))} selected={selected} onSelect={setSel} />

      <KpiGrid label="مؤشرات رئيسية">
        <KpiTile
          label="الطلاب النشطون"
          value={totalStudentsCount}
          hint={placement.unplaced > 0 ? `${placement.placed} في ${classesLabel(placement.usedClassCount)}، و${placement.unplaced} بلا حلقة بعد` : `جميعهم في ${classesLabel(placement.usedClassCount || placement.liveClasses.length)}`}
        />
        <KpiTile label="بلغوا 20 حزباً فأكثر" value={advancedStudentsCount} hint="مرشحون للختم لاحقاً" />
        <KpiTile
          label="الرسوم المحصّلة"
          value={canSeeFees ? totalPaymentsCollected.toLocaleString("en-US") : "—"}
          unit={canSeeFees ? currencyShort : undefined}
        >
          {!canSeeFees ? (
            <span className="text-[13.5px] text-ink-3">غير متاحة لهذا الحساب</span>
          ) : totalUnpaidCount > 0 ? (
            <span className="text-[13.5px] font-semibold text-danger">
              {canGo("payments") ? <TextAction onClick={() => go("payments")}>{totalUnpaidCount} دفعات غير مسدّدة</TextAction> : `${totalUnpaidCount} دفعات غير مسدّدة`}
            </span>
          ) : (
            <span className="text-[13.5px] font-semibold text-success-700">لا دفعات متأخرة</span>
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

      <div className="flex flex-wrap gap-6 items-stretch">
        <TeacherPerformance teachers={teachers} classes={classes} students={students} grades={grades} onAssign={canGo("classes") ? () => go("classes") : undefined} />
        <ActionNeeded students={students} classes={classes} teachers={teachers} attendance={attendance} payments={canSeeFees ? payments : []} canGo={canGo} go={go} />
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
