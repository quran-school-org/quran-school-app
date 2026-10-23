import { describe, expect, it } from "vitest";
import { ALL_MODULES, checkUserPermission, getDefaultPermissionsForRole, type AppUser, type UserRole } from "../../src/types";

const ROLES: UserRole[] = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر"];

function makeUser(role: UserRole, extra: Partial<AppUser> = {}): AppUser {
  return {
    id: `u_${role}`,
    username: `user_${ROLES.indexOf(role)}`,
    fullName: "Test",
    role,
    isActive: true,
    canEditStudents: false,
    canEditTeachers: false,
    canEditGrades: false,
    canEditPayments: false,
    permissions: getDefaultPermissionsForRole(role),
    ...extra,
  };
}

describe("matrice de permissions par défaut", () => {
  it("couvre les 9 rôles et tous les modules", () => {
    for (const role of ROLES) {
      const perms = getDefaultPermissionsForRole(role);
      expect(Object.keys(perms).sort()).toEqual(ALL_MODULES.map((m) => m.id).sort());
    }
  });

  it("le directeur a tous les droits", () => {
    const perms = getDefaultPermissionsForRole("مدير");
    for (const mod of ALL_MODULES) {
      expect(perms[mod.id]).toEqual({ read: true, create: true, update: true, delete: true, print: true });
    }
  });

  it("un directeur garde tous les droits même avec une matrice enregistrée restrictive (compte migré, D81)", () => {
    const none = Object.fromEntries(ALL_MODULES.map((m) => [m.id, { read: false, create: false, update: false, delete: false, print: false }]));
    const director = makeUser("مدير", { username: "admin_alfajr", permissions: none });
    for (const mod of ALL_MODULES) {
      for (const action of ["read", "create", "update", "delete", "print"] as const) {
        expect(checkUserPermission(director, "مدير", mod.id, action), `${mod.id} ${action}`).toBe(true);
      }
    }
    // La matrice garde son effet pour les autres rôles.
    const admin = makeUser("إداري", { permissions: none });
    expect(checkUserPermission(admin, "إداري", "teachers", "create")).toBe(false);
  });

  it("les finances ne sont visibles que du bureau (مدير / إداري)", () => {
    for (const role of ROLES) {
      const allowed = checkUserPermission(makeUser(role), role, "finance", "read");
      expect(allowed, role).toBe(role === "مدير" || role === "إداري");
    }
  });

  it("parents et élèves n'ont aucun droit d'écriture", () => {
    for (const role of ["طالب", "ولي أمر"] as UserRole[]) {
      const user = makeUser(role);
      for (const mod of ALL_MODULES) {
        for (const action of ["create", "update", "delete"] as const) {
          expect(checkUserPermission(user, role, mod.id, action), `${role} ${mod.id} ${action}`).toBe(false);
        }
      }
    }
  });
});
