#!/usr/bin/env tsx
/**
 * Migration vers le schéma multi-écoles (rapport §4.6).
 *
 *   racine X/{id}            → schools/{school}/X/{id}  (même ID, + champ schoolId)
 *   settings/system          → schools/{school}/settings/system (+ paramètres métier)
 *   teachers/{id}            → schools/{school}/teachers/{id}     (fiche publique)
 *                              + schools/{school}/staffPrivate/{id} (fiche RH : salaire,
 *                              contrat, CIN, adresse, contact d'urgence, naissance ;
 *                              bureau seulement, R-06 / D42)
 *   appUsers/{id}            → comptes Firebase Auth (via le provisionnement du Lot 0)
 *                              + users/{uid} + schools/{school}/members/{uid}
 *                              + registre usernames/{username}
 *
 * Idempotent : un document cible déjà présent n'est JAMAIS écrasé (sauf
 * --overwrite), pour ne pas perdre ce qui a été saisi après la bascule. Les
 * données racine ne sont ni modifiées ni supprimées (retour arrière possible),
 * à l'exception du provisionnement Auth du Lot 0 (champ password retiré).
 *
 * Mode --dry-run PAR DÉFAUT. Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/migration/migrate-to-tenants.ts --project=demo-quran-school --school=alfajr [--apply]"
 * Production : PAR UN HUMAIN, voir docs/runbooks/MIGRATION-BASCULE.md.
 *
 * Options : --project (obligatoire), --school (obligatoire), --database (obligatoire hors
 * émulateur), --apply, --confirm-prod=<id>, --super-admin=<username>, --overwrite,
 * --accept-critical, --rotate-passwords=weak|all|none (voir le script du Lot 0),
 * --out=<dossier> (défaut scripts/migration/out, ignoré par git).
 * Les rapports contiennent des données personnelles (et, si des mots de passe sont
 * remplacés, le fichier SECRET comptes/…/mots-de-passe-temporaires.csv) : ne jamais
 * les commiter.
 *
 * Sans --overwrite, les copies utilisent `create` : un document cible apparu
 * entre l'inventaire et l'écriture (relance pendant que la nouvelle application
 * écrit) n'est jamais écrasé ; il est compté comme déjà présent.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

import { initAdmin, parseCommonArgs, timestamp } from "../admin/lib/cli";
import { toCsv } from "../admin/lib/csv";
import { runLot0Provision, type Anomaly } from "../admin/lot0-provision-auth";
import { parseRotationPolicy, type RotationPolicy } from "../admin/lib/passwords";
import { STAFF_PRIVATE_COLLECTION, STAFF_PRIVATE_FIELDS, hasStaffPrivateFields, splitStaffRecord } from "../../src/security/staffPrivate";

/** Les 14 collections métier déplacées sous schools/{schoolId}/. */
export const TENANT_COLLECTIONS = [
  "students", "teachers", "classes", "attendance", "grades", "dailyProgress", "payments",
  "otherIncomes", "expenses", "salaryPayments", "activities", "activityParticipants",
  "activityExpenses", "notifications",
] as const;

const SCHOOL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Paramètres métier implicites de l'ancienne application (valeurs codées en dur). */
export const LEGACY_BUSINESS_DEFAULTS = {
  subscriptionFee: 100,
  feeOverrides: [
    { year: 2026, month: "يوليوز", amount: 70 },
    { year: 2026, month: "غشت", amount: 70 },
  ],
  openingYear: 2026,
  openingMonth: "يوليوز",
  studentAccountMinAge: 15,
};

const MEMBER_FIELDS = [
  "fullName", "role", "roleTitle", "category", "isActive", "isArchived", "email", "phone", "permissions",
  "canEditStudents", "canEditTeachers", "canEditGrades", "canEditPayments",
  "teacherTakeAttendance", "teacherRecordGrades", "teacherWriteBehaviorReports", "teacherEditOwnStudents", "teacherSendAlertsToParents",
  "parentViewOwnStats", "parentViewOwnAttendance", "parentViewCertificates", "parentViewOwnPayments", "parentUpdateContactInfo", "parentRegisterInActivities",
  "linkedTeacherId", "linkedStudentIds", "lastLogin",
];

export interface MigrationOptions {
  schoolId: string;
  apply: boolean;
  overwrite?: boolean;
  superAdminUsername?: string;
  acceptCritical?: boolean;
  syncExistingPasswords?: boolean;
  rotatePasswords?: RotationPolicy;
  outDir: string | null;
  now?: Date;
  log?: (m: string) => void;
}

/** Collections cibles comptées en plus des 14 collections métier. */
export const DERIVED_COLLECTIONS = [STAFF_PRIVATE_COLLECTION] as const;

export interface CollectionCount {
  collection: string;
  source: number;
  targetBefore: number;
  copied: number;
  skippedExisting: number;
  targetAfter: number | null;
}

export interface MigrationSummary {
  mode: "simulation" | "application";
  schoolId: string;
  collections: CollectionCount[];
  settings: "copied" | "existing" | "absent";
  schoolDoc: "created" | "existing";
  /** Fiches publiques déjà présentes dans la cible et encore porteuses de champs RH, scindées. */
  staffSplitExisting: number;
  accounts: { appUsers: number; withAuth: number; usersWritten: number; membersWritten: number; membersSkipped: number; usernamesRegistered: number; pendingAuth: number };
  superAdmin: string | null;
  anomalies: Record<string, number>;
  linksToReview: number;
  critical: boolean;
  reportDir: string | null;
}

function anomaly(list: Anomaly[], severity: Anomaly["severity"], code: string, appUserId: string, detail: string, username = "") {
  list.push({ severity, code, appUserId, username, detail });
}

/** Audit des données (références orphelines, documents trop gros…). */
export function auditData(data: Record<string, { id: string; [k: string]: any }[]>, members: { id: string; role?: string; linkedStudentIds?: string[] }[]): Anomaly[] {
  const out: Anomaly[] = [];
  const studentIds = new Set((data.students || []).map((s) => s.id));
  const classIds = new Set((data.classes || []).map((c) => c.id));
  const teacherIds = new Set((data.teachers || []).map((t) => t.id));
  for (const s of data.students || []) {
    if (s.classId && !classIds.has(s.classId)) anomaly(out, "info", "ORPHAN_CLASS", s.id, `élève rattaché à une halaqa inexistante (${s.classId})`);
    const photo = String(s.photo || s.photoUrl || "");
    if (photo.length > 900_000) anomaly(out, "avertissement", "LARGE_PHOTO", s.id, `photo de ${Math.round(photo.length / 1024)} Ko (base64) : document proche de la limite de 1 Mio`);
  }
  for (const c of data.classes || []) {
    if (c.teacherId && !teacherIds.has(c.teacherId)) anomaly(out, "info", "ORPHAN_TEACHER", c.id, `halaqa liée à un enseignant inexistant (${c.teacherId})`);
  }
  for (const col of ["attendance", "grades", "dailyProgress", "payments"]) {
    const orphans = (data[col] || []).filter((d) => d.studentId && !studentIds.has(d.studentId));
    if (orphans.length > 0) anomaly(out, "info", "ORPHAN_STUDENT_REF", col, `${orphans.length} document(s) de ${col} référencent un élève inexistant`);
  }
  for (const m of members) {
    if (m.role === "ولي أمر" && (!m.linkedStudentIds || m.linkedStudentIds.length === 0)) {
      anomaly(out, "avertissement", "PARENT_WITHOUT_CHILD", m.id, "compte parent sans enfant lié : il ne verra aucun dossier");
    }
  }
  return out;
}

type RawDoc = { id: string; [k: string]: any };

async function readAll(db: Firestore, path: string): Promise<RawDoc[]> {
  const snap = await db.collection(path).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function listIds(db: Firestore, path: string): Promise<Set<string>> {
  const refs = await db.collection(path).listDocuments();
  const ids = new Set<string>();
  // listDocuments inclut les documents « fantômes » (sous-collections seules) : on vérifie l'existence.
  for (let i = 0; i < refs.length; i += 300) {
    const snaps = await db.getAll(...refs.slice(i, i + 300));
    snaps.forEach((s) => { if (s.exists) ids.add(s.id); });
  }
  return ids;
}

export async function runMigration(db: Firestore, auth: Auth, opts: MigrationOptions): Promise<{ summary: MigrationSummary; anomalies: Anomaly[] }> {
  const log = opts.log ?? (() => undefined);
  const s = opts.schoolId;
  if (!SCHOOL_ID_PATTERN.test(s)) throw new Error(`Identifiant d'école invalide : ${s}`);
  const nowIso = (opts.now ?? new Date()).toISOString();
  const reportDir = opts.outDir ? join(opts.outDir, `migration-${s}-${opts.apply ? "application" : "simulation"}-${timestamp(opts.now)}`) : null;
  if (reportDir) mkdirSync(reportDir, { recursive: true });

  // 1. Comptes Auth + liens (provisionnement du Lot 0, idempotent).
  log("[migration] provisionnement des comptes (Lot 0)…");
  const lot0 = await runLot0Provision(db, auth, {
    apply: opts.apply,
    syncExistingPasswords: opts.syncExistingPasswords ?? true,
    rotatePasswords: opts.rotatePasswords,
    acceptCritical: opts.acceptCritical ?? false,
    outDir: reportDir ? join(reportDir, "comptes") : null,
    now: opts.now,
  });
  const anomalies: Anomaly[] = [...lot0.plan.anomalies];

  // 2. Lecture de la source (racine) après provisionnement.
  const source: Record<string, RawDoc[]> = {};
  for (const col of TENANT_COLLECTIONS) source[col] = await readAll(db, col);
  const appUsers = await readAll(db, "appUsers");
  const settingsSnap = await db.collection("settings").doc("system").get();

  // 3. Copie des collections (sans jamais écraser un document cible existant).
  const writer = opts.apply ? db.bulkWriter() : null;
  writer?.onWriteError((err) => err.code !== 6 /* ALREADY_EXISTS */ && err.failedAttempts < 5);
  const writeErrors: string[] = [];
  // ALREADY_EXISTS (code 6) : le document cible existe déjà (course) → jamais écrasé, compté à part.
  const alreadyExisted = new Map<string, number>();
  const track = (p: Promise<unknown>, what: string, group?: string) => {
    p.catch((e) => {
      if (e?.code === 6 && group) alreadyExisted.set(group, (alreadyExisted.get(group) || 0) + 1);
      else writeErrors.push(`${what} : ${e?.message || e}`);
    });
  };
  const put = (ref: DocumentReference, data: Record<string, unknown>) =>
    opts.overwrite ? writer!.set(ref, data) : writer!.create(ref, data);
  const counts: CollectionCount[] = [];
  for (const col of TENANT_COLLECTIONS) {
    const targetPath = `schools/${s}/${col}`;
    const existing = await listIds(db, targetPath);
    let copied = 0;
    let skipped = 0;
    for (const d of source[col]) {
      if (existing.has(d.id) && !opts.overwrite) { skipped++; continue; }
      copied++;
      if (writer) {
        const { id, ...data } = d;
        // Personnel : la fiche publique ne porte plus aucun champ RH (D42).
        const body = col === "teachers" ? splitStaffRecord(data).publicData : data;
        track(put(db.collection(targetPath).doc(id), { ...body, id, schoolId: s }), `${targetPath}/${id}`, col);
      }
    }
    counts.push({ collection: col, source: source[col].length, targetBefore: existing.size, copied, skippedExisting: skipped, targetAfter: null });
    log(`[migration] ${col.padEnd(22)} source ${source[col].length}, déjà présents ${skipped}, à copier ${copied}`);
  }

  // 3 bis. Fiches RH du personnel (staffPrivate), même identifiant que la fiche publique.
  const staffPath = `schools/${s}/${STAFF_PRIVATE_COLLECTION}`;
  const existingStaff = await listIds(db, staffPath);
  const staffSource = source.teachers.filter((t) => hasStaffPrivateFields(t));
  // Fiches publiques cibles encore porteuses de champs RH (voir 3 ter) : leurs
  // valeurs, plus récentes que la racine, font foi.
  const legacyTargets = (await readAll(db, `schools/${s}/teachers`)).filter((t) => hasStaffPrivateFields(t));
  const legacyTargetIds = new Set(legacyTargets.map((t) => t.id));
  let staffCopied = 0;
  let staffSkipped = 0;
  for (const t of staffSource) {
    if ((existingStaff.has(t.id) && !opts.overwrite) || legacyTargetIds.has(t.id)) { staffSkipped++; continue; }
    staffCopied++;
    if (writer) {
      track(put(db.collection(staffPath).doc(t.id), { ...splitStaffRecord(t).privateData, teacherId: t.id, schoolId: s, updatedAt: nowIso }), `${staffPath}/${t.id}`, STAFF_PRIVATE_COLLECTION);
    }
  }
  counts.push({ collection: STAFF_PRIVATE_COLLECTION, source: staffSource.length, targetBefore: existingStaff.size, copied: staffCopied, skippedExisting: staffSkipped, targetAfter: null });
  log(`[migration] ${STAFF_PRIVATE_COLLECTION.padEnd(22)} source ${staffSource.length}, déjà présents ${staffSkipped}, à copier ${staffCopied}`);

  // 3 ter. Fiches publiques DÉJÀ présentes dans la cible avec des champs RH
  // (répétition antérieure à D42, ou saisie par une version précédente de
  // l'application) : les champs RH sont déplacés vers staffPrivate (sans écraser
  // une fiche RH existante) puis retirés de la fiche publique. Seule
  // modification d'un document cible existant : c'est le correctif R-06.
  let staffSplitExisting = 0;
  for (const t of legacyTargets) {
    staffSplitExisting++;
    anomaly(anomalies, "info", "STAFF_PRIVATE_SPLIT", t.id, "fiche publique existante porteuse de champs RH : champs déplacés vers staffPrivate");
    if (writer) {
      const privRef = db.collection(staffPath).doc(t.id);
      if (!existingStaff.has(t.id)) {
        track(writer.create(privRef, { ...splitStaffRecord(t).privateData, teacherId: t.id, schoolId: s, updatedAt: nowIso }), privRef.path, STAFF_PRIVATE_COLLECTION);
      }
      const removed: Record<string, FieldValue> = {};
      for (const k of STAFF_PRIVATE_FIELDS) removed[k] = FieldValue.delete();
      track(writer.update(db.collection(`schools/${s}/teachers`).doc(t.id), removed), `schools/${s}/teachers/${t.id}`);
    }
  }

  // 4. Paramètres de l'école (+ paramètres métier implicites de l'ancienne application).
  const settingsRef = db.collection("schools").doc(s).collection("settings").doc("system");
  const targetSettings = await settingsRef.get();
  let settingsState: MigrationSummary["settings"] = "absent";
  const legacySettings = settingsSnap.exists ? settingsSnap.data()! : null;
  if (targetSettings.exists && !opts.overwrite) {
    settingsState = "existing";
  } else if (legacySettings) {
    settingsState = "copied";
    const merged: Record<string, unknown> = { ...legacySettings, schoolId: s };
    if (!(Number(merged.subscriptionFee) > 0)) {
      anomaly(anomalies, "info", "SUBSCRIPTION_FEE_SET", "settings", `cotisation de référence ${merged.subscriptionFee ?? "absente"} remplacée par ${LEGACY_BUSINESS_DEFAULTS.subscriptionFee} (valeur réellement appliquée par l'ancienne application)`);
      merged.subscriptionFee = LEGACY_BUSINESS_DEFAULTS.subscriptionFee;
    }
    for (const k of ["feeOverrides", "openingYear", "openingMonth", "studentAccountMinAge"] as const) {
      if (merged[k] === undefined) merged[k] = LEGACY_BUSINESS_DEFAULTS[k];
    }
    if (writer) track(put(settingsRef, merged), settingsRef.path, "settings");
  }

  // 5. Document de l'école.
  const schoolRef = db.collection("schools").doc(s);
  const schoolSnap = await schoolRef.get();
  const schoolDoc: MigrationSummary["schoolDoc"] = schoolSnap.exists ? "existing" : "created";
  if (!schoolSnap.exists && writer) {
    track(writer.create(schoolRef, {
      name: String(legacySettings?.associationName || s), slug: s, status: "active",
      createdAt: nowIso, migratedAt: nowIso, migratedFrom: "racine (version mono-école)",
    }), schoolRef.path, "school");
  }

  // 6. Comptes : users/{uid}, members/{uid}, registre usernames.
  const memberIds = await listIds(db, `schools/${s}/members`);
  const accounts = { appUsers: appUsers.length, withAuth: 0, usersWritten: 0, membersWritten: 0, membersSkipped: 0, usernamesRegistered: 0, pendingAuth: 0 };
  const membersForAudit: { id: string; role?: string; linkedStudentIds?: string[] }[] = [];
  const seenUids = new Map<string, string>();
  for (const u of appUsers) {
    const uid: string | undefined = typeof u.authUid === "string" ? u.authUid : undefined;
    membersForAudit.push({ id: u.id, role: u.role, linkedStudentIds: u.linkedStudentIds });
    if (!uid) { accounts.pendingAuth++; continue; }
    accounts.withAuth++;
    if (seenUids.has(uid)) {
      anomaly(anomalies, "critique", "DUPLICATE_AUTH_UID", u.id, `même compte Auth que ${seenUids.get(uid)} : membre ignoré`, u.username);
      continue;
    }
    seenUids.set(uid, u.id);
    const username = String(u.username || "");

    const reg = await db.collection("usernames").doc(username).get();
    if (reg.exists && reg.data()?.uid !== uid) {
      anomaly(anomalies, "critique", "USERNAME_REGISTRY_CONFLICT", u.id, `le nom d'utilisateur ${username} est déjà enregistré pour un autre compte`, username);
    } else if (!reg.exists) {
      accounts.usernamesRegistered++;
      if (writer) track(writer.create(db.collection("usernames").doc(username), { uid, email: u.authEmail || null, createdAt: nowIso, source: "migration" }), `usernames/${username}`);
    }

    accounts.usersWritten++;
    if (writer) {
      const userRef = db.collection("users").doc(uid);
      const existingUser = await userRef.get();
      track(writer.set(userRef, {
        username,
        displayName: u.fullName || username,
        schoolIds: FieldValue.arrayUnion(s),
        legacyAppUserIds: FieldValue.arrayUnion(u.id),
        ...(existingUser.exists && existingUser.data()?.lastSchoolId ? {} : { lastSchoolId: s }),
        ...(existingUser.exists && existingUser.data()?.mustChangePassword !== undefined ? {} : { mustChangePassword: u.mustChangePassword !== false }),
        migratedAt: nowIso,
      }, { merge: true }), userRef.path);
    }

    if (memberIds.has(uid) && !opts.overwrite) { accounts.membersSkipped++; continue; }
    accounts.membersWritten++;
    if (writer) {
      const member: Record<string, unknown> = { uid, schoolId: s, username, legacyAppUserId: u.id, migratedAt: nowIso };
      for (const k of MEMBER_FIELDS) if (u[k] !== undefined) member[k] = u[k];
      member.isActive = u.isActive !== false;
      member.linkedStudentIds = Array.isArray(u.linkedStudentIds) ? u.linkedStudentIds : [];
      member.linkedTeacherId = u.linkedTeacherId ?? null;
      track(put(db.collection("schools").doc(s).collection("members").doc(uid), member), `schools/${s}/members/${uid}`, "members");
    }
  }

  // 7. Super-admin de la plateforme (claim).
  let superAdmin: string | null = null;
  if (opts.superAdminUsername) {
    const u = appUsers.find((x) => x.username === opts.superAdminUsername && typeof x.authUid === "string");
    if (!u) {
      anomaly(anomalies, "critique", "SUPER_ADMIN_NOT_FOUND", "-", `compte ${opts.superAdminUsername} introuvable ou sans compte Auth`);
    } else {
      superAdmin = u.username;
      if (opts.apply) {
        const rec = await auth.getUser(u.authUid);
        await auth.setCustomUserClaims(u.authUid, { ...(rec.customClaims || {}), superAdmin: true });
      }
    }
  }

  if (writer) await writer.close();
  for (const c of counts) {
    const n = alreadyExisted.get(c.collection) || 0;
    c.copied -= n;
    c.skippedExisting += n;
  }
  if (alreadyExisted.get("settings")) settingsState = "existing";
  const raced = alreadyExisted.get("members") || 0;
  accounts.membersWritten -= raced;
  accounts.membersSkipped += raced;
  for (const e of writeErrors) anomaly(anomalies, "critique", "WRITE_FAILED", "-", e);

  // 8. Audit et comptages après écriture.
  anomalies.push(...auditData(source, membersForAudit));
  if (opts.apply) {
    for (const c of counts) c.targetAfter = (await db.collection(`schools/${s}/${c.collection}`).count().get()).data().count;
  }

  const summary: MigrationSummary = {
    mode: opts.apply ? "application" : "simulation",
    schoolId: s,
    collections: counts,
    staffSplitExisting,
    settings: settingsState,
    schoolDoc,
    accounts,
    superAdmin,
    anomalies: anomalies.reduce<Record<string, number>>((m, a) => ({ ...m, [a.code]: (m[a.code] || 0) + 1 }), {}),
    linksToReview: lot0.summary.linksToReview,
    critical: anomalies.some((a) => a.severity === "critique"),
    reportDir,
  };

  if (reportDir) {
    writeFileSync(join(reportDir, "resume.json"), JSON.stringify(summary, null, 2));
    writeFileSync(join(reportDir, "comptages.csv"), toCsv(counts as unknown as Record<string, unknown>[]));
    writeFileSync(join(reportDir, "anomalies.csv"), toCsv(anomalies as unknown as Record<string, unknown>[], ["severity", "code", "appUserId", "username", "detail"]));
  }
  return { summary, anomalies };
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2), process.env, "scripts/migration/out");
  const school = args.flags.get("school");
  if (typeof school !== "string" || !school) throw new Error("--school=<id> est obligatoire (ex. --school=alfajr).");
  const superAdmin = args.flags.get("super-admin");
  console.log(`[migration] ${args.emulator ? "ÉMULATEURS" : "PROJET RÉEL"} ${args.projectId} / base ${args.databaseId} → schools/${school} — mode ${args.apply ? "APPLICATION" : "SIMULATION (--dry-run)"}`);
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator);
  try {
    const { summary } = await runMigration(admin.db, admin.auth, {
      schoolId: school,
      apply: args.apply,
      overwrite: args.flags.has("overwrite"),
      superAdminUsername: typeof superAdmin === "string" ? superAdmin : undefined,
      acceptCritical: args.flags.has("accept-critical"),
      syncExistingPasswords: !args.flags.has("no-sync-passwords"),
      rotatePasswords: parseRotationPolicy(args.flags.get("rotate-passwords")),
      outDir: args.outDir,
      log: (m) => console.log(m),
    });
    console.log(JSON.stringify(summary, null, 2));
    console.log("[migration] Rapports (données personnelles, ne pas commiter) :", summary.reportDir);
    if (!args.apply) console.log("[migration] Simulation terminée : aucune écriture. Relancer avec --apply pour appliquer.");
    if (args.apply && summary.critical) {
      console.error("[migration] Anomalies critiques (échecs de comptes ou d'écriture, conflits) : voir anomalies.csv, corriger puis relancer.");
      process.exitCode = 2;
    }
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[migration] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
