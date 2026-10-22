/**
 * Modèle du menu : groupes de la maquette (التعليم / المالية / الإدارة) et
 * visibilité de chaque onglet selon les droits du compte (mêmes règles que
 * l'ancien menu, voir D39 pour le portail enseignant).
 */
import React from "react";
import { Award, Bell, BookOpen, Briefcase, Compass, CreditCard, LayoutGrid, QrCode, Settings, UserCheck, Users, Coins, NotebookPen } from "lucide-react";
import { checkUserPermission, type AppUser, type UserRole } from "../types";
import type { NavGroup } from "../ui";

const ic = (C: any) => <C className="w-[19px] h-[19px]" strokeWidth={1.75} />;

export interface NavContext {
  currentUser: AppUser | null;
  currentRole: UserRole;
  unread: number;
}

export function buildNavGroups({ currentUser, currentRole, unread }: NavContext): NavGroup[] {
  const can = (m: string) => checkUserPermission(currentUser, currentRole, m, "read");
  const family = currentRole === "ولي أمر" || currentRole === "طالب";
  const canDashboard = can("dashboard");
  const teaching = [
    canDashboard && currentRole !== "مدرس" ? { id: "dashboard", label: "لوحة الكتّاب", icon: ic(LayoutGrid) } : null,
    currentRole === "مدرس" && (canDashboard || can("teacher-dashboard")) ? { id: "teacher-dashboard", label: "لوحة المحفّظ", icon: ic(NotebookPen) } : null,
    can("students")
      ? { id: "students", label: currentRole === "ولي أمر" ? "متابعة أبنائي" : currentRole === "طالب" ? "ملفي وسجل الحفظ" : currentRole === "مدرس" ? "طلاب حلقاتي" : "الطلاب", icon: ic(Users) }
      : null,
    can("classes") ? { id: "classes", label: "الحلقات", icon: ic(BookOpen) } : null,
    can("grades") ? { id: "grades", label: family ? "النتائج والشهادات" : "الامتحانات والشهادات", icon: ic(Award) } : null,
    can("attendance") ? { id: "attendance", label: family ? "متابعة الحضور" : "الحضور والغياب", icon: ic(UserCheck) } : null,
  ];
  const finance = [
    can("payments") ? { id: "payments", label: currentRole === "ولي أمر" ? "سجل الرسوم" : "الرسوم والمدفوعات", icon: ic(CreditCard) } : null,
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
