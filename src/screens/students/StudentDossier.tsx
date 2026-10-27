/** Fiche de l'élève sélectionné : informations, documents, carte. */
import { useState } from "react";
import { Check, IdCard, UserRound, X } from "lucide-react";
import { checkUserPermission, type Class } from "../../types";
import StudentCard from "../../components/StudentCard";
import { StudentAvatar } from "../../utils/studentAvatar";
import { useApp } from "../../app/AppContext";
import { isFamilyRole } from "../../security/access";
import { ActionAlert, Button, Card, CardHeader, EmptyState, InfoRow, Ltr, Modal, Pill, WhatsAppIcon } from "../../ui";
import { formatDateAr } from "../../format/date";

export default function StudentDossier({ classes }: { classes: Class[] }) {
  const { selectedStudent, schoolName, currentRole, currentUser } = useApp();
  // Aperçu recto verso de la carte : dans une fenêtre, à la demande (UI-17).
  const [showCard, setShowCard] = useState(false);

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
            <p className="m-0 font-display font-semibold text-title leading-snug text-ink">{st.fullName}</p>
            <p className="m-0 text-body text-ink-2">{classes.find((c) => c.id === st.classId)?.name || "فصل غير معين"}</p>
          </div>
        </div>
        <dl className="m-0 bg-surface-2 rounded-xl px-4 py-1.5">
          <InfoRow label="الجنس">{st.gender}</InfoRow>
          <InfoRow label="تاريخ الازدياد">{formatDateAr(st.birthDate)}</InfoRow>
          <InfoRow label="تاريخ التسجيل">{formatDateAr(st.registrationDate)}</InfoRow>
          <InfoRow label="اسم ولي الأمر">{st.parentName}</InfoRow>
          <InfoRow label="هاتف ولي الأمر"><Ltr>{st.parentPhone}</Ltr></InfoRow>
          <InfoRow label="الحفظ الفعلي" strong>{st.hizbCount} حزب من القرآن</InfoRow>
          <InfoRow label="السورة الحالية">{st.currentSurah}</InfoRow>
          <InfoRow label="مستوى التجويد">{st.tajweedLevel}</InfoRow>
        </dl>
        {/* La famille n'a la carte que si elle a le droit d'imprimer. */}
        {(!isFamilyRole(currentRole) || checkUserPermission(currentUser, currentRole, "students", "print")) && (
          <Button data-action="open-student-card" block onClick={() => setShowCard(true)} icon={<IdCard className="w-4 h-4" strokeWidth={1.75} />}>
            بطاقة الطالب
          </Button>
        )}
        {/* Le parent ne s'écrit pas à lui-même (U-04). */}
        {!isFamilyRole(currentRole) && (
          <Button id="whatsapp-contact-parent-btn" block onClick={openWhatsApp} icon={<WhatsAppIcon className="w-4 h-4 text-success-700" />}>
            مراسلة ولي الأمر عبر واتساب
          </Button>
        )}
        <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <p className="m-0 text-body font-semibold text-ink">الوثائق والملفات الإدارية المقدمة</p>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {docs.map((d) => (
              <li key={d.label} className="flex items-center gap-2.5 px-3 min-h-10 rounded-[10px] bg-surface-2 text-body">
                {d.ok ? <Check className="w-4 h-4 text-success-700 shrink-0" strokeWidth={2} aria-hidden="true" /> : <X className="w-4 h-4 text-danger shrink-0" strokeWidth={2} aria-hidden="true" />}
                <span>{d.label}</span>
                <span className="sr-only">{d.ok ? "مقدّمة" : "ناقصة"}</span>
              </li>
            ))}
          </ul>
        </div>
        {st.notes && <ActionAlert tone="warn" title="ملاحظات المعلم">{st.notes}</ActionAlert>}
      </Card>
      {showCard && (
        <Modal modalId="student-card" size="lg" title="بطاقة الطالب" subtitle={`${st.fullName} — معاينة الوجهين قبل الطباعة`} onClose={() => setShowCard(false)} footer={<Button onClick={() => setShowCard(false)}>إغلاق</Button>}>
          <StudentCard student={st} studentClass={classes.find((c) => c.id === st.classId)} canPrint={checkUserPermission(currentUser, currentRole, "students", "print")} />
        </Modal>
      )}
    </div>
  );
}
