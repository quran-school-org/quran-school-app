/**
 * Relevé mensuel de présence d'un élève (charte « لوحة الكتّاب ») : choix du
 * mois, synthèse, détail jour par jour, partage WhatsApp et impression A4.
 * Mêmes calculs qu'auparavant ; l'en-tête imprimé reprend les paramètres de l'école.
 */
import { Calendar, Printer, X } from "lucide-react";
import { checkUserPermission } from "../../types";
import { useApp } from "../../app/AppContext";
import { Button, Emblem, FormField, Input, Modal, Pill, WhatsAppIcon } from "../../ui";

const STATUS_PILL: Record<string, { tone: any; label: string }> = {
  "حاضر": { tone: "success", label: "حاضر" },
  "غائب": { tone: "danger", label: "غائب" },
  "متأخر": { tone: "warn", label: "متأخر" },
  "عطلة": { tone: "neutral", label: "عطلة نهاية الأسبوع" },
  "غير مرصود": { tone: "outline", label: "غير مسجل بعد" },
};

export default function MonthlyReportModal() {
  const {
    teachers, classes, attendance, currentUser, selectedStudentForReport, setSelectedStudentForReport,
    setShowMonthlyReportModal, reportYearMonth, setReportYearMonth, currentRole, schoolName, systemSettings, handlePrintReport,
  } = useApp();
  // App.tsx n'affiche la fenêtre qu'avec un élève choisi.
  if (!selectedStudentForReport) return null;

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

          const close = () => {
            setShowMonthlyReportModal(false);
            setSelectedStudentForReport(null);
          };
          const stats = [
            { label: "حاضر فعلي", value: totalPresent, unit: "أيام", cls: "bg-success-100 text-success-800" },
            { label: "تأخير مسجل", value: totalLate, unit: "مرات", cls: "bg-gold-100 text-gold-800" },
            { label: "غياب مسجل", value: totalAbsent, unit: "أيام", cls: "bg-danger-100 text-danger-800" },
            { label: "أيام الدراسة المقررة", value: daysInMonth - totalFridays, unit: "يوم", cls: "bg-sunken text-ink-2" },
          ];
          const logo = systemSettings?.associationLogo;

          return (
            <Modal
              modalId="monthly-report"
              size="lg"
              icon={<Printer className="w-6 h-6" strokeWidth={1.75} />}
              title="كشف الحضور والغياب الشهري التفصيلي"
              subtitle="عرض إحصائيات والتزام الطالب مع إمكانية طباعة تقرير رسمي A4 ومشاركته"
              onClose={close}
              footer={
                <div className="w-full flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                  <Button onClick={close} icon={<X className="w-4 h-4" strokeWidth={1.75} />}>إغلاق الكشف</Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="success" onClick={handleWhatsAppShare} icon={<WhatsAppIcon className="w-4 h-4" />}>مشاركة عبر الواتساب مع ولي الأمر</Button>
                    {checkUserPermission(currentUser, currentRole, "attendance", "print") && (
                      <Button variant="primary" onClick={handlePrintReport} icon={<Printer className="w-4 h-4" strokeWidth={1.75} />}>طباعة الكشف على ورقة A4</Button>
                    )}
                  </div>
                </div>
              }
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-surface-2 border border-line-soft p-4 no-print">
                  <span className="flex items-center gap-2 font-semibold text-ink-2"><Calendar className="w-4 h-4 text-primary" strokeWidth={1.75} aria-hidden="true" />تحديد الشهر والسنة للتقرير</span>
                  <FormField label="شهر الرصد">
                    {(id) => <Input id={id} type="month" value={reportYearMonth} onChange={(e: any) => setReportYearMonth(e.target.value)} className="w-auto" />}
                  </FormField>
                </div>

                <div id="printable-monthly-report" className="bg-white rounded-xl border border-line-soft p-5 text-[13.5px] text-ink">
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-start gap-4 border-b-2 border-primary pb-4">
                      <div className="flex items-center gap-3">
                        {logo ? <img src={logo} alt="" className="w-14 h-14 object-contain" /> : <Emblem size={48} />}
                        <div className="flex flex-col gap-0.5">
                          <p className="m-0 font-display font-semibold text-[18px] text-primary">{schoolName}</p>
                          {systemSettings?.mottoVision && <p className="m-0 text-[12.5px] text-ink-2">{systemSettings.mottoVision}</p>}
                          {systemSettings?.licenseNumber && <p className="m-0 text-[12.5px] text-ink-3">رقم الترخيص: {systemSettings.licenseNumber}</p>}
                        </div>
                      </div>
                      <div className="text-end flex flex-col items-end gap-1">
                        <span className="inline-block bg-night text-gold-100 font-semibold text-[13px] px-3 py-1.5 rounded-lg">كشف الحضور والغياب الشهري</span>
                        <span className="text-[12px] text-ink-3">تاريخ الإصدار: {new Date().toLocaleDateString("ar-MA-u-nu-latn")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-surface-2 border border-line-soft p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] text-ink-3">معلومات الطالب</span>
                        <span className="font-semibold text-[15px]">{selectedStudentForReport.fullName}</span>
                        <span className="text-[12.5px] text-ink-3">مستوى التجويد: {selectedStudentForReport.tajweedLevel}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] text-ink-3">الحلقة والمشرف</span>
                        <span className="font-semibold">{studentClass?.name || "غير محدد"}</span>
                        <span className="text-[12.5px] text-ink-3">المحفظ: {classTeacher?.fullName || "لم يتم تعيين معلّم"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] text-ink-3">الفترة الزمنية للرصد</span>
                        <span className="font-semibold text-primary">{MONTH_NAMES_AR[month]} {year}</span>
                        <span className="text-[12.5px] text-ink-3">الفترة المحددة: {reportYearMonth}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {stats.map((s) => (
                        <div key={s.label} className={"rounded-xl p-3 text-center " + s.cls}>
                          <p className="m-0 text-[12.5px] font-semibold">{s.label}</p>
                          <p className="m-0 mt-1 text-[20px] font-bold tabular-nums">{s.value} <span className="text-[12.5px] font-medium">{s.unit}</span></p>
                        </div>
                      ))}
                      <div className="col-span-2 sm:col-span-1 rounded-xl p-3 text-center bg-night text-night-text">
                        <p className="m-0 text-[12.5px] font-semibold text-gold-100">نسبة الالتزام</p>
                        <p className="m-0 mt-1 text-[20px] font-bold tabular-nums">{attendanceRate}%</p>
                      </div>
                    </div>

                    <p className="m-0 rounded-xl bg-gold-100 text-gold-ink p-3 text-[12.5px] leading-relaxed">
                      <strong>تنويه نظام الجمعية الحسابي:</strong> تم رصد وإعداد هذا الكشف باستبعاد <strong>أيام الجمعة ({totalFridays} أيام في هذا الشهر)</strong> تماماً من حساب الإحصائيات الحالية ومجمل أيام الدراسة، عملاً بالنظام الداخلي الذي يعتبر يوم الجمعة عطلة رسمية بالجمعية.
                    </p>

                    <div className="border border-line rounded-xl overflow-hidden">
                      <table className="w-full text-start border-collapse text-[13px]">
                        <thead>
                          <tr className="bg-sunken text-ink-2">
                            <th scope="col" className="p-2.5 text-start font-semibold">اليوم والتاريخ</th>
                            <th scope="col" className="p-2.5 text-start font-semibold">حالة الرصد</th>
                            <th scope="col" className="p-2.5 text-start font-semibold">التقييم والملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daysList.map((day) => {
                            const pill = STATUS_PILL[day.status];
                            return (
                              <tr key={day.dayNum} className={"border-t border-line-faint " + (day.isFriday ? "bg-surface-2" : "")}>
                                <td className="p-2.5 text-ink-2"><span className="inline-block w-6 text-ink-3 tabular-nums">{day.dayNum}</span>{day.dayName} ، <span dir="ltr">{day.dateStr}</span></td>
                                <td className="p-2.5"><Pill tone={pill.tone}>{pill.label}</Pill></td>
                                <td className="p-2.5 text-ink-3">{day.isFriday ? "عطلة الجمعة الرسمية" : day.notes || "لا يوجد ملاحظات مسجلة"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t-2 border-dashed border-line text-center">
                      {["توقيع المحفظ المشرف", "ختم الجمعية الرسمي", "توقيع إدارة الأكاديمية"].map((label) => (
                        <div key={label} className="flex flex-col gap-10">
                          <p className="m-0 font-semibold text-[13px]">{label}</p>
                          <p className="m-0 text-[12px] text-ink-4">----------------------</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          );
}
