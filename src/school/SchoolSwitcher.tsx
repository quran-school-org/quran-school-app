/**
 * Sélecteur d'école dans la barre du haut (style existant de l'application).
 * Affiché seulement si l'utilisateur appartient à plusieurs écoles ou est super-admin.
 */
import { Building } from "lucide-react";
import { useSchool } from "./SchoolContext";

const PICKER_VALUE = "__picker__";

export default function SchoolSwitcher() {
  const { schoolId, schools, memberSchoolIds, isSuperAdmin, switchSchool, openSchoolPicker } = useSchool();
  const options = schools.filter((s) => memberSchoolIds.includes(s.id));
  if (options.length <= 1 && !isSuperAdmin) return null;
  return (
    <div className="relative hidden sm:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1" title="تغيير المدرسة">
      <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      <select
        id="school-switcher"
        aria-label="تغيير المدرسة"
        value={schoolId || ""}
        onChange={(e) => {
          if (e.target.value === PICKER_VALUE) openSchoolPicker();
          else if (e.target.value && e.target.value !== schoolId) switchSchool(e.target.value);
        }}
        className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[11rem]"
      >
        {options.map((s) => (
          <option key={s.id} value={s.id}>{s.name || s.id}</option>
        ))}
        <option value={PICKER_VALUE}>{isSuperAdmin ? "كل المدارس…" : "اختيار مدرسة…"}</option>
      </select>
    </div>
  );
}
