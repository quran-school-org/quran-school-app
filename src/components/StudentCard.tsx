import React, { useRef } from "react";
import { Student, Class } from "../types";
import { RealmSimDB } from "../db";
import { StudentAvatar } from "../utils/studentAvatar";
import { Printer, MapPin, Phone, Globe, Facebook, Check, Award } from "lucide-react";

interface StudentCardProps {
  student: Student;
  studentClass?: Class;
  canPrint?: boolean;
}

export default function StudentCard({ student, studentClass, canPrint = true }: StudentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!student) return null;

  // Fetch settings
  const systemSettings = RealmSimDB.getSystemSettings();
  const associationLogo = systemSettings?.associationLogo;
  const associationName = systemSettings?.associationName || "";

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

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback if popup is blocked
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>بطاقة الطالب - ${student.fullName}</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
          <style>
            body {
              font-family: 'Cairo', sans-serif;
              background-color: white;
              margin: 0;
              padding: 0;
              direction: rtl;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              .print-page {
                page-break-inside: avoid;
                page-break-after: always;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                height: 100vh !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-page flex flex-col md:flex-row gap-8 justify-center items-center p-8">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 12 Months list representing the back side of the card (Gregorian name, Number, corresponding Hijri name)
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
    <div className="flex flex-col items-center gap-6 p-2 w-full max-w-4xl">
      {/* Action Bar */}
      {canPrint && (
        <div className="flex gap-3 no-print w-full justify-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg text-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة وتصدير بطاقة الطالب الممتازة
          </button>
        </div>
      )}

      {/* Printable Area - Contains Front and Back */}
      <div
        ref={cardRef}
        className="flex flex-col md:flex-row gap-8 justify-center items-center p-2 bg-slate-50 md:p-6 rounded-3xl border border-slate-200/60 shadow-sm"
        style={{ direction: "rtl" }}
      >
        {/* ================= CARD FRONT ================= */}
        <div
          id="student-card-front"
          className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-5 select-none flex flex-col justify-between overflow-hidden"
          style={{ boxSizing: "border-box" }}
        >
          {/* Subtle Arabesque Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

          {/* Main Content Wrap */}
          <div className="flex flex-col items-center w-full flex-grow">
            {/* Header with Logo */}
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              {/* Logo Details */}
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                  {associationLogo ? (
                    <img src={associationLogo} alt="Institution Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    /* Highly polished SVG logo representation */
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
                <div className="text-right">
                  <h3 className="text-xs font-extrabold text-teal-900 tracking-tight leading-tight">{associationName}</h3>
                  <p className="text-[8px] text-amber-600 font-bold leading-none mt-0.5">للثقافة و التنمية الاجتماعية</p>
                  <p className="text-[6px] text-slate-400 font-mono scale-90 origin-right mt-0.5">Association El Fajr Jadid</p>
                </div>
              </div>

              {/* Quran Club Banner */}
              <div className="bg-amber-500 text-white font-extrabold text-[8px] px-2.5 py-1 rounded-lg shadow-sm border border-amber-400 uppercase tracking-wider text-center leading-tight">
                نادي القرآن الكريم
              </div>
            </div>

            {/* Card Title & Subtitle */}
            <div className="text-center mb-3">
              <h2 className="text-lg font-black text-teal-900 tracking-tight leading-none">بطاقة الطالب</h2>
              <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest">نادي القرآن</p>
            </div>

            {/* Elegant Dotted Divider */}
            <div className="w-full border-b border-dashed border-slate-200 mb-3" />

            {/* Student Photo Section */}
            <div className="relative mb-3">
              <div className="w-32 h-32 rounded-[26px] overflow-hidden border-4 border-teal-100 shadow-md bg-slate-50 flex items-center justify-center relative">
                <StudentAvatar student={student} alt={student.fullName} />
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

            {/* Season Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 flex items-center gap-1.5 shadow-2xs mb-3 text-[10px] text-slate-600 font-bold">
              <span>موسم:</span>
              <span className="text-teal-800 font-black">1448</span>
            </div>

            {/* Contact Details Grid */}
            <div className="w-full text-[9px] text-slate-500 leading-tight space-y-2 mt-1">
              <div className="text-center font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                للتواصل معنا:
              </div>
              
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
                <span className="font-black text-teal-800 font-mono tracking-wider text-[10px]">{systemSettings?.associationPhone || ""}</span>
              </div>
            </div>
          </div>

          {/* Card Footer with Socials & Certified Badge */}
          <div className="w-full border-t border-slate-100 pt-2 mt-2 flex items-center justify-between text-[8px] text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-teal-800">
                <Globe className="w-3 h-3 text-teal-600" />
                <span>{associationName}</span>
              </span>
              {systemSettings?.associationEmail && (
                <span className="flex items-center gap-0.5 text-blue-800">
                  <Facebook className="w-3 h-3 text-blue-600" />
                  <span>{systemSettings.associationEmail}</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100 font-extrabold text-[7px] uppercase tracking-wide">
              <span>معتمد</span>
            </div>
          </div>
        </div>

        {/* ================= CARD BACK ================= */}
        <div
          id="student-card-back"
          className="w-[390px] h-[550px] bg-white text-slate-800 relative shadow-xl border-[11px] border-teal-800 rounded-[38px] p-4 select-none flex flex-col justify-between overflow-hidden"
          style={{ boxSizing: "border-box" }}
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
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50"
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
                  <div className="text-[8.5px] font-bold text-teal-800 py-1 leading-tight">
                    {m.hijri}
                  </div>

                  {/* Stamp Container */}
                  {paid ? (
                    /* High fidelity retro dynamic circular ink stamp */
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div 
                        className="w-[52px] h-[52px] border-2 border-red-600/85 rounded-full flex flex-col items-center justify-center text-red-600/85 font-black uppercase tracking-tighter text-[7.5px] leading-none bg-white/70 p-0.5 scale-95 shadow-sm transform rotate-[-8deg] animate-pulse"
                        style={{ fontFamily: "'Cairo', sans-serif" }}
                      >
                        <div className="border border-dashed border-red-500/60 rounded-full w-full h-full flex flex-col items-center justify-center p-0.5">
                          <span className="text-[6px] text-red-500/70 scale-90">مؤدى عنه</span>
                          <span className="text-[8px] font-black tracking-widest my-0.5">★ تم ★</span>
                          {associationName && <span className="text-[5px] text-red-500/70 scale-75">{associationName}</span>}
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
            <span>{associationName}</span>
            <span>{systemSettings?.associationAddress || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
