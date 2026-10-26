/**
 * Réglage « اللغة / Langue » (D93) : deux boutons segmentés, العربية / Français.
 * Choix personnel, gardé sur l'appareil (src/i18n/language.ts) ; appliqué
 * immédiatement, rien n'est écrit dans Firestore. Les deux noms de langue
 * sont écrits dans leur propre langue et ne sont jamais traduits.
 */
import { useId } from "react";
import { setLanguage, useLanguage, type Lang } from "../i18n/language";
import { cx } from "./cx";
import { SegmentedControl } from "./SegmentedControl";

const LABEL = "اللغة / Langue";

export function LanguageSetting({ className }: { className?: string }) {
  const lang = useLanguage();
  const id = useId();
  return (
    <div data-language-setting className={cx("flex flex-col gap-1.5 min-w-0", className)}>
      <span id={id} className="text-[13.5px] font-semibold text-ink-2">{LABEL}</span>
      <SegmentedControl<Lang>
        label={LABEL}
        value={lang}
        onChange={(v) => void setLanguage(v)}
        className="self-start"
        options={[
          { value: "ar", label: <span lang="ar" dir="rtl">العربية</span>, attrs: { "data-lang": "ar" } },
          { value: "fr", label: <span lang="fr" dir="ltr">Français</span>, attrs: { "data-lang": "fr" } },
        ]}
      />
    </div>
  );
}
