/**
 * En-tête de page : titre Reem Kufi 44 px (32 px en mobile), sous-titre 16 px,
 * actions alignées en bas à gauche (RTL : à l'extrémité).
 */
import React from "react";
import { cx } from "./cx";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <section className={cx("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="flex flex-col gap-1.5 min-w-0">
        {eyebrow && <span className="text-[13px] font-semibold text-gold-700">{eyebrow}</span>}
        <h1 className="m-0 font-display font-bold text-[32px] sm:text-[44px] leading-[1.15] text-primary">{title}</h1>
        {description && <p className="m-0 text-[15px] sm:text-[16px] text-ink-2 max-w-[60ch] leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </section>
  );
}
