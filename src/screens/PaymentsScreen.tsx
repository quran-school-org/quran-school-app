/**
 * Frais mensuels et reçus (charte « لوحة الكتّاب ») : indicateurs, flux mensuel,
 * filtres, registre triable. Mêmes données, mêmes actions et mêmes droits.
 */
import React from "react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, CreditCard, Download, Edit3, Plus, Printer, RotateCcw, Search, Trash2, Undo2 } from "lucide-react";
import { checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { getYearAndMonthFromDate } from "../app/helpers";
import { MONTHS_AR } from "../school/businessRules";
import { formatMoney, formatNumber } from "../utils/format";
import { fromPeriodFilter, periodYears, toPeriodFilter } from "../utils/paymentPeriod";
import { useApp } from "../app/AppContext";
import {
  Button, Card, CardHeader, EmptyState, FormField, IconButton, KpiGrid, KpiTile, Legend, Ltr, PageHeader, Pill,
  SearchInput, Select, Table, TableWrap, Td, Th, Tr, WhatsAppIcon,
} from "../ui";
import { formatDateAr } from "../format/date";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} />;

export default function PaymentsScreen() {
  const {
    students, payments, systemSettings, currentUser, currentRole, paymentSortKey, paymentSortDir, handleTogglePaymentSort,
    paymentSearchQuery, setPaymentSearchQuery, paymentFilterStatus, setPaymentFilterStatus, paymentFilterDate, setPaymentFilterDate,
    getSubscriptionAmount, totalPaymentsCollected, totalUnpaidCount, totalUnpaidAmount, sortedPayments, paymentChartData,
    handleTogglePayment, handleOpenPaymentForm, handleDeletePayment, handleWhatsAppShare, handleExportPaymentsToCSV,
    handlePrintReceipt, handlePrintFinancialReport,
  } = useApp();
  const can = (a: "create" | "update" | "delete" | "print") => checkUserPermission(currentUser, currentRole, "payments", a);
  const year = getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear();
  const overrides = systemSettings?.feeOverrides || [];
  /** Parent / élève : pas de filtre de mois, tous ses paiements du plus récent au plus ancien (UI-08). */
  const isFamily = currentRole === "ولي أمر" || currentRole === "طالب";
  const period = fromPeriodFilter(paymentFilterDate);
  const currentYear = new Date().getFullYear();
  const years = periodYears(payments, currentYear);
  if (period && !years.includes(period.year)) years.push(period.year);
  const textFilters = !!paymentSearchQuery || paymentFilterStatus !== "all";
  const filtersActive = textFilters || (!isFamily && !!period);

  const SortTh = ({ k, children, center }: { k: string; children: React.ReactNode; center?: boolean }) => {
    const on = paymentSortKey === k;
    return (
      <Th aria-sort={on ? (paymentSortDir === "asc" ? "ascending" : "descending") : "none"} className={center ? "text-center" : undefined}>
        <button type="button" onClick={() => handleTogglePaymentSort(k)} className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 font-semibold text-ink-2 cursor-pointer min-h-8 hover:text-primary">
          {children}
          {on ? (paymentSortDir === "asc" ? ic(ArrowUp, "w-3.5 h-3.5 text-primary") : ic(ArrowDown, "w-3.5 h-3.5 text-primary")) : ic(ArrowUpDown, "w-3.5 h-3.5 text-ink-4")}
        </button>
      </Th>
    );
  };

  return (
    <div data-screen="payments" className="flex flex-col gap-6">
      <PageHeader
        title={isFamily ? "سجل الرسوم" : "الرسوم والمدفوعات"}
        description={isFamily ? "مدفوعات أبنائك وإيصالاتها، من الأحدث إلى الأقدم." : "سجّل الدفعات، تابع المستحقات وأصدر الإيصالات."}
        actions={
          <>
            {can("print") && (
              <>
                <Button onClick={handleExportPaymentsToCSV} title="تصدير السجل المالي الحالي كملف CSV المتوافق مع إكسيل" icon={ic(Download, "w-[18px] h-[18px]")}>تصدير CSV</Button>
                <Button onClick={handlePrintFinancialReport} title="عرض وطباعة كشف مالي تفصيلي PDF" icon={ic(Printer, "w-[18px] h-[18px]")}>تصدير PDF / طباعة</Button>
              </>
            )}
            {can("create") && (
              <Button variant="primary" data-action="open-payment-form" onClick={() => handleOpenPaymentForm()} icon={ic(Plus, "w-[18px] h-[18px]")}>إضافة دفعة</Button>
            )}
          </>
        }
      />

      <KpiGrid label="ملخص الرسوم" min={160}>
        <KpiTile label="إجمالي المقبوضات" value={formatNumber(totalPaymentsCollected)} unit="د.م" />
        <KpiTile label="إجمالي المستحقات المتأخرة" value={formatNumber(totalUnpaidAmount)} unit="د.م" hint={totalUnpaidAmount > 0 ? "بانتظار السداد" : "لا مستحقات متأخرة"} hintTone={totalUnpaidAmount > 0 ? "danger" : "success"} />
        <KpiTile label="الفواتير المعلقة" value={totalUnpaidCount} unit="مطالبة" />
        <KpiTile label="المداخيل المتوقعة" value={formatNumber(totalPaymentsCollected + totalUnpaidAmount)} unit="د.م" />
      </KpiGrid>

      <Card id="financial-flow-chart-widget" className="flex flex-col gap-5" aria-labelledby="flow-title">
        <CardHeader
          id="flow-title"
          title={`التدفق المالي والمداخيل الشهرية لعام ${year}`}
          description="إجمالي الاشتراكات المحصلة شهرياً مقارنة بالمستحقات المعلقة."
          actions={<Legend columns={2} items={[{ label: "المداخيل المحصلة", color: "var(--color-primary)" }, { label: "المستحقات المعلقة", color: "var(--color-gold)" }]} />}
        />
        <div className="h-72 w-full" role="img" aria-label={`مخطط المداخيل الشهرية لعام ${year}`}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={paymentChartData} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line-soft)" />
              <XAxis dataKey="name" reversed minTickGap={4} tick={{ fill: "var(--color-ink-2)", fontSize: 11.5, fontFamily: "IBM Plex Sans Arabic" }} stroke="var(--color-line-strong)" tickLine={false} />
              <YAxis orientation="right" tickFormatter={(val) => formatNumber(val)} width={52} tick={{ fill: "var(--color-ink-3)", fontSize: 11.5 }} stroke="var(--color-line-strong)" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-gold)", fillOpacity: 0.08 }}
                contentStyle={{ direction: "rtl", textAlign: "right", borderRadius: 12, borderColor: "var(--color-line)", background: "var(--color-surface)", color: "var(--color-ink)", fontFamily: "IBM Plex Sans Arabic" }}
                formatter={(value, name) => [formatMoney(value), String(name)]}
              />
              <RechartsBar dataKey="المداخيل المحصلة" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <RechartsBar dataKey="المستحقات المعلقة" fill="var(--color-gold)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <FormField label="البحث السريع عن الطلاب" className="flex-[1_1_260px] max-w-md">
          {(id) => (
            <SearchInput id={id} icon={ic(Search)} value={paymentSearchQuery} onChange={(e: any) => setPaymentSearchQuery(e.target.value)} placeholder="ابحث باسم الطالب، ولي الأمر، أو الإيصال..." />
          )}
        </FormField>
        {!isFamily && (
          <>
            <FormField label="شهر الرصد" className="min-w-[9.5rem]">
              {(id) => (
                <Select
                  id={id}
                  data-filter="payment-month"
                  value={period?.month ?? ""}
                  onChange={(v) => setPaymentFilterDate(v === "" ? "" : toPeriodFilter(period?.year ?? currentYear, v))}
                  options={[{ value: "", label: "كل الأشهر" }, ...MONTHS_AR.map((m) => ({ value: m, label: m }))]}
                  className="w-auto"
                />
              )}
            </FormField>
            <FormField label="السنة" className="min-w-[7rem]">
              {(id) => (
                <Select
                  id={id}
                  data-filter="payment-year"
                  value={period?.year ?? currentYear}
                  disabled={!period}
                  onChange={(v) => period && setPaymentFilterDate(toPeriodFilter(Number(v), period.month))}
                  options={years.sort((x, y) => y - x).map((y) => ({ value: String(y), label: String(y) }))}
                  className="w-auto"
                />
              )}
            </FormField>
          </>
        )}
        <FormField label="حالة الدفع">
          {(id) => (
            <Select id={id} value={paymentFilterStatus} onChange={(v) => setPaymentFilterStatus(v)} className="w-auto">
              <option value="all">كل حالات السداد</option>
              <option value="مدفوع">مدفوع</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </Select>
          )}
        </FormField>
        {filtersActive && (
          <Button variant="ghost" onClick={() => { setPaymentSearchQuery(""); if (!isFamily) setPaymentFilterDate(""); setPaymentFilterStatus("all"); }} icon={ic(RotateCcw)}>
            إعادة تعيين الفلاتر
          </Button>
        )}
      </div>

      <Card padded={false} className="overflow-hidden" aria-labelledby="ledger-title">
        <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-4 border-b border-line-soft">
          <h2 id="ledger-title" className="m-0 font-display font-semibold text-[20px] text-primary">سجل المعاملات والمدفوعات <span className="font-sans text-[14px] text-ink-2 font-normal">({sortedPayments.length} سجل مطابق)</span></h2>
          <span className="text-[13px] text-ink-3">
            مبلغ الاشتراك الأساسي: <strong className="text-ink">{formatMoney(getSubscriptionAmount("", 0))}</strong> / شهر
            {overrides.length > 0 ? ` (تعريفات خاصة: ${overrides.map((o) => `${o.month} ${o.year}: ${formatMoney(o.amount)}`).join("، ")})` : ""}
          </span>
        </div>
        {sortedPayments.length === 0 ? (
          <div className="p-5">
            {isFamily ? (
              <EmptyState icon={ic(CreditCard, "w-8 h-8")} title="لا مدفوعات مسجلة بعد">ستظهر هنا رسوم أبنائك وإيصالاتها بمجرد تسجيلها من الإدارة.</EmptyState>
            ) : !textFilters && period ? (
              <EmptyState
                icon={ic(CreditCard, "w-8 h-8")}
                title={`لا مدفوعات مسجلة لشهر ${period.month} ${period.year}`}
                action={
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <Button data-action="show-all-months" onClick={() => setPaymentFilterDate("")}>عرض كل الأشهر</Button>
                    {can("create") && <Button variant="primary" data-action="empty-add-payment" onClick={() => handleOpenPaymentForm()} icon={ic(Plus, "w-[18px] h-[18px]")}>إضافة دفعة</Button>}
                  </div>
                }
              >
                لم تُسجَّل أي دفعة لهذا الشهر بعد. اعرض كل الأشهر لرؤية بقية السجل، أو سجّل دفعة جديدة.
              </EmptyState>
            ) : (
              <EmptyState
                icon={ic(CreditCard, "w-8 h-8")}
                title="لا نتائج"
                action={filtersActive ? <Button onClick={() => { setPaymentSearchQuery(""); setPaymentFilterDate(""); setPaymentFilterStatus("all"); }} icon={ic(RotateCcw)}>إعادة تعيين الفلاتر</Button> : undefined}
              >
                لا توجد أي مدفوعات مطابقة للبحث الحالي.
              </EmptyState>
            )}
          </div>
        ) : (
          <TableWrap label="سجل المدفوعات">
            <Table>
              <thead>
                <tr>
                  <SortTh k="studentName">الطالب وعائلته</SortTh>
                  <SortTh k="monthYear">فترة الاشتراك</SortTh>
                  <SortTh k="amount">المبلغ المستحق</SortTh>
                  <SortTh k="paymentDate">تفاصيل السداد والمعاملة</SortTh>
                  <SortTh k="receiptNo">رقم الوصل</SortTh>
                  <SortTh k="status" center>حالة الدفع</SortTh>
                  <Th className="text-center">الإجراءات</Th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((p) => {
                  const stud = students.find((s) => s.id === p.studentId);
                  const paid = p.status === "مدفوع";
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          <span className="w-9 h-9 rounded-full border border-line overflow-hidden shrink-0 bg-sunken">
                            <StudentAvatar student={stud} alt={stud?.fullName} className="w-full h-full object-cover" />
                          </span>
                          <span className="flex flex-col">
                            <span className="font-semibold">{stud?.fullName || "طالب مجهول"}</span>
                            <span className="text-[12.5px] text-ink-3">ولي الأمر: {stud?.parentName || "—"} • <Ltr>{stud?.parentPhone || "—"}</Ltr></span>
                          </span>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap"><Pill tone="neutral">{p.month} / {p.year}</Pill></Td>
                      <Td className="whitespace-nowrap"><strong className="tabular-nums">{formatMoney(p.amount)}</strong></Td>
                      <Td>
                        {paid ? (
                          <span className="flex flex-col gap-1">
                            <span className="text-[12.5px] text-ink-2">تاريخ الدفع: <span className="text-ink">{formatDateAr(p.paymentDate)}</span></span>
                            <Pill tone="primary" className="self-start">{p.paymentMethod || "نقداً"}</Pill>
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-ink-3">بانتظار سداد رسوم الشهر</span>
                        )}
                        {p.notes && <p className="m-0 mt-1.5 text-[12.5px] bg-gold-100 text-gold-800 px-2 py-1 rounded-lg max-w-xs leading-relaxed">{p.notes}</p>}
                      </Td>
                      <Td><Ltr className="text-[12.5px] font-semibold text-ink-2">{p.receiptNo || "—"}</Ltr></Td>
                      <Td className="text-center"><Pill tone={paid ? "success" : "danger"} dot>{paid ? "مكتمل السداد" : "معلق / غير مدفوع"}</Pill></Td>
                      <Td>
                        <div className="flex items-center justify-center gap-1.5">
                          {can("update") && (
                            <Button size="xs" variant={paid ? "danger" : "success"} onClick={() => handleTogglePayment(p.id)} title={paid ? "تحديد كغير مدفوع" : "تحديد كمدفوع"} icon={paid ? ic(Undo2, "w-3.5 h-3.5") : ic(CheckCircle2, "w-3.5 h-3.5")}>
                              {paid ? "إلغاء" : "تسديد"}
                            </Button>
                          )}
                          {paid && can("print") && <IconButton size="sm" label="طباعة وصل مالي رسمي" onClick={() => handlePrintReceipt(p)}>{ic(Printer)}</IconButton>}
                          {stud && <IconButton size="sm" tone="success" label="مشاركة إيصال / تنبيه دفع على الواتساب لولي الأمر" onClick={() => handleWhatsAppShare(p)}><WhatsAppIcon className="w-4 h-4" /></IconButton>}
                          {can("update") && <IconButton size="sm" tone="primary" label="تعديل تفاصيل الدفعة" onClick={() => handleOpenPaymentForm(p)}>{ic(Edit3)}</IconButton>}
                          {can("delete") && <IconButton size="sm" tone="danger" label="حذف السجل نهائياً" onClick={() => handleDeletePayment(p.id)}>{ic(Trash2)}</IconButton>}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
