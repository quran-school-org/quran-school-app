/**
 * Module du personnel (enseignants, encadrants, administratifs, entretien, bénévoles).
 * Découpé mécaniquement depuis TeacherManagement.tsx (Lot 2, sans changement de comportement).
 */
import { createContext, useContext } from "react";
import type { StaffState } from "./useStaffState";

export const StaffContext = createContext<StaffState | null>(null);

export function useStaff(): StaffState {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff() hors de <StaffContext.Provider>.");
  return ctx;
}
