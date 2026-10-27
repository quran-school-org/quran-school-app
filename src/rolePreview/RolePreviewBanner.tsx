/**
 * Bandeau de l'aperçu par rôle (D95) : discret mais clair, tant que le
 * super-admin n'a pas retrouvé le rôle « مدير ». Il indique le vrai rôle, et
 * l'élève ou la fiche liés ; le bouton ramène au directeur sans lien.
 */
import { FlaskConical, Undo2 } from "lucide-react";
import { Button } from "../ui";
import { PREVIEW_HOME_ROLE } from "./rolePreview";
import { useRolePreview } from "./useRolePreview";

export default function RolePreviewBanner() {
  const { isPreviewing, busy, error, bannerText, switchTo } = useRolePreview();
  if (!isPreviewing) return null;
  return (
    <div className="px-4 sm:px-8 pt-3 max-w-[1240px] w-full box-border" data-role-preview="banner">
      <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-gold bg-gold-100 px-3.5 py-2 text-gold-800">
        <span className="flex items-start gap-2 min-w-0 text-small font-semibold leading-relaxed">
          <FlaskConical className="w-4 h-4 mt-1 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 break-words" data-role-preview-text="">{bannerText}</span>
        </span>
        <Button size="sm" variant="outline" disabled={busy} data-role-preview-back="" icon={<Undo2 className="w-4 h-4 -scale-x-100" strokeWidth={1.75} />} onClick={() => void switchTo(PREVIEW_HOME_ROLE)}>
          العودة إلى مدير
        </Button>
      </div>
      {error && <p role="alert" className="m-0 mt-1.5 text-small font-semibold text-danger">{error}</p>}
    </div>
  );
}
