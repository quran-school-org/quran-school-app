/**
 * Remplacement des mots de passe exposés (revue de sécurité, constat R-01).
 *
 * Avant le Lot 0, tous les mots de passe de `appUsers` étaient lisibles
 * publiquement (faille S1) et le mot de passe du directeur figurait dans le
 * bundle JavaScript (S4). Les reprendre tels quels dans Firebase Auth laisse
 * ces comptes ouverts à quiconque les a relevés ; `mustChangePassword` n'est
 * qu'un rappel affiché par l'interface, pas une protection.
 *
 * Politiques (`--rotate-passwords=`) :
 *   - `weak` (défaut) : mots de passe faibles ou notoirement exposés, et TOUS
 *     les comptes du bureau (مدير, إداري), qui ouvrent les finances et la
 *     gestion des comptes ;
 *   - `all`  : tous les comptes (recommandé si une collecte de `appUsers` est suspectée) ;
 *   - `none` : comportement historique (données de démonstration uniquement).
 * Les mots de passe temporaires ne sont écrits que dans le rapport secret
 * `mots-de-passe-temporaires.csv` (jamais dans Firestore ni dans les journaux).
 */
import { randomInt } from "node:crypto";

export type RotationPolicy = "weak" | "all" | "none";

export const ROTATION_POLICIES: RotationPolicy[] = ["weak", "all", "none"];

/** Mots de passe publiés dans le code de l'ancienne application (S4). */
export const KNOWN_EXPOSED_PASSWORDS = ["123", "FajrAcademy@2026!"];

const OFFICE_ROLES = ["مدير", "إداري"];

export function parseRotationPolicy(value: unknown): RotationPolicy {
  if (value === undefined) return "weak";
  if (typeof value === "string" && (ROTATION_POLICIES as string[]).includes(value)) return value as RotationPolicy;
  throw new Error(`--rotate-passwords doit valoir ${ROTATION_POLICIES.join(", ")}.`);
}

/** Mot de passe devinable sans avoir relevé la base. */
export function isWeakPassword(password: string, username: string, phone?: string | null): boolean {
  const p = password.trim();
  if (p.length < 8) return true;
  if (KNOWN_EXPOSED_PASSWORDS.includes(p)) return true;
  const lower = p.toLowerCase();
  if (lower === username.toLowerCase() || lower.includes(username.toLowerCase())) return true;
  const digits = p.replace(/\D/g, "");
  const phoneDigits = (phone || "").replace(/\D/g, "");
  if (phoneDigits.length >= 8 && digits.length >= 8 && (phoneDigits.endsWith(digits) || digits.endsWith(phoneDigits.slice(-8)))) return true;
  if (/^(\d)\1+$/.test(p) || /^(0123456789|123456789|12345678|azerty|qwerty|password|motdepasse)/i.test(p)) return true;
  return false;
}

export function shouldRotate(policy: RotationPolicy, account: { role: string; username: string; phone?: string | null; knownPassword: string | null }): boolean {
  if (account.knownPassword === null) return false; // déjà provisionné : jamais régénéré à la relance
  if (policy === "none") return false;
  if (policy === "all") return true;
  return OFFICE_ROLES.includes(account.role) || isWeakPassword(account.knownPassword, account.username, account.phone);
}

// Alphabet sans caractères ambigus (0/O, 1/l/I), facile à dicter.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Mot de passe temporaire aléatoire (CSPRNG), format « xxxx-xxxx-xxxx ». */
export function generateTemporaryPassword(): string {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}
