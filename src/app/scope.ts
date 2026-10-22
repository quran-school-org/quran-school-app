/**
 * Portées successives du contrôleur de l'application (types seulement).
 * Chaque étage reçoit tout ce que les étages précédents exposent, dans l'ordre
 * de l'ancien composant App (états, règles de l'école, session, abonnements,
 * valeurs dérivées, actions).
 */
import type { useSchoolDataState } from "../data/useSchoolDataState";
import type { useSessionState } from "../session/useSessionState";
import type { useSessionActions } from "../session/useSessionActions";
import type { useUiState } from "./state/useUiState";
import type { useCore } from "./useCore";
import type { useDerived } from "./useDerived";

export type BaseScope = ReturnType<typeof useSchoolDataState> & ReturnType<typeof useSessionState> & ReturnType<typeof useUiState>;
export type CoreScope = BaseScope & ReturnType<typeof useCore>;
export type SessionScope = CoreScope & ReturnType<typeof useSessionActions>;
export type DerivedScope = SessionScope & ReturnType<typeof useDerived>;
