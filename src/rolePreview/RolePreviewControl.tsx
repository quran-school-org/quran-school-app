/**
 * Contrôle « معاينة كدور » (D95), dans la fenêtre du profil (menu du compte,
 * ouvert depuis l'avatar, pour tous les rôles). Rendu seulement si les quatre
 * conditions sont réunies (useRolePreview.available) : build non prod,
 * super-admin, membre de l'école, école autre qu'alfajr.
 */
import { useId } from "react";
import { FlaskConical, Undo2 } from "lucide-react";
import { ActionAlert, Button, Select } from "../ui";
import { PREVIEW_HOME_ROLE, PREVIEW_ROLES } from "./rolePreview";
import { useRolePreview } from "./useRolePreview";

export default function RolePreviewControl() {
  const { available, busy, error, currentRole, switchTo } = useRolePreview();
  const labelId = useId();
  const hintId = useId();
  if (!available) return null;
  return (
    <section data-role-preview="control" aria-labelledby={labelId} className="flex flex-col gap-2.5 rounded-xl border border-line-soft bg-surface-2 p-3.5">
      <h3 id={labelId} className="m-0 flex items-center gap-2 text-[13.5px] font-semibold text-ink-2">
        <FlaskConical className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
        معاينة كدور
      </h3>
      <p id={hintId} className="m-0 text-[12.5px] leading-relaxed text-ink-3">
        للاختبار في هذه المدرسة التجريبية فقط: يتغير دورك فعلياً في هذه المدرسة (وليس محاكاة)، فتطبَّق عليك صلاحيات الدور وقواعد قاعدة البيانات كما لأي مستخدم حقيقي.
      </p>
      <Select
        aria-labelledby={labelId}
        aria-describedby={hintId}
        data-role-preview-select=""
        value={currentRole}
        disabled={busy}
        onChange={(v) => void switchTo(v as (typeof PREVIEW_ROLES)[number])}
      >
        {PREVIEW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </Select>
      {busy && <p role="status" className="m-0 text-[13px] text-ink-2">جارٍ تغيير الدور…</p>}
      {error && (
        <ActionAlert role="alert" tone="danger" title="تعذر تغيير الدور">
          {error}
        </ActionAlert>
      )}
      {currentRole !== PREVIEW_HOME_ROLE && (
        <Button size="sm" data-role-preview-back="" disabled={busy} icon={<Undo2 className="w-4 h-4 -scale-x-100" strokeWidth={1.75} />} onClick={() => void switchTo(PREVIEW_HOME_ROLE)} className="self-start">
          العودة إلى مدير
        </Button>
      )}
    </section>
  );
}
