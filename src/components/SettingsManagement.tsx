/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * État et logique : settings/useSettingsState ; sections : settings/.
 */
import type React from "react";
import { SystemSettings, AppUser, Teacher, Student } from "../types";
import { useSettingsState } from "./settings/useSettingsState";
import { SettingsContext } from "./settings/SettingsContext";
import SettingsTabs from "./settings/SettingsTabs";
import GeneralSettingsSection from "./settings/GeneralSettingsSection";
import UsersSection from "./settings/UsersSection";
import UserFormModal from "./settings/UserFormModal";
import BackupSection from "./settings/BackupSection";
import { PageHeader } from "../ui";

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
  /** Sauvegarde et restauration de la base (section « النسخ الاحتياطي ») : absentes, la section n'est pas affichée. */
  onBackup?: () => void;
  onRestore?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SettingsManagement(props: SettingsManagementProps) {
  const state = useSettingsState(props);
  return (
    <SettingsContext.Provider value={state}>
    <div data-screen="settings" className="flex flex-col gap-6" id="settings-management-panel">
      <PageHeader title="الإعدادات والمستخدمون" description="بيانات الجمعية والمطبوعات الرسمية، وحسابات المستخدمين وصلاحياتهم." />
      <SettingsTabs />

      <GeneralSettingsSection />

      {props.onBackup && props.onRestore && <BackupSection onBackup={props.onBackup} onRestore={props.onRestore} />}

      <UsersSection />

      <UserFormModal />
    </div>
    </SettingsContext.Provider>
  );
}
