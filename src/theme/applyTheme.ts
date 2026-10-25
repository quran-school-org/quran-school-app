/**
 * Application du thème de couleur (D84) : attribut `data-theme` sur <html>
 * (les variables CSS de src/theme/themes.css suivent) et
 * `<meta name="theme-color">` (couleur de la barre latérale).
 */
import { useEffect } from "react";
import { readLastTheme, rememberLastTheme } from "../cache/localCache";
import { getTheme, resolveThemeId, type ThemeId } from "./palettes";

export const THEME_ATTRIBUTE = "data-theme";

/**
 * Applique un thème (valeur inconnue ou absente : thème par défaut, D88). `remember` :
 * le retenir comme dernier thème de l'appareil (faux pour un simple aperçu).
 */
export function applyTheme(value: unknown, { remember = true }: { remember?: boolean } = {}): ThemeId {
  const theme = getTheme(value);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme.id);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.base.night);
  }
  if (remember) rememberLastTheme(theme.id);
  return theme.id;
}

/** Au démarrage (connexion, rechargement) : dernier thème connu sur l'appareil. */
export function applyLastKnownTheme(): ThemeId {
  return applyTheme(readLastTheme(), { remember: false });
}

/**
 * Thème de l'école active : appliqué dès que ses paramètres sont chargés (cache
 * cloisonné puis Firestore) et à chaque changement d'école. `settings` nul
 * (pas d'école active) : le thème courant est conservé.
 */
export function useSchoolTheme(settings: { theme?: string } | null | undefined): void {
  const theme = settings ? resolveThemeId(settings.theme) : null;
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);
}
