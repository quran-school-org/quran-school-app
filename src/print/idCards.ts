/**
 * Impression des cartes d'élève (à l'unité ou par lot) : l'aperçu rendu à
 * l'écran (HTML produit par React, donc échappé) est imprimé avec les styles
 * de l'application, à l'échelle choisie. Plus de CDN Tailwind.
 */
const HIDE_BACK = '[id*="-back-"], [id*="-back"] { display: none !important; }';
const HIDE_FRONT = '[id*="-front-"], [id*="-front"] { display: none !important; }';

/** Feuille propre aux cartes : marges, recto / verso seul, sans coupure. */
export function idCardsCss(printSide: "both" | "front" | "back", mode: "single" | "bulk"): string {
  const page = mode === "single" ? "@page { margin: 0; size: auto; }" : "@page { margin: 1cm; size: auto; }";
  const side = printSide === "front" ? HIDE_BACK : printSide === "back" ? HIDE_FRONT : "";
  return (
    page +
    " body { background: #fff; margin: 0; padding: " + (mode === "single" ? "0" : "1cm") + "; }" +
    " .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }" +
    " @media print { body { padding: 0; } " + side + " }" +
    (side ? " " + side : "")
  );
}

export function singleCardHtml(labScale: number, printContent: HTMLElement): string {
  return `
        <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
          <div style="transform: scale(${labScale}); transform-origin: center center; display: flex; justify-content: center; align-items: center; gap: 24px; padding: 20px;">
            ${printContent.innerHTML}
          </div>
        </main>
  `;
}

export function bulkCardsHtml(labScale: number, printContent: HTMLElement): string {
  return `
        <main style="transform: scale(${labScale}); transform-origin: top center; width: 100%;">
          ${printContent.innerHTML}
        </main>
  `;
}
