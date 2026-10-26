/**
 * Retours à l'utilisateur (D99) : logique de `Toast` (liste, durées, canal hors React) et
 * file de `ConfirmDialog` (une boîte à la fois, réponse par promesse).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { TOAST_DURATION, TOAST_MAX, pushToast, type ToastItem } from "../../src/ui/Toast";
import { createConfirmQueue, type PendingConfirm } from "../../src/ui/confirmQueue";
import { emitToast, subscribeToasts } from "../../src/ui/toastBus";

const toast = (id: number, message: string, variant: ToastItem["variant"] = "success"): ToastItem => ({ id, variant, message });

describe("Toast : liste et durées", () => {
  it("l'erreur reste plus longtemps affichée que le succès et l'information", () => {
    expect(TOAST_DURATION.error).toBeGreaterThan(TOAST_DURATION.success);
    expect(TOAST_DURATION.info).toBe(TOAST_DURATION.success);
  });

  it("un message identique est remplacé, pas empilé ; une variante différente est conservée", () => {
    let list: ToastItem[] = [];
    list = pushToast(list, toast(1, "تم الحفظ"));
    list = pushToast(list, toast(2, "تم الحفظ"));
    expect(list.map((t) => t.id)).toEqual([2]);
    list = pushToast(list, toast(3, "تم الحفظ", "error"));
    expect(list.map((t) => t.id)).toEqual([2, 3]);
  });

  it("au plus TOAST_MAX messages : les plus anciens partent d'abord", () => {
    let list: ToastItem[] = [];
    for (let i = 1; i <= TOAST_MAX + 2; i++) list = pushToast(list, toast(i, `رسالة ${i}`));
    expect(list).toHaveLength(TOAST_MAX);
    expect(list[0].id).toBe(3);
    expect(list[list.length - 1].id).toBe(TOAST_MAX + 2);
  });

  it("le canal hors React (fenêtre d'impression bloquée) livre le message aux abonnés, jusqu'au désabonnement", () => {
    const seen: string[] = [];
    const off = subscribeToasts((variant, message) => seen.push(`${variant}:${message}`));
    emitToast("error", "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
    off();
    emitToast("error", "ignoré");
    expect(seen).toEqual(["error:يرجى السماح بالنوافذ المنبثقة لطباعة التقرير."]);
  });

  it("l'impression ne passe plus par une boîte native : le message de fenêtre bloquée part sur le canal", () => {
    const src = readFileSync("src/print/printWindow.ts", "utf8");
    expect(src).toContain('emitToast("error", opts.blockedMessage)');
  });
});

describe("ConfirmDialog : file des demandes", () => {
  const harness = () => {
    const shown: Array<PendingConfirm | null> = [];
    const queue = createConfirmQueue((c) => shown.push(c));
    return { queue, shown, last: () => shown[shown.length - 1] };
  };

  it("la confirmation répond true, l'annulation répond false, la boîte se ferme", async () => {
    const { queue, last } = harness();
    const yes = queue.request({ message: "حذف ؟", tone: "danger" });
    expect(last()?.message).toBe("حذف ؟");
    queue.answer(true);
    await expect(yes).resolves.toBe(true);
    expect(last()).toBeNull();

    const no = queue.request({ message: "حذف ؟" });
    queue.answer(false);
    await expect(no).resolves.toBe(false);
  });

  it("une seule boîte à la fois : la deuxième demande attend la réponse à la première", async () => {
    const { queue, last } = harness();
    const first = queue.request({ message: "الأولى" });
    const second = queue.request({ message: "الثانية" });
    expect(last()?.message).toBe("الأولى");
    queue.answer(true);
    await expect(first).resolves.toBe(true);
    expect(last()?.message).toBe("الثانية");
    queue.answer(false);
    await expect(second).resolves.toBe(false);
    expect(last()).toBeNull();
  });

  it("répondre sans demande affichée ne fait rien", () => {
    const { queue, shown } = harness();
    queue.answer(true);
    expect(shown).toEqual([]);
  });

  it("démontage : la demande affichée et celles en attente sont refusées (rien n'est supprimé)", async () => {
    const { queue } = harness();
    const a = queue.request({ message: "أ", tone: "danger" });
    const b = queue.request({ message: "ب", tone: "danger" });
    queue.dispose();
    await expect(a).resolves.toBe(false);
    await expect(b).resolves.toBe(false);
  });

  it("les options (titre, libellés, ton) sont transmises à l'affichage ; chaque demande a son identifiant", () => {
    const { queue, shown } = harness();
    const spy = vi.fn();
    void queue.request({ title: "تأكيد الاسترجاع", message: "م", confirmLabel: "استرجاع", cancelLabel: "تراجع", tone: "danger" }).then(spy);
    const c = shown[0]!;
    expect([c.title, c.confirmLabel, c.cancelLabel, c.tone]).toEqual(["تأكيد الاسترجاع", "استرجاع", "تراجع", "danger"]);
    queue.answer(false);
    void queue.request({ message: "ثانية" });
    expect(shown[shown.length - 1]!.id).not.toBe(c.id);
  });
});

describe("branchement", () => {
  it("ToastProvider et ConfirmProvider sont montés une seule fois, à la racine (src/main.tsx), au-dessus de l'écran de connexion et du choix d'école", () => {
    const main = readFileSync("src/main.tsx", "utf8");
    expect(main.match(/<ToastProvider>/g)).toHaveLength(1);
    expect(main.match(/<ConfirmProvider>/g)).toHaveLength(1);
    expect(main.indexOf("<ToastProvider>")).toBeLessThan(main.indexOf("<App />"));
  });
});
