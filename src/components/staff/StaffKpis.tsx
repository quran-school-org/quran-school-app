/**
 * Indicateurs du personnel par catégorie (bandeau à filets de la charte).
 */
import { KpiGrid, KpiTile } from "../../ui";
import { useStaff } from "./StaffContext";

export default function StaffKpis() {
  const { stats } = useStaff();
  return (
    <KpiGrid label="توزيع الطاقم" min={150}>
      <KpiTile size="md" label="إجمالي الطاقم" value={stats.totalCount} hint="طاقم نشط ومسجل" />
      <KpiTile size="md" label="أعضاء المكتب" value={stats.boardCount} hint="مسيرون وأعضاء" />
      <KpiTile size="md" label="محفظون وأساتذة" value={stats.teachersCount} hint="مشرفون على الحلقات" />
      <KpiTile size="md" label="إداريون وكتاب" value={stats.adminsCount} hint="شؤون الإدارة والكتابة" />
      <KpiTile size="md" label="مؤطرون ومشرفون" value={stats.mentorsCount} hint="الأنشطة والتربية" />
      <KpiTile size="md" label="نظافة وصيانة" value={stats.cleanersCount} hint="مرافق المقر" />
      <KpiTile size="md" label="متطوعون" value={stats.volunteersCount} hint="مساهمات تطوعية" />
    </KpiGrid>
  );
}
