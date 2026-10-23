/**
 * Traduction française TEMPORAIRE, pour les tests du propriétaire (D79).
 *
 * Chargé uniquement si VITE_ENABLE_FR_TEST=true (import dynamique depuis
 * src/main.tsx) : absent du bundle de production. Couche purement
 * d'affichage, posée sur le DOM rendu par React : aucune donnée, aucune
 * valeur de rôle ni de <select> n'est modifiée.
 *
 * Retrait (procédure complète dans docs/DECISIONS.md, D79) : supprimer ce
 * dossier, l'import dans src/main.tsx et le drapeau VITE_ENABLE_FR_TEST.
 */
import "./fr.css";
import { createDomTranslator } from "./dom";
import { KEEP_ARABIC } from "./exclusions";
import { FR } from "./fr";
import { readLang, writeLang, type Lang } from "./storage";
import { mountSwitcher } from "./switcher";
import { createTranslator } from "./translate";

const translator = createTranslator(FR, Object.keys(KEEP_ARABIC));

const missingLog = (s: string) => {
  // Développement seulement (npm run dev) : liste des chaînes sans traduction, une fois chacune.
  if (import.meta.env.DEV) console.debug("[i18n-test] sans traduction :", s);
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

let current: Lang = "ar";

export function applyLang(lang: Lang) {
  current = lang;
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

export function installFrTest() {
  applyLang(readLang());
  mountSwitcher(() => current, (lang) => {
    writeLang(lang);
    applyLang(lang);
  });
  // Diagnostic (tests e2e, console) : chaînes rencontrées sans traduction.
  (window as unknown as { __frTestMissing?: Set<string> }).__frTestMissing = dom.missing;
}
