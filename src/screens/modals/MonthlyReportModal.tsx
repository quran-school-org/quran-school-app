/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../../types";
import { X, Calendar, Info, Printer } from "lucide-react";
import { useApp } from "../../app/AppContext";

export default function MonthlyReportModal() {
  const {
    teachers,
    classes,
    attendance,
    currentUser,
    selectedStudentForReport,
    setSelectedStudentForReport,
    setShowMonthlyReportModal,
    reportYearMonth,
    setReportYearMonth,
    currentRole,
    schoolName,
    handlePrintReport,
  } = useApp();

          const [yearStr, monthStr] = reportYearMonth.split("-");
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1; // 0-indexed month
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          const ARABIC_DAYS_OF_WEEK = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
          const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

          let totalPresent = 0;
          let totalAbsent = 0;
          let totalLate = 0;
          let totalFridays = 0;

          const daysList = [];

          for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            const dayOfWeek = currentDate.getDay(); // 0: Sun, 5: Fri, 6: Sat
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isFriday = dayOfWeek === 5;

            const record = attendance.find(a => a.date === dateString && a.studentId === selectedStudentForReport.id);

            let status: "حاضر" | "غائب" | "متأخر" | "غير مرصود" | "عطلة" = "غير مرصود";
            if (isFriday) {
              status = "عطلة";
              totalFridays++;
            } else if (record) {
              status = record.status;
              if (status === "حاضر") totalPresent++;
              else if (status === "متأخر") totalLate++;
              else if (status === "غائب") totalAbsent++;
            }

            daysList.push({
              dayNum: d,
              dateStr: dateString,
              dayName: ARABIC_DAYS_OF_WEEK[dayOfWeek],
              status,
              isFriday,
              notes: record?.notes || "",
            });
          }

          const totalActiveDays = totalPresent + totalLate + totalAbsent;
          const attendanceRate = totalActiveDays > 0 
            ? Math.round(((totalPresent + totalLate) / totalActiveDays) * 100)
            : 100;

          const studentClass = classes.find(c => c.id === selectedStudentForReport.classId);
          const classTeacher = teachers.find(t => t.id === studentClass?.teacherId);

          const handleWhatsAppShare = () => {
            const parentName = selectedStudentForReport.parentName || "ولي الأمر المحترم";
            const studentName = selectedStudentForReport.fullName;
            const monthName = MONTH_NAMES_AR[month];
            const studyDays = daysInMonth - totalFridays;

            const messageText = `السلام عليكم ورحمة الله وبركاته،
  المحترم(ة) ${parentName}، ولي أمر الطالب(ة) *${studentName}*،

  نرسل لكم تقرير الحضور والغياب الشهري الخاص بابنكم(بنتكم) لشهر *${monthName} ${year}*:

  📊 *إحصائيات الشهر (باستثناء عطلة الجمعة):*
  - عدد أيام الحضور الفعلي: *${totalPresent}* أيام
  - عدد مرات التأخير: *${totalLate}* مرات
  - عدد أيام الغياب: *${totalAbsent}* أيام
  - مجموع الحصص المقررة: *${studyDays}* حصة
  - نسبة الالتزام الإجمالية: *${attendanceRate}%*

  💡 *ملاحظة:* لا يتم احتساب أيام الجمعة في الكشف لكونها عطلة نهاية الأسبوع الرسمية بالجمعية.

  شاكرين لكم حسن تعاونكم وحرصكم على التزام ابنكم ومتابعته المستمرة في حفظ كتاب الله.
  *${schoolName}*`;

            const cleanPhone = (phone: string) => {
              const digits = phone.replace(/\D/g, "");
              if (digits.startsWith("0") && digits.length === 10) {
                return "212" + digits.substring(1);
              }
              return digits || phone;
            };

            const rawPhone = selectedStudentForReport.parentPhone || "";
            const targetPhone = cleanPhone(rawPhone);
            const encodedText = encodeURIComponent(messageText);
            const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedText}`;
            window.open(whatsappUrl, "_blank");
          };

          return (
            <div data-modal="monthly-report" className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ direction: "rtl" }}>
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 border border-sand-100">
                {/* Modal Header */}
                <div className="p-5 bg-sand-800 text-white flex justify-between items-center no-print">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Printer className="w-5 h-5 text-primary-400" />
                      <span>كشف الحضور والغياب الشهري التفصيلي</span>
                    </h3>
                    <p className="text-[10px] text-sand-400">عرض إحصائيات والتزام الطالب مع إمكانية طباعة تقرير رسمي A4 ومشاركته</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowMonthlyReportModal(false);
                      setSelectedStudentForReport(null);
                    }} 
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">

                  {/* Report Month Picker (No-Print) */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-sand-50 border border-sand-200 p-4 rounded-xl no-print">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-700" />
                      <span className="font-bold text-sand-700">تحديد الشهر والسنة للتقرير:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="month" 
                        value={reportYearMonth} 
                        onChange={(e) => setReportYearMonth(e.target.value)} 
                        className="p-2 border border-sand-300 rounded-lg font-mono text-xs font-bold text-sand-700 bg-white focus:outline-primary-600 cursor-pointer" 
                      />
                      <span className="text-[10px] text-sand-500 font-medium">اختر شهر الرصد</span>
                    </div>
                  </div>

                  {/* Printable Area Wrapper */}
                  <div id="printable-monthly-report" className="bg-white p-2">
                    <div className="space-y-6">

                      {/* Printable Top Decorative Header */}
                      <div className="flex justify-between items-start border-b-2 border-primary-800 pb-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-sand-800 text-sm">{schoolName}</p>
                          <p className="text-[10px] text-primary-800 font-bold">حلقات التاج والوقار النموذجية بالمملكة المغربية</p>
                          <p className="text-[9px] text-sand-500 font-mono">الرقم المرجعي للأكاديمية: AI-ACAD-2026</p>
                        </div>
                        <div className="text-left">
                          <div className="bg-primary-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-block shadow-sm">
                            كشف الحضور والغياب الشهري
                          </div>
                          <p className="text-[10px] text-sand-500 font-bold mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-MA')}</p>
                        </div>
                      </div>

                      {/* Info Block Grid */}
                      <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-sand-500 font-bold">معلومات الطالب:</p>
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🧒</span>
                            <div>
                              <p className="font-extrabold text-sand-800 text-sm">{selectedStudentForReport.fullName}</p>
                              <p className="text-[10px] text-sand-500">مستوى التجويد: {selectedStudentForReport.tajweedLevel}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] text-sand-500 font-bold">الحلقة والمشرف:</p>
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">🏫</span>
                            <div>
                              <p className="font-bold text-sand-700 text-xs">{studentClass?.name || "غير محدد"}</p>
                              <p className="text-[10px] text-sand-500">المحفظ: {classTeacher?.fullName || "لم يتم تعيين معلّم"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] text-sand-500 font-bold">الفترة الزمنية للرصد:</p>
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">📅</span>
                            <div>
                              <p className="font-extrabold text-primary-800 text-xs">{MONTH_NAMES_AR[month]} {year}</p>
                              <p className="text-[10px] text-sand-500">الفترة المحددة: {reportYearMonth}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stat Widgets (Excluding Fridays) */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">

                        <div className="bg-primary-50/60 border border-primary-100 p-3 rounded-xl text-center">
                          <p className="text-[10px] text-primary-800 font-bold">حاضر فعلي</p>
                          <p className="text-lg font-black text-primary-900 mt-1">{totalPresent} أيام</p>
                        </div>

                        <div className="bg-gold-50/60 border border-gold-100 p-3 rounded-xl text-center">
                          <p className="text-[10px] text-gold-800 font-bold">تأخير مسجل</p>
                          <p className="text-lg font-black text-gold-900 mt-1">{totalLate} مرات</p>
                        </div>

                        <div className="bg-danger-50/60 border border-danger-100 p-3 rounded-xl text-center">
                          <p className="text-[10px] text-danger-800 font-bold">غياب مسجل</p>
                          <p className="text-lg font-black text-danger-900 mt-1">{totalAbsent} أيام</p>
                        </div>

                        <div className="bg-sand-50 border border-sand-200 p-3 rounded-xl text-center">
                          <p className="text-[10px] text-sand-500 font-bold">أيام الدراسة المقررة</p>
                          <p className="text-lg font-black text-sand-700 mt-1">{daysInMonth - totalFridays} يوم</p>
                        </div>

                        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary-800 to-primary-800 p-3 rounded-xl text-center text-white shadow-xs">
                          <p className="text-[10px] text-primary-100 font-bold">نسبة الالتزام</p>
                          <p className="text-lg font-black mt-1">{attendanceRate}%</p>
                        </div>

                      </div>

                      {/* Exclude Friday Note Banner */}
                      <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 flex items-start gap-2.5">
                        <span className="text-sm shrink-0">🕌</span>
                        <p className="text-[10px] text-gold-900 font-medium leading-relaxed">
                          <strong>تنويه نظام الجمعية الحسابي:</strong> تم رصد وإعداد هذا الكشف باستبعاد <strong>أيام الجمعة ({totalFridays} أيام في هذا الشهر)</strong> تماماً من حساب الإحصائيات الحالية ومجمل أيام الدراسة، عملاً بالنظام الداخلي الذي يعتبر يوم الجمعة عطلة رسمية بالجمعية.
                        </p>
                      </div>

                      {/* Daily List Table */}
                      <div className="border border-sand-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-right border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-sand-100 border-b border-sand-200 text-sand-700 font-bold">
                              <th className="p-2.5">اليوم والتاريخ</th>
                              <th className="p-2.5">حالة الرصد</th>
                              <th className="p-2.5">التقييم والملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sand-100">
                            {daysList.map((day) => {
                              let statusBadge = null;
                              if (day.status === "حاضر") {
                                statusBadge = <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded font-bold text-[10px]">حاضر ✅</span>;
                              } else if (day.status === "غائب") {
                                statusBadge = <span className="bg-danger-100 text-danger-800 px-2 py-0.5 rounded font-bold text-[10px]">غائب ❌</span>;
                              } else if (day.status === "متأخر") {
                                statusBadge = <span className="bg-gold-100 text-gold-800 px-2 py-0.5 rounded font-bold text-[10px]">متأخر 🕒</span>;
                              } else if (day.status === "عطلة") {
                                statusBadge = <span className="bg-sand-100 text-sand-500 px-2 py-0.5 rounded font-semibold italic text-[10px]">عطلة نهاية الأسبوع 🕌</span>;
                              } else {
                                statusBadge = <span className="bg-sand-50 text-sand-500 px-2 py-0.5 rounded text-[10px]">غير مسجل بعد ➖</span>;
                              }

                              return (
                                <tr key={day.dayNum} className={`hover:bg-sand-50/40 transition ${day.isFriday ? "bg-sand-50/50" : ""}`}>
                                  <td className="p-2.5 font-bold text-sand-700">
                                    <span className="font-mono text-sand-500 text-[10px] ml-1.5">{day.dayNum}</span>
                                    {day.dayName} ، {day.dateStr}
                                  </td>
                                  <td className="p-2.5">{statusBadge}</td>
                                  <td className="p-2.5 text-sand-500 font-medium">
                                    {day.isFriday ? "عطلة الجمعة الرسمية" : day.notes || "لا يوجد ملاحظات مسجلة"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Official Signatures for Printed Sheet */}
                      <div className="grid grid-cols-3 gap-4 pt-10 border-t-2 border-dashed border-sand-200 mt-12 text-center text-sand-700">
                        <div className="space-y-4">
                          <p className="font-bold text-xs text-sand-800">توقيع المحفظ المشرف</p>
                          <div className="h-10"></div>
                          <p className="text-[10px] text-sand-500">----------------------</p>
                        </div>
                        <div className="space-y-4">
                          <p className="font-bold text-xs text-sand-800">ختم الجمعية الرسمي</p>
                          <div className="h-10"></div>
                          <p className="text-[10px] text-sand-500">----------------------</p>
                        </div>
                        <div className="space-y-4">
                          <p className="font-bold text-xs text-sand-800">توقيع إدارة الأكاديمية</p>
                          <div className="h-10"></div>
                          <p className="text-[10px] text-sand-500">----------------------</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Modal Actions / Print (No-Print) */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t no-print">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMonthlyReportModal(false);
                        setSelectedStudentForReport(null);
                      }}
                      className="px-5 py-2.5 bg-sand-100 hover:bg-sand-200 rounded-xl text-sand-700 font-bold transition flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>إغلاق الكشف</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* WhatsApp share button */}
                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.292 1.503 4.933 1.505 5.424.004 9.835-4.394 9.839-9.82.002-2.628-1.02-5.1-2.88-6.962C16.621 1.955 14.153.931 11.53.927c-5.432 0-9.843 4.403-9.847 9.827-.001 1.761.478 3.48 1.385 5.016l-.99 3.616 3.73-.976zm12.115-4.43c-.329-.165-1.947-.961-2.246-1.07-.3-.109-.518-.164-.736.164-.218.328-.844 1.07-1.034 1.289-.19.219-.38.246-.709.08-1.353-.678-2.3-1.176-3.21-2.735-.24-.411.24-.381.688-1.277.075-.15.038-.282-.019-.395-.056-.113-.518-1.249-.71-1.711-.186-.447-.373-.387-.518-.394l-.442-.008c-.15 0-.395.056-.601.282-.206.226-.785.767-.785 1.87 0 1.104.8 2.167.912 2.318.112.15 1.573 2.4 3.812 3.367.532.23 1.053.391 1.411.474.56.126 1.07.108 1.473.048.45-.067 1.473-.601 1.68-1.182.206-.581.206-1.08.145-1.183-.06-.103-.218-.164-.547-.329z"/>
                        </svg>
                        <span>مشاركة عبر الواتساب مع ولي الأمر</span>
                      </button>

                      {checkUserPermission(currentUser, currentRole, "attendance", "print") && (
                        <button
                          type="button"
                          onClick={handlePrintReport}
                          className="px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md"
                        >
                          <Printer className="w-4 h-4" />
                          <span>طباعة الكشف على ورقة A4</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
}
