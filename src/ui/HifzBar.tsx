/**
 * Frise du hifz : ḥizb mémorisés sur 60, graduée tous les ḥizb, repère doré
 * tous les 10 (même dessin que « تقدّم الحفظ » du tableau de bord).
 */
import { cx } from "./cx";

export function HifzBar({ hizb, label, className }: { hizb: number; label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={cx("relative h-3 rounded-[3px] bg-line-soft overflow-hidden", className)}>
      <div className="absolute inset-y-0 start-0 bg-primary" style={{ width: `${(hizb / 60) * 100}%` }} />
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to left, transparent 0, transparent calc(100% / 60 - 1.5px), var(--color-surface) calc(100% / 60 - 1.5px), var(--color-surface) calc(100% / 60))" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to left, transparent 0, transparent calc(100% / 6 - 2px), var(--color-gold) calc(100% / 6 - 2px), var(--color-gold) calc(100% / 6))" }} />
    </div>
  );
}
