/**
 * Couche de traduction française (D79, rendue disponible en production par D93).
 *
 * Ce dossier garde son nom d'origine (`i18n-test`) pour limiter le diff ; il
 * ne s'agit plus d'un test. Chargé UNIQUEMENT par import dynamique depuis
 * src/i18n/language.ts, quand l'utilisateur choisit le français : un chunk
 * séparé, absent du bundle principal. Couche purement d'affichage, posée sur
 * le DOM rendu par React : aucune donnée, aucune valeur de rôle ni de
 * <select> n'est modifiée. La langue choisie et le sélecteur vivent dans
 * src/i18n/language.ts et src/ui/LanguageSetting.tsx.
 */
import "./fr.css";
import { createDomTranslator } from "./dom";
import { KEEP_ARABIC } from "./exclusions";
import { FR } from "./fr";
import type { Lang } from "../i18n/language";
import { createTranslator } from "./translate";

const translator = createTranslator(FR, Object.keys(KEEP_ARABIC));

const missingLog = (s: string) => {
  // Développement seulement (npm run dev) : liste des chaînes sans traduction, une fois chacune.
  if (import.meta.env.DEV) console.debug("[i18n] sans traduction :", s);
};

const dom = createDomTranslator(translator, () => [document.body], missingLog);

/** Boîtes de dialogue natives (alert / confirm / prompt) : seul le message est traduit. */
const nativeDialogs = { alert: window.alert, confirm: window.confirm, prompt: window.prompt };
const tr = (m: unknown) => (typeof m === "string" ? translator.translate(m) ?? m : m);

function patchDialogs(on: boolean) {
  if (on) {
    window.alert = (m?: unknown) => nativeDialogs.alert.call(window, tr(m));
    window.confirm = (m?: string) => nativeDialogs.confirm.call(window, tr(m) as string);
    window.prompt = (m?: string, d?: string) => nativeDialogs.prompt.call(window, tr(m) as string, d);
  } else {
    Object.assign(window, nativeDialogs);
  }
}

export function applyLang(lang: Lang) {
  const html = document.documentElement;
  if (lang === "fr") {
    html.setAttribute("lang", "fr");
    html.setAttribute("dir", "ltr");
    patchDialogs(true);
    dom.start();
  } else {
    dom.stop();
    patchDialogs(false);
    html.setAttribute("lang", "ar");
    html.setAttribute("dir", "rtl");
  }
}

// Diagnostic (tests e2e, console) : chaînes rencontrées sans traduction.
(window as unknown as { __frTestMissing?: Set<string> }).__frTestMissing = dom.missing;
