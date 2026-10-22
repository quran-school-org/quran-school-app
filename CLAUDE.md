# CLAUDE.md — guide de travail sur `quran-school-app`

Application de gestion d'une école coranique (« جمعية الفجر الجديد »), interface en
arabe (RTL). React 19 + Vite 6 + Tailwind 4 + Firebase (Firestore **base nommée** +
Auth email/mot de passe). Générée à l'origine par Google AI Studio.

Documents de référence (à lire avant tout changement important) :
- `docs/analyse/RAPPORT-ANALYSE.md` : cartographie, modèle de données, failles S1-S9, plan multi-tenant (§4).
- `docs/PLAN.md` : lots et avancement.
- `docs/DECISIONS.md` : décisions prises, raisons, comment revenir en arrière.
- `docs/runbooks/` : procédures de déploiement à exécuter par un humain.

## INTERDITS ABSOLUS (sécurité de la prod)

Les données de prod sont **réelles** (élèves mineurs, paiements, salaires).

- **Ne JAMAIS** exécuter de commande qui cible le projet de prod
  `gen-lang-client-0481880143` ou sa base `ai-studio-a6572431-c7db-4071-82bf-a922d18511ec` :
  pas de `firebase deploy`, pas de `firebase login`, pas de `gcloud` sur la prod,
  pas de script Admin SDK contre la prod, pas d'appel réseau vers les API
  Firebase/Firestore/Identity Toolkit de la prod.
- Tout se fait sur les **émulateurs** avec le projet `demo-quran-school`
  (le préfixe `demo-` garantit qu'aucun service réel n'est appelé).
- Ne jamais pousser sur `main`, ne pas ouvrir de PR sans demande, ne pas modifier
  les paramètres du dépôt, ne pas force-push sur une branche qu'on n'a pas créée.
- Ne commiter **aucun secret** : mot de passe, clé Gemini, compte de service,
  export de données (`*.json` d'export, `auth-users.json`, rapports de scripts).
- Ne pas toucher au design (couleurs, mise en page) au-delà du strict nécessaire.
- Les opérations sur la prod (déploiement, scripts de données) sont décrites dans
  `docs/runbooks/` et **exécutées par un humain**, jamais par un agent.

## Lancer le projet

Prérequis : Node 22, Java 21 (émulateur Firestore). Un seul gestionnaire : **npm**.

```bash
npm ci && npm ci --prefix functions   # installation
npm run emulators                      # auth 9099, firestore 8080, functions 5001, hosting 5000, UI 4000
npm run seed:emulator                  # données FICTIVES : école alfajr (migrée) + école annour, comptes de démo
npm run dev                            # app sur http://localhost:3000, branchée sur les émulateurs
npm run lint                           # tsc --noEmit (app, scripts, tests)
npm run lint:functions                 # tsc des Cloud Functions
npm test                               # tests unitaires (vitest, sans émulateur)
npm run test:rules                     # tests sur émulateurs (règles, migration, Functions) via emulators:exec
npm run test:e2e                       # Playwright (Chromium) contre les émulateurs, sous la CSP de prod (E2E_CSP=1)
npm run test:hosting                   # émulateur Hosting (build:dev) : rewrite /api/** et en-têtes de sécurité
CAPTURE_DIR=/chemin/absolu npm run capture:screens   # captures par rôle et par écran (1440 / 390 px), PNG
npm run build                          # build de PRODUCTION (lit .env.production)
npm run build:dev                      # build branché sur les émulateurs (pour l'émulateur Hosting)
```

- `.env.development` (commité) : projet `demo-quran-school`, `VITE_USE_EMULATORS=true`.
- `.env.production` (commité) : config web **publique** de la prod (aucun secret).
- `.env.local` (non commité) : surcharges locales. La clé Gemini n'est utilisée que
  par la fonction `api` (Secret Manager en prod, `functions/.secret.local` en local).
- **Attention** : l'émulateur Hosting sert `dist/`. Après `npm run build`, ce bundle
  parle à la **prod**. Pour l'émulateur, utiliser `npm run build:dev`.
- `firebase` sans `--project` utilise `demo-quran-school` (`.firebaserc`). L'alias
  `prod` n'est à utiliser que par un humain, en suivant un runbook.
- Conteneur avec proxy sortant : `scripts/dev/without-proxy.sh <commande>` lance
  une commande sans variables de proxy (ex. `test:hosting`, triggers compris, D48).
- Démarrage d'émulateurs, serveur de dev ou Playwright partagés entre agents :
  sous `flock /home/user/.emulators.lock <commande>`.

## Architecture (multi-écoles)

- **Données** : tout est sous `schools/{schoolId}/…` (14 collections +
  `settings/system`), avec un champ `schoolId` dénormalisé dans chaque document.
  Comptes : `users/{uid}` (profil global, écoles), `schools/{id}/members/{uid}`
  (rôle, droits, liens `linkedTeacherId` / `linkedStudentIds`), registre
  `usernames/{username}`. Super-admin : claim `superAdmin`. Racine fermée.
  Personnel : `teachers` (fiche publique) + `staffPrivate/{teacherId}` (salaire,
  contrat, CIN, adresse, contact d'urgence, naissance : bureau seulement, D42).
- `src/App.tsx` (~170 lignes) : routage par `activeTab` ; la logique est dans un
  contrôleur de hooks successifs (`src/app/useAppController.ts`, lu par `useApp()`,
  D52) : états (`src/data/useSchoolDataState`, `src/session/useSessionState`,
  `src/app/state`), abonnements Firestore (`src/data/useSchoolSync` :
  `subscribeToStaff`), session (`src/session`), actions par domaine
  (`src/app/actions/*`, ex. `useAiActions` → `requestAiReport`).
- `src/screens/` (écrans et fenêtres `modals/`), `src/shell/` (cadre, menu
  `navModel`, bandeau de quota), `src/ui/` (composants de la charte : AppShell,
  Modal, Form, DataTable, Kpi, `QrCode` local sans service tiers, D61).
- `src/print/` : gabarits d'impression purs (HTML échappé, D37) ; seule
  `printWindow.ts` écrit dans une fenêtre ; aucun script ni CDN dans les
  documents (D62). Garde-fous : `tests/unit/printTemplates.test.ts`.
- `src/school/` : `SchoolContext` (école active), `SchoolPicker` (choix / création
  d'école), `SchoolSwitcher` (barre du haut), `businessRules` (cotisations,
  ouverture, âge : paramètres de l'école).
- `src/db.ts` : `RealmSimDB`, CRUD « localStorage d'abord » + écriture Firestore
  sous l'école active ; `setActiveSchool()` fixe l'école.
- `src/cache/localCache.ts` : cache local cloisonné `kuttab:{schoolId}:…`.
- `src/firebase.ts` : initialisation (App Check si configuré), connexion, et les
  fonctions d'accès qui prennent `schoolId` (`saveToFirestore`, `deleteFromFirestore`,
  `subscribeToCollection`, `subscribeToSettings`, `subscribeToStaff`,
  `saveStaffToFirestore`) ; appels des callables ; `requestAiReport` (proxy IA).
- `src/config/env.ts` : variables `VITE_*`, garde-fou émulateurs.
- `src/types.ts` : modèles, 9 rôles (valeurs en arabe), matrice de permissions.
- `src/security/` : modules purs (compte ↔ Auth, groupes de rôles miroirs des
  règles, alignement explicite des comptes).
- `src/components/` : écrans extraits (données en props, callbacks `onSave…`).
- `firestore.rules` : règles multi-écoles (base nommée, voir `firebase.json`).
- `functions/` : Cloud Functions 2nd gen (Node 22, `europe-west1`) : `createSchool`,
  `createSchoolUser`, `resetUserPassword`, `setMemberRole`, `api` (proxy Gemini
  authentifié, quotas `aiQuota`, D43), triggers de suspension à l'archivage,
  `scheduledFirestoreExport` (omise tant que `BACKUP_ENABLED` ≠ true, D47).
- `server.ts` : serveur de développement (Vite) ; plus de proxy Gemini.
- `scripts/admin/lot0-provision-auth.ts`, `scripts/migration/migrate-to-tenants.ts`
  (Admin SDK) : `--dry-run` par défaut, `--project` obligatoire ; ne les lancer que
  contre les émulateurs. `scripts/dev/` : données fictives et peuplement.
- `tests/unit`, `tests/emulator` (règles, migration, Functions), `tests/hosting`
  (rewrite, en-têtes), `tests/e2e` (Playwright, repères `data-*` D54),
  `functions/test` (logique des Functions).

## Conventions

- Commits atomiques, messages en **français**.
- Les valeurs de rôles restent en arabe (`مدير`, `إداري`, `مؤطر`, `مدرس`, `متطوع`,
  `عامل نظافة / صيانة`, `أخرى`, `طالب`, `ولي أمر`) : compatibilité des données.
- Toute modification de `firestore.rules` s'accompagne de tests dans `tests/emulator`.
- Tout accès Firestore passe par `src/firebase.ts` ; pas d'appel direct dispersé.
  Toute donnée métier est sous `schools/{schoolId}` et porte `schoolId`.
- Les comptes et appartenances ne s'écrivent que par les Cloud Functions.
- Aucune valeur de config (projet, base, clé) codée en dur dans le code : `src/config/env.ts`.
- Toute décision structurante est consignée dans `docs/DECISIONS.md`
  (contexte, décision, retour arrière).
- `npm run lint`, `npm run build` et les tests doivent rester verts sur chaque branche.
- Ne jamais réintroduire : comparaison de mot de passe côté client, création de
  compte à la connexion, écriture de `password`, correspondance approximative
  (`includes`) pour rattacher un élève, repli sur « le premier élève / enseignant ».
- Conteneur avec proxy sortant : créer `functions/.env.local` avec
  `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (voir `docs/DECISIONS.md`, D21).
