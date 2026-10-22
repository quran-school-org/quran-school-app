/**
 * Module activités et sorties (participants, dépenses, lien comptable).
 * Découpé mécaniquement depuis ActivitiesManagement.tsx (Lot 2, sans changement de comportement).
 */
import { createContext, useContext } from "react";
import type { ActivitiesState } from "./useActivitiesState";

export const ActivitiesContext = createContext<ActivitiesState | null>(null);

export function useActivities(): ActivitiesState {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities() hors de <ActivitiesContext.Provider>.");
  return ctx;
}
