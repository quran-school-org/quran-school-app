/**
 * Ouverture d'une fenêtre d'impression aux couleurs de la charte. Les feuilles
 * de style de l'application sont recopiées (adresses absolues), ce qui permet
 * d'imprimer tel quel un aperçu rendu à l'écran (cartes, fiches) ; plus aucune
 * dépendance au CDN Tailwind.
 */

export const PRINT_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com" /><link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />';

export const PRINT_BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; background: #ffffff; color: #1A1F2B; direction: rtl; }
  body { font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif; font-variant-numeric: tabular-nums;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, h2, h3, .display { font-family: 'Reem Kufi', 'IBM Plex Sans Arabic', sans-serif; }
  .no-print { }
  @media print { .no-print { display: none !important; } }
`;

/** Feuilles de style de l'application (pour imprimer un aperçu rendu à l'écran). */
export function appStylesHtml(): string {
  let html = "";
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    if (node instanceof HTMLLinkElement) {
      html += `<link rel="stylesheet" href="${new URL(node.getAttribute("href") || "", window.location.href).href}" />`;
    } else {
      html += `<style>${node.textContent || ""}</style>`;
    }
  });
  return html;
}

export interface PrintOptions {
  title: string;
  body: string;
  css?: string;
  /** Recopier les styles de l'application (aperçus rendus à l'écran). */
  withAppStyles?: boolean;
  /** Message si le navigateur bloque la fenêtre. */
  blockedMessage: string;
  /** Délai avant l'impression (chargement des polices et images). */
  delay?: number;
  closeAfter?: boolean;
}

/** Document HTML complet d'une impression (testable sans fenêtre). */
export function printDocument({ title, body, css = "", withAppStyles }: Pick<PrintOptions, "title" | "body" | "css" | "withAppStyles">): string {
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><title>${title}</title>${PRINT_FONTS}${withAppStyles ? appStylesHtml() : ""}<style>${PRINT_BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

export function openPrintWindow(opts: PrintOptions): Window | null {
  const w = window.open("", "_blank");
  if (!w) {
    alert(opts.blockedMessage);
    return null;
  }
  const delay = opts.delay ?? 900;
  const after = opts.closeAfter === false ? "" : "setTimeout(function(){ window.close(); }, 500);";
  const script = `<script>window.addEventListener('load', function(){ var go=function(){ setTimeout(function(){ window.print(); ${after} }, ${delay}); }; if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); } });<\/script>`;
  w.document.write(printDocument(opts).replace("</body>", `${script}</body>`));
  w.document.close();
  return w;
}
