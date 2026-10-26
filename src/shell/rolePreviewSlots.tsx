/**
 * Emplacements de l'aperçu par rôle (D95). Les modules de src/rolePreview ne
 * sont chargés (import dynamique) que si le drapeau de build est vrai : en
 * production, la branche est éliminée du bundle (vérifié par le garde-fou de
 * vite.config.ts). Ce fichier doit rester HORS de src/rolePreview.
 */
import { Suspense, lazy } from "react";
import { rolePreviewEnabled } from "../config/env";

const Control = rolePreviewEnabled ? lazy(() => import("../rolePreview/RolePreviewControl")) : null;
const Banner = rolePreviewEnabled ? lazy(() => import("../rolePreview/RolePreviewBanner")) : null;

export function RolePreviewControlSlot() {
  return Control ? <Suspense fallback={null}><Control /></Suspense> : null;
}

export function RolePreviewBannerSlot() {
  return Banner ? <Suspense fallback={null}><Banner /></Suspense> : null;
}
