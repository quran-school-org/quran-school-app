# Étape 2 — durcissement : avancement

Branche `feat/durcissement` (depuis `fix/revue-securite`), worktree `/home/user/wt-durcissement`.
Décisions : `docs/DECISIONS.md` à partir de D42.

Commandes locales (conteneur à proxy, D21, D48), toujours sous verrou :
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`
- `EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:e2e`
- `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run test:hosting`
- (triggers compris : `without-proxy.sh` + `functions/.env.local` sans `EMULATOR_SKIP_FIRESTORE_TRIGGERS`)

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
6. **Sauvegardes / D47** : `scheduledFirestoreExport` (omise tant que
   `BACKUP_ENABLED` ≠ true, vérifié sur l'émulateur), rétention, tests par
   appel direct, runbook `docs/runbooks/SAUVEGARDES.md` (PITR, bucket, IAM,
   restauration sur le dev).
7. **Rewrite `/api/**` / D48** : testé localement (variables de proxy retirées
   pour le seul processus) et ajouté à la CI (`npm run test:hosting`) ; triggers
   également verts localement par ce moyen (237/237).
8. **Pages de prod / D49** : `index.html` générique, en-têtes (CSP, nosniff,
   Referrer-Policy, Permissions-Policy caméra, X-Frame-Options, COOP, HSTS),
   cache ; toute la suite Playwright tourne sous la CSP (`E2E_CSP=1`), 11/11.
9. **Clé API web / D50** : runbook `docs/runbooks/CLE-API-WEB.md`.
10. **Photos / D51** : filet de sécurité (recompression des images base64
    trop lourdes avant écriture) ; Cloud Storage NON implémenté (règles Storage
    sans accès à la base nommée → claims d'appartenance d'abord), plan détaillé.

## En cours
- (rien)

## Suivant (ordre de la mission)
Fin : `docs/PLAN.md`, section « Étape 2 : durcissement » de `docs/RAPPORT-ETAPE-1.md`.

## Prochaine action exacte
Clôture : `docs/PLAN.md`, section « Étape 2 : durcissement » de `docs/RAPPORT-ETAPE-1.md`, vérification finale complète.
