/**
 * Boutons de la charte (maquette : hauteur 44 px, rayon 10 px, 14,5 px / 600).
 * Variantes : primary (bleu nuit), outline (contour sable), danger (contour rouge),
 * danger-solid, success, ghost, gold (sur fond nuit), dark-outline (sur fond nuit).
 */
import React from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "outline" | "danger" | "danger-solid" | "success" | "ghost" | "gold" | "on-dark";
export type ButtonSize = "md" | "sm" | "xs";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover",
  outline: "bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-line-hover",
  danger: "bg-white text-danger border border-danger-200 hover:bg-danger-100",
  "danger-solid": "bg-danger text-white border border-danger hover:bg-danger-700",
  success: "bg-success-700 text-white border border-success-700 hover:bg-success-800",
  ghost: "bg-transparent text-primary border border-transparent hover:bg-surface-2",
  gold: "bg-gold text-night border border-gold hover:bg-gold-300",
  "on-dark": "bg-white/5 text-night-text border border-night-line hover:bg-white/10",
};

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 gap-2 text-body rounded-[10px]",
  sm: "min-h-9 px-3 gap-1.5 text-small rounded-[10px] touch-target",
  xs: "min-h-8 px-2.5 gap-1 text-small rounded-lg touch-target",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  [key: string]: any;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  block?: boolean;
}

export function Button({ variant = "outline", size = "md", icon, block, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center font-semibold font-sans cursor-pointer transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed select-none",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  [key: string]: any;
  label: string;
  tone?: "default" | "danger" | "primary" | "success" | "on-dark";
  size?: "md" | "sm";
}

const ICON_TONES = {
  default: "bg-white text-primary border-line hover:border-primary",
  primary: "bg-primary-100 text-primary border-primary-200 hover:border-primary",
  danger: "bg-white text-danger border-danger-200 hover:bg-danger-100",
  success: "bg-success-100 text-success-700 border-success-200 hover:border-success-700",
  "on-dark": "bg-white/5 text-night-text border-night-line hover:bg-white/10",
};

/** Bouton icône carré (44 px par défaut ; « sm » : 36 px visibles, 44 px au toucher), toujours étiqueté pour les lecteurs d'écran. */
export function IconButton({ label, tone = "default", size = "md", className, children, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "relative inline-flex items-center justify-center border cursor-pointer transition-colors duration-150 shrink-0 disabled:opacity-55 disabled:cursor-not-allowed",
        size === "md"
          ? "w-11 h-11 rounded-xl"
          // 36 px visibles ; la zone de toucher atteint 44 px (pseudo-élément transparent, sans changer la mise en page).
          : "w-9 h-9 rounded-[10px] after:content-[''] after:absolute after:-inset-[5px]",
        ICON_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
