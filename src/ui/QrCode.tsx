/**
 * Code QR généré localement (bibliothèque `qrcode`, sans appel réseau), rendu
 * en SVG en ligne : il s'affiche à l'écran et s'imprime tel quel (aperçus
 * recopiés dans les fenêtres d'impression). Constat O-05 : plus aucune donnée
 * d'élève ou de membre du personnel n'est envoyée à un service tiers.
 */
import React, { useMemo } from "react";
import QRCode from "qrcode";

export function qrPath(value: string): { size: number; d: string } {
  const qr = QRCode.create(value || " ", { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size, d };
}

export function QrCode({ value, label, className, color = "#1A1F2B" }: { value: string; label: string; className?: string; color?: string }) {
  const { size, d } = useMemo(() => qrPath(value), [value]);
  const m = 2; // zone de silence
  return (
    <svg role="img" aria-label={label} viewBox={`${-m} ${-m} ${size + 2 * m} ${size + 2 * m}`} className={className} shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x={-m} y={-m} width={size + 2 * m} height={size + 2 * m} fill="#ffffff" />
      <path d={d} fill={color} />
    </svg>
  );
}
