/**
 * Calcul des liens explicites compte → élèves / fiche du personnel, à partir
 * des données historiques. Aucune correspondance approximative (`includes`) :
 * uniquement des égalités après normalisation, et toute correspondance
 * fragile est signalée pour validation par l'école.
 */

export interface StudentLike {
  id: string;
  fullName?: string;
  parentName?: string;
  parentPhone?: string;
  isArchived?: boolean;
}

export interface TeacherLike {
  id: string;
  fullName?: string;
  isArchived?: boolean;
}

export interface AccountLike {
  id: string;
  role?: string;
  fullName?: string;
  phone?: string;
}

/** Normalise un numéro marocain : chiffres seuls, indicatif 212 → 0. Vide si trop court. */
export function normalizePhone(raw: string | undefined | null): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00212")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("212") && digits.length === 12) digits = "0" + digits.slice(3);
  return digits.length >= 8 ? digits : "";
}

/** Normalise un nom arabe (variantes d'alif, tā' marbūṭa, alif maqṣūra, espaces). */
export function normalizeName(raw: string | undefined | null): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ْ]/g, "")
    .replace(/\s+/g, " ");
}

export type LinkMethod = "id" | "phone" | "name" | "account-phone" | "account-name" | "none";

export interface LinkIssue {
  code: string;
  studentId?: string;
  detail: string;
}

export interface StudentLinkResult {
  studentIds: string[];
  method: LinkMethod;
  issues: LinkIssue[];
}

/** Enfants d'un compte parent (ولي أمر). */
export function computeParentLinks(account: AccountLike, students: StudentLike[]): StudentLinkResult {
  const byId = new Map(students.map((s) => [s.id, s]));
  const issues: LinkIssue[] = [];
  const anchor = account.id.startsWith("p_") ? byId.get(account.id.slice(2)) : undefined;

  if (account.id.startsWith("p_") && !anchor) {
    issues.push({ code: "ANCHOR_MISSING", detail: `élève ${account.id.slice(2)} introuvable` });
  }

  if (anchor) {
    const phone = normalizePhone(anchor.parentPhone);
    const anchorName = normalizeName(anchor.parentName);
    let children: StudentLike[];
    let method: LinkMethod;
    if (phone) {
      children = students.filter((s) => normalizePhone(s.parentPhone) === phone);
      method = "phone";
      for (const c of children) {
        if (normalizeName(c.parentName) !== anchorName) {
          issues.push({ code: "SHARED_PHONE_DIFFERENT_NAME", studentId: c.id, detail: `même téléphone, nom du parent différent (« ${c.parentName} » / « ${anchor.parentName} »)` });
        }
      }
    } else if (anchorName) {
      children = students.filter((s) => !normalizePhone(s.parentPhone) && normalizeName(s.parentName) === anchorName);
      method = "name";
      if (children.length > 1) {
        for (const c of children) {
          if (c.id !== anchor.id) issues.push({ code: "NAME_ONLY_MATCH", studentId: c.id, detail: `rattaché par le seul nom du parent « ${c.parentName} » (homonyme possible)` });
        }
      }
    } else {
      children = [anchor];
      method = "id";
    }
    if (!children.some((c) => c.id === anchor.id)) children.unshift(anchor);
    return { studentIds: Array.from(new Set(children.map((c) => c.id))), method, issues };
  }

  // Compte sans élève d'ancrage (créé à la main) : correspondances exactes, toutes à valider.
  const phone = normalizePhone(account.phone);
  if (phone) {
    const children = students.filter((s) => normalizePhone(s.parentPhone) === phone);
    if (children.length > 0) {
      children.forEach((c) => issues.push({ code: "NO_ANCHOR_PHONE_MATCH", studentId: c.id, detail: `compte sans élève d'origine, rattaché par le téléphone ${phone}` }));
      return { studentIds: children.map((c) => c.id), method: "account-phone", issues };
    }
  }
  const name = normalizeName(account.fullName);
  if (name) {
    const children = students.filter((s) => normalizeName(s.parentName) === name);
    if (children.length > 0) {
      children.forEach((c) => issues.push({ code: "NO_ANCHOR_NAME_MATCH", studentId: c.id, detail: `compte sans élève d'origine, rattaché par le nom « ${account.fullName} »` }));
      return { studentIds: children.map((c) => c.id), method: "account-name", issues };
    }
  }
  issues.push({ code: "NO_CHILD_FOUND", detail: "aucun élève rattaché : le compte ne verra aucun dossier" });
  return { studentIds: [], method: "none", issues };
}

/** Dossier d'un compte élève (طالب). */
export function computeStudentSelfLink(account: AccountLike, students: StudentLike[]): StudentLinkResult {
  const byId = new Map(students.map((s) => [s.id, s]));
  if (account.id.startsWith("s_") && byId.has(account.id.slice(2))) {
    return { studentIds: [account.id.slice(2)], method: "id", issues: [] };
  }
  const name = normalizeName(account.fullName);
  const matches = name ? students.filter((s) => normalizeName(s.fullName) === name) : [];
  if (matches.length === 1) {
    return { studentIds: [matches[0].id], method: "name", issues: [{ code: "STUDENT_NAME_MATCH", studentId: matches[0].id, detail: "dossier rattaché par le seul nom de l'élève" }] };
  }
  return {
    studentIds: [],
    method: "none",
    issues: [{ code: matches.length > 1 ? "STUDENT_NAME_AMBIGUOUS" : "NO_STUDENT_FOUND", detail: matches.length > 1 ? `${matches.length} élèves portent ce nom` : "aucun dossier rattaché" }],
  };
}

/** Fiche du personnel d'un compte (rôles du personnel). */
export function computeTeacherLink(account: AccountLike, teachers: TeacherLike[]): { teacherId: string | null; method: LinkMethod; issues: LinkIssue[] } {
  if (account.id.startsWith("t_")) {
    const id = account.id.slice(2);
    if (teachers.some((t) => t.id === id)) return { teacherId: id, method: "id", issues: [] };
    return { teacherId: null, method: "none", issues: [{ code: "TEACHER_MISSING", detail: `fiche ${id} introuvable` }] };
  }
  const name = normalizeName(account.fullName);
  const matches = name ? teachers.filter((t) => normalizeName(t.fullName) === name) : [];
  if (matches.length === 1) {
    return { teacherId: matches[0].id, method: "name", issues: [{ code: "TEACHER_NAME_MATCH", detail: `fiche ${matches[0].id} rattachée par le seul nom` }] };
  }
  return { teacherId: null, method: "none", issues: matches.length > 1 ? [{ code: "TEACHER_NAME_AMBIGUOUS", detail: `${matches.length} fiches portent ce nom` }] : [] };
}
