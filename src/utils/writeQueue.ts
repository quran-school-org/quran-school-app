/**
 * File d'écritures par document (audit UX, constat 23, D100).
 *
 * À la connexion, l'application écrit plusieurs champs anodins du MÊME document
 * (`users/{uid}` : école mémorisée, dernière connexion). Lancées en même temps,
 * ces écritures se disputent le document et l'émulateur répond 409 (ABORTED)
 * sur `documents:commit`. Ici, les tâches d'une même clé s'exécutent l'une après
 * l'autre, dans l'ordre d'appel ; des clés différentes restent indépendantes.
 * Une tâche en échec ne bloque pas les suivantes.
 */
const tails = new Map<string, Promise<void>>();

export function serializeWrites<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(task);
  const tail = run.then(() => undefined, () => undefined);
  tails.set(key, tail);
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}
