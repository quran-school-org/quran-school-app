/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Class, Attendance } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { Search, X, FileText, QrCode, Camera, Volume2, Keyboard } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function AttendanceScreen() {
  const {
    students,
    classes,
    attendance,
    selectedClassId,
    setSelectedClassId,
    attendanceDate,
    setAttendanceDate,
    isScanning,
    setIsScanning,
    scanStatus,
    setScanStatus,
    scannerInputValue,
    setScannerInputValue,
    showScannerPanel,
    setShowScannerPanel,
    setSelectedStudentForReport,
    setShowMonthlyReportModal,
    attendanceSearchQuery,
    setAttendanceSearchQuery,
    getConsecutiveAbsences,
    handleSendAbsenceWarning,
    handleToggleAttendance,
    playBeep,
    handleScannedValue,
  } = useApp();

  return (
    <div data-screen="attendance" className="space-y-6">

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">حصر الحضور والغياب اليومي لحلقات القرآن</h2>
          <p className="text-xs text-slate-500">اختر الفصل والتاريخ ثم قم برصد الحضور بنقرة زر واحدة.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Search input */}
          <div className="space-y-1 w-full sm:w-48 md:w-56">
            <label className="block text-[10px] font-bold text-slate-400">بحث عن طالب (نشط أو مؤرشف):</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={attendanceSearchQuery}
                onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Class Filter selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400">حلقة التحفيظ:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-emerald-800 focus:outline-none"
            >
              <option value="all">الكل (جميع الحلقات والطلاب)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400">تاريخ الحلقة:</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* FAST SCAN ATTENDANCE QR/BARCODE PANEL */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm relative overflow-hidden">
        <style>{`
          @keyframes scan-line-movement {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}</style>
        {/* Decorative background scan lines */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">جهاز المسح السريع وبطاقات الهوية</h3>
              <p className="text-[10px] text-slate-500">سجل حضور طلابك فورياً بمسح الكود الشخصي من بطاقتهم.</p>
            </div>
          </div>

          {/* Toggle Mode */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] self-start sm:self-auto">
            <button
              onClick={() => {
                setIsScanning(false);
                setShowScannerPanel(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                showScannerPanel && !isScanning ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>قارئ الأجهزة / يدوي</span>
            </button>
            <button
              onClick={() => {
                setShowScannerPanel(true);
                setIsScanning(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                isScanning ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>كاميرا الهاتف / الجهاز</span>
            </button>
            {showScannerPanel && (
              <button
                onClick={() => {
                  setIsScanning(false);
                  setShowScannerPanel(false);
                  setScanStatus(null);
                }}
                className="px-2 py-1.5 text-rose-500 hover:text-rose-700 font-bold ml-1 rounded-lg"
                title="إغلاق لوحة القارئ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!showScannerPanel ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 bg-white/60 rounded-xl p-4 border border-slate-150">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                هل تريد تتبع حضور طلابك بضغطة زر وبسرعة فائقة؟ قم بتفعيل ميزة المسح السريع لبطاقة الطالب.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowScannerPanel(true);
                  setIsScanning(false);
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow"
              >
                <Keyboard className="w-4 h-4" />
                <span>تشغيل القارئ اليدوي</span>
              </button>
              <button
                onClick={() => {
                  setShowScannerPanel(true);
                  setIsScanning(true);
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow"
              >
                <Camera className="w-4 h-4" />
                <span>المسح بالكاميرا</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
            {/* Scanner Input / Status side */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                {isScanning ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1.5">
                    <h4 className="font-bold text-emerald-800">طريقة الاستخدام (المسح بالكاميرا):</h4>
                    <ul className="list-disc pr-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      <li>وجّه الكاميرا الخلفية لجهازك نحو كود الاستجابة السريعة (QR) أو الباركود الموجود خلف بطاقة الطالب.</li>
                      <li>حافظ على ثبات يدك في مكان مضاء جيداً لثانية واحدة.</li>
                      <li>عند التعرف بنجاح، ستسمع صوت "رنين" وسيتم رصد الطالب كـ <span className="font-bold text-emerald-700">"حاضر"</span> تلقائياً.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-slate-100/60 border border-slate-200 p-3.5 rounded-xl text-xs space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800">طريقة الاستخدام (القارئ اليدوي / الخارجي):</h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                        استخدم هذه الميزة عند ربط لابتوب/جهاز تابلت بـ <span className="font-bold">مسدس قارئ باركود أو QR خارجي (USB / Bluetooth)</span>، أو لإدخال رمز الطالب يدوياً.
                      </p>
                    </div>

                    {/* Raw gun reader input form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleScannedValue(scannerInputValue);
                        setScannerInputValue("");
                        // Re-focus the input instantly for rapid scanning
                        const inp = document.getElementById("barcode-scanner-input");
                        if (inp) inp.focus();
                      }}
                      className="flex gap-2"
                    >
                      <div className="relative flex-grow">
                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                          <Keyboard className="w-4 h-4 text-emerald-600" />
                        </span>
                        <input
                          id="barcode-scanner-input"
                          type="text"
                          value={scannerInputValue}
                          onChange={(e) => setScannerInputValue(e.target.value)}
                          placeholder="وجه قارئ الباركود هنا أو اكتب الرمز (مثال: s1)..."
                          autoFocus
                          className="w-full text-xs font-bold bg-white border-2 border-emerald-600/30 rounded-xl pr-9 pl-3 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-inner"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 rounded-xl shadow transition shrink-0"
                      >
                        إدخال
                      </button>
                    </form>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      💡 نصيحة: عند استخدام مسدس الباركود الخارجي، ستقوم الأداة بمجرد المسح بإرسال الرمز تلقائياً دون الحاجة للنقر على أي زر.
                    </span>
                  </div>
                )}

                {/* Scanner Sound Test / Feedback info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مكبر الصوت ومؤشرات الصوت مفعلة تلقائياً للتنبيه.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => playBeep("success")}
                    className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-100 transition"
                  >
                    🔔 اختبار نغمة الرنين
                  </button>
                </div>
              </div>

              {/* Display Scan status alerts */}
              {scanStatus && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                  scanStatus.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : scanStatus.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}>
                  <span className="text-base">
                    {scanStatus.type === "success" ? "✅" : scanStatus.type === "error" ? "❌" : "ℹ️"}
                  </span>
                  <div className="space-y-1">
                    <p className="font-bold">{scanStatus.type === "success" ? "تم بنجاح" : scanStatus.type === "error" ? "خطأ في الرصد" : "حالة المستشعر"}</p>
                    <p className="text-[11px] leading-relaxed opacity-90">{scanStatus.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Feed side */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              {isScanning ? (
                <div className="w-full max-w-[280px] space-y-3">
                  {/* Simulated Camera Window */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-4 border-emerald-600/30 shadow-lg">
                    <div 
                      className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] z-20 pointer-events-none" 
                      style={{
                        animation: "scan-line-movement 3s infinite linear"
                      }}
                    />

                    {/* Scanning viewport guidelines corners */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-emerald-400 z-10 rounded-tl-md pointer-events-none" />
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-emerald-400 z-10 rounded-tr-md pointer-events-none" />
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-emerald-400 z-10 rounded-bl-md pointer-events-none" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-emerald-400 z-10 rounded-br-md pointer-events-none" />

                    {/* Viewport for html5qrcode */}
                    <div id="qr-scanner-viewport" className="w-full h-full object-cover" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>تعطيل كاميرا المسح</span>
                  </button>
                </div>
              ) : (
                <div className="aspect-square w-full max-w-[240px] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500">
                    <Camera className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-600">الكاميرا معطلة حالياً</p>
                    <p className="text-[10px] text-slate-400 mt-1">انقر على زر الكاميرا بالأعلى لتفعيل التعرف البصري الفوري.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg shadow-sm hover:shadow transition"
                  >
                    تفعيل البصريات
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Urgent Alerts box */}
      {(() => {
        const studentsWithConsecutiveAbsences = (selectedClassId === "all" ? students : students.filter(s => s.classId === selectedClassId))
          .filter(st => !st.isArchived)
          .map(st => ({ student: st, count: getConsecutiveAbsences(st.id) }))
          .filter(item => item.count >= 3);

        if (studentsWithConsecutiveAbsences.length > 0) {
          return (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-4 animate-fade-in" id="urgent-attendance-alerts">
              <div className="flex items-center gap-2 text-rose-800">
                <span className="text-xl">⚠️</span>
                <h3 className="font-bold text-xs sm:text-sm">إنذارات الغياب المتكرر العاجلة (3 غيابات متتالية أو أكثر)</h3>
              </div>
              <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                تم رصد طلاب متغيبين لثلاث حصص متتالية أو أكثر. يرجى الضغط على زر "إرسال إنذار غياب" للتواصل الفوري مع أولياء الأمور وتنبيههم لتبرير الغياب.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentsWithConsecutiveAbsences.map(({ student, count }) => (
                  <div key={student.id} className="bg-white border border-rose-100 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-slate-800">{student.fullName}</p>
                      <p className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg inline-block">
                        🚨 متغيب لـ {count} حصص متتالية
                      </p>
                      <p className="text-[10px] text-slate-400 block">ولي الأمر: {student.parentName} ({student.parentPhone})</p>
                    </div>
                    <button
                      onClick={() => handleSendAbsenceWarning(student)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] sm:text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow transition shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                      </svg>
                      <span>إرسال إنذار غياب</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Attendance Grid list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-700">
          <span>{selectedClassId === "all" ? "جميع طلاب حلقات التحفيظ" : `طلاب ${classes.find(c => c.id === selectedClassId)?.name || ""}`}</span>
          <span className="text-emerald-700 font-mono">تاريخ الرصد: {attendanceDate}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {(() => {
            const filtered = (selectedClassId === "all"
              ? students
              : students.filter(st => st.classId === selectedClassId)
            ).filter(st => {
              if (attendanceSearchQuery.trim() === "") {
                return !st.isArchived;
              } else {
                const query = attendanceSearchQuery.toLowerCase().trim();
                return (st.fullName || "").toLowerCase().includes(query) ||
                       (st.parentName || "").toLowerCase().includes(query) ||
                       (st.parentPhone || "").includes(query);
              }
            });

            return filtered.length > 0 ? (
              filtered.map((st) => {
                const record = attendance.find(a => a.date === attendanceDate && a.studentId === st.id);
                const status = record?.status || "غير مرصود";
                const studentClass = classes.find(c => c.id === st.classId);

                return (
                  <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => {
                          setSelectedStudentForReport(st);
                          setShowMonthlyReportModal(true);
                        }}
                        className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border cursor-pointer hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 transition"
                        title="عرض كشف حضور الطالب الشهري"
                      >
                        <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            data-action="open-monthly-report"
                            onClick={() => {
                              setSelectedStudentForReport(st);
                              setShowMonthlyReportModal(true);
                            }}
                            className={`font-bold text-xs text-right hover:text-emerald-700 hover:underline flex items-center gap-1 transition ${st.isArchived ? "text-slate-400 line-through" : "text-slate-800"}`}
                            title="عرض كشف حضور الطالب الشهري"
                          >
                            <span>{st.fullName}</span>
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {st.isArchived && (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded">
                              مؤرشف
                            </span>
                          )}
                          {selectedClassId === "all" && studentClass && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                              🏫 {studentClass.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>ولي الأمر: {st.parentName} ({st.parentPhone})</span>
                          {getConsecutiveAbsences(st.id) >= 3 && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-lg animate-pulse">
                              ⚠️ غائب لـ {getConsecutiveAbsences(st.id)} حصص متتالية
                            </span>
                          )}
                          {record?.notes && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-medium px-1.5 py-0.5 rounded-lg">
                              📝 {record.notes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {getConsecutiveAbsences(st.id) >= 3 && (
                        <button
                          onClick={() => handleSendAbsenceWarning(st)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ml-2 shadow-sm"
                          id={`send-warning-btn-${st.id}`}
                          title="إرسال إنذار غياب فوري عبر واتساب"
                        >
                          <svg className="w-3.5 h-3.5 fill-rose-600" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.847.001-2.63-1.019-5.101-2.872-6.957C16.51 1.944 14.04 .923 11.417.923c-5.442 0-9.866 4.416-9.869 9.851-.001 1.861.488 3.676 1.415 5.275L1.875 22.05l6.052-1.588c1.558.847 3.11 1.292 4.72 1.292zm11.367-5.649c-.312-.156-1.847-.911-2.136-1.014-.288-.105-.497-.156-.707.156-.21.312-.812 1.014-.995 1.22-.183.206-.367.23-.679.074-1.229-.615-2.033-1.086-2.845-2.487-.213-.368.213-.343.61-.1.356.223.4.494.5.643.099.15.05.283-.025.438-.074.156-.707 1.701-.969 2.327-.255.613-.514.53-.707.54l-.6-.009c-.21 0-.55-.078-.838-.393-.288-.312-1.1-1.074-1.1-2.622s1.127-3.041 1.284-3.25c.157-.21 2.215-3.382 5.368-4.75.751-.326 1.337-.52 1.796-.665.754-.24 1.44-.206 1.983-.286.606-.09 1.847-.754 2.11-.1.263.156.263.263.263.494s-.105 1.514-.523 2.34c-.419.827-.864 1.286-1.12 1.545z"/>
                          </svg>
                          <span>إرسال إنذار غياب</span>
                        </button>
                      )}

                      <span className="text-[10px] font-bold text-slate-400 ml-2">الحالة المرصودة:</span>

                      <button
                        onClick={() => handleToggleAttendance(st.id, "حاضر")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          status === "حاضر" 
                            ? "bg-emerald-600 text-white shadow-sm" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        حاضر ✅
                      </button>

                      <button
                        onClick={() => handleToggleAttendance(st.id, "متأخر")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          status === "متأخر" 
                            ? "bg-amber-500 text-zinc-950 shadow-sm" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        متأخر 🕒
                      </button>

                      <button
                        onClick={() => handleToggleAttendance(st.id, "غائب")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          status === "غائب" 
                            ? "bg-rose-600 text-white shadow-sm" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        غائب ❌
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا يوجد طلاب مسجلون في هذا الفصل حالياً.
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
