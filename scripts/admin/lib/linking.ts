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
  /** true : l'élève EST lié (à retirer si erroné) ; false : il est EXCLU (à ajouter si confirmé). */
  included?: boolean;
}

export interface StudentLinkResult {
  studentIds: string[];
  method: LinkMethod;
  issues: LinkIssue[];
}

/**
 * Enfants d'un compte parent (ولي أمر), par moindre privilège :
 * un enfant n'est lié automatiquement que si le téléphone ET le nom du parent
 * concordent (ou s'il est l'élève d'origine `p_{id}`). Toute correspondance
 * partielle est EXCLUE et listée pour validation par l'école.
 */
export function computeParentLinks(account: AccountLike, students: StudentLike[]): StudentLinkResult {
  const byId = new Map(students.map((s) => [s.id, s]));
  const issues: LinkIssue[] = [];
  const anchor = account.id.startsWith("p_") ? byId.get(account.id.slice(2)) : undefined;

  if (account.id.startsWith("p_") && !anchor) {
    issues.push({ code: "ANCHOR_MISSING", detail: `élève ${account.id.slice(2)} introuvable` });
  }

  const refPhone = normalizePhone(anchor ? anchor.parentPhone : account.phone);
  const refName = normalizeName(anchor ? anchor.parentName : account.fullName);
  const linked = new Set<string>(anchor ? [anchor.id] : []);
  let method: LinkMethod = anchor ? "id" : "none";

  for (const s of students) {
    if (linked.has(s.id)) continue;
    const phone = normalizePhone(s.parentPhone);
    const name = normalizeName(s.parentName);
    const phoneMatch = !!refPhone && phone === refPhone;
    const nameMatch = !!refName && name === refName;
    if (phoneMatch && nameMatch) {
      linked.add(s.id);
      method = anchor ? "phone" : "account-phone";
      if (!anchor) issues.push({ code: "NO_ANCHOR_MATCH", studentId: s.id, included: true, detail: `compte sans élève d'origine : rattaché (téléphone et nom concordent)` });
    } else if (phoneMatch) {
      issues.push({ code: "SHARED_PHONE_DIFFERENT_NAME", studentId: s.id, included: false, detail: `même téléphone mais nom du parent différent (« ${s.parentName} ») : NON rattaché` });
    } else if (nameMatch && !phone && !refPhone) {
      issues.push({ code: "NAME_ONLY_MATCH", studentId: s.id, included: false, detail: `même nom de parent « ${s.parentName} », sans téléphone (homonyme possible) : NON rattaché` });
    } else if (nameMatch && (!phone || !refPhone)) {
      issues.push({ code: "NAME_MATCH_PHONE_MISSING", studentId: s.id, included: false, detail: `même nom de parent, un des téléphones manque : NON rattaché` });
    }
  }

  if (linked.size === 0) {
    issues.push({ code: "NO_CHILD_FOUND", detail: "aucun élève rattaché : le compte ne verra aucun dossier" });
  }
  return { studentIds: Array.from(linked), method: linked.size === 0 ? "none" : method, issues };
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
    return { studentIds: [], method: "none", issues: [{ code: "STUDENT_NAME_MATCH", studentId: matches[0].id, included: false, detail: "un seul dossier porte ce nom : NON rattaché automatiquement (à confirmer)" }] };
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
    return { teacherId: matches[0].id, method: "name", issues: [{ code: "TEACHER_NAME_MATCH", included: true, detail: `fiche ${matches[0].id} rattachée par le seul nom (sans incidence sur les droits)` }] };
  }
  return { teacherId: null, method: "none", issues: matches.length > 1 ? [{ code: "TEACHER_NAME_AMBIGUOUS", detail: `${matches.length} fiches portent ce nom` }] : [] };
}
