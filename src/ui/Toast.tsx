/**
 * Messages brefs de la charte (D99) : succès, erreur, information. Un seul
 * `ToastProvider` est monté à la racine (src/main.tsx), au-dessus de l'écran de
 * connexion, du choix d'école et de l'application ; tout composant ou hook
 * d'actions appelle `useToast()` (remplace les boîtes d'alerte natives).
 *
 * - Succès et information : `role="status"` (annonce polie) ; erreur : `role="alert"`.
 * - Fermeture automatique (5 s, 9 s pour une erreur), suspendue au survol et au
 *   focus ; fermeture manuelle par un bouton nommé.
 * - Position logique (RTL) : bas de l'écran, pleine largeur sur téléphone (marge de
 *   16 px et zone sûre), coin de fin de ligne sur grand écran (le début de ligne est
 *   occupé par le menu latéral, de la même teinte que le message). Aucune barre du bas
 *   ni bouton flottant n'existe dans l'application ; si l'un d'eux est ajouté, relever
 *   `--toast-bottom` (variable CSS) suffit.
 * - Texte conservé tel quel (retours à la ligne inclus) : la couche de traduction du
 *   DOM (D79) le traduit comme le reste de l'interface.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cx } from "./cx";
import { subscribeToasts } from "./toastBus";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

/** Durée d'affichage avant fermeture automatique (ms) : plus longue pour une erreur. */
export const TOAST_DURATION: Record<ToastVariant, number> = { success: 5000, info: 5000, error: 9000 };
/** Nombre maximal de messages affichés en même temps (les plus anciens partent d'abord). */
export const TOAST_MAX = 4;

/** Ajoute un message à la liste : un message identique déjà affiché est remplacé (pas de doublon empilé). */
export function pushToast(list: ToastItem[], item: ToastItem, max = TOAST_MAX): ToastItem[] {
  const next = [...list.filter((t) => !(t.variant === item.variant && t.message === item.message)), item];
  return next.slice(-max);
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast : ToastProvider absent (monté dans src/main.tsx).");
  return api;
}

const STYLES: Record<ToastVariant, { box: string; icon: React.ReactNode; closeLabel: string }> = {
  success: { box: "bg-night text-white", icon: <Check className="w-[18px] h-[18px] text-gold" strokeWidth={2} aria-hidden="true" />, closeLabel: "إغلاق الإشعار" },
  info: { box: "bg-night text-white", icon: <Info className="w-[18px] h-[18px] text-night-link" strokeWidth={2} aria-hidden="true" />, closeLabel: "إغلاق الإشعار" },
  error: { box: "bg-danger-700 text-white", icon: <AlertTriangle className="w-[18px] h-[18px] text-white" strokeWidth={2} aria-hidden="true" />, closeLabel: "إغلاق الإشعار" },
};

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onClose(toast.id), TOAST_DURATION[toast.variant]);
    return () => window.clearTimeout(timer);
  }, [paused, toast.id, toast.variant, onClose]);
  const st = STYLES[toast.variant];
  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      data-toast={toast.variant}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx("pointer-events-auto flex items-start gap-2.5 ps-4 pe-2 py-2.5 rounded-xl text-[14px] leading-relaxed shadow-toast animate-fadeIn font-sans", st.box)}
    >
      <span className="mt-[3px] shrink-0">{st.icon}</span>
      <span className="flex-1 min-w-0 py-1 whitespace-pre-line break-words">{toast.message}</span>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label={st.closeLabel}
        title={st.closeLabel}
        className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-white/85 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
      >
        <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const add = useCallback((variant: ToastVariant, message: string) => {
    const text = String(message ?? "");
    if (!text.trim()) return;
    seq.current += 1;
    const item: ToastItem = { id: seq.current, variant, message: text };
    setItems((list) => pushToast(list, item));
  }, []);
  // Messages émis hors React (toastBus) : même affichage.
  useEffect(() => subscribeToasts(add), [add]);
  const api = useMemo<ToastApi>(
    () => ({ success: (m) => add("success", m), error: (m) => add("error", m), info: (m) => add("info", m), dismiss }),
    [add, dismiss],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        data-toast-region
        dir="rtl"
        className="fixed z-[70] inset-x-4 bottom-[var(--toast-bottom,max(1rem,env(safe-area-inset-bottom)))] sm:inset-x-auto sm:end-6 sm:bottom-[var(--toast-bottom,1.5rem)] sm:w-[26rem] flex flex-col gap-2 pointer-events-none print:hidden"
      >
        {items.map((t) => <ToastCard key={t.id} toast={t} onClose={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
