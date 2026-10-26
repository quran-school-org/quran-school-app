/**
 * Cadre de l'application branché sur l'état : menu (bureau et tiroir mobile),
 * barre du haut, bandeau de quota, pied de page. Remplace l'ancien en-tête,
 * l'ancien menu émeraude et la barre mobile (mêmes actions, mêmes droits).
 */
import React, { useEffect, useMemo } from "react";
import SchoolSwitcher from "../school/SchoolSwitcher";
import { useApp } from "../app/AppContext";
import { isNotificationRead } from "../types";
import { LogOut } from "lucide-react";
import { AppShell, Emblem, NavBrand, SideNav, Topbar, useMediaQuery } from "../ui";
import { buildNavGroups, visibleTabs } from "./navModel";
import QuotaBanner from "./QuotaBanner";
import { extraChildrenLabel, familySidebarModel } from "./familySidebar";

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
    parentStudents, parentStudentsCount, currentStudentObj, furthestHizb, teacherFurthestHizb, parentFurthestHizb,
    setSelectedStudent, authUid,
  } = useApp();

  // Sous 1 024 px : barre du haut sur une ligne ; sélecteur d'école et déconnexion dans le tiroir (UI-05).
  const compact = !useMediaQuery("(min-width: 1024px)");
  const unread = userNotifications.filter((n) => !isNotificationRead(n, authUid)).length;
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

  // Parent : carte propre à la famille (un enfant, ou une ligne par enfant) ; le personnel garde la carte chiffrée.
  const isParent = currentRole === "ولي أمر" && !isStaffOrAdmin;
  const family = useMemo(() => familySidebarModel(parentStudents), [parentStudents]);
  const statsLabel = isStaffOrAdmin ? "إحصائيات الإدارة" : currentRole === "مدرس" ? "إحصائيات الحلقة" : currentRole === "ولي أمر" ? family.title : "ملخص الحفظ الشخصي";
  const statsValue = isStaffOrAdmin ? totalStudentsCount : currentRole === "مدرس" ? teacherStudents.length : currentRole === "ولي أمر" ? parentStudentsCount : currentStudentObj ? currentStudentObj.hizbCount : 0;
  const statsUnit = currentRole === "طالب" ? "حزب محفوظ" : currentRole === "ولي أمر" ? "أبناء" : "طلاب";
  const statsSecond = currentRole === "طالب"
    ? (currentStudentObj ? (currentStudentObj.tajweedLevel || "متوسط") : "-")
    : isStaffOrAdmin ? `${furthestHizb} حزب` : currentRole === "مدرس" ? `${teacherFurthestHizb} حزب` : `${parentFurthestHizb} حزب`;
  const statsSecondLabel = currentRole === "طالب" ? "مستوى التجويد" : "أبعد حزب بلغه طالب";
  // D93 : plus d'état « connecté / synchronisé » affiché en permanence ; seul un problème est signalé.
  const syncError = syncStatus === "error";

  const footer = (closeDrawer: boolean) => (
    <>
      {closeDrawer && (
        <div className="flex flex-col gap-2.5" data-drawer-account>
          <SchoolSwitcher block />
          <button
            type="button"
            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
            className="inline-flex items-center justify-center gap-2 h-11 px-3.5 rounded-xl border border-night-line-2 bg-transparent text-night-link text-[14px] font-semibold cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] -scale-x-100" strokeWidth={1.75} aria-hidden="true" />
            <span>خروج</span>
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => { statsTarget(); if (closeDrawer) setIsMobileMenuOpen(false); }}
        title={currentRole === "طالب" ? "الانتقال إلى ملف الحفظ والتجويد الشخصي" : "استعراض الإحصائيات"}
        className="text-start border border-night-line-2 rounded-[14px] p-3.5 flex flex-col gap-1.5 bg-night/85 hover:bg-white/[0.06] cursor-pointer transition-colors text-night-text"
      >
        <span className="text-[12.5px] text-night-soft">{statsLabel}</span>
        {isParent ? (
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5" data-family-sidebar={family.kind}>
            {family.lines.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-3" data-family-sidebar-child={l.id}>
                <span className={`font-semibold text-white min-w-0 truncate ${family.kind === "one" ? "text-[17px]" : "text-[14px]"}`}>{l.name}</span>
                <span className="text-[12.5px] text-night-muted shrink-0">الحزب الحالي : <span className="font-semibold text-gold tabular-nums text-[14px]">{l.hizb}</span></span>
              </li>
            ))}
            {family.kind === "none" && <li className="text-[12.5px] text-night-muted">لا يوجد أبناء مرتبطون بحسابك</li>}
            {family.extra > 0 && (
              <li className="text-[12.5px] text-night-muted" data-family-sidebar-extra>
                <span aria-hidden="true" className="tabular-nums">+{family.extra}</span>
                <span className="sr-only">{extraChildrenLabel(family.extra)}</span>
              </li>
            )}
          </ul>
        ) : (
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
        )}
      </button>
      {syncError && (
        <div className="flex items-center gap-2.5 px-1.5 text-[12.5px] text-night-soft" role="status" data-sync-error>
          <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0 bg-danger" />
          <span>تعذّر الاتصال بقاعدة البيانات، العمل على النسخة المحلية</span>
        </div>
      )}
    </>
  );

  const brand = <NavBrand logo={logo} name={schoolName} subtitle="نادي القرآن الكريم" onClick={() => go(tabs[0] || "dashboard", true)} />;
  const season = (systemSettings?.activeAcademicSeason || "").trim().replace("/", "–");

  return (
    <AppShell
      sidebar={<SideNav navId="desktop" brand={brand} groups={groups} active={activeTab} onSelect={(t) => go(t)} footer={footer(false)} className="flex-1" />}
      drawer={isMobileMenuOpen && compact ? <SideNav navId="mobile" brand={brand} groups={groups} active={activeTab} onSelect={(t) => go(t, true)} footer={footer(true)} className="flex-1 pt-16" /> : null}
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
          compact={compact}
          schoolSwitcher={compact ? undefined : <SchoolSwitcher />}
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
