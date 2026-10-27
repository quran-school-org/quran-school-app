/**
 * Thèmes de couleur de l'école (D84) : palette « لوحة الكتّاب » en bleu nuit
 * (référence, valeurs de `src/index.css`) et quatre palettes vertes. Chaque
 * thème est défini par quatre couleurs de base ; les nuances secondaires sont
 * transposées depuis la palette de référence (`transposeShade`).
 *
 * Le fichier `src/theme/themes.css` est GÉNÉRÉ à partir de ce module :
 *   npx tsx scripts/dev/gen-theme-css.ts
 * (le test `tests/unit/themes.test.ts` échoue s'il n'est plus à jour).
 */
import { contrast, ensureContrast, rgbTriplet, tintGray, transposeShade } from "./color";

export const THEME_IDS = ["bleu-nuit", "emeraude", "sauge", "foret", "olive"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
/** Thème des écoles qui n'en ont pas choisi : bleu nuit, la charte (D96). */
export const DEFAULT_THEME: ThemeId = "bleu-nuit";

/** Couleurs de base d'un thème (charte « لوحة الكتّاب »). */
export interface ThemeBase {
  /** Barre latérale, encre des chiffres clés. */
  night: string;
  /** Couleur principale (boutons, titres, liens). */
  primary: string;
  /** Or (accent). */
  gold: string;
  /** Fond de l'application (sable). */
  app: string;
}

export interface ThemeDef {
  id: ThemeId;
  /** Nom affiché (arabe). */
  name: string;
  base: ThemeBase;
}

export const THEMES: readonly ThemeDef[] = [
  { id: "bleu-nuit", name: "الأزرق الليلي", base: { night: "#102446", primary: "#1B3A6B", gold: "#D4A017", app: "#ECEDE6" } },
  { id: "emeraude", name: "الزمردي والذهبي", base: { night: "#0E3B2E", primary: "#1F6F4A", gold: "#C9A227", app: "#EFEFE6" } },
  { id: "sauge", name: "الأخضر الرمادي والنحاسي", base: { night: "#1E3A34", primary: "#2F6B5E", gold: "#D4A017", app: "#EEF0EA" } },
  { id: "foret", name: "أخضر الغابة", base: { night: "#0B2A1E", primary: "#166534", gold: "#E0B84C", app: "#EDEFE9" } },
  { id: "olive", name: "الزيتوني والرملي", base: { night: "#2E3A1F", primary: "#4D5E26", gold: "#D9B05A", app: "#F2EFE6" } },
];

const REFERENCE = THEMES[0].base;

/** Identifiant valide, ou le thème par défaut (champ absent, valeur inconnue). */
export function resolveThemeId(value: unknown): ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value) ? (value as ThemeId) : DEFAULT_THEME;
}

export function getTheme(value: unknown): ThemeDef {
  const id = resolveThemeId(value);
  return THEMES.find((t) => t.id === id)!;
}

/**
 * Jetons de couleur qui changent avec le thème : valeur de référence (bleu
 * nuit, identique à `@theme` dans `src/index.css`) et couleur de base dont
 * ils dérivent. `= base` : la nuance est la couleur de base elle-même.
 * L'échelle `gold-50…300` / `gold-600…950` n'est PAS dans la liste : elle sert
 * aussi d'ambre sémantique (« moyen », avertissements) et reste commune.
 */
type Source = keyof ThemeBase;
const TOKENS: Record<string, { ref: string; from: Source; same?: boolean; /** Gris teinté : même luminosité, teinte de la base (`tintGray`). */ tint?: boolean }> = {
  app: { ref: "#ECEDE6", from: "app", same: true },

  night: { ref: "#102446", from: "night", same: true },
  "night-2": { ref: "#1B2F55", from: "night" },
  "night-line": { ref: "#2E4A78", from: "night" },
  "night-line-2": { ref: "#2B4470", from: "night" },
  "night-text": { ref: "#EEF1F7", from: "night" },
  "night-muted": { ref: "#B8C4D8", from: "night" },
  "night-label": { ref: "#8FA0BD", from: "night" },
  "night-link": { ref: "#C9D3E3", from: "night" },
  "night-soft": { ref: "#A9B6CC", from: "night" },
  "night-dim": { ref: "#7586A3", from: "night" },
  "night-tick": { ref: "#3A5785", from: "night" },

  primary: { ref: "#1B3A6B", from: "primary", same: true },
  "primary-hover": { ref: "#102446", from: "night", same: true },
  "primary-50": { ref: "#EEF2F8", from: "primary" },
  "primary-100": { ref: "#E3E9F2", from: "primary" },
  "primary-200": { ref: "#C9D5E6", from: "primary" },
  "primary-300": { ref: "#9FB3D1", from: "primary" },
  "primary-400": { ref: "#5B7FB0", from: "primary" },
  "primary-500": { ref: "#3A5E92", from: "primary" },
  "primary-600": { ref: "#1B3A6B", from: "primary", same: true },
  "primary-700": { ref: "#1B3A6B", from: "primary", same: true },
  "primary-800": { ref: "#142D55", from: "primary" },
  "primary-900": { ref: "#102446", from: "night", same: true },
  "primary-950": { ref: "#0B1A34", from: "night" },

  gold: { ref: "#D4A017", from: "gold", same: true },
  "gold-400": { ref: "#D4A017", from: "gold", same: true },
  "gold-500": { ref: "#D4A017", from: "gold", same: true },
  "gold-light": { ref: "#FFE08A", from: "gold" },
  "gold-glow": { ref: "#FFF7DD", from: "gold" },
  "gold-pale": { ref: "#FFF2C7", from: "gold" },

  // Gris du texte et neutres foncés : mêmes luminosités qu'en bleu nuit, teinte de la barre
  // latérale du thème (en émeraude, le texte n'est plus bleuté). `ink-4` et `sand-50…400`
  // sont des gris chauds (teinte jaune-vert) : communs à tous les thèmes.
  ink: { ref: "#1A1F2B", from: "night", tint: true },
  "ink-2": { ref: "#4A5060", from: "night", tint: true },
  "ink-3": { ref: "#626777", from: "night", tint: true },
  "sand-500": { ref: "#6B7080", from: "night", tint: true },
  "sand-600": { ref: "#4A5060", from: "night", tint: true },
  "sand-700": { ref: "#3A4050", from: "night", tint: true },
  "sand-800": { ref: "#2A3040", from: "night", tint: true },
  "sand-900": { ref: "#1A1F2B", from: "night", tint: true },
  "sand-950": { ref: "#12161F", from: "night", tint: true },
};

/**
 * Fonds clairs communs à tous les thèmes (`surface`, `surface-2`, `sunken`, `quiet` de
 * `src/index.css`) sur lesquels le texte gris est posé ; `tests/unit/themes.test.ts`
 * vérifie qu'ils égalent les valeurs de la feuille de style.
 */
export const NEUTRAL_BACKGROUNDS = { surface: "#F8F8F3", "surface-2": "#F1F2EB", sunken: "#E6E8DF", quiet: "#EEEFE8" } as const;
/** Gris utilisés comme texte : leur contraste sur les fonds sable est gardé à 4,5:1 dans chaque thème. */
const TEXT_GRAYS = new Set(["ink", "ink-2", "ink-3", "sand-500", "sand-600", "sand-700", "sand-800", "sand-900", "sand-950"]);

export type ThemeToken = keyof typeof TOKENS;
export const THEME_TOKEN_NAMES = Object.keys(TOKENS) as ThemeToken[];

/** Valeurs de référence (bleu nuit) de chaque jeton : doivent égaler `@theme`. */
export const REFERENCE_TOKENS: Record<string, string> = Object.fromEntries(
  THEME_TOKEN_NAMES.map((name) => [name, TOKENS[name].ref]),
);

/** Seuil WCAG AA du texte courant. */
export const TEXT_CONTRAST_MIN = 4.5;

/**
 * Jetons de couleur complets d'un thème. Garde-fou de lisibilité : une nuance
 * dérivée qui atteint 4,5:1 sur blanc ou sur la barre latérale dans la
 * palette de référence (donc susceptible de servir de texte) l'atteint aussi
 * dans le thème.
 */
export function themeTokens(value: unknown): Record<string, string> {
  const { base } = getTheme(value);
  return Object.fromEntries(
    THEME_TOKEN_NAMES.map((name) => {
      const t = TOKENS[name];
      if (t.same) return [name, base[t.from].toUpperCase()];
      if (t.tint) {
        let gray = tintGray(t.ref, REFERENCE[t.from], base[t.from]);
        if (TEXT_GRAYS.has(name)) {
          for (const bg of [base.app, ...Object.values(NEUTRAL_BACKGROUNDS)]) {
            if (contrast(t.ref, bg) >= TEXT_CONTRAST_MIN) gray = ensureContrast(gray, bg, TEXT_CONTRAST_MIN);
          }
        }
        return [name, gray];
      }
      let shade = transposeShade(t.ref, REFERENCE[t.from], base[t.from]);
      if (contrast(t.ref, "#FFFFFF") >= TEXT_CONTRAST_MIN) shade = ensureContrast(shade, "#FFFFFF", TEXT_CONTRAST_MIN);
      if (contrast(t.ref, REFERENCE.night) >= TEXT_CONTRAST_MIN) shade = ensureContrast(shade, base.night, TEXT_CONTRAST_MIN);
      return [name, shade];
    }),
  );
}

/** Bloc CSS d'un thème : variables `--color-*`, ombres et sélection. */
export function themeCss(def: ThemeDef): string {
  const tokens = themeTokens(def.id);
  const night = rgbTriplet(tokens.night);
  const gold = rgbTriplet(tokens.gold);
  const lines = THEME_TOKEN_NAMES.map((name) => `  --color-${name}: ${tokens[name]};`);
  lines.push(`  --shadow-toast: 0 10px 30px rgba(${night}, 0.25);`);
  lines.push(`  --shadow-pop: 0 12px 32px rgba(${night}, 0.16);`);
  return [
    `/* ${def.id} : ${def.name} */`,
    `[data-theme="${def.id}"] {`,
    ...lines,
    `}`,
    `[data-theme="${def.id}"] ::selection {`,
    `  background: rgba(${gold}, 0.35);`,
    `}`,
  ].join("\n");
}

/** Contenu complet de `src/theme/themes.css`. */
export function themesStylesheet(): string {
  return [
    "/*",
    " * FICHIER GÉNÉRÉ par scripts/dev/gen-theme-css.ts depuis src/theme/palettes.ts",
    " * (D84). Ne pas modifier à la main : relancer `npx tsx scripts/dev/gen-theme-css.ts`.",
    " * Le bloc bleu-nuit répète les valeurs de @theme (src/index.css) : il sert aux",
    " * éléments qui gardent la charte d'origine quel que soit le thème (cartes d'élève).",
    " */",
    ...THEMES.map(themeCss),
    "",
  ].join("\n");
}
