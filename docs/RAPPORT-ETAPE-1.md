# Rapport d'étape n°1 — socle, Lot 0 et multi-écoles

> Date : 21/10/2026. Travail réalisé en autonomie par un agent, **sans aucune
> action sur la production** (aucun déploiement, aucune connexion au projet
> `gen-lang-client-0481880143`, aucun script lancé hors émulateurs). Tout a été
> exécuté et testé sur les émulateurs Firebase avec le projet `demo-quran-school`
> et des **données fictives**.
>
> Références : `docs/analyse/RAPPORT-ANALYSE.md` (analyse), `docs/PLAN.md`
> (avancement), `docs/DECISIONS.md` (D1–D33), `docs/runbooks/` (procédures).

## 1. Branches livrées (empilées)

```
docs/analyse-et-plan ← chore/socle-dev ← fix/lot0-securite ← feat/multi-tenant
```

Aucune n'est fusionnée dans `main` et aucune pull request n'a été ouverte.

### 1.1 `chore/socle-dev` — socle de développement (6 commits)
- `.firebaserc` : projet par défaut `demo-quran-school`, alias `prod` explicite.
- Config Firebase lue depuis `VITE_*` (`src/config/env.ts`) ; `.env.development`
  (émulateurs), `.env.production` (config web publique, identique aux valeurs
  codées en dur auparavant : le build de prod est inchangé), `.env.example` documenté.
- `firebase.json` : émulateurs auth / firestore / functions / hosting / UI, règles
  rattachées à la base nommée, `hosting.ignore` excluant `server.cjs*`, rewrite
  `/api/**` vers la fonction `api`.
- npm seul (`bun.lock` supprimé, lockfile resynchronisé — il ne contenait pas
  `firebase`), scripts `dev`, `emulators`, `test`, `test:rules`, `lint`, `build`.
- Squelette `functions/` (TypeScript, 2nd gen, Node 22, `europe-west1`).
- `CLAUDE.md`, `docs/DECISIONS.md`, CI GitHub Actions (sans déploiement).

### 1.2 `fix/lot0-securite` — correctif déployable seul (10 commits)
Sur la structure actuelle (collections à la racine) :
- **Connexion** : `signInWithEmailAndPassword` (`{username}@alfajr.local`, règle
  `_secure_fajr` conservée) avant toute lecture ; plus de comparaison de mot de
  passe côté client, plus de création de compte à la connexion, `signOut` réel,
  session restaurée par Firebase Auth, rien de sensible dans localStorage (purge
  des anciennes clés et du cache au changement de compte).
- **Mots de passe** : plus jamais écrits dans Firestore (champ hérité supprimé
  explicitement, refusé par les règles) ; changement imposé à la première
  connexion (`mustChangePassword`) ; changement de son mot de passe par
  `updatePassword`.
- **`syncAppUsers` supprimé** : plus d'écriture en boucle ; l'alignement des rôles
  devient une action explicite du directeur.
- **Règles** : lien `authLinks/{uid}` obligatoire (un compte créé par un inconnu
  n'a accès à rien), finances au bureau, `settings` et `appUsers` non publics,
  écriture des comptes réservée au directeur, aucune auto-promotion, familles
  limitées à leurs élèves liés.
- **Interface** : plus de repli sur « le premier élève » ni « l'enseignant t1 »,
  plus de correspondances approximatives (`includes`) : liens explicites.
- **Cloud Functions** : `createUserAccount`, `resetUserPassword` (directeur),
  triggers « archivage = compte suspendu ».
- **Script** `scripts/admin/lot0-provision-auth.ts` (simulation par défaut,
  `--project` obligatoire, garde-fous émulateur / prod, rapports CSV).
- **Runbook** `docs/runbooks/LOT0-DEPLOIEMENT.md`.

### 1.3 `feat/multi-tenant` — multi-écoles (9 commits)
- Schéma `schools/{schoolId}/…` (14 collections + `settings/system`, `schoolId`
  dénormalisé), `users/{uid}`, `schools/{id}/members/{uid}`, registre
  `usernames`, super-admin par claim `superAdmin`.
- Client : `SchoolContext`, page de choix d'école (création réservée au
  super-admin), sélecteur dans la barre du haut, cache préfixé par école,
  changement d'école = désabonnement + purge + réabonnement, plus de données de
  démonstration, migrations client idempotentes et propres à l'école.
- Paramètres métier par école (cotisation, tarifs par mois, ouverture, saison,
  devise) et identité de l'école lues dans `settings/system`.
- Cloud Functions : `createSchool`, `createSchoolUser`, `resetUserPassword`,
  `setMemberRole`, `api` (proxy Gemini authentifié, `defineSecret`), triggers
  de suspension par école. Route Gemini ouverte de `server.ts` retirée.
- Règles §4.3 adaptées aux 9 rôles, racine fermée.
- Script `scripts/migration/migrate-to-tenants.ts` (idempotent, non destructif,
  audit, liens à valider, comptages).
- Test Playwright de fumée ; runbook `docs/runbooks/MIGRATION-BASCULE.md`.

## 2. Tests et résultats

Tous les résultats ci-dessous ont été **réellement obtenus** (commandes
`npm run lint`, `npm run lint:functions`, `npm run build`, `npm test`,
`npm run test:rules`, `npm run test:e2e`).

| Branche | Lint (app, functions) | Build prod | Unitaires | Émulateurs | Playwright | CI GitHub |
|---|---|---|---|---|---|---|
| `chore/socle-dev` | OK | OK | 4/4 | 1/1 | — | **succès** |
| `fix/lot0-securite` | OK | OK | 18/18 | 200 réussis + 4 ignorés localement ; paquet functions 4/4 | — | **succès** (les 4 tests de triggers y ont tourné) |
| `feat/multi-tenant` | OK | OK | 23/23 | 190 réussis + 2 ignorés localement ; paquet functions 12/12 | **7/7** | **succès** : 192/192 sur émulateurs (triggers compris), 12/12 functions, Playwright 7/7 |

### 2.1 Contenu des tests
- **Règles Lot 0** (177 cas) : visiteur, compte Auth d'un inconnu, lien inactif,
  matrice 9 rôles × 17 collections × (liste, écriture, suppression), portée des
  familles (lecture document par document et requêtes `in` sur `studentId`),
  auto-promotion, interdiction d'écrire un mot de passe. Contrôle : contre les
  anciennes règles, 130 de ces tests échouent.
- **Règles multi-écoles** (160 cas) : matrice 9 rôles × 15 collections × 3
  actions, **isolation entre deux écoles aux mêmes identifiants**, personne
  membre de deux écoles avec des rôles différents, profils `users`, registre,
  super-admin sans accès implicite aux données, racine fermée, auto-promotion.
- **Script Lot 0** : plan pur (téléphones normalisés, parents homonymes,
  téléphone partagé, nom seul, comptes manuels, doublons, identifiants arabes,
  u1 écrasé), simulation sans écriture, application, relance idempotente,
  mot de passe réécrit par un ancien onglet, connexion réelle des comptes.
- **Migration** : simulation, application (comptages, `schoolId`, paramètres,
  users / members / usernames, claim), relance qui n'écrase pas une saisie
  postérieure, règles appliquées aux comptes migrés, migration après un Lot 0.
- **Functions** : logique par appel direct (création d'école, de compte,
  rattachement, réinitialisation refusée sur un compte partagé, rôle,
  retrait, triggers par école, fonction `api` : 401 / 403 / réponse / repli) et
  de bout en bout via l'émulateur Functions (callables et `api`).
- **Playwright** : identifiant inconnu refusé ; directeur (changement de mot de
  passe imposé, finances) ; enseignant (pas de finances) ; parent (ses enfants
  seulement) ; agent d'entretien (aucun dossier) ; compte présent dans deux
  écoles (changement d'école sans fuite, cache de l'école quittée purgé) ;
  directeur de la seconde école ; purge du cache à chaque déconnexion.

### 2.2 Ce qui n'a pas pu tourner dans le conteneur de l'agent
- **Triggers Firestore sur l'émulateur Functions** : le proxy sortant du
  conteneur intercepte les appels internes de `firebase-tools` vers `127.0.0.1`
  (il ignore `NO_PROXY`), l'émulateur ne peut pas enregistrer les triggers et
  refuse de démarrer. Contournement local : `functions/.env.local` avec
  `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (non versionné). La logique des
  triggers est testée par appel direct ; les tests de bout en bout des triggers
  sont ignorés localement (4 en Lot 0, 2 en multi-écoles) mais **ont tourné et
  réussi en CI** pour le Lot 0.
- **Rewrite Hosting `/api/**` → fonction** : même cause (502 local) ; la fonction
  répond en direct. Non testé de bout en bout (ni localement ni en CI).
- Aucun test sur des données réelles (par principe) : la forme réelle des
  données n'est connue que par l'analyse du code.

### 2.3 CI GitHub Actions
Aucun déploiement dans la CI. Exécutions réussies :
- `chore/socle-dev` : lint, build, unitaires, émulateurs ;
- `fix/lot0-securite` : idem, dont les 8 tests de bout en bout des Cloud
  Functions (triggers compris) ;
- `feat/multi-tenant` : job `verifier` (unitaires 23/23, émulateurs 192/192 dont
  les triggers d'archivage, paquet functions 12/12) et job `e2e` (Playwright 7/7).

## 3. Limites connues
1. `App.tsx` reste un monolithe (~8 500 lignes) ; aucun changement de design.
2. Les enseignants lisent toute la collection `teachers` (salaires, CIN) car
   l'interface en a besoin ; à scinder (D14).
3. Personnel non pédagogique : tableau de bord à zéro (aucun accès aux élèves).
4. En Lot 0 seul, les parents ne voient plus leurs cotisations (rétabli en
   multi-écoles) et le rapport IA ne fonctionne pas sur Hosting (rétabli par `api`).
5. La connexion par nom complet ou téléphone n'existe plus : chacun doit
   connaître son identifiant (communication nécessaire).
6. Écran de connexion : nom générique « المدرسة القرآنية » avant connexion
   (les paramètres de l'école ne sont plus publics) ; `index.html` garde le titre
   d'Al Fajr.
7. Le cache local contient les données de l'école pendant la session (purgé à la
   déconnexion) ; les photos restent en base64 dans les documents.
8. Pas de limitation de débit sur `api` ; pas d'App Check ; clé API web non restreinte.
9. Notifications globales à l'école (filtrées dans l'interface, fermées aux familles).
10. Retour arrière après bascule : les saisies faites dans `schools/…` seraient
    perdues (à exporter d'abord).
11. Région des triggers à confirmer selon l'emplacement de la base (inconnu).
12. `npm audit` signale des vulnérabilités dans des dépendances (outils de dev
    surtout) : non traitées.
13. Conformité CNDP (loi 09-08) non traitée.

## 4. Ce qui reste à faire
- Relecture humaine (et relecture adverse recommandée) des règles et des scripts.
- Lot 0 en production, puis répétitions de la migration sur un projet de dev,
  puis bascule.
- Lot 2 (découpage d'`App.tsx`), design (lots 7–8), déploiement depuis GitHub
  Actions, App Check, restriction de la clé, arrêt de Cloud Run AI Studio,
  nettoyage J+30.

## 5. Actions humaines nécessaires (dans l'ordre)

### 5.1 Avant tout
1. **Relire et fusionner** les branches dans l'ordre (PR à ouvrir par vous) :
   `docs/analyse-et-plan` → `chore/socle-dev` → `fix/lot0-securite`
   (`feat/multi-tenant` plus tard, après le Lot 0 en prod).
2. **Geler les déploiements AI Studio** (accord avec l'autre développeur) et
   **identifier l'URL utilisée** (Hosting ou `*.run.app`).
3. **Copier les règles réellement déployées** (Console › Firestore › base
   `ai-studio-…` › Règles) et vérifier qu'elles sont celles du dépôt.
4. **Emplacement de la base** (région des triggers) :
   ```bash
   gcloud firestore databases describe --database=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec \
     --project=gen-lang-client-0481880143 --format="value(locationId)"
   ```
   puis ajuster `FIRESTORE_TRIGGER_REGION` dans `functions/.env.gen-lang-client-0481880143`.

### 5.2 Lot 0 (suivre `docs/runbooks/LOT0-DEPLOIEMENT.md`)
```bash
export PROJECT=gen-lang-client-0481880143 DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec STAMP=$(date +%Y%m%d-%H%M)
git checkout fix/lot0-securite && npm ci && npm ci --prefix functions
gcloud auth application-default login && npx firebase login
# Sauvegarde
gcloud firestore databases update --database=$DB --enable-pitr --project=$PROJECT
gcloud firestore export gs://<bucket>/lot0-$STAMP --database=$DB --project=$PROJECT
npx firebase auth:export auth-avant-lot0-$STAMP.json --format=json --project prod
# Simulation, puis lecture des rapports
npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB
# Functions (sans impact utilisateur)
npx firebase deploy --only functions --project prod
# Fenêtre de maintenance : script → règles → Hosting, sans pause
npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB --apply --confirm-prod=$PROJECT
npx firebase deploy --only firestore:rules --project prod
npm run build && npx firebase deploy --only hosting --project prod
npx tsx scripts/admin/lot0-provision-auth.ts --project=$PROJECT --database=$DB   # contrôle
```
Puis : vérifications du runbook (§5), changement du mot de passe du directeur,
désactivation de l'inscription libre (Console › Authentication › Paramètres),
communication des identifiants, validation de `liens-a-valider.csv` par l'école.

### 5.3 Bascule multi-écoles (suivre `docs/runbooks/MIGRATION-BASCULE.md`)
```bash
git checkout feat/multi-tenant && npm ci && npm ci --prefix functions
npx firebase functions:secrets:set GEMINI_API_KEY --project prod
# Répétition (au moins deux fois) sur un projet de dev : import de l'export, puis
npx tsx scripts/migration/migrate-to-tenants.ts --project=<dev> --database=$DB --school=alfajr --super-admin=<owner>
npx tsx scripts/migration/migrate-to-tenants.ts --project=<dev> --database=$DB --school=alfajr --super-admin=<owner> --apply --confirm-prod=<dev>
npx firebase deploy --only functions,firestore:rules,hosting --project dev --force
# Bascule (après sauvegarde fraîche)
npx firebase deploy --only functions --project prod --force
npx tsx scripts/migration/migrate-to-tenants.ts --project=$PROJECT --database=$DB --school=alfajr --super-admin=<owner>
npx tsx scripts/migration/migrate-to-tenants.ts --project=$PROJECT --database=$DB --school=alfajr --super-admin=<owner> --apply --confirm-prod=$PROJECT
npx firebase deploy --only firestore:rules --project prod
npm run build && npx firebase deploy --only hosting --project prod
npx tsx scripts/migration/migrate-to-tenants.ts --project=$PROJECT --database=$DB --school=alfajr   # contrôle d'écart : copied = 0
```
Puis vérifications (§5 du runbook), et nettoyage à J+30 (§7 : suppression des
collections racine et du service Cloud Run d'AI Studio).

## 6. Étape 2 : durcissement (22/10/2026, branche `feat/durcissement`)

> Travail fait en autonomie par un agent, **sans aucune action sur la
> production** ni sur GCP : rien n'a été déployé, aucun pool, compte,
> bucket ou clé n'a été créé. Tout ce qui touche GCP est **écrit** dans les
> runbooks pour un humain. Branche créée depuis `fix/revue-securite`.
> Décisions : D42 à D51. Suivi : `docs/progress/ETAPE-2-durcissement.md`.

### 6.1 Ce qui a été fait
| # | Point | Résultat |
|---|---|---|
| 1 | **R-06** (D42) | Salaire, contrat, CIN, adresse, contact d'urgence, naissance déplacés dans `schools/{s}/staffPrivate/{teacherId}` (bureau seulement) ; `teachers` refuse ces champs ; couche données (`subscribeToStaff`, `saveStaffToFirestore`) ; migration (fiche RH créée, fiches existantes scindées à la relance, ligne `staffPrivate` des comptages) ; données de démonstration ; tests règles / migration / Playwright |
| 2 | **Proxy IA** (D43) | Quotas transactionnels `aiQuota` (30/jour/utilisateur, 5/minute, 300/jour/école, 1000/jour global, paramétrables, 0 = coupure) ; 413 au-delà de 32 Kio ; journaux `ai.analyze` sans donnée personnelle ; `requestAiReport` côté client |
| 3 | **App Check** (D44) | Préparé, **désactivé** : `VITE_APPCHECK_SITE_KEY` (reCAPTCHA Enterprise, débogage sur émulateurs), `APPCHECK_ENFORCE` côté Functions (callables + `api`) |
| 4 | **Dépendances** (D45) | 22 → 5 vulnérabilités (toutes dans `firebase-tools`, outil de dev) ; production 0 ; functions 0 ; audit en CI |
| 5 | **Déploiement GitHub Actions** (D46) | `deploy.yml` / `preview.yml`, `workflow_dispatch` seulement, WIF sans clé, environnements `dev` / `production` ; **inactifs** tant que le runbook n'est pas déroulé |
| 6 | **Sauvegardes** (D47) | `scheduledFirestoreExport` (quotidienne, rétention 30 j, garde les 3 plus récents), **omise** tant que `BACKUP_ENABLED` ≠ true ; PITR et restauration dans le runbook |
| 7 | **Rewrite `/api/**`** (D48) | Testé de bout en bout (`npm run test:hosting`), localement et en CI ; le proxy du conteneur se contourne par processus (`scripts/dev/without-proxy.sh`), triggers compris |
| 8 | **Pages de prod** (D49) | `index.html` générique ; CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (caméra), `X-Frame-Options`, COOP, HSTS ; cache `/assets` immuable, pages `no-cache` ; **toute la suite Playwright tourne sous la CSP** |
| 9 | **Clé API web** (D50) | Runbook |
| 10 | **Photos** (D51) | Filet de sécurité (recompression des images base64 > 300 Ko avant écriture) ; Cloud Storage **non implémenté** (règles Storage sans accès à la base nommée → claims d'appartenance d'abord), plan détaillé |

### 6.2 Tests (réellement obtenus)
- Local (conteneur, 22/10/2026) : lint app et functions OK ; build de prod OK ;
  unitaires **49/49** ; émulateurs **235 réussis + 2 ignorés** (triggers, D21) et
  **237/237** en lançant les émulateurs sans variables de proxy (D48) ;
  Functions **33/33** ; Hosting (rewrite + en-têtes) **5/5** ; Playwright **11/11**
  sous la CSP de production.
- CI GitHub sur `070b104` : succès (unitaires 45/45 à ce commit, émulateurs
  237/237 triggers compris, Functions 33/33, Hosting 5/5, Playwright 11/11).
- Non testé (exige un vrai projet) : échange de jetons App Check, workflows de
  déploiement (validés par `actionlint` seulement), export Firestore réel,
  restrictions de clé.

### 6.3 Changements d'interface (à reporter sur `feat/design`)
1. `src/App.tsx`, abonnement au personnel : `sub<Teacher>("teachers", …)`
   remplacé par `subscribeToStaff(schoolId, canReadStaffPrivate(role), …)`
   (sur `feat/design` : `src/data/useSchoolSync.ts`).
2. `src/App.tsx`, `handleGenerateAIReport` : `fetch` remplacé par
   `requestAiReport(...)`, message d'erreur `AiReportError.userMessage`
   (sur `feat/design` : `src/app/actions/useAiActions.ts`).
3. `index.html` : titre et description génériques.
4. Imports ajoutés dans `App.tsx` (`subscribeToStaff`, `canReadStaffPrivate`,
   `requestAiReport`, `AiReportError`) ; `getIdToken` et `apiUrl` n'y sont plus importés.
Aucun changement de style ni de mise en page. À savoir pour le design :
les fenêtres d'impression héritent de la CSP (D49) ; les gabarits sans CDN ni
script en ligne permettront de retirer `'unsafe-inline'` ; le QR code par
`api.qrserver.com` envoie des noms à un tiers (O-05).

### 6.4 Actions humaines nouvelles (dans l'ordre, dev d'abord)
```bash
export REPO=quran-school-org/quran-school-app
export PROJECT=<id-du-projet-de-dev>        # puis gen-lang-client-0481880143
export DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec

# 0. Relire et fusionner feat/durcissement (après fix/revue-securite) ; la
#    bascule multi-écoles inclut désormais staffPrivate (rien de plus à faire :
#    la migration scinde les fiches ; vérifier la ligne staffPrivate de comptages.csv).

# 1. Proxy IA (docs/runbooks/PROXY-IA.md) : TTL des compteurs
gcloud firestore fields ttls update expiresAt --collection-group=aiQuota --enable-ttl --database=$DB --project=$PROJECT

# 2. Déploiement GitHub Actions (docs/runbooks/CI-DEPLOIEMENT.md, §1 à §5) :
#    API, pool WIF « github », fournisseur « quran-school-app » restreint au dépôt
#    et à l'environnement, compte github-deploy et ses rôles, environnements
#    GitHub dev / production (relecteur, branche main), variables :
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions" --project=$PROJECT
#    … (commandes complètes dans le runbook)
npx firebase functions:artifacts:setpolicy --project $PROJECT --location europe-west1 --days 30

# 3. Sauvegardes (docs/runbooks/SAUVEGARDES.md)
gcloud firestore databases update --database=$DB --enable-pitr --project=$PROJECT
gcloud storage buckets create gs://$PROJECT-firestore-sauvegardes --project=$PROJECT --location=EU \
  --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=7d
#    règle de cycle de vie, compte firestore-backup et droits (§2, §3), puis dans
#    functions/.env.$PROJECT : BACKUP_ENABLED=true, BACKUP_BUCKET=$PROJECT-firestore-sauvegardes
npx firebase deploy --only functions:scheduledFirestoreExport --project $PROJECT
gcloud scheduler jobs run firebase-schedule-scheduledFirestoreExport-europe-west1 --location=europe-west1 --project=$PROJECT
#    test de restauration dans une base neuve du projet de dev (§5)

# 4. App Check (docs/runbooks/APP-CHECK.md) : clé reCAPTCHA Enterprise,
#    enregistrement console, VITE_APPCHECK_SITE_KEY dans .env.production,
#    observation 7 à 14 jours, PUIS APPCHECK_ENFORCE=true et « Appliquer » dans la console.
gcloud recaptcha keys create --display-name="kuttab-web-appcheck" --web --domains=$PROJECT.web.app --integration-type=SCORE --project=$PROJECT

# 5. Clé API web et clé Gemini (docs/runbooks/CLE-API-WEB.md)
gcloud services api-keys update <KEY_ID> --project=$PROJECT \
  --allowed-referrers="https://$PROJECT.web.app/*,https://$PROJECT.firebaseapp.com/*" \
  --api-target=service=identitytoolkit.googleapis.com --api-target=service=securetoken.googleapis.com \
  --api-target=service=firestore.googleapis.com --api-target=service=firebaseappcheck.googleapis.com
gcloud services api-keys update <GEMINI_KEY_ID> --project=$PROJECT --api-target=service=generativelanguage.googleapis.com

# 6. En-têtes de sécurité : déployés avec le Hosting (firebase.json) ; après
#    déploiement, vérifier : curl -sI https://$PROJECT.web.app/ | grep -iE "content-security|permissions|referrer|nosniff"
#    puis tester une impression (reçu, liste des élèves) et le scan QR (caméra).
```

### 6.5 Points ouverts
- R-07 (familles qui créent des notifications) et O-05 (QR code chez un tiers)
  restent à traiter (interface).
- `express`, `vite`, `dotenv` à déplacer en `devDependencies` (D45).
- `CLAUDE.md` ne mentionne pas encore `staffPrivate` ni `test:hosting` :
  à mettre à jour par le propriétaire.
- Photos dans Cloud Storage : plan D51 (claims d'appartenance d'abord).
