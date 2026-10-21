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
        <div className="fixed inset-0 bg-sand-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col" dir="rtl">
            <div className="p-4 bg-sand-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-400" />
                <span className="font-bold text-sm">لائحة الطاقم الإداري والتربوي والعاملين بالجمعية</span>
              </div>
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="text-sand-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Official Document Header */}
              <div className="text-center pb-4 border-b border-sand-200 space-y-1">
                <div className="text-xs text-sand-500">{systemSettings?.associationName || ""}</div>
                <h3 className="text-lg font-black text-sand-900">سجل وحصر شؤون العاملين والأطر</h3>
                <p className="text-xs text-sand-500">الموسم الدراسي: {systemSettings?.activeAcademicSeason || ""}</p>
              </div>

              {/* Table */}
              <table className="w-full text-right text-xs border border-sand-200">
                <thead className="bg-sand-100 border-b border-sand-200 text-sand-800 font-bold">
                  <tr>
                    <th className="p-2 border-l border-sand-200">#</th>
                    <th className="p-2 border-l border-sand-200">الاسم الكامل</th>
                    <th className="p-2 border-l border-sand-200">الفئة</th>
                    <th className="p-2 border-l border-sand-200">المسمى والمهام</th>
                    <th className="p-2 border-l border-sand-200">CIN</th>
                    <th className="p-2 border-l border-sand-200">الهاتف</th>
                    <th className="p-2 border-l border-sand-200">نوع العقد</th>
                    <th className="p-2">المكافأة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {allStaff.filter(t => !t.isArchived).map((staff, idx) => (
                    <tr key={staff.id} className="hover:bg-sand-50">
                      <td className="p-2 font-mono text-center border-l border-sand-200">{idx + 1}</td>
                      <td className="p-2 font-bold text-sand-900 border-l border-sand-200">{staff.fullName}</td>
                      <td className="p-2 border-l border-sand-200">{staff.category || "أستاذ / محفظ"}</td>
                      <td className="p-2 border-l border-sand-200">{staff.roleTitle || staff.specialty}</td>
                      <td className="p-2 font-mono border-l border-sand-200">{staff.cinNumber || "-"}</td>
                      <td className="p-2 font-mono border-l border-sand-200">{staff.phone}</td>
                      <td className="p-2 border-l border-sand-200">{staff.contractType || "مكافأة شهرية"}</td>
                      <td className="p-2 font-mono font-bold text-primary-800">
                        {staff.monthlySalary ? `${staff.monthlySalary} د.م` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-sand-200 text-center text-xs">
                <div>
                  <p className="font-bold text-sand-700">توقيع الكاتب العام</p>
                  <p className="text-[10px] text-sand-500 mt-8">{systemSettings?.secretaryGeneralName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-sand-700">أمين المال</p>
                  <p className="text-[10px] text-sand-500 mt-8">{systemSettings?.treasurerName || "........................"}</p>
                </div>
                <div>
                  <p className="font-bold text-sand-700">رئيس الجمعية</p>
                  <p className="text-[10px] text-sand-500 mt-8">{systemSettings?.presidentName || "........................"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-sand-50 border-t border-sand-200 flex justify-between gap-3">
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-sand-700 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-primary-800 hover:bg-primary-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
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
