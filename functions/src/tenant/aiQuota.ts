/**
 * Limitation de débit du proxy IA (fonction `api`, O-03, D43).
 *
 * Compteurs Firestore mis à jour dans UNE transaction par requête :
 *   aiQuota/u_{uid}_{jour}          rapports par utilisateur et par jour
 *   aiQuota/m_{uid}_{minute}        rafale par utilisateur et par minute
 *   aiQuota/s_{schoolId}_{jour}     rapports par école et par jour
 *   aiQuota/g_{jour}                quota global de la plateforme par jour
 * Jour et minute en UTC. Collection à la racine : fermée aux clients par les
 * règles (match /{document=**}), écrite par l'Admin SDK seulement. Chaque
 * document porte `expiresAt` (politique TTL à activer par un humain, voir
 * docs/runbooks/PROXY-IA.md) : rien n'est lu après expiration.
 *
 * Toutes les limites sont des paramètres (functions/.env.<projet>) ; une limite
 * à 0 ferme le service à ce niveau (ex. AI_DAILY_LIMIT_GLOBAL=0 : coupure
 * d'urgence sans redéploiement du code).
 */
import { createHash } from "node:crypto";
import { defineInt } from "firebase-functions/params";
import { Timestamp, type Firestore } from "firebase-admin/firestore";

/** Valeurs par défaut (aussi déclarées aux paramètres pour la CLI Firebase). */
export const DEFAULT_AI_LIMITS = { perUserDaily: 30, perUserPerMinute: 5, perSchoolDaily: 300, globalDaily: 1000 } as const;

export const AI_DAILY_LIMIT_PER_USER = defineInt("AI_DAILY_LIMIT_PER_USER", {
  default: DEFAULT_AI_LIMITS.perUserDaily,
  description: "Rapports IA par utilisateur et par jour (UTC). 0 = service fermé.",
});
export const AI_PER_MINUTE_LIMIT_PER_USER = defineInt("AI_PER_MINUTE_LIMIT_PER_USER", {
  default: DEFAULT_AI_LIMITS.perUserPerMinute,
  description: "Rapports IA par utilisateur et par minute (rafale). 0 = service fermé.",
});
export const AI_DAILY_LIMIT_PER_SCHOOL = defineInt("AI_DAILY_LIMIT_PER_SCHOOL", {
  default: DEFAULT_AI_LIMITS.perSchoolDaily,
  description: "Rapports IA par école et par jour (UTC). 0 = service fermé.",
});
export const AI_DAILY_LIMIT_GLOBAL = defineInt("AI_DAILY_LIMIT_GLOBAL", {
  default: DEFAULT_AI_LIMITS.globalDaily,
  description: "Rapports IA par jour pour toute la plateforme (UTC). 0 = coupure d'urgence.",
});

/**
 * Valeur d'un paramètre entier. Hors de la CLI Firebase (tests directs), la
 * variable est absente et `.value()` vaudrait 0 : on prend alors la valeur par
 * défaut. Une valeur présente mais illisible donne 0 (service fermé : sûr).
 */
function readLimit(param: { name: string; value: () => number }, fallback: number): number {
  return process.env[param.name] === undefined ? fallback : param.value();
}

export interface AiLimits {
  perUserDaily: number;
  perUserPerMinute: number;
  perSchoolDaily: number;
  globalDaily: number;
}

export type QuotaScope = "user" | "user-minute" | "school" | "global";

export type QuotaDecision =
  | { allowed: true; remaining: { user: number; school: number; global: number } }
  | { allowed: false; scope: QuotaScope; retryAfterSeconds: number };

export const QUOTA_COLLECTION = "aiQuota";

/** Limites lues dans les paramètres des Functions (surcharges possibles pour les tests). */
export function currentLimits(overrides: Partial<AiLimits> = {}): AiLimits {
  return {
    perUserDaily: readLimit(AI_DAILY_LIMIT_PER_USER, DEFAULT_AI_LIMITS.perUserDaily),
    perUserPerMinute: readLimit(AI_PER_MINUTE_LIMIT_PER_USER, DEFAULT_AI_LIMITS.perUserPerMinute),
    perSchoolDaily: readLimit(AI_DAILY_LIMIT_PER_SCHOOL, DEFAULT_AI_LIMITS.perSchoolDaily),
    globalDaily: readLimit(AI_DAILY_LIMIT_GLOBAL, DEFAULT_AI_LIMITS.globalDaily),
    ...overrides,
  };
}

/** Pseudonyme stable d'un identifiant, pour les journaux (aucun uid en clair). */
export function pseudonym(value: string): string {
  return createHash("sha256").update(`kuttab-ai:${value}`).digest("hex").slice(0, 12);
}

const dayKey = (now: Date) => now.toISOString().slice(0, 10); // AAAA-MM-JJ
const minuteKey = (now: Date) => now.toISOString().slice(0, 16).replace(/[-:T]/g, ""); // AAAAMMJJHHMM

function secondsUntilNextUtcDay(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

/**
 * Consomme une unité de quota pour (uid, école) si AUCUNE limite n'est
 * atteinte ; sinon ne consomme rien et indique la limite atteinte. Atomique
 * (transaction) : des requêtes simultanées ne dépassent jamais la limite.
 */
export async function consumeAiQuota(
  db: Firestore,
  uid: string,
  schoolId: string,
  limits: AiLimits,
  now: Date = new Date(),
): Promise<QuotaDecision> {
  const day = dayKey(now);
  const minute = minuteKey(now);
  const col = db.collection(QUOTA_COLLECTION);
  const dayExpiry = Timestamp.fromMillis(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));
  const minuteExpiry = Timestamp.fromMillis(now.getTime() + 2 * 3600_000);

  const counters: { scope: QuotaScope; ref: FirebaseFirestore.DocumentReference; limit: number; data: Record<string, unknown>; retry: number }[] = [
    { scope: "global", ref: col.doc(`g_${day}`), limit: limits.globalDaily, data: { scope: "global", day, expiresAt: dayExpiry }, retry: secondsUntilNextUtcDay(now) },
    { scope: "school", ref: col.doc(`s_${schoolId}_${day}`), limit: limits.perSchoolDaily, data: { scope: "school", schoolId, day, expiresAt: dayExpiry }, retry: secondsUntilNextUtcDay(now) },
    { scope: "user", ref: col.doc(`u_${uid}_${day}`), limit: limits.perUserDaily, data: { scope: "user", day, expiresAt: dayExpiry }, retry: secondsUntilNextUtcDay(now) },
    { scope: "user-minute", ref: col.doc(`m_${uid}_${minute}`), limit: limits.perUserPerMinute, data: { scope: "user-minute", minute, expiresAt: minuteExpiry }, retry: 60 - now.getUTCSeconds() },
  ];

  return db.runTransaction(async (tx) => {
    const snaps = await tx.getAll(...counters.map((c) => c.ref));
    const counts = snaps.map((s) => Number(s.get("count")) || 0);
    for (let i = 0; i < counters.length; i++) {
      if (counts[i] >= counters[i].limit) {
        return { allowed: false, scope: counters[i].scope, retryAfterSeconds: counters[i].retry } as QuotaDecision;
      }
    }
    counters.forEach((c, i) => {
      tx.set(c.ref, { ...c.data, count: counts[i] + 1, updatedAt: Timestamp.fromDate(now) }, { merge: true });
    });
    return {
      allowed: true,
      remaining: {
        global: limits.globalDaily - counts[0] - 1,
        school: limits.perSchoolDaily - counts[1] - 1,
        user: limits.perUserDaily - counts[2] - 1,
      },
    } as QuotaDecision;
  });
}
