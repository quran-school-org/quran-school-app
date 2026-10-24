/**
 * Sélecteur d'école dans la barre du haut (charte « لوحة الكتّاب »).
 * Affiché seulement si l'utilisateur appartient à plusieurs écoles ou est super-admin.
 * Menu de la charte plutôt que la liste native du navigateur : école active
 * cochée, initiale de chaque école, accès séparé à la liste complète.
 */
import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown, LayoutGrid } from "lucide-react";
import { useSchool } from "./SchoolContext";
import { cx } from "../ui";

export default function SchoolSwitcher() {
  const { schoolId, schools, memberSchoolIds, isSuperAdmin, switchSchool, openSchoolPicker } = useSchool();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const options = schools.filter((s) => memberSchoolIds.includes(s.id));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (options.length <= 1 && !isSuperAdmin) return null;
  const current = schools.find((s) => s.id === schoolId);
  const choose = (id: string) => {
    setOpen(false);
    if (id !== schoolId) switchSchool(id);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id="school-switcher"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="تغيير المدرسة"
        title="تغيير المدرسة"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-11 ps-3 pe-2.5 rounded-xl border border-line bg-white text-primary hover:border-primary transition-colors cursor-pointer max-w-[16rem]"
      >
        <Building2 className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="text-[14px] font-semibold text-ink truncate">{current?.name || schoolId || "اختيار مدرسة"}</span>
        <ChevronDown className={cx("w-4 h-4 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 end-0 z-40 w-72 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-xl shadow-pop overflow-hidden">
          <p className="m-0 px-4 pt-3 pb-1.5 text-[12px] font-semibold text-ink-3">مدارسك</p>
          <ul role="listbox" aria-label="مدارسك" className="m-0 p-0 pb-1 list-none max-h-72 overflow-y-auto">
            {options.map((s) => {
              const active = s.id === schoolId;
              return (
                <li key={s.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    data-school-option={s.id}
                    onClick={() => choose(s.id)}
                    className={cx(
                      "w-full flex items-center gap-3 min-h-12 px-4 text-start bg-transparent border-0 cursor-pointer hover:bg-surface-2",
                      active && "bg-primary-50",
                    )}
                  >
                    <span aria-hidden="true" className={cx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px] font-bold", active ? "bg-primary text-white" : "bg-sunken text-primary")}>
                      {(s.name || s.id).trim().charAt(0)}
                    </span>
                    <span className={cx("flex-1 min-w-0 truncate text-[14px]", active ? "font-bold text-primary" : "font-semibold text-ink")}>{s.name || s.id}</span>
                    {active && <Check className="w-4 h-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            data-school-option="__picker__"
            onClick={() => { setOpen(false); openSchoolPicker(); }}
            className="w-full flex items-center gap-3 min-h-12 px-4 text-start text-[14px] font-semibold text-primary bg-transparent border-0 border-t border-line-faint cursor-pointer hover:bg-surface-2"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {isSuperAdmin ? "كل المدارس…" : "اختيار مدرسة…"}
          </button>
        </div>
      )}
    </div>
  );
}
