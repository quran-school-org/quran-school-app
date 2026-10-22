import { defineString } from "firebase-functions/params";

/**
 * Région des Cloud Functions. Doit être identique à celle déclarée dans le
 * rewrite `/api/**` de `firebase.json` et dans `src/firebase.ts` (client).
 * Voir docs/DECISIONS.md (D9).
 */
export const FUNCTIONS_REGION = "europe-west1";

/**
 * Base Firestore utilisée par les fonctions (triggers et Admin SDK).
 * Valeur fournie par `functions/.env.<projectId>` (non secrète) :
 *   - demo-quran-school            -> "(default)" (émulateurs)
 *   - gen-lang-client-0481880143   -> base nommée de la prod
 */
export const FIRESTORE_DATABASE_ID = defineString("FIRESTORE_DATABASE_ID", {
  default: "(default)",
  description: "Identifiant de la base Firestore (base nommée en production).",
});

/**
 * Région des triggers Firestore. Pour les fonctions 2nd gen, elle doit être
 * compatible avec l'EMPLACEMENT de la base (ex. base "eur3" -> europe-west1,
 * "nam5" -> us-central1, base régionale -> même région). L'emplacement de la
 * base de prod n'est pas connu du dépôt : à vérifier avant le premier
 * déploiement (voir docs/runbooks/LOT0-DEPLOIEMENT.md) et à fixer dans
 * functions/.env.<projectId>.
 */
export const FIRESTORE_TRIGGER_REGION = defineString("FIRESTORE_TRIGGER_REGION", {
  default: FUNCTIONS_REGION,
  description: "Région des triggers Firestore (compatible avec l'emplacement de la base).",
});
