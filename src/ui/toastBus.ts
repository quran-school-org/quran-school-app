/**
 * Canal des messages pour le code hors React (ex. src/print/printWindow.ts) : le
 * `ToastProvider` s'y abonne et affiche ce qui y est émis. Dans un composant ou un
 * hook, utiliser `useToast()` (src/ui/Toast.tsx).
 */
export type ToastBusVariant = "success" | "error" | "info";
type Listener = (variant: ToastBusVariant, message: string) => void;

const listeners = new Set<Listener>();

export function emitToast(variant: ToastBusVariant, message: string): void {
  listeners.forEach((fn) => fn(variant, message));
}

/** Abonnement ; renvoie la fonction de désabonnement. */
export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
