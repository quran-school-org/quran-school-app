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
