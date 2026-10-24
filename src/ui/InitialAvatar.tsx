/** Avatar à initiale (Reem Kufi gras), tons de la maquette. */
import { cx } from "./cx";

const TONES = {
  primary: "bg-primary-100 text-primary",
  muted: "bg-sunken text-ink-3",
  night: "bg-primary text-gold-100",
  gold: "bg-gold-100 text-gold-800",
};

export function initialOf(name?: string | null, fallback = "م"): string {
  const t = (name || "").trim();
  return t ? t.charAt(0) : fallback;
}

export function InitialAvatar({ name, size = 40, tone = "primary", className }: { name?: string | null; size?: number; tone?: keyof typeof TONES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex items-center justify-center rounded-full font-display font-bold shrink-0 select-none", TONES[tone], className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initialOf(name)}
    </span>
  );
}
