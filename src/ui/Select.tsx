/**
 * Liste déroulante de la charte « لوحة الكتّاب » (remplace les <select> natifs, D83).
 *
 * - API proche de <select> : `value`, `onChange(value)`, `options` OU des
 *   enfants <option value="…">libellé</option> (lus, jamais rendus), `placeholder`,
 *   `disabled`, `required`, `id` (pour le <label> d'un FormField) et `name`.
 *   Les VALEURS ne sont jamais transformées (rôles en arabe, identifiants…).
 * - Accessibilité (motif « combobox à liste » de l'APG) : bouton `combobox`,
 *   liste `listbox` / `option`, `aria-activedescendant` ; clavier ↑ ↓ Début Fin
 *   Page↑ Page↓ Entrée Espace Échap Tab, saisie de la première lettre.
 * - Menu dans un portail (`position: fixed`) : au-dessus du contenu, fenêtres
 *   comprises ; jamais hors de l'écran ; retourné vers le haut s'il manque de
 *   place ; fermé au clic extérieur. Aligné sur le début de ligne (RTL / LTR).
 * - Champ de recherche intégré au-delà de SEARCH_THRESHOLD options.
 * - Traduction de test FR (D79) : les libellés sont des nœuds texte (traduits
 *   par la couche), les valeurs sont gardées par React et en `data-value`
 *   (attribut jamais traduit). Recherche et saisie de lettre lisent le texte
 *   AFFICHÉ (traduit ou non) et le libellé d'origine.
 */
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cx } from "./cx";
import { fieldClass } from "./Form";
import { readDirection } from "./useDirection";
import { foldForSearch } from "./textSearch";

export { foldForSearch };

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Au-delà de ce nombre d'options, un champ de recherche est proposé. */
export const SEARCH_THRESHOLD = 10;

type DataAttrs = { [key: `data-${string}`]: string | number | boolean | undefined };

export interface SelectProps extends DataAttrs {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  options?: SelectOption[];
  /** Compatibilité : <option value="…">libellé</option> (lus, non rendus). */
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  /** Classes de la racine (largeur, placement dans la grille…). `w-auto` : largeur de la plus longue option. */
  className?: string;
  /** Classes du bouton (variante visuelle ponctuelle). */
  triggerClassName?: string;
  size?: "md" | "sm";
  /** `bare` : sans bordure ni fond (le conteneur porte le cadre, ex. barre du haut). */
  variant?: "field" | "bare";
  /** Force (true) ou retire (false) la recherche ; par défaut au-delà de SEARCH_THRESHOLD options. */
  searchable?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

// ------------------------------------------------------------------ helpers purs

/** Texte brut d'un nœud React (libellé d'une <option>). */
export function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Options déclarées en enfants <option> (fragments et tableaux compris). */
export function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as { value?: unknown; children?: React.ReactNode; disabled?: boolean };
    if (child.type === React.Fragment) {
      out.push(...optionsFromChildren(props.children));
      return;
    }
    if (child.type !== "option") return;
    const label = clean(textOf(props.children));
    out.push({ value: props.value === undefined || props.value === null ? label : String(props.value), label, disabled: !!props.disabled });
  });
  return out;
}

/** Index de l'option suivante (sens `step`) qui est sélectionnable, ou `from` si aucune. */
export function stepIndex(usable: boolean[], from: number, step: number): number {
  const n = usable.length;
  if (!n) return -1;
  let i = from;
  for (let k = 0; k < n; k++) {
    i += step;
    if (i < 0 || i >= n) break;
    if (usable[i]) return i;
  }
  return usable[from] ? from : usable.indexOf(true);
}

/**
 * Saisie de lettres : première option, après `from`, dont l'un des textes
 * commence par `buffer` (une lettre répétée fait défiler les options qui
 * commencent par elle).
 */
export function typeaheadIndex(texts: string[][], usable: boolean[], buffer: string, from: number): number {
  const q = foldForSearch(buffer);
  if (!q) return -1;
  const repeated = q.length > 1 && [...q].every((c) => c === q[0]);
  const needle = repeated ? q[0] : q;
  const n = texts.length;
  const start = repeated || q.length === 1 ? from + 1 : from;
  for (let k = 0; k < n; k++) {
    const i = (((start + k) % n) + n) % n;
    if (usable[i] && texts[i].some((t) => foldForSearch(t).startsWith(needle))) return i;
  }
  return -1;
}

// ------------------------------------------------------------------ composant

const MARGIN = 8;
const GAP = 4;
const MAX_MENU_HEIGHT = 360;

export function Select(props: SelectProps) {
  const {
    value, onChange, options: optionsProp, children, placeholder, disabled, required, id, name,
    className, triggerClassName, size = "md", variant = "field", searchable, title,
  } = props;
  const dataAttrs: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (k.startsWith("data-")) dataAttrs[k] = (props as unknown as Record<string, unknown>)[k];

  const options = useMemo(() => optionsProp ?? optionsFromChildren(children), [optionsProp, children]);
  const current = value === null || value === undefined ? "" : String(value);
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const withSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const fit = /(^|\s)w-auto(\s|$)/.test(className || "");
  const fullWidth = !/(^|\s)(w-|flex-|col-span-)/.test(className || "");

  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionEls = useRef<Array<HTMLLIElement | null>>([]);
  const typeBuffer = useRef({ text: "", at: 0 });
  const pendingType = useRef("");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<boolean[] | null>(null);

  const usable = useMemo(() => options.map((o, i) => !o.disabled && (!matches || matches[i])), [options, matches]);

  /** Textes d'une option : affiché (éventuellement traduit) et d'origine. */
  const textsAt = useCallback((i: number) => {
    const shown = optionEls.current[i]?.textContent || "";
    return shown && shown !== options[i].label ? [shown, options[i].label] : [options[i].label];
  }, [options]);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setQuery("");
    setMatches(null);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const openMenu = (initialType = "") => {
    if (disabled || !options.length) return;
    const first = options.findIndex((o) => !o.disabled);
    setActive(selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : first);
    setMatches(null);
    if (withSearch) {
      setQuery(initialType);
      pendingType.current = "";
    } else {
      setQuery("");
      pendingType.current = initialType;
    }
    setOpen(true);
  };

  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    close(true);
    if (o.value !== current) onChange(o.value);
  };

  const filter = (q: string) => {
    setQuery(q);
    const nq = foldForSearch(q);
    if (!nq) {
      setMatches(null);
      return;
    }
    const m = options.map((_, i) => textsAt(i).some((t) => foldForSearch(t).includes(nq)));
    setMatches(m);
    setActive((prev) => (prev >= 0 && m[prev] && !options[prev].disabled ? prev : m.findIndex((ok, i) => ok && !options[i].disabled)));
  };

  const typeahead = (ch: string) => {
    const now = Date.now();
    const buf = now - typeBuffer.current.at > 700 ? ch : typeBuffer.current.text + ch;
    typeBuffer.current = { text: buf, at: now };
    const texts = options.map((_, i) => textsAt(i));
    const i = typeaheadIndex(texts, usable, buf, active);
    if (i >= 0) setActive(i);
  };

  // Lettre tapée sur le bouton fermé (sans recherche) : appliquée une fois le menu rendu et traduit.
  useEffect(() => {
    if (!open || !pendingType.current) return;
    const ch = pendingType.current;
    pendingType.current = "";
    typeahead(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const navKey = (e: React.KeyboardEvent, fromSearch: boolean): boolean => {
    const page = 8;
    switch (e.key) {
      case "ArrowDown":
        setActive((a) => stepIndex(usable, a, 1));
        return true;
      case "ArrowUp":
        if (e.altKey) {
          if (active >= 0) choose(active);
          else close(true);
          return true;
        }
        setActive((a) => stepIndex(usable, a, -1));
        return true;
      case "PageDown":
        setActive((a) => { let i = a; for (let k = 0; k < page; k++) i = stepIndex(usable, i, 1); return i; });
        return true;
      case "PageUp":
        setActive((a) => { let i = a; for (let k = 0; k < page; k++) i = stepIndex(usable, i, -1); return i; });
        return true;
      case "Home":
      case "End":
        if (fromSearch) return false; // le curseur du champ de recherche
        setActive(e.key === "Home" ? usable.indexOf(true) : usable.lastIndexOf(true));
        return true;
      case "Enter":
        if (active >= 0) choose(active);
        else close(true);
        return true;
      case "Escape":
        e.stopPropagation(); // une fenêtre (Modal) ne se ferme pas avec le menu
        close(true);
        return true;
      case "Tab":
        close(false);
        return false;
      default:
        return false;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
        e.preventDefault();
        openMenu(e.key);
      }
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      if (Date.now() - typeBuffer.current.at < 700) typeahead(" ");
      else if (active >= 0) choose(active);
      return;
    }
    if (navKey(e, false)) {
      e.preventDefault();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      typeahead(e.key);
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navKey(e, true)) e.preventDefault();
  };

  // ------------------------------------------------------------ placement

  const place = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t || !m) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) {
      close(false); // le bouton est sorti de l'écran
      return;
    }
    const trigW = Math.min(r.width, vw - 2 * MARGIN);
    m.style.minWidth = `${trigW}px`;
    m.style.maxWidth = `${Math.min(vw - 2 * MARGIN, Math.max(trigW, 360))}px`;
    m.style.maxHeight = "none";
    m.style.left = "0px";
    m.style.top = "0px";
    const w = m.offsetWidth;
    const natural = m.offsetHeight;
    const cap = Math.min(MAX_MENU_HEIGHT, vh - 2 * MARGIN);
    const want = Math.min(natural, cap);
    const below = vh - r.bottom - GAP - MARGIN;
    const above = r.top - GAP - MARGIN;
    const down = below >= want || below >= above;
    const h = Math.max(0, Math.min(want, down ? below : above));
    m.style.maxHeight = `${h}px`;
    m.style.top = `${down ? r.bottom + GAP : r.top - GAP - h}px`;
    const rtl = readDirection(t) === "rtl";
    const left = rtl ? r.right - w : r.left;
    m.style.left = `${Math.max(MARGIN, Math.min(left, vw - MARGIN - w))}px`;
    m.dataset.placement = down ? "bottom" : "top";
  }, [close]);

  useLayoutEffect(() => {
    if (open) place();
  });

  useEffect(() => {
    if (!open) return;
    if (withSearch) searchRef.current?.focus({ preventScroll: true });
    const inside = (n: EventTarget | null) => n instanceof Node && (!!rootRef.current?.contains(n) || !!menuRef.current?.contains(n));
    const onPointer = (e: PointerEvent) => { if (!inside(e.target)) close(false); };
    const onFocus = (e: FocusEvent) => { if (!inside(e.target)) close(false); };
    const onScroll = (e: Event) => { if (!(e.target instanceof Node && menuRef.current?.contains(e.target))) place(); };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open, withSearch, close, place]);

  // Option active toujours visible dans la liste (sans faire défiler la page).
  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current;
    const el = optionEls.current[active];
    if (!list || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 4;
  }, [open, active, matches]);

  const noMatch = !!matches && !matches.some(Boolean);
  const display = selected ? selected.label : placeholder ?? "اختر…";

  return (
    <div ref={rootRef} className={cx("relative min-w-0", fullWidth ? "w-full" : fit ? "inline-flex max-w-full" : "", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !withSearch && active >= 0 ? optId(active) : undefined}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={required || undefined}
        title={title}
        disabled={disabled}
        data-value={current}
        {...dataAttrs}
        onClick={() => (open ? close(true) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cx(
          "w-full inline-flex items-center gap-2 text-start cursor-pointer select-none",
          variant === "field"
            ? cx(fieldClass, size === "sm" ? "min-h-9 text-[13.5px] px-2.5" : "", open && "border-gold ring-2 ring-gold/25")
            : "min-h-10 px-1 bg-transparent border-0 text-[14px] font-semibold text-ink rounded-lg focus:outline-none disabled:cursor-not-allowed disabled:text-ink-3",
          triggerClassName,
        )}
      >
        <span className="grid flex-1 min-w-0">
          <span className={cx("col-start-1 row-start-1 truncate", !selected && "text-ink-3")} title={selected ? selected.label : undefined}>{display}</span>
          {fit &&
            options.map((o) => (
              <span key={o.value} aria-hidden="true" className="col-start-1 row-start-1 invisible h-0 overflow-hidden whitespace-nowrap">
                {o.label}
              </span>
            ))}
        </span>
        <ChevronDown aria-hidden="true" strokeWidth={1.75} className={cx("w-4 h-4 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {(name || required) && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          required={required}
          value={current}
          onChange={() => undefined}
          onInvalid={() => triggerRef.current?.focus()}
          className="absolute bottom-0 start-1/2 w-px h-px p-0 border-0 opacity-0 pointer-events-none"
        />
      )}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            data-select-menu=""
            className="fixed z-[60] flex flex-col bg-surface border border-line rounded-xl shadow-pop overflow-hidden text-ink font-sans"
            style={{ top: 0, left: 0 }}
          >
            {withSearch && (
              <div className="p-2 border-b border-line-soft shrink-0">
                <div className="relative">
                  <Search aria-hidden="true" strokeWidth={1.75} className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-ink-3 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(e) => filter(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    aria-label="بحث في الخيارات"
                    placeholder="بحث…"
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={active >= 0 ? optId(active) : undefined}
                    autoComplete="off"
                    className={cx(fieldClass, "w-full min-h-10 ps-9 text-[16px] sm:text-[14px]")}
                  />
                </div>
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={props["aria-label"]}
              aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"]}
              tabIndex={-1}
              className="m-0 p-1 list-none overflow-y-auto overscroll-contain flex-1 min-h-0"
            >
              {options.map((o, i) => {
                const isSel = i === selectedIndex;
                const hide = !!matches && !matches[i];
                return (
                  <li
                    key={`${o.value}-${i}`}
                    ref={(el) => { optionEls.current[i] = el; }}
                    id={optId(i)}
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled || undefined}
                    data-value={o.value}
                    data-active={i === active ? "" : undefined}
                    hidden={hide}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => { if (!o.disabled && active !== i) setActive(i); }}
                    onClick={() => choose(i)}
                    className={cx(
                      hide ? "hidden" : "flex",
                      "items-center gap-2 min-h-11 px-3 py-2 rounded-lg text-[14px] leading-snug cursor-pointer",
                      i === active && "bg-primary-50",
                      isSel ? "font-semibold text-primary" : "text-ink",
                      o.disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span className="flex-1 min-w-0 break-words">{o.label}</span>
                    <Check aria-hidden="true" strokeWidth={2} className={cx("w-4 h-4 shrink-0 text-gold-700", !isSel && "invisible")} />
                  </li>
                );
              })}
              {noMatch && <li role="presentation" className="px-3 py-3 text-[13.5px] text-ink-3">لا توجد نتائج مطابقة</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

