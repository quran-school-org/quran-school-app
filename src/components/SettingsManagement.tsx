/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * État et logique : settings/useSettingsState ; sections : settings/.
 */
import { SystemSettings, AppUser, Teacher, Student } from "../types";
import { useSettingsState } from "./settings/useSettingsState";
import { SettingsContext } from "./settings/SettingsContext";
import SettingsTabs from "./settings/SettingsTabs";
import GeneralSettingsSection from "./settings/GeneralSettingsSection";
import UsersSection from "./settings/UsersSection";
import UserFormModal from "./settings/UserFormModal";

export interface SettingsManagementProps {
  settings: SystemSettings;
  appUsers: AppUser[];
  teachers?: Teacher[];
  students?: Student[];
  /** Gestion des comptes (création, modification, réinitialisation) : directeur uniquement. */
  canManageAccounts?: boolean;
  canCreateSettings?: boolean;
  canUpdateSettings?: boolean;
  canDeleteSettings?: boolean;
  onSaveSettings: (settings: SystemSettings) => void;
  onSaveAppUser: (user: AppUser) => void | Promise<void>;
  onCreateAppUser?: (user: AppUser, password: string) => Promise<boolean>;
  onResetUserPassword?: (user: AppUser, newPassword: string) => Promise<boolean>;
  onDeleteAppUser: (userId: string) => void | Promise<void>;
  onSaveTeacher?: (teacher: Teacher, assignedClassIds?: string[]) => void;
  onNavigateToStaff?: () => void;
  onHarmonizeUsers?: () => void;
}

export default function SettingsManagement(props: SettingsManagementProps) {
  const state = useSettingsState(props);
  const {
    settings,
  } = state;
  return (
    <SettingsContext.Provider value={state}>
    <div data-screen="settings" className="space-y-6" id="settings-management-panel">
      <SettingsTabs />

      <GeneralSettingsSection />

      <UsersSection />

      <UserFormModal />
    </div>
    </SettingsContext.Provider>
  );
}
