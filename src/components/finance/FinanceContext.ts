/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import { createContext, useContext } from "react";
import type { FinanceState } from "./useFinanceState";

export const FinanceContext = createContext<FinanceState | null>(null);

export function useFinance(): FinanceState {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance() hors de <FinanceContext.Provider>.");
  return ctx;
}
