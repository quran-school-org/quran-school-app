/**
 * Motif géométrique doré (étoile à huit branches dans un carré, maquette) en
 * SVG, en fond décoratif (aria-hidden, sans interaction). Couleurs par défaut :
 * variables du thème de l'école (D84) ; les cartes d'élève passent des
 * couleurs fixes.
 */
import { useId } from "react";
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

/**
 * Emblème : soleil levant sur un livre ouvert (logo de l'école, D88), version
 * simplifiée pour les petites tailles, aux couleurs du thème actif (D84).
 * `accent` : page claire du livre ; sur fond clair, passer `accent={color}`.
 */
export function Emblem({ size = 44, className, color = "var(--color-gold)", accent = "var(--color-gold-200)" }: { size?: number; className?: string; color?: string; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="14 14 484 484" aria-hidden="true" className={className}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(256 262) scale(1.3) translate(-256 -270)">
        <path d="M 351 225.5 L 385.4 201.4 M 256 176 L 256 134 M 161 225.5 L 126.6 201.4 M 312.3 186 L 326.4 159.6 M 199.7 186 L 185.6 159.6" style={{ stroke: color }} strokeWidth="20" />
        <path d="M 166.9 279.5 A 90 90 0 0 1 345.1 279.5" style={{ stroke: color }} strokeWidth="22" />
        <path d="M 110 302 Q 196 298 256 350 Q 316 298 402 302" style={{ stroke: accent }} strokeWidth="18" />
        <path d="M 84 336 Q 186 330 256 396 Q 326 330 428 336" style={{ stroke: color }} strokeWidth="22" />
      </g>
    </svg>
  );
}
