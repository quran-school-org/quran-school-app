/**
 * Titre de section (D101) : une seule écriture pour « titre, sous-titre, actions » que les
 * écrans recopiaient (25 combinaisons de taille et de graisse relevées par l'audit).
 *
 * - `size="lg"` : titre de carte ou de liste (échelle `text-title`, 600, couleur principale) ;
 *   `size="md"` : titre de bloc dans une carte (`text-lead`, 600).
 * - `level` : h2 (défaut) ou h3 ; `id` pour `aria-labelledby`.
 * - `icon` : pictogramme décoratif avant le titre (porte ses propres classes de taille et de couleur).
 * - `subtitle` : phrase d'aide sous le titre ; `actions` : bouton(s) ou texte à l'autre extrémité,
 *   rendus tels quels (le parent fixe l'enveloppe si plusieurs éléments).
 * - `className` : la ligne (`flex-wrap items-center gap-2 px-5 py-4 border-b …`) ; la mise en
 *   forme de la barre reste à l'écran qui l'emploie, comme avec `CardHeader`.
 */
import React from "react";
import { cx } from "./cx";

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  id?: string;
  level?: 2 | 3;
  size?: "lg" | "md";
  className?: string;
  titleClassName?: string;
}

export function SectionHeader({ title, subtitle, actions, icon, id, level = 2, size = "lg", className, titleClassName }: SectionHeaderProps) {
  const H = level === 2 ? "h2" : "h3";
  const heading = (
    <H id={id} className={cx("m-0 font-sans font-semibold text-primary", size === "lg" ? "text-title" : "text-lead", icon ? "flex items-center gap-2" : undefined, titleClassName)}>
      {icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}
      {icon ? <span>{title}</span> : title}
    </H>
  );
  return (
    <div className={cx("flex justify-between", className)}>
      {subtitle ? (
        <div className="min-w-0">
          {heading}
          <p className="m-0 mt-0.5 text-small text-ink-3">{subtitle}</p>
        </div>
      ) : heading}
      {actions}
    </div>
  );
}
