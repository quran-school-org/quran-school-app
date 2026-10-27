/** État vide : cadre en pointillés (--color-line-dashed) sur sable clair, message centré. */
import React from "react";
import { cx } from "./cx";

export function EmptyState({ icon, title, children, action, className }: { icon?: React.ReactNode; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col items-center justify-center text-center gap-2 px-6 py-10 rounded-xl border-[1.5px] border-dashed border-line-dashed bg-surface-2", className)}>
      {icon && <span aria-hidden="true" className="text-ink-3 inline-flex mb-1">{icon}</span>}
      {title && <p className="m-0 font-semibold text-body text-ink">{title}</p>}
      {children && <p className="m-0 max-w-[46ch] text-body leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
