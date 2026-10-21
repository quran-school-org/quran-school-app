/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { LogOut } from "lucide-react";
import { useApp } from "../app/AppContext";

export default function MobileAccountBar() {
  const {
    systemSettings,
    currentUser,
    currentRole,
    handleLogout,
  } = useApp();

  return (
    <div className="block md:hidden bg-zinc-900 text-white p-3 flex justify-between items-center px-4">
      <span className="text-xs text-zinc-300 font-bold">
        الحساب: {currentUser?.fullName || (currentRole === "مدير" ? systemSettings?.directorName : "") || "المستخدم"}
      </span>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => handleLogout()}
          className="p-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1"
        >
          <LogOut className="w-3 h-3" />
          <span>خروج</span>
        </button>
      </div>
    </div>
  );
}
