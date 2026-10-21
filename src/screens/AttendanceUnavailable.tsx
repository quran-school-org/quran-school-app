/**
 * Onglet des présences pour les rôles qui n'ont pas d'écran de saisie
 * (l'ancienne interface affichait une page vide : constat F3).
 */
import { UserCheck } from "lucide-react";
import { useApp } from "../app/AppContext";
import { EmptyState, PageHeader } from "../ui";

export default function AttendanceUnavailable() {
  const { currentRole } = useApp();
  const family = currentRole === "ولي أمر" || currentRole === "طالب";
  return (
    <div data-screen="attendance-unavailable" className="flex flex-col gap-6">
      <PageHeader title={family ? "متابعة الحضور" : "الحضور والغياب"} description="سجل الحضور اليومي لحلقات التحفيظ." />
      <EmptyState icon={<UserCheck className="w-8 h-8" strokeWidth={1.5} />} title="لا تتوفر شاشة الحضور لهذا الحساب">
        {family
          ? "يظهر حضور أبنائك في تقارير المحفّظ ورسائل الإدارة. تواصل مع إدارة المدرسة لأي استفسار حول الغياب."
          : "تسجيل الحضور اليومي متاح حالياً للمدير والمحفّظين. تواصل مع المدير إذا احتجت إلى هذه الصلاحية."}
      </EmptyState>
    </div>
  );
}
