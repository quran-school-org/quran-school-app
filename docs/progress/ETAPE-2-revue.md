# Étape 2 — revue de sécurité adversariale : avancement

Branches : `fix/revue-securite` (depuis `feat/multi-tenant`, worktree `/home/user/wt-revue`),
`fix/revue-securite-lot0` (depuis `fix/lot0-securite`, worktree `/home/user/wt-revue-lot0`).
Rapport final : `docs/revues/REVUE-SECURITE-ETAPE-2.md`.

Commande locale des tests sur émulateurs (conteneur à proxy, D21) :
`EMULATOR_SKIP_FIRESTORE_TRIGGERS=true flock /home/user/.emulators.lock npm run test:rules`.

## Fait (multi-écoles, `fix/revue-securite`)
- R-01 mots de passe exposés remplacés (`--rotate-passwords`, défaut `all`) ;
- R-02 liens retirés non rétablis à la relance ; R-03 sessions révoquées à l'adoption ;
- R-04 échecs partiels du provisionnement ; R-05 migration par `create` ;
- R-08 données plantées dans appUsers (authUid, liens, mots de passe) ;
- R-09 authLinks fait foi à la relance ;
- F-01 attachExisting (registre seul, pas de réactivation) ; F-02 reset u1 ;
- C-01 XSS des impressions ; C-02 cache purgé en fin de session ; C-03 pas de promotion مدير ;
- hypothèses réfutées sur les règles (tests/emulator/revue-rules.test.ts) ;
- runbooks mis à jour.

## En cours
- Portage sur `fix/revue-securite-lot0` (R-01..R-04, R-08, R-09, C-01..C-03, F-02 équivalent).

## Suivant
- DECISIONS.md (D34+), rapport `docs/revues/REVUE-SECURITE-ETAPE-2.md`, verdict.
