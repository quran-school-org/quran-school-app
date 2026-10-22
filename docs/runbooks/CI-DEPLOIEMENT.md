# Runbook — déploiement et opérations depuis GitHub Actions (Workload Identity Federation)

> **Mise en place : par un humain** (propriétaire du projet GCP et administrateur
> du dépôt), une seule fois, en suivant **`docs/GUIDE-MISE-EN-PROD.md`** (version
> pas à pas, à copier-coller dans Cloud Shell). Ce runbook en donne le détail
> technique et les raisons. Décisions : D46, D64.
> **Utilisation : par l'orchestrateur (Claude)**, uniquement par `gh workflow run`,
> après le « go » du propriétaire : `docs/runbooks/OPERATIONS-CLAUDE.md`.
> Aucun agent n'exécute de commande vers la prod depuis un conteneur.
> Tant que la mise en place n'est pas faite, les workflows `deploy.yml`,
> `deploy-lot0.yml`, `ops.yml` et `preview.yml` échouent dès leur premier pas
> (variables absentes) : ils sont **inactifs** par construction, et ne se lancent
> de toute façon qu'à la main.

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

Guide, étape 2, bloc 2. Condition du fournisseur :
`assertion.repository=='$REPO' && assertion.environment=='$ENV'` : seuls les
jobs de CE dépôt qui déclarent l'environnement GitHub `$ENV` obtiennent un
jeton. Le nom du fournisseur s'affiche avec :
```bash
gcloud iam workload-identity-pools providers describe $PROVIDER --location=global \
  --workload-identity-pool=$POOL --project=$PROJECT --format='value(name)'
# → projects/<numéro>/locations/global/workloadIdentityPools/github/providers/quran-school-app
```

Si la condition durcie de la revue (D55, branche `fix/revue-durcissement` :
`job_workflow_ref == …/deploy.yml@refs/heads/main` pour la prod) est adoptée,
y ajouter `deploy-lot0.yml` et `ops.yml` :
`assertion.job_workflow_ref in ['$REPO/.github/workflows/deploy.yml@refs/heads/main', '$REPO/.github/workflows/deploy-lot0.yml@refs/heads/main', '$REPO/.github/workflows/ops.yml@refs/heads/main']`.

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
| `secretmanager.viewer` | vérifier que `GEMINI_API_KEY` existe (le contenu n'est pas lu) |
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
| `import-firestore` (dev) | `datastore.databases.import` ; l'agent de service Firestore **du dev** lit le bucket de la prod (guide, bloc « dev seulement ») |
| `lot0-provision`, `migrate-to-tenants` | Firestore (Admin SDK) et Firebase Auth (création, mise à jour, claims) |
| `verify-counts` | requêtes d'agrégation `count()` |

## 4. Bucket de sauvegarde et PITR

Guide, étape 2, blocs 5 et 6 : bucket `$PROJECT-sauvegardes` à l'emplacement
`$BUCKET_LOC` (multirégion `EU` pour une base `eur3`, `US` pour `nam5`, sinon
la région de la base : un export Firestore exige un bucket d'emplacement
compatible), cycle de vie de 30 jours, PITR activé. Les exports d'`ops.yml`
sont nommés `<AAAAMMJJ-HHMMSSZ>-<motif>` à la racine du bucket (`manuel`,
`avant-lot0-provision`, `avant-migrate-to-tenants`). `describe-db` affiche
l'emplacement attendu du bucket et la région conseillée des triggers.

## 5. Environnements GitHub (forfait gratuit : pas de relecteur)

Créer `dev` et `production` (guide, étape 3). Sur le forfait GitHub gratuit
d'un dépôt privé, **aucun relecteur obligatoire ni règle de branche** n'est
disponible. Les garde-fous sont donc dans les workflows :

- production lancée uniquement depuis le workflow de `main` (`github.ref`) ;
- `confirm` = identifiant du projet pour toute écriture en prod ;
- simulation par défaut (`apply=false`) pour les scripts de données ;
- références de code **fixes** : `release/lot0` pour `deploy-lot0.yml` et
  `lot0-provision`, `main` pour `deploy.yml`, `migrate-to-tenants` et
  `verify-counts` ; aucune entrée ne choisit le code ;
- `import-firestore` refusé en production ; export automatique avant toute
  application de script ; PITR exigé en prod avant écriture.

> **À vérifier à l'étape 3 (D64)** : la documentation GitHub indique que, sur un
> dépôt privé, les environnements (et leurs variables) ne se configurent qu'avec
> GitHub Team ou Pro (« Users with GitHub Free plans can only configure
> environments for public repositories »). Si l'interface refuse de créer les
> environnements, ne pas contourner : le signaler ; la solution la plus simple
> est le forfait Team pour l'organisation. Les workflows s'arrêtent sans rien
> faire tant que les variables sont absentes.

Rappel : sans protection de branche, toute personne ayant l'accès en écriture
au dépôt peut modifier les workflows de `main` ; la liste des collaborateurs
est la vraie frontière de confiance.

## 6. Variables des environnements (aucun secret)

Dans **chaque** environnement, les 6 valeurs affichées à la fin du bloc 2 du
guide : `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID`, `GCP_WIF_PROVIDER`,
`GCP_DEPLOY_SERVICE_ACCOUNT`, `GCP_OPS_SERVICE_ACCOUNT`, `BACKUP_BUCKET`.

Facultatives :
- `FUNCTIONS_TRIGGER_REGION` (dev, et prod si la base n'est pas en
  `eur3`/`europe-west1`) : région des triggers Firestore, valeur conseillée par
  `ops.yml` › `describe-db` ;
- `SUPER_ADMIN_USERNAME` (avant la bascule) : compte qui reçoit le claim
  `superAdmin` lors de `migrate-to-tenants` (validé par expression régulière).

**Dev seulement** (la prod utilise `.env.production`, versionné) : la
configuration web publique du projet de dev, guide étape 3 (`VITE_FIREBASE_*`,
`VITE_FIRESTORE_DATABASE_ID`, `FUNCTIONS_FIRESTORE_DATABASE_ID`,
`FUNCTIONS_TRIGGER_REGION`). Le secret Gemini reste dans Secret Manager du
projet (guide, étape 4), jamais dans GitHub.

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

**Aperçu d'une branche** (dev seulement) : « Prévisualisation (dev, manuel) »,
canal `br-<branche>` qui expire (7 jours par défaut).
```bash
gh workflow run preview.yml --repo $REPO --ref <branche> -f expires=7d
```
Si la clé API web du dev est restreinte par référent (runbook
`CLE-API-WEB.md`), y autoriser `https://$PROJECT--*.web.app/*`.

## 8. Contrôles après mise en place
- `ops.yml` `describe-db` réussit sur le dev et sur la prod.
- Un lancement `deploy-lot0.yml` `dev` / `all` réussit et la page s'ouvre sur `https://$PROJECT.web.app`.
- Un lancement `production` depuis une autre branche que `main`, ou sans `confirm`, échoue au garde-fou.
- Journal d'audit IAM : `gcloud logging read 'protoPayload.authenticationInfo.principalEmail="'$DEPLOY_SA'"' --project=$PROJECT --limit=20` (idem avec `$OPS_SA`).

## 9. Retour arrière
- Désactiver un workflow : `gh workflow disable ops.yml --repo $REPO` (idem `deploy.yml`, `deploy-lot0.yml`).
- Couper l'accès : `gcloud iam workload-identity-pools providers disable $PROVIDER --location=global --workload-identity-pool=$POOL --project=$PROJECT`.
- Version précédente du Hosting : Console › Hosting › Historique des versions › Restaurer.
