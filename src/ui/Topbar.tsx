/**
 * Barre du haut (maquette Topbar.dc.html) : date et saison, pastille de
 * problème de synchronisation (erreur seulement, D93), cloche, utilisateur, déconnexion ; emplacement pour le
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

/**
 * Pastille de problème de synchronisation (D93) : rien n'est affiché quand
 * tout va bien (« متزامن » et « مزامنة… » retirés) ; seul l'état d'erreur
 * (hors ligne, échec de synchronisation) produit un signal discret.
 */
export function SyncPill({ state }: { state: SyncState }) {
  if (state !== "error") return null;
  return (
    <span role="status" data-sync-error title="تعذّرت مزامنة البيانات؛ العمل جارٍ على النسخة المحلية" className="inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-small font-semibold whitespace-nowrap bg-danger-100 text-danger-800">
      <span aria-hidden="true" className="w-2 h-2 rounded-full bg-danger" />
      غير متصل
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
          <span className="text-small text-ink-3">{dateLabel}</span>
          {season && <span className="text-body font-semibold">الموسم الدراسي {season}</span>}
        </div>
      </div>
      <div className={cx("flex items-center gap-2.5 shrink-0", !compact && "flex-wrap")}>
        {!compact && sync === "error" && <span className="hidden sm:inline-flex"><SyncPill state={sync} /></span>}
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
            <span className="absolute -top-1.5 -start-1.5 min-w-[22px] h-[22px] px-1.5 box-border rounded-full bg-danger text-white text-caption font-bold inline-flex items-center justify-center tabular-nums border-2 border-surface">
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
            <span className="text-small text-ink-3">{userRole}</span>
            <span className="text-body font-semibold text-ink max-w-[16rem] truncate">{userName}</span>
          </span>
        </button>
        {!compact && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="خروج"
            className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl border border-line bg-transparent text-ink-2 text-body font-semibold cursor-pointer hover:bg-white hover:text-danger hover:border-danger-200 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] -scale-x-100" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        )}
      </div>
    </header>
  );
}
