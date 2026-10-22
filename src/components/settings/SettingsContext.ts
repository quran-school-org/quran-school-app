/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { createContext, useContext } from "react";
import type { SettingsState } from "./useSettingsState";

export const SettingsContext = createContext<SettingsState | null>(null);

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings() hors de <SettingsContext.Provider>.");
  return ctx;
}
