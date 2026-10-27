/**
 * Pagination de la charte : « ‹ 1 2 3 … 9 › » et résumé (« الطلاب 9–16 من 150 »).
 * <nav> étiquetée, page courante en `aria-current="page"`, boutons étiquetés.
 * Les flèches suivent le sens de lecture effectif (RTL : « précédent » pointe à
 * droite ; FR de test : à gauche). Mobile : seulement la première, la
 * courante et la dernière page, pour tenir sur une ligne.
 */
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "./cx";
import { clampPage, pageWindow, type PageItem } from "./usePagination";
import { useDirection } from "./useDirection";

/** Tailles de page retenues par le propriétaire (D83). */
export const PAGE_SIZES = { students: 8, certificates: 20 } as const;

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Nom de la navigation (ex. « ترقيم صفحات قائمة الطلاب »). */
  label: string;
  /** Résumé en arabe, en un seul texte (traduisible), ex. « الطلاب 9–16 من 150 ». */
  summary?: string;
  className?: string;
  [key: `data-${string}`]: string | undefined;
}

const btn = "inline-flex items-center justify-center min-w-10 h-10 sm:min-w-9 sm:h-9 px-2 rounded-[10px] border text-body font-semibold tabular-nums cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed";

export function Pagination({ page, pageCount, onPageChange, label, summary, className, ...rest }: PaginationProps) {
  const navRef = useRef<HTMLElement>(null);
  const rtl = useDirection(navRef) === "rtl";
  const p = clampPage(page, pageCount);
  const go = (n: number) => { if (n !== p && n >= 1 && n <= pageCount) onPageChange(n); };
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  const items = (list: PageItem[], cls: string) => (
    <ul className={cx("m-0 p-0 list-none items-center gap-1", cls)}>
      <li>
        <button type="button" className={cx(btn, "bg-white border-line text-ink-2 hover:border-primary hover:text-primary")} onClick={() => go(p - 1)} disabled={p <= 1} aria-label="الصفحة السابقة" title="الصفحة السابقة" data-page-prev="">
          <Prev aria-hidden="true" className="w-4 h-4" strokeWidth={2} />
        </button>
      </li>
      {list.map((it, i) =>
        it === "gap" ? (
          <li key={`gap-${i}`} aria-hidden="true" className="inline-flex items-end justify-center w-6 h-9 text-ink-3 select-none">…</li>
        ) : (
          <li key={it}>
            <button
              type="button"
              onClick={() => go(it)}
              aria-current={it === p ? "page" : undefined}
              aria-label={`الصفحة ${it}`}
              data-page={it}
              className={cx(btn, it === p ? "bg-primary border-primary text-white" : "bg-white border-line text-ink-2 hover:border-primary hover:text-primary")}
            >
              {it}
            </button>
          </li>
        ),
      )}
      <li>
        <button type="button" className={cx(btn, "bg-white border-line text-ink-2 hover:border-primary hover:text-primary")} onClick={() => go(p + 1)} disabled={p >= pageCount} aria-label="الصفحة التالية" title="الصفحة التالية" data-page-next="">
          <Next aria-hidden="true" className="w-4 h-4" strokeWidth={2} />
        </button>
      </li>
    </ul>
  );

  return (
    <nav ref={navRef} aria-label={label} className={cx("flex flex-wrap items-center justify-between gap-x-4 gap-y-2", className)} {...rest}>
      {summary && <p className="m-0 text-small text-ink-2 tabular-nums" aria-live="polite">{summary}</p>}
      {pageCount > 1 && (
        <>
          {items(pageWindow(p, pageCount, 0), "flex sm:hidden")}
          {items(pageWindow(p, pageCount, 1), "hidden sm:flex")}
        </>
      )}
    </nav>
  );
}
