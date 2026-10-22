/**
 * Profil de session : fusion appartenance / profil global. Déplacé tel quel
 * depuis App.tsx (Lot 2, aucun changement de logique).
 */
import { stripPassword } from "../firebase";
import type { AppUser, UserProfile } from "../types";

/** Compte du directeur historique d'Al Fajr (ancien identifiant u1). */
export const isPrimaryDirector = (u: AppUser | null | undefined) => !!u && (u.id === "u1" || u.legacyAppUserId === "u1");

/** Fusionne appartenance à l'école et profil global (le membre fait foi pour le rôle). */
export function mergeSessionProfile(member: AppUser, profile: UserProfile | null, uid: string, schoolId: string): AppUser {
  return {
    ...stripPassword(member),
    id: uid,
    uid,
    schoolId,
    username: member.username || profile?.username || "",
    mustChangePassword: Boolean(profile?.mustChangePassword),
    linkedStudentIds: member.linkedStudentIds ?? [],
    linkedTeacherId: member.linkedTeacherId ?? undefined,
  };
}
