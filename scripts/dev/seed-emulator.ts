#!/usr/bin/env tsx
/**
 * Peuple les ÉMULATEURS avec des données FICTIVES, dans les conditions de la
 * production : données historiques à la racine, provisionnement Auth (Lot 0),
 * migration vers schools/alfajr, puis une seconde école (annour).
 *
 *   npm run emulators            # terminal 1
 *   npm run seed:emulator        # terminal 2
 *
 * Comptes de démonstration (mots de passe FICTIFS, émulateurs uniquement) :
 *   admin_alfajr / demo-directeur-2026 (مدير d'alfajr + super-admin de la plateforme)
 *   khalid_tazi / 123 (إداري à alfajr, مدرس à annour), youssef_baqali / 123 (مدرس),
 *   mohammed_alami / 123 (ولي أمر), ali_rebati / 123 (طالب),
 *   dir_annour / demo-annour-2026 (مدير d'annour),
 *   super_demo / demo-super-2026 (super-admin fictif, مدير d'annour : aperçu par rôle, D95).
 * Les comptes migrés doivent changer leur mot de passe à la première connexion.
 */
import { initAdmin } from "../admin/lib/cli";
import { runMigration } from "../migration/migrate-to-tenants";
import { legacyFixture } from "./fixtures/legacy-alfajr";
import { assertEmulatorDemo, seedLegacyFixture } from "./lib/seed";
import { seedPreviewSuperAdmin, seedSecondSchool } from "./lib/seedTenants";

const projectId = process.env.GCLOUD_PROJECT || "demo-quran-school";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

async function main() {
  assertEmulatorDemo(projectId);
  const admin = initAdmin(projectId, "(default)", true, "seed");
  try {
    await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
    const { summary } = await runMigration(admin.db, admin.auth, {
      schoolId: "alfajr",
      apply: true,
      superAdminUsername: "admin_alfajr",
      outDir: null,
      // Données FICTIVES : mots de passe de démonstration conservés (jamais en prod).
      rotatePasswords: "none",
    });
    await seedSecondSchool(admin.db, admin.auth);
    await seedPreviewSuperAdmin(admin.db, admin.auth);
    console.log("[seed] Données fictives migrées vers schools/alfajr + école annour :", JSON.stringify(summary.accounts));
  } finally {
    await admin.close();
  }
}

main().catch((err) => {
  console.error("[seed] ÉCHEC :", err?.message || err);
  process.exit(1);
});
