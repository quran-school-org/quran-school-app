/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import type { ActivitiesManagementProps } from "../ActivitiesManagement";
import { useActivitiesForms } from "./useActivitiesForms";
import { useActivitiesData } from "./useActivitiesData";
import { useActivitiesHandlers } from "./useActivitiesHandlers";

export function useActivitiesState(props: ActivitiesManagementProps) {
  const s1 = useActivitiesForms(props);
  const s2 = { ...s1, ...useActivitiesData(s1) };
  const s3 = { ...s2, ...useActivitiesHandlers(s2) };
  return s3;
}

export type ActivitiesState = ReturnType<typeof useActivitiesState>;
