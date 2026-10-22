/**
 * Règles de correspondance entre un compte applicatif et son compte Firebase Auth.
 * Module pur (aucune dépendance) : partagé par l'application, les scripts
 * d'administration et, en copie, les Cloud Functions (functions/src/shared/accounts.ts,
 * parité vérifiée par tests/unit/accounts.test.ts).
 */

/** Domaine fictif des emails techniques des comptes existants (compatibilité). */
export const LEGACY_EMAIL_DOMAIN = "alfajr.local";

/**
 * Domaine fictif des emails techniques des NOUVEAUX comptes (toutes écoles).
 * Les noms d'utilisateur sont uniques sur toute la plateforme (registre
 * `usernames/{username}` tenu par les Cloud Functions), quel que soit le domaine.
 */
export const NEW_ACCOUNTS_EMAIL_DOMAIN = "comptes.kuttab.local";

/** Suffixe historique ajouté aux mots de passe de moins de 6 caractères. */
export const SHORT_PASSWORD_SUFFIX = "_secure_fajr";

/** Longueur minimale de tout NOUVEAU mot de passe (création, changement, réinitialisation). */
export const MIN_NEW_PASSWORD_LENGTH = 8;

/** Format accepté pour un nom d'utilisateur (partie locale de l'email technique). */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,39}$/;

export function normalizeUsername(input: string): string {
  return (input || "").trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function usernameToEmail(username: string, domain: string = LEGACY_EMAIL_DOMAIN): string {
  return `${normalizeUsername(username)}@${domain}`;
}

/**
 * Emails techniques possibles pour un nom d'utilisateur, dans l'ordre d'essai
 * à la connexion : d'abord le domaine historique (comptes existants), puis
 * celui des nouveaux comptes. Évite tout index public nom → email.
 */
export function loginEmailCandidates(username: string): string[] {
  return [usernameToEmail(username, LEGACY_EMAIL_DOMAIN), usernameToEmail(username, NEW_ACCOUNTS_EMAIL_DOMAIN)];
}

/**
 * Firebase Auth exige au moins 6 caractères. Les anciens comptes ont été créés
 * avec `motdepasse + "_secure_fajr"` lorsque le mot de passe était plus court :
 * on conserve cette règle pour que les mots de passe connus restent valables.
 */
export function normalizeAuthPassword(password: string): string {
  return password.length >= 6 ? password : `${password}${SHORT_PASSWORD_SUFFIX}`;
}

/** Vérifie un nouveau mot de passe ; renvoie un message d'erreur (arabe) ou null. */
export function validateNewPassword(password: string): string | null {
  if (!password || password.length < MIN_NEW_PASSWORD_LENGTH) {
    return `يجب أن تتكون كلمة المرور من ${MIN_NEW_PASSWORD_LENGTH} أحرف على الأقل.`;
  }
  if (password.length > 128) {
    return "كلمة المرور طويلة جداً.";
  }
  if (password.trim() !== password) {
    return "لا يمكن أن تبدأ كلمة المرور أو تنتهي بمسافة.";
  }
  return null;
}
