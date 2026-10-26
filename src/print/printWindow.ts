/**
 * Ouverture d'une fenêtre d'impression aux couleurs de la charte (sans script ni
 * CDN dans le document imprimé). Les feuilles
 * de style de l'application sont recopiées (adresses absolues), ce qui permet
 * d'imprimer tel quel un aperçu rendu à l'écran (cartes, fiches) ; plus aucune
 * dépendance au CDN Tailwind.
 *
 * Sécurité (C-01) : le titre est échappé ici ; tout autre fragment de `body`
 * doit être déjà sûr (HTML produit par React, ou valeurs passées par escapeHtml).
 */
import { escapeHtml } from "../security/html";

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
      html += '<link rel="stylesheet" href="' + escapeHtml(new URL(node.getAttribute("href") || "", window.location.href).href) + '" />';
    } else {
      html += "<style>" + (node.textContent || "") + "</style>";
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

/**
 * Document HTML complet d'une impression (testable sans fenêtre). Assemblé par
 * concaténation de fragments de confiance : constantes de ce module, styles de
 * l'application, titre échappé, et `body` déjà sûr (contrat de l'appelant).
 */
export function printDocument({ title, body, css = "", withAppStyles }: Pick<PrintOptions, "title" | "body" | "css" | "withAppStyles">): string {
  return [
    '<!doctype html><html dir="rtl" lang="ar" data-theme="bleu-nuit"><head><meta charset="utf-8" />',
    "<title>" + escapeHtml(title) + "</title>",
    PRINT_FONTS,
    withAppStyles ? appStylesHtml() : "",
    "<style>" + PRINT_BASE_CSS + css + "</style>",
    "</head><body>",
    body,
    "</body></html>",
  ].join("");
}

export function openPrintWindow(opts: PrintOptions): Window | null {
  const w = window.open("", "_blank");
  if (!w) {
    alert(opts.blockedMessage);
    return null;
  }
  // Aucun script dans le document imprimé (CSP stricte possible) : c'est la
  // fenêtre de l'application qui déclenche l'impression, une fois le document
  // et ses polices chargés.
  w.document.write(printDocument(opts));
  w.document.close();
  const delay = Math.max(0, Math.round(opts.delay ?? 900));
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    window.setTimeout(() => {
      if (w.closed) return;
      w.focus();
      w.print();
      if (opts.closeAfter !== false) window.setTimeout(() => w.close(), 500);
    }, delay);
  };
  const whenFonts = () => {
    const fonts = (w.document as any).fonts;
    if (fonts && fonts.ready) fonts.ready.then(go, go);
    else go();
  };
  if (w.document.readyState === "complete") whenFonts();
  else w.addEventListener("load", whenFonts);
  return w;
}
