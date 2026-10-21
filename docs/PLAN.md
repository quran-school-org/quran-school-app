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

## Modèles Claude
- **Opus 5.5** : lots 0, 4, 5 et 6.
- **Sonnet 5.5** : lots 1, 7 et 8.
- **Haiku 5.5** : ré-analyses (`scripts/reanalyse.sh`).
- **Fable 5.1** : une relecture adverse des règles et du script de migration avant la bascule.

## Décisions en attente (rapport § 7)
1. Date d'arrivée de la deuxième école.
2. Quelle URL les utilisateurs ouvrent-ils : Hosting ou `run.app` ?
3. Garde-t-on les portails parent et élève en v1 ?
4. Nom d'utilisateur unique sur toute la plateforme, ou code par école ?
5. Création du projet Firebase de dev (facturation) et localisation de la base Firestore.
