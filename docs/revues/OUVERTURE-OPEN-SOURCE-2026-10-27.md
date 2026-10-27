# Ouverture du code (open source) : audit et liste de contrôle, 27/10/2026

## 1. Ce qui a été analysé

- **Tout l'historique Git** : 421 commits, toutes les branches et les références des PR, y compris les 3 premiers
  commits issus de Google AI Studio (6 et 21/10/2026). Chaque version de chaque fichier texte a été scannée.
- **Les journaux GitHub Actions** des 65 exécutions de déploiement et d'opérations, ainsi que les artefacts.
- **Les textes GitHub** : descriptions des PR, commentaires et issues.
- **Les fichiers actuels** : configuration, `functions/.env.*`, documentation, captures.

Recherches effectuées :
- clés et jetons : Google/Firebase, AWS, Stripe, Twilio, SendGrid, OAuth, GitHub, npm, JWT, clés privées PEM/PGP ;
- comptes de service, mots de passe littéraux, secrets à forte entropie ;
- e-mails, téléphones marocains, numéros de CIN ;
- textes en arabe dans les journaux.

## 2. Résultats

| Constat | Gravité | Traitement |
|---|---|---|
| Aucune clé privée, aucun compte de service, aucun jeton GitHub/npm, aucune clé Gemini | — | — |
| Clé API web Firebase et identifiant OAuth du projet de prod (`.env.production`, `src/firebase.ts`, ancien fichier de configuration AI Studio) | faible | **Publics par conception** : déjà servis à chaque visiteur dans le JavaScript du site. La protection repose sur les règles Firestore, les Functions et les restrictions de la clé (`docs/runbooks/CLE-API-WEB.md`). Les fichiers AI Studio inutilisés sont retirés. |
| Ancien code AI Studio : mot de passe par défaut très court, identique pour tous les comptes créés sans mot de passe, et mot de passe du directeur codé en dur | **élevée** | Le Lot 0 a été appliqué en prod **sans rotation** : les comptes qui ne se sont jamais reconnectés gardent leur ancien mot de passe. Ce schéma reste visible dans le code actuel (compatibilité) et dans le site déployé : le cacher dans l'historique ne suffirait pas. Il faut **changer ces mots de passe** avec l'action `rotate-stale-passwords` (D103), **avant** l'ouverture. |
| Mots de passe dans les tests et le seed | aucune | Comptes fictifs des émulateurs seulement. |
| Téléphone de l'association (ancien code, `docs/DECISIONS.md`, garde-fou de test) | faible | Contact public de l'association, imprimé sur les cartes. À confirmer par l'école. |
| E-mails des auteurs des commits (compte Google de l'école pour les commits AI Studio, adresse personnelle d'un contributeur) | faible | Ils restent visibles dans l'historique public. On ne peut les changer qu'en réécrivant l'historique, et les références des PR garderaient de toute façon les anciens commits. **Prévenir les intéressés.** |
| Nom et identifiant personnels du super-admin de démonstration dans les scripts, tests et runbooks | faible | Remplacés par `superadmin_demo` et « مشرف عام تجريبي ». |
| Journaux Actions : aucune donnée d'élève, aucun e-mail ni téléphone. On y trouve seulement les libellés de rôles, des comptages et les identifiants des super-admins | faible | Suppression des anciennes exécutions conseillée (voir §3). |
| 5 artefacts de rapports de migration | faible | Chiffrés GPG pour le seul propriétaire. Suppression conseillée. |
| Captures dans `docs/` | aucune | Toutes générées sur les émulateurs (données fictives). |
| Règles Firestore d'AI Studio repoussées en prod le 26/10 (15:13 UTC) | **critique, hors dépôt** | Elles peuvent ouvrir les collections racine héritées. Rétablir les règles de `main` et ne plus publier depuis AI Studio. |
| Copie des données réelles d'`alfajr` sur le projet dev | **élevée, hors dépôt** | À supprimer avec `purge-dev-real-copy` (D103) avant l'ouverture. |

## 3. Liste de contrôle avant de rendre le dépôt public

**Bloquant**
1. [ ] Règles Firestore de prod rétablies (console Firebase, historique des règles), et AI Studio n'est plus utilisé pour ce projet.
2. [ ] Inscription publique désactivée dans Firebase Authentication (prod et dev) : Console Firebase › Authentication › Settings › User actions, décocher « Enable create (sign-up) ». L'application ne crée jamais de compte depuis le navigateur : tout passe par les Cloud Functions.
3. [ ] `rotate-stale-passwords` exécutée en prod, en simulation puis en application. Les directeurs remettent ensuite les mots de passe temporaires (`docs/communication/identifiants.md`).
4. [ ] `purge-dev-real-copy` exécutée sur le dev.
5. [ ] Restrictions de la clé API web vérifiées : référents HTTP et API autorisées (`docs/runbooks/CLE-API-WEB.md`).
6. [ ] Réglages GitHub du dépôt (Settings) :
   - Actions › General › « Fork pull request workflows from outside collaborators » : **Require approval for all outside collaborators** ;
   - Branches : protection de `main` (PR obligatoire, CI verte, pas de force-push) ;
   - Code security : **Secret scanning** et **Push protection** activés, **Private vulnerability reporting** activé, alertes Dependabot.

**Conseillé**
7. [ ] Supprimer les anciennes exécutions de `ops.yml`, `deploy.yml` et `deploy-lot0.yml`, ainsi que les 5 artefacts chiffrés : ce sont des traces d'exploitation de la prod, sans utilité en public.
8. [ ] Prévenir les auteurs dont l'e-mail figure dans l'historique.
9. [ ] Confirmer que le téléphone de l'association peut rester public.

**Ensuite** : Settings › General › Danger Zone › **Change visibility** › Public.

## 4. Pourquoi garder ce dépôt plutôt qu'en créer un neuf

Un dépôt neuf, avec un historique vierge, cacherait les commits AI Studio et les e-mails des auteurs. Mais :
- le schéma de mots de passe hérité est de toute façon dans le code actuel et dans le site déployé ;
- la fédération d'identité (WIF) des déploiements est liée à l'identifiant de ce dépôt ;
- l'historique des décisions et des PR serait perdu.

Garder ce dépôt est donc plus sûr, à condition de traiter les points bloquants ci-dessus.
