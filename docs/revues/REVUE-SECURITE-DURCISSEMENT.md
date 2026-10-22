# Revue de sécurité adversariale — durcissement (étape 2)

> Date : 22/10/2026. Revue faite en autonomie par un agent. **Aucune action sur
> la production ni sur GCP** : aucun déploiement, aucune connexion, aucun appel
> aux API du projet `gen-lang-client-0481880143`, aucune ressource créée,
> aucun réglage du dépôt modifié. Tout a été démontré sur les émulateurs
> (`demo-quran-school`, données **fictives**) ou par analyse statique.
>
> Branches :
> - `fix/revue-durcissement` (depuis `feat/durcissement`, 9e4f601) : multi-écoles ;
> - `fix/revue-durcissement-lot0` (depuis `fix/revue-securite-lot0`, 3a719e9) : Lot 0.
>
> Décisions : `docs/DECISIONS.md`, D65 à D74 (D52 à D64 sont pris sur
> `main` : design intégré et workflows de mise en prod ; sur la branche Lot 0 : D54 = R-07, D55 = R-06). Avancement : `docs/progress/ETAPE-2-revue2.md`.
> Revue précédente : `docs/revues/REVUE-SECURITE-ETAPE-2.md` (constats R-, C-, F-, O-).

## 1. En bref

- **Périmètre** : tout ce que `feat/durcissement` ajoute depuis
  `fix/revue-securite` (`staffPrivate`, quotas du proxy IA, App Check,
  workflows de déploiement, sauvegardes, CSP et en-têtes, rewrite `/api/**`,
  recompression des photos), plus R-07 et R-06 (Lot 0) de la revue précédente.
  Après fusion de `main` (design intégré) et de `feat/workflows-ops`
  (`deploy-lot0.yml`, `ops.yml`, entrée `force`, D64), ces workflows ont été
  revus aussi (§3, RD-14 et RD-15).
- **16 constats** : aucun critique, 1 élevé, 4 moyens, 11 faibles (§3).
  À cela s'ajoute R-06 sur le Lot 0, déjà connu (moyen), évalué et accepté
  jusqu'à la bascule (D71).
- **Corrigés** : le constat élevé, les 4 moyens et 7 des faibles, dont R-07 sur les deux
  branches. Chaque correctif a son test, qui échouait avant le correctif, ou
  une vérification statique. Pour les workflows : `zizmor` passe de 27 constats
  à 0, et `tests/unit/workflows.test.ts` échoue sur 7 points avec les anciens
  workflows.
- **Les protections principales tiennent** :
  - les fiches RH ne sont lisibles ni par la pédagogie, ni par une autre école,
    ni par le super-admin, et aucune écriture détournée ne passe ;
  - les compteurs de quota ne sont ni lisibles ni falsifiables par un client,
    et une école ne peut pas faire payer une autre ;
  - la rétention des sauvegardes ne supprime jamais un export récent.
- **Constat élevé** :
  - **RD-14** : le projet de dev reçoit une copie des données réelles
    (`ops.yml` › `import-firestore`). Or le fournisseur WIF délivrait un jeton
    à toute branche qui déclare `environment: dev`, puisqu'un workflow lancé à
    la main exécute le fichier de la branche choisie. Toute personne, ou tout
    agent, capable de pousser une branche pouvait donc lire cette copie : des
    données de mineurs. Corrigé dans la procédure de mise en place : seuls
    `main` et les trois workflows prévus obtiennent un jeton, pour le dev comme
    pour la prod.
- **Constats moyens** :
  - **RD-01** : l'environnement GitHub `dev` acceptait toutes les branches et
    servait aussi aux aperçus. Toute personne capable de pousser une branche
    pouvait donc déployer règles et fonctions sur le projet de dev, et lire ses
    données. C'est grave dès que ce projet reçoit un export réel pour une
    répétition de la bascule.
  - **RD-02** : la procédure App Check faisait mettre le jeton de débogage dans
    `.env.local`. Or Vite le charge aussi pour le build de production : le
    jeton aurait été publié dans le bundle de la prod.
  - **RD-13** (trouvé en préparant l'accueil d'une deuxième école) : retirer
    le super-admin de l'école qu'il vient de créer désactivait son compte. Un
    directeur pouvait aussi le bloquer volontairement.
  - **RD-15** : les rapports d'`ops.yml` et les mots de passe temporaires
    étaient des artefacts en clair, lisibles par tout compte qui lit le dépôt.
- **Verdict (§8)** : le durcissement est prêt à être fusionné **avec**
  `fix/revue-durcissement`. Le Lot 0 reste prêt depuis
  `fix/revue-durcissement-lot0`, qui n'ajoute à `fix/revue-securite-lot0`
  qu'une règle de plus (R-07).

## 2. Périmètre et méthode

Relu : `git diff origin/fix/revue-securite origin/feat/durcissement`. Les 55
fichiers modifiés touchent les règles, `src/firebase.ts`, `src/security/staffPrivate.ts`,
la migration, `functions/src/{tenant/api.ts,tenant/aiQuota.ts,appCheck.ts,backup.ts}`,
les workflows, `firebase.json`, `vite.config.ts` et les runbooks. Ont aussi été
relus : les règles et l'interface du Lot 0, pour R-06 et R-07.

Méthode : pour chaque hypothèse d'attaque, un test sur émulateur, un test par
appel direct (Functions, sauvegarde), ou une vérification statique des
workflows (`actionlint` 1.7.7, `zizmor` 1.31.1 hors ligne,
`tests/unit/workflows.test.ts`).
- **Faille confirmée** : le test échouait avant le correctif ; il sert
  ensuite de non-régression.
- **Hypothèse réfutée** : le test passe sans aucune modification.

Gravité (même échelle que la revue précédente) :
- **Critique** : prise de contrôle à distance, sans compte.
- **Élevée** : élévation de privilège jusqu'au directeur, ou prise de contrôle de comptes.
- **Moyenne** : fuite ciblée de données de mineurs, élévation conditionnelle, incident d'exploitation probable.
- **Faible** : défense en profondeur, conditions improbables.

## 3. Tableau des constats

Branches : **MT** = `fix/revue-durcissement`, **L0** = `fix/revue-durcissement-lot0`.

| ID | Gravité | Constat | Branches | État |
|---|---|---|---|---|
| RD-14 | **Élevée** | Projet de dev alimenté par une copie de la prod (`ops.yml` › `import-firestore`) ; condition WIF sans branche ni fichier de workflow : toute branche déclarant `environment: dev` (ou `production`) obtenait le jeton du compte (`github-ops`, `github-deploy`) | MT (guide, runbook) | Corrigé dans la procédure (D74), action humaine |
| RD-15 | **Moyenne** | Rapports des scripts (identifiants, anomalies) et mots de passe temporaires envoyés en artefacts GitHub en clair, lisibles par tout compte qui lit le dépôt | MT (`ops.yml`) | Corrigé (D74) : chiffrement GnuPG, refus sans clé pour les mots de passe |
| RD-01 | **Moyenne** | Environnement `dev` ouvert à toutes les branches et partagé avec les aperçus : tout contributeur pouvait déployer règles et fonctions sur le projet de dev, donc lire ses données (réelles lors d'une répétition) | MT (workflow + runbook) | Corrigé (D68, D74), actions humaines |
| RD-02 | **Moyenne** | Jeton de débogage App Check placé dans `.env.local` (runbook, `.env.example`), donc publié dans le bundle de production | MT | Corrigé (D70) |
| RD-13 | **Moyenne** | Le compte super-admin était désactivé quand on le retirait de sa dernière école (parcours normal d'accueil d'une école) ou à l'archivage d'une fiche qu'un directeur lui avait liée : blocage de l'administration de la plateforme | MT | Corrigé (D72) |
| RD-03 | Faible | Actions non épinglées par SHA (dont `google-github-actions/auth`) ; dans le job qui détient le jeton OIDC, scripts d'installation npm exécutés et cache partagé | MT | Corrigé (D68) |
| RD-04 | Faible | Expressions `${{ }}` interpolées dans des scripts (`inputs.target`, `vars.*`, sorties d'étape) ; non exploitables aujourd'hui (valeurs `choice` ou posées par un administrateur) | MT | Corrigé (D68) |
| RD-05 | Faible | Condition du fournisseur WIF fondée sur le nom du dépôt ; pour la prod, ni la branche ni le fichier de workflow n'y figurent (seule la règle de l'environnement GitHub protège) | MT (runbook) | Corrigé dans le runbook (D68), action humaine |
| RD-06 | Faible | Migration relancée : une fiche publique porteuse de champs RH était vidée, sans copie vers une fiche RH déjà existante (perte de données RH) | MT | Corrigé (D66) |
| RD-07 | Faible | Sauvegardes : rôle `datastore.importExportAdmin` (l'import écrase la base en service) ; aucune conservation minimale contre un compte compromis ; la suppression acceptait tout préfixe se terminant par une date | MT | Corrigé : code et runbook (D69) |
| R-07 | Faible | Les familles créent des notifications lues par le personnel ; tout membre du personnel pouvait aussi réécrire une notification | MT, L0 | Corrigé (D65 ; L0 : création seulement) |
| RD-08 | Faible | Réponses de `/api/gemini/analyze` sans `Cache-Control` explicite (rapport propre à un élève) | MT | Corrigé (D67) |
| RD-09 | Faible | CSP : `*.run.app`, `*.cloudfunctions.net`, `*.googleapis.com` (`connect-src`), `*.firebaseapp.com` (`frame-src`) sont des points de sortie qu'un attaquant peut héberger ; avec `'unsafe-inline'`, la CSP ne bloque de toute façon pas une injection | MT | Non corrigé (recommandation §5) |
| RD-10 | Faible | Taille des photos base64 non bornée par les règles (la recompression D51 n'agit que côté client) : un membre pédagogique peut alourdir la collection | MT | Accepté (plan Cloud Storage D51) |
| RD-11 | Faible | Quota IA global : quatre écoles peuvent l'épuiser ensemble (déni de service du rapport, sans coût au-delà) ; compteur global sur un seul document (≈ 1 écriture/s), au-delà réponse 503 | MT | Accepté (D67) |
| RD-12 | Faible | Portée réelle de `github-deploy` : déployer des fonctions revient à exécuter du code sous leur compte, qui a accès à toute la base ; le compte Compute par défaut a souvent `editor` | MT (runbook) | Documenté (D68), action humaine |
| R-06 (L0) | Moyenne | Salaires et CIN lisibles par la pédagogie sur le Lot 0 (connu) | L0 | Accepté jusqu'à la bascule (D71) |

## 4. Constats corrigés : preuves et correctifs

| ID | Preuve | Correctif | Commits |
|---|---|---|---|
| RD-14 | Analyse des workflows et du guide : `import-firestore` (dev), agent de service du dev lecteur du bucket de la prod, condition `repository && environment` seule ; forfait gratuit sans règle de branche d'environnement | Condition WIF : `ref == refs/heads/main` et `job_workflow_ref` dans {`deploy.yml`, `deploy-lot0.yml`, `ops.yml`}`@main`, identique dev et prod ; aperçus par un second fournisseur (`environment == preview`) et `github-preview` (Hosting seul) | MT `a6d1ece` |
| RD-15 | `tests/unit/workflows.test.ts` › ops.yml (échoue sur la version de `feat/workflows-ops`) ; chiffrement puis déchiffrement essayés localement avec GnuPG 2.4 | Étape « Chiffrement des artefacts » avant tout envoi ; garde-fou : `rotate_passwords` ≠ `none` appliqué refusé sans `ARTIFACT_GPG_PUBLIC_KEY` | MT `a6d1ece` |
| RD-01 | Analyse : un `workflow_dispatch` exécute le fichier **de la branche choisie** ; l'environnement `dev` (runbook §4 : « toutes les branches ») délivrait le jeton OIDC du compte `github-deploy` du projet de dev | `preview.yml` passe sur un environnement `preview` au compte limité au Hosting (`github-preview`), avec le build dans un job sans jeton OIDC ; `dev` réservé aux branches protégées, puis, avec `ops.yml`, à `main` et aux trois workflows prévus par la condition WIF (RD-14, D74) ; garde-fou `tests/unit/workflows.test.ts` (aperçu jamais en `dev` ni en `production`) | MT `6aab5ad` |
| RD-02 | `tests/unit/buildGuards.test.ts` : `loadEnv("production")` lit bien `.env.local` ; un build avec le jeton dans `.env.local` est refusé (vérifié à la main : « Build de production refusé ») | `scripts/dev/buildGuards.ts` appelé par `vite.config.ts` : refus d'un jeton de débogage, ou d'émulateurs avec un vrai projet, en mode production (échappatoire explicite `ALLOW_APPCHECK_DEBUG_IN_BUILD=true`) ; runbook App Check et `.env.example` : `.env.development.local` | MT `12b6e25` |
| RD-03 | `zizmor` : 18 `unpinned-uses` ; lecture du job `deployer` | SHA de commit relevés par `git ls-remote` (tag en commentaire) ; `npm ci --ignore-scripts` (aucun script n'est utile : build, build et chargement des Functions et CLI Firebase vérifiés sur une copie) ; plus de `cache: npm` dans les jobs à jeton OIDC ; `persist-credentials: false` | MT `6aab5ad` |
| RD-04 | `zizmor` : 4 `template-injection` | Toute expression passe par `env` ; liste blanche de l'environnement et de la durée d'expiration ; test statique « aucune expression dans `run:` » | MT `6aab5ad` |
| RD-05 | Lecture du runbook §2 | Condition `repository_id` et `repository_owner_id` (identifiants numériques) ; pour la prod, en plus `ref == refs/heads/main` et `job_workflow_ref == …/deploy.yml@refs/heads/main` ; recommandation de protéger `main` et d'ajouter `CODEOWNERS` | MT `6aab5ad` |
| RD-06 | `tests/emulator/migration.test.ts` › scission à la relance : `emergencyContact`, présent seulement dans la fiche publique, était perdu | La fiche RH existante garde ses valeurs ; les champs qui lui manquent sont complétés avant leur retrait de la fiche publique ; une valeur divergente produit `STAFF_PRIVATE_CONFLICT` (noms de champs seulement) | MT `5b84823` |
| RD-07 | `functions/test/revue-backup.test.ts` : un listage qui renvoie `manuel/…`, une autre base ou un sous-dossier faisait supprimer ces dossiers (4 suppressions au lieu d'une) | `isExportPrefixUnder` : seuls les dossiers `firestore/<base>/<horodatage>/` exacts sont supprimables ; runbook : rôle personnalisé « export seul », conservation de 28 jours (verrouillable), accès aux exports | MT `1771fbc` |
| R-07 | `tests/emulator/revue-rules.test.ts` › R-07 (2 tests échouaient avec les anciennes règles) ; matrices `tenant-rules` et `lot0-rules` | `create` réservé au personnel ; MT : hors bureau, une mise à jour ne peut toucher que `isRead` (et `id`, s'il est égal à l'identifiant du document) | MT `dd6f45f`, `942fc49`* ; L0 `c10c3f4` |
| RD-13 | `functions/test/revue-durcissement.test.ts` › D72 (2 tests échouaient avant le correctif) | `isSuperAdminAccount` : jamais de désactivation automatique d'un compte portant le claim `superAdmin` (retrait, archivage) ; l'appartenance est bien retirée ou suspendue | MT `0e3cd91` |
| RD-08 | Appel direct et à travers le rewrite Hosting (`npm run test:hosting`) | `Cache-Control: private, no-store` sur toutes les issues de `/api/gemini/analyze` | MT `e3ee428` |

\* second commit R-07 sur MT : marquage comme lu d'une notification héritée sans `id`.

Runbooks mis à jour : `CI-DEPLOIEMENT.md` (environnements, comptes et
conditions WIF, protection de `main`, mise à jour des SHA), `SAUVEGARDES.md`
(rôle « export seul », conservation, accès aux exports), `APP-CHECK.md`
(emplacement du jeton de débogage), `MIGRATION-BASCULE.md`
(`STAFF_PRIVATE_CONFLICT`).

## 5. Constats non corrigés (justification)

- **R-06 sur le Lot 0** (moyen, D71) : l'interface du Lot 0 a besoin de la
  liste `teachers` pour la pédagogie : tableau de bord de l'enseignant
  (`activeTeacher`), noms des enseignants dans les halaqas et les examens,
  affectation des halaqas par le مؤطر. Fermer cette lecture casserait ces
  écrans. Une lecture limitée à sa propre fiche modifierait l'interface et la
  session, et laisserait de toute façon le salaire de l'enseignant dans sa
  fiche. Les règles ne filtrent pas des champs : seule la scission (D42)
  corrige vraiment. Le risque est accepté jusqu'à la bascule, avec des mesures
  d'organisation (prévenir le personnel, ne pas saisir de nouvelles CIN avant
  la bascule, garder l'intervalle court).
- **RD-09** (CSP) : resserrer `connect-src` et `frame-src` (origines exactes :
  `firestore`, `identitytoolkit`, `securetoken`, `firebaseinstallations` et
  `content-firebaseappcheck.googleapis.com`, plus
  `europe-west1-<projet>.cloudfunctions.net`) n'a de sens qu'après le retrait
  de `'unsafe-inline'`, déjà planifié côté interface (D49). Ces origines
  exactes doivent être vérifiées sur un vrai projet. Ne pas le faire en
  aveugle, car une connexion bloquée casse l'application. `*.run.app` ne
  semble pas utilisé (callables par `cloudfunctions.net`, `api` sur la même
  origine) : point à vérifier en premier. Sur `main`, le design intégré a déjà
  retiré `cdn.tailwindcss.com` et `api.qrserver.com` de la CSP (D61, D62) ;
  `'unsafe-inline'` reste dans `script-src`.
- **Forfait gratuit (lié à RD-14)** : sans protection de branche, quiconque
  peut pousser sur `main` peut modifier les trois workflows autorisés et les
  lancer. La condition WIF ne protège pas contre cela : le droit d'écriture
  reste la frontière de confiance (D64, D74). Forfait Team recommandé.
- **RD-10** (photos) : borner la taille dans les règles bloquerait aussi
  l'enregistrement d'une fiche existante dont la photo dépasse la limite, si la
  recompression échoue dans le navigateur. Le passage à Cloud Storage (D51)
  règle le problème à la source. Test documentaire :
  `revue-durcissement-rules.test.ts` › photos.
- **RD-11** (quota global) : acceptable avec deux écoles. À revoir au-delà de
  trois : remonter `AI_DAILY_LIMIT_GLOBAL` ou baisser la limite par école.
- **RD-12** : c'est une propriété du déploiement de fonctions. Le runbook le
  dit et recommande un compte d'exécution dédié avant d'ouvrir la CI sur la
  prod.

## 6. Hypothèses réfutées (les protections tiennent)

- **`staffPrivate`** :
  - Tests : `tests/emulator/revue-durcissement-rules.test.ts`, `tenant-rules.test.ts`, `revue-rules.test.ts`.
  - Refusé : lot (batch) qui glisse une fiche RH à côté d'une écriture permise ;
    création d'une fiche RH par un enseignant ; champ libre ou `password` dans
    une fiche RH ; lecture par un مؤطر, une famille, le directeur d'une autre
    école ou le super-admin.
  - Côté client, sans droit RH, les champs RH résiduels sont retirés avant
    l'affichage et le cache (`subscribeToStaff`).
- **Quotas IA** :
  - Tests : `functions/test/revue-durcissement.test.ts`, `tests/emulator/revue-durcissement-rules.test.ts`.
  - Un enseignant de A qui cite le `schoolId` de B : 403, aucun compteur.
  - Familles, bénévoles, suspendus, requêtes incomplètes : refusés sans rien consommer.
  - Comptes multipliés dans une école : bornés par le quota de l'école.
  - Champs `uid`, `day`, `count` ou `limits` ajoutés au corps : ignorés.
  - Compteurs `aiQuota` : ni lus, ni remis à zéro, ni supprimés par aucun client, super-admin compris.
  - Identifiants de compteurs sans chevauchement possible : préfixe de portée,
    jour de longueur fixe, `SCHOOL_ID_PATTERN` sans `_`.
- **App Check** :
  - `enforceAppCheck: APPCHECK_ENFORCE` est bien une expression de paramètre.
    `firebase-functions` l'évalue au chargement du module, avec les variables
    de `functions/.env.<projet>`, et non comme un objet toujours vrai (lecture de
    `lib/v2/providers/https.js`).
  - Le refus 401 de `api` quand App Check est appliqué est testé
    (`aiQuota.test.ts`).
  - Limite connue : un jeton App Check se réutilise pendant sa durée de vie.
    App Check atteste l'application, pas l'utilisateur.
- **Workflows** :
  - la prod ne se déploie que depuis `main`, après relecture : environnement
    `production`, règle de branche, garde-fou, recopie de l'identifiant ;
  - les entrées `choice` sont validées par GitHub ;
  - le nom du canal d'aperçu est assaini ;
  - aucun `pull_request_target`, permissions par défaut en lecture
    (`tests/unit/workflows.test.ts`).
- **Sauvegardes** (`functions/test/revue-backup.test.ts`) :
  - des dossiers plantés datés du futur ne font supprimer aucun export récent ;
  - une rétention absurde (0, négative, NaN) ne supprime rien ;
  - une longue panne laisse toujours les 3 exports les plus récents ;
  - un export en échec ne supprime rien (`backup.test.ts`).
- **CSP et en-têtes** :
  - `frame-ancestors 'none'`, `X-Frame-Options`, `object-src 'none'`,
    `base-uri`, `nosniff` sont servis par l'émulateur Hosting (`npm run test:hosting`) ;
  - toute la suite Playwright tourne sous la CSP (`E2E_CSP=1`), 11/11.
- **Rewrite `/api/**`** : 401 sans jeton ; la réponse n'est jamais `public`
  (`test:hosting`).
- **Photos** : une valeur `photo` ou `logo` n'est utilisée que comme `src`
  d'image (aucun `href`, `window.open` ni `url()` CSS) et elle est échappée
  dans les impressions (D37). Une image SVG ou une URL `javascript:` n'exécute
  donc rien.

## 7. Résultats des tests (réellement obtenus, 22/10/2026)

Dans ce conteneur, les tests sur émulateurs se lancent avec
`EMULATOR_SKIP_FIRESTORE_TRIGGERS=true` (D21) : les tests de bout en bout des
triggers y sont ignorés.

| Branche (commit) | Lint app / functions | Build prod | Unitaires | Émulateurs | Functions | Hosting | Playwright |
|---|---|---|---|---|---|---|---|
| `fix/revue-durcissement` (`d5ec153`) | OK / OK | OK | 68/68 | 242 réussis, 2 ignorés | 43/43 | 5/5 (au commit `e3ee428`) | 11/11 sous CSP |
| `fix/revue-durcissement-lot0` (`c10c3f4`) | OK / OK | OK | 29/29 | 221 réussis, 4 ignorés | 8/8 | — | — (pas de Playwright sur cette branche) |

Workflows : `actionlint` sans erreur ; `zizmor --offline` sans constat
(3 constats « suppressed » de faible confiance). Les anciens workflows
donnaient 27 constats (18 élevés, 5 moyens, 4 informatifs).

Non vérifié (exige un vrai projet ou GitHub) :
- les workflows réellement exécutés et les conditions WIF ;
- le rôle personnalisé « export seul » : les noms de permissions sont à
  vérifier à la création ;
- la politique de conservation du bucket ;
- le comportement du CDN Hosting.

## 8. Verdict

**Durcissement (multi-écoles)** : **prêt à fusionner avec `fix/revue-durcissement`**
(`fix/revue-durcissement` → `feat/durcissement`). Aucune faille critique ni
élevée dans le code. Le constat élevé (RD-14) porte sur la mise en place
de la CI. Il est corrigé dans la procédure (guide, étape 2), qui doit donc
être suivie dans sa version de cette branche.

Avant d'activer la CI de déploiement, l'humain doit :
1. poser la condition WIF « `main` + trois workflows » sur le dev **et** sur la
   prod (`update-oidc` si le fournisseur existe déjà) ;
2. ne créer l'environnement `preview` qu'avec son propre fournisseur et le
   compte `github-preview` (Hosting seulement) ;
3. poser `ARTIFACT_GPG_PUBLIC_KEY` dans chaque environnement avant toute
   répétition avec `rotate_passwords=all` ;
4. limiter le droit d'écriture sur le dépôt (forfait gratuit : aucune
   protection de `main`) ; forfait Team recommandé ;
5. vider la copie des données réelles du dev après la dernière répétition ;
6. pour les sauvegardes : rôle « export seul » et conservation de 28 jours ;
7. pour App Check : jeton de débogage dans `.env.development.local` seulement.

**Lot 0** : il reste **prêt pour la production depuis
`fix/revue-durcissement-lot0`**, à fusionner dans `release/lot0` (la branche
part de `fix/revue-securite-lot0`, déjà fusionnée dans `release/lot0`). Cette branche n'ajoute qu'une règle (R-07). Les
conditions de la revue précédente restent toutes valables. R-06 est accepté
jusqu'à la bascule (D71) : il faut garder court l'intervalle entre le Lot 0 et
la bascule.

**Bascule multi-écoles** : les conditions précédentes sont inchangées. Les
répétitions avec une copie réelle (`ops.yml`) n'ont lieu qu'une fois la
condition WIF de RD-14 en place. R-06 est réglé par `staffPrivate` (D42), à vérifier
par la ligne `staffPrivate` des comptages. L'éventuelle anomalie
`STAFF_PRIVATE_CONFLICT` est à examiner avec l'école.

**Pour `feat/design`** : aucun écran n'est modifié. Les fichiers touchés hors
écrans sont `vite.config.ts` (garde-fou du build) et `firestore.rules`
(notifications). Les familles n'écrivent plus de notification : la
notification automatique « تعديل البيانات الشخصية » d'un parent est refusée
en silence. On peut la supprimer côté interface pour les rôles famille.
