/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { StaffCategory } from "../../types";
import { UserPlus, Briefcase, Printer } from "lucide-react";
import { useStaff } from "./StaffContext";

export default function StaffHeader() {
  const {
    categoryFilter,
    setShowDirectoryModal,
    canCreate,
    handleOpenForm,
  } = useStaff();

  return (
    <>
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              إدارة شؤون العاملين والمدرسين
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل شامل لتسيير المحفظين، الأطر الإدارية، المشرفين والمؤطرين، عمال النظافة والصيانة، والمتطوعين مع بطاقات العمل.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDirectoryModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="طباعة الدليل الكامل للعاملين"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة لائحة الطاقم</span>
          </button>

          {canCreate && (
            <button
              data-action="open-staff-form"
              onClick={() => handleOpenForm(undefined, categoryFilter !== "all" ? (categoryFilter as StaffCategory) : undefined)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة كادر / عامل جديد</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
