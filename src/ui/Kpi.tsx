/**
 * Bandeau d'indicateurs : grille à filets de 1 px (#D9DBD0), rayon 18 px ;
 * tuile : libellé 14 px, valeur 38 px gras à chiffres tabulaires, note 13,5 px.
 */
import React from "react";
import { cx } from "./cx";

export function KpiGrid({ children, label, className, min = 230 }: { children: React.ReactNode; label?: string; className?: string; min?: number }) {
  return (
    <section
      aria-label={label}
      className={cx("grid gap-px bg-line border border-line rounded-2xl overflow-hidden", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </section>
  );
}

export interface KpiTileProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  unit?: React.ReactNode;
  hint?: React.ReactNode;
  hintTone?: "muted" | "success" | "danger" | "warn";
  children?: React.ReactNode;
  className?: string;
  size?: "lg" | "md";
}

const HINT = {
  muted: "text-ink-3",
  success: "text-success-700 font-semibold",
  danger: "text-danger font-semibold",
  warn: "text-gold-800 font-semibold",
};

export function KpiTile({ label, value, unit, hint, hintTone = "muted", children, className, size = "lg" }: KpiTileProps) {
  return (
    <div className={cx("bg-surface px-[22px] py-5 flex flex-col gap-1.5 min-w-0", className)}>
      <span className="text-[14px] text-ink-2">{label}</span>
      {value !== undefined && (
        <span className={cx("font-bold leading-[1.1] tabular-nums text-ink", size === "lg" ? "text-[38px]" : "text-[28px]")}>
          {value}
          {unit && <span className="text-[18px] font-semibold text-ink-2 ms-1.5">{unit}</span>}
        </span>
      )}
      {children}
      {hint && <span className={cx("text-[13.5px]", HINT[hintTone])}>{hint}</span>}
    </div>
  );
}
