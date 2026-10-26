/**
 * Module activités et sorties : en-tête et indicateurs (charte « لوحة الكتّاب »).
 * Mêmes actions, mêmes droits et mêmes chiffres qu'auparavant.
 */
import { Landmark, Plus } from "lucide-react";
import { useActivities } from "./ActivitiesContext";
import { Button, KpiGrid, KpiTile, Ltr, PageHeader } from "../../ui";
import { formatNumber } from "../../utils/format";

export default function ActivitiesOverview() {
  const { canCreateActivity, onNavigateToFinance, globalStats, handleOpenAddActivity } = useActivities();
  const net = globalStats.totalNet;

  return (
    <>
      <PageHeader
        title="الأنشطة والرحلات"
        description="تخطيط الرحلات والمخيمات، تسجيل المشاركين وتتبع المساهمات، ضبط المصاريف والربط المالي التلقائي."
        actions={
          <>
            {onNavigateToFinance && (
              <Button id="btn-nav-to-finance" onClick={onNavigateToFinance} icon={<Landmark className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                المحاسبة والمالية الجمعوية
              </Button>
            )}
            {canCreateActivity && (
              <Button id="btn-add-new-activity" data-action="open-activity-form" variant="primary" onClick={handleOpenAddActivity} icon={<Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                إضافة نشاط / رحلة جديدة
              </Button>
            )}
          </>
        }
      />
      <KpiGrid label="ملخص الأنشطة" min={160}>
        <KpiTile size="md" label="إجمالي الأنشطة والرحلات" value={globalStats.totalActs} hint={`${globalStats.activeOrUpcoming} جارية/قادمة`} />
        <KpiTile size="md" label="المشاركون المسجلون" value={globalStats.totalParts} unit="مشارك ومستفيد" />
        <KpiTile size="md" label="المساهمات المحصلة" value={formatNumber(globalStats.totalIncome)} unit="د.م" />
        <KpiTile
          size="md"
          label="الصافي المالي العام للأنشطة"
          value={<span className={net >= 0 ? "text-success-700" : "text-danger"}><Ltr>{formatNumber(net, { signed: true })}</Ltr></span>}
          unit="د.م"
          hint={net >= 0 ? "فائض" : "عجز"}
          hintTone={net >= 0 ? "success" : "danger"}
        />
      </KpiGrid>
    </>
  );
}
