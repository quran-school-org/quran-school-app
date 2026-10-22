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
      <div role="tablist" aria-label="أقسام الإعدادات" className="flex flex-wrap border-b border-line">
        <button
          data-subtab="general"
          onClick={() => setSubTab("general")}
          role="tab"
          aria-selected={subTab === "general"}
          className={`min-h-11 px-5 text-[14.5px] font-semibold border-0 border-b-2 bg-transparent cursor-pointer transition-colors ${
            subTab === "general" ? "border-gold text-primary" : "border-transparent text-ink-2 hover:text-ink"
          }`}
          id="btn-subtab-general"
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>إعدادات الجمعية والمدرسة</span>
          </div>
        </button>
        <button
          data-subtab="users"
          onClick={() => setSubTab("users")}
          role="tab"
          aria-selected={subTab === "users"}
          className={`min-h-11 px-5 text-[14.5px] font-semibold border-0 border-b-2 bg-transparent cursor-pointer transition-colors ${
            subTab === "users" ? "border-gold text-primary" : "border-transparent text-ink-2 hover:text-ink"
          }`}
          id="btn-subtab-users"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>إدارة المستخدمين والصلاحيات</span>
          </div>
        </button>
      </div>
    </>
  );
}
