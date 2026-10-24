# Documentation

Par où commencer selon ce qu'on vient faire.

| Je veux… | Lire |
|---|---|
| comprendre le projet en arrivant | [`PASSATION.md`](PASSATION.md), puis [`../CLAUDE.md`](../CLAUDE.md) |
| savoir pourquoi un choix a été fait | [`DECISIONS.md`](DECISIONS.md) (D1 à D8x : contexte, décision, retour arrière) |
| voir l'avancement | [`PLAN.md`](PLAN.md) |
| préparer ou exécuter une mise en prod | [`GUIDE-MISE-EN-PROD.md`](GUIDE-MISE-EN-PROD.md), puis [`runbooks/OPERATIONS-CLAUDE.md`](runbooks/OPERATIONS-CLAUDE.md) |
| prévenir les utilisateurs | [`communication/`](communication/) |
| connaître les obligations légales (loi 09-08) | [`conformite/CNDP.md`](conformite/CNDP.md) (à valider par un juriste) |
| relire la sécurité | [`revues/`](revues/) |

## Contenu

### Repères
- [`PASSATION.md`](PASSATION.md) : document d'arrivée (environnements, règles, accès).
- [`PLAN.md`](PLAN.md) : lots et avancement.
- [`DECISIONS.md`](DECISIONS.md) : toutes les décisions structurantes.
- [`analyse/RAPPORT-ANALYSE.md`](analyse/RAPPORT-ANALYSE.md) : analyse de la version AI Studio d'origine, failles S1 à S9, plan multi-écoles.

### Mise en production et exploitation
- [`GUIDE-MISE-EN-PROD.md`](GUIDE-MISE-EN-PROD.md) : liaison GitHub ↔ Google Cloud et les trois « go » du propriétaire.
- [`PROMPT-NAVIGATEUR.md`](PROMPT-NAVIGATEUR.md) : consignes pour un agent qui configure la console dans le navigateur.
- [`runbooks/`](runbooks/) : procédures pas à pas, avec critères d'arrêt.

| Runbook | Sujet |
|---|---|
| [`OPERATIONS-CLAUDE.md`](runbooks/OPERATIONS-CLAUDE.md) | déroulé complet, du Lot 0 à la bascule |
| [`LOT0-DEPLOIEMENT.md`](runbooks/LOT0-DEPLOIEMENT.md) | déploiement du Lot 0 |
| [`MIGRATION-BASCULE.md`](runbooks/MIGRATION-BASCULE.md) | migration vers le multi-écoles |
| [`NOUVELLE-ECOLE.md`](runbooks/NOUVELLE-ECOLE.md) | accueillir une nouvelle école |
| [`CI-DEPLOIEMENT.md`](runbooks/CI-DEPLOIEMENT.md) | workflows GitHub et identités sans clé |
| [`SAUVEGARDES.md`](runbooks/SAUVEGARDES.md) | exports planifiés et restauration |
| [`APP-CHECK.md`](runbooks/APP-CHECK.md) | App Check |
| [`CLE-API-WEB.md`](runbooks/CLE-API-WEB.md) | restriction de la clé API web |

### Utilisateurs
- [`communication/guide-directeur.md`](communication/guide-directeur.md) : guide du directeur.
- [`communication/identifiants.md`](communication/identifiants.md) : remise des identifiants.
- [`communication/maintenance.md`](communication/maintenance.md) : message de maintenance.

### Sécurité
- [`revues/REVUE-SECURITE-ETAPE-2.md`](revues/REVUE-SECURITE-ETAPE-2.md) : première revue.
- [`revues/REVUE-SECURITE-DURCISSEMENT.md`](revues/REVUE-SECURITE-DURCISSEMENT.md) : revue du durcissement.

### Design
- [`design/AVANCEMENT.md`](design/AVANCEMENT.md) : avancement de la charte, écran par écran.
- [`design/captures/`](design/captures/) : captures avant / après (données fictives).
- [`../design/`](../design/) : maquette de référence de la charte (fichiers `.dc.html`, pas du code de l'app).

### Historique des étapes
- [`RAPPORT-ETAPE-1.md`](RAPPORT-ETAPE-1.md) : socle, Lot 0 et multi-écoles.
- [`progress/`](progress/) : comptes rendus de l'étape 2 (design, durcissement, intégration, revues).
