/**
 * Fenêtre modale de la charte : voile bleu nuit, panneau surface rayon 22 px,
 * en-tête Reem Kufi, pied d'actions. Échap ferme (si `onClose`), le focus est
 * placé dans la fenêtre à l'ouverture puis rendu à l'élément d'origine.
 * Les classes `fixed inset-0` sont conservées : la feuille d'impression s'en sert.
 */
import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";

export interface ModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  modalId?: string;
  className?: string;
  bodyClassName?: string;
  headerExtra?: React.ReactNode;
  tone?: "default" | "night";
  /** Si fourni, le corps et le pied forment un <form> (boutons type=submit dans le pied). */
  onSubmit?: (e: any) => void;
}

const SIZES = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

export function Modal({ title, subtitle, icon, onClose, children, footer, size = "md", modalId, className, bodyClassName, headerExtra, tone = "default", onSubmit }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]):not([tabindex='-1']), select, textarea, button:not([data-modal-close])");
    (first || panel.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div data-modal={modalId} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-night/55 backdrop-blur-[2px] overflow-y-auto" dir="rtl">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx("w-full my-6 bg-surface border border-line rounded-3xl shadow-pop flex flex-col max-h-[calc(100dvh-3rem)] focus:outline-none", SIZES[size], className)}
      >
        <div className={cx("flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b shrink-0", tone === "night" ? "bg-night text-night-text border-night-line rounded-t-3xl" : "border-line-soft")}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && <span aria-hidden="true" className={cx("inline-flex shrink-0", tone === "night" ? "text-gold" : "text-gold-700")}>{icon}</span>}
            <div className="min-w-0">
              <h2 id={titleId} className={cx("m-0 font-sans font-semibold text-[20px] sm:text-[22px] leading-snug", tone === "night" ? "text-gold-100" : "text-primary")}>{title}</h2>
              {subtitle && <p className={cx("m-0 mt-0.5 text-[13.5px]", tone === "night" ? "text-night-muted" : "text-ink-2")}>{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerExtra}
            {onClose && (
              <button
                type="button"
                data-modal-close
                onClick={onClose}
                aria-label="إغلاق"
                title="إغلاق"
                className={cx("w-10 h-10 inline-flex items-center justify-center rounded-xl border cursor-pointer transition-colors", tone === "night" ? "border-night-line text-night-text hover:bg-white/10" : "border-line bg-white text-ink-2 hover:border-primary hover:text-primary")}
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            <div className={cx("px-5 sm:px-6 py-5 overflow-y-auto flex-1 min-h-0", bodyClassName)}>{children}</div>
            {footer && <div className="px-5 sm:px-6 py-4 border-t border-line-soft flex flex-wrap items-center justify-end gap-2.5 shrink-0">{footer}</div>}
          </form>
        ) : (
          <>
            <div className={cx("px-5 sm:px-6 py-5 overflow-y-auto flex-1 min-h-0", bodyClassName)}>{children}</div>
            {footer && <div className="px-5 sm:px-6 py-4 border-t border-line-soft flex flex-wrap items-center justify-end gap-2.5 shrink-0">{footer}</div>}
          </>
        )}
      </div>
    </div>
  );
}
