/**
 * Sens de lecture EFFECTIF d'un élément (propriété CSS `direction`).
 *
 * L'attribut `dir` ne suffit pas : la couche de test FR (D79) garde les
 * `dir="rtl"` du code et inverse seulement la direction CSS. Le sens est relu
 * quand `lang` ou `dir` de <html> change (bascule AR / FR).
 */
import { useEffect, useState, type RefObject } from "react";

export type Direction = "rtl" | "ltr";

export function readDirection(el: Element | null | undefined): Direction {
  if (!el || typeof window === "undefined") return typeof document !== "undefined" && document.documentElement.dir === "ltr" ? "ltr" : "rtl";
  return window.getComputedStyle(el).direction === "ltr" ? "ltr" : "rtl";
}

export function useDirection(ref: RefObject<Element | null>): Direction {
  const [dir, setDir] = useState<Direction>("rtl");
  useEffect(() => {
    const update = () => setDir(readDirection(ref.current));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    return () => obs.disconnect();
  }, [ref]);
  return dir;
}
