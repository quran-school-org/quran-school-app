/**
 * Paramètres de l'école et gestion des comptes (matrice de droits).
 * Découpé mécaniquement depuis SettingsManagement.tsx (Lot 2, sans changement de comportement).
 */
import { AppUser } from "../../types";

/** Compte du directeur historique (ancien identifiant u1) : protégé. */
export const isPrimaryDirector = (u: AppUser | null | undefined) => !!u && (u.id === "u1" || u.legacyAppUserId === "u1" || u.username === "admin_alfajr");





