/** Fiche de l'élève sélectionné : informations, documents, carte. */
import React from "react";
import { Check, UserRound, X } from "lucide-react";
import { checkUserPermission, type Class } from "../../types";
import StudentCard from "../../components/StudentCard";
import { StudentAvatar } from "../../utils/studentAvatar";
import { useApp } from "../../app/AppContext";
import { ActionAlert, Button, Card, CardHeader, EmptyState, InfoRow, Ltr, Pill, WhatsAppIcon } from "../../ui";

export default function StudentDossier({ classes }: { classes: Class[] }) {
  const { selectedStudent, schoolName } = useApp();

  if (!selectedStudent) {
    return (
      <EmptyState icon={<UserRound className="w-8 h-8" strokeWidth={1.5} />} title="لم يُختر أي طالب">
        الرجاء اختيار طالب من القائمة لعرض تفاصيله وبطاقته.
      </EmptyState>
    );
  }
  const st = selectedStudent;
  const docs = [
    { ok: !!st.docParentId, label: "فوتوكوبي من البطاقة الوطنية لولي الأمر" },
    { ok: !!st.docBirthCert, label: "عقد ازدياد الطالب" },
    { ok: !!st.docPhotos, label: "صورتان شمسيتان حديثتان" },
  ];
  const openWhatsApp = () => {
    const phone = (st?.parentPhone || "").replace(/\s+/g, "");
    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "212" + phone.substring(1);
    }
    const rawMsg = `السلام عليكم ورحمة الله وبركاته، ولي أمر الطالب(ة) ${st.fullName} المحترم(ة)... ${schoolName}.`;
    const encodedMsg = encodeURIComponent(rawMsg);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <Card className="flex flex-col gap-4" aria-labelledby="dossier-title">
        <CardHeader id="dossier-title" title="ملف الطالب الرقمي" actions={<Pill tone="outline"><Ltr>{st.id.toUpperCase()}</Ltr></Pill>} />
        <div className="flex items-center gap-3.5">
          <span className="w-16 h-16 rounded-full overflow-hidden bg-sunken border-2 border-gold shrink-0">
            <StudentAvatar student={st} alt={st.fullName} className="w-full h-full object-cover" />
          </span>
          <div className="min-w-0">
            <p className="m-0 font-display font-semibold text-[22px] leading-snug text-ink">{st.fullName}</p>
            <p className="m-0 text-[14px] text-ink-2">{classes.find((c) => c.id === st.classId)?.name || "فصل غير معين"}</p>
          </div>
        </div>
        <dl className="m-0 bg-surface-2 rounded-xl px-4 py-1.5">
          <InfoRow label="الجنس">{st.gender}</InfoRow>
          <InfoRow label="تاريخ الازدياد"><Ltr>{st.birthDate}</Ltr></InfoRow>
          <InfoRow label="تاريخ التسجيل"><Ltr>{st.registrationDate}</Ltr></InfoRow>
          <InfoRow label="اسم ولي الأمر">{st.parentName}</InfoRow>
          <InfoRow label="هاتف ولي الأمر"><Ltr>{st.parentPhone}</Ltr></InfoRow>
          <InfoRow label="الحفظ الفعلي" strong>{st.hizbCount} حزب من القرآن</InfoRow>
          <InfoRow label="السورة الحالية">{st.currentSurah}</InfoRow>
          <InfoRow label="مستوى التجويد">{st.tajweedLevel}</InfoRow>
        </dl>
        <Button id="whatsapp-contact-parent-btn" block onClick={openWhatsApp} icon={<WhatsAppIcon className="w-4 h-4 text-success-700" />}>
          مراسلة ولي الأمر عبر واتساب
        </Button>
        <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <p className="m-0 text-[14px] font-semibold text-ink">الوثائق والملفات الإدارية المقدمة</p>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {docs.map((d) => (
              <li key={d.label} className="flex items-center gap-2.5 px-3 min-h-10 rounded-[10px] bg-surface-2 text-[14px]">
                {d.ok ? <Check className="w-4 h-4 text-success-700 shrink-0" strokeWidth={2} aria-hidden="true" /> : <X className="w-4 h-4 text-danger shrink-0" strokeWidth={2} aria-hidden="true" />}
                <span>{d.label}</span>
                <span className="sr-only">{d.ok ? "مقدّمة" : "ناقصة"}</span>
              </li>
            ))}
          </ul>
        </div>
        {st.notes && <ActionAlert tone="warn" title="ملاحظات المعلم">{st.notes}</ActionAlert>}
      </Card>
    </div>
  );
}

/** Aperçu de la carte officielle de l'élève sélectionné (pleine largeur). */
export function StudentCardPreview({ classes }: { classes: Class[] }) {
  const { selectedStudent: st, currentUser, currentRole } = useApp();
  if (!st) return null;
  return (
    <Card padded={false} className="overflow-hidden">
        <div className="flex justify-between items-center gap-2 px-5 py-4 border-b border-line-soft">
          <h3 className="m-0 font-display font-semibold text-[18px] text-primary">معاينة بطاقة الطالب للاستخدام والتصدير</h3>
          <span className="text-[12.5px] font-semibold text-gold-700">بشعار الجمعية</span>
        </div>
        <div className="p-4 sm:p-6 bg-surface-2 flex justify-center overflow-x-auto">
          <StudentCard student={st} studentClass={classes.find((c) => c.id === st.classId)} canPrint={checkUserPermission(currentUser, currentRole, "students", "print")} />
        </div>
    </Card>
  );
}
