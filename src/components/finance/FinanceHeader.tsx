/**
 * Comptabilité : en-tête et indicateurs globaux (charte « لوحة الكتّاب »).
 * Mêmes chiffres et même action d'impression qu'auparavant.
 */
import { Printer } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { Button, KpiGrid, KpiTile, PageHeader } from "../../ui";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function FinanceHeader() {
  const { canPrint, selectedYear, setShowPrintReportModal, grossTotalIncome, grossTotalExpenses, netBalance, cashBoxNetBalance, bankAccountNetBalance } = useFinance();

  return (
    <>
      <PageHeader
        title="المحاسبة"
        description="تتبع شامل وإلكتروني لمستحقات التلاميذ، الأجور والرواتب، المصاريف والنفقات، وإعداد التقرير المالي والختامي المعتمد للجمعية."
        eyebrow={`السنة المالية: ${selectedYear === "all" ? "جميع السنوات" : selectedYear}`}
        actions={
          canPrint && (
            <Button variant="primary" onClick={() => setShowPrintReportModal(true)} icon={<Printer className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
              طباعة التقرير المالي الختامي
            </Button>
          )
        }
      />
      <KpiGrid label="الوضعية المالية" min={160}>
        <KpiTile size="md" label="إجمالي المداخيل" value={fmt(grossTotalIncome)} unit="د.م" hint="رسوم تلاميذ + تبرعات ودعم" />
        <KpiTile size="md" label="إجمالي المصاريف والرواتب" value={fmt(grossTotalExpenses)} unit="د.م" hint="أجور مصروفة + مشتريات وفواتير" />
        <KpiTile
          size="md"
          label="الرصيد الصافي المتبقي"
          value={<span className={netBalance >= 0 ? "text-ink" : "text-danger"}><bdi>{fmt(netBalance)}</bdi></span>}
          unit="د.م"
          hint={netBalance >= 0 ? "فائض مالية الجمعية" : "عجز مالية الجمعية"}
          hintTone={netBalance >= 0 ? "success" : "danger"}
        />
        <KpiTile size="md" label="توزيع الأرصدة الحالية">
          <dl className="m-0 mt-1 flex flex-col gap-1 text-[14px]">
            <div className="flex justify-between gap-3"><dt className="text-ink-2">الصندوق</dt><dd className="m-0 font-semibold tabular-nums"><bdi>{fmt(cashBoxNetBalance)}</bdi> د.م</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-2">البنك</dt><dd className="m-0 font-semibold tabular-nums"><bdi>{fmt(bankAccountNetBalance)}</bdi> د.م</dd></div>
          </dl>
        </KpiTile>
      </KpiGrid>
    </>
  );
}
