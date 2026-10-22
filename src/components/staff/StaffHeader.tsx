/**
 * En-tête du module du personnel (charte « لوحة الكتّاب »).
 */
import { StaffCategory } from "../../types";
import { UserPlus, Printer } from "lucide-react";
import { Button, PageHeader } from "../../ui";
import { useStaff } from "./StaffContext";

export default function StaffHeader() {
  const { categoryFilter, setShowDirectoryModal, canCreate, handleOpenForm } = useStaff();
  return (
    <PageHeader
      title="العاملون والمدرّسون"
      description="سجل شامل لتسيير المحفظين، الأطر الإدارية، المشرفين والمؤطرين، عمال النظافة والصيانة، والمتطوعين مع بطاقات العمل."
      actions={
        <>
          <Button onClick={() => setShowDirectoryModal(true)} title="طباعة الدليل الكامل للعاملين" icon={<Printer className="w-[18px] h-[18px]" strokeWidth={1.75} />}>
            طباعة لائحة الطاقم
          </Button>
          {canCreate && (
            <Button
              variant="primary"
              data-action="open-staff-form"
              onClick={() => handleOpenForm(undefined, categoryFilter !== "all" ? (categoryFilter as StaffCategory) : undefined)}
              icon={<UserPlus className="w-[18px] h-[18px]" strokeWidth={1.75} />}
            >
              إضافة كادر / عامل جديد
            </Button>
          )}
        </>
      }
    />
  );
}
