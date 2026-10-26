/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 * Cadre de la fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu.
 * La zone d'impression du badge garde son `data-theme="bleu-nuit"` (impression bleu nuit voulue).
 */
import { Printer } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG, DEFAULT_STAFF_ICON } from "./shared";
import { QrCode } from "../../ui/QrCode";
import { useStaff } from "./StaffContext";
import { Button, Modal } from "../../ui";

export default function StaffBadgeModal() {
  const {
    systemSettings,
    badgeStaff,
    showBadgeModal,
    setShowBadgeModal,
  } = useStaff();

  if (!showBadgeModal || !badgeStaff) return null;
  const close = () => setShowBadgeModal(false);

  return (
    <Modal
      modalId="staff-badge"
      size="sm"
      tone="night"
      icon={<Printer className="w-4 h-4" />}
      title="معاينة بطاقة العمل والشارة المهنية"
      onClose={close}
      bodyClassName="flex flex-col items-center justify-center bg-sand-100"
      footerAlign="between"
      footer={
        <>
          <Button onClick={close}>إغلاق</Button>
          <Button variant="primary" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>طباعة الشارة</Button>
        </>
      }
    >
      {/* Badge Container (Printable Area) */}
      <div id="staff-badge-print-area" data-theme="bleu-nuit" className="w-[320px] bg-surface rounded-2xl shadow-lg border-2 border-primary-800 overflow-hidden text-right font-sans relative">
        {/* Badge Top Header */}
        <div className="bg-primary-800 text-white p-3.5 text-center relative">
          <div className="text-[11.5px] font-medium opacity-90">{systemSettings?.associationName || ""}</div>
          <div className="text-[13px] font-bold tracking-wide mt-0.5">بطاقة التعريف المهنية والشارة</div>
          <div className="text-[12.5px] opacity-75 mt-0.5">الموسم: {systemSettings?.activeAcademicSeason || ""}</div>
        </div>

        {/* Badge Body */}
        <div className="p-4 space-y-3">
          {/* Photo & Role */}
          <div className="flex items-center gap-3">
            <div className="w-18 h-18 rounded-xl overflow-hidden border-2 border-primary-700 bg-sand-50 shrink-0 flex items-center justify-center">
              {badgeStaff.photo ? (
                <img src={badgeStaff.photo} alt={badgeStaff.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[badgeStaff.category || "أستاذ / محفظ"]?.icon || DEFAULT_STAFF_ICON}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink text-sm">{badgeStaff.fullName}</div>
              <div className="text-[13px] font-bold text-primary-800 mt-0.5">{badgeStaff.roleTitle || badgeStaff.specialty}</div>
              <span className="inline-block text-[12.5px] font-bold bg-sand-100 text-ink-2 px-2 py-0.5 rounded mt-1">
                {badgeStaff.category || "أستاذ / محفظ"}
              </span>
            </div>
          </div>

          {/* Badge Details Grid */}
          <div className="bg-sand-50 p-2.5 rounded-xl border border-line text-[11.5px] space-y-1.5 font-mono">
            {badgeStaff.cinNumber && (
              <div className="flex justify-between">
                <span className="text-ink-3 font-sans">رقم البطاقة (CIN):</span>
                <span className="font-bold text-ink">{badgeStaff.cinNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-3 font-sans">رقم الهاتف:</span>
              <span className="font-bold text-ink">{badgeStaff.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3 font-sans">نوع التعاقد:</span>
              <span className="font-bold text-ink font-sans">{badgeStaff.contractType || "مكافأة شهرية"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3 font-sans">تاريخ الالتحاق:</span>
              <span className="font-bold text-ink">{badgeStaff.joinedDate}</span>
            </div>
          </div>

          {/* QR Code & Signature Seal */}
          <div className="flex items-center justify-between pt-1 border-t border-line">
            <div className="text-[12.5px] text-ink-3 space-y-0.5">
              <p className="font-bold text-ink-2 font-sans">ختم وتوقيع الإدارة</p>
              <p className="font-sans text-[11.5px]">صالحة للموسم الحالي</p>
            </div>

            <div className="w-14 h-14 bg-white p-1 rounded-lg border border-line">
              <QrCode value={`STAFF:${badgeStaff.id}:${badgeStaff.fullName}:${badgeStaff.category || "Staff"}`} label={`رمز QR لـ ${badgeStaff.fullName}`} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Badge Bottom Stripe */}
        <div className="bg-night text-white text-[11.5px] py-1 text-center font-mono">
          ID: {badgeStaff.id} • {systemSettings?.associationPhone || "—"}
        </div>
      </div>
    </Modal>
  );
}
