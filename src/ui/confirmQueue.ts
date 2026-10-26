/**
 * File des demandes de confirmation (D99), sans React : une boîte à la fois, les
 * demandes suivantes attendent leur tour. Testée seule (tests/unit/retours.test.ts) ;
 * `ConfirmProvider` (src/ui/ConfirmDialog.tsx) l'affiche.
 */
export interface ConfirmOptions<M = unknown> {
  title?: M;
  message: M;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

export interface PendingConfirm<M = unknown> extends ConfirmOptions<M> {
  id: number;
}

export interface ConfirmQueue<M = unknown> {
  /** Ajoute une demande ; la promesse vaut `true` seulement si l'utilisateur confirme. */
  request: (options: ConfirmOptions<M>) => Promise<boolean>;
  /** Réponse à la demande affichée (puis la suivante, s'il y en a une, est affichée). */
  answer: (ok: boolean) => void;
  /** Démontage : toute demande en attente est refusée (`false`). */
  dispose: () => void;
}

export function createConfirmQueue<M = unknown>(onShow: (current: PendingConfirm<M> | null) => void): ConfirmQueue<M> {
  type Entry = PendingConfirm<M> & { resolve: (ok: boolean) => void };
  const waiting: Entry[] = [];
  let current: Entry | null = null;
  let seq = 0;

  const show = (next: Entry | null) => {
    current = next;
    onShow(next ? { id: next.id, title: next.title, message: next.message, confirmLabel: next.confirmLabel, cancelLabel: next.cancelLabel, tone: next.tone } : null);
  };

  return {
    request: (options) =>
      new Promise<boolean>((resolve) => {
        const entry: Entry = { ...options, id: ++seq, resolve };
        if (current) waiting.push(entry);
        else show(entry);
      }),
    answer: (ok) => {
      const done = current;
      if (!done) return;
      done.resolve(ok);
      show(waiting.shift() ?? null);
    },
    dispose: () => {
      const done = current;
      current = null;
      done?.resolve(false);
      waiting.splice(0).forEach((e) => e.resolve(false));
    },
  };
}
