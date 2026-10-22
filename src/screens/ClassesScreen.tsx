/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import ClassManagement from "../components/ClassManagement";
import { useApp } from "../app/AppContext";

export default function ClassesScreen() {
  const {
    students,
    teachers,
    classes,
    currentUser,
    setActiveTab,
    setSelectedStudent,
    currentRole,
    handleSaveClass,
    handleArchiveClassToggle,
    handleDeleteClass,
  } = useApp();

  return (
    <ClassManagement
      classes={classes}
      teachers={teachers}
      students={students}
      currentRole={currentRole}
      canEditTeachers={checkUserPermission(currentUser, currentRole, "classes", "update")}
      canCreateClasses={checkUserPermission(currentUser, currentRole, "classes", "create")}
      canUpdateClasses={checkUserPermission(currentUser, currentRole, "classes", "update")}
      canDeleteClasses={checkUserPermission(currentUser, currentRole, "classes", "delete")}
      onSaveClass={handleSaveClass}
      onArchiveToggle={handleArchiveClassToggle}
      onDeleteClass={handleDeleteClass}
      onSelectStudent={setSelectedStudent}
      onSwitchTab={setActiveTab}
    />
  );
}
