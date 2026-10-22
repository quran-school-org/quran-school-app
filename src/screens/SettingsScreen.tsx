/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { checkUserPermission } from "../types";
import { isDirectorRole } from "../security/access";
import SettingsManagement from "../components/SettingsManagement";
import { useApp } from "../app/AppContext";

export default function SettingsScreen() {
  const {
    students,
    teachers,
    systemSettings,
    appUsers,
    currentUser,
    setActiveTab,
    currentRole,
    handleSaveTeacher,
    handleSaveSystemSettings,
    handleSaveAppUser,
    handleCreateAppUser,
    handleResetUserPassword,
    handleDeleteAppUser,
    handleHarmonizeUsersWithStaff,
  } = useApp();

  return (
    <SettingsManagement
      settings={systemSettings}
      appUsers={appUsers}
      teachers={teachers}
      students={students}
      canManageAccounts={isDirectorRole(currentRole)}
      onCreateAppUser={handleCreateAppUser}
      onResetUserPassword={handleResetUserPassword}
      onSaveTeacher={handleSaveTeacher}
      onNavigateToStaff={() => setActiveTab("teachers")}
      canCreateSettings={checkUserPermission(currentUser, currentRole, "settings", "create")}
      canUpdateSettings={checkUserPermission(currentUser, currentRole, "settings", "update")}
      canDeleteSettings={checkUserPermission(currentUser, currentRole, "settings", "delete")}
      onSaveSettings={handleSaveSystemSettings}
      onSaveAppUser={handleSaveAppUser}
      onDeleteAppUser={handleDeleteAppUser}
      onHarmonizeUsers={handleHarmonizeUsersWithStaff}
    />
  );
}
