/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Plus, Edit3, Trash2, CheckCircle, AlertTriangle, Briefcase, RefreshCw } from "lucide-react";
import { useFinance } from "./FinanceContext";

export default function SalariesSection() {
  const {
    onDeleteSalaryPayment,
    canCreate,
    canUpdate,
    canDelete,
    activeSubTab,
    salarySortKey,
    setSalarySortKey,
    salarySortDir,
    setSalarySortDir,
    handleToggleSort,
    renderSortableHeader,
    openSalaryModal,
    handleAutoGenerateTeacherSalaries,
    totalPaidSalaries,
    totalPendingSalaries,
    sortedSalaries,
  } = useFinance();

  return (
    <>
      {/* ========================================================================================= */}
      {/* 2. SECTION: SALARIES & PAYROLL (قسم الأجور والرواتب) */}
      {/* ========================================================================================= */}
      {activeSubTab === "salaries" && (
        <div className="space-y-6">
          {/* Sub-cards summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الرواتب المصروفة</span>
                <div className="text-2xl font-extrabold text-emerald-800">
                  {totalPaidSalaries.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-emerald-600 mt-1 block">تم تحويلها وصرفها بنجاح</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">الرواتب المستحقة (قيد الانتظار)</span>
                <div className="text-2xl font-extrabold text-amber-700">
                  {totalPendingSalaries.toLocaleString()} <span className="text-xs text-slate-500 font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-amber-600 mt-1 block">مستحقات واجبة الصرف</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-300 block mb-1">مجموع كتلة الأجور والرواتب</span>
                <div className="text-3xl font-black text-rose-300">
                  {(totalPaidSalaries + totalPendingSalaries).toLocaleString()} <span className="text-xs font-normal">د.م</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">للأساتذة والأطر والخدمات</span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-300">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table of Salary Payments */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-800" />
                  <span>سجل مستحقات ورواتب الأساتذة، الأطر والعاملين</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تسجيل وإدارة التعويضات الشهرية للمحفظين، الأطر الإدارية وعمال الصيانة والنظافة.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canCreate && (
                  <>
                    <button
                      onClick={handleAutoGenerateTeacherSalaries}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 border border-amber-300"
                      title="توليد مستحقات جميع الأساتذة لشهر محدد تلقائياً"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>توليد مستحقات الأساتذة تلقائياً</span>
                    </button>

                    <button
                      data-action="open-salary-form"
                      onClick={() => openSalaryModal()}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>صرف / تسجيل أجر جديد</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {renderSortableHeader("اسم المستفيد", "personName", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الفئة والصفة", "personType", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الشهر / السنة", "monthYear", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("المبلغ (د.م)", "amount", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("مصدر الصرف", "paymentSource", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("طريقة الصرف", "paymentMethod", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("تاريخ الصرف", "paymentDate", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    {renderSortableHeader("الحالة", "status", salarySortKey, salarySortDir, (k) => handleToggleSort(k, salarySortKey, salarySortDir, setSalarySortKey, setSalarySortDir))}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        لا توجد سجلات رواتب مسجلة وفق التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    sortedSalaries.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {s.personName}
                          {s.receiptNo && <p className="text-[10px] text-slate-400 font-mono font-normal">وصل: {s.receiptNo}</p>}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full text-[10px] border border-slate-200">
                            {s.personType} {s.roleTitle ? `— ${s.roleTitle}` : ""}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {s.month} {s.year}
                        </td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          {s.amount.toLocaleString()} د.م
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            s.paymentSource === "حساب الجمعية البنكي" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {s.paymentSource}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {s.paymentMethod}
                        </td>
                        <td className="p-3 text-slate-500">
                          {s.paymentDate}
                        </td>
                        <td className="p-3">
                          {s.status === "تم الصرف" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              تم الصرف
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              قيد الانتظار
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {canUpdate && (
                              <button
                                onClick={() => openSalaryModal(s)}
                                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
                                    onDeleteSalaryPayment(s.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
