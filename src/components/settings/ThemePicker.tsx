/**
 * Choix du thème de couleur de l'école (D84) : cinq vignettes (barre latérale,
 * couleur principale, or) ; aperçu immédiat au clic, enregistrement avec les
 * autres paramètres. Vrais boutons (`aria-pressed`), utilisables au clavier.
 */
import { Check, Palette } from "lucide-react";
import { THEMES } from "../../theme/palettes";
import { useSettings } from "./SettingsContext";

export default function ThemePicker() {
  const { theme, chooseTheme, canUpdate } = useSettings();

  return (
    <section aria-labelledby="theme-picker-title" data-theme-picker className="space-y-4 bg-sand-50/70 p-5 rounded-2xl border border-sand-200/80">
      <div className="border-b pb-2">
        <h3 id="theme-picker-title" className="text-sm font-bold text-primary flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary-600" aria-hidden="true" />
          <span>ألوان التطبيق</span>
        </h3>
        <p className="m-0 mt-1 text-[12.5px] text-ink-3">
          {canUpdate
            ? "تظهر الألوان المختارة لجميع مستخدمي هذه المدرسة. المعاينة فورية، ولا يُعتمد الاختيار إلا بعد الحفظ."
            : "تظهر هذه الألوان لجميع مستخدمي هذه المدرسة. تغييرها من صلاحيات مدير المدرسة."}
        </p>
      </div>

      <div role="group" aria-label="ألوان التطبيق" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {THEMES.map((t) => {
          const on = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              data-theme-option={t.id}
              aria-pressed={on}
              disabled={!canUpdate}
              onClick={() => chooseTheme(t.id)}
              className={`flex flex-col gap-2 p-2 rounded-xl border-2 bg-white text-start transition-colors ${
                on ? "border-primary" : "border-line-soft hover:border-line-strong"
              } ${canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
            >
              <span aria-hidden="true" className="flex h-[76px] rounded-lg overflow-hidden border border-line-soft" style={{ background: t.base.app }}>
                <span className="w-[32%] h-full flex flex-col gap-1.5 p-1.5" style={{ background: t.base.night }}>
                  <span className="h-1.5 w-3/4 rounded-full" style={{ background: t.base.gold }} />
                  <span className="h-1 w-full rounded-full bg-white/35" />
                  <span className="h-1 w-5/6 rounded-full bg-white/20" />
                  <span className="h-1 w-full rounded-full bg-white/20" />
                </span>
                <span className="flex-1 flex flex-col gap-1.5 p-2">
                  <span className="h-2 w-2/3 rounded-full" style={{ background: t.base.primary }} />
                  <span className="h-1 w-full rounded-full bg-black/10" />
                  <span className="mt-auto flex items-center gap-1">
                    <span className="h-3.5 w-9 rounded" style={{ background: t.base.primary }} />
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: t.base.gold }} />
                  </span>
                </span>
              </span>
              <span className="flex items-center justify-between gap-2 min-h-6">
                <span className="text-[13px] font-semibold text-ink leading-tight">{t.name}</span>
                {on && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shrink-0" aria-hidden="true">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
