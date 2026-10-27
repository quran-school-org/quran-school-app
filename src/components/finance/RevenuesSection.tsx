/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Edit3, Trash2, Filter, CheckCircle, AlertTriangle, Coins, CreditCard, Compass, ExternalLink } from "lucide-react";
import { MONTHS_LIST } from "./shared";
import { useFinance } from "./FinanceContext";
import { DataTable, EmptyState, IconButton, Select, SectionHeader, useConfirm, type DataColumn } from "../../ui";
import type { ActivityParticipant, OtherIncome, Payment } from "../../types";
import { formatMoney } from "../../format/money";
import { formatDateAr } from "../../format/date";

export default function RevenuesSection() {
  const confirm = useConfirm();
  const {
    students,
    onDeleteOtherIncome,
    onNavigateToActivities,
    canUpdate,
    canDelete,
    activeSubTab,
    selectedMonthFilter,
    setSelectedMonthFilter,
    selectedIncomeCategory,
    setSelectedIncomeCategory,
    incomeSortKey,
    setIncomeSortKey,
    incomeSortDir,
    setIncomeSortDir,
    studentPaySortKey,
    setStudentPaySortKey,
    studentPaySortDir,
    setStudentPaySortDir,
    handleToggleSort,
    renderSortableHeader,
    openIncomeModal,
    paidStudentPayments,
    totalStudentFeesAmount,
    safeActivities,
    filteredActivityParticipants,
    totalActivityContributions,
    totalActivityExpectedFees,
    filteredOtherIncomes,
    totalOtherIncomeAmount,
    sortedOtherIncomes,
    sortedStudentPayments,
  } = useFinance();

  /** Contribution due d'un participant : montant propre, sinon celui de l'activité. */
  const participantFee = (p: ActivityParticipant) => {
    const act = safeActivities.find((a) => a.id === p.activityId);
    return Number(p.fee !== undefined && p.fee !== null ? p.fee : (act?.contributionFee ?? 0));
  };

  const sortIncome = (label: string, key: string) =>
    renderSortableHeader(label, key, incomeSortKey, incomeSortDir, (k) => handleToggleSort(k, incomeSortKey, incomeSortDir, setIncomeSortKey, setIncomeSortDir));
  const sortStudentPay = (label: string, key: string) =>
    renderSortableHeader(label, key, studentPaySortKey, studentPaySortDir, (k) => handleToggleSort(k, studentPaySortKey, studentPaySortDir, setStudentPaySortKey, setStudentPaySortDir));

  const incomeColumns: DataColumn<OtherIncome>[] = [
    {
      id: "title", header: sortIncome("عنوان الدخل / التبرع", "title"), card: "title", className: "font-bold text-ink",
      cell: (inc) => (<>{inc.title}{inc.notes && <p className="m-0 text-caption text-ink-3 font-normal">{inc.notes}</p>}</>),
    },
    {
      id: "category", header: sortIncome("نوع الدخل", "category"), card: "field",
      cell: (inc) => (
        <span className="bg-primary-50 text-primary-800 font-semibold px-2.5 py-1 rounded-full text-caption border border-primary-200">{inc.category}</span>
      ),
    },
    { id: "amount", header: sortIncome("المبلغ", "amount"), card: "field", className: "font-bold text-primary-800", cell: (inc) => formatMoney(inc.amount) },
    { id: "donorName", header: sortIncome("المتبرع / الجهة", "donorName"), className: "font-medium text-ink-2", cell: (inc) => inc.donorName || "فاعل خير" },
    {
      id: "source", header: sortIncome("مكان الإيداع", "source"), card: "field",
      cell: (inc) => (
        <span className={`px-2.5 py-1 rounded-full text-caption font-bold ${
          inc.source === "حساب الجمعية البنكي" ? "bg-primary-50 text-primary-800 border border-primary-200" : "bg-gold-50 text-gold-800 border border-gold-200"
        }`}>{inc.source}</span>
      ),
    },
    { id: "date", header: sortIncome("تاريخ الاستلام", "date"), card: "field", className: "text-ink-3", cell: (inc) => formatDateAr(inc.date) },
    { id: "receiptNo", header: sortIncome("رقم الإيصال", "receiptNo"), className: "text-ink-3 font-mono", cell: (inc) => inc.receiptNo || "—" },
  ];

  const participantColumns: DataColumn<ActivityParticipant>[] = [
    {
      id: "activity", header: "النشاط / الرحلة", card: "title", className: "font-bold text-ink",
      cell: (p) => {
        const act = safeActivities.find((a) => a.id === p.activityId);
        return (
          <>
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span>{act ? act.title : `نشاط #${p.activityId}`}</span>
            </span>
            {act?.startDate && <p className="m-0 text-caption text-ink-3 font-normal">{formatDateAr(act.startDate)}</p>}
          </>
        );
      },
    },
    { id: "name", header: "اسم المشارك", card: "field", className: "font-bold text-ink", cell: (p) => p.fullName || (p as any).participantName || "مشارك" },
    {
      id: "role", header: "الصفة / النوع",
      cell: (p) => <span className="bg-sand-100 text-ink-2 px-2 py-0.5 rounded-md text-caption font-medium border border-line">{p.participantType || "مشارك"}</span>,
    },
    { id: "fee", header: "المساهمة الواجبة", className: "font-semibold text-ink-2", cell: (p) => { const f = participantFee(p); return p.paymentStatus === "معفى" && f === 0 ? "معفى (0 د.م)" : formatMoney(f); } },
    { id: "paid", header: "المبلغ المحصل", card: "field", className: "font-bold text-primary-700", cell: (p) => formatMoney(Number(p.paidAmount) || 0) },
    {
      id: "remaining", header: "المتبقي", className: "font-semibold text-ink-3",
      cell: (p) => { const r = Math.max(0, participantFee(p) - (Number(p.paidAmount) || 0)); return r > 0 ? <span className="text-gold-700 font-bold">{formatMoney(r)}</span> : <span className="text-ink-3">—</span>; },
    },
    {
      id: "method", header: "طريقة الأداء", className: "text-ink-2",
      cell: (p) => <span className="bg-sand-100 px-2.5 py-1 rounded-full text-caption border border-line">{p.paymentMethod || "نقداً"}</span>,
    },
    { id: "date", header: "تاريخ الأداء", className: "text-ink-3 font-mono", cell: (p) => formatDateAr(p.paymentDate) },
    {
      id: "status", header: "حالة الأداء", card: "field", className: "text-center",
      cell: (p) => {
        const requiredFee = participantFee(p);
        const paidAmount = Number(p.paidAmount) || 0;
        return p.paymentStatus === "معفى" ? (
          <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-caption px-2.5 py-1 rounded-full border border-primary-200">
            معفى
          </span>
        ) : p.paymentStatus === "مدفوع" || (requiredFee > 0 && paidAmount >= requiredFee) ? (
          <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-caption px-2.5 py-1 rounded-full border border-primary-200">
            <CheckCircle className="w-3 h-3" />
            مدفوع
          </span>
        ) : paidAmount > 0 ? (
          <span className="inline-flex items-center gap-1 bg-gold-100 text-gold-800 font-bold text-caption px-2.5 py-1 rounded-full border border-gold-200">
            <AlertTriangle className="w-3 h-3" />
            مدفوع جزئياً
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-danger-100 text-danger-800 font-bold text-caption px-2.5 py-1 rounded-full border border-danger-200">
            غير مدفوع
          </span>
        );
      },
    },
  ];

  const studentPayColumns: DataColumn<Payment>[] = [
    {
      id: "student", header: sortStudentPay("الطالب / المكتتب", "studentName"), card: "title", className: "font-bold text-ink",
      cell: (p) => { const student = students.find((s) => s.id === p.studentId); return student ? student.fullName : `طالب #${p.studentId}`; },
    },
    { id: "period", header: sortStudentPay("الشهر / السنة", "monthYear"), card: "field", className: "font-semibold text-ink-2", cell: (p) => `${p.month} ${p.year}` },
    { id: "amount", header: sortStudentPay("المبلغ المدفوع", "amount"), card: "field", className: "font-bold text-primary-800", cell: (p) => formatMoney(p.amount) },
    {
      id: "method", header: sortStudentPay("طريقة الأداء", "paymentMethod"), className: "text-ink-2",
      cell: (p) => <span className="bg-sand-100 px-2.5 py-1 rounded-full text-small border border-line">{p.paymentMethod || "نقداً"}</span>,
    },
    { id: "receiptNo", header: sortStudentPay("رقم الإيصال", "receiptNo"), className: "text-ink-3 font-mono", cell: (p) => p.receiptNo || "—" },
    { id: "date", header: sortStudentPay("تاريخ التسديد", "paymentDate"), className: "text-ink-3", cell: (p) => formatDateAr(p.paymentDate) },
    {
      id: "status", header: sortStudentPay("الحالة", "status"), card: "field",
      cell: () => (
        <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 font-bold text-caption px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" />
          مدفوع ومسجل
        </span>
      ),
    },
  ];

  return (
    <>
      {/* ========================================================================================= */}
      {/* 1. SECTION: REVENUES & INCOME (قسم الإيرادات والمداخيل) */}
      {/* ========================================================================================= */}
      {activeSubTab === "revenues" && (
        <div className="space-y-6">
          {/* Répartition des recettes en une ligne (UI-19) : le total est celui de l'en-tête de la page. */}
          <dl
            aria-label="توزيع المداخيل"
            data-block="income-breakdown"
            className="m-0 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden"
          >
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-small font-semibold text-ink-2">رسوم التلاميذ</dt>
              <dd className="m-0 text-title font-bold text-primary tabular-nums">{formatMoney(totalStudentFeesAmount)}</dd>
              <dd className="m-0 text-small text-ink-3">{paidStudentPayments.length} إيصال</dd>
            </div>
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-small font-semibold text-ink-2">تبرعات ودعم</dt>
              <dd className="m-0 text-title font-bold text-primary tabular-nums">{formatMoney(totalOtherIncomeAmount)}</dd>
              <dd className="m-0 text-small text-ink-3">{filteredOtherIncomes.length} سجل</dd>
            </div>
            <div className="bg-surface px-5 py-3.5 flex flex-col gap-0.5">
              <dt className="text-small font-semibold text-ink-2">مساهمات الأنشطة والرحلات</dt>
              <dd className="m-0 text-title font-bold text-primary tabular-nums">{formatMoney(totalActivityContributions)}</dd>
              <dd className="m-0 text-small text-ink-3">من أصل {formatMoney(totalActivityExpectedFees)} واجبة ({filteredActivityParticipants.filter(p => (Number(p.paidAmount) || 0) > 0).length} مشارك أدى)</dd>
            </div>
          </dl>

          {/* Section A: Other Incomes (Donations, Grants, Support) */}
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <SectionHeader
                level={3}
                size="md"
                icon={<Coins className="w-5 h-5 text-primary-700" />}
                title="المداخيل الأخرى (تبرعات، دعم مؤسساتي، اشتراكات جمعية)"
                subtitle="سجل التبرعات من المحسنين، المنح والمساعدات، واشتراكات الأعضاء الداعمين."
              />

              <div className="flex items-center gap-3 flex-wrap">
                {/* فلتر نوع الدخل */}
                <div className="flex items-center gap-2 bg-white border border-sand-300/80 rounded-xl px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <label htmlFor="income-category-filter" className="text-small font-bold text-ink-2 whitespace-nowrap">
                    نوع الدخل:
                  </label>
                  <Select
                    id="income-category-filter"
                    value={selectedIncomeCategory}
                    onChange={(v) => setSelectedIncomeCategory(v)}
                    variant="bare"
                    size="sm"
                    className="w-auto"
                    triggerClassName="text-small font-bold"
                  >
                    <option value="all">جميع أنواع المداخيل</option>
                    <option value="تبرعات">تبرعات</option>
                    <option value="دعم حكومي/مؤسساتي">دعم حكومي/مؤسساتي</option>
                    <option value="أنشطة ومهرجانات">أنشطة ومهرجانات</option>
                    <option value="اشتراكات أعضاء الجمعية">اشتراكات أعضاء الجمعية</option>
                    <option value="أخرى">أخرى</option>
                  </Select>
                </div>
              </div>
            </div>

            {sortedOtherIncomes.length === 0 ? (
              <div className="p-5"><EmptyState title="لا توجد مداخيل أو تبرعات مسجلة حالياً." /></div>
            ) : (
              <DataTable
                label="المداخيل الأخرى (تبرعات، دعم مؤسساتي، اشتراكات جمعية)"
                rows={sortedOtherIncomes}
                rowKey={(inc) => inc.id}
                columns={incomeColumns}
                actions={canUpdate || canDelete ? (inc) => (
                  <>
                    {canUpdate && (
                      <IconButton size="sm" label="تعديل" onClick={() => openIncomeModal(inc)}><Edit3 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        size="sm"
                        tone="danger"
                        label="حذف"
                        onClick={async () => {
                          if (await confirm({ message: "هل أنت متأكد من حذف هذا السجل المالي؟", tone: "danger" })) {
                            onDeleteOtherIncome(inc.id);
                          }
                        }}
                      ><Trash2 className="w-4 h-4" strokeWidth={1.75} /></IconButton>
                    )}
                  </>
                ) : undefined}
                actionsHeader="إجراءات"
                dense
              />
            )}
          </div>

          {/* Section B: Activity & Trip Contributions (Synced automatically from Activities Module) */}
          <div className="bg-surface rounded-3xl border border-primary-200/80 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-primary-50/60 to-primary-50/40 border-b border-primary-100 flex flex-wrap items-center justify-between gap-4">
              <SectionHeader
                level={3}
                size="md"
                icon={<Compass className="w-5 h-5 text-primary-700" />}
                title="مساهمات ومداخيل الأنشطة والرحلات (مربوطة ومحصلة تلقائياً)"
                subtitle="يتم استجلاب واحتساب مساهمات المشاركين في الأنشطة والرحلات بشكل آلي ومباشر وإدراجها ضمن المداخيل الإجمالية."
              />

              <div className="flex items-center gap-3">
                <div className="bg-primary-100/70 border border-primary-200 px-3 py-1.5 rounded-xl text-small font-bold text-primary-900 flex items-center gap-1.5">
                  <span>إجمالي المحصل:</span>
                  <span className="font-bold text-primary-700">{formatMoney(totalActivityContributions)}</span>
                </div>

                {onNavigateToActivities && (
                  <button
                    onClick={onNavigateToActivities}
                    className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-body font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                  >
                    <span>إدارة الأنشطة والرحلات</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredActivityParticipants.length === 0 ? (
              <div className="p-5"><EmptyState title="لا توجد مساهمات مسجلة للمشاركين في الأنشطة والرحلات حالياً." /></div>
            ) : (
              <DataTable
                label="مساهمات ومداخيل الأنشطة والرحلات"
                rows={filteredActivityParticipants}
                rowKey={(p) => p.id}
                columns={participantColumns}
                dense
              />
            )}
          </div>

          {/* Section C: Student Monthly Fees (Synced automatically) */}
          <div className="bg-surface rounded-3xl border border-line overflow-hidden">
            <div className="p-5 bg-sand-50 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <SectionHeader
                level={3}
                size="md"
                icon={<CreditCard className="w-5 h-5 text-primary-800" />}
                title="مداخيل مستحقات وواجبات التلاميذ الشهرية (مربوطة تلقائياً)"
                subtitle={'يتم مزامنة واستجلاب هذه المداخيل تلقائياً من قسم "الرسوم والمدفوعات" فور تسديدها.'}
              />

              <div className="flex items-center gap-2">
                <Select
                  value={selectedMonthFilter}
                  onChange={(v) => setSelectedMonthFilter(v)}
                  aria-label="تصفية حسب الشهر"
                  size="sm"
                  className="w-auto"
                >
                  <option value="all">جميع الشهور</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
            </div>

            {sortedStudentPayments.length === 0 ? (
              <div className="p-5"><EmptyState title="لا توجد مداخيل مدفوعة مسجلة للتلاميذ وفق التصفية الحالية." /></div>
            ) : (
              <DataTable
                label="مداخيل مستحقات وواجبات التلاميذ الشهرية"
                rows={sortedStudentPayments}
                rowKey={(p) => p.id}
                columns={studentPayColumns}
                dense
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
