/**
 * Module comptabilité (recettes, salaires, dépenses, rapport).
 * Découpé mécaniquement depuis FinanceManagement.tsx (Lot 2, sans changement de comportement).
 */
import type { FinanceManagementProps } from "../FinanceManagement";
import { useFinanceForms } from "./useFinanceForms";
import { useFinanceTotals } from "./useFinanceTotals";

export function useFinanceState(props: FinanceManagementProps) {
  const s1 = useFinanceForms(props);
  const s2 = { ...s1, ...useFinanceTotals(s1) };
  return s2;
}

export type FinanceState = ReturnType<typeof useFinanceState>;
