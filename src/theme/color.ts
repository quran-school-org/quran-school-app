/**
 * Calculs de couleur purs (sans DOM) pour les thèmes de l'école (D84) :
 * conversion sRGB ↔ OKLCH, transposition d'une nuance d'une palette vers une
 * autre, contraste WCAG 2.x.
 */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`couleur invalide : ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0").toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}`;
}

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** Luminance relative WCAG 2.x. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG 2.x (1 à 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface Oklch { l: number; c: number; h: number }

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** OKLCH → hex ; la chroma est réduite jusqu'à entrer dans le gamut sRGB. */
export function oklchToHex(color: Oklch): string {
  let c = color.c;
  for (let i = 0; i < 40; i++) {
    const lin = oklchToLinear({ ...color, c });
    if (lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) return rgbToHex(lin.map(fromLinear) as Rgb);
    c *= 0.95;
  }
  return rgbToHex(oklchToLinear({ ...color, c: 0 }).map(fromLinear) as Rgb);
}

/**
 * Transpose `shade`, nuance de la couleur de référence `from`, vers la couleur
 * `to` : même écart de teinte, chroma à la même proportion, luminosité
 * recalée (les nuances plus claires restent entre la base et le blanc, les
 * plus sombres entre le noir et la base). Si `to` = `from`, la nuance est
 * rendue telle quelle (thème de référence inchangé au pixel près).
 */
export function transposeShade(shade: string, from: string, to: string): string {
  if (from.toUpperCase() === to.toUpperCase()) return shade.toUpperCase();
  const s = hexToOklch(shade);
  const f = hexToOklch(from);
  const t = hexToOklch(to);
  const l = s.l >= f.l
    ? t.l + (s.l - f.l) * ((1 - t.l) / (1 - f.l))
    : s.l * (t.l / f.l);
  const c = f.c > 1e-4 ? s.c * (t.c / f.c) : s.c;
  return oklchToHex({ l: Math.min(1, Math.max(0, l)), c, h: (s.h + (t.h - f.h) + 360) % 360 });
}

/**
 * Teinte un gris : même luminosité et même chroma que `shade` (donc même
 * contraste), teinte déplacée comme celle de la couleur de base de `from` vers
 * `to`. Sert aux gris du texte (`ink*`, `sand-500…950`), qui dérivent de la
 * couleur de la barre latérale sans changer de valeur de gris (D101). Identité
 * si `to` = `from`.
 */
export function tintGray(shade: string, from: string, to: string): string {
  if (from.toUpperCase() === to.toUpperCase()) return shade.toUpperCase();
  const s = hexToOklch(shade);
  const f = hexToOklch(from);
  const t = hexToOklch(to);
  const c = f.c > 1e-4 ? s.c * Math.min(1.25, t.c / f.c) : s.c;
  return oklchToHex({ l: s.l, c, h: (s.h + (t.h - f.h) + 360) % 360 });
}

/**
 * Éloigne `hex` de `background` (plus clair sur fond sombre, plus sombre sur
 * fond clair), à teinte et chroma constantes, jusqu'au contraste `min`.
 */
export function ensureContrast(hex: string, background: string, min: number): string {
  if (contrast(hex, background) >= min) return hex;
  const base = hexToOklch(hex);
  const lighter = luminance(background) < luminance(hex);
  for (let step = 1; step <= 100; step++) {
    const l = lighter ? Math.min(1, base.l + step * 0.005) : Math.max(0, base.l - step * 0.005);
    const candidate = oklchToHex({ ...base, l });
    if (contrast(candidate, background) >= min) return candidate;
  }
  return lighter ? "#FFFFFF" : "#000000";
}

/** Composantes « r, g, b » d'une couleur hexadécimale (pour rgba()). */
export function rgbTriplet(hex: string): string {
  return hexToRgb(hex).join(", ");
}
