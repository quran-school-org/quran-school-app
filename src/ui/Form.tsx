/**
 * Champs de formulaire de la charte : hauteur 44 px, rayon 10 px, bordure
 * #D0D3C6, fond blanc ; libellé 13,5 px / 600.
 */
import React, { useId } from "react";
import { cx } from "./cx";

export const fieldClass =
  "min-h-11 px-3 rounded-[10px] border border-line-strong bg-white text-ink text-[14px] font-sans placeholder:text-ink-3 transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-2 disabled:text-ink-3 disabled:cursor-not-allowed";

/** Largeur pleine par défaut, sauf si la classe fournie fixe déjà une largeur. */
const widthOf = (className?: string) => (/(^|\s)(w-|flex-)/.test(className || "") ? "" : "w-full");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(fieldClass, widthOf(className), className)} {...rest} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(fieldClass, widthOf(className), "pe-8 cursor-pointer", className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(fieldClass, widthOf(className), "py-2.5 leading-relaxed", className)} {...rest} />;
});

export interface FormFieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: (id: string) => React.ReactNode;
}

/** Associe libellé, aide et erreur à un champ (id généré). */
export function FormField({ label, hint, error, className, children }: FormFieldProps) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1.5 min-w-0", className)}>
      <label htmlFor={id} className="text-[13.5px] font-semibold text-ink-2">{label}</label>
      {children(id)}
      {hint && <span className="text-[12.5px] text-ink-3 leading-relaxed">{hint}</span>}
      {error && <span role="alert" className="text-[12.5px] font-semibold text-danger">{error}</span>}
    </div>
  );
}

/** Case à cocher avec libellé, cible tactile de 44 px. */
export function CheckboxRow({ checked, onChange, children, className, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return (
    <label className={cx("flex items-center gap-2.5 min-h-11 px-3 rounded-[10px] border border-line bg-white cursor-pointer hover:bg-surface-2 transition-colors text-[14px] text-ink", disabled && "opacity-60 cursor-not-allowed", className)}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-primary shrink-0" />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

/** Recherche avec icône (position logique : début de ligne). */
export function SearchInput({ icon, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className={cx("relative min-w-0", className)}>
      <span aria-hidden="true" className="absolute inset-y-0 start-3 flex items-center text-ink-3 pointer-events-none">{icon}</span>
      <input type="search" className={cx(fieldClass, "w-full ps-10")} {...rest} />
    </div>
  );
}
