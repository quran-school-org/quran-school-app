/**
 * Sélecteur d'école dans la barre du haut (charte « لوحة الكتّاب »).
 * Affiché seulement si l'utilisateur appartient à plusieurs écoles ou est super-admin.
 */
import { Building2 } from "lucide-react";
import { useSchool } from "./SchoolContext";

const PICKER_VALUE = "__picker__";

export default function SchoolSwitcher() {
  const { schoolId, schools, memberSchoolIds, isSuperAdmin, switchSchool, openSchoolPicker } = useSchool();
  const options = schools.filter((s) => memberSchoolIds.includes(s.id));
  if (options.length <= 1 && !isSuperAdmin) return null;
  return (
    <label className="relative inline-flex items-center gap-2 h-11 ps-3 pe-1 rounded-xl border border-line bg-white text-primary hover:border-primary transition-colors" title="تغيير المدرسة">
      <Building2 className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only">تغيير المدرسة</span>
      <select
        id="school-switcher"
        aria-label="تغيير المدرسة"
        value={schoolId || ""}
        onChange={(e) => {
          if (e.target.value === PICKER_VALUE) openSchoolPicker();
          else if (e.target.value && e.target.value !== schoolId) switchSchool(e.target.value);
        }}
        className="bg-transparent border-0 text-[14px] font-semibold text-ink focus:outline-none cursor-pointer max-w-[13rem] h-10 pe-2"
      >
        {options.map((s) => (
          <option key={s.id} value={s.id}>{s.name || s.id}</option>
        ))}
        <option value={PICKER_VALUE}>{isSuperAdmin ? "كل المدارس…" : "اختيار مدرسة…"}</option>
      </select>
    </label>
  );
}
