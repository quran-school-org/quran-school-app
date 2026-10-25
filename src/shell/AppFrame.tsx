/**
 * Cadre de l'application branché sur l'état : menu (bureau et tiroir mobile),
 * barre du haut, bandeau de quota, pied de page. Remplace l'ancien en-tête,
 * l'ancien menu émeraude et la barre mobile (mêmes actions, mêmes droits).
 */
import React, { useEffect, useMemo } from "react";
import SchoolSwitcher from "../school/SchoolSwitcher";
import { useApp } from "../app/AppContext";
import { AppShell, Emblem, NavBrand, SideNav, Topbar } from "../ui";
import { buildNavGroups, visibleTabs } from "./navModel";
import QuotaBanner from "./QuotaBanner";

const SYNC_TEXT = {
  synced: { dot: "#7FC56B", text: "قاعدة البيانات متصلة، والبيانات متزامنة الآن" },
  syncing: { dot: "var(--color-gold)", text: "جارٍ الاتصال بقاعدة البيانات ومزامنة البيانات…" },
  error: { dot: "#E08A7E", text: "تعذّر الاتصال بقاعدة البيانات، العمل على النسخة المحلية" },
} as const;

export function formatToday(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("ar-MA-u-nu-latn", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().split("T")[0];
  }
}

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const {
    currentUser, currentRole, activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen,
    systemSettings, schoolName, syncStatus, userNotifications, accountOwnerName, handleOpenProfileModal,
    handleLogout, firestoreQuotaExceeded, isStaffOrAdmin, totalStudentsCount, teacherStudents,
    parentStudentsCount, currentStudentObj, furthestHizb, teacherFurthestHizb, parentFurthestHizb,
    setSelectedStudent,
  } = useApp();

  const unread = userNotifications.filter((n) => !n.isRead).length;
  const groups = useMemo(() => buildNavGroups({ currentUser, currentRole, unread }), [currentUser, currentRole, unread]);
  const tabs = visibleTabs(groups);
  const tabsKey = tabs.join("|");

  // Onglet de départ : si l'onglet actif n'est pas dans le menu du rôle
  // (ex. « dashboard » pour un enseignant ou un parent), on ouvre le premier
  // onglet disponible au lieu d'une page vide (D39).
  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabsKey, activeTab]);

  const go = (tab: string, closeDrawer = false) => {
    setActiveTab(tab);
    if (closeDrawer) setIsMobileMenuOpen(false);
  };

  const logo = systemSettings?.associationLogo ? (
    <span className="w-11 h-11 rounded-xl bg-white p-1 inline-flex items-center justify-center overflow-hidden">
      <img src={systemSettings.associationLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
    </span>
  ) : (
    <Emblem size={44} />
  );

  const statsTarget = () => {
    if (currentRole === "طالب") {
      go("students");
      if (currentStudentObj) setSelectedStudent(currentStudentObj);
    } else if (currentRole === "مدرس") {
      go(tabs.includes("teacher-dashboard") ? "teacher-dashboard" : "dashboard");
    } else if (currentRole === "ولي أمر") {
      go("students");
    } else {
      go("dashboard");
    }
  };

  const statsLabel = isStaffOrAdmin ? "إحصائيات الإدارة" : currentRole === "مدرس" ? "إحصائيات الحلقة" : currentRole === "ولي أمر" ? "ملخص أبنائك" : "ملخص الحفظ الشخصي";
  const statsValue = isStaffOrAdmin ? totalStudentsCount : currentRole === "مدرس" ? teacherStudents.length : currentRole === "ولي أمر" ? parentStudentsCount : currentStudentObj ? currentStudentObj.hizbCount : 0;
  const statsUnit = currentRole === "طالب" ? "حزب محفوظ" : currentRole === "ولي أمر" ? "أبناء" : "طلاب";
  const statsSecond = currentRole === "طالب"
    ? (currentStudentObj ? (currentStudentObj.tajweedLevel || "متوسط") : "-")
    : isStaffOrAdmin ? `${furthestHizb} حزب` : currentRole === "مدرس" ? `${teacherFurthestHizb} حزب` : `${parentFurthestHizb} حزب`;
  const statsSecondLabel = currentRole === "طالب" ? "مستوى التجويد" : "أبعد حزب بلغه طالب";
  const sync = SYNC_TEXT[syncStatus];

  const footer = (closeDrawer: boolean) => (
    <>
      <button
        type="button"
        onClick={() => { statsTarget(); if (closeDrawer) setIsMobileMenuOpen(false); }}
        title={currentRole === "طالب" ? "الانتقال إلى ملف الحفظ والتجويد الشخصي" : "استعراض الإحصائيات"}
        className="text-start border border-night-line-2 rounded-[14px] p-3.5 flex flex-col gap-1.5 bg-night/85 hover:bg-white/[0.06] cursor-pointer transition-colors text-night-text"
      >
        <span className="text-[12.5px] text-night-soft">{statsLabel}</span>
        <span className="flex items-end justify-between gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-bold tabular-nums text-white leading-none">{statsValue}</span>
            <span className="text-[12.5px] text-night-muted">{statsUnit}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-[14px] font-semibold text-gold tabular-nums">{statsSecond}</span>
            <span className="text-[11.5px] text-night-muted">{statsSecondLabel}</span>
          </span>
        </span>
      </button>
      <div className="flex items-center gap-2.5 px-1.5 text-[12.5px] text-night-soft" role="status">
        <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ background: sync.dot }} />
        <span>{sync.text}</span>
      </div>
    </>
  );

  const brand = <NavBrand logo={logo} name={schoolName} subtitle="نادي القرآن الكريم" onClick={() => go(tabs[0] || "dashboard", true)} />;
  const season = (systemSettings?.activeAcademicSeason || "").trim().replace("/", "–");

  return (
    <AppShell
      sidebar={<SideNav navId="desktop" brand={brand} groups={groups} active={activeTab} onSelect={(t) => go(t)} footer={footer(false)} className="flex-1" />}
      drawer={isMobileMenuOpen ? <SideNav navId="mobile" brand={brand} groups={groups} active={activeTab} onSelect={(t) => go(t, true)} footer={footer(true)} className="flex-1 pt-16" /> : null}
      drawerOpen={isMobileMenuOpen}
      onCloseDrawer={() => setIsMobileMenuOpen(false)}
      topbar={
        <Topbar
          dateLabel={formatToday()}
          season={season || undefined}
          sync={syncStatus}
          unread={unread}
          onBell={() => { setActiveTab("notifications"); setIsMobileMenuOpen(false); }}
          userName={accountOwnerName}
          userRole={currentRole}
          onUser={handleOpenProfileModal}
          onLogout={() => handleLogout()}
          schoolSwitcher={<SchoolSwitcher />}
          onMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          menuOpen={isMobileMenuOpen}
          mobileBrand={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-display font-bold text-[17px] text-primary truncate" data-active-school-mobile>{schoolName}</span>
            </span>
          }
        />
      }
      banner={firestoreQuotaExceeded ? <QuotaBanner /> : null}
      footer={
        <footer className="px-4 sm:px-8 pb-6 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-ink-3 max-w-[1240px] print:hidden">
          <span>نظام إدارة حلقات تحفيظ القرآن الكريم • {schoolName}</span>
          <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
        </footer>
      }
    >
      {children}
    </AppShell>
  );
}
