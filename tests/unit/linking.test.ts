import { describe, expect, it } from "vitest";
import { computeParentLinks, computeStudentSelfLink, computeTeacherLink, normalizeName, normalizePhone } from "../../scripts/admin/lib/linking";

describe("normalisation", () => {
  it("téléphones marocains", () => {
    expect(normalizePhone("06 61 00 00 01")).toBe("0661000001");
    expect(normalizePhone("+212 661 000 001")).toBe("0661000001");
    expect(normalizePhone("00212661000001")).toBe("0661000001");
    expect(normalizePhone("123")).toBe("");
    expect(normalizePhone(undefined)).toBe("");
  });
  it("noms arabes", () => {
    expect(normalizeName(" أحمد  بن   عبد الله ")).toBe(normalizeName("احمد بن عبد الله"));
    expect(normalizeName("فاطمة")).toBe(normalizeName("فاطمه"));
  });
});

describe("liens explicites", () => {
  const students = [
    { id: "S-1", fullName: "محمد", parentName: "علي", parentPhone: "0661000001" },
    { id: "S-2", fullName: "مريم", parentName: "علي", parentPhone: "0661000001" },
    { id: "S-3", fullName: "يوسف", parentName: "علي بن محمد", parentPhone: "0661000009" },
  ];
  it("aucune correspondance par inclusion (« علي » ne voit pas « علي بن محمد »)", () => {
    const r = computeParentLinks({ id: "p_S-1", role: "ولي أمر", fullName: "علي" }, students);
    expect(r.studentIds.sort()).toEqual(["S-1", "S-2"]);
    const manual = computeParentLinks({ id: "u_x", role: "ولي أمر", fullName: "علي", phone: "0661000001" }, students);
    expect(manual.studentIds.sort()).toEqual(["S-1", "S-2"]);
    expect(manual.studentIds).not.toContain("S-3");
    // Nom seul, sans téléphone : rien n'est lié automatiquement.
    expect(computeParentLinks({ id: "u_y", role: "ولي أمر", fullName: "علي" }, students).studentIds).toEqual([]);
  });
  it("élève : uniquement son dossier", () => {
    expect(computeStudentSelfLink({ id: "s_S-3" }, students).studentIds).toEqual(["S-3"]);
    expect(computeStudentSelfLink({ id: "u_y", fullName: "inconnu" }, students).studentIds).toEqual([]);
  });
  it("personnel : fiche par identifiant historique", () => {
    expect(computeTeacherLink({ id: "t_t9" }, [{ id: "t9" }]).teacherId).toBe("t9");
    expect(computeTeacherLink({ id: "t_t8" }, [{ id: "t9" }]).teacherId).toBeNull();
  });
});
