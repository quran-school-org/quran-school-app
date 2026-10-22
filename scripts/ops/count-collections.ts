#!/usr/bin/env tsx
/**
 * Comptage des documents par collection (LECTURE SEULE, aucune donnée personnelle).
 *
 * Affiche, en JSON, le nombre de documents :
 *   - de chaque collection à la racine (structure du Lot 0 : students, appUsers…) ;
 *   - de chaque sous-collection de chaque école `schools/{schoolId}/…` (multi-écoles).
 * Seuls des noms de collections, des identifiants d'école et des nombres sont
 * produits : ni identifiant de document, ni contenu. Utilisé par l'action
 * `verify-counts` du workflow `.github/workflows/ops.yml` (D59), avant et
 * après une opération, pour comparer.
 *
 * Usage (émulateurs) :
 *   firebase emulators:exec --only firestore,auth --project demo-quran-school \
 *     "npx tsx scripts/ops/count-collections.ts --project=demo-quran-school"
 * Projet réel : uniquement depuis le workflow ops.yml (compte github-ops).
 *
 * Options : --project (obligatoire), --database (obligatoire hors émulateur).
 * `--apply` est refusé : ce script n'écrit jamais.
 */
import { fileURLToPath } from "node:url";
import type { Firestore } from "firebase-admin/firestore";

import { initAdmin, parseCommonArgs } from "../admin/lib/cli";

/** Identifiant d'école publiable (même motif que la migration). */
const SCHOOL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

export interface CollectionCounts {
  root: Record<string, number>;
  schools: Record<string, Record<string, number>>;
}

async function countOf(db: Firestore, path: string): Promise<number> {
  return (await db.collection(path).count().get()).data().count;
}

export async function countCollections(db: Firestore): Promise<CollectionCounts> {
  const out: CollectionCounts = { root: {}, schools: {} };
  const rootCollections = (await db.listCollections()).map((c) => c.id).sort();
  for (const id of rootCollections) out.root[id] = await countOf(db, id);
  if (rootCollections.includes("schools")) {
    // listDocuments inclut les écoles « fantômes » (sous-collections sans document) : comptées aussi.
    const schools = await db.collection("schools").listDocuments();
    let other = 0;
    for (const ref of schools.sort((a, b) => a.id.localeCompare(b.id))) {
      // Un identifiant inattendu n'est pas affiché tel quel.
      const label = SCHOOL_ID_PATTERN.test(ref.id) ? ref.id : `<identifiant-non-conforme-${++other}>`;
      const counts: Record<string, number> = {};
      const subs = (await ref.listCollections()).map((c) => c.id).sort();
      for (const sub of subs) counts[sub] = await countOf(db, `schools/${ref.id}/${sub}`);
      out.schools[label] = counts;
    }
  }
  return out;
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));
  if (args.apply) throw new Error("Ce script est en lecture seule : --apply est refusé.");
  const admin = initAdmin(args.projectId, args.databaseId, args.emulator, "count-collections");
  try {
    const counts = await countCollections(admin.db);
    console.log(JSON.stringify({ project: args.projectId, database: args.databaseId, ...counts }, null, 2));
  } finally {
    await admin.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("[comptage] ÉCHEC :", err?.message || err);
    process.exit(1);
  });
}
