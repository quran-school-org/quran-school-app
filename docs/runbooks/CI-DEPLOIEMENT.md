# Runbook — déploiement et opérations depuis GitHub Actions (Workload Identity Federation)

> **Mise en place : par un humain** (propriétaire du projet GCP et administrateur
> du dépôt), une seule fois, en suivant **`docs/GUIDE-MISE-EN-PROD.md`** (version
> pas à pas, à copier-coller dans Cloud Shell). Ce runbook en donne le détail
> technique et les raisons. Décisions : D46, D64, D74, D75.
> **Utilisation : par l'orchestrateur (Claude)**, uniquement par `gh workflow run`,
> après le « go » du propriétaire : `docs/runbooks/OPERATIONS-CLAUDE.md`.
> Aucun agent n'exécute de commande vers la prod depuis un conteneur.
> Tant que la mise en place n'est pas faite, les workflows `deploy.yml`,
> `deploy-lot0.yml`, `ops.yml` et `preview.yml` échouent dès leur premier pas
> (variables absentes) : ils sont **inactifs** par construction, et ne se lancent
> de toute façon qu'à la main.
> **Forfait GitHub** (D75) : les workflows fonctionnent avec les environnements
> GitHub (Team, Enterprise) **ou** avec des variables de dépôt préfixées
> `DEV_` / `PROD_` (Free, où un dépôt privé n'a pas d'environnements) ; §5.

Faire **d'abord tout sur le projet de dev**, déployer, vérifier, puis
recommencer pour la prod.

## 0. Variables de travail

```bash
export REPO=quran-school-org/quran-school-app
export PROJECT=<id-du-projet-de-dev> ENV=dev       # puis : gen-lang-client-0481880143 / production
export LOC=<emplacement de la base de PROD>         # ex. eur3, europe-west1 (même emplacement en dev)
case "$LOC" in eur3) BUCKET_LOC=EU ;; nam5) BUCKET_LOC=US ;; *) BUCKET_LOC=$LOC ;; esac
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
export POOL=github PROVIDER=quran-school-app
export DEPLOY_SA=github-deploy@$PROJECT.iam.gserviceaccount.com
export OPS_SA=github-ops@$PROJECT.iam.gserviceaccount.com
export BUCKET=$PROJECT-sauvegardes
```

## 1. API nécessaires

Liste complète : guide, étape 2, bloc 1 (dont `identitytoolkit.googleapis.com`
pour les scripts de comptes et `storage.googleapis.com` pour les exports).

## 2. Pool et fournisseur d'identité (OIDC GitHub)

Guide, étape 2 (bloc unique, identique à `docs/PROMPT-NAVIGATEUR.md`, étape C).
Condition du fournisseur (revue D68, D74, puis D75 : plus de condition sur
l'environnement GitHub), **identique pour le dev et la prod** :
```
assertion.repository=='$REPO'
  && assertion.ref=='refs/heads/main'
  && assertion.job_workflow_ref in ['$REPO/.github/workflows/deploy.yml@refs/heads/main',
                                    '$REPO/.github/workflows/deploy-lot0.yml@refs/heads/main',
                                    '$REPO/.github/workflows/ops.yml@refs/heads/main']
```
Autorisation des comptes `github-deploy` et `github-ops` (rôle
`iam.workloadIdentityUser`) :
```
principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO
```
(avant D75 : `principal://…/subject/repo:$REPO:environment:$ENV`, retiré par le
bloc du guide).
Pourquoi :
- un workflow lancé à la main s'exécute dans la version **de la branche
  choisie**. Sans condition sur la branche, n'importe quelle branche obtient le
  jeton du compte ;
- sur le forfait gratuit, aucune règle de branche d'environnement ne
  l'empêche, et un dépôt privé n'a même pas d'environnements : la condition ne
  peut donc pas reposer sur `assertion.environment` (absente du jeton d'un job
  sans `environment:`), ni l'autorisation sur un sujet `…:environment:<env>` ;
- le dev reçoit une copie des données réelles (`ops.yml` › `import-firestore`) :
  il se protège comme la prod ;
- la séparation dev / prod repose sur des **projets distincts** (un pool, un
  fournisseur et des comptes par projet ; un jeton accepté par le pool du dev
  ne donne rien sur la prod) et sur les garde-fous des workflows de `main`
  (préfixe ou environnement choisi par `inputs.environment`, contrôle croisé,
  projet de prod vérifié, `confirm`).
`principalSet://…/workloadIdentityPools/github/attribute.repository/…` vaut pour
**tout fournisseur du pool `github`** : ce pool ne doit contenir que le
fournisseur `quran-school-app`. Les aperçus de branche passent par un
fournisseur d'un **pool séparé** (`github-apercus`) du seul projet de dev,
limité à l'environnement `preview` et au compte `github-preview` (Hosting
seulement ; guide, bloc « aperçus », Team ou Enterprise seulement).
**Point à vérifier au premier run en mode Free** (hypothèse non documentée) :
le mappage `attribute.environment=assertion.environment` porte sur une
revendication absente du jeton d'un job sans `environment:`. Si
l'authentification échoue sur ce mappage, retirer `attribute.environment` du
mappage (`update-oidc --attribute-mapping=…`, sur le dev d'abord) : la
condition et l'autorisation ne l'utilisent pas. `job_workflow_ref` est une revendication
du jeton OIDC de GitHub : vérifier au premier run (journal d'audit STS) qu'elle
vaut bien `<dépôt>/.github/workflows/<fichier>@refs/heads/main`.

Le nom du fournisseur s'affiche avec :
```bash
gcloud iam workload-identity-pools providers describe $PROVIDER --location=global \
  --workload-identity-pool=$POOL --project=$PROJECT --format='value(name)'
# → projects/<numéro>/locations/global/workloadIdentityPools/github/providers/quran-school-app
```

### 2 bis. Ce que la condition ne couvre pas (revue D74)
- **Écriture sur `main`** : sans protection de branche, toute personne (ou tout
  agent) qui peut pousser sur `main` peut modifier ces trois workflows, puis les
  lancer. Réduire le droit d'écriture au strict nécessaire ; un forfait Team
  apporte protection de branche, relecteurs d'environnement et `CODEOWNERS`.
- **Lancement** : `gh workflow run` exige le droit d'écriture (« actions »). Les
  jetons des agents de développement ne devraient pas l'avoir sur ce dépôt.
- **Artefacts** : lisibles par tout compte qui lit le dépôt. `ops.yml` les
  chiffre pour la clé publique `ARTIFACT_GPG_PUBLIC_KEY`, et refuse un
  remplacement de mots de passe appliqué sans elle (guide, étape 3 C).
- **Portée de `github-deploy`** : déployer des fonctions, c'est exécuter du
  code sous leur compte d'exécution (accès complet à la base) ; le compte
  Compute par défaut a souvent le rôle `editor` : préférer un compte
  d'exécution dédié avant la bascule.
- **Épinglage** : les actions sont épinglées par SHA (tag en commentaire). Pour
  les mettre à jour : `git ls-remote --tags https://github.com/<action>`, puis
  `actionlint`, `zizmor --offline .github/workflows/` et
  `npm test` (garde-fou `tests/unit/workflows.test.ts`).

## 3. Deux comptes de service, sans clé

### `github-deploy` (règles, Functions, Hosting)

Guide, étape 2, bloc 3. Pourquoi ces rôles :

| Rôle | Pour |
|---|---|
| `firebasehosting.admin` | publier le Hosting et les canaux d'aperçu |
| `firebaserules.admin` | publier `firestore.rules` |
| `cloudfunctions.admin` + `run.admin` | créer et mettre à jour les fonctions 2nd gen, et rendre `api` publique (IAM invocateur). `cloudfunctions.developer` ne peut pas poser cette IAM |
| `eventarc.developer` | triggers Firestore (archivage) |
| `cloudscheduler.admin` | fonction planifiée de sauvegarde (D47) |
| `artifactregistry.writer` | images des fonctions |
| `serviceusage.serviceUsageConsumer`, `firebaseextensions.viewer` | contrôles faits par la CLI Firebase |
| `iam.serviceAccountUser` (sur le seul compte d'exécution) | déployer des fonctions qui s'exécutent sous ce compte |

Points à surveiller au premier déploiement sur le dev (D64) :
- **Triggers Firestore** : la CLI lit l'emplacement de la base
  (`ensureFirestoreTriggerRegion` dans firebase-tools 15.34.0), ce qui demande
  `datastore.databases.getMetadata`, qu'aucun des rôles ci-dessus ne semble
  donner. Si le déploiement des Functions échoue sur ce droit, ajouter à
  `github-deploy` un rôle qui le contient (par exemple un rôle personnalisé
  limité à cette permission), sur le dev d'abord, et le noter ici.
- **Politique de nettoyage des images** : sans elle, la CLI en mode non
  interactif échoue *après* avoir déployé les fonctions. `deploy-lot0.yml`
  transforme ce cas précis en avertissement ; `deploy.yml` le traite comme une
  erreur sauf avec `force=true`. À poser une fois par projet, par un humain :
  ```bash
  npx firebase functions:artifacts:setpolicy --project $PROJECT --location europe-west1 --days 30
  ```

Aucun rôle `owner`/`editor`, aucune clé JSON (`gcloud iam service-accounts keys
create` est **interdit** ici). Si un déploiement échoue faute de droit, ajouter
le rôle précis indiqué par l'erreur, sur le dev d'abord, et le noter ici.

### `github-ops` (scripts de données, exports) : séparé du déploiement

Guide, étape 2, bloc 4 : `datastore.user`, `datastore.viewer`,
`datastore.importExportAdmin`, `firebaseauth.admin`,
`serviceusage.serviceUsageConsumer` sur le projet, et `storage.objectAdmin` sur
le seul bucket de sauvegarde. Utilisé par `ops.yml` uniquement :

| Action | Droits utilisés |
|---|---|
| `describe-db` | `datastore.databases.getMetadata` ; liste des objets du bucket |
| `export-firestore` | `datastore.databases.export` ; l'agent de service Firestore écrit dans le bucket |
| `import-firestore` (dev) | `datastore.databases.import` ; l'agent de service Firestore **du dev** lit le bucket de la prod (guide, bloc « dev seulement ») ; lecture du document `schools/demo` (API REST Firestore, `datastore.user`) : import refusé s'il existe (D77) |
| `lot0-provision`, `migrate-to-tenants` | Firestore (Admin SDK) et Firebase Auth (création, mise à jour, claims) |
| `verify-counts` | requêtes d'agrégation `count()` |
| `seed-demo`, `remove-demo` (dev) | Firestore (Admin SDK : écriture et suppression récursive de `schools/demo`) et Firebase Auth (comptes `demo_*` : création, mot de passe, révocation, claims vidés, suppression) |
| `dev-super-admin`, `dev-super-admin-revoke` (dev) | `firebaseauth.admin` (compte de l'entrée `username` : lecture par email, création, mot de passe, réactivation ou désactivation, révocation des sessions, claim `superAdmin`) et `datastore.user` (Admin SDK : lecture de `usernames`, `users`, `schools/*/members/{uid}` ; écriture de `usernames/{username}` et `users/{uid}`) du compte `github-ops` **du dev** ; aucun rôle nouveau (D80) |
| `seed-school-fixtures`, `remove-school-fixtures` (dev) | `datastore.user` (Admin SDK : lecture des marqueurs `demoData` et identifiants de `schools/{school_id}/*` et de ses paramètres ; écriture et suppression des seuls documents marqués ; `usernames`, `users`, `members` des comptes `test_*`) et `firebaseauth.admin` (comptes `test_*` : création, mot de passe, révocation, claims vidés, suppression) du compte `github-ops` **du dev** ; aucun rôle nouveau (D82) |
| `rotate-stale-passwords` (prod et dev) | `datastore.user` (Admin SDK : lecture de `users` où `mustChangePassword` est vrai et de `schools/*/members/{uid}` ; écriture de `passwordResetAt` et `passwordResetBy` dans `users/{uid}`) et `firebaseauth.admin` (lecture des comptes par uid, nouveau mot de passe, révocation des sessions) ; aucun rôle nouveau (D103) |
| `purge-dev-real-copy` (dev) | `datastore.user` (Admin SDK : lecture et suppression récursive de `schools/alfajr` et des collections racine héritées, suppression de `users` et `usernames`) et `firebaseauth.admin` (liste et suppression des comptes) du compte `github-ops` **du dev** ; aucun rôle nouveau (D103) |

## 4. Bucket de sauvegarde et PITR

Guide, étape 2, blocs 5 et 6 : bucket `$PROJECT-sauvegardes` à l'emplacement
`$BUCKET_LOC` (multirégion `EU` pour une base `eur3`, `US` pour `nam5`, sinon
la région de la base : un export Firestore exige un bucket d'emplacement
compatible), cycle de vie de 30 jours, PITR activé. Les exports d'`ops.yml`
sont nommés `<AAAAMMJJ-HHMMSSZ>-<motif>` à la racine du bucket (`manuel`,
`avant-lot0-provision`, `avant-migrate-to-tenants`). `describe-db` affiche
l'emplacement attendu du bucket et la région conseillée des triggers.

## 5. Configuration GitHub : environnements ou variables préfixées (D75)

Guide, étape 3. Chaque workflow (`deploy.yml`, `deploy-lot0.yml`, `ops.yml`)
commence par un job `configuration`, sans jeton ni secret, qui choisit le mode :

| Mode | Quand | Job à jeton OIDC exécuté | Variables lues |
|---|---|---|---|
| `environnement` | `USE_GITHUB_ENVIRONMENTS=true`, ou aucune variable `DEV_FIREBASE_PROJECT_ID` / `PROD_FIREBASE_PROJECT_ID` | `deployer` / `operation`, avec `environment: <dev\|production>` | variables de l'environnement, sans préfixe (`FIREBASE_PROJECT_ID`…) |
| `prefixe` | `USE_GITHUB_ENVIRONMENTS=false`, ou l'une de ces deux variables existe | `deployer-sans-environnement` / `operation-sans-environnement`, **sans** `environment:` | variables de dépôt `DEV_…` si `environment=dev`, `PROD_…` si `environment=production` |

Les deux jobs jumeaux partagent exactement les mêmes permissions, variables et
étapes (ancres YAML) ; leur condition `if:` est exclusive. Pourquoi deux jobs
plutôt qu'une expression `environment: ${{ … || '' }}` : la documentation
GitHub ne dit pas ce que devient un nom d'environnement vide, ni ce qui se
passe quand un job déclare `environment:` dans un dépôt privé du forfait Free
(elle indique seulement qu'un environnement référencé mais inexistant est créé,
et que Free ne permet pas d'en configurer pour un dépôt privé). Le job sans
`environment:` ne dépend d'aucun de ces comportements.

Garde-fous (identiques dans les deux modes) :
- **variables d'un environnement jamais utilisées pour l'autre** : le préfixe
  est déduit de `inputs.environment` (`dev` → `DEV_`, `production` → `PROD_`),
  chaque variable est lue par une sélection gardée
  (`prefix == 'DEV_' && vars.DEV_X || prefix == 'PROD_' && vars.PROD_X || prefix == '' && vars.X || ''`),
  sans repli d'un préfixe sur l'autre ; le garde-fou revérifie le couple
  mode / environnement / préfixe et refuse un projet, un fournisseur WIF, un
  compte ou un bucket égal à la variable préfixée de l'autre environnement
  (`tests/unit/workflows.test.ts` le vérifie statiquement) ;
- production lancée uniquement depuis le workflow de `main` (`github.ref`) et
  visant `gen-lang-client-0481880143` ; `dev` ne vise jamais la prod ;
- compte de service appartenant au projet visé ;
- `confirm` = identifiant du projet pour toute écriture en prod ;
- simulation par défaut (`apply=false`) pour les scripts de données ;
- références de code **fixes** : `release/lot0` pour `deploy-lot0.yml` et
  `lot0-provision`, `main` pour `deploy.yml`, `migrate-to-tenants` et
  `verify-counts` ; aucune entrée ne choisit le code ;
- `import-firestore` refusé en production ; export automatique avant toute
  application de script ; PITR exigé en prod avant écriture ;
- artefacts chiffrés pour `ARTIFACT_GPG_PUBLIC_KEY` (préfixée, sinon de dépôt
  ou d'environnement).

`preview.yml` (aperçus) exige l'environnement `preview` : en mode `prefixe`, son
job `disponibilite` arrête le workflow avec un message clair, avant tout job
qui déclare `environment:`.

Sans protection de branche (Free), toute personne ayant l'accès en écriture
au dépôt peut modifier les workflows de `main` ; la liste des collaborateurs
est la vraie frontière de confiance.

## 6. Variables (aucun secret)

Les 6 valeurs affichées à la fin du bloc de l'étape 2 du guide, pour chaque
projet : `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID`, `GCP_WIF_PROVIDER`,
`GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_OPS_SERVICE_ACCOUNT`, `BACKUP_BUCKET`.
Team / Enterprise : dans l'environnement `dev` ou `production`, sans préfixe.
Free : variables de dépôt `DEV_<nom>` et `PROD_<nom>`.

Facultatives (même règle de préfixe) :
- `FUNCTIONS_TRIGGER_REGION` : région des triggers Firestore, valeur conseillée
  par `ops.yml` › `describe-db`. **Obligatoire pour le dev** : `deploy.yml` et
  `deploy-lot0.yml` s'arrêtent si elle manque (plus de repli implicite sur
  `europe-west1`) et elle remplace la région du fichier `functions/.env.<projet>`.
  En production, facultative : sinon la région vient du fichier versionné
  `functions/.env.gen-lang-client-0481880143`, qui doit en contenir une seule,
  valide (contrôlé avant le déploiement) ;
- `SUPER_ADMIN_USERNAME` (avant la bascule) : compte qui reçoit le claim
  `superAdmin` lors de `migrate-to-tenants` (validé par expression régulière) ;
- `ARTIFACT_GPG_PUBLIC_KEY` : clé publique du propriétaire ; peut aussi être
  une variable de dépôt **sans** préfixe, valable pour les deux environnements ;
- `USE_GITHUB_ENVIRONMENTS` (variable de dépôt, `true` ou `false`) : force le
  mode du §5.

**Dev seulement** (la prod utilise `.env.production`, versionné) : la
configuration web publique du projet de dev, guide étape 3 (`VITE_FIREBASE_*`,
`VITE_FIRESTORE_DATABASE_ID`, `FUNCTIONS_FIRESTORE_DATABASE_ID`,
`FUNCTIONS_TRIGGER_REGION`), préfixée `DEV_` en Free. Aucun secret applicatif
(le rapport IA et sa clé Gemini ont été retirés, D76).

## 7. Utilisation (orchestrateur, voir OPERATIONS-CLAUDE.md)

```bash
# Lot 0 (code de release/lot0), dev puis prod :
gh workflow run deploy-lot0.yml --repo $REPO --ref main -f environment=dev -f target=all
gh workflow run deploy-lot0.yml --repo $REPO --ref main -f environment=production -f target=functions -f confirm=gen-lang-client-0481880143
# Multi-écoles (code de main) ; force=true supprime les fonctions absentes du code (bascule) :
gh workflow run deploy.yml --repo $REPO --ref main -f environment=dev -f target=all -f force=true
# Opérations de données :
gh workflow run ops.yml --repo $REPO --ref main -f environment=production -f action=describe-db
gh workflow run ops.yml --repo $REPO --ref main -f environment=production -f action=lot0-provision -f confirm=gen-lang-client-0481880143
```
Rapports des scripts : artefact `rapport-<action>-<env>-<run>` (3 jours) ;
mots de passe temporaires, s'il y en a : artefact séparé
`mots-de-passe-temporaires-<env>-<run>` (1 jour). Les journaux n'affichent que
des compteurs (`RESUME_JSON=`).

**Aperçu d'une branche** (dev seulement, Team ou Enterprise : environnement
`preview`, pool `github-apercus`, compte Hosting seulement ; indisponible en Free) : « Prévisualisation (dev, manuel) », canal `br-<branche>`
qui expire (7 jours par défaut). Build et tests dans un job sans jeton OIDC.
```bash
gh workflow run preview.yml --repo $REPO --ref <branche> -f expires=7d
```
Si la clé API web du dev est restreinte par référent (runbook
`CLE-API-WEB.md`), y autoriser `https://$PROJECT--*.web.app/*`.

## 8. Contrôles après mise en place
- `ops.yml` `describe-db` réussit sur le dev et sur la prod.
- Un lancement `deploy-lot0.yml` `dev` / `all` réussit et la page s'ouvre sur `https://$PROJECT.web.app`.
- Un lancement `production` depuis une autre branche que `main`, ou sans `confirm`, échoue au garde-fou.
- Un lancement `dev` depuis une autre branche que `main` échoue à l'authentification (condition WIF).
- Le journal du job `configuration` indique le mode attendu (`environnement` ou `variables de dépôt DEV_*/PROD_*`), et un seul des deux jobs jumeaux s'exécute (l'autre est « skipped »).
- Le pool `github` de chaque projet ne contient que le fournisseur `quran-school-app` : `gcloud iam workload-identity-pools providers list --location=global --workload-identity-pool=github --project=$PROJECT`.
- Un aperçu qui tenterait `firebase deploy --only firestore:rules` est refusé par IAM.
- Journal d'audit IAM : `gcloud logging read 'protoPayload.authenticationInfo.principalEmail="'$DEPLOY_SA'"' --project=$PROJECT --limit=20` (idem avec `$OPS_SA`).

## 9. Retour arrière
- Désactiver un workflow : `gh workflow disable ops.yml --repo $REPO` (idem `deploy.yml`, `deploy-lot0.yml`).
- Couper l'accès : `gcloud iam workload-identity-pools providers disable $PROVIDER --location=global --workload-identity-pool=$POOL --project=$PROJECT`.
- Revenir à l'autorisation par environnement (D74, Team/Enterprise seulement) : D75, « Retour arrière ».
- Version précédente du Hosting : Console › Hosting › Historique des versions › Restaurer.
