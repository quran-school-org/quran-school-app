/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 * Fenêtre sur `Modal` de la charte (D98) : Échap, `role="dialog"`, focus piégé et rendu.
 */
import { Printer, FileText } from "lucide-react";
import { useStaff } from "./StaffContext";
import { Button, Modal } from "../../ui";

export default function StaffDirectoryModal() {
  const {
    systemSettings,
    showDirectoryModal,
    setShowDirectoryModal,
    allStaff,
  } = useStaff();

  if (!showDirectoryModal) return null;
  const close = () => setShowDirectoryModal(false);

  return (
    <Modal
      modalId="staff-directory"
      size="lg"
      tone="night"
      icon={<FileText className="w-4 h-4" />}
      title="لائحة الطاقم الإداري والتربوي والعاملين بالجمعية"
      onClose={close}
      bodyClassName="space-y-6"
      footerAlign="between"
      footer={
        <>
          <Button onClick={close}>إغلاق</Button>
          <Button variant="primary" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>طباعة الوثيقة</Button>
        </>
      }
    >
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
    </Modal>
  );
}
