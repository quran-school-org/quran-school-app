/**
 * Cartes d'élève aux couleurs de la charte (bleu nuit, or, motif géométrique),
 * avec les paramètres de l'école (nom, logo, devise, adresse, téléphone, saison).
 * - Carte officielle (390 × 550) : recto identité, verso cotisations mensuelles.
 * - Carte numérique (330 × 500) : recto identité, verso QR et code-barres.
 * Les identifiants `*-front-*` / `*-back-*` servent à l'impression recto ou verso.
 */
import { Calendar, MapPin, Phone } from "lucide-react";
import type { Payment, Student, SystemSettings } from "../../types";
import { StudentAvatar } from "../../utils/studentAvatar";
import { Emblem, GeometricPattern } from "../../ui";
import { QrCode } from "../../ui/QrCode";

export interface CardContext {
  settings: SystemSettings | null;
  schoolName: string;
}

const CARD_MONTHS = [
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

/** Mois payé (mêmes équivalences d'orthographe que l'ancienne carte). */
export function isMonthPaid(paid: Payment[], monthName: string): boolean {
  return paid.some((p) => {
    const pMonth = (p.month || "").trim();
    if (monthName === "يوليو" || monthName === "يوليوز") return pMonth === "يوليو" || pMonth === "يوليوز";
    if (monthName === "شتنبر" || monthName === "شتمبر") return pMonth === "شتنبر" || pMonth === "شتمبر";
    return pMonth === monthName;
  });
}

const seasonOf = (s: SystemSettings | null) => (s?.activeAcademicSeason || "").trim().replace("/", "–");

/**
 * Les cartes d'élève gardent la charte bleu nuit quel que soit le thème de
 * l'école (D84) : chaque carte porte `data-theme="bleu-nuit"`, qui rétablit les
 * variables de couleur de référence pour tout son contenu (aperçu et impression).
 */
function Logo({ settings, size, dark }: { settings: SystemSettings | null; size: number; dark?: boolean }) {
  if (settings?.associationLogo) {
    return (
      <span className="inline-flex items-center justify-center bg-white rounded-xl overflow-hidden p-0.5 shrink-0 border border-line" style={{ width: size, height: size }}>
        <img src={settings.associationLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
      </span>
    );
  }
  return <Emblem size={size} background={dark ? "#102446" : "#FFFFFF"} />;
}

/* ---------------------------------------------------------------- officielle */

export function OfficialCardFront({ student, ctx }: { student: Student; ctx: CardContext }) {
  const s = ctx.settings;
  return (
    <div
      id={`official-card-front-${student.id}`}
      data-theme="bleu-nuit"
      className="w-[390px] h-[550px] bg-white text-ink relative border-[10px] border-primary rounded-[34px] p-5 select-none flex flex-col justify-between overflow-hidden shrink-0 shadow-[0_12px_32px_rgba(16,36,70,0.18)]"
      style={{ boxSizing: "border-box", direction: "rtl" }}
    >
      <GeometricPattern size={48} opacity={0.06} color="#1B3A6B" />
      <div className="relative flex flex-col items-center w-full flex-grow">
        <div className="w-full flex items-center justify-between gap-2 border-b border-line-soft pb-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Logo settings={s} size={44} />
            <div className="min-w-0">
              <p className="m-0 font-display font-bold text-[13px] leading-tight text-primary truncate">{ctx.schoolName}</p>
              {s?.mottoVision && <p className="m-0 text-[8.5px] text-gold-700 font-semibold leading-tight mt-0.5 line-clamp-1">{s.mottoVision}</p>}
            </div>
          </div>
          <span className="bg-gold text-night font-bold text-[9px] px-2.5 py-1 rounded-full whitespace-nowrap">نادي القرآن الكريم</span>
        </div>
        <p className="m-0 font-display font-bold text-[22px] text-primary leading-none">بطاقة الطالب</p>
        <span className="w-14 h-0.5 bg-gold rounded-full my-3" aria-hidden="true" />
        <div className="w-32 h-32 rounded-[24px] overflow-hidden border-4 border-gold bg-surface-2 mb-3">
          <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
        </div>
        <div className="w-full max-w-[290px] border border-line rounded-2xl px-3 py-2 text-center bg-surface mb-2.5">
          <span className="text-[9.5px] text-ink-3 block">اسم الطالب</span>
          <p className="m-0 font-display font-bold text-[17px] text-primary leading-tight">{student.fullName}</p>
        </div>
        {seasonOf(s) && (
          <span className="bg-primary-100 text-primary rounded-full px-3 py-1 text-[10px] font-semibold mb-2.5">الموسم الدراسي <bdi dir="ltr">{seasonOf(s)}</bdi></span>
        )}
        <div className="w-full flex flex-col gap-1.5 text-[9.5px] text-ink-2">
          {s?.associationAddress && (
            <div className="flex items-start gap-1.5 bg-surface-2 px-2.5 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-px" strokeWidth={1.75} aria-hidden="true" />
              <span><strong className="text-primary">العنوان: </strong>{s.associationAddress}</span>
            </div>
          )}
          {s?.associationPhone && (
            <div className="flex items-center justify-between bg-surface-2 px-2.5 py-1.5 rounded-xl">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} aria-hidden="true" /><strong className="text-primary">الهاتف أو الواتساب</strong></span>
              <bdi dir="ltr" className="font-bold text-primary text-[10.5px] tabular-nums">{s.associationPhone}</bdi>
            </div>
          )}
        </div>
      </div>
      <div className="relative w-full border-t border-line-soft pt-2 mt-2 flex items-center justify-between text-[8.5px] text-ink-3 font-semibold">
        <span className="truncate">{ctx.schoolName}{s?.associationEmail ? ` • ${s.associationEmail}` : ""}</span>
        <span className="bg-primary text-gold-100 px-2 py-0.5 rounded-md text-[8px]">معتمد</span>
      </div>
    </div>
  );
}

export function OfficialCardBack({ student, payments, ctx }: { student: Student; payments: Payment[]; ctx: CardContext }) {
  const s = ctx.settings;
  const paid = payments.filter((p) => p.studentId === student.id && p.status === "مدفوع");
  return (
    <div
      id={`official-card-back-${student.id}`}
      data-theme="bleu-nuit"
      className="w-[390px] h-[550px] bg-white text-ink relative border-[10px] border-primary rounded-[34px] p-4 select-none flex flex-col justify-between overflow-hidden shrink-0 shadow-[0_12px_32px_rgba(16,36,70,0.18)]"
      style={{ boxSizing: "border-box", direction: "rtl" }}
    >
      <GeometricPattern size={48} opacity={0.05} color="#1B3A6B" />
      <div className="relative w-full flex items-center justify-between border-b border-line-soft pb-2 mb-2.5">
        <div>
          <p className="m-0 font-display font-bold text-[14px] text-primary leading-tight">بطاقة الانخراط الشهري</p>
          <p className="m-0 text-[8px] text-ink-3 mt-0.5">يوضع الختم على الأشهر المؤدى عنها</p>
        </div>
        <div className="text-end">
          <p className="m-0 text-[7.5px] text-ink-3 leading-none">الموسم الدراسي</p>
          <bdi dir="ltr" className="text-[10px] text-primary font-bold tabular-nums">{seasonOf(s)}</bdi>
        </div>
      </div>
      <div className="relative grid grid-cols-3 gap-1.5 flex-grow content-center py-1">
        {CARD_MONTHS.map((m, idx) => {
          const ok = isMonthPaid(paid, m.name);
          return (
            <div key={idx} className={"border rounded-xl px-2 py-1.5 text-center h-[70px] flex flex-col justify-between relative overflow-hidden " + (ok ? "border-gold-200 bg-gold-50" : "border-line bg-surface-2")}>
              <div className="flex justify-between items-center w-full border-b border-line-soft pb-1">
                <span className="text-[8.5px] font-bold text-ink leading-none">{m.name} ({m.num})</span>
                <span className="text-[7.5px] text-ink-3 leading-none tabular-nums">#{idx + 1}</span>
              </div>
              <div className="text-[8.5px] font-semibold text-primary py-0.5 leading-tight">{m.hijri}</div>
              {ok ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[50px] h-[50px] border-2 border-danger/80 rounded-full flex items-center justify-center text-danger/85 bg-white/70 p-0.5 rotate-[-8deg]">
                    <div className="border border-dashed border-danger/60 rounded-full w-full h-full flex flex-col items-center justify-center leading-none">
                      <span className="text-[6px]">مؤدى عنه</span>
                      <span className="text-[8px] font-bold my-0.5">★ تم ★</span>
                      <span className="text-[5px] max-w-[40px] truncate">{ctx.schoolName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[7px] text-ink-4 leading-none flex items-center justify-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-line" aria-hidden="true" />
                  <span>خانة الختم</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative w-full bg-gold-100 rounded-xl px-2.5 py-2 text-[8.5px] text-gold-800 leading-normal mt-2">
        <strong className="block mb-0.5">تعليمات هامة</strong>
        يجب الإدلاء بهذه البطاقة عند الأداء الشهري في النادي. شكراً لتعاونكم ودعمكم المستمر للجمعية ومشاركتكم في خدمة كتاب الله.
      </div>
      <div className="relative w-full border-t border-line-soft pt-2 mt-2 flex items-center justify-between gap-2 text-[7.5px] text-ink-3 font-semibold">
        <bdi dir="ltr">ID: {student.id.toUpperCase()}</bdi>
        <span className="truncate">{ctx.schoolName}</span>
        <span className="truncate max-w-[120px]">{s?.associationAddress || ""}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- numérique */

export function DigitalCardFront({ student, studentClassName, ctx }: { student: Student; studentClassName?: string; ctx: CardContext }) {
  const s = ctx.settings;
  return (
    <div
      id={`student-card-front-${student.id}`}
      data-theme="bleu-nuit"
      className="w-[330px] h-[500px] rounded-[26px] bg-night text-night-text relative overflow-hidden border border-night-line select-none flex flex-col justify-between shrink-0 shadow-[0_12px_32px_rgba(16,36,70,0.25)]"
      style={{ direction: "rtl" }}
    >
      <GeometricPattern size={56} opacity={0.12} />
      <div className="relative p-5 border-b border-night-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Logo settings={s} size={38} dark />
          <div className="min-w-0">
            <p className="m-0 font-display font-bold text-[13px] text-gold-100 truncate">{ctx.schoolName}</p>
            <p className="m-0 text-[9px] text-night-muted">نادي القرآن الكريم وتجويده</p>
          </div>
        </div>
        <span className="text-[9px] text-gold border border-gold/40 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">بطاقة هوية</span>
      </div>
      <div className="relative px-5 py-2 flex flex-col items-center flex-grow justify-center gap-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-[3px] border-gold bg-night-2">
            <StudentAvatar student={student} alt={student.fullName} className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-2 start-1/2 translate-x-1/2 bg-gold text-night font-bold text-[10px] px-3 py-0.5 rounded-full whitespace-nowrap">طالب</span>
        </div>
        <div className="text-center w-full mt-1">
          <p className="m-0 font-display font-bold text-[19px] text-white">{student.fullName}</p>
          <p className="m-0 text-[12px] text-night-muted mt-0.5">{studentClassName || "فصل غير معين"}</p>
        </div>
        <div className="w-full bg-white/[0.06] rounded-2xl px-3 py-2.5 border border-night-line flex flex-col gap-1.5 text-[11.5px]">
          <div className="flex justify-between"><span className="text-night-muted">رقم الطالب</span><bdi dir="ltr" className="text-gold font-bold">{student.id.toUpperCase()}</bdi></div>
          <div className="flex justify-between"><span className="text-night-muted">تاريخ الازدياد</span><bdi dir="ltr">{student.birthDate}</bdi></div>
          <div className="flex justify-between gap-2"><span className="text-night-muted shrink-0">اسم ولي الأمر</span><span className="truncate">{student.parentName}</span></div>
          <div className="flex justify-between"><span className="text-night-muted">هاتف ولي الأمر</span><bdi dir="ltr" className="text-gold">{student.parentPhone}</bdi></div>
        </div>
      </div>
      <div className="relative px-4 py-3 bg-black/20 border-t border-night-line flex items-center justify-between text-[10px] text-night-muted">
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gold" strokeWidth={1.75} aria-hidden="true" />تسجيل: <bdi dir="ltr">{student.registrationDate}</bdi></span>
        <span className="text-gold font-quran text-[12px]">نور القلوب بالقرآن</span>
      </div>
    </div>
  );
}

export function DigitalCardBack({ student, ctx }: { student: Student; ctx: CardContext }) {
  const s = ctx.settings;
  return (
    <div
      id={`student-card-back-${student.id}`}
      data-theme="bleu-nuit"
      className="w-[330px] h-[500px] rounded-[26px] bg-night-2 text-night-text relative overflow-hidden border border-night-line select-none flex flex-col justify-between shrink-0 shadow-[0_12px_32px_rgba(16,36,70,0.25)]"
      style={{ direction: "rtl" }}
    >
      <GeometricPattern size={56} opacity={0.07} />
      <div className="relative p-5 border-b border-night-line text-center">
        <p className="m-0 font-display font-bold text-[15px] text-gold-100">تعليمات وضوابط النادي</p>
        <p className="m-0 text-[9.5px] text-night-muted mt-1">تلتزم إدارة {ctx.schoolName} بالمحافظة على تميز الطلاب</p>
      </div>
      <div className="relative px-5 py-4 flex flex-col items-center justify-center gap-4 flex-grow">
        <ul className="m-0 p-4 list-none text-[10.5px] flex flex-col gap-2.5 w-full bg-black/20 rounded-2xl border border-night-line">
          {["الحضور في الوقت المحدد وبثياب تليق بحلقة كتاب الله تعالى.", "يجب الحفاظ على نظافة المصحف والممتلكات الخاصة بالجمعية.", "تقديم هذه البطاقة شرط أساسي للدخول وحضور الفصول والأنشطة."].map((t) => (
            <li key={t} className="flex items-start gap-1.5"><span className="text-gold" aria-hidden="true">✦</span><span>{t}</span></li>
          ))}
        </ul>
        <div className="flex items-center gap-4 w-full bg-black/20 p-3 rounded-2xl border border-night-line justify-around">
          <div className="flex flex-col items-center gap-1 bg-white p-1.5 rounded-xl shrink-0">
            <QrCode value={student.id} label={`رمز QR للطالب ${student.fullName}`} className="w-14 h-14 rounded-md" />
            <span className="text-[6px] text-ink font-bold select-all" dir="ltr">ID-{student.id}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center bg-white p-2 rounded-lg py-3" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="bg-ink" style={{ width: `${((student.id.charCodeAt(i % student.id.length) || 1) % 3) + 1}px`, marginLeft: "1px", height: "24px" }} />
              ))}
            </div>
            <span className="text-[7px] tracking-widest text-night-muted mt-1" dir="ltr">*{student.id.toUpperCase()}*</span>
          </div>
        </div>
      </div>
      <div className="relative px-4 py-3 bg-black/25 border-t border-night-line flex items-center justify-between gap-2 text-[8.5px] text-night-muted">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gold" strokeWidth={1.75} aria-hidden="true" />هاتف الجمعية: <bdi dir="ltr">{s?.associationPhone || "—"}</bdi></span>
        <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 text-gold shrink-0" strokeWidth={1.75} aria-hidden="true" /><span className="truncate">{s?.associationAddress || "—"}</span></span>
      </div>
    </div>
  );
}
