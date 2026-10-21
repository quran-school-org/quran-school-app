/**
 * Contrôleur de l'application : tout l'état et toute la logique qui vivaient
 * dans le composant App, composés dans le même ordre (mêmes hooks, mêmes
 * effets, même ordre d'exécution des effets). Les écrans le lisent par
 * `useApp()` (voir AppContext).
 */
import { useSchoolDataState } from "../data/useSchoolDataState";
import { useQuotaFallback } from "../data/useQuotaFallback";
import { useSchoolSync } from "../data/useSchoolSync";
import { useSessionState } from "../session/useSessionState";
import { useSessionActions } from "../session/useSessionActions";
import { useUiState } from "./state/useUiState";
import { useCore } from "./useCore";
import { useDerived } from "./useDerived";
import { useAutoSelectStudent } from "./useAutoSelectStudent";
import { useStudentActions } from "./actions/useStudentActions";
import { useStaffActions } from "./actions/useStaffActions";
import { useAttendanceActions } from "./actions/useAttendanceActions";
import { useGradePaymentActions } from "./actions/useGradePaymentActions";
import { useFinanceActions } from "./actions/useFinanceActions";
import { usePrintActions } from "./actions/usePrintActions";
import { useExportBackupActions } from "./actions/useExportBackupActions";
import { useAdminActions } from "./actions/useAdminActions";
import { useAiActions } from "./actions/useAiActions";
import { useProfileActions } from "./actions/useProfileActions";

export function useAppController() {
  // 1. États (données de l'école, session, interface)
  const base = { ...useSchoolDataState(), ...useSessionState(), ...useUiState() };
  // 2. Règles de l'école active, rechargement depuis le cache, notifications
  const core = { ...base, ...useCore(base) };
  // 3. Effets dans l'ordre d'origine : quota, session (Auth), abonnements de l'école
  useQuotaFallback(core);
  const session = { ...core, ...useSessionActions(core) };
  const synced = { ...session, ...useSchoolSync(session) };
  // 4. Valeurs dérivées (périmètre du rôle, statistiques, listes filtrées)
  const derived = { ...synced, ...useDerived(synced) };
  // 5. Actions par domaine
  const app = {
    ...derived,
    ...useStudentActions(derived),
    ...useStaffActions(derived),
    ...useAttendanceActions(derived),
    ...useGradePaymentActions(derived),
    ...useFinanceActions(derived),
    ...usePrintActions(derived),
    ...useExportBackupActions(derived),
    ...useAdminActions(derived),
    ...useAiActions(derived),
    ...useProfileActions(derived),
  };
  useAutoSelectStudent(derived);
  return app;
}

export type AppController = ReturnType<typeof useAppController>;
