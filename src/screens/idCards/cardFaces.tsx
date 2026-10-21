/**
 * Faces des cartes (carte numérique QR et carte officielle), extraites telles
 * quelles de l'écran des cartes (Lot 2, sans changement de comportement).
 */
import { RealmSimDB } from "../../db";
import type { Student, SystemSettings } from "../../types";
import { StudentAvatar } from "../../utils/studentAvatar";
import { Calendar, Phone, MapPin, Check, Globe, Facebook } from "lucide-react";

export function makeCardRenderers(systemSettings: SystemSettings | null, schoolName: string) {
  const renderFrontSide = (student: Student, studentClass: any) => {
    if (!student) return null;
    return (
      <div
        id={`student-card-front-${student.id}`}
        className="w-[330px] h-[500px] rounded-3xl bg-gradient-to-b from-primary-900 via-primary-800 to-sand-900 text-white relative shadow-2xl overflow-hidden border border-primary-600/30 select-none flex flex-col justify-between shrink-0"
        style={{ direction: "rtl" }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

        <div className="p-5 border-b border-white/10 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white border border-sand-200 flex items-center justify-center text-gold-400 font-bold overflow-hidden shrink-0">
              {systemSettings?.associationLogo ? (
                <img src={systemSettings.associationLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                "🌅"
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-wide text-gold-400">{schoolName}</h3>
              <p className="text-[9px] text-primary-200 font-medium">نادي القرآن الكريم وتجويده</p>
            </div>
          </div>
          <span className="text-[8px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full border border-primary-500/30 font-bold">بطاقة هوية</span>
        </div>

        <div className="px-5 py-2 flex flex-col items-center relative z-10 flex-grow justify-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-gold-400 shadow-md bg-sand-800 flex items-center justify-center">
              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-gold-500 text-sand-950 font-bold text-[10px] px-3 py-0.5 rounded-full shadow border border-gold-300 whitespace-nowrap">طالب</div>
          </div>

          <div className="text-center w-full mt-1">
            <h4 className="text-lg font-bold text-white drop-shadow-sm">{student.fullName}</h4>
            <p className="text-xs text-primary-300 mt-0.5">{studentClass?.name || "فصل غير معين"}</p>
          </div>

          <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5 space-y-1.5 text-xs text-right">
            <div className="flex justify-between items-center text-sand-400">
              <span>رقم الطالب:</span>
              <span className="font-mono text-gold-400 font-bold">{student.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-sand-400">
              <span>تاريخ الازدياد:</span>
              <span className="font-semibold">{student.birthDate}</span>
            </div>
            <div className="flex justify-between items-center text-sand-400">
              <span>اسم ولي الأمر:</span>
              <span className="font-semibold text-primary-300">{student.parentName}</span>
            </div>
            <div className="flex justify-between items-center text-sand-400">
              <span>هاتف ولي الأمر:</span>
              <span className="font-mono font-semibold text-gold-400">{student.parentPhone}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-sand-950/40 border-t border-white/5 relative z-10 flex items-center justify-between text-[10px] text-sand-500 rounded-b-3xl">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-500" /><span>تسجيل: {student.registrationDate}</span></span>
          <span className="text-gold-400/80 font-semibold text-[10px]">نور القلوب بالقرآن</span>
        </div>
      </div>
    );
  };

  const renderBackSide = (student: Student) => {
    if (!student) return null;
    return (
      <div
        id={`student-card-back-${student.id}`}
        className="w-[330px] h-[500px] rounded-3xl bg-sand-900 text-white relative shadow-2xl overflow-hidden border border-sand-700 select-none flex flex-col justify-between shrink-0"
        style={{ direction: "rtl" }}
      >
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="p-5 border-b border-sand-800 text-center relative z-10">
          <h4 className="text-sm font-bold text-gold-400">تعليمات وضوابط النادي</h4>
          <p className="text-[9px] text-sand-500 mt-1">تلتزم إدارة {schoolName} بالمحافظة على تميز الطلاب</p>
        </div>

        <div className="px-6 py-4 flex flex-col items-center justify-center gap-4 relative z-10 flex-grow">
          <ul className="text-[10px] text-sand-400 space-y-2.5 w-full bg-sand-950/50 p-4 rounded-2xl border border-sand-800 text-right">
            <li className="flex items-start gap-1.5"><span className="text-gold-500 mt-0.5">✦</span><span>الحضور في الوقت المحدد وبثياب تليق بحلقة كتاب الله تعالى.</span></li>
            <li className="flex items-start gap-1.5"><span className="text-gold-500 mt-0.5">✦</span><span>يجب الحفاظ على نظافة المصحف والممتلكات الخاصة بالجمعية.</span></li>
            <li className="flex items-start gap-1.5"><span className="text-gold-500 mt-0.5">✦</span><span>تقديم هذه البطاقة شرط أساسي للدخول وحضور الفصول والأنشطة.</span></li>
          </ul>

          <div className="flex items-center gap-4 w-full bg-sand-950/40 p-3 rounded-2xl border border-sand-800/60 justify-around">
            <div className="flex flex-col items-center gap-1.5 bg-white p-1.5 rounded-xl shrink-0 shadow-sm border border-sand-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.id)}`}
                alt={`QR Code for ${student.fullName}`}
                className="w-14 h-14 object-contain rounded-md"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <span className="text-[6px] text-sand-800 font-mono font-bold select-all">ALFAJR ID-{student.id}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center bg-white p-2 rounded-lg py-3">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-sand-800"
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
              <span className="text-[7px] font-mono tracking-widest text-sand-500 mt-1">*{student.id.toUpperCase()}*</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-sand-950 border-t border-sand-800 flex flex-col gap-1 text-[9px] text-sand-500 rounded-b-3xl">
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 text-[8px]"><Phone className="w-3 h-3 text-gold-500" /><span>هاتف الجمعية: {systemSettings?.associationPhone || "06.74.633.108"}</span></span>
            <span className="flex items-center gap-1 text-[8px]"><MapPin className="w-3 h-3 text-primary-500" /><span>مقر الجمعية: سلا</span></span>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficialFrontSide = (student: Student, studentClass: any) => {
    if (!student) return null;
    return (
      <div
        id={`official-card-front-${student.id}`}
        className="w-[390px] h-[550px] bg-white text-sand-800 relative shadow-xl border-[11px] border-primary-800 rounded-[38px] p-5 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
        style={{ boxSizing: "border-box", direction: "rtl" }}
      >
        {/* Subtle Arabesque Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-primary-500/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-gold-500/5 blur-2xl pointer-events-none" />

        {/* Main Content Wrap */}
        <div className="flex flex-col items-center w-full flex-grow">
          {/* Header with Logo Only (Prominent and Centered) */}
          <div className="w-full flex items-center justify-center border-b border-sand-100 pb-3 mb-3">
            <div className="w-[300px] h-[100px] bg-white border border-sand-200 rounded-2xl flex items-center justify-center p-1.5 shadow-md">
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
            <h2 className="text-lg font-black text-primary-900 tracking-tight leading-none">بطاقة الطالب</h2>
            <p className="text-[9px] text-sand-500 font-bold mt-1 tracking-widest">نادي القرآن</p>
          </div>

          {/* Student Photo Section */}
          <div className="relative mb-3">
            <div className="w-32 h-32 rounded-[26px] overflow-hidden border-4 border-primary-100 shadow-md bg-sand-50 flex items-center justify-center relative">
              <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
            </div>
            {/* Photo Frame Badge Overlay */}
            <div className="absolute -bottom-1 -left-1 bg-white border border-sand-100 rounded-full p-1.5 shadow-md flex items-center justify-center">
              <div className="w-5 h-5 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Student Name Box */}
          <div className="w-full max-w-[290px] border border-primary-100 bg-gradient-to-b from-primary-50/30 to-white rounded-2xl p-2.5 text-center shadow-sm mb-3">
            <span className="text-[9px] font-bold text-sand-500 block mb-0.5">اسم الطالب:</span>
            <h1 className="text-base font-black text-primary-900 tracking-tight leading-tight">{student.fullName}</h1>
          </div>

          {/* Header Row: Contact Title & Season Pill */}
          <div className="w-full flex items-center justify-between gap-2 mb-2.5">
            {/* للتواصل معنا on the right (first in RTL) */}
            <div className="bg-primary-700 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-full shadow-xs">
              للتواصل معنا :
            </div>

            {/* موسم on the left (second in RTL) */}
            <div className="bg-sand-50/60 border border-sand-200/80 rounded-xl px-3.5 py-1.5 text-[9.5px] text-sand-500 font-bold flex items-center gap-1">
              <span>موسم:</span>
              <span className="text-primary-800 font-black">1448</span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="w-full text-[9px] text-sand-500 leading-tight space-y-2 mt-1">

            {/* Address card */}
            <div className="flex items-start gap-2 bg-sand-50/55 p-2 rounded-xl border border-sand-100">
              <MapPin className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-0.5" />
              <div className="text-right text-sand-700">
                <span className="font-bold text-primary-900">العنوان:</span> زنقة طارق ابن زياد رقم 3 حي الرشاد قطاع 2 القرية سلا
              </div>
            </div>

            {/* Phone card */}
            <div className="flex items-center justify-between bg-sand-50/55 p-2 rounded-xl border border-sand-100">
              <div className="flex items-center gap-2 text-sand-700">
                <Phone className="w-3.5 h-3.5 text-primary-700" />
                <span className="font-bold text-primary-900">الهاتف أو الواتساب:</span>
              </div>
              <span className="font-black text-primary-800 font-mono tracking-wider text-[10px]">06.74.633.108</span>
            </div>
          </div>
        </div>

        {/* Card Footer with Socials & Certified Badge */}
        <div className="w-full border-t border-sand-100 pt-2 mt-2 flex items-center justify-between text-[8px] text-sand-500 font-bold">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-primary-800">
              <Globe className="w-3 h-3 text-primary-600" />
              <span>{schoolName}</span>
            </span>
            <span className="flex items-center gap-0.5 text-primary-800">
              <Facebook className="w-3 h-3 text-primary-600" />
              <span>{schoolName}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-primary-50 text-primary-800 px-2 py-0.5 rounded border border-primary-100 font-extrabold text-[7px] uppercase tracking-wide">
            <span>معتمد</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficialBackSide = (student: Student) => {
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
        className="w-[390px] h-[550px] bg-white text-sand-800 relative shadow-xl border-[11px] border-primary-800 rounded-[38px] p-4 select-none flex flex-col justify-between overflow-hidden text-right shrink-0"
        style={{ boxSizing: "border-box", direction: "rtl" }}
      >
        {/* Subtle Arabesque Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

        {/* Card Header Back */}
        <div className="w-full flex items-center justify-between border-b border-sand-100 pb-2 mb-3">
          <div className="text-right">
            <h2 className="text-xs font-black text-primary-900 leading-tight">بطاقة الانخراط الشهري</h2>
            <p className="text-[7.5px] text-sand-500 font-bold mt-0.5">يوضع الختم على الأشهر المؤدى عنها</p>
          </div>

          <div className="text-left">
            <p className="text-[7px] text-sand-500 font-bold leading-none">الموسم الدراسي لسنة:</p>
            <p className="text-[9px] text-primary-800 font-extrabold font-mono mt-0.5">{(systemSettings?.activeAcademicSeason || "").replace("/", "-")}</p>
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
                    ? "border-primary-200 bg-primary-50/20 shadow-2xs" 
                    : "border-sand-200/80 bg-sand-50/55 hover:bg-sand-50"
                }`}
              >
                {/* Month Heading */}
                <div className="flex justify-between items-center w-full border-b border-sand-100/70 pb-1">
                  <span className="text-[8.5px] font-black text-sand-800 leading-none">
                    {m.name} ({m.num})
                  </span>
                  <span className="text-[7.5px] font-bold text-sand-500 leading-none font-mono">
                    #{idx + 1}
                  </span>
                </div>

                {/* Hijri Match */}
                <div className="text-[8.5px] font-bold text-primary-800 py-1 leading-tight text-center">
                  {m.hijri}
                </div>

                {/* Stamp Container */}
                {paid ? (
                  /* High fidelity retro dynamic circular ink stamp */
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                      className="w-[52px] h-[52px] border-2 border-danger-600/85 rounded-full flex flex-col items-center justify-center text-danger-600/85 font-black uppercase tracking-tighter text-[7.5px] leading-none bg-white/70 p-0.5 scale-95 shadow-sm transform rotate-[-8deg]"
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <div className="border border-dashed border-danger-500/60 rounded-full w-full h-full flex flex-col items-center justify-center p-0.5">
                        <span className="text-[6px] text-danger-500/70 scale-90">مؤدى عنه</span>
                        <span className="text-[8px] font-black tracking-widest my-0.5">★ تم ★</span>
                        <span className="text-[5px] text-danger-500/70 scale-75">{schoolName}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Stamp Marker Slot */
                  <div className="text-[7px] text-sand-400 font-bold leading-none flex items-center justify-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sand-200" />
                    <span>خانة الختم</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rules & Notes Bar */}
        <div className="w-full bg-gold-50/50 border border-gold-100 rounded-xl p-2.5 text-right text-[8px] text-gold-900 leading-normal mt-2">
          <span className="font-extrabold text-gold-950 block mb-0.5">* تعليمات هامة:</span>
          يجب الإدلاء بهذه البطاقة عند الأداء الشهري في النادي. شكراً لتعاونكم ودعمكم المستمر للجمعية ومشاركتكم في خدمة كتاب الله.
        </div>

        {/* Back Footer Bar */}
        <div className="w-full border-t border-sand-100 pt-2 mt-2 flex items-center justify-between text-[7px] text-sand-500 font-bold font-mono">
          <span>ID: {student.id.toUpperCase()}</span>
          <span>نادي القرآن الكريم - سلا</span>
          <span>المغرب</span>
        </div>
      </div>
    );
  };

  return { renderFrontSide, renderBackSide, renderOfficialFrontSide, renderOfficialBackSide };
}
