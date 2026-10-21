/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import TeacherManagement from "../components/TeacherManagement";
import { useApp } from "../app/AppContext";

export default function TeachersScreen() {
  const {
    teachers,
    classes,
    systemSettings,
    currentUser,
    currentRole,
    handleSaveTeacher,
    handleArchiveTeacherToggle,
    handleDeleteTeacher,
  } = useApp();

  return (
    <TeacherManagement
      teachers={teachers}
      classes={classes}
      currentRole={currentRole}
      systemSettings={systemSettings}
      canEditTeachers={checkUserPermission(currentUser, currentRole, "teachers", "update")}
      canCreateTeachers={checkUserPermission(currentUser, currentRole, "teachers", "create")}
      canUpdateTeachers={checkUserPermission(currentUser, currentRole, "teachers", "update")}
      canDeleteTeachers={checkUserPermission(currentUser, currentRole, "teachers", "delete")}
      onSaveTeacher={handleSaveTeacher}
      onArchiveToggle={handleArchiveTeacherToggle}
      onDeleteTeacher={handleDeleteTeacher}
    />
  );
}
