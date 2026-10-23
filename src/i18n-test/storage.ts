/**
 * Langue choisie (préférence du navigateur, D79). Clé propre au module,
 * hors des préfixes vidés à la déconnexion (`kuttab:`, `alfajr_`) : le
 * choix survit à une déconnexion. Accès protégés (navigation privée, stockage bloqué).
 */
export type Lang = "ar" | "fr";

export const LANG_KEY = "i18n-test:lang";

export function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "fr" ? "fr" : "ar";
  } catch {
    return "ar";
  }
}

export function writeLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Stockage indisponible : le choix vaut pour la page en cours seulement.
  }
}
