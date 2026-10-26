/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { X, Printer, FileText } from "lucide-react";
import { useStaff } from "./StaffContext";

export default function StaffDirectoryModal() {
  const {
    systemSettings,
    showDirectoryModal,
    setShowDirectoryModal,
    allStaff,
  } = useStaff();

  return (
    <>
      {/* PRINT OFFICIAL STAFF DIRECTORY ROSTER MODAL */}
      {showDirectoryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto bg-night/55 backdrop-blur-[2px]">
          <div className="bg-surface w-full max-w-4xl overflow-hidden my-6 flex flex-col rounded-3xl border border-line shadow-pop" dir="rtl">
            <div className="p-4 bg-night text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-400" />
                <span className="font-bold text-sm">لائحة الطاقم الإداري والتربوي والعاملين بالجمعية</span>
              </div>
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="text-ink-3 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Official Document Header */}
              <div className="text-center pb-4 border-b border-line space-y-1">
                <div className="text-[13px] text-ink-3">{systemSettings?.associationName || ""}</div>
                <h3 className="text-lg font-bold text-primary">سجل وحصر شؤون العاملين والأطر</h3>
                <p className="text-[13px] text-ink-3">الموسم الدراسي: {systemSettings?.activeAcademicSeason || ""}</p>
              </div>

              {/* Table */}
              <table className="w-full text-right text-[13px] border border-line">
                <thead className="bg-sand-100 border-b border-line text-ink font-bold">
                  <tr>
                    <th className="p-2 border-l border-line">#</th>
                    <th className="p-2 border-l border-line">الاسم الكامل</th>
                    <th className="p-2 border-l border-line">الفئة</th>
                    <th className="p-2 border-l border-line">المسمى والمهام</th>
                    <th className="p-2 border-l border-line">CIN</th>
                    <th className="p-2 border-l border-line">الهاتف</th>
                    <th className="p-2 border-l border-line">نوع العقد</th>
                    <th className="p-2">المكافأة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {allStaff.filter(t => !t.isArchived).map((staff, idx) => (
                    <tr key={staff.id} className="hover:bg-sand-50">
                      <td className="p-2 font-mono text-center border-l border-line">{idx + 1}</td>
                      <td className="p-2 font-bold text-ink border-l border-line">{staff.fullName}</td>
                      <td className="p-2 border-l border-line">{staff.category || "أستاذ / محفظ"}</td>
                      <td className="p-2 border-l border-line">{staff.roleTitle || staff.specialty}</td>
                      <td className="p-2 font-mono border-l border-line">{staff.cinNumber || "-"}</td>
                      <td className="p-2 font-mono border-l border-line">{staff.phone}</td>
                      <td className="p-2 border-l border-line">{staff.contractType || "مكافأة شهرية"}</td>
                      <td className="p-2 font-mono font-bold text-primary-800">
                        {staff.monthlySalary ? `${staff.monthlySalary} د.م` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-line text-center text-[13px]">
                <div>
                  <p className="font-bold text-ink-2">توقيع الكاتب العام</p>
                  <p className="text-[11.5px] text-ink-3 mt-8">{systemSettings?.secretaryGeneralName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-ink-2">أمين المال</p>
                  <p className="text-[11.5px] text-ink-3 mt-8">{systemSettings?.treasurerName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-ink-2">رئيس الجمعية</p>
                  <p className="text-[11.5px] text-ink-3 mt-8">{systemSettings?.presidentName || "........................"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-sand-50 border-t border-line flex justify-between gap-3">
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-ink-2 font-bold rounded-xl text-[13px]"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-55 gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوثيقة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
