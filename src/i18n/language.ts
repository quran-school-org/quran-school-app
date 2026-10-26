/**
 * Langue de l'interface (D93) : arabe (par défaut) ou français.
 *
 * Choix PERSONNEL, gardé sur l'appareil (localStorage, clé hors du cache
 * cloisonné par école : il survit au changement d'école et à la
 * déconnexion). Rien n'est écrit dans Firestore.
 *
 * Ce module est dans le bundle principal et reste minuscule : la couche de
 * traduction (src/i18n-test : dictionnaire, observateur du DOM) n'est
 * chargée, par import dynamique, que si l'utilisateur a choisi le français.
 */
import { useSyncExternalStore } from "react";

export type Lang = "ar" | "fr";

export const LANG_KEY = "ui:lang";

export function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "fr" ? "fr" : "ar";
  } catch {
    return "ar";
  }
}

function writeLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
}

let current: Lang = "ar";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

type Layer = typeof import("../i18n-test");
let layer: Promise<Layer> | null = null;
let layerReady: Layer | null = null;

function loadLayer(): Promise<Layer> {
  layer ??= import("../i18n-test").then((m) => (layerReady = m), (e) => {
    layer = null; // nouvelle tentative possible au prochain choix
    throw e;
  });
  return layer;
}

function setDocumentLang(lang: Lang) {
  const html = document.documentElement;
  html.setAttribute("lang", lang);
  html.setAttribute("dir", lang === "fr" ? "ltr" : "rtl");
}

/** Applique la langue à la page (charge la couche de traduction si besoin). */
async function apply(lang: Lang): Promise<void> {
  if (lang === "fr") {
    try {
      (await loadLayer()).applyLang("fr");
    } catch (e) {
      console.error("[i18n]", e);
      current = "ar";
      setDocumentLang("ar");
      emit();
    }
  } else if (layerReady) {
    layerReady.applyLang("ar");
  } else {
    setDocumentLang("ar");
  }
}

/** Au démarrage (src/main.tsx) : applique la dernière langue de l'appareil avant le premier rendu. */
export async function initLanguage(): Promise<void> {
  current = readLang();
  await apply(current);
}

/** Change la langue (immédiat) et la mémorise sur l'appareil. */
export async function setLanguage(lang: Lang): Promise<void> {
  if (lang === current) return;
  current = lang;
  writeLang(lang);
  emit();
  await apply(lang);
}

export function getLanguage(): Lang {
  return current;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribe, getLanguage, () => "ar" as Lang);
}
