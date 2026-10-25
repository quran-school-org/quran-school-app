/**
 * Menu latéral (couleur `night` du thème, D84) (maquette Nav.dc.html) : marque, groupes (التعليم /
 * المالية / الإدارة), éléments de 44 px, point doré sur l'élément actif,
 * badges, éléments désactivés, motif géométrique doré en pied.
 */
import React from "react";
import { cx } from "./cx";
import { GeometricPattern } from "./GeometricPattern";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  disabledLabel?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface SideNavProps {
  brand: React.ReactNode;
  groups: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  footer?: React.ReactNode;
  navId: "desktop" | "mobile";
  className?: string;
  headerExtra?: React.ReactNode;
}

export function SideNav({ brand, groups, active, onSelect, footer, navId, className, headerExtra }: SideNavProps) {
  return (
    <nav data-nav={navId} aria-label="القائمة الرئيسية" className={cx("relative flex flex-col gap-[22px] [@media(max-height:900px)]:gap-3 bg-night text-night-text px-4 pt-6 [@media(max-height:900px)]:pt-4 pb-5 overflow-hidden", className)}>
      <div className="absolute bottom-0 inset-x-0 h-80 pointer-events-none">
        <GeometricPattern size={56} opacity={0.13} fade="top" />
      </div>
      <div className="relative flex items-start justify-between gap-2">
        {brand}
        {headerExtra}
      </div>
      {groups.filter((g) => g.items.length > 0).map((g) => (
        <div key={g.label} className="relative flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-night-label px-3 pb-1.5 [@media(max-height:900px)]:pb-0.5">{g.label}</span>
          {g.items.map((it) => {
            const on = it.id === active;
            if (it.disabled) {
              return (
                <span key={it.id} aria-disabled="true" className="flex items-center gap-3 min-h-11 [@media(max-height:900px)]:min-h-9 px-3 rounded-[10px] text-[15px] font-medium text-night-dim">
                  <span aria-hidden="true" className="inline-flex">{it.icon}</span>
                  <span className="flex-1">{it.label}</span>
                  {it.disabledLabel && <span className="text-[11px] font-semibold text-night-soft border border-night-line-2 rounded-full px-2 py-0.5">{it.disabledLabel}</span>}
                </span>
              );
            }
            return (
              <button
                key={it.id}
                type="button"
                data-tab={it.id}
                aria-current={on ? "page" : undefined}
                onClick={() => onSelect(it.id)}
                className={cx(
                  "flex items-center gap-3 min-h-11 [@media(max-height:900px)]:min-h-9 px-3 rounded-[10px] text-[15px] font-medium text-start border-0 cursor-pointer transition-colors w-full",
                  on ? "bg-gold/[0.16] text-gold-glow" : "bg-transparent text-night-link hover:bg-white/[0.08]",
                )}
              >
                <span aria-hidden="true" className="inline-flex shrink-0">{it.icon}</span>
                <span className="flex-1 min-w-0">{it.label}</span>
                {it.badge !== undefined && it.badge > 0 ? (
                  <span className="text-[12px] font-bold tabular-nums bg-gold text-night rounded-full px-2 py-px">{it.badge}</span>
                ) : (
                  <span aria-hidden="true" className={cx("w-1.5 h-1.5 rounded-full shrink-0", on ? "bg-gold" : "bg-transparent")} />
                )}
              </button>
            );
          })}
        </div>
      ))}
      {footer && <div className="relative mt-auto flex flex-col gap-3">{footer}</div>}
    </nav>
  );
}

/** Marque : logo (ou emblème) + nom de l'école en Reem Kufi + sous-titre doré. */
export function NavBrand({ logo, name, subtitle, onClick }: { logo: React.ReactNode; name: React.ReactNode; subtitle?: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-start text-white px-1.5 bg-transparent border-0 cursor-pointer min-w-0">
      <span className="shrink-0 inline-flex">{logo}</span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span data-active-school className="font-display font-bold text-[19px] leading-[1.2] break-words">{name}</span>
        {subtitle && <span className="text-[12.5px] text-gold font-semibold">{subtitle}</span>}
      </span>
    </button>
  );
}
