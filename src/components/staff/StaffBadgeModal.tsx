/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { X, Printer } from "lucide-react";
import { STAFF_CATEGORIES_CONFIG } from "./shared";
import { useStaff } from "./StaffContext";

export default function StaffBadgeModal() {
  const {
    systemSettings,
    badgeStaff,
    showBadgeModal,
    setShowBadgeModal,
  } = useStaff();

  return (
    <>
      {/* PRINT STAFF BADGE / ID CARD MODAL */}
      {showBadgeModal && badgeStaff && (
        <div className="fixed inset-0 bg-sand-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-6 flex flex-col" dir="rtl">
            <div className="p-4 bg-sand-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-sm">معاينة بطاقة العمل والشارة المهنية</span>
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="text-sand-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-sand-100">
              {/* Badge Container (Printable Area) */}
              <div id="staff-badge-print-area" className="w-[320px] bg-white rounded-2xl shadow-lg border-2 border-primary-800 overflow-hidden text-right font-sans relative">
                {/* Badge Top Header */}
                <div className="bg-primary-800 text-white p-3.5 text-center relative">
                  <div className="text-[10px] font-medium opacity-90">{systemSettings?.associationName || ""}</div>
                  <div className="text-xs font-black tracking-wide mt-0.5">بطاقة التعريف المهنية والشارة</div>
                  <div className="text-[9px] opacity-75 mt-0.5">الموسم: {systemSettings?.activeAcademicSeason || ""}</div>
                </div>

                {/* Badge Body */}
                <div className="p-4 space-y-3">
                  {/* Photo & Role */}
                  <div className="flex items-center gap-3">
                    <div className="w-18 h-18 rounded-xl overflow-hidden border-2 border-primary-700 bg-sand-50 shrink-0 flex items-center justify-center shadow-xs">
                      {badgeStaff.photo ? (
                        <img src={badgeStaff.photo} alt={badgeStaff.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{STAFF_CATEGORIES_CONFIG[badgeStaff.category || "أستاذ / محفظ"]?.icon || "👤"}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sand-900 text-sm">{badgeStaff.fullName}</div>
                      <div className="text-xs font-bold text-primary-800 mt-0.5">{badgeStaff.roleTitle || badgeStaff.specialty}</div>
                      <span className="inline-block text-[9px] font-bold bg-sand-100 text-sand-700 px-2 py-0.5 rounded mt-1">
                        {badgeStaff.category || "أستاذ / محفظ"}
                      </span>
                    </div>
                  </div>

                  {/* Badge Details Grid */}
                  <div className="bg-sand-50 p-2.5 rounded-xl border border-sand-200 text-[10px] space-y-1.5 font-mono">
                    {badgeStaff.cinNumber && (
                      <div className="flex justify-between">
                        <span className="text-sand-500 font-sans">رقم البطاقة (CIN):</span>
                        <span className="font-bold text-sand-900">{badgeStaff.cinNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sand-500 font-sans">رقم الهاتف:</span>
                      <span className="font-bold text-sand-900">{badgeStaff.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand-500 font-sans">نوع التعاقد:</span>
                      <span className="font-bold text-sand-900 font-sans">{badgeStaff.contractType || "مكافأة شهرية"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand-500 font-sans">تاريخ الالتحاق:</span>
                      <span className="font-bold text-sand-900">{badgeStaff.joinedDate}</span>
                    </div>
                  </div>

                  {/* QR Code & Signature Seal */}
                  <div className="flex items-center justify-between pt-1 border-t border-sand-200">
                    <div className="text-[9px] text-sand-500 space-y-0.5">
                      <p className="font-bold text-sand-700 font-sans">ختم وتوقيع الإدارة</p>
                      <p className="font-sans text-[8px]">صالحة للموسم الحالي</p>
                    </div>

                    <div className="w-14 h-14 bg-white p-1 rounded-lg border border-sand-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`STAFF:${badgeStaff.id}:${badgeStaff.fullName}:${badgeStaff.category || "Staff"}`)}`}
                        alt="QR Code"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Badge Bottom Stripe */}
                <div className="bg-sand-900 text-white text-[8px] py-1 text-center font-mono">
                  ID: {badgeStaff.id} • {systemSettings?.associationPhone || "06.74.633.108"}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-sand-200 flex justify-between gap-3">
              <button
                onClick={() => setShowBadgeModal(false)}
                className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-primary-800 hover:bg-primary-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الشارة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
