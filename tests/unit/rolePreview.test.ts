/** Aperçu par rôle du super-admin (D95) : conditions d'affichage, choix au hasard, bandeau. */
import { describe, expect, it } from "vitest";
import {
  PREVIEW_ROLES, ROLE_PREVIEW_BLOCKED_SCHOOLS, isRolePreviewAvailable, needsPool, pickParentStudents, pickPreviewLinks,
  pickTeacher, previewBannerText, sample, siblingGroups,
} from "../../src/rolePreview/rolePreview";

const st = (id: string, fullName: string, parentName: string, parentPhone: string, isArchived = false) => ({ id, fullName, parentName, parentPhone, isArchived });
const teacher = (id: string, fullName: string, category: any = "أستاذ / محفظ", isArchived = false) => ({ id, fullName, category, isArchived });
const klass = (id: string, teacherId: string, isArchived = false) => ({ id, teacherId, isArchived });

/** Générateur déterministe (suite de valeurs fixes en boucle). */
const seq = (...vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };

describe("conditions d'affichage", () => {
  const ok = { enabled: true, isSuperAdmin: true, schoolId: "test1234", isMember: true };
  it("les quatre conditions réunies : proposé", () => {
    expect(isRolePreviewAvailable(ok)).toBe(true);
    expect(isRolePreviewAvailable({ ...ok, schoolId: "annour" })).toBe(true);
  });
  it("jamais sans le drapeau de build (production)", () => {
    expect(isRolePreviewAvailable({ ...ok, enabled: false })).toBe(false);
  });
  it("jamais pour un compte non super-admin", () => {
    expect(isRolePreviewAvailable({ ...ok, isSuperAdmin: false })).toBe(false);
  });
  it("jamais si le super-admin n'est pas membre de l'école active", () => {
    expect(isRolePreviewAvailable({ ...ok, isMember: false })).toBe(false);
  });
  it("jamais sur alfajr (copie de données réelles), quelle que soit la casse ou les espaces", () => {
    expect(ROLE_PREVIEW_BLOCKED_SCHOOLS).toContain("alfajr");
    for (const id of ["alfajr", "ALFAJR", " alfajr "]) expect(isRolePreviewAvailable({ ...ok, schoolId: id })).toBe(false);
  });
  it("jamais sans école active", () => {
    expect(isRolePreviewAvailable({ ...ok, schoolId: null })).toBe(false);
    expect(isRolePreviewAvailable({ ...ok, schoolId: "" })).toBe(false);
    expect(isRolePreviewAvailable({ ...ok, schoolId: undefined })).toBe(false);
  });
});

describe("rôles proposés", () => {
  it("les 9 rôles, valeurs en arabe inchangées, directeur en premier", () => {
    expect(PREVIEW_ROLES).toEqual(["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر"]);
    expect(new Set(PREVIEW_ROLES).size).toBe(9);
  });
  it("seuls parent, élève et enseignant lisent la liste de l'école", () => {
    expect(PREVIEW_ROLES.filter(needsPool)).toEqual(["مدرس", "طالب", "ولي أمر"]);
  });
});

describe("tirage au hasard", () => {
  it("sample : éléments distincts, au plus n, sans modifier la liste", () => {
    const src = [1, 2, 3, 4, 5];
    for (let k = 0; k < 20; k++) {
      const out = sample(src, 3);
      expect(out).toHaveLength(3);
      expect(new Set(out).size).toBe(3);
    }
    expect(sample(src, 99)).toHaveLength(5);
    expect(sample([], 2)).toEqual([]);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  const FAMILY = [
    st("A1", "ياسين العلمي", "محمد العلمي", "0611111111"),
    st("A2", "مريم العلمي", "محمد العلمي", "0611111111"),
    st("B1", "هدى الرباطي", "علي الرباطي", "0622222222"),
    st("C1", "عمر آخر", "خالد آخر", "0633333333"),
  ];

  it("frères et sœurs : même téléphone OU même nom de parent, fusion transitive", () => {
    expect(siblingGroups(FAMILY).map((g) => g.map((s) => s.id))).toEqual([["A1", "A2"]]);
    // Même nom de parent, téléphones différents.
    const byName = [st("1", "a", "ولي  واحد", "0600000001"), st("2", "b", "ولي واحد", "0600000002")];
    expect(siblingGroups(byName)).toHaveLength(1);
    // Même téléphone, noms différents.
    const byPhone = [st("1", "a", "أب", "06 00 00 00 01"), st("2", "b", "أم", "0600000001")];
    expect(siblingGroups(byPhone)).toHaveLength(1);
    // Transitif : 1~2 par nom, 2~3 par téléphone.
    const chain = [st("1", "a", "س", "0600000001"), st("2", "b", "س", "0600000009"), st("3", "c", "ص", "0600000009")];
    expect(siblingGroups(chain)[0].map((s) => s.id).sort()).toEqual(["1", "2", "3"]);
    // Téléphones vides ou trop courts ne regroupent pas.
    expect(siblingGroups([st("1", "a", "", ""), st("2", "b", "", "")])).toEqual([]);
    expect(siblingGroups([st("1", "a", "x1", "123"), st("2", "b", "x2", "123")])).toEqual([]);
  });

  it("parent : deux frères et sœurs actifs quand ils existent, quel que soit le tirage", () => {
    for (let k = 0; k < 30; k++) {
      const kids = pickParentStudents(FAMILY)!;
      expect(kids.map((s) => s.id).sort()).toEqual(["A1", "A2"]);
    }
  });

  it("parent : un frère archivé n'est jamais choisi, la fratrie n'est plus une fratrie", () => {
    const pool = [st("A1", "x", "p", "0611111111"), st("A2", "y", "p", "0611111111", true), st("B1", "z", "q", "0622222222")];
    expect(siblingGroups(pool)).toEqual([]);
    for (let k = 0; k < 30; k++) {
      const kids = pickParentStudents(pool)!;
      expect(kids.length).toBeGreaterThanOrEqual(1);
      expect(kids.length).toBeLessThanOrEqual(2);
      expect(kids.map((s) => s.id)).not.toContain("A2");
    }
  });

  it("parent sans fratrie : 1 ou 2 élèves actifs au hasard (selon le tirage)", () => {
    const pool = [st("1", "a", "p1", "0600000001"), st("2", "b", "p2", "0600000002"), st("3", "c", "p3", "0600000003")];
    expect(pickParentStudents(pool, seq(0.1))!).toHaveLength(1);
    expect(pickParentStudents(pool, seq(0.9))!).toHaveLength(2);
    expect(pickParentStudents([st("1", "a", "p1", "0600000001")], seq(0.9))!).toHaveLength(1); // un seul élève
  });

  it("parent : aucun élève actif → null", () => {
    expect(pickParentStudents([])).toBeNull();
    expect(pickParentStudents([st("1", "a", "p", "0600000001", true)])).toBeNull();
    expect(pickPreviewLinks("ولي أمر", { students: [], teachers: [], classes: [] })).toBeNull();
  });

  it("élève : un seul élève actif", () => {
    const pool = { students: [st("1", "a", "p", "1", true), st("2", "b", "p", "1"), st("3", "c", "q", "2")], teachers: [], classes: [] };
    for (let k = 0; k < 30; k++) {
      const links = pickPreviewLinks("طالب", pool)!;
      expect(links.linkedTeacherId).toBeNull();
      expect(links.linkedStudentIds).toHaveLength(1);
      expect(["2", "3"]).toContain(links.linkedStudentIds[0]);
    }
    expect(pickPreviewLinks("طالب", { ...pool, students: [] })).toBeNull();
  });

  it("enseignant : fiche enseignante non archivée, avec halaqa si possible", () => {
    const teachers = [teacher("t1", "أ"), teacher("t2", "ب"), teacher("t3", "ج", "إداري / كاتب"), teacher("t4", "د", "أستاذ / محفظ", true)];
    const classes = [klass("c1", "t2"), klass("c2", "t3"), klass("c3", "t1", true)];
    for (let k = 0; k < 30; k++) expect(pickTeacher(teachers, classes)!.id).toBe("t2"); // seule enseignante active avec halaqa
    // Aucune halaqa : n'importe quelle enseignante active (jamais archivée ni du bureau).
    for (let k = 0; k < 30; k++) expect(["t1", "t2"]).toContain(pickTeacher(teachers, [])!.id);
    expect(pickTeacher([teacher("t3", "ج", "إداري / كاتب")], [])).toBeNull();
    const links = pickPreviewLinks("مدرس", { students: [], teachers, classes })!;
    expect(links).toEqual({ linkedTeacherId: "t2", linkedStudentIds: [] });
    expect(pickPreviewLinks("مدرس", { students: [], teachers: [], classes: [] })).toBeNull();
  });

  it("autres rôles : sans lien, sans lire l'école", () => {
    for (const role of PREVIEW_ROLES.filter((r) => !needsPool(r))) {
      expect(pickPreviewLinks(role, { students: [], teachers: [], classes: [] })).toEqual({ linkedTeacherId: null, linkedStudentIds: [] });
    }
  });
});

describe("texte du bandeau", () => {
  const data = { students: [{ id: "1", fullName: "فاطمة الزهراء" }, { id: "2", fullName: "عمر" }], teachers: [{ id: "t1", fullName: "الأستاذ يوسف" }] };
  it("parent et élève : noms des élèves liés ; enseignant : nom de la fiche", () => {
    expect(previewBannerText("ولي أمر", { linkedStudentIds: ["1", "2"] }, data)).toBe("وضع المعاينة : ولي أمر (فاطمة الزهراء، عمر)");
    expect(previewBannerText("طالب", { linkedStudentIds: ["2"] }, data)).toBe("وضع المعاينة : طالب (عمر)");
    expect(previewBannerText("مدرس", { linkedTeacherId: "t1" }, data)).toBe("وضع المعاينة : مدرس (الأستاذ يوسف)");
  });
  it("rôle sans lien, ou liens introuvables : le rôle seul", () => {
    expect(previewBannerText("إداري", {}, data)).toBe("وضع المعاينة : إداري");
    expect(previewBannerText("ولي أمر", { linkedStudentIds: ["9"] }, data)).toBe("وضع المعاينة : ولي أمر");
  });
});
