/**
 * Tableaux de la charte : en-tête sable clair 13 px / 600, lignes à filet
 * #E8EAE1, survol #F1F2EB, défilement horizontal contenu dans la carte.
 */
import React from "react";
import { cx } from "./cx";
import { useMediaQuery } from "./useMediaQuery";

export function TableWrap({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={cx("overflow-x-auto max-w-full", className)} role={label ? "region" : undefined} aria-label={label} tabIndex={label ? 0 : undefined}>
      {children}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cx("w-full border-collapse text-body text-ink", className)}>{children}</table>;
}

export function Th({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx("px-3 py-3 text-start text-small font-semibold text-ink-2 bg-surface-2 border-b border-line whitespace-nowrap", className)} {...rest}>
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

/**
 * Colonne d'un `DataTable`. `card` décide de son sort sous `md` : « title » =
 * nom en titre de la carte, « field » = champ libellé (2 ou 3 au plus), absent =
 * colonne propre au tableau, non reprise sur la carte.
 */
export interface DataColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Classes de l'en-tête et des cellules (centrage, largeur, masquage responsive). */
  className?: string;
  card?: "title" | "field";
  /** Libellé du champ sur la carte (par défaut, l'en-tête de colonne). */
  cardLabel?: React.ReactNode;
  /** Contenu propre à la carte, si différent de la cellule du tableau (ex. sans l'avatar). */
  cardCell?: (row: T) => React.ReactNode;
  /** Champ sur toute la largeur de la carte (texte long). */
  cardWide?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: DataColumn<T>[];
  /** Nom accessible de la liste (région du tableau, étiquette de la liste de cartes). */
  label: string;
  /** Actions de la ligne : dernière colonne du tableau, pied de la carte. */
  actions?: (row: T) => React.ReactNode;
  actionsHeader?: React.ReactNode;
  /** Image ou avatar à gauche du titre de la carte. */
  cardLeading?: (row: T) => React.ReactNode;
  /** Ligne ou carte cliquable (la carte porte alors un vrai bouton). */
  onRowClick?: (row: T) => void;
  isSelected?: (row: T) => boolean;
  rowClassName?: (row: T) => string | undefined;
  /** Largeur à partir de laquelle on affiche le tableau (défaut : `md`, 768 px). */
  tableFrom?: string;
}

const MD = "(min-width: 768px)";

/**
 * Tableau de la charte avec variante « cartes » sous `md` : seule la variante
 * utile est rendue. Les actions restent visibles (pied de carte) au lieu de
 * sortir de l'écran dans un défilement horizontal.
 */
export function DataTable<T>({ rows, rowKey, columns, label, actions, actionsHeader = "الإجراءات", cardLeading, onRowClick, isSelected, rowClassName, tableFrom = MD }: DataTableProps<T>) {
  const wide = useMediaQuery(tableFrom);

  if (wide) {
    return (
      <TableWrap label={label}>
        <Table>
          <thead>
            <tr>
              {columns.map((c) => <Th key={c.id} className={c.className}>{c.header}</Th>)}
              {actions && <Th className="text-center w-px">{actionsHeader}</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={rowKey(row)} selected={isSelected?.(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx(onRowClick && "cursor-pointer", rowClassName?.(row))}>
                {columns.map((c) => <Td key={c.id} className={c.className}>{c.cell(row)}</Td>)}
                {actions && <Td className="w-px whitespace-nowrap" onClick={(e: React.MouseEvent) => e.stopPropagation()}><div className="flex justify-center gap-1.5">{actions(row)}</div></Td>}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    );
  }

  const title = columns.find((c) => c.card === "title");
  const fields = columns.filter((c) => c.card === "field");
  return (
    <ul data-data-cards="" aria-label={label} className="m-0 p-3 list-none flex flex-col gap-3">
      {rows.map((row) => {
        const on = isSelected?.(row);
        const head = (
          <>
            {cardLeading?.(row)}
            <span className="min-w-0 flex-1">{title ? (title.cardCell ?? title.cell)(row) : null}</span>
          </>
        );
        return (
          <li key={rowKey(row)} data-card="" className={cx("rounded-xl border bg-surface flex flex-col", on ? "border-gold bg-gold-50" : "border-line", rowClassName?.(row))}>
            {onRowClick ? (
              <button type="button" aria-pressed={on} onClick={() => onRowClick(row)} className="flex items-center gap-3 w-full text-start bg-transparent border-0 rounded-t-xl p-3.5 cursor-pointer min-h-11">{head}</button>
            ) : (
              <div className="flex items-center gap-3 p-3.5">{head}</div>
            )}
            {fields.length > 0 && (
              <dl className="m-0 px-3.5 pb-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {fields.map((c) => (
                  <div key={c.id} className={cx("min-w-0", c.cardWide && "col-span-2")}>
                    <dt className="text-small text-ink-3">{c.cardLabel ?? c.header}</dt>
                    <dd className="m-0 text-body text-ink break-words">{(c.cardCell ?? c.cell)(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions && <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-3.5 py-2.5">{actions(row)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
