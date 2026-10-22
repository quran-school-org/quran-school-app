/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { Building, Shield } from "lucide-react";
import { useSettings } from "./SettingsContext";

export default function SettingsTabs() {
  const {
    subTab,
    setSubTab,
  } = useSettings();

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex border-b border-line">
        <button
          data-subtab="general"
          onClick={() => setSubTab("general")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            subTab === "general"
              ? "border-primary-600 text-primary-800"
              : "border-transparent text-ink-3 hover:text-ink"
          }`}
          id="btn-subtab-general"
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>إعدادات الجمعية والمدرسة</span>
          </div>
        </button>
        <button
          data-subtab="users"
          onClick={() => setSubTab("users")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            subTab === "users"
              ? "border-primary-600 text-primary-800"
              : "border-transparent text-ink-3 hover:text-ink"
          }`}
          id="btn-subtab-users"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>إدارة المستخدمين والصلاحيات</span>
          </div>
        </button>
      </div>
    </>
  );
}
