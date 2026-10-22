# Étape 2 — durcissement : avancement

Branche `feat/durcissement` (depuis `fix/revue-securite`), worktree `/home/user/wt-durcissement`.
Décisions : `docs/DECISIONS.md` à partir de D42.

Commandes locales (conteneur à proxy, D21), toujours sous verrou :
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:e2e`

## Fait
1. **R-06 / D42** : fiches RH `staffPrivate` (règles, couche données, migration,
   peuplement, tests unitaires / règles / migration / Playwright).
2. **Proxy IA / D43** : quotas transactionnels (utilisateur jour/minute, école,
   global), corps ≤ 32 Kio, journaux sans données personnelles, `requestAiReport`
   côté client, runbook `docs/runbooks/PROXY-IA.md`.
3. **App Check / D44** : client (`VITE_APPCHECK_SITE_KEY`, débogage), Functions
   (`APPCHECK_ENFORCE`, défaut false), runbook `docs/runbooks/APP-CHECK.md`.
4. **Dépendances / D45** : `npm audit fix` + 2 surcharges (grpc-js, uuid) :
   22 → 5 vulnérabilités (toutes dans firebase-tools, outil de dev) ;
   production 0 ; functions 0 ; audit dans la CI.
5. **Déploiement GitHub Actions / D46** : `deploy.yml`, `preview.yml`
   (workflow_dispatch, WIF, environnements dev / production), runbook
   `docs/runbooks/CI-DEPLOIEMENT.md` ; validés par actionlint.

## En cours
- (rien)

## Suivant (ordre de la mission)
6. Sauvegardes planifiées + runbook PITR / restauration.
7. Rewrite Hosting `/api/**` : test local ou job CI.
8. `index.html` générique, en-têtes de sécurité, cache, Playwright avec CSP.
9. Runbook de restriction de la clé API web.
10. Photos : évaluation / passage à Cloud Storage.
Fin : `docs/PLAN.md`, section « Étape 2 : durcissement » de `docs/RAPPORT-ETAPE-1.md`.

## Prochaine action exacte
Point 6 : fonction planifiée d'export Firestore (`functions/src/backup.ts`) + runbook SAUVEGARDES.
