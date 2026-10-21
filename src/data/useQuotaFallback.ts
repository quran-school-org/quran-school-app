/**
 * Extrait mécaniquement d'App.tsx (Lot 2, sans changement de comportement).
 */
import { useEffect } from "react";
import { subscribeToQuotaState } from "../firebase";
import type { CoreScope } from "../app/scope";

export function useQuotaFallback(s: CoreScope) {
  const {
    loadDatabase,
    setFirestoreQuotaExceeded,
    setSyncStatus,
  } = s;

  // Listen to global Firestore Quota state
  useEffect(() => {
    return subscribeToQuotaState((exceeded) => {
      setFirestoreQuotaExceeded(exceeded);
      if (exceeded) {
        setSyncStatus("error");
        loadDatabase();
      }
    });
  }, []);

}
