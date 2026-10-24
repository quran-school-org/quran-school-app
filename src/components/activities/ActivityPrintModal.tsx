/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Compass, Users, Printer, X } from "lucide-react";
import { useActivities } from "./ActivitiesContext";

export default function ActivityPrintModal() {
  const {
    systemSettings,
    printType,
    setPrintType,
    selectedParticipantForTicket,
    allStaff,
    getParticipantRole,
    resolveParticipantFee,
    resolveParticipantPaid,
    resolvePaymentStatusInfo,
    currentActivity,
    printableParticipants,
    currentExpenses,
    currentFinances,
  } = useActivities();

  return (
    <>
      {/* PRINT MODAL: Official Moroccan Association Printable Document */}
      {printType && currentActivity && (
        <div
          id="printable-activity-modal-wrapper"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-transparent print:overflow-visible print:block bg-night/55 backdrop-blur-[2px]"
        >
          <div className="bg-surface max-w-4xl w-full overflow-hidden my-6 flex flex-col print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:rounded-none rounded-3xl border border-line shadow-pop">

            {/* Screen Top Action Header (Hidden on Print) */}
            <div className="p-4 bg-sand-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm">
                  {printType === "participants-list" && "معاينة طباعة لائحة المشاركين الرسمية"}
                  {printType === "financial-report" && "معاينة طباعة التقرير المالي والمحاسبي للنشاط"}
                  {printType === "participant-ticket" && "معاينة طباعة بطاقة المشارك المعتمدة"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوثيقة الآن</span>
                </button>
                <button
                  onClick={() => setPrintType(null)}
                  className="bg-sand-800 hover:bg-sand-700 text-sand-200 p-2 rounded-xl transition-all cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Container */}
            <div
              id="printable-activity-sheet"
              className="p-8 sm:p-12 space-y-6 bg-white text-ink font-sans print:p-0 print:m-0 print:space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible text-right"
              dir="rtl"
            >
              {/* 1. Official Moroccan Association Letterhead */}
              <div className="border-b-2 border-sand-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Right Header Section */}
                  <div className="text-right space-y-1">
                    <div className="text-[13px] font-bold text-ink-3 tracking-wider">المملكة المغربية</div>
                    <h2 className="text-base font-bold text-primary leading-snug">
                      {systemSettings?.associationName || ""}
                    </h2>
                    <p className="text-[12.5px] text-ink-2 font-medium">
                      {systemSettings?.associationAddress || "مقر الجمعية الرئيسي"}
                    </p>
                    <p className="text-[12.5px] text-ink-2 font-mono">
                      الهاتف: {systemSettings?.associationPhone || "—"} {systemSettings?.associationEmail ? ` | البريد: ${systemSettings.associationEmail}` : ""}
                    </p>
                  </div>

                  {/* Center Header Section: Logo & Emblem */}
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    {systemSettings?.associationLogo ? (
                      <img
                        src={systemSettings.associationLogo}
                        alt="شعار الجمعية"
                        className="h-16 w-16 object-contain mb-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary-700 text-white flex items-center justify-center font-bold text-2xl mb-1">
                        <Compass className="w-8 h-8" />
                      </div>
                    )}
                    <span className="text-[11.5px] font-bold text-ink-3">
                      إدارة الأنشطة والرحلات المعتمدة
                    </span>
                  </div>

                  {/* Left Header Section: Date, Season & Serial Reference */}
                  <div className="text-left space-y-1">
                    <div className="inline-block bg-sand-900 text-white text-[12.5px] font-bold px-3 py-1 rounded-md">
                      وثيقة إدارية رسمية
                    </div>
                    <div className="text-[13px] text-ink-2 font-medium mt-1">
                      التاريخ: <span className="font-mono font-bold">{new Date().toLocaleDateString('ar-MA')}</span>
                    </div>
                    <div className="text-[13px] text-ink-2 font-medium">
                      الموسم: <span className="font-bold">{systemSettings?.activeAcademicSeason || ""}</span>
                    </div>
                    <div className="text-[12.5px] text-ink-3 font-mono">
                      المرجع: ACT-{currentActivity.id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Document Title & Activity Metadata Banner */}
              <div className="bg-sand-50 border border-line-strong rounded-xl p-4 space-y-2 break-inside-avoid">
                <div className="text-center pb-2 border-b border-line">
                  <h1 className="text-lg font-bold text-ink">
                    {printType === "participants-list" && "لائحة المشاركين والمؤطرين المعتمدة"}
                    {printType === "financial-report" && "التقرير المالي والمحاسبي المعتمد للنشاط"}
                    {printType === "participant-ticket" && "بطاقة وشارة مشارك معتمدة"}
                  </h1>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px] pt-1">
                  <div>
                    <span className="text-ink-3 font-medium block">اسم النشاط:</span>
                    <span className="font-bold text-ink">{currentActivity.title}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 font-medium block">نوع النشاط:</span>
                    <span className="font-bold text-ink">{currentActivity.type}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 font-medium block">الوجهة أو المكان:</span>
                    <span className="font-bold text-ink">{currentActivity.location}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 font-medium block">تاريخ الانطلاق:</span>
                    <span className="font-bold font-mono text-ink">{currentActivity.startDate} {currentActivity.endDate ? `إلى ${currentActivity.endDate}` : ""}</span>
                  </div>
                </div>

                {currentActivity.leaderIds && currentActivity.leaderIds.length > 0 && (
                  <div className="pt-2 border-t border-line text-[13px]">
                    <span className="text-ink-3 font-medium">المؤطرون والمشرفون المعتمدون: </span>
                    <span className="font-bold text-ink">
                      {allStaff.filter(t => currentActivity.leaderIds.includes(t.id)).map(t => `${t.fullName} (${t.roleTitle || t.category || "مؤطر"})`).join(" • ") || "الإدارة التربوية"}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Document Body Content */}

              {/* OPTION A: Participants List Table */}
              {printType === "participants-list" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-[13px] border border-sand-400">
                      <thead>
                        <tr className="bg-sand-100 text-ink font-bold border-b border-sand-400">
                          <th className="p-2.5 border border-sand-400 text-center w-10">#</th>
                          <th className="p-2.5 border border-sand-400">الاسم الكامل للمشارك</th>
                          <th className="p-2.5 border border-sand-400 text-center">الصفة / المسمى الوظيفي</th>
                          <th className="p-2.5 border border-sand-400 text-center">الهاتف</th>
                          <th className="p-2.5 border border-sand-400 text-center">المساهمة الواجبة</th>
                          <th className="p-2.5 border border-sand-400 text-center">المبلغ المؤدى</th>
                          <th className="p-2.5 border border-sand-400 text-center">حالة الأداء</th>
                          <th className="p-2.5 border border-sand-400 text-center">رقم الوصل</th>
                          <th className="p-2.5 border border-sand-400 text-center w-28">توقيع الحضور</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printableParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-ink-3 border border-sand-400">
                              لا يوجد مشاركون مسجلون في هذا النشاط بعد.
                            </td>
                          </tr>
                        ) : (
                          printableParticipants.map((p, i) => {
                            const feeVal = resolveParticipantFee(p);
                            const paidVal = resolveParticipantPaid(p);
                            const statusInfo = resolvePaymentStatusInfo(p);

                            return (
                              <tr key={p.id} className={i % 2 === 1 ? "bg-sand-50" : "bg-white"}>
                                <td className="p-2 border border-sand-400 text-center font-mono font-bold text-ink-2">{i + 1}</td>
                                <td className="p-2 border border-sand-400 font-bold text-ink">{p.fullName}</td>
                                <td className="p-2 border border-sand-400 text-center font-bold text-ink">{getParticipantRole(p)}</td>
                                <td className="p-2 border border-sand-400 text-center font-mono text-ink-2">{p.phone || "—"}</td>
                                <td className="p-2 border border-sand-400 text-center font-mono text-ink font-bold">
                                  {statusInfo.status === "معفى" && feeVal === 0 ? "معفى (0 د.م)" : `${feeVal.toLocaleString()} د.م`}
                                </td>
                                <td className="p-2 border border-sand-400 text-center font-mono font-bold text-primary-800">
                                  {paidVal.toLocaleString()} د.م
                                </td>
                                <td className="p-2 border border-sand-400 text-center font-bold">
                                  <span className={statusInfo.colorClass}>
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="p-2 border border-sand-400 text-center font-mono text-ink-2">{p.receiptNo || "—"}</td>
                                <td className="p-2 border border-sand-400"></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {printableParticipants.length > 0 && (
                        <tfoot>
                          <tr className="bg-sand-100 font-bold text-ink border-t-2 border-sand-400">
                            <td colSpan={4} className="p-2.5 border border-sand-400 text-right">
                              المجموع العام: {printableParticipants.length} مشارك ومؤطر
                            </td>
                            <td className="p-2.5 border border-sand-400 text-center font-mono font-bold text-ink">
                              {printableParticipants.reduce((sum, p) => sum + resolveParticipantFee(p), 0).toLocaleString()} د.م
                            </td>
                            <td className="p-2.5 border border-sand-400 text-center font-mono text-primary-900 font-bold">
                              {printableParticipants.reduce((sum, p) => sum + resolveParticipantPaid(p), 0).toLocaleString()} د.م
                            </td>
                            <td colSpan={3} className="p-2.5 border border-sand-400 text-center text-[12.5px] text-ink-2 font-semibold">
                              {(() => {
                                const paidCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "مدفوع").length;
                                const partialCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "مدفوع جزئياً").length;
                                const exemptCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "معفى").length;
                                const unpaidCount = printableParticipants.filter(p => resolvePaymentStatusInfo(p).status === "غير مدفوع").length;

                                return (
                                  <span>
                                    مدفوع: <strong className="text-primary-800">{paidCount}</strong> | 
                                    مدفوع جزئياً: <strong className="text-gold-800">{partialCount}</strong> | 
                                    معفى: <strong className="text-primary-800">{exemptCount}</strong> | 
                                    غير مدفوع: <strong className="text-danger-800">{unpaidCount}</strong>
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* OPTION B: Financial Report Table */}
              {printType === "financial-report" && (
                <div className="space-y-6">
                  {/* Financial Balance Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 text-center break-inside-avoid">
                    <div className="border border-primary-300 p-3.5 rounded-xl bg-primary-50/70">
                      <div className="text-[13px] font-bold text-primary-900">إجمالي المداخيل المحصلة</div>
                      <div className="text-xl font-bold text-primary-800 mt-1 font-mono">
                        {currentFinances.totalCollected.toLocaleString()} د.م
                      </div>
                      <div className="text-[11.5px] text-primary-700 mt-0.5 font-medium">مساهمات المشاركين المسجلة</div>
                    </div>

                    <div className="border border-danger-300 p-3.5 rounded-xl bg-danger-50/70">
                      <div className="text-[13px] font-bold text-danger-900">إجمالي المصاريف والنفقات</div>
                      <div className="text-xl font-bold text-danger-800 mt-1 font-mono">
                        {currentFinances.totalSpent.toLocaleString()} د.م
                      </div>
                      <div className="text-[11.5px] text-danger-700 mt-0.5 font-medium">جميع فواتير وأوصال الصرف</div>
                    </div>

                    <div className={`border p-3.5 rounded-xl ${currentFinances.netBalance >= 0 ? "border-primary-300 bg-primary-50/40" : "border-gold-300 bg-gold-50/40"}`}>
                      <div className="text-[13px] font-bold text-ink">الصافي المالي للنشاط</div>
                      <div className={`text-xl font-bold mt-1 font-mono ${currentFinances.netBalance >= 0 ? "text-primary-800" : "text-gold-800"}`}>
                        {currentFinances.netBalance >= 0 ? `+${currentFinances.netBalance.toLocaleString()}` : currentFinances.netBalance.toLocaleString()} د.م
                      </div>
                      <div className="text-[11.5px] text-ink-2 mt-0.5 font-medium">
                        {currentFinances.netBalance >= 0 ? "فائض مالي يُرحّل للخزينة" : "عجز مالي مغطى من صندوق الجمعية"}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Expenses Table */}
                  <div className="space-y-2">
                    <div className="text-[13px] font-bold text-ink">تفاصيل بنود المصاريف والنفقات المنفذة:</div>
                    <table className="w-full text-right text-[13px] border border-sand-400">
                      <thead>
                        <tr className="bg-sand-100 text-ink font-bold border-b border-sand-400">
                          <th className="p-2.5 border border-sand-400 text-center w-10">#</th>
                          <th className="p-2.5 border border-sand-400">بيان / عنوان المصروف</th>
                          <th className="p-2.5 border border-sand-400 text-center">الصنف / الفئة</th>
                          <th className="p-2.5 border border-sand-400 text-center">المبلغ (د.م)</th>
                          <th className="p-2.5 border border-sand-400 text-center">طريقة الدفع</th>
                          <th className="p-2.5 border border-sand-400 text-center">المورد / الجهة</th>
                          <th className="p-2.5 border border-sand-400 text-center">رقم الفاتورة / الوصل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-ink-3 border border-sand-400">
                              لا توجد مصاريف مسجلة لهذا النشاط بعد.
                            </td>
                          </tr>
                        ) : (
                          currentExpenses.map((e, idx) => (
                            <tr key={e.id} className={idx % 2 === 1 ? "bg-sand-50" : "bg-white"}>
                              <td className="p-2 border border-sand-400 text-center font-mono font-bold text-ink-2">{idx + 1}</td>
                              <td className="p-2 border border-sand-400 font-bold text-ink">{e.title}</td>
                              <td className="p-2 border border-sand-400 text-center font-medium text-ink-2">{e.category}</td>
                              <td className="p-2 border border-sand-400 text-center font-mono font-bold text-danger-800">{e.amount.toLocaleString()} د.م</td>
                              <td className="p-2 border border-sand-400 text-center text-ink-2">{e.paymentMethod}</td>
                              <td className="p-2 border border-sand-400 text-center text-ink-2">{e.supplier || "—"}</td>
                              <td className="p-2 border border-sand-400 text-center font-mono text-ink-2">{e.receiptOrInvoiceNo || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {currentExpenses.length > 0 && (
                        <tfoot>
                          <tr className="bg-sand-100 font-bold text-ink border-t-2 border-sand-400">
                            <td colSpan={3} className="p-2.5 border border-sand-400 text-right">
                              مجموع النفقات والمصاريف:
                            </td>
                            <td className="p-2.5 border border-sand-400 text-center font-mono text-danger-900 font-bold">
                              {currentFinances.totalSpent.toLocaleString()} د.م
                            </td>
                            <td colSpan={3} className="p-2.5 border border-sand-400 text-center text-[12.5px] text-ink-2">
                              عدد فواتير وأوصال المصاريف: {currentExpenses.length}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Accounting Statement Note */}
                  <div className="bg-sand-50 border border-line rounded-xl p-3.5 text-[13px] text-ink-2 leading-relaxed break-inside-avoid">
                    <span className="font-bold text-ink block mb-1">إشهاد ومصادقة محاسبية:</span>
                    يشهد المكتب التنفيذي للجمعية أن جميع المداخيل والمصاريف المذكورة أعلاه صحيحة ومدعمة بالوثائق الإثباتية والفواتير القانونية، وتم تقييد الصافي المالي ضمن الحسابات الجمعوية المعتمدة.
                  </div>
                </div>
              )}

              {/* OPTION C: Single Participant Pass Ticket */}
              {printType === "participant-ticket" && selectedParticipantForTicket && (
                <div className="border-2 border-sand-900 rounded-2xl p-6 bg-sand-50 text-right space-y-4 max-w-md mx-auto break-inside-avoid">
                  <div className="flex items-center justify-between border-b-2 border-sand-900 pb-3">
                    <div>
                      <span className="bg-primary-700 text-white text-[12.5px] font-bold px-3 py-1 rounded-full">
                        شارة مشارك معتمدة
                      </span>
                      <h3 className="text-lg font-bold text-primary mt-2">{selectedParticipantForTicket.fullName}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <span className="text-ink-3 font-medium block">الصفة / المسمى الوظيفي:</span>
                      <span className="font-bold text-ink">{getParticipantRole(selectedParticipantForTicket)}</span>
                    </div>
                    <div>
                      <span className="text-ink-3 font-medium block">الهاتف:</span>
                      <span className="font-bold font-mono text-ink">{selectedParticipantForTicket.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-ink-3 font-medium block">النشاط / الرحلة:</span>
                      <span className="font-bold text-ink">{currentActivity.title}</span>
                    </div>
                    <div>
                      <span className="text-ink-3 font-medium block">تاريخ الانطلاق:</span>
                      <span className="font-bold font-mono text-ink">{currentActivity.startDate}</span>
                    </div>
                    <div>
                      <span className="text-ink-3 font-medium block">المساهمة المؤداة:</span>
                      <span className="font-bold font-mono text-primary-800">{selectedParticipantForTicket.paidAmount} د.م</span>
                    </div>
                    <div>
                      <span className="text-ink-3 font-medium block">رقم الوصل:</span>
                      <span className="font-bold font-mono text-ink">{selectedParticipantForTicket.receiptNo || "خالص"}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line-strong flex items-center justify-between text-[12.5px] text-ink-2">
                    <span>خاتم وتأشيرة الإدارة:</span>
                    <span className="font-mono">{new Date().toLocaleDateString('ar-MA')}</span>
                  </div>
                  <div className="h-12 border border-dashed border-line-strong rounded-lg flex items-center justify-center text-[12.5px] text-ink-3">
                    موضع خاتم وتأشيرة المشرف العام
                  </div>
                </div>
              )}

              {/* 4. Official Signatures & Seal Section */}
              <div className="pt-8 border-t-2 border-sand-900 grid grid-cols-3 gap-6 text-center break-inside-avoid">
                <div className="space-y-1">
                  <div className="text-[13px] font-bold text-ink">المشرف العام / الكاتب العام</div>
                  <div className="text-[12.5px] text-ink-2 font-medium">
                    {systemSettings?.generalSupervisorName || systemSettings?.secretaryGeneralName || "...................."}
                  </div>
                  <div className="h-16 border-b border-dashed border-line-strong flex items-end justify-center pb-1">
                    <span className="text-[11.5px] text-ink-3">توقيع المشرف</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[13px] font-bold text-ink">أمين مال الجمعية</div>
                  <div className="text-[12.5px] text-ink-2 font-medium">
                    {systemSettings?.treasurerName || "...................."}
                  </div>
                  <div className="h-16 border-b border-dashed border-line-strong flex items-end justify-center pb-1">
                    <span className="text-[11.5px] text-ink-3">توقيع أمين المال</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[13px] font-bold text-ink">رئيس الجمعية</div>
                  <div className="text-[12.5px] text-ink-2 font-medium">
                    {systemSettings?.presidentName || "...................."}
                  </div>
                  <div className="h-16 border border-dashed border-sand-400 rounded-lg flex items-center justify-center">
                    <span className="text-[11.5px] text-ink-3">الخاتم الرسمي والتوقيع</span>
                  </div>
                </div>
              </div>

              {/* 5. Document Micro Footer */}
              <div className="pt-3 border-t border-line text-center text-[11.5px] text-ink-3 break-inside-avoid">
                وثيقة إدارية ومحاسبية رسمية صادرة عن منظومة الجمعية • {systemSettings?.associationName || ""} • صفحة معتمدة
              </div>
            </div>

            {/* Screen Bottom Action Toolbar (Hidden on Print) */}
            <div className="p-4 bg-sand-100 border-t border-line flex items-center justify-between print:hidden">
              <button
                onClick={() => setPrintType(null)}
                className="px-5 py-2 text-[13px] font-bold text-ink-2 hover:text-ink bg-white border border-line-strong rounded-xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ink-3 hidden sm:inline">
                  ملاحظة: اضغط على طباعة لفتح نافذة الطابعة بحجم A4 المعتمد
                </span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوثيقة الآن</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
