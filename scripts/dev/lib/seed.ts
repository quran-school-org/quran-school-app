/** Écriture d'un jeu de données fictif (structure historique) via l'Admin SDK. */
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { LegacyFixture } from "../fixtures/legacy-alfajr";

export async function seedLegacyFixture(db: Firestore, auth: Auth, fixture: LegacyFixture): Promise<void> {
  for (const [col, docs] of Object.entries(fixture.collections)) {
    const entries = Object.entries(docs);
    for (let i = 0; i < entries.length; i += 400) {
      const batch = db.batch();
      for (const [id, data] of entries.slice(i, i + 400)) batch.set(db.collection(col).doc(id), data);
      await batch.commit();
    }
  }
  await db.collection("settings").doc("system").set(fixture.settings);
  for (const u of fixture.preexistingAuth) {
    try {
      await auth.getUserByEmail(u.email);
    } catch {
      await auth.createUser(u);
    }
  }
}

/** Garde-fou : ces outils ne tournent QUE sur les émulateurs avec un projet demo-*. */
export function assertEmulatorDemo(projectId: string): void {
  if (!projectId.startsWith("demo-") || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Réservé aux émulateurs (projet demo-*, FIRESTORE_EMULATOR_HOST et FIREBASE_AUTH_EMULATOR_HOST définis).");
  }
}
