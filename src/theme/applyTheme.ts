/**
 * Application du thème de couleur (D84) : attribut `data-theme` sur <html>
 * (les variables CSS de src/theme/themes.css suivent) et
 * `<meta name="theme-color">` (couleur de la barre latérale).
 */
import { useEffect } from "react";
import { readLastTheme, readSchoolTheme, rememberLastTheme, rememberSchoolTheme } from "../cache/localCache";
import { getTheme, resolveThemeId, type ThemeId } from "./palettes";

export const THEME_ATTRIBUTE = "data-theme";

/**
 * Applique un thème (valeur inconnue ou absente : thème par défaut, D96). `remember` :
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
 * Thème à appliquer pour l'école active (pur). Des paramètres SANS thème sont
 * soit ceux d'une école qui n'en a jamais choisi (défaut), soit les valeurs
 * par défaut chargées à la connexion avant la réponse de Firestore : dans ce
 * second cas, le dernier thème connu de l'école sur l'appareil évite un flash
 * vert. Le sélecteur écrit toujours un thème, donc une école qui en a choisi
 * un le renvoie dès que Firestore répond.
 */
export function schoolThemeToApply(
  schoolId: string | null | undefined,
  settings: { theme?: string } | null | undefined,
  rememberedForSchool: string | null,
): ThemeId | null {
  if (!schoolId || !settings) return null;
  if (settings.theme) return resolveThemeId(settings.theme);
  return resolveThemeId(rememberedForSchool);
}

/**
 * Thème de l'école active : appliqué dès que ses paramètres sont chargés (cache
 * cloisonné puis Firestore) et à chaque changement d'école. Sans école active,
 * le thème courant est conservé.
 */
export function useSchoolTheme(schoolId: string | null | undefined, settings: { theme?: string } | null | undefined): void {
  const explicit = settings?.theme ? resolveThemeId(settings.theme) : null;
  const theme = schoolThemeToApply(schoolId, settings, schoolId ? readSchoolTheme(schoolId) : null);
  useEffect(() => {
    if (!theme || !schoolId) return;
    applyTheme(theme);
    if (explicit) rememberSchoolTheme(schoolId, explicit);
  }, [theme, schoolId, explicit]);
}
