import { describe, expect, it } from "vitest";
import { computeAccountAlignment, linkedStudentIdsOf } from "../../src/security/accountAlignment";
import type { AppUser, Student, Teacher } from "../../src/types";

const base = (id: string, role: AppUser["role"], extra: Partial<AppUser> = {}): AppUser => ({
  id, username: id, fullName: id, role, isActive: true,
  canEditStudents: false, canEditTeachers: false, canEditGrades: false, canEditPayments: false, ...extra,
});

describe("alignement explicite des comptes", () => {
  it("suspend le compte d'un membre du personnel archivé et aligne le rôle sur la fiche", () => {
    const teachers = [{ id: "t1", fullName: "x", category: "إداري / كاتب", isArchived: true } as Teacher];
    const [changed] = computeAccountAlignment([base("t_t1", "مدرس")], teachers, []);
    expect(changed.role).toBe("إداري");
    expect(changed.isActive).toBe(false);
    expect(changed.isArchived).toBe(true);
  });

  it("ne touche jamais au compte u1 et ne renvoie rien si tout est aligné", () => {
    const teachers = [{ id: "t1", fullName: "x", category: "أستاذ / محفظ", isArchived: false } as Teacher];
    const users = [base("u1", "مدير", { linkedTeacherId: "t1" }), base("t_t1", "مدرس", { isArchived: false, roleTitle: undefined, category: "أستاذ / محفظ" as any })];
    const changed = computeAccountAlignment(users, teachers, []);
    expect(changed.find((u) => u.id === "u1")).toBeUndefined();
  });

  it("parent : suspendu seulement si tous les enfants liés sont archivés", () => {
    const students = [{ id: "S-1", isArchived: true }, { id: "S-2", isArchived: false }] as Student[];
    const parent = base("p_S-1", "ولي أمر", { linkedStudentIds: ["S-1", "S-2"] });
    expect(computeAccountAlignment([parent], [], students)).toEqual([]);
    const all = [{ id: "S-1", isArchived: true }, { id: "S-2", isArchived: true }] as Student[];
    expect(computeAccountAlignment([parent], [], all)[0].isActive).toBe(false);
  });

  it("liens d'un compte famille : liste explicite + identifiant historique uniquement", () => {
    expect(linkedStudentIdsOf(base("p_S-9", "ولي أمر", { linkedStudentIds: ["S-8"] })).sort()).toEqual(["S-8", "S-9"]);
    expect(linkedStudentIdsOf(base("u_1", "طالب"))).toEqual([]);
    expect(linkedStudentIdsOf(base("t_S-1", "مدرس"))).toEqual([]);
  });
});
