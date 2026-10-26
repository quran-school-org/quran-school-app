/**
 * Carte / section de la charte : surface #F8F8F3, bordure #D9DBD0, rayon 18 px,
 * marge intérieure 24 px ; titre en IBM Plex Sans Arabic 600, 22 px (UI-15).
 */
import React from "react";
import { cx } from "./cx";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  [key: string]: any;
  as?: "section" | "div" | "article" | "aside";
  padded?: boolean;
}

export function Card({ as = "section", padded = true, className, children, ...rest }: CardProps) {
  const Tag = as as any;
  return (
    <Tag className={cx("bg-surface border border-line rounded-2xl min-w-0", padded && "p-5 sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
  icon?: React.ReactNode;
  className?: string;
  level?: 2 | 3;
}

export function CardHeader({ title, description, actions, id, icon, className, level = 2 }: CardHeaderProps) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className={cx("flex flex-wrap justify-between items-start gap-x-5 gap-y-3", className)}>
      <div className="flex flex-col gap-1 min-w-0 max-w-[60ch]">
        <H id={id} className={cx("m-0 font-sans font-semibold text-primary flex items-center gap-2", level === 2 ? "text-[22px] leading-snug" : "text-[18px] leading-snug")}>
          {icon && <span aria-hidden="true" className="inline-flex text-gold-700">{icon}</span>}
          {title}
        </H>
        {description && <p className="m-0 text-[14px] text-ink-2 leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Séparateur horizontal fin (#E1E3D8). */
export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-0 border-t border-line-soft m-0", className)} />;
}
