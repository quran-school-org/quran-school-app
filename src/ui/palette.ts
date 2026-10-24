/**
 * Couleur de l'interface choisie par la personne (D86) : bleu de la charte ou
 * vert à l'essai. Gardée sur cet appareil, hors du cache cloisonné par école
 * (`kuttab:*`, vidé à la déconnexion).
 */
export type Palette = "bleu" | "vert";

const KEY = "kuttab-ui:palette";
const THEME_COLOR: Record<Palette, string> = { bleu: "#102446", vert: "#0F3326" };

export function readPalette(): Palette {
  try {
    return localStorage.getItem(KEY) === "vert" ? "vert" : "bleu";
  } catch {
    return "bleu";
  }
}

export function applyPalette(palette: Palette) {
  const root = document.documentElement;
  if (palette === "vert") root.dataset.palette = "vert";
  else delete root.dataset.palette;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[palette]);
}

export function savePalette(palette: Palette) {
  try {
    localStorage.setItem(KEY, palette);
  } catch {
    // Stockage refusé (navigation privée) : le choix vaut pour la session.
  }
  applyPalette(palette);
}
