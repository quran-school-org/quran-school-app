# Runbook de l'orchestrateur : Lot 0, répétitions sur le dev, bascule

> **Exécuté par l'orchestrateur (Claude), uniquement par `gh workflow run`**, après
> le « go » du propriétaire aux trois moments prévus par
> `docs/GUIDE-MISE-EN-PROD.md` (§7). Décision : D59.
> Aucune commande n'est lancée vers la prod depuis un conteneur : ni `gcloud`, ni
> `firebase`, ni script Admin SDK, ni appel aux API Firebase/Firestore/Identity
> Toolkit. Tout passe par les workflows `deploy-lot0.yml`, `ops.yml` et
> `deploy.yml`, qui portent les garde-fous (simulation par défaut, confirmation
> par l'identifiant du projet, références de code fixes, production lancée
> depuis `main` seulement).

## 0. Prérequis et conventions

1. Le propriétaire a déroulé le guide (étapes 1 à 6) pour le **dev** et la
   **prod**, et a dit « c'est prêt ».
2. Les workflows sont **sur `main`** (un `workflow_dispatch` ne se déclenche que
   pour un workflow présent sur la branche par défaut) : fusion de
   `feat/workflows-ops` par le propriétaire.
3. **Forfait GitHub gratuit** : la documentation GitHub indique que les
   environnements ne se configurent, sur un dépôt privé, qu'avec GitHub Team ou
   Pro. Si l'étape 3 du guide est impossible, s'arrêter et le signaler au
   propriétaire (voir D59, « Limites ») : sans variables d'environnement, les
   workflows s'arrêtent dès leur premier pas, sans rien toucher.

```bash
REPO=quran-school-org/quran-school-app
P=gen-lang-client-0481880143          # prod
DEV=<FIREBASE_PROJECT_ID de l'environnement dev>
# Lancer un workflow (toujours depuis main, toujours -f : jamais -F, qui lit des fichiers) :
run() { gh workflow run "$1" --repo "$REPO" --ref main "${@:2}"; }   # affiche l'URL du run
# Suivre le run (code de sortie non nul si le run échoue) :
gh run watch <id> --repo "$REPO" --exit-status
# Lire les compteurs (les journaux ne contiennent aucune donnée personnelle) :
gh run view <id> --repo "$REPO" --log | grep -E 'RESUME_JSON=|EXPORT=|Code de sortie|::error::|::warning::'
```

Règles permanentes :

- **Un run à la fois** : attendre la fin de chaque run (`gh run watch`) avant le
  suivant. Les groupes `concurrency` (`deploy-<env>`, `ops-<env>`) l'imposent par
  workflow, pas entre workflows.
- **Ne jamais télécharger** les artefacts `rapport-*` ni `mots-de-passe-temporaires-*`
  dans le conteneur (données personnelles, secrets) : seul le propriétaire les
  télécharge depuis l'onglet Actions (3 jours et 1 jour), puis les supprime.
  L'orchestrateur ne lit que les journaux et le résumé du run.
- **Critère d'arrêt général** : tout run rouge, toute ligne `::error::`, tout
  `critical: true`, tout écart inattendu de compteur. On s'arrête, on rapporte
  au propriétaire le run, l'étape et les compteurs, et on ne relance que ce que
  la ligne « si échec » de l'étape prévoit.
- **Retours arrière nécessitant un import dans la prod** : refusés par `ops.yml`
  par construction. Ils sont exécutés **par un humain** (runbooks
  `LOT0-DEPLOIEMENT.md` §7 et `MIGRATION-BASCULE.md` §6), avec le nom de
  l'export donné par le run (`EXPORT=…`). La version précédente du site se
  restaure dans la console (Hosting › Historique des versions), celle des
  règles dans Firestore › Règles › historique.

## 1. Vérification des accès (« c'est prêt », sans donnée réelle)

| # | Commande | À vérifier | Si échec |
|---|---|---|---|
| 1.1 | `run ops.yml -f environment=dev -f action=describe-db` | run vert ; `locationId` identique à celui que le propriétaire a noté pour la prod ; PITR `POINT_IN_TIME_RECOVERY_ENABLED` ; la liste des exports s'affiche (vide) | erreur WIF ou `PERMISSION_DENIED` : indiquer au propriétaire l'étape 2 du guide concernée (pool, compte `github-ops`, rôle) |
| 1.2 | `run ops.yml -f environment=production -f action=describe-db` | même chose pour la prod ; noter `locationId`, la **région conseillée des triggers** et l'emplacement attendu du bucket | idem |
| 1.3 | (si la région conseillée n'est pas `europe-west1`) | demander au propriétaire de poser `FUNCTIONS_TRIGGER_REGION=<région>` dans les environnements `dev` **et** `production` | ne pas déployer les Functions avant |
| 1.4 | `run ops.yml -f environment=production -f action=verify-counts` | nombres par collection racine (référence « avant ») ; aucun `schools` | — |
| 1.5 | `run deploy-lot0.yml -f environment=dev -f target=all` | job `verifier` vert (lint, build, tests, émulateurs de `release/lot0`) ; déploiement vert ; `https://$DEV.web.app` s'ouvre (`curl -sI`, projet de dev seulement) | droit manquant : faire ajouter au compte `github-deploy` **du dev** le rôle précis cité par l'erreur (CI-DEPLOIEMENT.md §3), puis relancer |
| 1.6 | `run ops.yml -f environment=dev -f action=lot0-provision` | run vert ; `RESUME_JSON` avec `appUsers: 0` et l'anomalie `U1_MISSING` (base de dev vide : attendu) ; la chaîne WIF → Admin SDK fonctionne | erreur d'accès à Auth/Firestore : rôles de `github-ops` |

Avertissement attendu à 1.5 (et au premier déploiement des Functions sur la
prod) : « politique de nettoyage des images absente ». Il n'empêche rien ; le
signaler au propriétaire (commande unique de CI-DEPLOIEMENT.md §3).

## 2. Lot 0 : simulation sur la prod → **go n°1**

| # | Commande | À vérifier |
|---|---|---|
| 2.1 | `run ops.yml -f environment=production -f action=lot0-provision -f confirm=$P` | `RESUME_JSON` : `mode: simulation`, `critical: false`, `rotationPolicy: none`, `passwordsRotated: 0`, `failures: 0` ; `appUsers` = `appUsers` de 1.4 ; anomalies par code |

Critères d'arrêt (rapporter au propriétaire, ne pas continuer) :
- `critical: true` : `U1_NOT_DIRECTOR`, `U1_INACTIVE`, `U1_MISSING` (corriger
  `appUsers/u1` dans la console), `UNTRUSTED_AUTH_UID` (falsification probable :
  le propriétaire examine l'uid et supprime le champ), `UNKNOWN_ROLE` ;
- `PRIVILEGED_ACCOUNT` > 0 : l'école confirme chaque compte مدير / إداري ;
- `NO_PASSWORD`, `USERNAME_RENAMED`, `linksToReview` : à faire lire par le
  propriétaire dans l'artefact `rapport-lot0-provision-production-<run>` (CSV
  `anomalies`, `identifiants-renommes`, `liens-a-valider`).

**Go n°1** : le propriétaire valide le résumé et fixe l'heure de la coupure
(environ 15 minutes). Sans go explicite, rien ne s'écrit.

## 3. Lot 0 réel (aux heures convenues)

Avant la fenêtre (sans impact pour les utilisateurs) :

| # | Commande | À vérifier | Si échec |
|---|---|---|---|
| 3.1 | `run deploy-lot0.yml -f environment=production -f target=functions -f confirm=$P` | vert ; fonctions `createUserAccount`, `resetUserPassword`, `api`, `syncAccountsOnTeacherArchive`, `syncAccountsOnStudentArchive` | « Aborting because deletion… » : des fonctions inconnues existent en prod ; **arrêt**, liste au propriétaire ; `force=true` seulement sur son accord écrit. Erreur de région des triggers : revoir 1.3 |

Fenêtre de maintenance (le propriétaire a annoncé la coupure ; enchaîner sans pause) :

| # | Commande | À vérifier | Si échec |
|---|---|---|---|
| 3.2 | `run ops.yml -f environment=production -f action=lot0-provision -f apply=true -f rotate_passwords=none -f confirm=$P` | PITR activé (sinon refus) ; `EXPORT=<…>-avant-lot0-provision` (noter le nom) ; `RESUME_JSON` : `mode: application`, `failures: 0`, `authCreated + authExisting = appUsers`, `linksWritten = appUsers`, `passwordsRotated: 0` ; aucun artefact de mots de passe | code 2 (`failures` > 0) : relancer **la même commande** (seuls les comptes restants sont traités) ; code 1 : arrêt, rien n'a été écrit si l'erreur porte sur les anomalies critiques |
| 3.3 | `run deploy-lot0.yml -f environment=production -f target=firestore-rules -f confirm=$P` | vert, **immédiatement** après 3.2 | relancer une fois ; sinon arrêt et retour arrière humain |
| 3.4 | `run deploy-lot0.yml -f environment=production -f target=hosting -f confirm=$P` | vert ; `https://$P.web.app` répond (le propriétaire vérifie l'écran de connexion dans son navigateur) | restauration Hosting par le propriétaire |
| 3.5 | `run ops.yml -f environment=production -f action=lot0-provision -f confirm=$P` | simulation : pas d'anomalie `PASSWORD_REAPPEARED`, `authExisting = appUsers` | `PASSWORD_REAPPEARED` : relancer 3.2 (le champ est supprimé, Auth n'est pas modifié) |
| 3.6 | `run ops.yml -f environment=production -f action=verify-counts` | `authLinks` = `appUsers` ; les autres collections égales à 1.4 (ou plus, si l'école a saisi entre-temps) | écart à la baisse : arrêt immédiat, rapport |

Après la fenêtre : prévenir le propriétaire que **le directeur se connecte
immédiatement** (son mot de passe actuel est public) ; vérifications par rôle
du runbook Lot 0 §5.3 à §5.6, par le propriétaire dans son navigateur. Les
contrôles §5.1 et §5.2 (appels directs aux API de la prod) ne sont pas faits par
l'orchestrateur.

## 4. Répétitions de la migration sur le dev (deux fois) → **go n°2**

Le dev reçoit une **copie réelle** des données : la base de dev et ses accès
sont traités comme la prod (artefacts privés, aucune donnée dans les journaux).
**Firebase Auth n'est pas copié** (les hachages de mots de passe sont des secrets
et l'export Auth n'est pas automatisé) ; d'où le choix des sources ci-dessous.

| # | Commande | À vérifier |
|---|---|---|
| 4.1 | Répétition 1 : `run ops.yml -f environment=dev -f action=import-firestore -f import_source=<horodatage>-avant-lot0-provision` (simulation), puis la même avec `-f apply=true -f confirm=$DEV` | source affichée = bucket de la prod ; import vert. L'export d'avant le Lot 0 contient encore les mots de passe : il permet de recréer les comptes sur le dev |
| 4.2 | `run deploy.yml -f environment=dev -f target=all -f force=true` | job `verifier` vert (code de `main`) ; fonctions du Lot 0 supprimées du dev, fonctions multi-écoles déployées |
| 4.3 | `run ops.yml -f environment=dev -f action=migrate-to-tenants -f rotate_passwords=all` | simulation : `critical: false`, pour chaque collection `source = copied + skippedExisting` |
| 4.4 | `run ops.yml -f environment=dev -f action=migrate-to-tenants -f apply=true -f rotate_passwords=all -f confirm=$DEV` | export préalable du dev ; `targetAfter = source` partout ; `accounts.pendingAuth: 0` ; `superAdmin: true` si `SUPER_ADMIN_USERNAME` est posé dans `dev` ; artefact `mots-de-passe-temporaires-dev-<run>` (1 jour) |
| 4.5 | `run ops.yml -f environment=dev -f action=verify-counts` | `schools.alfajr.<collection>` = racine pour les 14 collections ; `members` = `appUsers` |
| 4.6 | Répétition 2 (export frais, juste avant la bascule) : `run ops.yml -f environment=production -f action=export-firestore -f confirm=$P`, puis 4.1 avec `import_source=<nom affiché>` et 4.3 à 4.5 | données récentes : anomalies et comptages. `accounts.pendingAuth` est attendu égal au nombre de comptes absents d'Auth sur le dev (export d'après le Lot 0, sans mot de passe) ; les comptes créés à la répétition 1 restent valables |

Pourquoi `rotate_passwords=all` sur le dev : les comptes de la copie reçoivent
des mots de passe **aléatoires**, remis au seul propriétaire pour la recette ;
les anciens mots de passe (faibles, publics pour certains) n'ouvrent donc jamais
la copie des données réelles. La prod reste en `none` (D53).

Limites connues des répétitions : l'import ne purge pas la base de dev (les
documents de même chemin sont remplacés, les autres restent) ; à la répétition
2, `skippedExisting` > 0 est normal pour ce que la répétition 1 a déjà copié.

Recette sur le dev (par le propriétaire, avec les mots de passe temporaires) :
connexion par rôle, cotisations, reçu, rapport IA, archivage d'une fiche de test,
seconde école de test (MIGRATION-BASCULE.md §2.6). Puis il fait valider par
l'école `comptes/…/liens-a-valider.csv` (artefact du run 4.4).

**Go n°2** : le propriétaire valide le rapport de répétition et les liens.
**Go n°3** : il fixe la date de la bascule. Avant la bascule, il pose
`SUPER_ADMIN_USERNAME` dans l'environnement `production` (compte dédié
recommandé, MIGRATION-BASCULE.md §0.4).

## 5. Bascule multi-écoles en prod (fenêtre de maintenance, date du go n°3)

| # | Commande | À vérifier | Si échec |
|---|---|---|---|
| 5.1 | `run ops.yml -f environment=production -f action=export-firestore -f confirm=$P` | `EXPORT=<…>-manuel` (sauvegarde d'avant toute modification) | arrêt |
| 5.2 | `run ops.yml -f environment=production -f action=verify-counts` | référence « avant » | — |
| 5.3 | `run deploy.yml -f environment=production -f target=functions -f force=true -f confirm=$P` | vert ; `createUserAccount` supprimée ; fonctions multi-écoles en ligne | arrêt ; retour arrière : `deploy-lot0.yml` `target=functions` `force=true` |
| 5.4 | `run ops.yml -f environment=production -f action=migrate-to-tenants -f confirm=$P` | simulation : `critical: false`, `superAdmin: true`, `accounts.pendingAuth: 0`, `accounts.withAuth` = `accounts.appUsers` | arrêt |
| 5.5 | `run ops.yml -f environment=production -f action=migrate-to-tenants -f apply=true -f confirm=$P` | export préalable ; `targetAfter = source` partout ; `critical: false` ; code 0 | code 2 : lire les codes d'anomalie, relancer la même commande si `WRITE_FAILED` / `ACCOUNT_FAILED` ; sinon arrêt |
| 5.6 | `run deploy.yml -f environment=production -f target=firestore-rules -f confirm=$P` | vert, **immédiatement** (racine fermée) | retour arrière (MIGRATION-BASCULE.md §6) |
| 5.7 | `run deploy.yml -f environment=production -f target=hosting -f confirm=$P` | vert | restauration Hosting par le propriétaire |
| 5.8 | `run ops.yml -f environment=production -f action=migrate-to-tenants -f confirm=$P` | contrôle d'écart : tous les `copied` à 0 | `copied` > 0 : relancer 5.5 (jamais d'`--overwrite`) |
| 5.9 | `run ops.yml -f environment=production -f action=verify-counts` | `schools.alfajr` = racine de 5.2 pour les 14 collections ; `members` = `appUsers` | arrêt, rapport |

Puis vérifications par rôle par le propriétaire (MIGRATION-BASCULE.md §5.3 à
§5.6) et, plus tard, création de la deuxième école et de ses comptes dans
l'application (super-admin). Retour arrière : MIGRATION-BASCULE.md §6, avec
`deploy-lot0.yml` pour les règles et les fonctions du Lot 0 (`force=true`).

## 6. Référence des entrées

| Workflow | Entrée | Valeurs |
|---|---|---|
| `deploy-lot0.yml` | `environment` | `dev`, `production` |
| | `target` | `all` (dev seulement), `firestore-rules`, `functions` (défaut), `hosting` |
| | `force` | `false` (défaut), `true` : `--force` (supprime les fonctions absentes de `release/lot0`) |
| | `confirm` | production : `gen-lang-client-0481880143` |
| `ops.yml` | `environment` | `dev`, `production` |
| | `action` | `describe-db`, `export-firestore`, `import-firestore` (dev), `lot0-provision`, `migrate-to-tenants`, `verify-counts` |
| | `apply` | `false` (défaut), `true` : lot0-provision, migrate-to-tenants, import-firestore |
| | `rotate_passwords` | `none` (défaut, D53), `weak`, `all` : lot0-provision, migrate-to-tenants |
| | `import_source` | import-firestore : `AAAAMMJJ-HHMMSSZ-(manuel\|avant-lot0-provision\|avant-migrate-to-tenants)` |
| | `confirm` | identifiant du projet visé : obligatoire pour `apply=true`, et en production pour tout sauf `describe-db` et `verify-counts` |
| `deploy.yml` | `environment`, `target`, `confirm` | comme avant ; `force` (`false` par défaut) pour la bascule |
