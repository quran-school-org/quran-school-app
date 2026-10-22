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
npm run seed:emulator                  # données FICTIVES + comptes (admin_alfajr / demo-directeur-2026…)
npm run dev                            # app sur http://localhost:3000, branchée sur les émulateurs
npm run lint                           # tsc --noEmit (app, scripts, tests)
npm run lint:functions                 # tsc des Cloud Functions
npm test                               # tests unitaires (vitest, sans émulateur)
npm run test:rules                     # tests sur émulateurs (règles, scripts) via emulators:exec
npm run build                          # build de PRODUCTION (lit .env.production)
npm run build:dev                      # build branché sur les émulateurs (pour l'émulateur Hosting)
```

- `.env.development` (commité) : projet `demo-quran-school`, `VITE_USE_EMULATORS=true`.
- `.env.production` (commité) : config web **publique** de la prod (aucun secret).
- `.env.local` (non commité) : surcharges locales, ex. `GEMINI_API_KEY` pour `server.ts`.
- **Attention** : l'émulateur Hosting sert `dist/`. Après `npm run build`, ce bundle
  parle à la **prod**. Pour l'émulateur, utiliser `npm run build:dev`.
- `firebase` sans `--project` utilise `demo-quran-school` (`.firebaserc`). L'alias
  `prod` n'est à utiliser que par un humain, en suivant un runbook.

## Architecture (état actuel)

- `src/App.tsx` (~8 500 lignes) : tout l'état (`useState`), la connexion, le
  routage par `activeTab`, la plupart des écrans.
- `src/db.ts` : `RealmSimDB`, CRUD « localStorage d'abord » + écriture Firestore
  en parallèle (fire-and-forget).
- `src/firebase.ts` : initialisation + 4 fonctions génériques
  (`saveToFirestore`, `deleteFromFirestore`, `subscribeToCollection`, `subscribeToSettings`).
- `src/config/env.ts` : lecture des variables `VITE_*`, garde-fou émulateurs.
- `src/types.ts` : modèles, 9 rôles (valeurs en arabe), matrice de permissions.
- `src/security/` : modules purs (correspondance compte ↔ Auth, groupes de rôles
  miroirs des règles, alignement explicite des comptes).
- Sécurité (Lot 0) : connexion Firebase Auth d'abord, puis lien
  `authLinks/{uid}` (rôle, statut, élèves liés) lu par les règles. Aucun mot de
  passe dans Firestore ni dans localStorage. Comptes créés / réinitialisés par
  les callables `createUserAccount` / `resetUserPassword` (directeur).
- `src/components/` : écrans extraits (données en props, callbacks `onSave…`).
- `firestore.rules` : règles (appliquées à la base nommée, voir `firebase.json`).
- `functions/` : Cloud Functions 2nd gen (Node 22, TypeScript, région `europe-west1`).
- `server.ts` : serveur Express historique (AI Studio / Cloud Run) : proxy Gemini + statique.
- `scripts/` : scripts d'administration (Admin SDK). `--dry-run` par défaut,
  `--project` obligatoire ; ne les lancer que contre les émulateurs.
- `tests/unit` (vitest pur) et `tests/emulator` (règles, scripts, sur émulateurs).

## Conventions

- Commits atomiques, messages en **français**.
- Les valeurs de rôles restent en arabe (`مدير`, `إداري`, `مؤطر`, `مدرس`, `متطوع`,
  `عامل نظافة / صيانة`, `أخرى`, `طالب`, `ولي أمر`) : compatibilité des données.
- Toute modification de `firestore.rules` s'accompagne de tests dans `tests/emulator`.
- Tout accès Firestore passe par `src/firebase.ts` ; pas d'appel direct dispersé.
- Aucune valeur de config (projet, base, clé) codée en dur dans le code : `src/config/env.ts`.
- Toute décision structurante est consignée dans `docs/DECISIONS.md`
  (contexte, décision, retour arrière).
- `npm run lint`, `npm run build` et les tests doivent rester verts sur chaque branche.
- Ne jamais réintroduire : comparaison de mot de passe côté client, création de
  compte à la connexion, écriture de `password`, correspondance approximative
  (`includes`) pour rattacher un élève, repli sur « le premier élève / enseignant ».
- Conteneur avec proxy sortant : créer `functions/.env.local` avec
  `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (voir `docs/DECISIONS.md`, D21).
