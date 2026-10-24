# Audit fonctionnel et UX — octobre 2026

Base : captures de tous les écrans pour 5 rôles (directeur, administratif,
enseignant, parent, élève), bureau 1440 px et mobile 390 px, sur les émulateurs
(données fictives, `tests/e2e/captures.spec.ts`), plus lecture du code des
écrans. Rien n'a été fait sur la prod ni sur l'école réelle du dev.

## 1. État fonctionnel

- Les parcours testés passent : 29 tests de bout en bout sur 30 (le 30ᵉ, le test
  de la CSP, demande de lancer le serveur avec `E2E_CSP=1` ; ce n'est pas un bug),
  126 tests unitaires, 275 tests sur émulateurs (les 4 échecs viennent de
  Windows : `spawnSync("npx")` sans shell).
- Bugs et incohérences relevés :
  1. **Le statut « lu » des notifications est commun à tout le personnel** :
     `isRead` est un champ du document partagé (`src/db.ts:346`). Si une personne
     ouvre une notification, elle devient « lue » pour tout le monde.
  2. **Bruit dans les notifications** : chaque modification de profil génère une
     notification visible de tout le personnel (« تعديل البيانات الشخصية »). Les
     vraies alertes se noient.
  3. **Le parent voit des outils de bureau** sur « متابعة أبنائي » : export des
     données, filtre « الطلاب النشطون », bouton « مراسلة ولي الأمر عبر واتساب »
     (il s'écrit à lui-même), impression de la carte d'élève.
  4. **La cloche des comptes famille** affiche un compteur, alors que les règles
     interdisent aux familles de lire les notifications (R-07) : à vérifier.
  5. **Texte figé sur l'école n°1** : « حساب المدير الأساسي (@admin_alfajr) » dans
     la fenêtre de compte, affiché aussi dans une autre école.
  6. **Mobile enseignant** : le tableau « قائمة الطلاب » déborde à droite ; la
     colonne « التجويد » est coupée.
  7. **Synchronisation des fiches** : en enregistrant le suivi du hifz,
     l'enseignant réécrit toute la fiche de l'élève (y compris `isArchived`),
     ce qui peut annuler un archivage fait entre-temps par le bureau.

## 2. Ce que chaque métier fait au quotidien, et ce qu'il voit

| Rôle | Ce qu'il fait au quotidien | Ce qu'il voit en premier | Ce qui gêne |
|---|---|---|---|
| Directeur | suivre l'école, valider, gérer les comptes | « خريطة الحفظ » (grande carte des 60 ahzab), puis les indicateurs | l'action utile (« تحتاج إجراء ») est au milieu de la page ; boutons « sauvegarde / restauration » en tête du tableau de bord ; rien sur « aujourd'hui » (présences du jour, impayés du mois) |
| Administratif | inscrire, encaisser, imprimer reçus et cartes | le même tableau de bord que le directeur | pas d'accès direct à « encaisser un paiement » ou « inscrire un élève » ; 12 entrées de menu |
| Enseignant | faire l'appel, noter le hifz, préparer les examens | un texte de bienvenue, puis 4 chiffres | l'appel du jour et la saisie du hifz ne sont pas des boutons visibles ; tableau qui déborde sur téléphone |
| Parent | savoir si son enfant vient, progresse, et ce qu'il doit payer | une liste de recherche de type « bureau » | aucune synthèse ; outils inutiles (export, WhatsApp à soi-même) |
| Élève | voir son hifz et ses résultats | idem parent | idem |
| Bénévole, entretien, autre | presque rien | tableau de bord et notifications | voit des notifications de bureau (et des montants : constat de sécurité A-01) |

## 3. Propositions (classées par gain / effort)

### P1 — Accueil par rôle : « aujourd'hui » d'abord (gain fort, effort moyen)
- **Directeur / administratif** : en haut, une bande « À faire aujourd'hui » :
  appel non fait par halaqa, impayés du mois (nombre et montant), dossiers
  incomplets, comptes à créer. Puis 4 boutons d'action : « Inscrire un élève »,
  « Encaisser », « Faire l'appel », « Imprimer ». La carte du hifz descend plus
  bas. Sauvegarde et restauration passent dans Paramètres.
- **Enseignant** : écran « Ma halaqa aujourd'hui » : un gros bouton « Faire
  l'appel » (avec le QR), puis la liste des élèves, chacun avec « + hifz » en
  un geste. Les statistiques passent sous la liste. Liste en cartes sur mobile
  (plus de tableau).
- **Parent / élève** : une carte par enfant : présence des 4 dernières semaines,
  hizb actuel et progression, dernière note, prochaine cotisation. Rien d'autre
  à l'accueil.

### P2 — Création de comptes en 3 étapes (gain fort, effort moyen)
Aujourd'hui, une seule grande fenêtre : nom, identifiant (manuel ou bouton),
mot de passe tapé par le directeur, rôle (libellés arabe + anglais), statut,
liens, puis une matrice de droits « type Odoo ». Proposition :
1. **Qui ?** Le rôle en cartes avec icône (Enseignant, Administratif, Parent,
   Élève, Bénévole…), sans anglais.
2. **Relié à quelle fiche ?** On choisit la fiche du personnel ou les enfants.
   Pour un parent : les enfants proposés d'après le téléphone du parent saisi
   dans la fiche élève (proposition seulement, confirmée à la main : pas de
   rapprochement automatique, règle du projet).
3. **Identifiants** : identifiant et mot de passe temporaire **générés**
   automatiquement, montrés une seule fois, avec « Copier » et « Imprimer la
   fiche de connexion » (texte prêt pour WhatsApp, en arabe).
- **Mieux encore** : un bouton « Créer le compte » directement sur la fiche d'un
  enseignant ou d'un élève (« Créer le compte du parent ») : les étapes 1 et 2
  sont alors déjà remplies.
- **Création en lot** pour la rentrée : « Créer les comptes parents de la
  halaqa X » → une fiche de connexion par famille à imprimer.
- **Matrice de droits** : la cacher derrière « Droits avancés », et surtout
  **la rendre honnête** : aujourd'hui elle n'est appliquée nulle part côté
  serveur (D81). Un directeur qui retire « modifier les notes » à un enseignant
  croit l'avoir fait, alors que l'enseignant peut toujours le faire. Deux
  options à trancher : la retirer, ou l'appliquer dans les règles Firestore
  (plus long, plus de tests).
- **Liste des comptes** : retirer les « •••••••• » (aucun mot de passe n'est
  stocké, ça trompe) et les puces de modules identiques pour tous ; regrouper
  par rôle avec des onglets (Personnel / Parents / Élèves) et un filtre « jamais
  connecté ».

### P3 — Notifications utiles (gain moyen, effort faible)
- Statut « lu » par personne (sous-collection ou liste `readBy`).
- Plus de notification pour une modification de profil.
- Destinataires par type : finances → bureau seulement (corrige aussi A-01).

### P4 — Menus plus courts (gain moyen, effort faible)
- Enseignant : 4 entrées (Ma halaqa, Appel, Examens, Activités).
- Parent / élève : 3 entrées (Mes enfants, Résultats, Cotisations).
- Bénévole / entretien : Activités seulement.

### P5 — Petits correctifs (gain moyen, effort faible)
- Les bugs 3 à 7 de la section 1.

## 4. À décider par Mélik
1. Matrice de droits : la retirer ou la rendre réelle côté serveur ?
2. Ordre des chantiers : on propose P3 + P5 (rapides, et P3 corrige une faille),
   puis P2 (comptes), puis P1 (accueils), puis P4.
3. Toute modification visible passe d'abord sur l'école **Test** du dev pour
   validation, jamais sur l'école réelle.
