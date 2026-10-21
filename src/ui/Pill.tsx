/** Pastilles / badges (rayon 999 px, 13 px / 600). */
import React from "react";
import { cx } from "./cx";

export type PillTone = "neutral" | "primary" | "success" | "danger" | "warn" | "gold" | "night" | "outline";

const TONES: Record<PillTone, string> = {
  neutral: "bg-sunken text-ink-2",
  primary: "bg-primary-100 text-primary",
  success: "bg-success-100 text-success-700",
  danger: "bg-danger-100 text-danger-800",
  warn: "bg-gold-100 text-gold-800",
  gold: "bg-gold text-night",
  night: "bg-primary text-white",
  outline: "bg-surface text-ink-2 border border-line-strong",
};

export function Pill({ tone = "neutral", children, className, dot, title }: { tone?: PillTone; children: React.ReactNode; className?: string; dot?: boolean; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold whitespace-nowrap leading-6", TONES[tone], className)}>
      {dot && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Pastille numérique (compteur) dorée de la maquette. */
export function CountBadge({ value, tone = "gold", className }: { value: number; tone?: "gold" | "danger"; className?: string }) {
  return (
    <span className={cx("inline-flex items-center justify-center rounded-full px-2 text-[12px] font-bold tabular-nums min-w-6 h-[22px]", tone === "gold" ? "bg-gold text-night" : "bg-danger text-white", className)}>
      {value}
    </span>
  );
}
