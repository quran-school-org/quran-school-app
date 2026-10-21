/** Message bref en bas de l'écran (maquette : fond #1A1F2B, coche dorée). */
import React from "react";
import { Check } from "lucide-react";

export function Toast({ message }: { message: string }) {
  return (
    <div aria-live="polite" className="fixed bottom-6 start-6 z-[60]">
      {message && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-ink text-white text-[14px] shadow-toast">
          <Check className="w-[18px] h-[18px] text-gold" strokeWidth={2} aria-hidden="true" />
          {message}
        </div>
      )}
    </div>
  );
}
