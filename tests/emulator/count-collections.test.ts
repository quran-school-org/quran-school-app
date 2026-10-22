/**
 * scripts/ops/count-collections.ts (action verify-counts du workflow ops.yml, D59) :
 * nombres seulement, racine et écoles, aucune donnée de document.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { initAdmin, type AdminHandles } from "../../scripts/admin/lib/cli";
import { countCollections } from "../../scripts/ops/count-collections";

const PROJECT = "demo-quran-school";
let admin: AdminHandles;

beforeAll(async () => {
  admin = initAdmin(PROJECT, "(default)", true, "count-collections-test");
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  const db = admin.db;
  await db.doc("students/s1").set({ fullName: "Élève fictif 1" });
  await db.doc("students/s2").set({ fullName: "Élève fictif 2" });
  await db.doc("appUsers/u1").set({ username: "admin_fictif" });
  await db.doc("schools/alfajr").set({ name: "École fictive" });
  await db.doc("schools/alfajr/students/s1").set({ fullName: "Élève fictif 1", schoolId: "alfajr" });
  await db.doc("schools/alfajr/members/m1").set({ role: "مدير", schoolId: "alfajr" });
  await db.doc("schools/alfajr/members/m2").set({ role: "مدرس", schoolId: "alfajr" });
  // École « fantôme » (sous-collection sans document) à l'identifiant non conforme.
  await db.doc("schools/Bad_ID/students/x").set({ fullName: "Élève fictif 3" });
});

afterAll(async () => {
  await admin?.close();
});

describe("comptage des collections (lecture seule)", () => {
  it("compte la racine et chaque école, sans aucun contenu de document", async () => {
    const counts = await countCollections(admin.db);
    expect(counts.root).toMatchObject({ students: 2, appUsers: 1, schools: 1 });
    expect(counts.schools.alfajr).toEqual({ members: 2, students: 1 });
    expect(counts.schools["<identifiant-non-conforme-1>"]).toEqual({ students: 1 });
    const text = JSON.stringify(counts);
    for (const secret of ["Élève fictif", "admin_fictif", "Bad_ID", "s1", "m1", "u1"]) expect(text).not.toContain(secret);
  });
});
