Tu reprends une configuration déjà commencée dans Google Cloud, Firebase et GitHub, dans le navigateur où je suis connecté. Une partie a peut-être déjà été faite lors d'une session précédente : **vérifie toujours avant de créer**, et ne recrée ni ne supprime rien qui existe déjà. Cette version REMPLACE la précédente : la condition d'accès GitHub → Google a changé, et l'étape GitHub dépend du forfait.

## Règles absolues
- Le projet `gen-lang-client-0481880143` est la PRODUCTION. Il contient des données réelles d'élèves mineurs. Tu n'y fais QUE l'étape D. Tu n'y touches JAMAIS :
  - aux données Firestore ;
  - aux règles Firestore ;
  - aux utilisateurs ni aux paramètres d'Authentication ;
  - au Hosting ni au Cloud Run.
- Ne supprime RIEN. La seule exception est le retrait d'une ancienne autorisation IAM, explicitement prévu dans le bloc de l'étape C.
- Ne crée JAMAIS de clé de compte de service.
- Ne recopie aucun secret : clé Gemini, jeton, mot de passe, clé GPG privée.
- Ne souscris à AUCUN forfait payant, ni chez GitHub ni chez Google, sauf le forfait Blaze du projet de dev, décrit à l'étape B.
- Si une commande renvoie une erreur autre que « already exists / existe déjà / not found » quand le bloc l'attend, ARRÊTE-TOI et rapporte l'erreur exacte.
- Dans Cloud Shell, vérifie avec `gcloud config get project` que tu es dans le bon projet avant chaque bloc.

## Étape 0 : forfait GitHub de l'organisation (lecture seule)
Ouvre https://github.com/organizations/quran-school-org/settings/billing/summary (ou Settings › Billing and plans) et note le forfait : **Free**, **Team** ou **Enterprise**. Appelons-le PLAN. Ne change rien.

## Étape A : identifiants (lecture seule)
1. Console Firebase, projet de dev (PAS `gen-lang-client-0481880143`) : note son **ID** (⚙️ › Paramètres du projet). Appelons-le DEV_ID.
2. Projet de PROD, Firestore Database, base `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec` : note l'**emplacement** (par exemple `europe-west2` ou `eur3`). Appelons-le LOC.

## Étape B : projet de dev (vérifier, compléter ce qui manque)
1. Forfait **Blaze** activé, avec le même compte de facturation que la prod.
2. Budget « quran-school-dev » de **10 EUR**, limité à DEV_ID (https://console.cloud.google.com/billing › Budgets et alertes).
3. Firestore : une base dont l'ID est exactement `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`, à l'emplacement LOC, en mode production.
   - **Si une base `(default)` a été créée par erreur**, ne la supprime pas : signale-la.
   - Si la base nommée existe mais à un autre emplacement, ARRÊTE-TOI et signale-le.
4. Authentication : la méthode **Adresse e-mail/Mot de passe** est activée.
5. Application web `web-dev` déclarée (`</>`). Note `apiKey`, `authDomain`, `storageBucket`, `messagingSenderId` et `appId`. Ces valeurs sont publiques.

## Étape C : Cloud Shell sur le projet de DEV
Ouvre https://console.cloud.google.com/?project=DEV_ID, puis Cloud Shell. Colle le bloc ci-dessous en remplaçant les 3 valeurs `À REMPLIR`. Il peut être relancé sans risque : il vérifie ce qui existe déjà.

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

Vérifie dans « CONTRÔLE » que :
- la condition contient bien `refs/heads/main` et `job_workflow_ref` ;
- les membres du compte de déploiement contiennent `principalSet://…attribute.repository/quran-school-org/quran-school-app` et ne contiennent PLUS `…subject/repo:…:environment:dev`.

Note les 6 lignes « VALEURS POUR GITHUB (dev) ». Si `--enable-pitr` est refusé, signale-le et continue.

## Étape D : Cloud Shell sur le projet de PROD
1. Ouvre https://console.cloud.google.com/?project=gen-lang-client-0481880143, puis Cloud Shell. Vérifie que `gcloud config get project` affiche bien `gen-lang-client-0481880143`.
2. Colle **le même bloc** que l'étape C, avec `PROJECT=gen-lang-client-0481880143`, `ENV=production` et le même `LOC`.
3. Ce bloc ne touche à aucune donnée : il configure des accès, un bucket de sauvegardes et la restauration à un instant donné. Fais les mêmes contrôles. Note les 6 lignes « VALEURS POUR GITHUB (production) ».

## Étape E : le dev peut lire les sauvegardes de la prod (Cloud Shell du DEV)
```bash
export PROJECT=DEV_ID   # À REMPLIR
export DEV_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding gs://gen-lang-client-0481880143-sauvegardes \
  --member="serviceAccount:service-$DEV_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.objectViewer
```

## Étape F : variables GitHub (selon PLAN)
Dépôt : https://github.com/quran-school-org/quran-school-app › Settings. N'ajoute AUCUN « secret », seulement des **variables**.

**Valeurs de l'étape B.5 et de LOC à utiliser pour le dev :**
- `VITE_FIREBASE_API_KEY` = apiKey
- `VITE_FIREBASE_AUTH_DOMAIN` = authDomain
- `VITE_FIREBASE_STORAGE_BUCKET` = storageBucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = messagingSenderId
- `VITE_FIREBASE_APP_ID` = appId
- `VITE_FIRESTORE_DATABASE_ID` = `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`
- `FUNCTIONS_FIRESTORE_DATABASE_ID` = `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`
- `FUNCTIONS_TRIGGER_REGION` = LOC, sauf `eur3` → `europe-west1` et `nam5` → `us-central1`

**Si PLAN = Team ou Enterprise** : Settings › Environments.
1. Crée (ou vérifie) les environnements `dev` et `production`, sans règle de protection.
2. Dans `dev` › Environment variables : les 6 valeurs dev de l'étape C, plus les 8 valeurs ci-dessus.
3. Dans `production` › Environment variables : les 6 valeurs production de l'étape D.

**Si PLAN = Free** : les environnements ne sont pas disponibles pour un dépôt privé. N'essaie pas de passer à un forfait payant. Va dans Settings › Secrets and variables › Actions › onglet **Variables** › *New repository variable*, et crée des variables de DÉPÔT **préfixées** :
1. `DEV_` + chacune des 6 valeurs dev de l'étape C, par exemple `DEV_FIREBASE_PROJECT_ID`, `DEV_GCP_WIF_PROVIDER`, etc.
2. `DEV_` + chacune des 8 valeurs ci-dessus, par exemple `DEV_VITE_FIREBASE_API_KEY`, `DEV_FUNCTIONS_TRIGGER_REGION`, etc.
3. `PROD_` + chacune des 6 valeurs production de l'étape D, par exemple `PROD_FIREBASE_PROJECT_ID`, `PROD_GCP_WIF_PROVIDER`, etc.

Si des environnements `dev` et `production` ont été créés lors de la session précédente, laisse-les tels quels et signale-le.

## Étape G : rapport final
Donne-moi :
- PLAN, DEV_ID et LOC ;
- pour chaque étape, de 0 à F : déjà fait, fait maintenant, ou erreur, avec le message exact ;
- la sortie des blocs « CONTRÔLE » du dev et de la prod ;
- la liste des variables GitHub créées (noms et valeurs, qui ne sont pas secrètes) et leur emplacement (environnement ou dépôt) ;
- tout ce qui t'a semblé anormal, notamment une base `(default)`, un mauvais emplacement, ou une ancienne autorisation impossible à retirer.

Ne fais rien d'autre que ce qui est décrit ici.
