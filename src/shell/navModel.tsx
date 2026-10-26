/**
 * Modèle du menu : groupes de la maquette (التعليم / المالية / الإدارة) et
 * visibilité de chaque onglet selon les droits du compte (mêmes règles que
 * l'ancien menu, voir D39 pour le portail enseignant).
 */
import { Award, Bell, BookOpen, Briefcase, Compass, CreditCard, Home, LayoutGrid, QrCode, Settings, UserCheck, Users, Coins, NotebookPen } from "lucide-react";
import { checkUserPermission, type AppUser, type UserRole } from "../types";
import { isEducatorRole, isFamilyRole } from "../security/access";
import type { NavGroup } from "../ui";

const ic = (C: any) => <C className="w-[19px] h-[19px]" strokeWidth={1.75} />;

export interface NavContext {
  currentUser: AppUser | null;
  currentRole: UserRole;
  unread: number;
}

/**
 * Libellé d'un onglet pour un rôle : celui du menu, repris comme titre de la
 * page (UI-07, D89). Une seule source pour le menu et les écrans.
 */
export function navLabel(role: UserRole, tab: string): string {
  const family = isFamilyRole(role);
  switch (tab) {
    case "home": return "ملخص";
    case "students": return role === "ولي أمر" ? "متابعة أبنائي" : role === "طالب" ? "ملفي وسجل الحفظ" : role === "مدرس" ? "طلاب حلقاتي" : "الطلاب";
    case "grades": return family ? "النتائج والشهادات" : "الامتحانات والشهادات";
    case "attendance": return family ? "متابعة الحضور" : "الحضور والغياب";
    case "payments": return role === "ولي أمر" ? "سجل الرسوم" : "الرسوم والمدفوعات";
    case "classes": return "الحلقات";
    default: return tab;
  }
}

/**
 * Présences : saisie pour مدير et مدرس (AttendanceScreen) ; lecture seule pour
 * les rôles que les règles autorisent à lire (pédagogie, familles : lignes
 * filtrées sur leurs enfants). Les autres rôles n'ont pas l'entrée du menu.
 */
export const canOpenAttendance = (role: UserRole) => isEducatorRole(role) || isFamilyRole(role);

export function buildNavGroups({ currentUser, currentRole, unread }: NavContext): NavGroup[] {
  const can = (m: string) => checkUserPermission(currentUser, currentRole, m, "read");
  const family = currentRole === "ولي أمر" || currentRole === "طالب";
  const canDashboard = can("dashboard");
  const teaching = [
    family ? { id: "home", label: navLabel(currentRole, "home"), icon: ic(Home) } : null,
    canDashboard && currentRole !== "مدرس" ? { id: "dashboard", label: "لوحة الكتّاب", icon: ic(LayoutGrid) } : null,
    currentRole === "مدرس" && (canDashboard || can("teacher-dashboard")) ? { id: "teacher-dashboard", label: "لوحة المحفّظ", icon: ic(NotebookPen) } : null,
    can("students")
      ? { id: "students", label: navLabel(currentRole, "students"), icon: ic(Users) }
      : null,
    can("classes") ? { id: "classes", label: navLabel(currentRole, "classes"), icon: ic(BookOpen) } : null,
    can("grades") ? { id: "grades", label: navLabel(currentRole, "grades"), icon: ic(Award) } : null,
    can("attendance") && canOpenAttendance(currentRole) ? { id: "attendance", label: navLabel(currentRole, "attendance"), icon: ic(UserCheck) } : null,
  ];
  const finance = [
    can("payments") ? { id: "payments", label: navLabel(currentRole, "payments"), icon: ic(CreditCard) } : null,
    can("finance") ? { id: "finance", label: "المحاسبة", icon: ic(Coins) } : null,
    can("activities") ? { id: "activities", label: "الأنشطة والرحلات", icon: ic(Compass) } : null,
  ];
  const admin = [
    can("teachers") ? { id: "teachers", label: "العاملون والمدرّسون", icon: ic(Briefcase) } : null,
    can("id-cards-lab") ? { id: "id-cards-lab", label: "بطاقات الهوية", icon: ic(QrCode) } : null,
    can("notifications") ? { id: "notifications", label: "الإشعارات", icon: ic(Bell), badge: unread } : null,
    can("settings") ? { id: "settings", label: "الإعدادات والمستخدمون", icon: ic(Settings) } : null,
  ];
  const clean = (l: any[]) => l.filter(Boolean);
  return [
    { label: "التعليم", items: clean(teaching) },
    { label: "المالية", items: clean(finance) },
    { label: "الإدارة", items: clean(admin) },
  ];
}

export function visibleTabs(groups: NavGroup[]): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.id));
}
