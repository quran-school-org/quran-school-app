#!/usr/bin/env tsx
/**
 * Peuple les ÉMULATEURS avec le jeu de données fictif, dans la structure
 * historique, puis applique le provisionnement du Lot 0 (comptes Auth + liens).
 *
 *   npm run emulators            # dans un terminal
 *   npm run seed:emulator        # dans un autre
 *
 * Comptes de démonstration (mots de passe FICTIFS, émulateurs uniquement) :
 *   admin_alfajr / demo-directeur-2026 (مدير), khalid_tazi / 123 (إداري),
 *   youssef_baqali / 123 (مدرس), mohammed_alami / 123 (ولي أمر), ali_rebati / 123 (طالب)…
 * Tous doivent changer leur mot de passe à la première connexion.
 */
import { initAdmin } from "../admin/lib/cli";
import { runLot0Provision } from "../admin/lot0-provision-auth";
import { legacyFixture } from "./fixtures/legacy-alfajr";
import { assertEmulatorDemo, seedLegacyFixture } from "./lib/seed";

const projectId = process.env.GCLOUD_PROJECT || "demo-quran-school";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

async function main() {
  assertEmulatorDemo(projectId);
  const admin = initAdmin(projectId, "(default)", true, "seed");
  try {
    await seedLegacyFixture(admin.db, admin.auth, legacyFixture());
    const { summary } = await runLot0Provision(admin.db, admin.auth, {
      apply: true,
      syncExistingPasswords: true,
      acceptCritical: false,
      outDir: null,
      // Données FICTIVES : mots de passe de démonstration conservés (jamais en prod).
      rotatePasswords: "none",
    });
    console.log("[seed] Données fictives écrites et comptes provisionnés :", JSON.stringify(summary, null, 2));
  } finally {
    await admin.close();
  }
}

main().catch((err) => {
  console.error("[seed] ÉCHEC :", err?.message || err);
  process.exit(1);
});
