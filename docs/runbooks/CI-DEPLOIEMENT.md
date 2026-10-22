# Runbook — déploiement depuis GitHub Actions (Workload Identity Federation)

> **À EXÉCUTER PAR UN HUMAIN** (propriétaire du projet GCP et administrateur du
> dépôt). Aucune de ces commandes n'a été lancée par un agent. Décision : D46.
> Tant que ce runbook n'est pas déroulé, les workflows `deploy.yml` et
> `preview.yml` échouent dès leur premier pas (variables absentes) : ils sont
> **inactifs** par construction, et ne se lancent de toute façon qu'à la main.

Faire **d'abord tout le runbook sur le projet de dev**, déployer, vérifier, puis
recommencer pour la prod.

## 0. Variables de travail

```bash
export REPO=quran-school-org/quran-school-app
# Projet de DEV (à créer s'il n'existe pas : Console Firebase, plan Blaze,
# base Firestore NOMMÉE identique à la prod, voir D7) :
export PROJECT=<id-du-projet-de-dev> ENV=dev
# Puis, pour la prod (deuxième passage) :
# export PROJECT=gen-lang-client-0481880143 ENV=production
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
export POOL=github PROVIDER=quran-school-app SA=github-deploy
export SA_EMAIL=$SA@$PROJECT.iam.gserviceaccount.com
```

## 1. API nécessaires

```bash
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com \
  cloudresourcemanager.googleapis.com firebase.googleapis.com firebasehosting.googleapis.com \
  firebaserules.googleapis.com firestore.googleapis.com cloudfunctions.googleapis.com \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  eventarc.googleapis.com pubsub.googleapis.com secretmanager.googleapis.com \
  cloudscheduler.googleapis.com --project=$PROJECT
```

## 2. Pool et fournisseur d'identité (OIDC GitHub)

```bash
gcloud iam workload-identity-pools create $POOL --location=global \
  --display-name="GitHub Actions" --project=$PROJECT

# Seuls les jobs de CE dépôt, dans l'environnement GitHub $ENV, sont acceptés.
gcloud iam workload-identity-pools providers create-oidc $PROVIDER --location=global \
  --workload-identity-pool=$POOL --display-name="quran-school-app" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='$REPO' && assertion.environment=='$ENV'" \
  --project=$PROJECT

gcloud iam workload-identity-pools providers describe $PROVIDER --location=global \
  --workload-identity-pool=$POOL --project=$PROJECT --format='value(name)'
# → projects/<numéro>/locations/global/workloadIdentityPools/github/providers/quran-school-app
#   (valeur de la variable GitHub GCP_WIF_PROVIDER)
```

## 3. Compte de service de déploiement (rôles minimaux)

```bash
gcloud iam service-accounts create $SA --display-name="Déploiement GitHub Actions" --project=$PROJECT

# Le sujet GitHub de l'environnement (repo:…:environment:$ENV) peut emprunter ce compte.
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL --project=$PROJECT \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/subject/repo:$REPO:environment:$ENV"

for ROLE in \
  roles/firebasehosting.admin \
  roles/firebaserules.admin \
  roles/cloudfunctions.admin \
  roles/run.admin \
  roles/eventarc.developer \
  roles/cloudscheduler.admin \
  roles/secretmanager.viewer \
  roles/artifactregistry.writer \
  roles/serviceusage.serviceUsageConsumer \
  roles/firebaseextensions.viewer ; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA_EMAIL" --role=$ROLE --condition=None
done

# « Agir en tant que » limité au compte d'exécution des Functions (compte Compute par défaut).
gcloud iam service-accounts add-iam-policy-binding $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --project=$PROJECT --role=roles/iam.serviceAccountUser --member="serviceAccount:$SA_EMAIL"
```

Pourquoi ces rôles :

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

Aucun rôle `owner`/`editor`, aucune clé JSON (`gcloud iam service-accounts keys
create` est **interdit** ici). Si un déploiement échoue faute de droit, ajouter
le rôle précis indiqué par l'erreur, sur le dev d'abord, et le noter ici.

Une fois par projet, la politique de nettoyage des images (sinon la CLI la demande
de façon interactive et le job échoue) :
```bash
npx firebase functions:artifacts:setpolicy --project $PROJECT --location europe-west1 --days 30
```

## 4. Environnements GitHub (validation manuelle pour la prod)

```bash
# dev : pas de relecteur obligatoire, toutes les branches.
gh api -X PUT repos/$REPO/environments/dev

# production : relecteur obligatoire, branche main seulement, pas d'auto-validation.
REVIEWER_ID=$(gh api users/<login-du-relecteur> --jq .id)
gh api -X PUT repos/$REPO/environments/production --input - <<EOF
{
  "wait_timer": 0,
  "prevent_self_review": true,
  "reviewers": [{ "type": "User", "id": $REVIEWER_ID }],
  "deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
EOF
gh api -X POST repos/$REPO/environments/production/deployment-branch-policies -f name=main -f type=branch
```

## 5. Variables des environnements (aucun secret)

```bash
WIF=$(gcloud iam workload-identity-pools providers describe $PROVIDER --location=global \
  --workload-identity-pool=$POOL --project=$PROJECT --format='value(name)')
gh variable set FIREBASE_PROJECT_ID        --env $ENV --repo $REPO --body "$PROJECT"
gh variable set GCP_WIF_PROVIDER           --env $ENV --repo $REPO --body "$WIF"
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --env $ENV --repo $REPO --body "$SA_EMAIL"
```

Pour **dev uniquement** (la prod utilise `.env.production`, versionné) : la
configuration web publique du projet de dev (Console › Paramètres du projet ›
Vos applications) et les paramètres des Functions :
```bash
for KV in \
  "VITE_FIREBASE_API_KEY=<clé web du dev>" \
  "VITE_FIREBASE_AUTH_DOMAIN=$PROJECT.firebaseapp.com" \
  "VITE_FIREBASE_STORAGE_BUCKET=$PROJECT.firebasestorage.app" \
  "VITE_FIREBASE_MESSAGING_SENDER_ID=<…>" \
  "VITE_FIREBASE_APP_ID=<…>" \
  "VITE_FIRESTORE_DATABASE_ID=$DB" \
  "VITE_APPCHECK_SITE_KEY=" \
  "FUNCTIONS_FIRESTORE_DATABASE_ID=$DB" \
  "FUNCTIONS_TRIGGER_REGION=europe-west1" ; do
  gh variable set "${KV%%=*}" --env dev --repo $REPO --body "${KV#*=}"
done
```
Le secret Gemini reste dans Secret Manager du projet (jamais dans GitHub) :
`npx firebase functions:secrets:set GEMINI_API_KEY --project $PROJECT`.

## 6. Utilisation

- **Déploiement** : onglet Actions › « Déploiement (manuel) » › *Run workflow* :
  environnement (`dev` / `production`), cible (`all`, `firestore-rules`,
  `functions`, `hosting`) et, pour la prod, l'identifiant du projet recopié dans
  « confirm ». Le job `verifier` (lint, build, tests unitaires et émulateurs)
  doit passer ; la prod attend ensuite la validation du relecteur.
  ```bash
  gh workflow run deploy.yml --repo $REPO --ref <branche> -f environment=dev -f target=hosting
  gh workflow run deploy.yml --repo $REPO --ref main -f environment=production -f target=all -f confirm=gen-lang-client-0481880143
  ```
- **Aperçu d'une branche** (dev seulement) : « Prévisualisation (dev, manuel) »,
  canal `br-<branche>` qui expire (7 jours par défaut).
  ```bash
  gh workflow run preview.yml --repo $REPO --ref <branche> -f expires=7d
  ```
  Si la clé API web du dev est restreinte par référent (runbook
  `CLE-API-WEB.md`), y autoriser `https://$PROJECT--*.web.app/*`.

## 7. Contrôles après mise en place
- Un lancement `dev` / `hosting` réussit et la page s'ouvre sur `https://$PROJECT.web.app`.
- Un lancement `production` depuis une autre branche que `main` échoue au garde-fou.
- Journal d'audit IAM : `gcloud logging read 'protoPayload.authenticationInfo.principalEmail="'$SA_EMAIL'"' --project=$PROJECT --limit=20`.

## 8. Retour arrière
- Désactiver le workflow : `gh workflow disable deploy.yml --repo $REPO`.
- Couper l'accès : `gcloud iam workload-identity-pools providers disable $PROVIDER --location=global --workload-identity-pool=$POOL --project=$PROJECT`.
- Version précédente du Hosting : Console › Hosting › Historique des versions › Restaurer.
