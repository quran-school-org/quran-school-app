/**
 * Confirmation de la charte (D99), construite sur `Modal` : remplace la boîte de confirmation native.
 * Un seul `ConfirmProvider` est monté à la racine (src/main.tsx) ; l'appel est une promesse :
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "تأكيد الحذف", message: "…", confirmLabel: "حذف", tone: "danger" })) { … }
 *
 * - `tone: "danger"` (suppressions) : bouton rouge plein, focus initial sur « إلغاء » ;
 *   sinon le focus initial est sur le bouton de confirmation.
 * - Échap, « إلغاء » et la croix répondent `false` ; seule la confirmation répond `true`.
 * - Plusieurs demandes simultanées sont mises en file : une boîte à la fois.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { createConfirmQueue, type ConfirmOptions as QueueOptions, type PendingConfirm } from "./confirmQueue";

export type ConfirmOptions = QueueOptions<React.ReactNode>;

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error("useConfirm : ConfirmProvider absent (monté dans src/main.tsx).");
  return fn;
}

export function ConfirmDialog({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (ok: boolean) => void }) {
  const danger = options.tone === "danger";
  const cancelLabel = options.cancelLabel ?? "إلغاء";
  const confirmLabel = options.confirmLabel ?? (danger ? "حذف" : "تأكيد");
  return (
    <Modal
      modalId="confirm-dialog"
      size="sm"
      title={options.title ?? (danger ? "تأكيد الحذف" : "تأكيد")}
      icon={danger ? <AlertTriangle className="w-6 h-6" strokeWidth={1.75} /> : <HelpCircle className="w-6 h-6" strokeWidth={1.75} />}
      onClose={() => onAnswer(false)}
      footer={
        <>
          <Button data-autofocus={danger ? "" : undefined} data-action="confirm-cancel" onClick={() => onAnswer(false)}>{cancelLabel}</Button>
          <Button
            data-autofocus={danger ? undefined : ""}
            data-action="confirm-ok"
            variant={danger ? "danger-solid" : "primary"}
            onClick={() => onAnswer(true)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-[14.5px] text-ink leading-relaxed whitespace-pre-line">{options.message}</p>
    </Modal>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<PendingConfirm<React.ReactNode> | null>(null);
  const queue = useMemo(() => createConfirmQueue<React.ReactNode>(setCurrent), []);
  // Démontage : les demandes en attente sont refusées (rien n'est supprimé par défaut).
  useEffect(() => () => queue.dispose(), [queue]);
  const confirm = useCallback<ConfirmFn>((options) => queue.request(options), [queue]);
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {current && <ConfirmDialog key={current.id} options={current} onAnswer={queue.answer} />}
    </ConfirmContext.Provider>
  );
}
