/**
 * Feuille de style des documents imprimés (reçus, attestations, rapports),
 * aux couleurs de la charte « لوحة الكتّاب ». Constante sans interpolation :
 * aucune donnée n'y est insérée (C-01).
 */
export const EMBLEM_SVG =
  '<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><rect width="44" height="44" rx="10" fill="#102446"/>' +
  '<g transform="translate(22 22)"><rect x="-10" y="-10" width="20" height="20" fill="#D4A017"/><rect x="-10" y="-10" width="20" height="20" fill="#D4A017" transform="rotate(45)"/>' +
  '<circle r="6" fill="#102446"/><circle r="3" fill="#D4A017"/></g></svg>';

export const DOC_CSS = `
  @page { size: A4; margin: 14mm; }
  body { padding: 24px; font-size: 13px; line-height: 1.6; }
  @media print { body { padding: 0; } }
  .doc { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
  .doc-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #1B3A6B; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 56px; height: 56px; border: 1px solid #D9DBD0; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; padding: 4px; }
  .logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .brand h1 { margin: 0; font-size: 22px; color: #1B3A6B; }
  .brand p { margin: 2px 0 0; color: #4A5060; font-size: 12px; }
  .meta { text-align: left; font-size: 12px; color: #6B7080; }
  .meta strong { display: block; color: #1A1F2B; }
  .band { background: #102446; color: #EEF1F7; border-radius: 12px; padding: 12px 16px; text-align: center; }
  .band h2 { margin: 0; font-size: 18px; color: #F6EDD2; }
  .band p { margin: 4px 0 0; font-size: 12px; color: #B8C4D8; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #D9DBD0; border-radius: 14px; overflow: hidden; gap: 1px; background: #D9DBD0; }
  .kpi { background: #F8F8F3; padding: 12px 14px; }
  .kpi span { display: block; font-size: 12px; color: #4A5060; }
  .kpi strong { font-size: 20px; color: #1A1F2B; }
  .kpi.ok strong { color: #2F5523; }
  .kpi.ko strong { color: #A33A2E; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #D9DBD0; }
  table.grid th { background: #ECEDE6; color: #4A5060; font-weight: 600; padding: 8px; text-align: right; border-bottom: 1px solid #D9DBD0; }
  table.grid td { padding: 8px; border-bottom: 1px solid #E8EAE1; vertical-align: top; }
  table.grid tr { break-inside: avoid; }
  .c { text-align: center !important; }
  .muted { color: #6B7080; font-size: 11px; }
  .strong { font-weight: 700; }
  .accent { color: #1B3A6B; font-weight: 700; }
  .gold { color: #8A6400; }
  .pill { display: inline-block; padding: 1px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .pill.ok { background: #E4EDDC; color: #2F5523; }
  .pill.ko { background: #F5E2DE; color: #7A2A21; }
  .pill.warn { background: #F6EDD2; color: #5C4300; }
  .doc-foot { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid #D9DBD0; padding-top: 10px; color: #6B7080; font-size: 11px; }
  .ltr { direction: ltr; unicode-bidi: isolate; }
  .stamp { display: inline-block; border: 1.5px dashed #A33A2E; color: #A33A2E; border-radius: 999px; padding: 4px 14px; font-weight: 700; font-size: 12px; transform: rotate(-3deg); }
`;
