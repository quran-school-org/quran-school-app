/**
 * Fiche du personnel scindée en deux documents (R-06, D14, D42) :
 *
 *   schools/{s}/teachers/{id}      fiche publique (nom, catégorie, fonction,
 *                                  téléphone professionnel, horaires…) :
 *                                  lisible par la pédagogie ;
 *   schools/{s}/staffPrivate/{id}  fiche RH (salaire, type de contrat, CIN,
 *                                  adresse, contact d'urgence, date de
 *                                  naissance) : bureau (مدير, إداري) seulement.
 *
 * Module pur (sans Firebase) : utilisé par le client, le script de migration,
 * le peuplement de démonstration et les tests. Les règles Firestore
 * (`firestore.rules`) reprennent la même liste de champs.
 */

/** Champs personnels ou financiers retirés de `teachers` (ordre stable). */
export const STAFF_PRIVATE_FIELDS = [
  "monthlySalary",
  "contractType",
  "cinNumber",
  "emergencyContact",
  "birthDate",
  "address",
] as const;

export type StaffPrivateField = (typeof STAFF_PRIVATE_FIELDS)[number];

/** Champs techniques autorisés en plus dans un document `staffPrivate`. */
export const STAFF_PRIVATE_META_FIELDS = ["schoolId", "teacherId", "updatedAt"] as const;

export const STAFF_PRIVATE_COLLECTION = "staffPrivate";

const PRIVATE_SET = new Set<string>(STAFF_PRIVATE_FIELDS);

export function isStaffPrivateField(key: string): key is StaffPrivateField {
  return PRIVATE_SET.has(key);
}

/** Vrai si l'objet porte au moins un champ RH (valeur définie). */
export function hasStaffPrivateFields(record: Record<string, unknown> | null | undefined): boolean {
  if (!record) return false;
  return STAFF_PRIVATE_FIELDS.some((k) => record[k] !== undefined);
}

/**
 * Sépare une fiche complète en partie publique et partie RH. Les champs RH
 * absents (`undefined`) ne figurent pas dans la partie RH : une écriture en
 * fusion ne les efface donc pas.
 */
export function splitStaffRecord<T extends Record<string, any>>(record: T): {
  publicData: Omit<T, StaffPrivateField>;
  privateData: Partial<Pick<T, StaffPrivateField & keyof T>>;
} {
  const publicData: Record<string, unknown> = {};
  const privateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (isStaffPrivateField(k)) {
      if (v !== undefined) privateData[k] = v;
    } else {
      publicData[k] = v;
    }
  }
  return { publicData: publicData as Omit<T, StaffPrivateField>, privateData: privateData as any };
}

/**
 * Recompose les fiches pour le bureau : fiche publique + fiche RH de même
 * identifiant. Une fiche RH orpheline (sans fiche publique) est ignorée. Les
 * champs RH d'une fiche publique (données antérieures à la scission) sont
 * remplacés par ceux de la fiche RH quand elle existe.
 */
export function mergeStaffRecords<T extends { id: string }>(
  publicDocs: T[],
  privateDocs: { id: string; [k: string]: unknown }[],
): T[] {
  const byId = new Map(privateDocs.map((p) => [p.id, p]));
  return publicDocs.map((t) => {
    const priv = byId.get(t.id);
    if (!priv) return t;
    const extra: Record<string, unknown> = {};
    for (const k of STAFF_PRIVATE_FIELDS) if (priv[k] !== undefined) extra[k] = priv[k];
    return { ...t, ...extra };
  });
}

/** Retire les champs RH d'une fiche (lecture par un rôle sans droit RH). */
export function stripStaffPrivate<T extends Record<string, any>>(record: T): Omit<T, StaffPrivateField> {
  return splitStaffRecord(record).publicData;
}
