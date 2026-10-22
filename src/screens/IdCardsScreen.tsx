/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { Student, checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { Award, Sparkles, Search, Trash2, Printer, FileText, QrCode } from "lucide-react";
import { useApp } from "../app/AppContext";
import { makeCardRenderers } from "./idCards/cardFaces";

export default function IdCardsScreen() {
  const {
    students,
    classes,
    payments,
    systemSettings,
    currentUser,
    idCardLabTab,
    setIdCardLabTab,
    selectedLabStudentId,
    setSelectedLabStudentId,
    labScale,
    setLabScale,
    labViewMode,
    setLabViewMode,
    labDisplayType,
    setLabDisplayType,
    labFlip,
    setLabFlip,
    searchLabQuery,
    setSearchLabQuery,
    bulkSelectedIds,
    setBulkSelectedIds,
    labPrintMode,
    setLabPrintMode,
    currentRole,
    schoolName,
    handlePrintLabCard,
  } = useApp();

  const labStudent = students.find(s => s.id === selectedLabStudentId) || students[0];
  const labStudentClass = labStudent ? classes.find(c => c.id === labStudent.classId) : undefined;

  const { renderFrontSide, renderBackSide, renderOfficialFrontSide, renderOfficialBackSide } = makeCardRenderers(systemSettings, schoolName);

  const renderFront = idCardLabTab === "student-card" ? renderOfficialFrontSide : renderFrontSide;
  const renderBack = idCardLabTab === "student-card" ? renderOfficialBackSide : renderBackSide;

  return (
    <div data-screen="id-cards-lab" className="space-y-6" style={{ direction: "rtl" }}>
      <div className="bg-night rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="bg-gold-400 text-ink font-bold text-[13px] px-3 py-1 rounded-full">استوديو الطباعة الرقمية</span>
            <h2 className="text-2xl md:text-3xl font-bold">معمل بطاقات الهوية الرقمية والطباعة الاحترافية</h2>
            <p className="text-sm text-primary-100 max-w-xl">
              قم بمعاينة وتصميم بطاقة الهوية الذكية لكل طالب، مع إمكانية تصغير وتكبير المقاس بدقة متناهية لتلائم كافة طابعات الكروت البلاستيكية (CR80) أو الورقية بجودة عالية. يتم توليد رمز الاستجابة السريعة (QR Code) تلقائياً على ظهر البطاقة لتسجيل الحضور السريع بمجرد مسحه بالكاميرا.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-primary-700/80 border border-primary-500/30 text-white font-bold text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2">
              🖨️ جاهز للتصدير المباشر
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TABS FOR LAB */}
      <div className="flex bg-surface p-1.5 rounded-2xl border border-sand-200/80 gap-2">
        <button
          onClick={() => setIdCardLabTab("student-card")}
          className={`flex-1 sm:flex-initial py-3 px-6 text-[13px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            idCardLabTab === "student-card"
              ? "bg-primary-700 text-white"
              : "text-ink-2 hover:bg-sand-50 hover:text-ink"
          }`}
        >
          <Award className="w-4.5 h-4.5 text-gold-400" />
          <span>بطاقة الطالب الرسمية (نادي القرآن)</span>
        </button>
        <button
          onClick={() => setIdCardLabTab("membership-card")}
          className={`flex-1 sm:flex-initial py-3 px-6 text-[13px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            idCardLabTab === "membership-card"
              ? "bg-primary-700 text-white"
              : "text-ink-2 hover:bg-sand-50 hover:text-ink"
          }`}
        >
          <QrCode className="w-4.5 h-4.5 text-gold-400" />
          <span>بطاقة الهوية الرقمية (QR & Barcode)</span>
        </button>
      </div>

      {/* TWO PANEL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* RIGHT PANEL: STUDENT SELECTOR */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-primary">قائمة الطلاب</h3>
            <p className="text-[12.5px] text-ink-3">اختر طالباً للمعاينة، أو حدد دفعة من الطلاب للطباعة الجماعية.</p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-3">
              <Search className="w-4 h-4 text-primary-600" />
            </span>
            <input
              type="text"
              value={searchLabQuery}
              onChange={(e) => setSearchLabQuery(e.target.value)}
              placeholder="ابحث باسم الطالب أو الرقم التعريفي..."
              className="min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 w-full pr-9 pl-3"
            />
          </div>

          {/* Bulk Selection Controls */}
          {(() => {
            const filteredLabStudents = students.filter(s => {
              const normSearch = searchLabQuery.toLowerCase().trim();
              if (!normSearch) return !s.isArchived;
              return (s.fullName || "").toLowerCase().includes(normSearch) || (s.id || "").toLowerCase().includes(normSearch);
            });
            const allFilteredSelected = filteredLabStudents.length > 0 && filteredLabStudents.every(st => bulkSelectedIds.includes(st.id));

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-sand-50 p-2.5 rounded-xl border border-sand-150 text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ink-2">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Add all filtered ones to bulk selection
                          const newIds = Array.from(new Set([...bulkSelectedIds, ...filteredLabStudents.map(st => st.id)]));
                          setBulkSelectedIds(newIds);
                        } else {
                          // Remove all filtered ones from bulk selection
                          const filteredIds = filteredLabStudents.map(st => st.id);
                          setBulkSelectedIds(bulkSelectedIds.filter(id => !filteredIds.includes(id)));
                        }
                      }}
                      className="w-4 h-4 accent-primary-600 rounded border-line-strong"
                    />
                    <span>تحديد الكل ({filteredLabStudents.length})</span>
                  </label>
                  {bulkSelectedIds.length > 0 && (
                    <button
                      onClick={() => setBulkSelectedIds([])}
                      className="text-danger-600 hover:text-danger-700 font-bold transition flex items-center gap-1 text-[12.5px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إلغاء ({bulkSelectedIds.length})</span>
                    </button>
                  )}
                </div>

                {bulkSelectedIds.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLabPrintMode("bulk");
                      }}
                      className={`flex-1 text-[12.5px] py-1.5 px-2.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                        labPrintMode === "bulk"
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-gold-50 text-gold-800 border-gold-200 hover:bg-gold-100"
                      }`}
                    >
                      🖨️ تفعيل الطباعة الجماعية ({bulkSelectedIds.length})
                    </button>
                    {labPrintMode === "bulk" && (
                      <button
                        onClick={() => setLabPrintMode("single")}
                        className="text-[12.5px] py-1.5 px-2.5 rounded-lg border border-line text-ink-2 hover:bg-sand-50 font-bold transition"
                      >
                        عودة للمنفرد
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Student list container */}
          <div className="max-h-[520px] overflow-y-auto divide-y divide-line-faint pr-1 space-y-1.5">
            {students.filter(s => {
              const normSearch = searchLabQuery.toLowerCase().trim();
              if (!normSearch) return !s.isArchived;
              return (s.fullName || "").toLowerCase().includes(normSearch) || (s.id || "").toLowerCase().includes(normSearch);
            }).map((st) => {
              const isSelected = st.id === selectedLabStudentId;
              const isBulkChecked = bulkSelectedIds.includes(st.id);
              const stClass = classes.find(c => c.id === st.classId);
              return (
                <div
                  key={st.id}
                  className={`group w-full p-2 rounded-xl flex items-center gap-2.5 transition border ${
                    isSelected 
                      ? "bg-primary-50/70 border-primary-300 text-primary-950" 
                      : "bg-white hover:bg-sand-50 border-transparent text-ink-2"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isBulkChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelectedIds([...bulkSelectedIds, st.id]);
                      } else {
                        setBulkSelectedIds(bulkSelectedIds.filter(id => id !== st.id));
                      }
                    }}
                    className="w-4 h-4 accent-primary-600 rounded border-line-strong cursor-pointer"
                  />

                  <button
                    onClick={() => {
                      setSelectedLabStudentId(st.id);
                      setLabFlip(false);
                    }}
                    className="flex-1 flex items-center gap-2.5 text-right overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-sand-100 border border-line flex items-center justify-center shrink-0">
                      <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-[13px] truncate">{st.fullName}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11.5px] text-ink-3 font-mono">ID: {st.id.toUpperCase()}</span>
                        <span className="text-[11.5px] bg-sand-100 text-ink-2 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                          {stClass?.name || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEFT PANEL: CARD CUSTOMIZER & PREVIEW */}
        <div className="lg:col-span-8 space-y-6">
          {labStudent ? (
            <>
              {/* Interactive Controls panel */}
              <div className="bg-surface rounded-2xl border border-line p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-soft pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-primary">
                      {idCardLabTab === "student-card" 
                        ? "خيارات تخصيص بطاقة الطالب الرسمية" 
                        : "خيارات تخصيص بطاقة الهوية الرقمية"}
                    </h3>
                    <p className="text-[12.5px] text-ink-3">اضبط المقياس وتنسيق الطباعة والجهوزية بدقة متناهية.</p>
                  </div>

                  {checkUserPermission(currentUser, currentRole, "id-cards-lab", "print") && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. Print Both Sides */}
                      <button
                        onClick={() => handlePrintLabCard("both")}
                        className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
                        title="طباعة وجه وظهر البطاقة معاً"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>
                          {labPrintMode === "bulk" 
                            ? `طباعة الوجهين للدفعة (${bulkSelectedIds.length})` 
                            : "طباعة الوجهين"}
                        </span>
                      </button>

                      {/* 2. Print Front Only */}
                      <button
                        onClick={() => handlePrintLabCard("front")}
                        className="bg-white hover:bg-primary-50 text-primary-700 border border-primary-300 font-bold text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition hover:shadow-md"
                        title="طباعة الجهة الأمامية للبطاقة فقط"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary-600" />
                        <span>
                          {labPrintMode === "bulk" 
                            ? `طباعة الوجه للدفعة (${bulkSelectedIds.length})` 
                            : "طباعة الوجه فقط"}
                        </span>
                      </button>

                      {/* 3. Print Back Only */}
                      <button
                        onClick={() => handlePrintLabCard("back")}
                        className="bg-white hover:bg-gold-50 text-gold-700 border border-gold-300 font-bold text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition hover:shadow-md"
                        title="طباعة الجهة الخلفية للبطاقة فقط"
                      >
                        <FileText className="w-3.5 h-3.5 text-gold-600" />
                        <span>
                          {labPrintMode === "bulk" 
                            ? `طباعة الظهر للدفعة (${bulkSelectedIds.length})` 
                            : "طباعة الظهر فقط"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scale Slider & Presets */}
                  <div className="space-y-3">
                    <label className="block text-[13px] font-bold text-ink-2 flex justify-between">
                      <span>نسبة تكبير / تصغير البطاقة للطباعة:</span>
                      <span className="text-primary-700 font-mono font-bold bg-primary-50 px-2 py-0.5 rounded-md text-[12.5px] border border-primary-100">
                        {Math.round(labScale * 100)}% ({labScale.toFixed(2)}x)
                      </span>
                    </label>

                    {/* Range slider */}
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={labScale}
                      onChange={(e) => setLabScale(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 h-1.5 bg-sand-200 rounded-lg cursor-pointer"
                    />

                    {/* Scale presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "70% (صغيرة)", val: 0.7 },
                        { label: "85% (بطاقة CR80)", val: 0.85 },
                        { label: "100% (كاملة)", val: 1.0 },
                        { label: "120% (كبيرة)", val: 1.2 },
                        { label: "140% (توضيحية)", val: 1.4 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          onClick={() => setLabScale(preset.val)}
                          className={`text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                            Math.abs(labScale - preset.val) < 0.01
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-sand-50 hover:bg-sand-100 border-line text-ink-2"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout and Display Options */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[13px] font-bold text-ink-2 mb-2">تنسيق عرض الجهات:</span>
                        <div className="grid grid-cols-3 gap-1 bg-sand-100 p-1 rounded-xl border border-line text-[11.5px]">
                          <button
                            onClick={() => {
                              setLabViewMode("both");
                              setLabDisplayType("print");
                            }}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labViewMode === "both" && labDisplayType === "print" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                            }`}
                          >
                            الوجهين
                          </button>
                          <button
                            onClick={() => {
                              setLabViewMode("front");
                              setLabDisplayType("print");
                            }}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labViewMode === "front" && labDisplayType === "print" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                            }`}
                          >
                            الوجه
                          </button>
                          <button
                            onClick={() => {
                              setLabViewMode("back");
                              setLabDisplayType("print");
                            }}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labViewMode === "back" && labDisplayType === "print" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                            }`}
                          >
                            الظهر
                          </button>
                        </div>
                      </div>

                      {/* Print Mode Selector */}
                      <div>
                        <span className="block text-[13px] font-bold text-ink-2 mb-2">طريقة المعاينة:</span>
                        <div className="grid grid-cols-2 gap-1 bg-sand-100 p-1 rounded-xl border border-line text-[11.5px]">
                          <button
                            onClick={() => setLabPrintMode("single")}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labPrintMode === "single" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                            }`}
                          >
                            منفرد
                          </button>
                          <button
                            onClick={() => {
                              if (bulkSelectedIds.length === 0) {
                                setBulkSelectedIds([labStudent.id]);
                              }
                              setLabPrintMode("bulk");
                              setLabDisplayType("print");
                            }}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labPrintMode === "bulk" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                            }`}
                          >
                            دفعة ({bulkSelectedIds.length})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* View style toggle */}
                    <div>
                      <span className="block text-[13px] font-bold text-ink-2 mb-2">طريقة عرض المعمل:</span>
                      <div className="grid grid-cols-2 gap-2 bg-sand-100 p-1 rounded-xl border border-line text-[13px]">
                        <button
                          onClick={() => setLabDisplayType("print")}
                          className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                            labDisplayType === "print" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-primary-600" />
                          <span>مخطط الطباعة</span>
                        </button>
                        <button
                          onClick={() => {
                            setLabDisplayType("3d");
                            setLabViewMode("both");
                          }}
                          className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                            labDisplayType === "3d" ? "bg-white text-primary-800" : "text-ink-3 hover:text-ink"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                          <span>معاينة ثلاثية الأبعاد تفاعلية</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <p className="text-[11.5px] text-ink-3 font-medium">
                  💡 نصيحة للطباعة الاحترافية: للطباعة على كروت البلاستيك، يوصى بمقياس <span className="font-bold text-primary-700">85% (بطاقة CR80)</span>. أما للطباعة على ورق مقوى عادي يفضل المقدار <span className="font-bold text-primary-700">100%</span>.
                </p>
              </div>

              {/* LIVE DISPLAY AREA */}
              <div className="bg-sand-100 rounded-3xl p-6 border-2 border-dashed border-line flex justify-center items-start overflow-hidden min-h-[580px] relative">

                {/* Interactive indicator for 3D mode */}
                {labDisplayType === "3d" && (
                  <div className="absolute top-4 right-4 bg-gold-500 text-ink text-[11.5px] font-bold px-3 py-1 rounded-full animate-bounce z-20">
                    🔄 انقر فوق الكارت لقلبه
                  </div>
                )}

                {/* Dynamic Scaled Container */}
                <div 
                  id="lab-printable-area" 
                  className="transition-all duration-300 w-full flex justify-center"
                  style={{
                    transform: labDisplayType === "print" ? `scale(${labScale})` : "none",
                    transformOrigin: "top center",
                    marginBottom: labDisplayType === "print" ? `${((idCardLabTab === "student-card" ? 550 : 500) * (labScale - 1)) + 20}px` : "0px",
                  }}
                >

                  {/* 1. FLAT PRINT MODE */}
                  {labDisplayType === "print" && (
                    labPrintMode === "single" ? (
                      <div className="flex flex-col md:flex-row gap-6 justify-center items-center p-2 bg-transparent">
                        {/* FRONT SIDE */}
                        {(labViewMode === "both" || labViewMode === "front") && renderFront(labStudent, labStudentClass)}
                        {/* BACK SIDE */}
                        {(labViewMode === "both" || labViewMode === "back") && renderBack(labStudent)}
                      </div>
                    ) : (
                      <div className="space-y-8 bg-transparent p-2 w-full max-w-5xl">
                        {bulkSelectedIds.length === 0 ? (
                          <div className="text-center p-12 bg-surface border border-line rounded-3xl max-w-md mx-auto">
                            <p className="text-ink-2 font-bold text-sm">الرجاء تحديد طالب واحد أو أكثر من القائمة الجانبية.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center w-full">
                            {bulkSelectedIds.map(stId => {
                              const st = students.find(s => s.id === stId);
                              if (!st) return null;
                              const stClass = classes.find(c => c.id === st.classId);
                              return (
                                <div key={st.id} className="flex flex-col xl:flex-row gap-4 p-4 bg-white/60 border border-line rounded-3xl break-inside-avoid print:p-0 print:border-none print:bg-transparent items-center">
                                  {/* FRONT SIDE */}
                                  {(labViewMode === "both" || labViewMode === "front") && renderFront(st, stClass)}
                                  {/* BACK SIDE */}
                                  {(labViewMode === "both" || labViewMode === "back") && renderBack(st)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* 2. INTERACTIVE 3D FLIP MODE */}
                  {labDisplayType === "3d" && (
                    <div className="flex justify-center items-center py-4">
                      <div 
                        className="relative cursor-pointer select-none"
                        style={{
                          perspective: "1200px",
                          width: idCardLabTab === "student-card" ? "390px" : "330px",
                          height: idCardLabTab === "student-card" ? "550px" : "500px",
                        }}
                        onClick={() => setLabFlip(!labFlip)}
                      >
                        <div
                          className="w-full h-full duration-700 ease-in-out relative"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: labFlip ? "rotateY(180deg)" : "rotateY(0deg)"
                          }}
                        >
                          {/* Front Face */}
                          <div 
                            className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                            style={{
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden"
                            }}
                          >
                            {renderFront(labStudent, labStudentClass)}
                          </div>

                          {/* Back Face */}
                          <div 
                            className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                            style={{
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              transform: "rotateY(180deg)"
                            }}
                          >
                            {renderBack(labStudent)}
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface rounded-2xl border border-line p-8 text-center text-ink-3 text-[13px]">
              يرجى إضافة طلاب نشطين أولاً لتتمكن من معاينة وإصدار البطاقات الذكية.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
