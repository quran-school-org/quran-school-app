/**
 * Cache local (localStorage) cloisonné par école.
 *
 * Toutes les clés ont la forme `kuttab:{schoolId}:{nom}`. Au changement d'école
 * le cache de l'école quittée est purgé ; à la déconnexion tout est purgé ; les
 * anciennes clés `alfajr_*` (version mono-école, qui pouvaient contenir des mots
 * de passe) sont supprimées au démarrage.
 */

export const CACHE_PREFIX = "kuttab";
const NO_SCHOOL = "_";

let scope: string | null = null;

export function setCacheScope(schoolId: string | null): void {
  scope = schoolId;
}

export function getCacheScope(): string | null {
  return scope;
}

/** Vrai si une école est active (sinon, rien n'est écrit dans le cache). */
export function hasCacheScope(): boolean {
  return scope !== null;
}

/** Clé cloisonnée par école. Accepte aussi les anciens noms `alfajr_*`. */
export function scopedKey(name: string): string {
  const base = name.replace(/^alfajr_/, "");
  return `${CACHE_PREFIX}:${scope ?? NO_SCHOOL}:${base}`;
}

function removeWhere(predicate: (key: string) => boolean): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && predicate(k)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error("Error purging local cache:", e);
  }
}

/** Purge le cache d'une école. */
export function clearSchoolCache(schoolId: string): void {
  removeWhere((k) => k.startsWith(`${CACHE_PREFIX}:${schoolId}:`));
}

/** Purge tout le cache applicatif (déconnexion). */
export function clearAllCaches(): void {
  removeWhere((k) => k.startsWith(`${CACHE_PREFIX}:`) || k.startsWith("alfajr_"));
}

/** Supprime les clés de la version mono-école (`alfajr_*`). */
export function purgeLegacyAlfajrKeys(): void {
  removeWhere((k) => k.startsWith("alfajr_"));
}

/** Préférence non sensible : dernière école ouverte sur ce navigateur. */
const LAST_SCHOOL_KEY = `${CACHE_PREFIX}:lastSchoolId`;

export function rememberLastSchool(schoolId: string | null): void {
  try {
    if (schoolId) localStorage.setItem(LAST_SCHOOL_KEY, schoolId);
    else localStorage.removeItem(LAST_SCHOOL_KEY);
  } catch {
    /* ignore */
  }
}

export function readLastSchool(): string | null {
  try {
    return localStorage.getItem(LAST_SCHOOL_KEY);
  } catch {
    return null;
  }
}
