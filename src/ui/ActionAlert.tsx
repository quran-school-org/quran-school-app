/** Alerte « à traiter » (3 tons de la maquette : danger, avertissement, neutre ; + succès). */
import React from "react";
import { cx } from "./cx";

export type AlertTone = "danger" | "warn" | "neutral" | "success" | "info";

const T: Record<AlertTone, { box: string; icon: string; title: string; body: string }> = {
  danger: { box: "bg-danger-100", icon: "text-danger", title: "text-danger-800", body: "text-danger-900" },
  warn: { box: "bg-gold-100", icon: "text-gold-700", title: "text-gold-800", body: "text-[#5C4A1E]" },
  neutral: { box: "bg-quiet", icon: "text-ink-2", title: "text-ink", body: "text-ink-2" },
  success: { box: "bg-success-100", icon: "text-success-700", title: "text-success-700", body: "text-success-800" },
  info: { box: "bg-primary-100", icon: "text-primary", title: "text-primary", body: "text-ink-2" },
};

export interface ActionAlertProps {
  tone?: AlertTone;
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  role?: string;
}

export function ActionAlert({ tone = "neutral", icon, title, children, action, className, role }: ActionAlertProps) {
  const t = T[tone];
  return (
    <div role={role} className={cx("flex gap-3 p-3.5 rounded-xl", t.box, className)}>
      {icon && <span aria-hidden="true" className={cx("shrink-0 mt-0.5 inline-flex", t.icon)}>{icon}</span>}
      <div className="flex flex-col gap-1 min-w-0">
        <span className={cx("font-semibold text-[14.5px]", t.title)}>{title}</span>
        {children && <span className={cx("text-[13.5px] leading-relaxed", t.body)}>{children}</span>}
        {action && <span className={cx("text-[13.5px] font-semibold", t.title)}>{action}</span>}
      </div>
    </div>
  );
}

/** Lien d'action en forme de texte souligné (dans les alertes). */
export function TextAction({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cx("p-0 bg-transparent border-0 underline underline-offset-4 font-semibold cursor-pointer text-current text-start min-h-6", className)}>
      {children}
    </button>
  );
}
