# Runbook — migration multi-écoles et bascule en production

> **Depuis D64** : les étapes de ce runbook sont exécutées par l'orchestrateur au
> moyen des workflows GitHub Actions (`docs/runbooks/OPERATIONS-CLAUDE.md`), après
> le « go » du propriétaire ; aucun agent ne lance de commande vers la prod depuis
> un conteneur. Les commandes ci-dessous restent la référence technique et la
> procédure des retours arrière, qui demeurent exécutés par un humain.

> **À exécuter par un humain**, jamais par un agent. Branche : `feat/multi-tenant`
> (relue, fusionnée). Ce runbook suppose le Lot 0 déployé (`LOT0-DEPLOIEMENT.md`),
> mais fonctionne aussi sans : la migration inclut le provisionnement des comptes.
>
> Résultat : les données de l'école n°1 passent de la racine à `schools/alfajr/…`,
> les comptes deviennent `users/{uid}` + `schools/alfajr/members/{uid}`, les règles
> ferment la racine, le front et les Cloud Functions multi-écoles sont en ligne.
> Les données racine sont **conservées** 30 jours pour le retour arrière.

```bash
export PROJECT=gen-lang-client-0481880143
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export BUCKET=gs://<bucket-de-sauvegarde>
export SCHOOL=alfajr
export OWNER=<nom d'utilisateur du super-admin de la plateforme>   # ex. admin_alfajr ou un compte dédié
export STAMP=$(date +%Y%m%d-%H%M)
```

---

## 0. Préparation

1. Poste prêt comme pour le Lot 0 (§0 de `LOT0-DEPLOIEMENT.md`) : Node 22, Java 21,
   `gcloud auth application-default login`, `npx firebase login`, puis :
   ```bash
   git checkout feat/multi-tenant && git pull
   npm ci && npm ci --prefix functions
   npm run lint && npm run lint:functions && npm run build && npm test
   npm run test:rules && npm run test:e2e
   ```
2. **Clé Gemini** dans Secret Manager (jamais dans un fichier) :
   ```bash
   npx firebase functions:secrets:set GEMINI_API_KEY --project prod
   ```
3. **Région des triggers** : vérifier l'emplacement de la base et renseigner
   `FIRESTORE_TRIGGER_REGION` dans `functions/.env.gen-lang-client-0481880143`
   (voir §0.5 du runbook Lot 0).
4. **Super-admin** : choisir le compte qui portera le claim `superAdmin` (le
   propriétaire de la plateforme). Il doit exister dans `appUsers`.
   **Recommandé (revue de sécurité)** : un compte **dédié** à la plateforme,
   créé au préalable par le directeur (Paramètres › المستخدمين, rôle « أخرى »),
   plutôt que `admin_alfajr` : le compte du directeur de l'école ne doit pas
   cumuler la réinitialisation de tous les mots de passe de la plateforme.
5. Prévoir une **fenêtre de maintenance** (1 h) et le **gel des déploiements AI Studio**.

## 1. Sauvegarde (avant chaque répétition et avant la bascule)

```bash
gcloud firestore databases update --database=$DB --enable-pitr --project=$PROJECT
gcloud firestore export $BUCKET/bascule-$STAMP --database=$DB --project=$PROJECT
npx firebase auth:export auth-avant-bascule-$STAMP.json --format=json --project prod   # SECRET : hors dépôt, chiffré
```
Noter la version Hosting en ligne (Console › Hosting › historique).

## 2. Répétition sur un projet de développement (au moins deux fois)

1. **Projet de dev** (plan Blaze), base nommée identique, même emplacement :
   ```bash
   export DEV=<id-du-projet-dev>     # ex. kuttab-dev
   gcloud firestore databases create --database=$DB --location=<emplacement-de-la-prod> --project=$DEV
   npx firebase use --add            # choisir $DEV, alias « dev »
   ```
2. **Copie des données de prod** (lecture seule sur la prod) :
   ```bash
   # Donner au compte de service Firestore du projet de dev la lecture du bucket de sauvegarde, puis :
   gcloud firestore import $BUCKET/bascule-$STAMP --database=$DB --project=$DEV
   # Comptes Auth : paramètres de hachage dans Console prod › Authentication › Utilisateurs › ⋮ › Paramètres de hachage
   npx firebase auth:import auth-avant-bascule-$STAMP.json --hash-algo=SCRYPT --hash-key=<clé> \
     --salt-separator=<séparateur> --rounds=<rounds> --mem-cost=<mem-cost> --project dev
   ```
3. **Front de dev** : créer `.env.dev.local` (non versionné) avec la config web du
   projet de dev (`VITE_FIREBASE_*`, `VITE_FIRESTORE_DATABASE_ID=$DB`,
   `VITE_USE_EMULATORS=false`, `VITE_API_BASE_URL=""`), puis
   `npx vite build --mode dev`.
4. **Migration sur le dev** :
   ```bash
   npx tsx scripts/migration/migrate-to-tenants.ts --project=$DEV --database=$DB --school=$SCHOOL --super-admin=$OWNER
   # relire les rapports (§3), puis :
   npx tsx scripts/migration/migrate-to-tenants.ts --project=$DEV --database=$DB --school=$SCHOOL --super-admin=$OWNER --apply --confirm-prod=$DEV
   ```
5. **Déploiement sur le dev** :
   `npx firebase deploy --only functions,firestore:rules,hosting --project dev --force`
6. **Recette** : connexion de chaque rôle, données correctes, cotisations,
   impression d'un reçu, rapport IA, archivage d'une fiche de test, création
   d'une seconde école de test (super-admin) et changement d'école.
7. Recommencer depuis l'étape 2 avec un export frais avant la bascule.

## 3. Lecture des rapports de migration

Dossier `scripts/migration/out/migration-<école>-<mode>-<date>/` (**données
personnelles, ne pas diffuser**) :

| Fichier | À vérifier |
|---|---|
| `resume.json` | `critical: false` ; `accounts.pendingAuth` = 0 après application |
| `comptages.csv` | pour chaque collection : `source` = `copied` + `skippedExisting`, et après application `targetAfter` = `source`. La ligne `staffPrivate` (fiches RH du personnel, D42) a pour `source` le nombre de fiches `teachers` de la racine portant au moins un champ RH (salaire, contrat, CIN, adresse, contact d'urgence, naissance) |
| `resume.json` › `staffSplitExisting` | fiches publiques déjà présentes dans `schools/…/teachers` qui portaient encore des champs RH (répétition antérieure à D42) : scindées par le script, anomalie `STAFF_PRIVATE_SPLIT` (info). Si une fiche RH existait déjà, elle est conservée et seulement complétée des champs qui lui manquaient ; une valeur différente donne `STAFF_PRIVATE_CONFLICT` (avertissement, noms des champs) : vérifier la bonne valeur avec l'école (valeur d'origine dans l'export d'avant bascule). Doit valoir 0 à la relance |
| `anomalies.csv` | critiques (u1, conflits de noms d'utilisateur, écritures échouées `WRITE_FAILED`, comptes en échec `ACCOUNT_FAILED`, `UNTRUSTED_AUTH_UID`) : à corriger avant la bascule ; avertissements (photos lourdes, parents sans enfant, identifiants renommés, `AUTHLINK_MISMATCH` : `appUsers` et `authLinks` divergeaient, le lien a été retenu avec le statut le plus restrictif) : à traiter |
| `comptes/…/mots-de-passe-temporaires.csv` | **SECRET**, seulement si des comptes n'avaient pas été provisionnés par le Lot 0 (tous remplacés par défaut, voir le runbook du Lot 0 §2) : à remettre individuellement puis à supprimer |
| `comptes/…/liens-a-valider.csv` | rattachements parent/enfant non accordés par prudence : **à faire valider par l'école** |
| `comptes/…/identifiants-renommes.csv` | personnes à prévenir de leur nouvel identifiant |

## 4. Bascule (fenêtre de maintenance)

1. Annonce, fermeture des onglets, **sauvegarde** (§1).
2. **Cloud Functions** multi-écoles (les fonctions du Lot 0 sont supprimées) :
   ```bash
   npx firebase deploy --only functions --project prod --force
   ```
3. **Simulation** puis **application** de la migration :
   ```bash
   npx tsx scripts/migration/migrate-to-tenants.ts --project=$PROJECT --database=$DB --school=$SCHOOL --super-admin=$OWNER
   npx tsx scripts/migration/migrate-to-tenants.ts --project=$PROJECT --database=$DB --school=$SCHOOL --super-admin=$OWNER --apply --confirm-prod=$PROJECT
   ```
4. **Règles** (racine fermée), immédiatement :
   ```bash
   npx firebase deploy --only firestore:rules --project prod
   ```
5. **Hosting** :
   ```bash
   npm run build && npx firebase deploy --only hosting --project prod
   ```
6. **Contrôle d'écart** : relancer la simulation. Tous les `copied` doivent valoir 0.
   Sinon, un ancien onglet a écrit à la racine entre les étapes 3 et 4 : relancer
   `--apply` (seuls les documents manquants sont copiés, par `create` : un
   document déjà présent dans `schools/…`, même apparu pendant la relance, n'est
   jamais écrasé ; un document racine modifié après la migration n'est pas
   recopié — le corriger à la main). Ne **jamais** utiliser `--overwrite` après
   l'ouverture du nouveau front. Un code de sortie 2 signale une anomalie
   critique (échec de compte ou d'écriture) : lire `anomalies.csv`, corriger, relancer.

## 5. Vérifications

1. `comptages.csv` : `targetAfter` = `source` partout.
2. **Racine fermée, données de l'école lisibles** (avec un compte de test de
   l'école, par exemple un enseignant créé pour l'occasion ; email technique
   `<identifiant>@comptes.kuttab.local` pour un compte créé dans l'application,
   `<identifiant>@alfajr.local` pour un compte historique) :
   ```bash
   API_KEY=$(grep VITE_FIREBASE_API_KEY .env.production | cut -d'"' -f2)
   # Si la clé web est restreinte par référent (CLE-API-WEB.md), ajouter : -H "Referer: https://$PROJECT.web.app/"
   TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" -H 'Content-Type: application/json' \
     -d '{"email":"<identifiant-de-test>@comptes.kuttab.local","password":"<mot-de-passe>","returnSecureToken":true}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["idToken"])')
   curl -s -H "Authorization: Bearer $TOKEN" "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DB/documents/students" | head -3       # PERMISSION_DENIED
   curl -s -H "Authorization: Bearer $TOKEN" "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DB/documents/schools/$SCHOOL/classes" | head -3   # données
   ```
3. **Par rôle**, depuis l'URL Hosting : directeur (tout), إداري (finances, pas de
   gestion des comptes, salaires et CIN visibles dans شؤون العاملين), enseignant
   (ses halaqas ; dans la liste du personnel, ni salaire ni CIN), parent (ses enfants et leurs
   cotisations), élève (son dossier), agent d'entretien (aucun dossier d'élève).
4. **Super-admin** : sélecteur « كل المدارس… », création d'une école de test,
   puis la retirer (Console Firestore : supprimer `schools/<test>`).
5. **Rapport IA** (fonction `api`) depuis l'URL Hosting.
6. **Archivage** d'une fiche de test : le compte lié est suspendu en quelques secondes.

## 6. Retour arrière (fenêtre courte : décider dans les heures qui suivent)

Les données racine sont intactes, mais **tout ce qui a été saisi dans
`schools/alfajr/…` après la bascule serait perdu** au retour : à exporter
d'abord (`gcloud firestore export $BUCKET/apres-bascule-$STAMP --collection-ids=…`).

0. **Avant de redéployer le Lot 0 (revue de sécurité)** : les changements de
   comptes faits après la bascule (`setMemberRole` : rétrogradation, suspension)
   n'existent que dans `schools/alfajr/members` ; les règles du Lot 0 relisent
   `authLinks`, resté dans son état d'avant la bascule. Dans la console Firestore,
   filtrer `schools/alfajr/members` sur `updatedAt` postérieur à la bascule et,
   pour chaque compte suspendu ou rétrogradé, reporter `isActive` / `role` dans
   `authLinks/{uid}` (et `appUsers`). Les comptes retirés ou archivés ont été
   désactivés dans Firebase Auth et le restent. Les comptes créés après la
   bascule n'ont pas de lien : ils n'auront aucun accès sous le Lot 0.
1. Hosting : Console › Hosting › historique › restaurer la version du Lot 0.
2. Règles et Functions du Lot 0 :
   ```bash
   git checkout fix/lot0-securite
   npx firebase deploy --only firestore:rules,functions --project prod --force
   git checkout feat/multi-tenant
   ```
3. Les documents `users`, `schools/…`, `usernames` et le claim `superAdmin`
   restent : sans effet avec les règles du Lot 0.

## 7. Nettoyage à J+30 (après validation écrite de l'école)

1. Dernier export complet, conservé selon la politique de conservation (CNDP).
2. Suppression des anciennes collections racine :
   ```bash
   for c in students teachers classes attendance grades dailyProgress payments otherIncomes expenses \
            salaryPayments activities activityParticipants activityExpenses notifications settings appUsers authLinks; do
     npx firebase firestore:delete "$c" --recursive --database=$DB --project prod --force
   done
   ```
3. Suppression du service Cloud Run d'AI Studio (s'il existe) :
   `gcloud run services list --project=$PROJECT` puis
   `gcloud run services delete <service> --region=<région> --project=$PROJECT`.
4. Restreindre la clé API web (référents HTTP) et activer App Check (lot suivant).
5. Supprimer les rapports locaux et l'export Auth de votre poste.
