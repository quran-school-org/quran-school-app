/**
 * Contexte de l'école active, disponible pour tout l'arbre React.
 * L'état lui-même est tenu par App (session, abonnements) ; ce contexte en
 * expose une vue en lecture et les actions de changement d'école.
 */
import { createContext, useContext } from "react";
import type { AppUser, SchoolInfo, SystemSettings, UserRole } from "../types";

export interface SchoolContextValue {
  schoolId: string | null;
  school: SchoolInfo | null;
  /** Écoles dont l'utilisateur est membre (ou toutes, pour le super-admin). */
  schools: SchoolInfo[];
  memberSchoolIds: string[];
  member: AppUser | null;
  role: UserRole | null;
  settings: SystemSettings | null;
  schoolName: string;
  isSuperAdmin: boolean;
  switchSchool: (schoolId: string) => void;
  openSchoolPicker: () => void;
}

export const SchoolContext = createContext<SchoolContextValue>({
  schoolId: null,
  school: null,
  schools: [],
  memberSchoolIds: [],
  member: null,
  role: null,
  settings: null,
  schoolName: "",
  isSuperAdmin: false,
  switchSchool: () => undefined,
  openSchoolPicker: () => undefined,
});

export function useSchool(): SchoolContextValue {
  return useContext(SchoolContext);
}
