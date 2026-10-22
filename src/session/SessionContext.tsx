/**
 * Contexte de session : compte connecté, rôle dans l'école active, écoles
 * accessibles et actions de session (déconnexion, changement d'école, profil).
 * L'état lui-même est tenu par `useSessionState` / `useSessionActions`
 * (déplacés tels quels depuis App.tsx) ; ce contexte en expose une vue.
 */
import { createContext, useContext } from "react";
import type { AppUser, SchoolInfo, UserProfile, UserRole } from "../types";

export interface SessionContextValue {
  currentUser: AppUser | null;
  currentRole: UserRole;
  authUid: string | null;
  userProfile: UserProfile | null;
  isSuperAdmin: boolean;
  schools: SchoolInfo[];
  activeSchoolId: string | null;
  mustChangePassword: boolean;
  accountOwnerName: string;
  logout: (reason?: string) => Promise<void>;
  selectSchool: (schoolId: string) => Promise<void>;
  openSchoolPicker: () => void;
  openProfile: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession() doit être utilisé sous <SessionContext.Provider>.");
  return ctx;
}
