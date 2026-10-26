/**
 * Fenêtre modale de la charte : voile bleu nuit, panneau surface rayon 22 px,
 * en-tête Reem Kufi, pied d'actions. Échap ferme (si `onClose`), le focus est
 * placé dans la fenêtre à l'ouverture, piégé dans la fenêtre (Tab / Maj+Tab
 * bouclent) puis rendu à l'élément d'origine.
 * Les classes `fixed inset-0` sont conservées : la feuille d'impression s'en sert.
 * Options rétrocompatibles (D98) : `size="base"` (max-w-lg), `printHidden` (fenêtre
 * de saisie absente de l'impression), `print` (aperçu d'un document : en-tête et pied
 * masqués à l'impression, corps sans défilement), `flush` (corps sans marge),
 * `footerAlign="between"`.
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
  /** `base` : entre `sm` et `md` (max-w-lg). */
  size?: "sm" | "base" | "md" | "lg" | "xl";
  modalId?: string;
  className?: string;
  bodyClassName?: string;
  headerExtra?: React.ReactNode;
  tone?: "default" | "night";
  /** Fenêtre de saisie : masquée à l'impression de la page (les aperçus d'impression ne l'activent pas). */
  printHidden?: boolean;
  /** Aperçu d'un document à imprimer : seul le corps est imprimé (en-tête et pied masqués, sans défilement ni marge). */
  print?: boolean;
  /** Corps sans marge intérieure (le contenu gère la sienne, ex. feuille d'un document). */
  flush?: boolean;
  /** `between` : actions réparties aux deux bords (fermer / action principale). Par défaut, groupées en fin de ligne. */
  footerAlign?: "end" | "between";
  /** Si fourni, le corps et le pied forment un <form> (boutons type=submit dans le pied). */
  onSubmit?: (e: any) => void;
}

const SIZES = { sm: "max-w-md", base: "max-w-lg", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

/** Éléments atteignables au clavier dans la fenêtre (hors masqués et désactivés). */
const FOCUSABLE = "a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
const focusablesOf = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest("[hidden]") && el.getClientRects().length > 0);

export function Modal({ title, subtitle, icon, onClose, children, footer, size = "md", modalId, className, bodyClassName, headerExtra, tone = "default", onSubmit, printHidden, print, flush, footerAlign = "end" }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // `data-autofocus` : élément à focaliser en premier (ex. « إلغاء » d'une confirmation destructive).
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]:not([disabled])") || panel.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]):not([tabindex='-1']), select, textarea, button:not([data-modal-close])");
    (first || panel.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        // Fenêtres empilées (ex. confirmation au-dessus d'un formulaire) : seule la plus haute répond.
        const stack = document.querySelectorAll("[data-modal-panel]");
        if (stack.length > 0 && stack[stack.length - 1] !== panel.current) return;
        e.stopPropagation();
        onClose();
        return;
      }
      // Piège du focus : Tab sur le dernier élément revient au premier, Maj+Tab sur le premier va au dernier.
      // Seulement quand le focus est dans cette fenêtre (une liste déroulante en portail gère son propre clavier).
      const box = panel.current;
      if (e.key !== "Tab" || !box || !box.contains(document.activeElement)) return;
      const items = focusablesOf(box);
      if (items.length === 0) {
        e.preventDefault();
        box.focus({ preventScroll: true });
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === box)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
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
    <div data-modal={modalId} className={cx("fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-night/55 backdrop-blur-[2px] overflow-y-auto", printHidden && "print:hidden")} dir="rtl">
      <div
        ref={panel}
        data-modal-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx("w-full my-6 bg-surface border border-line rounded-3xl shadow-pop flex flex-col max-h-[calc(100dvh-3rem)] focus:outline-none", SIZES[size], className)}
      >
        <div className={cx("flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b shrink-0", print && "print:hidden", tone === "night" ? "bg-night text-night-text border-night-line rounded-t-3xl" : "border-line-soft")}>
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
            <div className={cx("overflow-y-auto flex-1 min-h-0", flush ? "p-0" : "px-5 sm:px-6 py-5", print && "print:p-0 print:overflow-visible", bodyClassName)}>{children}</div>
            {footer && <div className={cx("px-5 sm:px-6 py-4 border-t border-line-soft flex flex-wrap items-center gap-2.5 shrink-0", print && "print:hidden", footerAlign === "between" ? "justify-between" : "justify-end")}>{footer}</div>}
          </form>
        ) : (
          <>
            <div className={cx("overflow-y-auto flex-1 min-h-0", flush ? "p-0" : "px-5 sm:px-6 py-5", print && "print:p-0 print:overflow-visible", bodyClassName)}>{children}</div>
            {footer && <div className={cx("px-5 sm:px-6 py-4 border-t border-line-soft flex flex-wrap items-center gap-2.5 shrink-0", print && "print:hidden", footerAlign === "between" ? "justify-between" : "justify-end")}>{footer}</div>}
          </>
        )}
      </div>
    </div>
  );
}
