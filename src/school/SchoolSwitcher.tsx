/**
 * Sélecteur d'école dans la barre du haut (charte « لوحة الكتّاب »).
 * Liste déroulante de la charte (D83) : `#school-switcher` est le bouton, les
 * options portent leur identifiant d'école en `data-value`.
 * Affiché seulement si l'utilisateur appartient à plusieurs écoles ou est super-admin.
 */
import { Building2 } from "lucide-react";
import { useSchool } from "./SchoolContext";
import { Select } from "../ui";

const PICKER_VALUE = "__picker__";

export default function SchoolSwitcher({ block }: { block?: boolean } = {}) {
  const { schoolId, schools, memberSchoolIds, isSuperAdmin, switchSchool, openSchoolPicker } = useSchool();
  const options = schools.filter((s) => memberSchoolIds.includes(s.id));
  if (options.length <= 1 && !isSuperAdmin) return null;
  return (
    <label className={`relative ${block ? "flex w-full" : "inline-flex"} items-center gap-2 h-11 ps-3 pe-1 rounded-xl border border-line bg-white text-primary hover:border-primary focus-within:border-gold transition-colors`} title="تغيير المدرسة">
      <Building2 className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only">تغيير المدرسة</span>
      <Select
        id="school-switcher"
        aria-label="تغيير المدرسة"
        value={schoolId || ""}
        onChange={(v) => {
          if (v === PICKER_VALUE) openSchoolPicker();
          else if (v && v !== schoolId) switchSchool(v);
        }}
        variant="bare"
        className={block ? "flex-1 min-w-0" : "w-auto max-w-[13rem]"}
        triggerClassName="h-10 pe-2"
        data-school-switcher=""
      >
        {options.map((s) => (
          <option key={s.id} value={s.id}>{s.name || s.id}</option>
        ))}
        <option value={PICKER_VALUE}>{isSuperAdmin ? "كل المدارس..." : "اختيار مدرسة..."}</option>
      </Select>
    </label>
  );
}
