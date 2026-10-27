/** Barres de progression et barre empilée (maquette : piste #E1E3D8, rayon 3–4 px). */
import React from "react";
import { cx } from "./cx";

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: "primary" | "gold" | "success" | "danger" | "muted";
  label?: string;
  height?: number;
  className?: string;
}

const TONES = { primary: "bg-primary", gold: "bg-gold", success: "bg-success", danger: "bg-danger", muted: "bg-ink-4" };

export function ProgressBar({ value, max = 100, tone = "primary", label, height = 10, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cx("block flex-1 rounded-[3px] bg-line-soft overflow-hidden", className)}
      style={{ height }}
    >
      <span className={cx("block h-full", TONES[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}

export interface StackedSegment {
  label: string;
  value: number;
  color: string;
}

export function StackedBar({ segments, label, height = 14, className }: { segments: StackedSegment[]; label?: string; height?: number; className?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div role="img" aria-label={label || segments.map((s) => `${s.label} ${s.value}`).join("، ")} className={cx("flex rounded overflow-hidden gap-0.5", className)} style={{ height }}>
      {total === 0 ? (
        <span className="flex-1 bg-line-soft" />
      ) : (
        segments.filter((s) => s.value > 0).map((s) => <span key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />)
      )}
    </div>
  );
}

export function Legend({ items, columns = 2 }: { items: { label: React.ReactNode; color: string }[]; columns?: number }) {
  return (
    <div className="grid gap-x-3 gap-y-1 text-small text-ink-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
