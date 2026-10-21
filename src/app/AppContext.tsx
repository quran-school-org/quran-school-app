/**
 * Contexte de l'application : expose le contrôleur (état, données de l'école
 * active, actions) aux écrans de `src/screens` et au cadre de `src/shell`.
 */
import { createContext, useContext } from "react";
import type { AppController } from "./useAppController";

export const AppContext = createContext<AppController | null>(null);

export function useApp(): AppController {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp() doit être utilisé sous <AppContext.Provider>.");
  return ctx;
}
