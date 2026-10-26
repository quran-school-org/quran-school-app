/**
 * Cadre de l'application : menu latéral (≥ 1024 px) ou tiroir (mobile), barre
 * du haut, zone principale (largeur max. 1240 px, marges 32 px / 16 px).
 */
import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface AppShellProps {
  sidebar: React.ReactNode;
  drawer: React.ReactNode;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  topbar: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppShell({ sidebar, drawer, drawerOpen, onCloseDrawer, topbar, banner, children, footer }: AppShellProps) {
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseDrawer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, onCloseDrawer]);

  return (
    <div data-app-shell dir="rtl" className="min-h-screen flex bg-app text-ink font-sans">
      <aside className="hidden lg:block w-[264px] shrink-0 bg-night print:hidden">
        {/* Barre de défilement fine et visible sur fond nuit : le menu dépasse la hauteur des petits écrans. */}
        <div className="sticky top-0 h-screen overflow-y-auto flex flex-col [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.28)_transparent]">{sidebar}</div>
      </aside>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden" role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
          <button type="button" aria-label="إغلاق القائمة" className="absolute inset-0 bg-night/60 border-0 cursor-default" onClick={onCloseDrawer} />
          <aside className="relative w-[300px] max-w-[85vw] h-full bg-night overflow-y-auto shadow-pop flex flex-col">
            <button type="button" onClick={onCloseDrawer} aria-label="إغلاق القائمة" className="absolute top-4 end-4 z-10 w-11 h-11 inline-flex items-center justify-center rounded-xl border border-night-line text-night-text bg-night hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            {drawer}
          </aside>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="print:hidden">{topbar}</div>
        {banner}
        <main className="w-full max-w-[1240px] box-border px-4 sm:px-8 pt-6 sm:pt-8 pb-16 flex flex-col gap-6 min-w-0">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
