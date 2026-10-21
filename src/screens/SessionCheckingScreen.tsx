/**
 * Extrait tel quel d'App.tsx (Lot 2, sans changement de comportement).
 */
import { RefreshCw } from "lucide-react";

export default function SessionCheckingScreen() {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4" dir="rtl">
      <div className="flex items-center gap-2 text-sm font-bold text-sand-500">
        <RefreshCw className="w-4 h-4 animate-spin text-primary-600" />
        <span>جاري التحقق من الجلسة...</span>
      </div>
    </div>
  );
}
