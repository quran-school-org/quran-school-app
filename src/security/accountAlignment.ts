/**
 * Alignement explicite des comptes sur les fiches du personnel et des élèves
 * (bouton « مزامنة فورية للأدوار », réservé au directeur).
 *
 * Remplace l'ancien `syncAppUsers` qui tournait à chaque snapshot dans chaque
 * navigateur et réécrivait les comptes en boucle (rapport §10.3). Cette
 * fonction est PURE : elle calcule les comptes à mettre à jour, sans rien
 * écrire ni créer, et ne touche jamais aux mots de passe.
 */
import { AppUser, Student, Teacher, getDefaultPermissionsForRole } from "../types";
import { getRoleAndPermissionsForStaff } from "./staffRoles";

export function linkedTeacherIdOf(user: AppUser): string | undefined {
  if (user.linkedTeacherId) return user.linkedTeacherId;
  if (user.id.startsWith("t_")) return user.id.slice(2);
  return undefined;
}

/** Élèves explicitement liés à un compte (liens + convention d'identifiant historique). */
export function linkedStudentIdsOf(user: AppUser | null | undefined): string[] {
  if (!user) return [];
  const ids = new Set<string>(user.linkedStudentIds || []);
  if ((user.role === "طالب" && user.id.startsWith("s_")) || (user.role === "ولي أمر" && user.id.startsWith("p_"))) {
    ids.add(user.id.slice(2));
  }
  return Array.from(ids);
}

export function computeAccountAlignment(users: AppUser[], teachers: Teacher[], students: Student[]): AppUser[] {
  const teacherById = new Map(teachers.map((t) => [t.id, t]));
  const studentById = new Map(students.map((s) => [s.id, s]));
  const changed: AppUser[] = [];

  for (const user of users) {
    if (user.id === "u1" || user.legacyAppUserId === "u1") continue; // le compte directeur principal n'est jamais modifié automatiquement
    let next: AppUser = { ...user };

    const teacherId = linkedTeacherIdOf(user);
    const teacher = teacherId ? teacherById.get(teacherId) : undefined;
    if (teacher && user.role !== "طالب" && user.role !== "ولي أمر") {
      const defaults = getRoleAndPermissionsForStaff(teacher);
      // Jamais de promotion au rôle de directeur par la fiche : le bureau peut
      // écrire les fiches (intitulé « رئيس », « مدير »…) ; seul un directeur
      // nomme un directeur, explicitement (revue de sécurité, C-03).
      const role = user.role === "مدير" ? "مدير" : defaults.role === "مدير" ? user.role : defaults.role;
      const archived = Boolean(teacher.isArchived);
      next = {
        ...next,
        role,
        roleTitle: teacher.roleTitle,
        category: teacher.category,
        isArchived: archived,
        isActive: archived ? false : user.isArchived ? true : user.isActive,
        permissions: role !== user.role ? getDefaultPermissionsForRole(role) : user.permissions || getDefaultPermissionsForRole(role),
      };
    }

    if (user.role === "طالب" || user.role === "ولي أمر") {
      const linked = linkedStudentIdsOf(user).map((id) => studentById.get(id)).filter((s): s is Student => !!s);
      if (linked.length > 0) {
        const allArchived = linked.every((s) => Boolean(s.isArchived));
        next = {
          ...next,
          isArchived: allArchived,
          isActive: allArchived ? false : user.isArchived ? true : user.isActive,
        };
      }
    }

    const keys: (keyof AppUser)[] = ["role", "roleTitle", "category", "isArchived", "isActive", "permissions"];
    const norm = (k: keyof AppUser, v: unknown) => (k === "isArchived" ? Boolean(v) : k === "isActive" ? v !== false : v ?? null);
    if (keys.some((k) => JSON.stringify(norm(k, next[k])) !== JSON.stringify(norm(k, user[k])))) {
      changed.push(next);
    }
  }
  return changed;
}
