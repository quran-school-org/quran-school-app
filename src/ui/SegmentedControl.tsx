/**
 * Bascule segmentée (fond #E6E8DF, bouton actif blanc) et puces de filtre
 * (rayon 999 px, active en bleu nuit). Accessibles (aria-pressed).
 */
import React from "react";
import { cx } from "./cx";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  attrs?: Record<string, string>;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label, className, size = "md" }: { options: SegmentOption<T>[]; value: T; onChange: (v: NoInfer<T>) => void; label: string; className?: string; size?: "md" | "sm" }) {
  return (
    <div role="group" aria-label={label} className={cx("inline-flex flex-wrap p-[3px] rounded-[10px] bg-sunken gap-0.5 max-w-full", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            {...(o.attrs || {})}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 border-0 rounded-lg font-semibold cursor-pointer transition-colors",
              size === "md" ? "min-h-[38px] px-3.5 text-[13.5px]" : "min-h-8 px-2.5 text-[12.5px]",
              on ? "bg-white text-primary shadow-[0_1px_2px_color-mix(in_srgb,var(--color-night)_8%,transparent)]" : "bg-transparent text-ink-2 hover:text-ink",
            )}
          >
            {o.icon && <span aria-hidden="true" className="inline-flex">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChips<T extends string>({ options, value, onChange, label, className }: { options: SegmentOption<T>[]; value: T; onChange: (v: NoInfer<T>) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            {...(o.attrs || {})}
            className={cx(
              "inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border text-[13.5px] font-semibold cursor-pointer transition-colors",
              on ? "bg-primary text-white border-primary" : "bg-surface text-ink border-line-strong hover:bg-surface-2",
            )}
          >
            {o.icon && <span aria-hidden="true" className="inline-flex">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
