/**
 * Menu « ⋯ » d'une ligne ou d'une carte (UI-18, D92) : actions secondaires derrière un bouton
 * de 44 px, l'action principale restant visible à côté.
 *
 * - Accessibilité (motif « menu button » de l'APG) : bouton `aria-haspopup="menu"` /
 *   `aria-expanded`, liste `role="menu"` d'éléments `menuitem`, ↑ ↓ Début Fin, Échap
 *   (focus rendu au bouton), Tab ferme, clic extérieur ferme.
 * - Menu dans un portail (`position: fixed`) : jamais rogné par une carte `overflow-hidden`,
 *   retourné vers le haut s'il manque de place, aligné sur le bord du bouton (RTL / LTR).
 * - Couleurs : jetons du thème actif uniquement.
 */
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cx } from "./cx";
import { readDirection } from "./useDirection";

export interface ActionMenuItem {
  label: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  /** `danger` : action destructive, couleur d'alerte du thème. */
  tone?: "default" | "danger";
  /** Repère de test (`data-action`). */
  action?: string;
  disabled?: boolean;
}

const MARGIN = 8;
const GAP = 4;

export function ActionMenu({ label, items, className, "data-menu": dataMenu }: { label: string; items: ActionMenuItem[]; className?: string; "data-menu"?: string }) {
  const uid = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);

  const usable = items.map((it) => !it.disabled);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const place = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t || !m) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) {
      close(false);
      return;
    }
    m.style.left = "0px";
    m.style.top = "0px";
    const w = m.offsetWidth;
    const h = m.offsetHeight;
    const below = vh - r.bottom - GAP - MARGIN;
    const down = below >= h || below >= r.top - GAP - MARGIN;
    m.style.top = `${Math.max(MARGIN, down ? r.bottom + GAP : r.top - GAP - h)}px`;
    const rtl = readDirection(t) === "rtl";
    const left = rtl ? r.left : r.right - w; // bord du bouton, côté « fin » de ligne
    m.style.left = `${Math.max(MARGIN, Math.min(left, vw - MARGIN - w))}px`;
  }, [close]);

  useLayoutEffect(() => {
    if (open) place();
  });

  useEffect(() => {
    if (!open) return;
    const first = usable.indexOf(true);
    itemEls.current[first]?.focus({ preventScroll: true });
    const inside = (n: EventTarget | null) => n instanceof Node && (!!triggerRef.current?.contains(n) || !!menuRef.current?.contains(n));
    const onPointer = (e: PointerEvent) => { if (!inside(e.target)) close(false); };
    const onScroll = (e: Event) => { if (!(e.target instanceof Node && menuRef.current?.contains(e.target))) place(); };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const move = (from: number, step: number) => {
    const n = items.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + step * k) % n) + n) % n;
      if (usable[i]) return i;
    }
    return from;
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const current = itemEls.current.findIndex((el) => el === document.activeElement);
    let next = -1;
    if (e.key === "ArrowDown") next = move(current, 1);
    else if (e.key === "ArrowUp") next = move(current < 0 ? 0 : current, -1);
    else if (e.key === "Home") next = usable.indexOf(true);
    else if (e.key === "End") next = usable.lastIndexOf(true);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // une fenêtre éventuelle ne se ferme pas avec le menu
      close(true);
      return;
    } else if (e.key === "Tab") {
      close(false);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      itemEls.current[next]?.focus({ preventScroll: true });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${uid}-menu` : undefined}
        aria-label={label}
        title={label}
        data-menu={dataMenu}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          "inline-flex items-center justify-center w-11 h-11 rounded-xl border border-line bg-surface text-ink-2 cursor-pointer shrink-0 transition-colors hover:border-primary hover:text-primary",
          open && "border-gold ring-2 ring-gold/25",
          className,
        )}
      >
        <MoreHorizontal className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={`${uid}-menu`}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            className="fixed z-[60] min-w-[200px] max-w-[calc(100vw-16px)] bg-surface border border-line rounded-xl shadow-pop py-1 text-ink font-sans"
            style={{ top: 0, left: 0 }}
          >
            {items.map((it, i) => (
              <button
                key={i}
                ref={(el) => { itemEls.current[i] = el; }}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                data-action={it.action}
                onClick={() => { close(true); it.onClick(); }}
                className={cx(
                  "w-full flex items-center gap-2.5 min-h-11 px-4 text-start text-body bg-transparent border-0 cursor-pointer hover:bg-surface-2 focus-visible:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed",
                  it.tone === "danger" ? "text-danger" : "text-ink",
                )}
              >
                {it.icon && <span aria-hidden="true" className={cx("inline-flex", it.tone === "danger" ? "text-danger" : "text-ink-3")}>{it.icon}</span>}
                {it.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
