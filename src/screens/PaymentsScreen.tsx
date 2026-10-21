/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Student, Payment, checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CreditCard, Plus, Search, Trash2, Edit3, Phone, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getYearAndMonthFromDate } from "../app/helpers";
import { useApp } from "../app/AppContext";

export default function PaymentsScreen() {
  const {
    students,
    payments,
    systemSettings,
    currentUser,
    paymentSortKey,
    paymentSortDir,
    handleTogglePaymentSort,
    paymentSearchQuery,
    setPaymentSearchQuery,
    paymentFilterStatus,
    setPaymentFilterStatus,
    paymentFilterDate,
    setPaymentFilterDate,
    currentRole,
    getSubscriptionAmount,
    totalPaymentsCollected,
    totalUnpaidCount,
    totalUnpaidAmount,
    sortedPayments,
    paymentChartData,
    handleTogglePayment,
    handleOpenPaymentForm,
    handleDeletePayment,
    handleWhatsAppShare,
    handleExportPaymentsToCSV,
    handlePrintReceipt,
    handlePrintFinancialReport,
  } = useApp();

  return (
    <div data-screen="payments" className="space-y-6">

      {/* PAGE HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-700" />
            إدارة المصروفات ومستحقات أولياء الأمور الشاملة
          </h2>
          <p className="text-xs text-slate-500">تتبع رسوم الاشتراك الشهري، تفاصيل الدفع، طباعة الإيصالات، ومشاركة التنبيهات مع أولياء الأمور.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {checkUserPermission(currentUser, currentRole, "payments", "print") && (
            <>
              <button
                onClick={handleExportPaymentsToCSV}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="تصدير السجل المالي الحالي كملف CSV المتوافق مع إكسيل"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>تصدير CSV</span>
              </button>

              <button
                onClick={handlePrintFinancialReport}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="عرض وطباعة كشف مالي تفصيلي PDF"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>تصدير PDF / طباعة</span>
              </button>
            </>
          )}

          {checkUserPermission(currentUser, currentRole, "payments", "create") && (
            <button
              data-action="open-payment-form"
              onClick={() => handleOpenPaymentForm()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة سجل دفع جديد
            </button>
          )}
        </div>
      </div>

      {/* STATS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0">
            🪙
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المقبوضات</span>
            <span className="text-lg font-black font-mono text-emerald-700">{totalPaymentsCollected} درهم</span>
          </div>
        </div>

        {/* Unpaid Amount */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
            ⏳
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المستحقات المتأخرة</span>
            <span className="text-lg font-black font-mono text-rose-700">{totalUnpaidAmount} درهم</span>
          </div>
        </div>

        {/* Unpaid Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold shrink-0">
            📑
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">الفواتير المعلقة</span>
            <span className="text-lg font-black font-mono text-amber-700">{totalUnpaidCount} مطالبة</span>
          </div>
        </div>

        {/* Expected Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
            📊
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">المداخيل المتوقعة</span>
            <span className="text-lg font-black font-mono text-blue-700">{totalPaymentsCollected + totalUnpaidAmount} درهم</span>
          </div>
        </div>
      </div>

      {/* FINANCIAL FLOW CHART */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 animate-fade-in" id="financial-flow-chart-widget">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              📊 التدفق المالي والمداخيل الشهرية لعام {getYearAndMonthFromDate(paymentFilterDate).year || new Date().getFullYear()}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              متابعة إجمالي الاشتراكات والمبالغ المحصلة شهرياً مقارنة بالمستحقات المعلقة
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md"></span>
              <span className="text-[11px] text-slate-600 font-bold">المداخيل المحصلة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-amber-500 rounded-md"></span>
              <span className="text-[11px] text-slate-600 font-bold">المستحقات المعلقة</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full animate-fade-in" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={paymentChartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                stroke="#cbd5e1"
              />
              <YAxis 
                tickFormatter={(val) => `${val} د.م.`}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{ 
                  direction: 'rtl', 
                  textAlign: 'right', 
                  borderRadius: '12px', 
                  borderColor: '#cbd5e1',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: any, name: string) => [`${value} درهم`, name]}
              />
              <RechartsBar dataKey="المداخيل المحصلة" fill="#059669" radius={[4, 4, 0, 0]} />
              <RechartsBar dataKey="المستحقات المعلقة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          {/* Search bar */}
          <div className="space-y-1 w-full sm:w-64">
            <label className="block text-[10px] font-bold text-slate-400">البحث السريع عن الطلاب:</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                placeholder="ابحث باسم الطالب، ولي الأمر، أو الإيصال..."
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mt-1">
              <input
                type="month"
                value={paymentFilterDate}
                onChange={(e) => setPaymentFilterDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer shadow-sm"
              />
              <span className="text-[10px] text-slate-400 font-medium">اختر شهر الرصد</span>
            </div>
          </div>

          {/* Status dropdown */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400">حالة الدفع:</label>
            <select
              value={paymentFilterStatus}
              onChange={(e) => setPaymentFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-emerald-800 focus:outline-none"
            >
              <option value="all">كل حالات السداد</option>
              <option value="مدفوع">مدفوع ✅</option>
              <option value="غير مدفوع">غير مدفوع ❌</option>
            </select>
          </div>
        </div>

        {(paymentSearchQuery || paymentFilterDate !== "" || paymentFilterStatus !== "all") && (
          <button
            onClick={() => {
              setPaymentSearchQuery("");
              setPaymentFilterDate("");
              setPaymentFilterStatus("all");
            }}
            className="text-[10px] text-rose-600 font-bold hover:underline self-end flex items-center gap-1"
          >
            إعادة تعيين الفلاتر 🔄
          </button>
        )}
      </div>

      {/* PAYMENTS LEDGER TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-700">
          <span>سجل المعاملات والمدفوعات ({sortedPayments.length} سجل مطابق)</span>
          <span className="text-[10px] text-slate-500 font-medium">مبلغ الاشتراك الأساسي: {getSubscriptionAmount("", 0)} {systemSettings?.currency || "درهم"} / شهر{(systemSettings?.feeOverrides || []).length > 0 ? ` (تعريفات خاصة: ${(systemSettings?.feeOverrides || []).map((o) => `${o.month} ${o.year}: ${o.amount}`).join("، ")})` : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] border-b">
              <tr>
                <th 
                  onClick={() => handleTogglePaymentSort("studentName")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center gap-1.5">
                    <span>الطالب وعائلته</span>
                    {paymentSortKey === "studentName" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleTogglePaymentSort("monthYear")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center gap-1.5">
                    <span>فترة الاشتراك</span>
                    {paymentSortKey === "monthYear" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleTogglePaymentSort("amount")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center gap-1.5">
                    <span>المبلغ المستحق</span>
                    {paymentSortKey === "amount" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleTogglePaymentSort("paymentDate")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center gap-1.5">
                    <span>تفاصيل السداد والمعاملة</span>
                    {paymentSortKey === "paymentDate" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleTogglePaymentSort("receiptNo")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center gap-1.5">
                    <span>رقم الوصل</span>
                    {paymentSortKey === "receiptNo" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleTogglePaymentSort("status")}
                  className="p-3 cursor-pointer select-none hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>حالة الدفع</span>
                    {paymentSortKey === "status" ? (
                      paymentSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPayments.length > 0 ? (
                sortedPayments.map((p) => {
                  const stud = students.find(s => s.id === p.studentId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Student Column */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            <StudentAvatar student={stud} alt={stud?.fullName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{stud?.fullName || "طالب مجهول"}</p>
                            <p className="text-[9px] text-slate-400 font-medium">ولي الأمر: {stud?.parentName || "—"} • {stud?.parentPhone || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Month & Year */}
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold text-[10px]">
                          {p.month} / {p.year}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3">
                        <span className="font-bold font-mono text-slate-800 text-sm">{p.amount}</span>
                        <span className="text-[10px] text-slate-400 mr-1">درهم</span>
                      </td>

                      {/* Payment details (method + notes) */}
                      <td className="p-3 space-y-1">
                        {p.status === "مدفوع" ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                              <span>تاريخ الدفع:</span>
                              <span className="font-mono font-medium text-slate-800">{p.paymentDate || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] border border-emerald-100">
                                💰 {p.paymentMethod || "نقداً"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">بانتظار سداد رسوم الشهر</span>
                        )}

                        {p.notes && (
                          <p className="text-[9px] bg-amber-50 text-amber-800 border border-amber-100 p-1 rounded max-w-xs leading-relaxed italic">
                            💬 {p.notes}
                          </p>
                        )}
                      </td>

                      {/* Receipt Number */}
                      <td className="p-3">
                        <span className="font-mono text-slate-600 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px]">
                          {p.receiptNo || "—"}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold inline-block border ${
                          p.status === "مدفوع" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                            : "bg-rose-50 text-rose-800 border-rose-100"
                        }`}>
                          {p.status === "مدفوع" ? "مكتمل السداد ✓" : "معلق / غير مدفوع"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick toggle payment status */}
                          {checkUserPermission(currentUser, currentRole, "payments", "update") && (
                            <button
                              onClick={() => handleTogglePayment(p.id)}
                              title={p.status === "مدفوع" ? "تحديد كغير مدفوع" : "تحديد كمدفوع"}
                              className={`p-1.5 rounded-lg border transition ${
                                p.status === "مدفوع"
                                  ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                  : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {p.status === "مدفوع" ? "❌ إلغاء" : "✅ تسديد"}
                            </button>
                          )}

                          {/* Print Receipt (PDF) */}
                          {p.status === "مدفوع" && checkUserPermission(currentUser, currentRole, "payments", "print") && (
                            <button
                              onClick={() => handlePrintReceipt(p)}
                              title="طباعة وصل مالي رسمي"
                              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* WhatsApp notification link */}
                          {stud && (
                            <button
                              onClick={() => handleWhatsAppShare(p)}
                              title="مشاركة إيصال / تنبيه دفع على الواتساب لولي الأمر"
                              className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}

                          {/* Edit */}
                          {checkUserPermission(currentUser, currentRole, "payments", "update") && (
                            <button
                              onClick={() => handleOpenPaymentForm(p)}
                              title="تعديل تفاصيل الدفعة"
                              className="p-1.5 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100 rounded-lg transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {checkUserPermission(currentUser, currentRole, "payments", "delete") && (
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              title="حذف السجل نهائياً"
                              className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    لا توجد أي مدفوعات مطابقة لمعايير التصفية والبحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
