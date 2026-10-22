/**
 * Attente de la vérification de session (charte « لوحة الكتّاب »).
 */
import React from "react";
import { RefreshCw } from "lucide-react";
import { Emblem } from "../ui";

export default function SessionCheckingScreen() {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-4 p-4" dir="rtl" role="status" aria-live="polite">
      <Emblem size={56} />
      <div className="flex items-center gap-2 text-[15px] font-semibold text-ink-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" strokeWidth={1.75} aria-hidden="true" />
        <span>جاري التحقق من الجلسة...</span>
      </div>
    </div>
  );
}
