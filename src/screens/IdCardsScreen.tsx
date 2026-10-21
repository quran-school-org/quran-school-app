/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../db";
import { Student, checkUserPermission } from "../types";
import { StudentAvatar } from "../utils/studentAvatar";
import { Award, Sparkles, Search, Trash2, Check, Phone, Calendar, Printer, FileText, QrCode, MapPin, Globe, Facebook } from "lucide-react";
import { useApp } from "../app/AppContext";

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

  const renderFrontSide = (student: typeof students[0], studentClass: any) => {
    if (!student) return null;
    return (
      <div
        id={`student-card-front-${student.id}`}
        className="w-[330px] h-[500px] rounded-3xl bg-gradient-to-b from-emerald-900 via-emerald-800 to-zinc-900 text-white relative shadow-2xl overflow-hidden border border-emerald-600/30 select-none flex flex-col justify-between shrink-0"
        style={{ direction: "rtl" }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="p-5 border-b border-white/10 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-amber-400 font-bold overflow-hidden shrink-0">
              {systemSettings?.associationLogo ? (
                <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                "🌅"
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-wide text-amber-400">{schoolName}</h3>
              <p className="text-[9px] text-emerald-200 font-medium">نادي القرآن الكريم وتجويده</p>
            </div>
          </div>
          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">بطاقة هوية</span>
        </div>

        <div className="px-5 py-2 flex flex-col items-center relative z-10 flex-grow justify-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-amber-400 shadow-md bg-zinc-800 flex items-center justify-center">
              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-amber-500 text-zinc-950 font-bold text-[10px] px-3 py-0.5 rounded-full shadow border border-amber-300 whitespace-nowrap">طالب</div>
          </div>

          <div className="text-center w-full mt-1">
            <h4 className="text-lg font-bold text-white drop-shadow-sm">{student.fullName}</h4>
            <p className="text-xs text-emerald-300 mt-0.5">{studentClass?.name || "فصل غير معين"}</p>
          </div>

          <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5 space-y-1.5 text-xs text-right">
            <div className="flex justify-between items-center text-zinc-300">
              <span>رقم الطالب:</span>
              <span className="font-mono text-amber-400 font-bold">{student.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>تاريخ الازدياد:</span>
              <span className="font-semibold">{student.birthDate}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>اسم ولي الأمر:</span>
              <span className="font-semibold text-emerald-300">{student.parentName}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>هاتف ولي الأمر:</span>
              <span className="font-mono font-semibold text-amber-400">{student.parentPhone}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-950/40 border-t border-white/5 relative z-10 flex items-center justify-between text-[10px] text-zinc-400 rounded-b-3xl">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-500" /><span>تسجيل: {student.registrationDate}</span></span>
          <span className="text-amber-400/80 font-semibold text-[10px]">نور القلوب بالقرآن</span>
        </div>
      </div>
    );
  };

  const renderBackSide = (student: typeof students[0]) => {
    if (!student) return null;
    return (
      <div
        id={`student-card-back-${student.id}`}
        className="w-[330px] h-[500px] rounded-3xl bg-zinc-900 text-white relative shadow-2xl overflow-hidden border border-zinc-700 select-none flex flex-col justify-between shrink-0"
        style={{ direction: "rtl" }}
      >
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="p-5 border-b border-zinc-800 text-center relative z-10">
          <h4 className="text-sm font-bold text-amber-400">تعليمات وضوابط النادي</h4>
          <p className="text-[9px] text-zinc-400 mt-1">تلتزم إدارة {schoolName} بالمحافظة على تميز الطلاب</p>
        </div>

        <div className="px-6 py-4 flex flex-col items-center justify-center gap-4 relative z-10 flex-grow">
          <ul className="text-[10px] text-zinc-300 space-y-2.5 w-full bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800 text-right">
            <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>الحضور في الوقت المحدد وبثياب تليق بحلقة كتاب الله تعالى.</span></li>
            <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>يجب الحفاظ على نظافة المصحف والممتلكات الخاصة بالجمعية.</span></li>
            <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">✦</span><span>تقديم هذه البطاقة شرط أساسي للدخول وحضور الفصول والأنشطة.</span></li>
          </ul>

          <div className="flex items-center gap-4 w-full bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/60 justify-around">
            <div className="flex flex-col items-center gap-1.5 bg-white p-1.5 rounded-xl shrink-0 shadow-sm border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.id)}`}
                alt={`QR Code for ${student.fullName}`}
                className="w-14 h-14 object-contain rounded-md"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <span className="text-[6px] text-zinc-800 font-mono font-bold select-all">ALFAJR ID-{student.id}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center bg-white p-2 rounded-lg py-3">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800"
                    style={{
                      width: `${(stIdCode => {
                        const c = stIdCode.charCodeAt(i % stIdCode.length) || 1;
                        return (c % 3) + 1;
                      })(student.id)}px`,
                      marginLeft: "1px",
                      height: "24px",
                    }}
                  />
                ))}
              </div>
              <span className="text-[7px] font-mono tracking-widest text-zinc-400 mt-1">*{student.id.toUpperCase()}*</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-1 text-[9px] text-zinc-400 rounded-b-3xl">
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 text-[8px]"><Phone className="w-3 h-3 text-amber-500" /><span>هاتف الجمعية: {systemSettings?.associationPhone || "06.74.633.108"}</span></span>
            <span className="flex items-center gap-1 text-[8px]"><MapPin className="w-3 h-3 text-emerald-500" /><span>مقر الجمعية: سلا</span></span>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficialFrontSide = (student: typeof students[0], studentClass: any) => {
    if (!student) return null;
    return (
      <div
        id={`official-card-front-${student.id}`}
        className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-5 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
        style={{ boxSizing: "border-box", direction: "rtl" }}
      >
        {/* Subtle Arabesque Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

        {/* Main Content Wrap */}
        <div className="flex flex-col items-center w-full flex-grow">
          {/* Header with Logo Only (Prominent and Centered) */}
          <div className="w-full flex items-center justify-center border-b border-slate-100 pb-3 mb-3">
            <div className="w-[300px] h-[100px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-1.5 shadow-md">
              {systemSettings?.associationLogo ? (
                <img
                  src={systemSettings.associationLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" fill="#f0fdf4" />
                  <path d="M50 45 C40 45, 33 53, 33 63 L67 63 C67 53, 60 45, 50 45 Z" fill="#F59E0B" />
                  <path d="M50 20 L50 30 M31 29 L38 36 M69 29 L62 36 M19 48 L29 48 M81 48 L71 48" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M42 63 C42 58, 44 53, 39 48 C37 46, 34 48, 32 50" stroke="#059669" strokeWidth="5.5" strokeLinecap="round" />
                  <circle cx="41" cy="44" r="3.5" fill="#059669" />
                  <path d="M58 63 C58 58, 56 53, 61 48 C63 46, 66 48, 68 50" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" />
                  <circle cx="59" cy="44" r="3.5" fill="#DC2626" />
                  <path d="M28 63 C38 71, 62 71, 72 63" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Card Title & Subtitle */}
          <div className="text-center mb-3">
            <h2 className="text-lg font-black text-teal-900 tracking-tight leading-none">بطاقة الطالب</h2>
            <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest">نادي القرآن</p>
          </div>

          {/* Student Photo Section */}
          <div className="relative mb-3">
            <div className="w-32 h-32 rounded-[26px] overflow-hidden border-4 border-teal-100 shadow-md bg-slate-50 flex items-center justify-center relative">
              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
            </div>
            {/* Photo Frame Badge Overlay */}
            <div className="absolute -bottom-1 -left-1 bg-white border border-slate-100 rounded-full p-1.5 shadow-md flex items-center justify-center">
              <div className="w-5 h-5 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Student Name Box */}
          <div className="w-full max-w-[290px] border border-teal-100 bg-gradient-to-b from-teal-50/30 to-white rounded-2xl p-2.5 text-center shadow-sm mb-3">
            <span className="text-[9px] font-bold text-slate-400 block mb-0.5">اسم الطالب:</span>
            <h1 className="text-base font-black text-teal-900 tracking-tight leading-tight">{student.fullName}</h1>
          </div>

          {/* Header Row: Contact Title & Season Pill */}
          <div className="w-full flex items-center justify-between gap-2 mb-2.5">
            {/* للتواصل معنا on the right (first in RTL) */}
            <div className="bg-teal-700 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-full shadow-xs">
              للتواصل معنا :
            </div>

            {/* موسم on the left (second in RTL) */}
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-[9.5px] text-slate-500 font-bold flex items-center gap-1">
              <span>موسم:</span>
              <span className="text-teal-800 font-black">1448</span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="w-full text-[9px] text-slate-500 leading-tight space-y-2 mt-1">

            {/* Address card */}
            <div className="flex items-start gap-2 bg-slate-50/55 p-2 rounded-xl border border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-right text-slate-700">
                <span className="font-bold text-teal-900">العنوان:</span> زنقة طارق ابن زياد رقم 3 حي الرشاد قطاع 2 القرية سلا
              </div>
            </div>

            {/* Phone card */}
            <div className="flex items-center justify-between bg-slate-50/55 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-bold text-teal-900">الهاتف أو الواتساب:</span>
              </div>
              <span className="font-black text-teal-800 font-mono tracking-wider text-[10px]">06.74.633.108</span>
            </div>
          </div>
        </div>

        {/* Card Footer with Socials & Certified Badge */}
        <div className="w-full border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[8px] text-slate-500 font-bold">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-teal-800">
              <Globe className="w-3 h-3 text-teal-600" />
              <span>{schoolName}</span>
            </span>
            <span className="flex items-center gap-0.5 text-blue-800">
              <Facebook className="w-3 h-3 text-blue-600" />
              <span>{schoolName}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100 font-extrabold text-[7px] uppercase tracking-wide">
            <span>معتمد</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficialBackSide = (student: typeof students[0]) => {
    if (!student) return null;

    // Fetch student's payments
    const studentPayments = RealmSimDB.getPayments().filter(
      (p) => p.studentId === student.id && p.status === "مدفوع"
    );

    // Helper to check if a specific month is paid
    const isMonthPaid = (monthName: string): boolean => {
      return studentPayments.some((p) => {
        const pMonth = p.month.trim();
        if (monthName === "يوليو" || monthName === "يوليوز") {
          return pMonth === "يوليو" || pMonth === "يوليوز";
        }
        if (monthName === "شتنبر" || monthName === "شتمبر") {
          return pMonth === "شتنبر" || pMonth === "شتمبر";
        }
        return pMonth === monthName;
      });
    };

    const cardMonths = [
      { name: "يوليو", num: 7, hijri: "محرم" },
      { name: "غشت", num: 8, hijri: "صفر" },
      { name: "شتنبر", num: 9, hijri: "ربيع الأول" },
      { name: "أكتوبر", num: 10, hijri: "ربيع الآخر" },
      { name: "نونبر", num: 11, hijri: "جمادى الأول" },
      { name: "دجنبر", num: 12, hijri: "جمادى الآخر" },
      { name: "يناير", num: 1, hijri: "رجب" },
      { name: "فبراير", num: 2, hijri: "شعبان" },
      { name: "مارس", num: 3, hijri: "رمضان" },
      { name: "أبريل", num: 4, hijri: "شوال" },
      { name: "ماي", num: 5, hijri: "ذو القعدة" },
      { name: "يونيو", num: 6, hijri: "ذو الحجة" },
    ];

    return (
      <div
        id={`official-card-back-${student.id}`}
        className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-4 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
        style={{ boxSizing: "border-box", direction: "rtl" }}
      >
        {/* Subtle Arabesque Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

        {/* Card Header Back */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <div className="text-right">
            <h2 className="text-xs font-black text-teal-900 leading-tight">بطاقة الانخراط الشهري</h2>
            <p className="text-[7.5px] text-slate-400 font-bold mt-0.5">يوضع الختم على الأشهر المؤدى عنها</p>
          </div>

          <div className="text-left">
            <p className="text-[7px] text-slate-400 font-bold leading-none">الموسم الدراسي لسنة:</p>
            <p className="text-[9px] text-teal-800 font-extrabold font-mono mt-0.5">{(systemSettings?.activeAcademicSeason || "").replace("/", "-")}</p>
          </div>
        </div>

        {/* 12 Months Stamps Grid */}
        <div className="grid grid-cols-3 gap-2 flex-grow justify-center items-center py-1">
          {cardMonths.map((m, idx) => {
            const paid = isMonthPaid(m.name);
            return (
              <div
                key={idx}
                className={`border rounded-xl p-2 text-center h-[72px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  paid 
                    ? "border-teal-200 bg-teal-50/20 shadow-2xs" 
                    : "border-slate-200/80 bg-slate-50/55 hover:bg-slate-50"
                }`}
              >
                {/* Month Heading */}
                <div className="flex justify-between items-center w-full border-b border-slate-100/70 pb-1">
                  <span className="text-[8.5px] font-black text-slate-800 leading-none">
                    {m.name} ({m.num})
                  </span>
                  <span className="text-[7.5px] font-bold text-slate-400 leading-none font-mono">
                    #{idx + 1}
                  </span>
                </div>

                {/* Hijri Match */}
                <div className="text-[8.5px] font-bold text-teal-800 py-1 leading-tight text-center">
                  {m.hijri}
                </div>

                {/* Stamp Container */}
                {paid ? (
                  /* High fidelity retro dynamic circular ink stamp */
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                      className="w-[52px] h-[52px] border-2 border-red-600/85 rounded-full flex flex-col items-center justify-center text-red-600/85 font-black uppercase tracking-tighter text-[7.5px] leading-none bg-white/70 p-0.5 scale-95 shadow-sm transform rotate-[-8deg]"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <div className="border border-dashed border-red-500/60 rounded-full w-full h-full flex flex-col items-center justify-center p-0.5">
                        <span className="text-[6px] text-red-500/70 scale-90">مؤدى عنه</span>
                        <span className="text-[8px] font-black tracking-widest my-0.5">★ تم ★</span>
                        <span className="text-[5px] text-red-500/70 scale-75">{schoolName}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Stamp Marker Slot */
                  <div className="text-[7px] text-slate-300 font-bold leading-none flex items-center justify-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span>خانة الختم</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rules & Notes Bar */}
        <div className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-right text-[8px] text-amber-900 leading-normal mt-2">
          <span className="font-extrabold text-amber-950 block mb-0.5">* تعليمات هامة:</span>
          يجب الإدلاء بهذه البطاقة عند الأداء الشهري في النادي. شكراً لتعاونكم ودعمكم المستمر للجمعية ومشاركتكم في خدمة كتاب الله.
        </div>

        {/* Back Footer Bar */}
        <div className="w-full border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[7px] text-slate-400 font-bold font-mono">
          <span>ID: {student.id.toUpperCase()}</span>
          <span>نادي القرآن الكريم - سلا</span>
          <span>المغرب</span>
        </div>
      </div>
    );
  };

  const renderFront = idCardLabTab === "student-card" ? renderOfficialFrontSide : renderFrontSide;
  const renderBack = idCardLabTab === "student-card" ? renderOfficialBackSide : renderBackSide;

  return (
    <div data-screen="id-cards-lab" className="space-y-6" style={{ direction: "rtl" }}>
      <div className="bg-gradient-to-l from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-1 rounded-full">استوديو الطباعة الرقمية</span>
            <h2 className="text-2xl md:text-3xl font-black">معمل بطاقات الهوية الرقمية والطباعة الاحترافية</h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              قم بمعاينة وتصميم بطاقة الهوية الذكية لكل طالب، مع إمكانية تصغير وتكبير المقاس بدقة متناهية لتلائم كافة طابعات الكروت البلاستيكية (CR80) أو الورقية بجودة عالية. يتم توليد رمز الاستجابة السريعة (QR Code) تلقائياً على ظهر البطاقة لتسجيل الحضور السريع بمجرد مسحه بالكاميرا.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-emerald-700/80 border border-emerald-500/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
              🖨️ جاهز للتصدير المباشر
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TABS FOR LAB */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 gap-2 shadow-xs">
        <button
          onClick={() => setIdCardLabTab("student-card")}
          className={`flex-1 sm:flex-initial py-3 px-6 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
            idCardLabTab === "student-card"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <Award className="w-4.5 h-4.5 text-amber-400" />
          <span>بطاقة الطالب الرسمية (نادي القرآن)</span>
        </button>
        <button
          onClick={() => setIdCardLabTab("membership-card")}
          className={`flex-1 sm:flex-initial py-3 px-6 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 ${
            idCardLabTab === "membership-card"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <QrCode className="w-4.5 h-4.5 text-amber-400" />
          <span>بطاقة الهوية الرقمية (QR & Barcode)</span>
        </button>
      </div>

      {/* TWO PANEL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* RIGHT PANEL: STUDENT SELECTOR */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-800">قائمة الطلاب</h3>
            <p className="text-[11px] text-slate-500">اختر طالباً للمعاينة، أو حدد دفعة من الطلاب للطباعة الجماعية.</p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-600" />
            </span>
            <input
              type="text"
              value={searchLabQuery}
              onChange={(e) => setSearchLabQuery(e.target.value)}
              placeholder="ابحث باسم الطالب أو الرقم التعريفي..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
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
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
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
                      className="w-4 h-4 accent-emerald-600 rounded border-slate-300"
                    />
                    <span>تحديد الكل ({filteredLabStudents.length})</span>
                  </label>
                  {bulkSelectedIds.length > 0 && (
                    <button
                      onClick={() => setBulkSelectedIds([])}
                      className="text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 text-[11px]"
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
                      className={`flex-1 text-[11px] py-1.5 px-2.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                        labPrintMode === "bulk"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      🖨️ تفعيل الطباعة الجماعية ({bulkSelectedIds.length})
                    </button>
                    {labPrintMode === "bulk" && (
                      <button
                        onClick={() => setLabPrintMode("single")}
                        className="text-[11px] py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
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
          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1.5">
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
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-sm" 
                      : "bg-white hover:bg-slate-50 border-transparent text-slate-700"
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
                    className="w-4 h-4 accent-emerald-600 rounded border-slate-300 cursor-pointer"
                  />

                  <button
                    onClick={() => {
                      setSelectedLabStudentId(st.id);
                      setLabFlip(false);
                    }}
                    className="flex-1 flex items-center gap-2.5 text-right overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-xs truncate">{st.fullName}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">ID: {st.id.toUpperCase()}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
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
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      {idCardLabTab === "student-card" 
                        ? "خيارات تخصيص بطاقة الطالب الرسمية" 
                        : "خيارات تخصيص بطاقة الهوية الرقمية"}
                    </h3>
                    <p className="text-[11px] text-slate-500">اضبط المقياس وتنسيق الطباعة والجهوزية بدقة متناهية.</p>
                  </div>

                  {checkUserPermission(currentUser, currentRole, "id-cards-lab", "print") && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. Print Both Sides */}
                      <button
                        onClick={() => handlePrintLabCard("both")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md hover:shadow-lg"
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
                        className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm hover:shadow-md"
                        title="طباعة الجهة الأمامية للبطاقة فقط"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {labPrintMode === "bulk" 
                            ? `طباعة الوجه للدفعة (${bulkSelectedIds.length})` 
                            : "طباعة الوجه فقط"}
                        </span>
                      </button>

                      {/* 3. Print Back Only */}
                      <button
                        onClick={() => handlePrintLabCard("back")}
                        className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm hover:shadow-md"
                        title="طباعة الجهة الخلفية للبطاقة فقط"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
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
                    <label className="block text-xs font-bold text-slate-700 flex justify-between">
                      <span>نسبة تكبير / تصغير البطاقة للطباعة:</span>
                      <span className="text-emerald-700 font-mono font-black bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
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
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
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
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                            Math.abs(labScale - preset.val) < 0.01
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
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
                        <span className="block text-xs font-bold text-slate-700 mb-2">تنسيق عرض الجهات:</span>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px]">
                          <button
                            onClick={() => {
                              setLabViewMode("both");
                              setLabDisplayType("print");
                            }}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labViewMode === "both" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
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
                              labViewMode === "front" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
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
                              labViewMode === "back" && labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            الظهر
                          </button>
                        </div>
                      </div>

                      {/* Print Mode Selector */}
                      <div>
                        <span className="block text-xs font-bold text-slate-700 mb-2">طريقة المعاينة:</span>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px]">
                          <button
                            onClick={() => setLabPrintMode("single")}
                            className={`py-1.5 rounded-lg font-bold transition text-center ${
                              labPrintMode === "single" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
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
                              labPrintMode === "bulk" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            دفعة ({bulkSelectedIds.length})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* View style toggle */}
                    <div>
                      <span className="block text-xs font-bold text-slate-700 mb-2">طريقة عرض المعمل:</span>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                        <button
                          onClick={() => setLabDisplayType("print")}
                          className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                            labDisplayType === "print" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>مخطط الطباعة</span>
                        </button>
                        <button
                          onClick={() => {
                            setLabDisplayType("3d");
                            setLabViewMode("both");
                          }}
                          className={`py-2 px-1 rounded-lg font-bold transition text-center flex items-center justify-center gap-1.5 ${
                            labDisplayType === "3d" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>معاينة ثلاثية الأبعاد تفاعلية</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <p className="text-[10px] text-slate-400 font-medium">
                  💡 نصيحة للطباعة الاحترافية: للطباعة على كروت البلاستيك، يوصى بمقياس <span className="font-bold text-emerald-700">85% (بطاقة CR80)</span>. أما للطباعة على ورق مقوى عادي يفضل المقدار <span className="font-bold text-emerald-700">100%</span>.
                </p>
              </div>

              {/* LIVE DISPLAY AREA */}
              <div className="bg-slate-100 rounded-3xl p-6 border-2 border-dashed border-slate-200 flex justify-center items-start overflow-hidden min-h-[580px] relative">

                {/* Interactive indicator for 3D mode */}
                {labDisplayType === "3d" && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm animate-bounce z-20">
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
                          <div className="text-center p-12 bg-white border border-slate-200 rounded-3xl max-w-md mx-auto shadow-sm">
                            <p className="text-slate-600 font-bold text-sm">الرجاء تحديد طالب واحد أو أكثر من القائمة الجانبية.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center w-full">
                            {bulkSelectedIds.map(stId => {
                              const st = students.find(s => s.id === stId);
                              if (!st) return null;
                              const stClass = classes.find(c => c.id === st.classId);
                              return (
                                <div key={st.id} className="flex flex-col xl:flex-row gap-4 p-4 bg-white/60 border border-slate-200 rounded-3xl shadow-sm break-inside-avoid print:p-0 print:border-none print:bg-transparent items-center">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-sm">
              يرجى إضافة طلاب نشطين أولاً لتتمكن من معاينة وإصدار البطاقات الذكية.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
