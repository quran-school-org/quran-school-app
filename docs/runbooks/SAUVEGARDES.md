# Runbook — sauvegardes Firestore (PITR, exports quotidiens, restauration)

> **À EXÉCUTER PAR UN HUMAIN**, d'abord sur le projet de **dev**. Aucune de ces
> commandes n'a été lancée par un agent. Décision : D47.
> Le code (`functions/src/backup.ts`, fonction `scheduledFirestoreExport`) est
> **omis du déploiement** tant que `BACKUP_ENABLED` ne vaut pas `true`.

```bash
export PROJECT=<id-du-projet>     # dev d'abord, puis gen-lang-client-0481880143
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
export BUCKET=$PROJECT-firestore-sauvegardes
gcloud firestore databases describe --database=$DB --project=$PROJECT --format="value(locationId)"
# → ex. eur3 : bucket multirégional EU ; europe-west1 : bucket europe-west1.
export BUCKET_LOCATION=EU
```

## 1. Restauration à un instant donné (PITR) : 7 jours, à la minute
```bash
gcloud firestore databases update --database=$DB --enable-pitr --project=$PROJECT
gcloud firestore databases describe --database=$DB --project=$PROJECT \
  --format="value(pointInTimeRecoveryEnablement,earliestVersionTime)"
```
Coût : stockage des versions sur 7 jours (de l'ordre de la taille de la base).

## 2. Bucket des exports (privé, cycle de vie)
```bash
gcloud storage buckets create gs://$BUCKET --project=$PROJECT --location=$BUCKET_LOCATION \
  --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=7d

cat > /tmp/cycle-de-vie.json <<'EOF'
{ "rule": [
  { "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" }, "condition": { "age": 7, "matchesPrefix": ["firestore/"] } },
  { "action": { "type": "Delete" }, "condition": { "age": 45, "matchesPrefix": ["firestore/"] } }
] }
EOF
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/cycle-de-vie.json
gcloud storage buckets describe gs://$BUCKET --format="default(lifecycle_config)"
```
La fonction supprime elle-même les exports de plus de `BACKUP_RETENTION_DAYS`
(30 jours, en gardant toujours les 3 plus récents) ; la règle à 45 jours est le
filet de sécurité. Un export manuel à garder (avant bascule) se met **hors** du
préfixe `firestore/` (ex. `gs://$BUCKET/manuel/…`).

## 3. Comptes et droits (moindre privilège)
```bash
# Compte d'exécution dédié de la fonction planifiée.
gcloud iam service-accounts create firestore-backup --display-name="Sauvegarde Firestore" --project=$PROJECT
export BACKUP_SA=firestore-backup@$PROJECT.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$BACKUP_SA" \
  --role=roles/datastore.importExportAdmin --condition=None
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member="serviceAccount:$BACKUP_SA" --role=roles/storage.objectAdmin

# Agent de service Firestore : c'est lui qui écrit l'export dans le bucket.
gcloud beta services identity create --service=firestore.googleapis.com --project=$PROJECT
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.objectAdmin
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com" --role=roles/storage.legacyBucketReader

# Le déployeur (humain ou compte github-deploy, D46) doit pouvoir « agir en tant que » ce compte.
gcloud iam service-accounts add-iam-policy-binding $BACKUP_SA --project=$PROJECT \
  --role=roles/iam.serviceAccountUser --member="serviceAccount:github-deploy@$PROJECT.iam.gserviceaccount.com"
```

## 4. Activation de la fonction planifiée
Dans `functions/.env.$PROJECT` (versionné pour la prod, aucun secret) :
```
BACKUP_ENABLED=true
BACKUP_BUCKET=<valeur de $BUCKET>
BACKUP_RETENTION_DAYS=30
```
```bash
npx firebase deploy --only functions:scheduledFirestoreExport --project $PROJECT
gcloud scheduler jobs list --location=europe-west1 --project=$PROJECT
# Exécution immédiate (premier essai) :
gcloud scheduler jobs run firebase-schedule-scheduledFirestoreExport-europe-west1 --location=europe-west1 --project=$PROJECT
gcloud storage ls gs://$BUCKET/firestore/$DB/
```
Journaux : `jsonPayload.message="backup.exported"` (et `backup.pruned`).
Alerte conseillée : Logging › alerte si aucun `backup.exported` en 26 h.

Option native complémentaire (sans code) : sauvegardes planifiées gérées par
Firestore, restaurables dans une nouvelle base :
```bash
gcloud firestore backups schedules create --database=$DB --recurrence=daily --retention=14d --project=$PROJECT
```

## 5. Test de restauration (sur le projet de DEV, au moins une fois par trimestre)
Ne jamais importer dans la base en service : on restaure dans une base **neuve**.
```bash
export DEV=<id-du-projet-de-dev>
export STAMP=$(gcloud storage ls gs://$DEV-firestore-sauvegardes/firestore/$DB/ | sort | tail -1)
gcloud firestore databases create --database=restauration-test --location=<même emplacement> --project=$DEV
gcloud firestore import "$STAMP" --database=restauration-test --project=$DEV
```
Comparer, dans la console Firestore (onglet « Générateur de requêtes », fonction
« Compter »), la base `restauration-test` et la base en service :
`schools/<école>/students`, `teachers`, `staffPrivate`, `payments`, `members`,
et ouvrir quelques documents. Puis supprimer la base de test :
```bash
gcloud firestore databases delete --database=restauration-test --project=$DEV
```
À noter dans le registre d'exploitation : date, export utilisé, durée, écarts.

**Restauration PITR** (erreur humaine récente, < 7 jours) : exporter l'état
d'un instant passé, puis l'importer dans une base neuve et recopier les
documents voulus (jamais d'import direct sur la base en service) :
```bash
gcloud firestore export gs://$BUCKET/manuel/pitr-$(date +%Y%m%d-%H%M) --database=$DB \
  --snapshot-time=2026-10-22T08:00:00Z --project=$PROJECT
```

## 6. Retour arrière
`BACKUP_ENABLED=false` puis `npx firebase deploy --only functions --project $PROJECT --force`
(la fonction et sa tâche Cloud Scheduler sont supprimées ; les exports restent).
