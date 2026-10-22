# Guide de mise en production

**Le principe** : vous ouvrez les accès **une seule fois** (environ 45 minutes, sans compétence particulière). Ensuite, **Claude déclenche tout lui-même** depuis GitHub Actions : déploiements, scripts de données, sauvegardes, répétitions sur le projet de dev. Aucune clé ni aucun mot de passe ne circule : GitHub prouve son identité à Google Cloud (Workload Identity Federation), et les droits sont limités au strict nécessaire.

| Étape | Qui | Durée |
|---|---|---|
| 1. Créer le projet Firebase de dev | Vous | 10 min |
| 2. Relier GitHub à Google Cloud (dev, puis prod) | Vous, copier-coller dans Cloud Shell | 2 × 10 min |
| 3. Créer les variables GitHub (selon le forfait) | Vous, dans l'interface GitHub | 10 min |
| 4. Clé Gemini | Vous | 2 min |
| 5. Geler AI Studio | Vous, avec l'autre développeur | — |
| 6. Me dire « c'est prêt » | Vous | — |
| 7. Lot 0, répétitions, bascule | Claude, avec votre « go » à 3 moments | — |

---

## 1. Créer le projet Firebase de dev

Le projet de dev sert à répéter la migration sur une copie des données, sans toucher la prod.

1. Ouvrez https://console.firebase.google.com, puis **Ajouter un projet**.
   - Nom : `quran-school-dev`. Notez l'**ID du projet** affiché, par exemple `quran-school-dev-1a2b3`.
   - Google Analytics : **désactivé**.
2. **Facturation** : ⚙️ › *Utilisation et facturation* › *Détails et paramètres* › passer au forfait **Blaze**, en choisissant le même compte de facturation que la prod.
   - Créez une **alerte budgétaire** de 10 € : Google Cloud › Facturation › Budgets et alertes. Avec l'usage prévu, la facture devrait rester proche de 0 €.
3. **Emplacement de la prod, à noter** : dans le projet de **prod** (`gen-lang-client-0481880143`), ouvrez *Firestore Database*. L'emplacement de la base `ai-studio-a6572431-…` est indiqué en haut (par exemple `europe-west2` ou `eur3`).
4. **Base Firestore du dev** : dans le projet de dev, *Firestore Database* › *Créer une base de données*.
   - **ID de la base** : `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`, exactement le même nom qu'en prod, pour que les scripts soient identiques.
   - **Emplacement** : le même que la prod (point 3).
   - Mode : **production**. Les règles seront déployées par GitHub.
5. **Authentication** › *Commencer* › activez **Adresse e-mail/Mot de passe**.
6. **Application web** : ⚙️ › *Paramètres du projet* › *Vos applications* › icône `</>` › nom `web-dev`, sans Hosting pour l'instant.
   - Firebase affiche un bloc `firebaseConfig`, avec `apiKey`, `authDomain`, `messagingSenderId` et `appId`. Gardez-le pour l'étape 3.
   - Ces valeurs sont publiques par nature, ce ne sont pas des secrets.

## 2. Relier GitHub à Google Cloud (à faire pour le dev, puis pour la prod)

1. Ouvrez https://console.cloud.google.com, sélectionnez le **projet de dev**, puis cliquez sur l'icône **Cloud Shell** `>_` en haut à droite. Vérifiez avec `gcloud config get project` que vous êtes dans le bon projet.
2. Copiez-collez le bloc ci-dessous **en entier**, après avoir rempli les 3 valeurs marquées `À REMPLIR` (`DEV_ID` : ID du projet ; `LOC` : emplacement noté à l'étape 1.3).
3. **Recommencez ensuite dans le projet de prod**, avec `PROJECT=gen-lang-client-0481880143`, `ENV=production` et le même `LOC`.

Le bloc peut être relancé sans risque : il vérifie ce qui existe déjà, met à jour
la condition du fournisseur s'il existe, et retire l'ancienne autorisation
(`…/subject/repo:…:environment:<env>`) d'une version précédente de ce guide.
Il est identique à celui de `docs/PROMPT-NAVIGATEUR.md` (étape C).

**Accès GitHub → Google (D75)** : la condition du fournisseur ne dépend plus des
environnements GitHub, absents du forfait Free sur un dépôt privé. Elle exige le
dépôt, la branche `main` et l'un des 3 workflows de mise en prod
(`deploy.yml`, `deploy-lot0.yml`, `ops.yml` de `main`) ; une autre branche ou un
autre fichier de workflow n'obtient aucun jeton. Les comptes de service sont
ouverts à `principalSet://…/attribute.repository/quran-school-org/quran-school-app`,
c'est-à-dire à tout jeton du dépôt qui satisfait cette condition. Le dev et la
prod restent séparés par leurs projets Google Cloud (un pool et des comptes par
projet) et par les garde-fous des workflows de `main`.

```bash
export PROJECT=DEV_ID          # À REMPLIR
export ENV=dev                 # À REMPLIR (dev ici)
export LOC=LOC                 # À REMPLIR (étape A.2)
case "$LOC" in eur3) BUCKET_LOC=EU ;; nam5) BUCKET_LOC=US ;; *) BUCKET_LOC=$LOC ;; esac
export REPO=quran-school-org/quran-school-app
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
gcloud config set project $PROJECT
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
export POOL=github PROVIDER=quran-school-app
export DEPLOY_SA=github-deploy@$PROJECT.iam.gserviceaccount.com
export OPS_SA=github-ops@$PROJECT.iam.gserviceaccount.com
# Nouvelle autorisation : tout jeton du dépôt qui satisfait la condition du fournisseur
export MEMBER="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO"
# Ancienne autorisation (version précédente de ce prompt), à retirer si elle existe
export OLD_MEMBER="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/subject/repo:$REPO:environment:$ENV"
# Condition : seulement la branche main ET l'un des 3 workflows de mise en prod
export WIF_CONDITION="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main' && assertion.job_workflow_ref in ['$REPO/.github/workflows/deploy.yml@refs/heads/main', '$REPO/.github/workflows/deploy-lot0.yml@refs/heads/main', '$REPO/.github/workflows/ops.yml@refs/heads/main']"
export MAPPING="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment,attribute.ref=assertion.ref"

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com \
  cloudresourcemanager.googleapis.com firebase.googleapis.com firebasehosting.googleapis.com \
  firebaserules.googleapis.com firestore.googleapis.com cloudfunctions.googleapis.com \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  eventarc.googleapis.com pubsub.googleapis.com secretmanager.googleapis.com \
  cloudscheduler.googleapis.com identitytoolkit.googleapis.com storage.googleapis.com

gcloud iam workload-identity-pools describe $POOL --location=global >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools create $POOL --location=global --display-name="GitHub Actions"
if gcloud iam workload-identity-pools providers describe $PROVIDER --location=global --workload-identity-pool=$POOL >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc $PROVIDER --location=global --workload-identity-pool=$POOL \
    --attribute-mapping="$MAPPING" --attribute-condition="$WIF_CONDITION"
else
  gcloud iam workload-identity-pools providers create-oidc $PROVIDER --location=global --workload-identity-pool=$POOL \
    --display-name="quran-school-app" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="$MAPPING" --attribute-condition="$WIF_CONDITION"
fi

gcloud iam service-accounts describe $DEPLOY_SA >/dev/null 2>&1 || gcloud iam service-accounts create github-deploy --display-name="Déploiement GitHub Actions"
gcloud iam service-accounts describe $OPS_SA >/dev/null 2>&1 || gcloud iam service-accounts create github-ops --display-name="Opérations de données GitHub Actions"
for SA_EMAIL in $DEPLOY_SA $OPS_SA; do
  gcloud iam service-accounts remove-iam-policy-binding $SA_EMAIL --role=roles/iam.workloadIdentityUser --member="$OLD_MEMBER" >/dev/null 2>&1 || true
  gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL --role=roles/iam.workloadIdentityUser --member="$MEMBER" >/dev/null
done
for ROLE in roles/firebasehosting.admin roles/firebaserules.admin roles/cloudfunctions.admin roles/run.admin \
  roles/eventarc.developer roles/cloudscheduler.admin roles/secretmanager.viewer roles/artifactregistry.writer \
  roles/serviceusage.serviceUsageConsumer roles/firebaseextensions.viewer roles/datastore.viewer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$DEPLOY_SA" --role=$ROLE --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser --member="serviceAccount:$DEPLOY_SA" >/dev/null
for ROLE in roles/datastore.user roles/datastore.viewer roles/datastore.importExportAdmin \
  roles/firebaseauth.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$OPS_SA" --role=$ROLE --condition=None >/dev/null
done

export BUCKET=$PROJECT-sauvegardes
gcloud storage buckets describe gs://$BUCKET >/dev/null 2>&1 \
  || gcloud storage buckets create gs://$BUCKET --location=$BUCKET_LOC --uniform-bucket-level-access
echo '{"rule":[{"action":{"type":"Delete"},"condition":{"age":30}}]}' > /tmp/cycle.json
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/cycle.json
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member="serviceAccount:$OPS_SA" --role=roles/storage.objectAdmin >/dev/null
gcloud beta services identity create --service=firestore.googleapis.com
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.admin >/dev/null
gcloud firestore databases update --database=$DB --enable-pitr

echo "===== CONTRÔLE ====="
gcloud iam workload-identity-pools providers describe $PROVIDER --location=global --workload-identity-pool=$POOL --format='value(attributeCondition)'
gcloud iam service-accounts get-iam-policy $DEPLOY_SA --format='value(bindings.members)'
gcloud firestore databases describe --database=$DB --format='value(locationId,pointInTimeRecoveryEnablement)'
echo "===== VALEURS POUR GITHUB ($ENV) ====="
echo "FIREBASE_PROJECT_ID=$PROJECT"
echo "FIRESTORE_DATABASE_ID=$DB"
echo "GCP_WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER --location=global --workload-identity-pool=$POOL --format='value(name)')"
echo "GCP_DEPLOY_SERVICE_ACCOUNT=$DEPLOY_SA"
echo "GCP_OPS_SERVICE_ACCOUNT=$OPS_SA"
echo "BACKUP_BUCKET=$BUCKET"
```

Vérifiez dans « CONTRÔLE » que :
- la condition contient bien `refs/heads/main` et `job_workflow_ref` ;
- les membres du compte de déploiement contiennent `principalSet://…attribute.repository/quran-school-org/quran-school-app` et ne contiennent plus `…subject/repo:…:environment:dev` (ou `production`).

Notez les 6 lignes « VALEURS POUR GITHUB ». Si `--enable-pitr` est refusé, signalez-le et continuez.

**Uniquement dans le projet de DEV**, ajoutez ce bloc. Il permet au dev de lire les exports de la prod, pour la répétition de la migration :

```bash
export PROD_BUCKET=gen-lang-client-0481880143-sauvegardes
export DEV_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding gs://$PROD_BUCKET \
  --member="serviceAccount:service-$DEV_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.objectViewer
```

Faites ce bloc **après** le passage en prod, car le bucket de la prod doit déjà exister.

**Uniquement dans le projet de DEV, seulement avec le forfait GitHub Team ou
Enterprise, et seulement si vous voulez des aperçus de branche** (`preview.yml`).
Avec le forfait Free, sautez ce bloc : l'environnement `preview` n'existe pas et
`preview.yml` s'arrête avec un message clair (D75). Ce bloc crée un fournisseur
ouvert à toutes les branches mais limité à l'environnement `preview`, et un
compte qui ne peut que publier le Hosting (ni règles, ni fonctions, ni lecture
de Firestore) (revue D68, D74).

**Important (D75)** : ce fournisseur vit dans un **pool séparé**
(`github-apercus`), jamais dans le pool `github`. Les comptes `github-deploy` et
`github-ops` sont ouverts à `principalSet://…/workloadIdentityPools/github/attribute.repository/…`,
c'est-à-dire à tout jeton du dépôt accepté par **n'importe quel** fournisseur du
pool `github`. Un fournisseur d'aperçus dans ce pool donnerait donc à toute
branche qui déclare `environment: preview` les comptes de déploiement et
d'opérations du dev. Si un fournisseur `quran-school-app-preview` a été créé
dans le pool `github` par une version précédente de ce guide, désactivez-le
d'abord (`gcloud iam workload-identity-pools providers disable quran-school-app-preview --location=global --workload-identity-pool=github`).
Le bloc suivant utilise les variables `PROJECT`, `PROJECT_NUMBER` et `REPO` du
bloc précédent :

```bash
export PREVIEW_POOL=github-apercus PREVIEW_PROVIDER=quran-school-app-apercus
gcloud iam workload-identity-pools describe $PREVIEW_POOL --location=global >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools create $PREVIEW_POOL --location=global --display-name="GitHub Actions (aperçus)"
gcloud iam workload-identity-pools providers describe $PREVIEW_PROVIDER --location=global --workload-identity-pool=$PREVIEW_POOL >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools providers create-oidc $PREVIEW_PROVIDER --location=global \
    --workload-identity-pool=$PREVIEW_POOL --display-name="quran-school-app (aperçus)" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment" \
    --attribute-condition="assertion.repository=='$REPO' && assertion.environment=='preview'"
gcloud iam service-accounts describe github-preview@$PROJECT.iam.gserviceaccount.com >/dev/null 2>&1 \
  || gcloud iam service-accounts create github-preview --display-name="Aperçus GitHub Actions (Hosting seulement)"
gcloud iam service-accounts add-iam-policy-binding github-preview@$PROJECT.iam.gserviceaccount.com --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$PREVIEW_POOL/subject/repo:$REPO:environment:preview" >/dev/null
for ROLE in roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:github-preview@$PROJECT.iam.gserviceaccount.com" --role=$ROLE --condition=None >/dev/null
done
echo "GCP_WIF_PROVIDER (preview)=$(gcloud iam workload-identity-pools providers describe $PREVIEW_PROVIDER --location=global --workload-identity-pool=$PREVIEW_POOL --format='value(name)')"
# Contrôle : le pool « github » ne doit contenir QUE le fournisseur quran-school-app.
gcloud iam workload-identity-pools providers list --location=global --workload-identity-pool=github --format='value(name,state)'
```

> Si une commande répond qu'un élément « existe déjà », ce n'est pas grave : continuez.
> Si elle répond « permission denied », vérifiez que vous êtes bien dans le bon projet (`gcloud config get project`).
> Ne créez jamais de clé de compte de service.

## 3. Variables GitHub (selon le forfait de l'organisation)

Regardez d'abord le forfait de l'organisation, sans rien changer :
https://github.com/organizations/quran-school-org/settings/billing/summary.
Sur un dépôt privé, les **environnements GitHub** (et leurs variables) ne
sont disponibles qu'avec **Team** ou **Enterprise** ; avec **Free**, on utilise
des variables de **dépôt** préfixées. Les workflows reconnaissent seuls la
configuration (D75) : dès qu'une variable `DEV_FIREBASE_PROJECT_ID` ou
`PROD_FIREBASE_PROJECT_ID` existe, ils lisent les variables préfixées et ne
déclarent aucun environnement ; sinon, ils utilisent les environnements `dev`
et `production`. Une variable de dépôt facultative `USE_GITHUB_ENVIRONMENTS`
(`true` ou `false`) force l'un ou l'autre mode.

N'ajoutez **aucun secret**, seulement des **variables** : ces valeurs ne sont
pas secrètes. Avec le forfait Free, il n'y a ni relecteur ni règle de branche :
les garde-fous sont dans les workflows (confirmation par l'ID du projet,
production depuis `main` seulement, simulation par défaut) et dans la condition
du fournisseur Google (étape 2).

**Valeurs de dev de l'étape 1.6** (configuration web publique du projet de dev) :

| Variable | Valeur |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` (`<ID du dev>.firebaseapp.com`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` (`<ID du dev>.firebasestorage.app`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIRESTORE_DATABASE_ID` | `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec` |
| `FUNCTIONS_FIRESTORE_DATABASE_ID` | idem |
| `FUNCTIONS_TRIGGER_REGION` | l'emplacement de l'étape 1.3 ; `eur3` → `europe-west1`, `nam5` → `us-central1` |

La prod n'a pas besoin de ces valeurs : elles sont déjà dans le dépôt (`.env.production`).

### 3 A. Forfait Team ou Enterprise : environnements

Settings › **Environments** :
1. Créez (ou vérifiez) les environnements `dev` et `production`.
2. Dans `dev` › *Environment variables* : les 6 lignes « VALEURS POUR GITHUB (dev) »
   de l'étape 2, plus les 8 valeurs du tableau ci-dessus.
3. Dans `production` › *Environment variables* : les 6 lignes « VALEURS POUR
   GITHUB (production) ».

### 3 B. Forfait Free : variables de dépôt préfixées

Settings › *Secrets and variables* › *Actions* › onglet **Variables** ›
*New repository variable*. Ne passez pas à un forfait payant pour cela.
1. `DEV_` + chacune des 6 valeurs dev de l'étape 2 : `DEV_FIREBASE_PROJECT_ID`,
   `DEV_FIRESTORE_DATABASE_ID`, `DEV_GCP_WIF_PROVIDER`,
   `DEV_GCP_DEPLOY_SERVICE_ACCOUNT`, `DEV_GCP_OPS_SERVICE_ACCOUNT`, `DEV_BACKUP_BUCKET`.
2. `DEV_` + chacune des 8 valeurs du tableau : `DEV_VITE_FIREBASE_API_KEY`, …,
   `DEV_FUNCTIONS_TRIGGER_REGION`.
3. `PROD_` + chacune des 6 valeurs production de l'étape 2 :
   `PROD_FIREBASE_PROJECT_ID`, …, `PROD_BACKUP_BUCKET`.

Les workflows ne lisent **jamais** une variable `DEV_…` pour la production ni
une variable `PROD_…` pour le dev, et s'arrêtent si une valeur de l'un est
recopiée dans l'autre (projet, fournisseur, compte, bucket).

Si des environnements `dev` et `production` ont été créés lors d'une session
précédente, laissez-les : dès que les variables `DEV_…` ou `PROD_…` existent,
les workflows ne les utilisent plus.

### 3 C. Pour les deux forfaits

1. **Chiffrement des artefacts (recommandé, obligatoire pour remplacer des mots
   de passe)** : un artefact GitHub est lisible par toute personne, ou tout
   agent, qui lit le dépôt. Sur **votre** ordinateur, créez une paire de clés
   GnuPG (`gpg --quick-gen-key "Propriétaire kuttab"`), exportez la clé
   **publique** (`gpg --armor --export "Propriétaire kuttab"`) et collez-la dans
   une variable `ARTIFACT_GPG_PUBLIC_KEY` : de dépôt (la plus simple, valable
   pour le dev et la prod), ou préfixée (`DEV_…`, `PROD_…`), ou d'environnement.
   La clé privée ne quitte jamais votre ordinateur. Pour lire un rapport :
   `gpg --decrypt contenu.tar.gz.gpg | tar -xz`.
2. **Facultatives** : `FUNCTIONS_TRIGGER_REGION` pour la prod si la base n'est
   pas en `eur3`/`europe-west1`, et `SUPER_ADMIN_USERNAME` avant la bascule
   (préfixées `PROD_…` / `DEV_…` en Free, dans l'environnement sinon).
3. **Aperçus (Team ou Enterprise seulement, facultatif)** : environnement
   `preview` avec `FIREBASE_PROJECT_ID` (dev), `GCP_WIF_PROVIDER` (valeur
   « preview » affichée à l'étape 2), `GCP_DEPLOY_SERVICE_ACCOUNT` =
   `github-preview@<ID du dev>.iam.gserviceaccount.com` et les mêmes `VITE_*`
   que `dev`.

## 4. Clé Gemini (rapport IA)

Dans Cloud Shell, **sur la prod** puis **sur le dev** :

```bash
read -s -p "Clé Gemini : " K; echo
printf %s "$K" | gcloud secrets create GEMINI_API_KEY --replication-policy=automatic --data-file=- --project <ID du projet>
unset K
```

Collez la clé quand la commande la demande. Elle ne s'affiche pas à l'écran, et elle est stockée dans Secret Manager : ni dans GitHub, ni dans le chat. Si vous n'en avez pas, créez-en une sur https://aistudio.google.com/apikey.

## 5. Geler AI Studio

Mettez-vous d'accord avec l'autre développeur : plus aucun déploiement depuis AI Studio, ni sur Cloud Run, ni sur Hosting. Sinon, l'ancienne version, avec ses failles, écraserait la nouvelle.

## 6. Me dire « c'est prêt »

Je vérifie alors seul que tout fonctionne : un premier déploiement sur le dev, puis la lecture de l'emplacement de la base de prod.

## 7. Ce que je fais ensuite, et vos 3 « go »

1. **Lot 0 en simulation sur la prod**, sans aucune écriture. Je vous montre le résumé : comptes trouvés, anomalies, liens parent/enfant.
   - **Go n°1** : vous validez le résumé et choisissez l'heure de la coupure, environ 15 minutes.
2. **Lot 0 réel**, aux heures convenues : sauvegarde, création des comptes Auth, règles, puis nouvelle application.
   - Les mots de passe **ne changent pas** : ils deviennent invisibles, et chacun doit en choisir un nouveau à sa première connexion.
   - **Le directeur doit se connecter juste après**, car son mot de passe actuel est public.
   - Je vous remets la liste des identifiants, en artefact de GitHub chiffré pour votre clé (étape 3 C), à télécharger, déchiffrer puis supprimer.
3. **Deux répétitions de la migration multi-écoles sur le dev**, avec une copie des données de prod. Je vous remets le fichier des liens parent/enfant douteux, à faire valider par l'école.
   - **Go n°2** : vous validez le rapport de répétition et les liens.
4. **Bascule multi-écoles en prod**, pendant une fenêtre de maintenance.
   - **Go n°3** : vous fixez la date.
5. **Création de la deuxième école**, puis de ses comptes.

**Retour arrière** : à chaque étape, une sauvegarde est faite juste avant, et la version précédente du site se restaure en un clic (Hosting › Historique des versions).
