/** Petits éléments partagés : texte LTR (dates, téléphones), icône WhatsApp, menu déroulant. */
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

/** Isole un fragment de gauche à droite (date ISO, téléphone, identifiant) dans un texte RTL. */
export function Ltr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <bdi dir="ltr" className={cx("tabular-nums", className)}>{children}</bdi>;
}

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.292 1.503 4.933 1.505 5.424.004 9.835-4.394 9.839-9.82.002-2.628-1.02-5.1-2.88-6.962C16.621 1.955 14.153.931 11.53.927c-5.432 0-9.843 4.403-9.847 9.827-.001 1.761.478 3.48 1.385 5.016l-.99 3.616 3.73-.976zm12.115-4.43c-.329-.165-1.947-.961-2.246-1.07-.3-.109-.518-.164-.736.164-.218.328-.844 1.07-1.034 1.289-.19.219-.38.246-.709.08-1.353-.678-2.3-1.176-3.21-2.735-.24-.411.24-.381.688-1.277.075-.15.038-.282-.019-.395-.056-.113-.518-1.249-.71-1.711-.186-.447-.373-.387-.518-.394l-.442-.008c-.15 0-.395.056-.601.282-.206.226-.785.767-.785 1.87 0 1.104.8 2.167.912 2.318.112.15 1.573 2.4 3.812 3.367.532.23 1.053.391 1.411.474.56.126 1.07.108 1.473.048.45-.067 1.473-.601 1.68-1.182.206-.581.206-1.08.145-1.183-.06-.103-.218-.164-.547-.329z" />
    </svg>
  );
}

export interface MenuItem {
  label: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  id?: string;
}

/** Menu déroulant accessible au clavier (bouton + liste), fermé par Échap ou clic extérieur. */
export function DropdownMenu({ label, icon, items, buttonId, menuId, align = "end" }: { label: React.ReactNode; icon?: React.ReactNode; items: MenuItem[]; buttonId?: string; menuId?: string; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={buttonId}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-[10px] border border-line-strong bg-surface text-ink text-body font-semibold cursor-pointer hover:bg-surface-2"
      >
        {icon && <span aria-hidden="true" className="inline-flex">{icon}</span>}
        {label}
        <ChevronDown className={cx("w-4 h-4 transition-transform", open && "rotate-180")} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="menu" className={cx("absolute top-full mt-1.5 z-40 min-w-[220px] bg-surface border border-line rounded-xl shadow-pop overflow-hidden py-1", align === "end" ? "end-0" : "start-0")}>
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              id={it.id}
              onClick={() => { setOpen(false); it.onClick(); }}
              className="w-full flex items-center gap-2.5 min-h-11 px-4 text-start text-body text-ink bg-transparent border-0 cursor-pointer hover:bg-surface-2"
            >
              {it.icon && <span aria-hidden="true" className="inline-flex text-ink-3">{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ligne libellé / valeur d'une fiche. */
export function InfoRow({ label, children, strong }: { label: React.ReactNode; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-2 border-b border-line-faint last:border-b-0">
      <dt className="text-small text-ink-2 shrink-0">{label}</dt>
      <dd className={cx("m-0 text-body text-end min-w-0 break-words", strong ? "font-bold text-primary" : "font-semibold text-ink")}>{children}</dd>
    </div>
  );
}
