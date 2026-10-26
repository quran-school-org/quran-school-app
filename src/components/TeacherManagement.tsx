/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * État et logique : staff/useStaffState ; sections : staff/.
 */
import { Teacher, Class, SystemSettings } from "../types";
import { useStaffState } from "./staff/useStaffState";
import { StaffContext } from "./staff/StaffContext";
export { STAFF_CATEGORIES_CONFIG } from "./staff/shared";
import StaffHeader from "./staff/StaffHeader";
import StaffCategoryTabs from "./staff/StaffCategoryTabs";
import StaffFilterBar from "./staff/StaffFilterBar";
import StaffList from "./staff/StaffList";
import StaffFormModal from "./staff/StaffFormModal";
import StaffBadgeModal from "./staff/StaffBadgeModal";
import StaffDirectoryModal from "./staff/StaffDirectoryModal";

export interface TeacherManagementProps {
  teachers: Teacher[];
  classes: Class[];
  currentRole: string;
  systemSettings?: SystemSettings | null;
  canEditTeachers?: boolean;
  canCreateTeachers?: boolean;
  canUpdateTeachers?: boolean;
  canDeleteTeachers?: boolean;
  onSaveTeacher: (teacher: Teacher, assignedClassIds?: string[]) => void;
  onArchiveToggle: (teacherId: string) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export default function TeacherManagement(props: TeacherManagementProps) {
  const state = useStaffState(props);
  return (
    <StaffContext.Provider value={state}>
    <div data-screen="teachers" className="space-y-6" dir="rtl">
      <StaffHeader />

      <StaffCategoryTabs />

      <StaffFilterBar />

      <StaffList />

      <StaffFormModal />

      <StaffBadgeModal />

      <StaffDirectoryModal />
    </div>
    </StaffContext.Provider>
  );
}
