/**
 * Barre du haut (maquette Topbar.dc.html) : date et saison, pastille de
 * synchronisation, cloche, utilisateur, déconnexion ; emplacement pour le
 * sélecteur d'école et le bouton du menu en mobile.
 *
 * Mode `compact` (sous 1 024 px, UI-05) : une seule ligne de 56 px (menu, nom
 * de l'école tronqué, cloche, avatar). Le sélecteur d'école et la déconnexion
 * sont alors dans le tiroir du menu (AppFrame).
 */
import React from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { cx } from "./cx";
import { InitialAvatar } from "./InitialAvatar";

export type SyncState = "synced" | "syncing" | "error";

const SYNC = {
  synced: { box: "bg-success-100 text-success-700", dot: "bg-success", label: "متزامن", title: "البيانات متزامنة مع قاعدة البيانات في الوقت الفعلي" },
  syncing: { box: "bg-gold-100 text-gold-800", dot: "bg-gold animate-pulse", label: "مزامنة…", title: "جاري الاتصال والمزامنة مع قاعدة البيانات…" },
  error: { box: "bg-danger-100 text-danger-800", dot: "bg-danger", label: "غير متصل", title: "تعذّرت مزامنة البيانات؛ العمل جارٍ على النسخة المحلية" },
};

export function SyncPill({ state }: { state: SyncState }) {
  const s = SYNC[state];
  return (
    <span role="status" title={s.title} className={cx("inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-[13.5px] font-semibold whitespace-nowrap", s.box)}>
      <span aria-hidden="true" className={cx("w-2 h-2 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export interface TopbarProps {
  dateLabel: string;
  season?: string;
  sync: SyncState;
  unread: number;
  onBell: () => void;
  userName: string;
  userRole: string;
  onUser: () => void;
  onLogout: () => void;
  schoolSwitcher?: React.ReactNode;
  onMenu?: () => void;
  menuOpen?: boolean;
  mobileBrand?: React.ReactNode;
  /** Une seule ligne : sans sélecteur d'école ni déconnexion (déplacés dans le tiroir). */
  compact?: boolean;
}

export function Topbar({ dateLabel, season, sync, unread, onBell, userName, userRole, onUser, onLogout, schoolSwitcher, onMenu, menuOpen, mobileBrand, compact }: TopbarProps) {
  return (
    <header
      data-topbar
      className={cx(
        "w-full px-4 sm:px-8 flex items-center justify-between bg-surface border-b border-line",
        compact ? "h-14 flex-nowrap gap-2" : "min-h-[76px] py-3.5 flex-wrap gap-x-5 gap-y-3",
      )}
    >
      <div className={cx("flex items-center gap-3 min-w-0", compact && "flex-1")}>
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            aria-label="القائمة الرئيسية"
            aria-expanded={menuOpen}
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-xl border border-line bg-white text-primary cursor-pointer hover:border-primary"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        {mobileBrand && <div className="lg:hidden min-w-0 flex-1">{mobileBrand}</div>}
        <div className={cx("flex flex-col gap-0.5 min-w-0", Boolean(mobileBrand) && "hidden lg:flex")}>
          <span className="text-[13px] text-ink-3">{dateLabel}</span>
          {season && <span className="text-[15px] font-semibold">الموسم الدراسي {season}</span>}
        </div>
      </div>
      <div className={cx("flex items-center gap-2.5 shrink-0", !compact && "flex-wrap")}>
        {!compact && <span className="hidden sm:inline-flex"><SyncPill state={sync} /></span>}
        {!compact && schoolSwitcher}
        <button
          type="button"
          onClick={onBell}
          aria-label={unread > 0 ? `الإشعارات، ${unread} غير مقروءة` : "الإشعارات"}
          title="الإشعارات"
          className="relative w-11 h-11 inline-flex items-center justify-center rounded-xl border border-line bg-white text-primary cursor-pointer hover:border-primary transition-colors"
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -start-1.5 min-w-[22px] h-[22px] px-1.5 box-border rounded-full bg-danger text-white text-[11.5px] font-bold inline-flex items-center justify-center tabular-nums border-2 border-surface">
              {unread}
            </span>
          )}
        </button>
        <button
          type="button"
          data-action="open-profile"
          onClick={onUser}
          title="تعديل بيانات ملفك الشخصي"
          aria-label={compact ? "تعديل بيانات ملفك الشخصي" : undefined}
          className="flex items-center gap-2.5 ps-1.5 pe-2 py-1 min-h-11 rounded-xl bg-transparent border border-transparent hover:border-line hover:bg-white cursor-pointer text-start"
        >
          <InitialAvatar name={userName} tone="night" size={40} />
          <span className="hidden md:flex flex-col leading-[1.3] min-w-0">
            <span className="text-[12.5px] text-ink-3">{userRole}</span>
            <span className="text-[14.5px] font-semibold text-ink max-w-[16rem] truncate">{userName}</span>
          </span>
        </button>
        {!compact && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="خروج"
            className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl border border-line bg-transparent text-ink-2 text-[14px] font-semibold cursor-pointer hover:bg-white hover:text-danger hover:border-danger-200 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] -scale-x-100" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        )}
      </div>
    </header>
  );
}
