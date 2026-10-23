# Runbook — déploiement du Lot 0 (correctif de sécurité) en production

> **Depuis D64** : les étapes de ce runbook sont exécutées par l'orchestrateur au
> moyen des workflows GitHub Actions (`docs/runbooks/OPERATIONS-CLAUDE.md`), après
> le « go » du propriétaire ; aucun agent ne lance de commande vers la prod depuis
> un conteneur. Les commandes ci-dessous restent la référence technique et la
> procédure des retours arrière, qui demeurent exécutés par un humain.

> **À exécuter par un humain**, jamais par un agent. Durée estimée : 1 h 30
> (dont 30 à 45 min de fenêtre de maintenance). Branche : `fix/lot0-securite`
> (relue et fusionnée au préalable selon le processus habituel).
>
> Ce que le Lot 0 change : connexion exclusivement par Firebase Auth, liens
> d'autorisation `authLinks/{uid}`, règles Firestore par rôle, plus aucun mot de
> passe dans Firestore ni dans le navigateur, création/réinitialisation des
> comptes par Cloud Functions. La structure des données (collections à la
> racine) ne change pas.

Variables utilisées dans ce document :

```bash
export PROJECT=gen-lang-client-0481880143
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
export BUCKET=gs://<bucket-de-sauvegarde>      # à créer si besoin (étape 1.2)
export STAMP=$(date +%Y%m%d-%H%M)
```

---

## 0. Préparation (la veille)

1. **Poste** : Node 22, `gcloud`, accès propriétaire au projet. Dans le dépôt :
   ```bash
   git checkout fix/lot0-securite && git pull
   npm ci && npm ci --prefix functions
   npm run lint && npm run lint:functions && npm run build && npm test
   npm run test:rules          # tests sur émulateurs (Java 21 requis)
   ```
2. **Identifiants Admin SDK pour le script** (Application Default Credentials) :
   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project $PROJECT
   ```
   Le compte doit avoir les rôles *Cloud Datastore User* (ou *Firebase Admin*) et
   *Firebase Authentication Admin* sur le projet.
3. **CLI Firebase** : `npx firebase login` (compte propriétaire). Toujours
   passer `--project prod` (alias défini dans `.firebaserc`) ; le projet par
   défaut est `demo-quran-school` et ne déploie rien.
4. **Règles réellement déployées** : Console › Firestore › base `$DB` › Règles.
   Copier le texte dans un fichier local `regles-avant-lot0-$STAMP.rules`
   (ne pas le commiter). Comparer avec `git show main:firestore.rules`.
5. **Emplacement de la base** (nécessaire pour la région des triggers) :
   ```bash
   gcloud firestore databases describe --database=$DB --project=$PROJECT --format="value(locationId)"
   ```
   - `eur3` ou `europe-west1` → garder `FIRESTORE_TRIGGER_REGION=europe-west1` ;
   - `nam5` → `us-central1` ; `nam7` → `us-east4` ; base régionale `X` → `X`.
   Reporter la valeur dans `functions/.env.gen-lang-client-0481880143`.
6. **Où vont les utilisateurs ?** Domaine Firebase Hosting ou URL `*.run.app`
   d'AI Studio (rapport §1.5, Q2). Après le Lot 0, l'ancien front (AI Studio)
   **ne permet plus de se connecter** : prévoir de rediriger tout le monde vers
   l'URL Hosting, et **geler les déploiements AI Studio** (accord avec l'autre
   développeur). **Revue de sécurité** : le service Cloud Run d'AI Studio expose
   aussi `/api/gemini/analyze` **sans authentification** avec la clé Gemini
   (S7) ; après la fenêtre, l'arrêter (ou en retirer l'accès public) et faire
   tourner la clé Gemini qu'il utilise, sans attendre le nettoyage J+30.
7. **Plan Blaze** actif (obligatoire pour les Cloud Functions).
8. **Annoncer la maintenance** : tout le monde ferme l'application (y compris
   les onglets oubliés sur les PC de l'école) pendant la fenêtre.

## 1. Sauvegarde (obligatoire, juste avant)

1. **PITR** (restauration à un instant donné, 7 jours) :
   ```bash
   gcloud firestore databases update --database=$DB --enable-pitr --project=$PROJECT
   ```
2. **Export géré** de toute la base :
   ```bash
   gsutil ls $BUCKET || gsutil mb -p $PROJECT -l <region-de-la-base> $BUCKET
   gcloud firestore export $BUCKET/lot0-$STAMP --database=$DB --project=$PROJECT
   ```
   Attendre la fin (`gcloud firestore operations list --database=$DB --project=$PROJECT`).
3. **Export Auth** (contient les hachages : **à traiter comme un secret**, à
   stocker hors du dépôt, chiffré) :
   ```bash
   npx firebase auth:export auth-avant-lot0-$STAMP.json --format=json --project prod
   ```
4. Noter la version Hosting en ligne : Console › Hosting › historique des versions.

## 2. Simulation du script (lecture seule)

```bash
npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB
```

Le script ne fait **que lire** (Firestore + Auth). Il écrit ses rapports dans
`scripts/admin/out/lot0-simulation-<date>/` (ignoré par git, **données
personnelles : ne pas diffuser**) :

| Fichier | À vérifier |
|---|---|
| `resume.json` | `critical` doit valoir `false`. Nombre de comptes, de comptes Auth existants / à créer ; `passwordsRotated` = nombre de mots de passe qui seront remplacés (tous, par défaut) |
| `anomalies.csv` | `U1_NOT_DIRECTOR`, `U1_INACTIVE`, `U1_MISSING` (**critiques** : corriger le document `appUsers/u1` dans la console avant de continuer), doublons, identifiants invalides, comptes sans mot de passe. **Revue de sécurité** : `UNTRUSTED_AUTH_UID` (**critique** : un `authUid` figure dans `appUsers` sans lien `authLinks` ; l'ancienne application n'écrivait jamais ce champ → falsification probable : noter l'uid, l'examiner dans Console › Authentication, puis supprimer le champ du document ou relancer avec `--accept-critical`, le script l'ignore), `PRIVILEGED_ACCOUNT` (chaque compte مدير / إداري autre que u1 : **le faire confirmer par l'école**, sinon le désactiver avant l'application — `appUsers` était modifiable par tous), `UNEXPECTED_LINK_FIELDS` (liens présents avant tout provisionnement : ignorés) |
| `identifiants-renommes.csv` | Personnes dont l'identifiant de connexion va changer (doublons, caractères arabes) : **les prévenir** |
| `liens-a-valider.csv` | Rattachements parent/enfant douteux. Par défaut le script **n'accorde pas** l'accès en cas de doute (statut « NON LIÉ ») : l'école décidera ensuite, depuis Paramètres › المستخدمين |
| `comptes.csv` | Vue d'ensemble compte par compte |

Ne passer à la suite que si le résumé est compris et qu'aucune anomalie
critique ne reste.

**Mots de passe (revue de sécurité, R-01 / R-08)** : avant le Lot 0, les mots
de passe de `appUsers` étaient lisibles **et modifiables** par n'importe qui
(S1, S2) et celui du directeur figurait dans le code public (S4). Par défaut,
l'application **remplace donc tous les mots de passe** par des mots de passe
temporaires aléatoires (`--rotate-passwords=all`), à remettre à chacun avec
son identifiant ; le changement reste imposé à la première connexion.
`--rotate-passwords=weak` (seulement les mots de passe faibles et les comptes du
bureau) est possible mais laisse ouverts les comptes dont le mot de passe a pu
être relevé ou planté : décision à prendre et à consigner par le responsable.

## 3. Déploiement des Cloud Functions (sans impact utilisateur)

Les fonctions ne sont utilisées que par le nouveau front ; on peut les
déployer avant la fenêtre.

```bash
npx firebase deploy --only functions --project prod
```

- Accepter l'activation des API demandées (Cloud Functions, Cloud Build,
  Artifact Registry, Eventarc, Cloud Run).
- Fonctions attendues (région `europe-west1` pour les callables) :
  `createUserAccount`, `resetUserPassword`, `api`,
  `syncAccountsOnTeacherArchive`, `syncAccountsOnStudentArchive`
  (région des triggers selon l'étape 0.5).
- Si le déploiement des triggers échoue pour une question de région, corriger
  `FIRESTORE_TRIGGER_REGION` et relancer.

## 4. Fenêtre de maintenance : script → règles → Hosting (enchaîner sans pause)

1. **Application du script** :
   ```bash
   npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB --apply --confirm-prod=$PROJECT
   ```
   Contrôler `resume.json` : `failures` = 0 (sinon le script sort avec le code 2 :
   lire `anomalies.csv` › `ACCOUNT_FAILED`, corriger, **relancer la même
   commande** — seuls les comptes restants sont traités), `linksWritten` =
   nombre de comptes, `authCreated + authExisting` = nombre de comptes, aucune
   ligne « IMPOSSIBLE » ni « ÉCHEC » dans `comptes.csv`.
   Le fichier **SECRET** `mots-de-passe-temporaires.csv` (droits 600) contient
   les nouveaux mots de passe : le déplacer immédiatement hors du dépôt (support
   chiffré), ne jamais l'envoyer par messagerie de groupe.
2. **Règles Firestore** (immédiatement après : les anciens clients pourraient
   sinon réécrire des mots de passe) :
   ```bash
   npx firebase deploy --only firestore:rules --project prod
   ```
   Le fichier `firebase.json` cible la base nommée `$DB`. Vérifier dans la
   console que les règles de **cette** base portent l'en-tête « Lot 0 ».
3. **Hosting** :
   ```bash
   npm run build                     # lit .env.production (config web publique de la prod)
   npx firebase deploy --only hosting --project prod
   ```
4. **Relance du script en simulation** pour vérifier qu'aucun ancien onglet n'a
   réécrit de mot de passe entre les étapes 1 et 2 :
   ```bash
   npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB
   ```
   S'il signale `PASSWORD_REAPPEARED`, relancer avec `--apply --confirm-prod=$PROJECT`
   (le champ est supprimé, Firebase Auth n'est pas modifié).

## 5. Vérifications

1. **Lecture publique fermée** (doit renvoyer `PERMISSION_DENIED`) :
   ```bash
   API_KEY=$(grep VITE_FIREBASE_API_KEY .env.production | cut -d'"' -f2)
   curl -s "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DB/documents/appUsers?key=$API_KEY" | head -5
   curl -s "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DB/documents/settings/system?key=$API_KEY" | head -5
   ```
2. **Compte créé par un inconnu** : il ne doit rien lire.
   ```bash
   TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"email":"test-lot0-'$STAMP'@example.invalid","password":"Test-lot0-123","returnSecureToken":true}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["idToken"])')
   curl -s -H "Authorization: Bearer $TOKEN" "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DB/documents/students" | head -5
   ```
   Résultat attendu : `PERMISSION_DENIED`. **Supprimer ensuite ce compte de
   test** (Console › Authentication).
3. **Connexion par rôle** depuis l'URL Hosting (navigation privée) :
   - directeur (`admin_alfajr`) : changement de mot de passe imposé, puis tous
     les écrans, finances comprises ;
   - un إداري : finances visibles, Paramètres › المستخدمين en lecture seule ;
   - un enseignant : ses halaqas, pas de finances ;
   - un parent : seulement ses enfants ; un élève : seulement son dossier.
4. **Console Firestore** : aucun document `appUsers` ne contient `password` ;
   la collection `authLinks` contient un document par compte.
5. **Gestion des comptes** (directeur) : créer un compte de test, se connecter
   avec, le réinitialiser, puis le supprimer.
6. **Archivage** : archiver puis désarchiver une fiche de test ; le compte lié
   doit être suspendu puis réactivé (quelques secondes).

## 6. Après le déploiement

1. **Mot de passe du directeur** : changé à la première connexion (imposé).
   L'ancien mot de passe figurait dans le code public : ne jamais le réutiliser.
2. **Désactiver l'inscription libre** (recommandé) : Console › Authentication ›
   Paramètres › Actions des utilisateurs › décocher « Activer la création
   (inscription) » (disponible avec Identity Platform). Les comptes sont créés
   par l'Admin SDK, qui n'est pas concerné. Activer aussi la protection contre
   l'énumération des emails.
3. **Restreindre la clé API web** (référents HTTP : domaine Hosting) et prévoir
   App Check (lot ultérieur).
4. **La connexion se fait désormais uniquement par nom d'utilisateur** (plus
   par nom complet ni téléphone, décision D2). Communiquer à chacun, **en
   personne ou individuellement**, son identifiant et son mot de passe
   temporaire (`mots-de-passe-temporaires.csv`), en priorité au bureau et aux
   parents qui se connectaient avec leur téléphone. Supprimer ce fichier une
   fois les remises faites (les mots de passe non remis se réinitialisent
   depuis Paramètres › المستخدمين).
5. **Communiquer** les identifiants renommés et faire valider
   `liens-a-valider.csv` par l'école ; corriger les liens dans Paramètres ›
   المستخدمين (« الأبناء المرتبطون بهذا الحساب »).
6. Supprimer de votre poste les rapports `scripts/admin/out/` une fois traités,
   et conserver l'export Auth hors ligne.
7. **Limite connue** : en Lot 0, les parents ne voient plus l'onglet des
   paiements (finances réservées au bureau) ; le rapport IA n'existe pas sur le
   domaine Hosting (fonctionnalité retirée, D76).

## 7. Retour arrière (seulement en cas d'incident bloquant)

Le retour arrière **rouvre les failles** S1/S2 : à n'utiliser que le temps de
corriger.

1. **Hosting** : Console › Hosting › historique › « Restaurer » la version notée
   à l'étape 1.4.
2. **Règles** : redéployer les anciennes règles sauvegardées (étape 0.4) :
   ```bash
   cp regles-avant-lot0-$STAMP.rules firestore.rules
   npx firebase deploy --only firestore:rules --project prod
   git checkout firestore.rules
   ```
3. **Mots de passe de `appUsers`** (l'ancien front en a besoin pour se
   connecter) : réimporter la seule collection `appUsers` depuis l'export :
   ```bash
   gcloud firestore import $BUCKET/lot0-$STAMP --collection-ids=appUsers --database=$DB --project=$PROJECT
   ```
   (Les documents `authLinks` restent ; ils sont sans effet avec les anciennes
   règles.)
   **Mots de passe Firebase Auth** : le script les a remplacés ; l'ancien front
   ne pourrait plus ouvrir de session Firebase (il ne lirait plus rien). Supprimer
   les comptes Auth **créés** par le script (colonne `auth` = « créé » de
   `comptes.csv` ; l'ancien client les recréera) puis réimporter l'export Auth
   (paramètres de hachage : Console › Authentication › ⋮ › Paramètres de hachage) :
   ```bash
   npx firebase auth:import auth-avant-lot0-$STAMP.json --hash-algo=SCRYPT --hash-key=<clé> \
     --salt-separator=<séparateur> --rounds=<rounds> --mem-cost=<mem-cost> --project prod
   ```
4. **Functions** (facultatif) :
   ```bash
   npx firebase functions:delete createUserAccount resetUserPassword api --region europe-west1 --project prod
   npx firebase functions:delete syncAccountsOnTeacherArchive syncAccountsOnStudentArchive --region <région-des-triggers> --project prod
   ```
5. En dernier recours, restauration PITR de la base à l'heure précédant la
   fenêtre (Console › Firestore › Récupération à un moment précis).
