/**
 * Motif géométrique doré (étoile à huit branches dans un carré, maquette) en
 * SVG, en fond décoratif (aria-hidden, sans interaction). Couleurs par défaut :
 * variables du thème de l'école (D84) ; les cartes d'élève passent des
 * couleurs fixes.
 */
import React, { useId } from "react";
import { cx } from "./cx";

export function GeometricPattern({ size = 64, opacity = 0.09, fade, className, color = "var(--color-gold)", fadeColor = "var(--color-night)" }: { size?: number; opacity?: number; fade?: "top" | "bottom"; className?: string; color?: string; fadeColor?: string }) {
  const id = useId().replace(/:/g, "");
  const s = size;
  const q = s * (18 / 64);
  const w = s * (28 / 64);
  const c = s / 2;
  const r = s * (6 / 64);
  const k = s * (10 / 64);
  return (
    <svg aria-hidden="true" width="100%" height="100%" className={cx("absolute inset-0 pointer-events-none", className)}>
      <defs>
        <pattern id={`p${id}`} width={s} height={s} patternUnits="userSpaceOnUse">
          <g fill="none" style={{ stroke: color }} strokeOpacity={opacity} strokeWidth="1">
            <rect x={q} y={q} width={w} height={w} />
            <rect x={q} y={q} width={w} height={w} transform={`rotate(45 ${c} ${c})`} />
            <circle cx={c} cy={c} r={r} />
            <path d={`M0 0 L${k} ${k} M${s} 0 L${s - k} ${k} M0 ${s} L${k} ${s - k} M${s} ${s} L${s - k} ${s - k}`} />
          </g>
        </pattern>
        {fade && (
          <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: fadeColor }} stopOpacity={fade === "top" ? 1 : 0} />
            <stop offset="1" style={{ stopColor: fadeColor }} stopOpacity={fade === "top" ? 0 : 1} />
          </linearGradient>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#p${id})`} />
      {fade && <rect width="100%" height="100%" fill={`url(#f${id})`} />}
    </svg>
  );
}

/** Emblème (étoile dorée) utilisé comme logo par défaut de l'école (couleurs du thème, D84). */
export function Emblem({ size = 44, className, background = "var(--color-night)", color = "var(--color-gold)" }: { size?: number; className?: string; background?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <g style={{ fill: color }}>
        <rect x="5.5" y="5.5" width="13" height="13" />
        <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" />
      </g>
      <circle cx="12" cy="12" r="4.2" style={{ fill: background }} />
      <circle cx="12" cy="12" r="1.6" style={{ fill: color }} />
    </svg>
  );
}
