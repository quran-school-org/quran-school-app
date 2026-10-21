# Revue de sécurité adversariale — étape 2

> Date : 21/10/2026. Revue faite en autonomie par un agent. **Aucune action sur
> la production** : aucun déploiement, aucune connexion, aucun appel aux API du
> projet `gen-lang-client-0481880143`. Tout a été démontré et testé sur les
> émulateurs (`demo-quran-school`) avec des données **fictives**.
>
> Branches :
> - `fix/revue-securite` (depuis `feat/multi-tenant`) : multi-écoles ;
> - `fix/revue-securite-lot0` (depuis `fix/lot0-securite`) : Lot 0 seul, sur
>   la structure actuelle (collections à la racine).
>
> Décisions prises : `docs/DECISIONS.md`, D34 à D41. Avancement : `docs/progress/ETAPE-2-revue.md`.

## 1. En bref

- **20 constats** : 1 critique, 2 élevés, 9 moyens, 8 faibles (§3).
- **Corrigés** : les 3 constats critiques et élevés, et 7 des 9 moyens. Un
  8e, R-10, est traité par une procédure de runbook.
  Chaque correctif a son test, qui échouait avant le correctif (ou une démonstration
  de bout en bout pour C-01 et C-02).
- **Faille la plus grave (R-01)** : le Lot 0 reprenait dans Firebase Auth les
  mots de passe de `appUsers`. Or ces mots de passe étaient publics (S1), et
  celui du directeur figurait dans le code (S4). Après le Lot 0, n'importe qui
  ayant relevé la base, ou essayant « 123 », se connectait donc encore. De plus,
  `appUsers` était **modifiable** par tous (S2) : un tiers pouvait y avoir planté
  un mot de passe, un `authUid` ou des liens, et le script les reprenait (R-08).
- **Autre faille élevée (C-01)** : un enseignant pouvait placer du code dans le
  nom d'un élève. Ce code s'exécutait dans la session du directeur dès qu'il
  imprimait un document. Démontré de bout en bout.
- **Verdict (§8)** : le Lot 0 est prêt à partir en production **depuis
  `fix/revue-securite-lot0`**, après relecture humaine et si le runbook mis à
  jour est suivi. Sans ces correctifs, il ne l'était pas. La bascule
  multi-écoles reste conditionnée aux répétitions sur un projet de dev.

## 2. Périmètre et méthode

Code relu :
- `firestore.rules` : la version multi-écoles, et la version Lot 0 de `origin/fix/lot0-securite` ;
- `functions/` : les callables, les triggers et `api` ;
- la connexion et la session : `src/firebase.ts`, `src/security/`, `src/school/`, la partie session d'`App.tsx`, le cache local ;
- les scripts `scripts/admin/lot0-provision-auth.ts` et `scripts/migration/migrate-to-tenants.ts` ;
- les deux runbooks.

Méthode : chaque hypothèse d'attaque a donné un test sur émulateur.
- **Faille confirmée** : le test échouait avant le correctif et sert ensuite de non-régression.
- **Hypothèse réfutée** : le test passe tel quel et le prouve.

Les journaux des démonstrations n'ont pas été versionnés. Ils montrent
l'échec de chaque test avant son correctif.

Gravité :
- **Critique** : prise de contrôle à distance, sans compte.
- **Élevée** : élévation de privilège jusqu'au directeur, ou prise de contrôle de comptes.
- **Moyenne** : fuite de données de mineurs ciblée, élévation conditionnelle, incident d'exploitation probable.
- **Faible** : défense en profondeur, conditions improbables.

## 3. Tableau des constats

Branches : **MT** = `fix/revue-securite`, **L0** = `fix/revue-securite-lot0`.

| ID | Gravité | Constat | Branches | État |
|---|---|---|---|---|
| R-01 | **Critique** | Les mots de passe exposés (S1, S4, « 123 ») restent valables après le provisionnement | MT, L0 | Corrigé |
| R-08 | **Élevée** | Données plantées dans `appUsers` avant le Lot 0 (`authUid`, liens, mot de passe) reprises par le script | MT, L0 | Corrigé |
| C-01 | **Élevée** | XSS stockée dans les fenêtres d'impression : un enseignant prend la session du directeur | MT, L0 | Corrigé |
| R-02 | Moyenne | Une relance du script (ou la migration) rétablit un lien parent/enfant retiré par l'école | MT, L0 | Corrigé |
| R-04 | Moyenne | Une erreur sur un seul compte interrompt le provisionnement, sans rapport, en pleine fenêtre de maintenance | MT, L0 | Corrigé |
| C-03 | Moyenne | Un إداري devient مدير grâce à la synchronisation des rôles (intitulé de sa fiche) | MT, L0 | Corrigé |
| F-01 | Moyenne | `attachExisting` rattache un compte de l'inscription libre et réactive un compte désactivé | MT | Corrigé |
| F-02 | Moyenne | Un autre directeur réinitialise le mot de passe du compte protégé u1 | MT, L0 | Corrigé |
| F-03 | Moyenne | `resetUserPassword` (Lot 0) suit un `authUid` qu'un directeur peut réécrire : réinitialisation de n'importe quel compte | L0 | Corrigé |
| R-10 | Moyenne | Un retour arrière après la bascule réactive les comptes suspendus ou rétrogradés depuis | MT (runbook) | Procédure ajoutée |
| R-06 | Moyenne | Les enseignants lisent salaires et CIN du personnel (connu, D14) | MT, L0 | Non corrigé |
| O-01 | Moyenne | Le service Cloud Run d'AI Studio expose un proxy Gemini sans authentification (S7 résiduel) | prod | Action humaine (runbook) |
| R-03 | Faible | Un compte Auth préexistant adopté avec `--no-sync-passwords` garde ses sessions | MT, L0 | Corrigé |
| R-05 | Faible | La migration relancée peut écraser un document créé entre l'inventaire et la copie | MT | Corrigé |
| R-09 | Faible | La relance réécrit `authLinks` depuis `appUsers` : un compte suspendu dans son lien peut être réactivé | MT, L0 | Corrigé |
| C-02 | Faible | Session terminée sans « خروج » (révocation, désactivation) : les données restent dans localStorage | MT, L0 | Corrigé |
| R-07 | Faible | Les familles peuvent créer des notifications (lues par le personnel) | MT, L0 | Non corrigé |
| O-02 | Faible | Inscription libre et énumération des identifiants via l'API Auth | prod | Action humaine (runbook) |
| O-03 | Faible | Pas de limitation de débit sur `api` (Gemini) | MT | Non corrigé (D30) |
| O-04 | Faible | Fenêtres d'impression : script tiers `cdn.tailwindcss.com` dans l'origine de l'application ; persistance de session « locale » sur les PC partagés | MT, L0 | Non corrigé (D37, D40) |

## 4. Constats corrigés : preuves et correctifs

Les tests cités échouaient avant le correctif (journaux de démonstration non
versionnés) et servent de non-régression. Les scénarios sont décrits dans les
messages de commit et dans `docs/DECISIONS.md` (D34–D41).

| ID | Preuve (test) | Correctif | Commits MT | Commits L0 |
|---|---|---|---|---|
| R-01 | `tests/emulator/revue-provision.test.ts` › R-01 | Remplacement de tous les mots de passe hérités par des mots de passe temporaires aléatoires (`--rotate-passwords=all` par défaut, rapport secret `mots-de-passe-temporaires.csv`, droits 600), changement imposé, jamais régénéré à la relance (D34) | `350d69a`, `10b9f72` | `30cbfbc` |
| R-08 | `revue-provision.test.ts` › R-08 ; `tests/unit/passwords.test.ts` | `authUid` cru seulement s'il est confirmé par `authLinks` (`UNTRUSTED_AUTH_UID`, critique) ; liens préexistants ignorés (`UNEXPECTED_LINK_FIELDS`) ; comptes du bureau listés (`PRIVILEGED_ACCOUNT`) ; mots de passe hérités tous remplacés (D35) | `10b9f72` | `30cbfbc` |
| C-01 | `tests/e2e/smoke.spec.ts` › C-01 (bout en bout, MT) ; `tests/unit/printTemplates.test.ts` (garde-fou, 65 interpolations brutes dans `App.tsx` du Lot 0 avant correctif) | Échappement `escapeHtml` de toute donnée insérée dans les fenêtres d'impression (`src/security/html.ts`), garde-fou sur toutes les sources (D37) ; aucun changement visuel | `8b31d0b`, `0c12f2e` | `2a60068`, `1ea5203` |
| R-02 | `revue-provision.test.ts` › R-02 | Un compte déjà provisionné garde ses liens enregistrés ; plus de recalcul heuristique à la relance | `350d69a` | `30cbfbc` |
| R-04 | `revue-provision.test.ts` › R-04 (provisionnement, et migration interrompue puis relancée) | Erreur par compte comptée (`failures`), anomalie critique `ACCOUNT_FAILED`, rapports écrits, code de sortie 2, reprise à la relance (D36) | `350d69a` | `30cbfbc` |
| C-03 | `tests/unit/accountAlignment.test.ts` › C-03 | La synchronisation des rôles n'attribue plus jamais مدير (D38) | `72574a7` | `da8a7db` |
| F-01 | `functions/test/revue.test.ts` › F-01 | `attachExisting` : registre `usernames` uniquement ; pas de réactivation d'un compte désactivé, sauf super-admin (D39) | `c97e4af` | — |
| F-02 | `functions/test/revue.test.ts` › F-02 | Réinitialisation du compte u1 refusée à un autre directeur (D26, D39) | `c97e4af` | `56f054e` |
| F-03 | `functions/test/revue.test.ts` (L0) › F-03 | `resetUserPassword` exige que `authLinks/{uid}.appUserId` confirme l'`authUid` d'`appUsers` | — | `56f054e` |
| R-10 | revue du runbook (pas de test automatisable) | Étape 0 du retour arrière : reporter dans `authLinks` les suspensions et rétrogradations faites après la bascule | `c2c02fa` | — |
| R-03 | `revue-provision.test.ts` › R-03 | Révocation des sessions à la première adoption d'un compte Auth préexistant. Note : l'émulateur n'applique pas la révocation à l'échange du jeton de rafraîchissement ; vérification par `verifyIdToken(…, true)` | `350d69a` | `30cbfbc` |
| R-05 | `revue-provision.test.ts` › R-05 | Copies par `create` sans `--overwrite` ; `ALREADY_EXISTS` compté comme déjà présent | `350d69a` | — |
| R-09 | `revue-provision.test.ts` › R-09 | Pour un compte provisionné, le lien fait foi (rôle, liens, statut le plus restrictif ; `AUTHLINK_MISMATCH`) ; `appUsers` réaligné | `50f7e79` | `30cbfbc` |
| C-02 | `tests/e2e/smoke.spec.ts` › C-02 (MT ; même code en L0, non testé de bout en bout faute de Playwright sur cette branche) | Purge du cache et coupure des abonnements quand Firebase Auth signale l'absence de session (D40) | `61935cd` | `15e6c14` |

Runbooks mis à jour (MT `c2c02fa`, `ac301eb` ; L0 `cb21d59`) :
- remise individuelle des mots de passe temporaires ;
- nouvelles anomalies à examiner avant l'application ;
- relance après un échec partiel ;
- retour arrière des mots de passe Firebase Auth (Lot 0) ;
- super-admin dédié recommandé ;
- contrôle d'écart sans écrasement ;
- arrêt du proxy Gemini ouvert d'AI Studio.

## 5. Constats non corrigés (justification)

- **R-06** (Moyenne, connu, D14) : salaires et CIN lisibles par les enseignants.
  Pour corriger, il faut scinder la fiche du personnel en une fiche publique et
  une fiche RH, ce qui touche l'interface et les données : lot ultérieur. Test
  documentaire : `revue-rules.test.ts` › R-06.
- **O-01** (Moyenne) : le proxy Gemini ouvert du service Cloud Run d'AI Studio
  est hors du dépôt. Il faut l'arrêter et faire tourner la clé à la sortie de la
  fenêtre du Lot 0 (runbook, §0.6).
- **R-07, O-02, O-03, O-04** (Faibles) : voir D41 et D40. Ce sont des actions
  humaines de configuration (inscription libre, protection contre
  l'énumération) ou des améliorations hors périmètre.

## 6. Hypothèses réfutées (les protections tiennent)

Prouvées par des tests qui passent sans modification du code :
- **Règles multi-écoles** (`tests/emulator/revue-rules.test.ts`, MT) :
  - écritures partielles : retrait ou falsification de `schoolId`, lot mixte entre deux écoles ;
  - sous-collections non prévues ;
  - famille : visée d'une autre école, requêtes `in` élargies, auto-ajout d'enfant, changement d'école ;
  - personnel : enseignant sur les finances et les paramètres, bénévole sur les dossiers ;
  - registre `usernames` non énumérable ;
  - super-admin sans accès aux données.
- **Règles du Lot 0** (`tests/emulator/revue-rules.test.ts`, L0) :
  - auto-modification d'`authUid`, de liens ou de rôle ;
  - écriture des liens par le bureau ;
  - requêtes famille élargies ;
  - collections hors liste.
- **Functions** (`functions/test/revue.test.ts`) :
  - course à la création d'un même identifiant (un seul compte, sur les deux branches) ;
  - proxy Gemini : membre suspendu, école d'autrui et `schoolId` malformé sont refusés, et l'invite reste bornée malgré des champs démesurés.
- **Couverture antérieure confirmée** (tests de l'étape 1, toujours verts) :
  - isolation entre écoles aux mêmes identifiants ;
  - `list` contre `get` pour les familles ;
  - garde-fous `--project`, simulation par défaut, `--confirm-prod` ;
  - migration rejouée sans écraser une saisie.
- **Limites des `get()`** : chaque règle relit au plus un document `members` ou
  `authLinks` (mis en cache par requête). On reste loin de la limite de 10.

## 7. Résultats des tests (réellement obtenus, 21/10/2026)

Dans ce conteneur, les tests sur émulateurs se lancent avec
`EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (D21). Les tests de bout en bout des
triggers y sont donc ignorés ; ils tournent en CI.

| Branche | Lint app / functions | Build prod | Unitaires | Émulateurs | Functions | Playwright |
|---|---|---|---|---|---|---|
| `fix/revue-securite` | OK / OK | OK | 33/33 | 220 réussis, 2 ignorés (triggers) | 16/16 | 9/9 |
| `fix/revue-securite-lot0` | OK / OK | OK | 28/28 | 221 réussis, 4 ignorés (triggers) | 7/7 | — (pas de Playwright sur cette branche) |

Ces chiffres ont été relevés avant les derniers commits de tests : création
simultanée, proxy Gemini, garde-fou élargi. Ces tests ont tourné à part et sont
verts. La CI GitHub (sans déploiement) a réussi sur les commits déjà vérifiés
des deux branches, triggers compris.

Non vérifié :
- le comportement réel de la production (révocation des sessions, configuration de l'inscription libre, règles réellement déployées) ;
- le rewrite Hosting `/api/**` ;
- C-02 de bout en bout sur la branche du Lot 0.

## 8. Verdict

**Lot 0** : il est **prêt pour la production depuis `fix/revue-securite-lot0`**
(après fusion dans `fix/lot0-securite`), et **pas** depuis
`fix/lot0-securite` seule. Celle-ci laissait valables les mots de passe exposés
(R-01, critique) et reprenait des données de comptes falsifiables (R-08).

Conditions, toutes humaines :
1. relire et fusionner `fix/revue-securite-lot0` ;
2. suivre le runbook mis à jour : simulation, examen de `UNTRUSTED_AUTH_UID` et `PRIVILEGED_ACCOUNT` avec l'école, `failures = 0`, remise individuelle des mots de passe temporaires, puis suppression du fichier ;
3. arrêter le proxy Gemini ouvert d'AI Studio et faire tourner sa clé (O-01) ;
4. désactiver l'inscription libre et activer la protection contre l'énumération, si possible.

**Bascule multi-écoles** : le code est prêt, avec les correctifs de
`fix/revue-securite`. La bascule reste **bloquée** par les étapes prévues :
1. deux répétitions sur un projet Firebase de dev, avec un export réel ;
2. la validation des liens parent/enfant par l'école ;
3. le choix d'un compte super-admin dédié ;
4. une décision sur R-06 (salaires lisibles par les enseignants), à accepter explicitement ou à corriger avant d'accueillir une seconde école.

Ordre de fusion conseillé :
1. `fix/revue-securite-lot0` → `fix/lot0-securite` ;
2. `fix/lot0-securite` → `feat/multi-tenant`. Les correctifs communs sont identiques des deux côtés, à résoudre sans perte ;
3. `fix/revue-securite` → `feat/multi-tenant`.

La branche `refactor/decoupage-app` devra garder l'échappement des impressions.
Le garde-fou `printTemplates.test.ts` inspecte toutes les sources.
