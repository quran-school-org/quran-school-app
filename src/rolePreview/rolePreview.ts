/**
 * Aperçu par rôle du super-admin (D95) : logique pure, sans React ni Firebase,
 * testée dans tests/unit/rolePreview.test.ts.
 *
 * Le super-admin change RÉELLEMENT son appartenance dans l'école active (Cloud
 * Function setMemberRole sur son propre uid) : les règles Firestore s'appliquent
 * ensuite comme pour un vrai utilisateur de ce rôle. Ce module décide :
 *   - quand le contrôle est proposé (isRolePreviewAvailable) ;
 *   - quels liens donner au rôle choisi, au hasard (pickPreviewLinks) ;
 *   - le texte du bandeau (previewBannerText).
 */
import type { Class, Student, Teacher, UserRole } from "../types";

/** Les 9 rôles (valeurs en arabe inchangées), le directeur en premier. */
export const PREVIEW_ROLES: readonly UserRole[] = ["مدير", "إداري", "مؤطر", "مدرس", "متطوع", "عامل نظافة / صيانة", "أخرى", "طالب", "ولي أمر"];

/** Rôle de retour, sans lien. */
export const PREVIEW_HOME_ROLE: UserRole = "مدير";

/**
 * Écoles où l'aperçu est REFUSÉ, quoi que dise le drapeau de build : `alfajr`
 * contient sur le dev une copie des données réelles (élèves mineurs, paiements,
 * salaires). Changer de rôle y exposerait ces données à une vue de test.
 */
export const ROLE_PREVIEW_BLOCKED_SCHOOLS: readonly string[] = ["alfajr"];

export interface RolePreviewConditions {
  /** Drapeau de build VITE_ENABLE_ROLE_PREVIEW (jamais vrai en production). */
  enabled: boolean;
  /** Le compte porte le claim `superAdmin`. */
  isSuperAdmin: boolean;
  /** École active. */
  schoolId: string | null | undefined;
  /** Le super-admin est membre de l'école active. */
  isMember: boolean;
}

/** Les quatre conditions réunies : build non prod, super-admin, membre, école autorisée. */
export function isRolePreviewAvailable(c: RolePreviewConditions): boolean {
  if (!c.enabled || !c.isSuperAdmin || !c.isMember) return false;
  const id = (c.schoolId || "").trim().toLowerCase();
  if (!id) return false;
  return !ROLE_PREVIEW_BLOCKED_SCHOOLS.includes(id);
}

// ------------------------------------------------------------------ choix au hasard

export type Rng = () => number;

type PoolStudent = Pick<Student, "id" | "fullName" | "parentName" | "parentPhone" | "isArchived">;
type PoolTeacher = Pick<Teacher, "id" | "fullName" | "category" | "isArchived">;
type PoolClass = Pick<Class, "id" | "teacherId" | "isArchived">;

export interface PreviewPool {
  students: PoolStudent[];
  teachers: PoolTeacher[];
  classes: PoolClass[];
}

export interface PreviewLinks {
  linkedTeacherId: string | null;
  linkedStudentIds: string[];
}

export const NO_LINKS: PreviewLinks = { linkedTeacherId: null, linkedStudentIds: [] };

/** Ces rôles ont besoin de la liste des élèves ou du personnel de l'école. */
export const needsPool = (role: UserRole): boolean => role === "ولي أمر" || role === "طالب" || role === "مدرس";

const TEACHING_CATEGORY = "أستاذ / محفظ";

function pickOne<T>(items: readonly T[], rng: Rng): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

/** n éléments distincts au hasard (mélange de Fisher-Yates sur une copie). */
export function sample<T>(items: readonly T[], n: number, rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, Math.min(n, a.length)));
}

const digits = (s: string | undefined) => (s || "").replace(/\D/g, "");
const ALEF = String.fromCharCode(0x627);
const nameKey = (s: string | undefined) =>
  (s || "").replace(/[\u064B-\u065F\u0640]/g, "").replace(/[\u0622\u0623\u0625]/g, ALEF).replace(/\s+/g, " ").trim().toLowerCase();

/** Élèves actifs (non archivés). */
export const activeStudents = (students: PoolStudent[]) => students.filter((s) => s.isArchived !== true);

/**
 * Groupes de frères et sœurs parmi les élèves actifs : même téléphone du parent
 * (au moins 6 chiffres) OU même nom de parent. Fusion transitive. Seuls les
 * groupes d'au moins deux élèves sont rendus.
 */
export function siblingGroups(students: PoolStudent[]): PoolStudent[][] {
  const list = activeStudents(students);
  const parent = list.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  const byKey = new Map<string, number>();
  list.forEach((s, i) => {
    const phone = digits(s.parentPhone);
    const keys = [phone.length >= 6 ? `p:${phone}` : "", nameKey(s.parentName) ? `n:${nameKey(s.parentName)}` : ""].filter(Boolean);
    for (const k of keys) {
      const seen = byKey.get(k);
      if (seen === undefined) byKey.set(k, i);
      else union(i, seen);
    }
  });
  const groups = new Map<number, PoolStudent[]>();
  list.forEach((s, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) || []), s]);
  });
  return [...groups.values()].filter((g) => g.length >= 2);
}

/**
 * Élèves liés à un compte « ولي أمر » : de préférence deux frères et sœurs
 * (même groupe) ; sinon un ou deux élèves actifs au hasard. `null` : aucun
 * élève actif dans l'école.
 */
export function pickParentStudents(students: PoolStudent[], rng: Rng = Math.random): PoolStudent[] | null {
  const active = activeStudents(students);
  if (active.length === 0) return null;
  const groups = siblingGroups(students);
  if (groups.length > 0) return sample(pickOne(groups, rng), 2, rng);
  return sample(active, rng() < 0.5 ? 1 : 2, rng);
}

/**
 * Fiche d'un compte « مدرس » : membre du personnel enseignant (catégorie
 * « أستاذ / محفظ », non archivé), de préférence avec au moins une halaqa
 * (classe non archivée). `null` : aucun enseignant.
 */
export function pickTeacher(teachers: PoolTeacher[], classes: PoolClass[], rng: Rng = Math.random): PoolTeacher | null {
  const eligible = teachers.filter((t) => t.isArchived !== true && t.category === TEACHING_CATEGORY);
  if (eligible.length === 0) return null;
  const withClass = eligible.filter((t) => classes.some((c) => c.isArchived !== true && c.teacherId === t.id));
  return pickOne(withClass.length > 0 ? withClass : eligible, rng);
}

/**
 * Liens à donner au rôle choisi. `null` : l'école n'a pas de donnée adaptée
 * (aucun élève actif, aucun enseignant) ; l'appelant l'affiche et ne change rien.
 */
export function pickPreviewLinks(role: UserRole, pool: PreviewPool, rng: Rng = Math.random): PreviewLinks | null {
  if (role === "ولي أمر") {
    const kids = pickParentStudents(pool.students, rng);
    return kids ? { linkedTeacherId: null, linkedStudentIds: kids.map((k) => k.id) } : null;
  }
  if (role === "طالب") {
    const active = activeStudents(pool.students);
    return active.length ? { linkedTeacherId: null, linkedStudentIds: [pickOne(active, rng).id] } : null;
  }
  if (role === "مدرس") {
    const t = pickTeacher(pool.teachers, pool.classes, rng);
    return t ? { linkedTeacherId: t.id, linkedStudentIds: [] } : null;
  }
  return NO_LINKS;
}

// ------------------------------------------------------------------ bandeau

/**
 * Texte du bandeau : « وضع المعاينة : ولي أمر (فاطمة …) ». Pour les rôles sans
 * lien (ou si les noms sont introuvables), seul le rôle est indiqué.
 */
export function previewBannerText(
  role: UserRole,
  link: { linkedTeacherId?: string | null; linkedStudentIds?: string[] },
  data: { students: Pick<Student, "id" | "fullName">[]; teachers: Pick<Teacher, "id" | "fullName">[] },
): string {
  let who = "";
  if (role === "ولي أمر" || role === "طالب") {
    const ids = new Set(link.linkedStudentIds || []);
    who = data.students.filter((s) => ids.has(s.id)).map((s) => s.fullName).join("، ");
  } else if (role === "مدرس" && link.linkedTeacherId) {
    who = data.teachers.find((t) => t.id === link.linkedTeacherId)?.fullName || "";
  }
  return who ? `وضع المعاينة : ${role} (${who})` : `وضع المعاينة : ${role}`;
}
