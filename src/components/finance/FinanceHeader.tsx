/**
 * Comptabilité : en-tête et indicateurs globaux (charte « لوحة الكتّاب »).
 * Mêmes chiffres et même action d'impression qu'auparavant.
 */
import { Plus, Printer } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { Button, KpiGrid, KpiTile, PageHeader } from "../../ui";
import { formatNumber } from "../../format/money";

const fmt = (n: number) => formatNumber(n);

export default function FinanceHeader() {
  const { canPrint, canCreate, activeSubTab, openIncomeModal, openSalaryModal, openExpenseModal, selectedYear, setShowPrintReportModal, grossTotalIncome, grossTotalExpenses, netBalance, cashBoxNetBalance, bankAccountNetBalance } = useFinance();

  return (
    <>
      <PageHeader
        title="المحاسبة"
        eyebrow={`السنة المالية: ${selectedYear === "all" ? "جميع السنوات" : selectedYear}`}
        actions={
          <>
            {/* Action principale : ajouter ce que le sous-onglet actif liste (constat 21, D100). */}
            {canCreate && activeSubTab === "revenues" && (
              <Button variant="primary" data-action="open-income-form" onClick={() => openIncomeModal()} icon={<Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                إضافة دخل / تبرع جديد
              </Button>
            )}
            {canCreate && activeSubTab === "salaries" && (
              <Button variant="primary" data-action="open-salary-form" onClick={() => openSalaryModal()} icon={<Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                صرف / تسجيل أجر جديد
              </Button>
            )}
            {canCreate && activeSubTab === "expenses" && (
              <Button variant="primary" data-action="open-expense-form" onClick={() => openExpenseModal()} icon={<Plus className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                تسجيل فاتورة / نفقة جديدة
              </Button>
            )}
            {canPrint && (
              <Button variant="outline" data-action="print-final-report" onClick={() => setShowPrintReportModal(true)} icon={<Printer className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
                طباعة التقرير المالي الختامي
              </Button>
            )}
          </>
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
