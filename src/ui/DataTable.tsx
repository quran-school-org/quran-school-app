/**
 * Tableaux de la charte : en-tête sable clair 13 px / 600, lignes à filet
 * #E8EAE1, survol #F1F2EB, défilement horizontal contenu dans la carte.
 */
import React from "react";
import { cx } from "./cx";

export function TableWrap({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={cx("overflow-x-auto max-w-full", className)} role={label ? "region" : undefined} aria-label={label} tabIndex={label ? 0 : undefined}>
      {children}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cx("w-full border-collapse text-[14px] text-ink", className)}>{children}</table>;
}

export function Th({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx("px-3 py-3 text-start text-[13px] font-semibold text-ink-2 bg-surface-2 border-b border-line whitespace-nowrap", className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cx("px-3 py-3 border-b border-line-faint align-middle", className)} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ children, className, selected, ...rest }: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr className={cx("transition-colors hover:bg-surface-2", selected && "bg-gold-50", className)} {...rest}>
      {children}
    </tr>
  );
}
