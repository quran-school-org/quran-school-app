/**
 * Présences du jour (charte « لوحة الكتّاب ») : filtres, lecteur QR / manuel,
 * alertes d'absences consécutives, liste de pointage. Même logique qu'auparavant.
 */
import React from "react";
import { AlertTriangle, Bell, Camera, CheckCircle2, Clock3, FileText, Info, Keyboard, QrCode, Search, Volume2, X, XCircle } from "lucide-react";
import { StudentAvatar } from "../utils/studentAvatar";
import { useApp } from "../app/AppContext";
import {
  ActionAlert, Button, Card, CardHeader, EmptyState, FormField, IconButton, Input, KpiGrid, KpiTile, Ltr, PageHeader, Pill,
  SearchInput, SegmentedControl, Select, WhatsAppIcon, cx,
} from "../ui";

const ic = (C: any, cls = "w-4 h-4") => <C className={cls} strokeWidth={1.75} aria-hidden="true" />;

const STATUS_BUTTONS = [
  { value: "حاضر", icon: CheckCircle2, on: "bg-success-700 text-white border-success-700" },
  { value: "متأخر", icon: Clock3, on: "bg-gold text-night border-gold" },
  { value: "غائب", icon: XCircle, on: "bg-danger text-white border-danger" },
] as const;

export default function AttendanceScreen() {
  const {
    students, classes, attendance, selectedClassId, setSelectedClassId, attendanceDate, setAttendanceDate,
    isScanning, setIsScanning, scanStatus, setScanStatus, scannerInputValue, setScannerInputValue,
    showScannerPanel, setShowScannerPanel, setSelectedStudentForReport, setShowMonthlyReportModal,
    attendanceSearchQuery, setAttendanceSearchQuery, getConsecutiveAbsences, handleSendAbsenceWarning,
    handleToggleAttendance, playBeep, handleScannedValue,
  } = useApp();

  const classStudents = selectedClassId === "all" ? students : students.filter((st) => st.classId === selectedClassId);
  const urgent = classStudents
    .filter((st) => !st.isArchived)
    .map((st) => ({ student: st, count: getConsecutiveAbsences(st.id) }))
    .filter((item) => item.count >= 3);
  const filtered = classStudents.filter((st) => {
    if (attendanceSearchQuery.trim() === "") return !st.isArchived;
    const query = attendanceSearchQuery.toLowerCase().trim();
    return (st.fullName || "").toLowerCase().includes(query) || (st.parentName || "").toLowerCase().includes(query) || (st.parentPhone || "").includes(query);
  });
  const statusOf = (id: string) => attendance.find((a) => a.date === attendanceDate && a.studentId === id)?.status || "غير مرصود";
  const counts = { "حاضر": 0, "متأخر": 0, "غائب": 0, "غير مرصود": 0 } as Record<string, number>;
  filtered.forEach((st) => { counts[statusOf(st.id)] = (counts[statusOf(st.id)] || 0) + 1; });

  const openReport = (st: any) => { setSelectedStudentForReport(st); setShowMonthlyReportModal(true); };
  const mode = !showScannerPanel ? "off" : isScanning ? "camera" : "manual";
  const setMode = (m: string) => {
    if (m === "manual") { setIsScanning(false); setShowScannerPanel(true); }
    else if (m === "camera") { setShowScannerPanel(true); setIsScanning(true); }
  };

  return (
    <div data-screen="attendance" className="flex flex-col gap-6">
      <PageHeader title="الحضور والغياب" description="حصر الحضور والغياب اليومي لحلقات القرآن: اختر الحلقة والتاريخ ثم ارصد الحضور بنقرة واحدة." />

      <div className="flex flex-wrap items-end gap-3">
        <FormField label="بحث عن طالب (نشط أو مؤرشف)" className="flex-[1_1_240px] max-w-sm">
          {(id) => <SearchInput id={id} icon={ic(Search)} value={attendanceSearchQuery} onChange={(e: any) => setAttendanceSearchQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." />}
        </FormField>
        <FormField label="حلقة التحفيظ">
          {(id) => (
            <Select id={id} value={selectedClassId} onChange={(v) => setSelectedClassId(v)} className="w-auto">
              <option value="all">الكل (جميع الحلقات والطلاب)</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label="تاريخ الحلقة">
          {(id) => <Input id={id} type="date" value={attendanceDate} onChange={(e: any) => setAttendanceDate(e.target.value)} className="w-auto" />}
        </FormField>
      </div>

      <KpiGrid label="ملخص رصد اليوم" min={170}>
        <KpiTile size="md" label="حاضر" value={counts["حاضر"]} unit="طالب" />
        <KpiTile size="md" label="متأخر" value={counts["متأخر"]} unit="طالب" />
        <KpiTile size="md" label="غائب" value={counts["غائب"]} unit="طالب"/>
        <KpiTile size="md" label="غير مرصود" value={counts["غير مرصود"]} unit="طالب" />
      </KpiGrid>

      <Card className="flex flex-col gap-4" aria-labelledby="scanner-title">
        <style>{`@keyframes scan-line-movement { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }`}</style>
        <CardHeader
          id="scanner-title"
          icon={ic(QrCode, "w-6 h-6")}
          title="جهاز المسح السريع وبطاقات الهوية"
          description="سجل حضور طلابك فورياً بمسح الكود الشخصي من بطاقتهم."
          actions={
            <div className="flex items-center gap-2">
              <SegmentedControl
                label="طريقة الرصد"
                size="sm"
                value={mode === "off" ? ("" as any) : mode}
                onChange={setMode}
                options={[
                  { value: "manual", label: "قارئ الأجهزة / يدوي", icon: ic(Keyboard, "w-3.5 h-3.5") },
                  { value: "camera", label: "كاميرا الهاتف / الجهاز", icon: ic(Camera, "w-3.5 h-3.5") },
                ]}
              />
              {showScannerPanel && (
                <IconButton size="sm" tone="danger" label="إغلاق لوحة القارئ" onClick={() => { setIsScanning(false); setShowScannerPanel(false); setScanStatus(null); }}>{ic(X)}</IconButton>
              )}
            </div>
          }
        />

        {!showScannerPanel ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-surface-2 border border-line-soft p-4">
            <p className="m-0 text-[14px] text-ink-2 leading-relaxed">هل تريد تتبع حضور طلابك بضغطة زر وبسرعة فائقة؟ قم بتفعيل ميزة المسح السريع لبطاقة الطالب.</p>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Button className="flex-1 sm:flex-initial" onClick={() => setMode("manual")} icon={ic(Keyboard)}>تشغيل القارئ اليدوي</Button>
              <Button variant="primary" className="flex-1 sm:flex-initial" onClick={() => setMode("camera")} icon={ic(Camera)}>المسح بالكاميرا</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 flex flex-col gap-3">
              {isScanning ? (
                <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-[13.5px] flex flex-col gap-1.5">
                  <h3 className="m-0 font-semibold text-[14.5px] text-primary">طريقة الاستخدام (المسح بالكاميرا)</h3>
                  <ul className="m-0 list-disc ps-5 flex flex-col gap-1 text-ink-2 leading-relaxed">
                    <li>وجّه الكاميرا الخلفية لجهازك نحو كود الاستجابة السريعة (QR) أو الباركود الموجود خلف بطاقة الطالب.</li>
                    <li>حافظ على ثبات يدك في مكان مضاء جيداً لثانية واحدة.</li>
                    <li>عند التعرف بنجاح، ستسمع صوت "رنين" وسيتم رصد الطالب كـ <strong className="text-primary">"حاضر"</strong> تلقائياً.</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl bg-surface-2 border border-line-soft p-4 text-[13.5px] flex flex-col gap-3">
                  <div>
                    <h3 className="m-0 font-semibold text-[14.5px] text-primary">طريقة الاستخدام (القارئ اليدوي / الخارجي)</h3>
                    <p className="m-0 mt-1 text-ink-2 leading-relaxed">
                      استخدم هذه الميزة عند ربط لابتوب/جهاز تابلت بـ <strong>مسدس قارئ باركود أو QR خارجي (USB / Bluetooth)</strong>، أو لإدخال رمز الطالب يدوياً.
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleScannedValue(scannerInputValue);
                      setScannerInputValue("");
                      const inp = document.getElementById("barcode-scanner-input");
                      if (inp) inp.focus();
                    }}
                    className="flex gap-2"
                  >
                    <SearchInput
                      id="barcode-scanner-input"
                      type="text"
                      aria-label="رمز الطالب"
                      icon={ic(Keyboard, "w-4 h-4 text-primary")}
                      value={scannerInputValue}
                      onChange={(e: any) => setScannerInputValue(e.target.value)}
                      placeholder="وجه قارئ الباركود هنا أو اكتب الرمز (مثال: s1)..."
                      autoFocus
                      className="flex-1"
                    />
                    <Button type="submit" variant="primary" className="shrink-0">إدخال</Button>
                  </form>
                  <p className="m-0 text-[12.5px] text-ink-3">نصيحة: عند استخدام مسدس الباركود الخارجي، ستقوم الأداة بمجرد المسح بإرسال الرمز تلقائياً دون الحاجة للنقر على أي زر.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-2 rounded-xl border border-line-soft bg-white px-3 py-2">
                <span className="flex items-center gap-1.5">{ic(Volume2, "w-4 h-4 text-primary")}مكبر الصوت ومؤشرات الصوت مفعلة تلقائياً للتنبيه.</span>
                <Button size="xs" onClick={() => playBeep("success")} icon={ic(Bell, "w-3.5 h-3.5")}>اختبار نغمة الرنين</Button>
              </div>

              {scanStatus && (
                <ActionAlert
                  role="status"
                  tone={scanStatus.type === "success" ? "success" : scanStatus.type === "error" ? "danger" : "info"}
                  icon={scanStatus.type === "success" ? ic(CheckCircle2, "w-5 h-5") : scanStatus.type === "error" ? ic(XCircle, "w-5 h-5") : ic(Info, "w-5 h-5")}
                  title={scanStatus.type === "success" ? "تم بنجاح" : scanStatus.type === "error" ? "خطأ في الرصد" : "حالة المستشعر"}
                >
                  {scanStatus.message}
                </ActionAlert>
              )}
            </div>

            <div className="md:col-span-5 flex flex-col items-center justify-center">
              {isScanning ? (
                <div className="w-full max-w-[280px] flex flex-col gap-3">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-night border-4 border-gold/40">
                    <div className="absolute inset-x-0 h-0.5 bg-gold shadow-[0_0_10px_var(--color-gold)] z-20 pointer-events-none" style={{ animation: "scan-line-movement 3s infinite linear" }} />
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-gold z-10 rounded-tl-md pointer-events-none" />
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-gold z-10 rounded-tr-md pointer-events-none" />
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-gold z-10 rounded-bl-md pointer-events-none" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-gold z-10 rounded-br-md pointer-events-none" />
                    <div id="qr-scanner-viewport" className="w-full h-full object-cover" />
                  </div>
                  <Button variant="danger" block onClick={() => setIsScanning(false)} icon={ic(X)}>تعطيل كاميرا المسح</Button>
                </div>
              ) : (
                <div className="aspect-square w-full max-w-[240px] rounded-2xl bg-sunken border-[1.5px] border-dashed border-line-strong flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="w-12 h-12 rounded-full bg-quiet flex items-center justify-center text-ink-3">{ic(Camera, "w-6 h-6")}</span>
                  <div>
                    <p className="m-0 font-semibold text-[14px] text-ink-2">الكاميرا معطلة حالياً</p>
                    <p className="m-0 mt-1 text-[12.5px] text-ink-3">انقر على زر الكاميرا بالأعلى لتفعيل التعرف البصري الفوري.</p>
                  </div>
                  <Button variant="primary" onClick={() => setIsScanning(true)}>تفعيل البصريات</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {urgent.length > 0 && (
        <section id="urgent-attendance-alerts" aria-labelledby="urgent-title" className="rounded-2xl bg-danger-100 border border-danger-200 p-5 flex flex-col gap-3">
          <h2 id="urgent-title" className="m-0 flex items-center gap-2 font-display font-semibold text-[18px] text-danger-800">
            {ic(AlertTriangle, "w-5 h-5")}إنذارات الغياب المتكرر العاجلة (3 غيابات متتالية أو أكثر)
          </h2>
          <p className="m-0 text-[13.5px] text-danger-900 leading-relaxed">
            تم رصد طلاب متغيبين لثلاث حصص متتالية أو أكثر. يرجى الضغط على زر "إرسال إنذار غياب" للتواصل الفوري مع أولياء الأمور وتنبيههم لتبرير الغياب.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgent.map(({ student, count }) => (
              <div key={student.id} data-absence-alert={student.id} className="bg-surface border border-danger-200 rounded-xl p-3 flex flex-col items-start gap-2.5 min-w-0">
                <div className="flex flex-col gap-1 min-w-0 max-w-full">
                  <span className="font-semibold text-[14px] text-ink">{student.fullName}</span>
                  <Pill tone="danger" className="self-start max-w-full whitespace-normal! text-start">متغيب لـ {count} حصص متتالية</Pill>
                  <span className="text-[12.5px] text-ink-3">ولي الأمر: {student.parentName} (<Ltr>{student.parentPhone}</Ltr>)</span>
                </div>
                <Button size="sm" variant="danger-solid" className="max-w-full whitespace-normal text-start" onClick={() => handleSendAbsenceWarning(student)} icon={<WhatsAppIcon className="w-3.5 h-3.5" />}>إرسال إنذار غياب</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Card padded={false} className="overflow-hidden" aria-labelledby="roll-title">
        <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-4 border-b border-line-soft">
          <h2 id="roll-title" className="m-0 font-display font-semibold text-[20px] text-primary">
            {selectedClassId === "all" ? "جميع طلاب حلقات التحفيظ" : `طلاب ${classes.find((c) => c.id === selectedClassId)?.name || ""}`}
          </h2>
          <span className="text-[13px] text-ink-2">تاريخ الرصد: <Ltr className="font-semibold text-ink">{attendanceDate}</Ltr></span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-5"><EmptyState title="لا طلاب">لا يوجد طلاب مسجلون في هذا الفصل حالياً.</EmptyState></div>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-line-faint">
            {filtered.map((st) => {
              const record = attendance.find((a) => a.date === attendanceDate && a.studentId === st.id);
              const status = record?.status || "غير مرصود";
              const studentClass = classes.find((c) => c.id === st.classId);
              const absences = getConsecutiveAbsences(st.id);
              return (
                <li key={st.id} className="px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-surface-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <button type="button" tabIndex={-1} onClick={() => openReport(st)} title="عرض كشف حضور الطالب الشهري" className="w-10 h-10 rounded-full overflow-hidden bg-sunken shrink-0 border border-line cursor-pointer p-0 hover:ring-2 hover:ring-gold hover:ring-offset-2 transition">
                      <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                    </button>
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          data-action="open-monthly-report"
                          onClick={() => openReport(st)}
                          className={cx("bg-transparent border-0 p-0 cursor-pointer font-semibold text-[14.5px] text-start hover:text-primary hover:underline flex items-center gap-1 min-h-8", st.isArchived ? "text-ink-3 line-through" : "text-ink")}
                          title="عرض كشف حضور الطالب الشهري"
                        >
                          <span>{st.fullName}</span>
                          {ic(FileText, "w-3.5 h-3.5 text-ink-3")}
                        </button>
                        {st.isArchived && <Pill tone="neutral">مؤرشف</Pill>}
                        {selectedClassId === "all" && studentClass && <Pill tone="primary">{studentClass.name}</Pill>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
                        <span>ولي الأمر: {st.parentName}{st.parentPhone ? <> (<Ltr>{st.parentPhone}</Ltr>)</> : null}</span>
                        {absences >= 3 && <Pill tone="danger" dot>غائب لـ {absences} حصص متتالية</Pill>}
                        {record?.notes && <Pill tone="warn">{record.notes}</Pill>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {absences >= 3 && (
                      <Button size="sm" variant="danger" id={`send-warning-btn-${st.id}`} title="إرسال إنذار غياب فوري عبر واتساب" onClick={() => handleSendAbsenceWarning(st)} icon={<WhatsAppIcon className="w-3.5 h-3.5" />}>
                        إرسال إنذار غياب
                      </Button>
                    )}
                    <span className="text-[12.5px] text-ink-3">الحالة المرصودة:</span>
                    <div role="group" aria-label={`حالة حضور ${st.fullName}`} className="inline-flex gap-1.5">
                      {STATUS_BUTTONS.map((b) => {
                        const on = status === b.value;
                        return (
                          <button
                            key={b.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => handleToggleAttendance(st.id, b.value)}
                            className={cx("inline-flex items-center gap-1.5 min-h-11 px-3 rounded-[10px] border text-[13.5px] font-semibold cursor-pointer transition-colors", on ? b.on : "bg-white border-line text-ink-2 hover:border-ink-4")}
                          >
                            {ic(b.icon, "w-4 h-4")}{b.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
