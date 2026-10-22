# Plan de travail

Détails, constats et estimations : [`docs/analyse/RAPPORT-ANALYSE.md`](analyse/RAPPORT-ANALYSE.md).

## Règles du jeu
- **`main` = référence.** Chaque lot se fait sur sa propre branche avec une PR, relue avant fusion.
- **Aucune action sur la prod sans accord explicite au moment de l'action** : règles, déploiement, script de données, comptes Auth.
- **Tout est d'abord essayé sur un projet Firebase de dev** et sur les émulateurs.
- **Plus de déploiement depuis AI Studio** une fois le Lot 0 prêt : à coordonner avec l'autre développeur.
- **Trois validations humaines obligatoires** : relecture des règles Firestore, résultat de la simulation de migration, bascule en prod.

## Étapes

| # | Lot | Contenu | Sortie attendue | Prod touchée ? |
|---|---|---|---|---|
| 1 | **Mise en place** | `.firebaserc` avec `dev` par défaut et `prod` en alias ; config Firebase par variables d'environnement ; un seul gestionnaire de paquets ; `CLAUDE.md` ; projet Firebase de dev ; émulateurs ; CI GitHub Actions (build + lint) | `npm run dev` contre les émulateurs ; `firebase deploy` part sur le dev | Non |
| 2 | **Lot 0 : correctif de sécurité urgent** | Connexion via Firebase Auth *avant* toute lecture ; `appUsers` et `settings` non publics ; suppression des mots de passe en clair ; arrêt de la création automatique de comptes et de la réécriture en boucle de `syncAppUsers` ; un élève ne voit plus le dossier d'un autre ; script Admin SDK qui crée les comptes Auth manquants ; nouveau mot de passe admin | PR + recette sur le dev, puis déploiement en prod **sur accord** | **Oui, sur accord** |
| 3 | **Décision : option A** (actée le 21/10/2026) | On fait évoluer le code existant, car une deuxième école arrive bientôt. Le multi-tenant passe en prod avec l'ancien design, puis le design arrive écran par écran (rapport § 9) | — | Non |
| 4 | **Multi-tenant + auth + rôles + règles** | `schools/{id}/…`, `users`, `members`, Cloud Functions (comptes, rôles, écoles), super-admin par claim, sélecteur d'école, règles par rôle, tests de règles (y compris entre écoles), 9 rôles | Tests verts sur les émulateurs | Non |
| 5 | **Migration** | Sauvegarde (PITR + export) ; script idempotent avec mode simulation ; audit `appUsers` ; liste des liens parent/enfant **à faire valider par l'école** ; deux répétitions sur le dev | Rapport de simulation validé | Lecture seule (exports) |
| 6 | **Bascule** | Fenêtre de maintenance ; migration + règles + Hosting + Functions en même temps ; retour arrière prêt | École n°1 en multi-tenant (ancien design si option A) | **Oui, sur accord** |
| 7 | **Design** | Jetons, composants, cadre de l'app (menu, barre du haut, sélecteur d'école) ; tableau de bord d'après la maquette ; puis un écran par PR | Capture avant/après par écran | Déploiements progressifs |
| 8 | **Exploitation** | Déploiement prod depuis GitHub Actions ; arrêt du service Cloud Run AI Studio ; suppression des anciennes collections après 30 jours | Le déploiement se fait depuis ce dépôt | Oui, sur accord |

## Avancement (21/10/2026, complété le 22/10/2026)

Détail, résultats des tests et actions humaines restantes : [`docs/RAPPORT-ETAPE-1.md`](RAPPORT-ETAPE-1.md).
Décisions prises : [`docs/DECISIONS.md`](DECISIONS.md).

| # | Lot | État | Branche |
|---|---|---|---|
| 1 | Mise en place | **Fait** (émulateurs, config par environnement, npm seul, CI, `CLAUDE.md`). Reste : projet Firebase de dev (humain) | `chore/socle-dev` |
| 2 | Lot 0 : correctif de sécurité | **Prêt à déployer** (code, règles, Functions, script, tests). Reste : relecture, déploiement par un humain (`docs/runbooks/LOT0-DEPLOIEMENT.md`) | `fix/lot0-securite` |
| 3 | Décision option A | Actée | — |
| 4 | Multi-tenant + auth + rôles + règles | **Fait sur émulateurs** (schéma `schools/…`, `users`/`members`, Functions, super-admin, sélecteur d'école, règles 9 rôles, tests) | `feat/multi-tenant` |
| 5 | Migration | **Script et tests faits** (émulateurs, données fictives). Reste : sauvegarde et deux répétitions sur un projet de dev, validation des liens parent/enfant par l'école | `feat/multi-tenant` |
| 6 | Bascule | À faire par un humain (`docs/runbooks/MIGRATION-BASCULE.md`) | — |
| 7 | Design | Non commencé (hors mission) | — |
| 8 | Exploitation | **Préparé** (`feat/durcissement`) : déploiement GitHub Actions manuel par WIF (`deploy.yml`, `preview.yml`, inactifs), sauvegardes planifiées + PITR, App Check (désactivé), quotas du proxy IA, en-têtes de sécurité, audit des dépendances en CI. Reste (humain) : runbooks `CI-DEPLOIEMENT`, `SAUVEGARDES`, `APP-CHECK`, `CLE-API-WEB`, `PROXY-IA` ; arrêt de Cloud Run AI Studio ; nettoyage J+30 | `feat/durcissement` |

Branches empilées : `docs/analyse-et-plan` ← `chore/socle-dev` ← `fix/lot0-securite` ← `feat/multi-tenant`
← `fix/revue-securite` (revue, étape 2) ← `feat/durcissement` (durcissement, étape 2).

### Étape 2 — durcissement (22/10/2026, `feat/durcissement`)
Détail et actions humaines : [`docs/RAPPORT-ETAPE-1.md`](RAPPORT-ETAPE-1.md) § 6 ; décisions D42–D51.

| # | Point | État |
|---|---|---|
| 1 | R-06 : fiches RH du personnel (`staffPrivate`, bureau seulement) | **Fait** (règles, couche données, migration, tests) |
| 2 | Proxy IA : quotas, taille des entrées, journaux sans données personnelles | **Fait** |
| 3 | App Check | **Préparé, désactivé** (runbook) |
| 4 | Dépendances (`npm audit`) | **Fait** : production 0 vulnérabilité ; 5 restantes dans `firebase-tools` (outil de dev) |
| 5 | Déploiement GitHub Actions (WIF, environnements) | **Préparé, inactif** (runbook) |
| 6 | Sauvegardes (export planifié, PITR) | **Préparé, désactivé** (runbook) |
| 7 | Rewrite `/api/**` | **Testé** (local et CI) |
| 8 | `index.html` générique, en-têtes, cache, Playwright sous CSP | **Fait** |
| 9 | Restriction de la clé API web | Runbook (humain) |
| 10 | Photos | Filet de sécurité fait ; Cloud Storage **planifié** (D51) |

## Modèles Claude
- **Opus 5.5** : lots 0, 4, 5 et 6.
- **Sonnet 5.5** : lots 1, 7 et 8.
- **Haiku 5.5** : ré-analyses (`scripts/reanalyse.sh`).
- **Fable 5.1** : une relecture adverse des règles et du script de migration avant la bascule.

## Décisions en attente (rapport § 7)
1. Date d'arrivée de la deuxième école.
2. Quelle URL les utilisateurs ouvrent-ils : Hosting ou `run.app` ? (à vérifier avant le Lot 0)
3. ~~Garde-t-on les portails parent et élève en v1 ?~~ Oui, accès restreint aux élèves liés (D1).
4. ~~Nom d'utilisateur unique sur toute la plateforme, ou code par école ?~~ Unique sur la plateforme (D2, D24).
5. Création du projet Firebase de dev (facturation) et localisation de la base Firestore (nécessaire pour la région des triggers).
