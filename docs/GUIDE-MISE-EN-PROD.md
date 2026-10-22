# Guide de mise en production

**Le principe** : vous ouvrez les accès **une seule fois** (environ 45 minutes, sans compétence particulière). Ensuite, **Claude déclenche tout lui-même** depuis GitHub Actions : déploiements, scripts de données, sauvegardes, répétitions sur le projet de dev. Aucune clé ni aucun mot de passe ne circule : GitHub prouve son identité à Google Cloud (Workload Identity Federation), et les droits sont limités au strict nécessaire.

| Étape | Qui | Durée |
|---|---|---|
| 1. Créer le projet Firebase de dev | Vous | 10 min |
| 2. Relier GitHub à Google Cloud (dev, puis prod) | Vous, copier-coller dans Cloud Shell | 2 × 10 min |
| 3. Créer les environnements et variables GitHub | Vous, dans l'interface GitHub | 10 min |
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

1. Ouvrez https://console.cloud.google.com, sélectionnez le **projet de dev**, puis cliquez sur l'icône **Cloud Shell** `>_` en haut à droite.
2. Copiez-collez le bloc ci-dessous **en entier**, après avoir rempli les 3 lignes marquées `À REMPLIR`.
3. **Recommencez ensuite dans le projet de prod**, avec `ENV=production` et l'ID de la prod.

```bash
# ======== À REMPLIR ========
export PROJECT=quran-school-dev-1a2b3      # À REMPLIR : ID du projet (prod : gen-lang-client-0481880143)
export ENV=dev                              # À REMPLIR : dev, puis production
export LOC=europe-west2                     # À REMPLIR : emplacement de la base noté à l'étape 1.3
# ===========================
# Emplacement du bucket : multirégion EU pour eur3, US pour nam5, sinon la même région
case "$LOC" in eur3) BUCKET_LOC=EU ;; nam5) BUCKET_LOC=US ;; *) BUCKET_LOC=$LOC ;; esac
export REPO=quran-school-org/quran-school-app
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
gcloud config set project $PROJECT
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
export POOL=github PROVIDER=quran-school-app
export DEPLOY_SA=github-deploy@$PROJECT.iam.gserviceaccount.com
export OPS_SA=github-ops@$PROJECT.iam.gserviceaccount.com
export PRINCIPAL="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/subject/repo:$REPO:environment:$ENV"

# 1) API nécessaires
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com iam.googleapis.com \
  cloudresourcemanager.googleapis.com firebase.googleapis.com firebasehosting.googleapis.com \
  firebaserules.googleapis.com firestore.googleapis.com cloudfunctions.googleapis.com \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  eventarc.googleapis.com pubsub.googleapis.com secretmanager.googleapis.com \
  cloudscheduler.googleapis.com identitytoolkit.googleapis.com storage.googleapis.com

# 2) Confiance GitHub → Google : seuls les jobs de CE dépôt, dans l'environnement $ENV,
#    lancés depuis main et par l'un des 3 workflows prévus (revue D74). Le dev
#    reçoit une copie des données réelles : il est protégé comme la prod. Une
#    autre branche (ou un autre fichier de workflow) n'obtient aucun jeton.
export WIF_WORKFLOWS="'$REPO/.github/workflows/deploy.yml@refs/heads/main', '$REPO/.github/workflows/deploy-lot0.yml@refs/heads/main', '$REPO/.github/workflows/ops.yml@refs/heads/main'"
export WIF_CONDITION="assertion.repository=='$REPO' && assertion.environment=='$ENV' && assertion.ref=='refs/heads/main' && assertion.job_workflow_ref in [$WIF_WORKFLOWS]"
gcloud iam workload-identity-pools create $POOL --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc $PROVIDER --location=global \
  --workload-identity-pool=$POOL --display-name="quran-school-app" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment,attribute.ref=assertion.ref" \
  --attribute-condition="$WIF_CONDITION"
# (Fournisseur déjà créé avec l'ancienne condition : remplacer « create-oidc » par
#  « update-oidc » et ne garder que --workload-identity-pool et --attribute-condition.)

# 3) Compte de DÉPLOIEMENT (règles, Functions, Hosting) : rôles minimaux, aucune clé
gcloud iam service-accounts create github-deploy --display-name="Déploiement GitHub Actions"
gcloud iam service-accounts add-iam-policy-binding $DEPLOY_SA --role=roles/iam.workloadIdentityUser --member="$PRINCIPAL"
for ROLE in roles/firebasehosting.admin roles/firebaserules.admin roles/cloudfunctions.admin roles/run.admin \
  roles/eventarc.developer roles/cloudscheduler.admin roles/secretmanager.viewer roles/artifactregistry.writer \
  roles/serviceusage.serviceUsageConsumer roles/firebaseextensions.viewer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$DEPLOY_SA" --role=$ROLE --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding $PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser --member="serviceAccount:$DEPLOY_SA"

# 4) Compte d'OPÉRATIONS (scripts de données, exports) : séparé du déploiement
gcloud iam service-accounts create github-ops --display-name="Opérations de données GitHub Actions"
gcloud iam service-accounts add-iam-policy-binding $OPS_SA --role=roles/iam.workloadIdentityUser --member="$PRINCIPAL"
for ROLE in roles/datastore.user roles/datastore.viewer roles/datastore.importExportAdmin \
  roles/firebaseauth.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$OPS_SA" --role=$ROLE --condition=None >/dev/null
done

# 5) Bucket de sauvegardes (exports Firestore), conservés 30 jours
export BUCKET=$PROJECT-sauvegardes
gcloud storage buckets create gs://$BUCKET --location=$BUCKET_LOC --uniform-bucket-level-access
echo '{"rule":[{"action":{"type":"Delete"},"condition":{"age":30}}]}' > /tmp/cycle.json
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/cycle.json
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member="serviceAccount:$OPS_SA" --role=roles/storage.objectAdmin
gcloud beta services identity create --service=firestore.googleapis.com
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.admin

# 6) Restauration à un instant donné (filet de sécurité sur 7 jours)
gcloud firestore databases update --database=$DB --enable-pitr

# 7) Valeurs à reporter dans GitHub (étape 3) : copiez ce qui s'affiche
echo "FIREBASE_PROJECT_ID=$PROJECT"
echo "FIRESTORE_DATABASE_ID=$DB"
echo "GCP_WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER --location=global --workload-identity-pool=$POOL --format='value(name)')"
echo "GCP_DEPLOY_SERVICE_ACCOUNT=$DEPLOY_SA"
echo "GCP_OPS_SERVICE_ACCOUNT=$OPS_SA"
echo "BACKUP_BUCKET=$BUCKET"
```

**Uniquement dans le projet de DEV**, ajoutez ce bloc. Il permet au dev de lire les exports de la prod, pour la répétition de la migration :

```bash
export PROD_BUCKET=gen-lang-client-0481880143-sauvegardes
export DEV_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud storage buckets add-iam-policy-binding gs://$PROD_BUCKET \
  --member="serviceAccount:service-$DEV_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.objectViewer
```

Faites ce bloc **après** le passage en prod, car le bucket de la prod doit déjà exister.

**Uniquement dans le projet de DEV, et seulement si vous voulez des aperçus de
branche** (`preview.yml`) : un second fournisseur, ouvert à toutes les branches
mais limité à l'environnement `preview`, et un compte qui ne peut que publier
le Hosting (ni règles, ni fonctions, ni lecture de Firestore) (revue D68, D74) :

```bash
gcloud iam workload-identity-pools providers create-oidc $PROVIDER-preview --location=global \
  --workload-identity-pool=$POOL --display-name="quran-school-app (aperçus)" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.environment=assertion.environment,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='$REPO' && assertion.environment=='preview'"
gcloud iam service-accounts create github-preview --display-name="Aperçus GitHub Actions (Hosting seulement)"
gcloud iam service-accounts add-iam-policy-binding github-preview@$PROJECT.iam.gserviceaccount.com --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/subject/repo:$REPO:environment:preview"
for ROLE in roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:github-preview@$PROJECT.iam.gserviceaccount.com" --role=$ROLE --condition=None >/dev/null
done
echo "GCP_WIF_PROVIDER (preview)=$(gcloud iam workload-identity-pools providers describe $PROVIDER-preview --location=global --workload-identity-pool=$POOL --format='value(name)')"
```

> Si une commande répond qu'un élément « existe déjà », ce n'est pas grave : continuez.
> Si elle répond « permission denied », vérifiez que vous êtes bien dans le bon projet (`gcloud config get project`).

## 3. Environnements et variables GitHub

Dans https://github.com/quran-school-org/quran-school-app › **Settings** › **Environments** :

1. **New environment** `dev`, puis **New environment** `production`.
   - Avec le forfait GitHub gratuit sur un dépôt privé, on ne peut pas exiger de relecteur. Les garde-fous sont dans les workflows : confirmation par l'ID du projet, branches autorisées, et simulation par défaut.
2. Dans **chaque** environnement › *Environment variables* › *Add variable* : reportez les 6 lignes affichées à la fin du bloc de l'étape 2, correspondant au bon projet.
3. **Dans `dev` seulement**, ajoutez aussi les valeurs du `firebaseConfig` de l'étape 1.6 :

| Variable | Valeur |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<ID du dev>.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<ID du dev>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIRESTORE_DATABASE_ID` | `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec` |
| `FUNCTIONS_FIRESTORE_DATABASE_ID` | idem |
| `FUNCTIONS_TRIGGER_REGION` | l'emplacement de l'étape 1.3 (si `eur3`, mettre `europe-west1`) |

La prod n'a pas besoin de ces valeurs : elles sont déjà dans le dépôt (`.env.production`).

4. **Chiffrement des artefacts (recommandé, obligatoire pour remplacer des mots
   de passe)** : un artefact GitHub est lisible par toute personne, ou tout
   agent, qui lit le dépôt. Sur **votre** ordinateur, créez une paire de clés
   GnuPG (`gpg --quick-gen-key "Propriétaire kuttab"`), exportez la clé
   **publique** (`gpg --armor --export "Propriétaire kuttab"`) et collez-la dans
   la variable `ARTIFACT_GPG_PUBLIC_KEY` de **chaque** environnement. La clé
   privée ne quitte jamais votre ordinateur. Pour lire un rapport :
   `gpg --decrypt contenu.tar.gz.gpg | tar -xz`.
5. **Aperçus (facultatif)** : environnement `preview` avec `FIREBASE_PROJECT_ID`
   (dev), `GCP_WIF_PROVIDER` (valeur « preview » affichée ci-dessus),
   `GCP_DEPLOY_SERVICE_ACCOUNT` = `github-preview@<ID du dev>.iam.gserviceaccount.com`
   et les mêmes `VITE_*` que `dev`.

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
   - Je vous remets la liste des identifiants, en artefact de GitHub chiffré pour votre clé (étape 3.4), à télécharger, déchiffrer puis supprimer.
3. **Deux répétitions de la migration multi-écoles sur le dev**, avec une copie des données de prod. Je vous remets le fichier des liens parent/enfant douteux, à faire valider par l'école.
   - **Go n°2** : vous validez le rapport de répétition et les liens.
4. **Bascule multi-écoles en prod**, pendant une fenêtre de maintenance.
   - **Go n°3** : vous fixez la date.
5. **Création de la deuxième école**, puis de ses comptes.

**Retour arrière** : à chaque étape, une sauvegarde est faite juste avant, et la version précédente du site se restaure en un clic (Hosting › Historique des versions).
