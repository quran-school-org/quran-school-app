# Passation — application de gestion de l'école coranique « جمعية الفجر الجديد »

Document d'arrivée pour un nouveau collaborateur. Il ne contient **aucun secret**
(mot de passe, jeton, clé) : les accès se demandent au propriétaire (§9).
Mis à jour le 24/10/2026.

---

## 1. L'application en deux minutes

Application web de gestion d'une école coranique (kuttab), **en arabe (RTL)** :
élèves, halaqas, présences, examens et attestations, suivi du hifz, frais et
paiements, comptabilité, personnel et salaires, activités, cartes d'identité,
notifications, comptes et droits par rôle (9 rôles).

- **Stack** : React 19, Vite 6, Tailwind 4, TypeScript ; Firebase : Firestore
  (base **nommée** `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec`, édition
  Enterprise), Auth (identifiant + mot de passe), Cloud Functions 2nd gen
  (Node 22, `europe-west1`, triggers en `europe-west2`), Hosting.
- **Origine** : générée par Google AI Studio, puis reprise et sécurisée
  (rapport d'analyse : `docs/analyse/RAPPORT-ANALYSE.md`, failles S1 à S9).
- **Objectif du chantier** : passer d'une école unique à **plusieurs écoles**
  cloisonnées (multi-tenant), une deuxième école arrivant bientôt.

> **Données réelles en production** : élèves mineurs, paiements, salaires.
> Toute la règle du projet découle de ce point (§4).

## 2. Les environnements

| | Production | Dev (recette) | Local |
|---|---|---|---|
| Projet Firebase | `gen-lang-client-0481880143` | `fajr-c4c6e` | `demo-quran-school` (émulateurs) |
| Site | https://gen-lang-client-0481880143.web.app | https://fajr-c4c6e.web.app | http://localhost:3000 |
| Code déployé | branche `release/lot0` (Lot 0) | branche `main` (multi-écoles) | votre branche |
| Données | **réelles** | copie des données réelles (école `alfajr`, répétitions de migration) + école de test `test1234` (fictive) | fictives (`npm run seed:emulator`) |
| Traduction FR de test | non | oui (bouton « TEST · AR / FR ») | oui |

- Région de la base : `europe-west2` (Londres). Sauvegardes : buckets
  `gs://<projet>-sauvegardes` (exports, 30 jours), PITR 7 jours en prod.
- Le dev contient des **données réelles** tant que les répétitions ne sont pas
  finies : mêmes précautions que la prod (ne pas partager les identifiants,
  ne rien exporter). Elles seront supprimées après la bascule.

## 3. Où en est le projet

**Fait**
- **Lot 0 en prod** (sécurité de la connexion) : comptes Firebase Auth pour les
  88 utilisateurs, plus aucun mot de passe dans Firestore, règles de sécurité,
  Cloud Functions de gestion des comptes, nouvel écran de connexion et logo
  temporaire.
- **Version multi-écoles** terminée et testée (`main`) : données sous
  `schools/{schoolId}/…`, super-admin de plateforme, création d'école, refonte
  de l'interface (charte « لوحة الكتّاب »), découpage de `App.tsx`, impressions
  sûres, sauvegardes, App Check (en observation), retrait de la fonction IA.
- **Chaîne de mise en prod** par GitHub Actions, sans clé (Workload Identity
  Federation), avec garde-fous (§6).
- **Répétition 1 de la migration** sur le dev : réussie, comptages identiques
  pour les 14 collections et les 88 comptes.

**Reste à faire** (ordre prévu)
1. Recette du propriétaire sur le dev ; validation par l'école des liens
   parent ↔ enfant douteux (`liens-a-valider.csv` du rapport de migration).
2. **Répétition 2** sur un export frais de la prod → rapport → « go » n°2 du
   propriétaire.
3. Date de **bascule** (« go » n°3), message aux utilisateurs
   (`docs/communication/`), puis bascule en prod (≈ 1 h,
   `docs/runbooks/OPERATIONS-CLAUDE.md` §5 et `MIGRATION-BASCULE.md`).
4. Après la bascule : création de la 2ᵉ école (`docs/runbooks/NOUVELLE-ECOLE.md`),
   suppression de la copie des données du dev. (La traduction FR n'est plus
   à retirer : elle est devenue une option de langue, D93.)
5. Correctif de sécurité `body-parser` à déployer sur les Functions de la prod
   (PR vers `release/lot0`).
6. Recommandé : sauvegarde quotidienne (`BACKUP_ENABLED`), App Check en mode
   strict, stockage des photos hors Firestore, durcissement de la CSP, revue
   juridique de `docs/conformite/CNDP.md` (loi 09-08).

Le suivi détaillé est dans `docs/PLAN.md` ; chaque choix structurant est
expliqué dans `docs/DECISIONS.md` (D1 à D8x : contexte, décision, retour arrière).

**« Bascule »** : aujourd'hui la prod tourne encore avec le code du Lot 0 (une
seule école, données à la racine de la base). La bascule consiste à déployer le
code de `main` en prod **et** à migrer les données réelles dans
`schools/alfajr/…` (script `migrate-to-tenants`), dans une fenêtre de
maintenance. C'est ce qui est répété deux fois sur le dev.

## 4. Les règles à ne jamais enfreindre

Elles sont détaillées dans `CLAUDE.md` (« INTERDITS ABSOLUS ») :

- **Aucune commande depuis votre poste vers la prod** : pas de `firebase deploy`,
  `gcloud`, script Admin SDK ou appel d'API visant `gen-lang-client-0481880143`.
  La prod ne se modifie **que** par les workflows GitHub (§6), après accord du
  propriétaire.
- Développer et tester **sur les émulateurs** (`demo-quran-school`, le préfixe
  `demo-` garantit qu'aucun service réel n'est appelé).
- **Aucun secret commité** : mots de passe, comptes de service, exports, rapports
  de scripts, CSV de mots de passe.
- Ne jamais pousser sur `main` ni `release/lot0` : toujours une branche + PR.
- Ne jamais réintroduire : mot de passe comparé côté client, création de compte
  à la connexion, champ `password` dans Firestore, rattachement d'élève par
  ressemblance de nom, repli sur « le premier élève / enseignant ».
- Toute modification de `firestore.rules` s'accompagne de tests
  (`tests/emulator`). Comptes et appartenances ne s'écrivent que par les Cloud
  Functions.
- Les valeurs des rôles restent **en arabe** (`مدير`, `إداري`, `مؤطر`, `مدرس`,
  `متطوع`, `عامل نظافة / صيانة`, `أخرى`, `طالب`, `ولي أمر`) : ce sont des clés
  de données.

## 5. Démarrer en local

Prérequis : Node 22, Java 21 (émulateur Firestore), npm.

```bash
git clone https://github.com/quran-school-org/quran-school-app.git && cd quran-school-app
npm ci && npm ci --prefix functions
npm run emulators          # auth 9099, firestore 8080, functions 5001, hosting 5000, UI 4000
npm run seed:emulator      # autre terminal : 2 écoles fictives + comptes de démo
npm run dev                # http://localhost:3000, branché sur les émulateurs
```

Comptes de démo locaux : voir `scripts/dev/` (ex. `admin_alfajr`, mot de passe
de démo défini dans les fixtures ; fictif, émulateurs uniquement).

Vérifications à garder vertes sur chaque branche :

```bash
npm run lint && npm run lint:functions   # TypeScript
npm test                                 # tests unitaires (vitest)
npm run test:rules                       # règles + migration + Functions (émulateurs)
npm run test:e2e                         # Playwright (Chromium), sous la CSP de prod
npm run test:hosting                     # rewrite /api/** et en-têtes de sécurité
npm run build                            # build de PRODUCTION (lit .env.production)
```

Pièges :
- `npm run build` produit un bundle qui parle à la **prod** ; pour l'émulateur
  Hosting, utiliser `npm run build:dev`.
- Derrière un proxy d'entreprise : `scripts/dev/without-proxy.sh <commande>` et
  `functions/.env.local` (D21, D48).

## 6. Mise en prod : uniquement par GitHub Actions

Tous les workflows sont **manuels** (onglet Actions › Run workflow), lancés
depuis `main`, authentifiés sans clé (WIF limité à `main` et à ces workflows).

| Workflow | Rôle | Garde-fous principaux |
|---|---|---|
| `ci.yml` | lint, build, audit des dépendances, tests, Playwright (sur chaque PR) | doit être vert pour fusionner |
| `deploy.yml` | déploie le code de `main` (dev ; prod à la bascule) | prod : `confirm` = ID du projet |
| `deploy-lot0.yml` | déploie le code de `release/lot0` (prod actuelle) | prod : `confirm`, cible `all` refusée |
| `ops.yml` | opérations de données : exports, copie prod → dev, migration, comptages, démo, super-admin et école de test du dev | simulation par défaut, `apply=true` + `confirm`, actions de test refusées en prod, artefacts **chiffrés GPG** |
| `preview.yml` | canaux de prévisualisation Hosting du dev | dev seulement |

- Variables GitHub (non secrètes) préfixées `DEV_…` / `PROD_…` (forfait Free,
  D75). Mise en place complète : `docs/GUIDE-MISE-EN-PROD.md`,
  `docs/runbooks/CI-DEPLOIEMENT.md`.
- Les artefacts qui contiennent des mots de passe ou des données personnelles
  sont chiffrés pour la clé GPG du propriétaire : **seul lui** peut les lire.
- Procédures pas à pas (avec critères d'arrêt) : `docs/runbooks/OPERATIONS-CLAUDE.md`.

## 7. Plan du code

| Chemin | Contenu |
|---|---|
| `src/App.tsx` | routage par onglet ; la logique est dans `src/app/useAppController.ts` (hooks successifs, D52) |
| `src/screens/`, `src/components/` | écrans et fenêtres (données en props, callbacks `onSave…`) |
| `src/shell/`, `src/ui/` | cadre (menu, barre du haut) et composants de la charte |
| `src/school/` | école active, choix et création d'école, règles métier (cotisations, âge…) |
| `src/session/`, `src/data/` | connexion, profil, abonnements Firestore |
| `src/firebase.ts` | **seul** point d'accès à Firestore et aux callables |
| `src/db.ts`, `src/cache/` | CRUD « cache local d'abord », cloisonné par école |
| `src/types.ts` | modèles, 9 rôles, matrice de permissions |
| `src/security/` | modules purs (comptes ↔ Auth, groupes de rôles miroirs des règles) |
| `src/print/` | gabarits d'impression (HTML échappé, sans script) |
| `src/i18n-test/` | traduction FR (option de langue, D93 ; nom d'origine conservé, voir D79) |
| `firestore.rules` | règles multi-écoles (racine fermée) |
| `functions/` | `createSchool`, `createSchoolUser`, `resetUserPassword`, `setMemberRole`, `api` (`/api/health`), triggers d'archivage, export planifié |
| `scripts/admin`, `scripts/migration`, `scripts/ops`, `scripts/dev` | scripts Admin SDK (simulation par défaut, `--project` obligatoire) et données fictives |
| `tests/unit`, `tests/emulator`, `tests/hosting`, `tests/e2e`, `functions/test` | tests |

Modèle de données : `schools/{schoolId}/…` (14 collections + `settings/system`,
champ `schoolId` dans chaque document), `users/{uid}`, `schools/{id}/members/{uid}`
(rôle, droits, liens), `usernames/{username}`, `staffPrivate` (données RH du
bureau seulement). Super-admin = claim Firebase `superAdmin`.

## 8. Façon de travailler

- Une branche par sujet, **commits atomiques en français**, PR vers `main`
  (ou `release/lot0` pour un correctif de la prod actuelle), CI verte avant fusion.
- Toute décision structurante → une entrée dans `docs/DECISIONS.md`
  (contexte, décision, retour arrière).
- Aucune valeur de configuration en dur : `src/config/env.ts` et les fichiers
  `.env.*` (la config web de la prod dans `.env.production` est publique).
- Le design (couleurs, mise en page) ne change pas sans accord du propriétaire.
- Le projet a été mené en grande partie avec Claude Code : `CLAUDE.md` décrit
  les règles suivies par les agents ; elles valent aussi pour les humains.

## 9. Accès à demander au propriétaire

| Accès | Pour quoi | Niveau conseillé |
|---|---|---|
| Dépôt GitHub `quran-school-org/quran-school-app` | code, PR, lancer les workflows du dev | rôle **Write** (pas Admin) |
| Projet Firebase **dev** `fajr-c4c6e` | consulter la console, les journaux | **Viewer** au départ |
| Projet Firebase **prod** | — | **aucun** au départ : la prod passe par les workflows |
| Compte de test sur le dev | tester l'interface | compte de l'école `test1234` créé par le directeur ou le super-admin |

Ne jamais demander ni transmettre de mot de passe par un canal partagé
(groupe, ticket, chat) ; les identifiants se remettent individuellement
(`docs/communication/identifiants.md`).

## 10. Index de la documentation

- `CLAUDE.md` : règles, commandes, architecture (référence courte).
- `docs/analyse/RAPPORT-ANALYSE.md` : analyse initiale, failles, plan multi-écoles.
- `docs/PLAN.md` : lots et avancement. `docs/DECISIONS.md` : décisions D1 à D8x.
- `docs/GUIDE-MISE-EN-PROD.md` : mise en place de GitHub ↔ Google Cloud et les 3 « go ».
- `docs/runbooks/` : `OPERATIONS-CLAUDE.md` (déroulé complet), `LOT0-DEPLOIEMENT.md`,
  `MIGRATION-BASCULE.md`, `NOUVELLE-ECOLE.md`, `SAUVEGARDES.md`, `CI-DEPLOIEMENT.md`,
  `APP-CHECK.md`, `CLE-API-WEB.md`.
- `docs/communication/` : messages aux utilisateurs (arabe et français), guide du directeur.
- `docs/conformite/CNDP.md` : données personnelles (loi 09-08), à valider par un juriste.
- `docs/revues/` : revues de sécurité. `docs/design/captures/` : captures avant / après.
