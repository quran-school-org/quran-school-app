# Audit UX/UI : interface arabe, 26/10/2026

> **Statut : rapport seul, aucune correction appliquée.** Les corrections attendent l'accord du propriétaire.
> **Périmètre :** interface **arabe** (RTL) uniquement ; le français est hors périmètre pour l'instant.
> **Version auditée :** `main` après les PR 47 et 48 (aperçu par rôle, activités famille, flash de thème).
> **Données :** fictives, sur les émulateurs (`demo-quran-school`). Aucune donnée réelle n'a été utilisée.

Le rapport repose sur trois volets :

1. **Balayage automatique** (Playwright, spec `tests/e2e/audit-ux.spec.ts`, script `npm run audit:ux`).
   - 454 états capturés à 1 440 et 390 px : 8 comptes (directeur, administratif, enseignant, parent, élève, encadrant, entretien, directeur d'une école peu garnie) et l'écran de connexion.
   - Contrôles mesurés : débordements, chevauchements, textes coupés, cibles tactiles, écrans vides ou en erreur, RTL, accessibilité de base.
   - Détail : annexe A.
2. **Revue du design system sur le code** (skill `design:design-system`).
   - Jetons, composants partagés, adoption, RTL, libellés.
   - Détail : annexe B.
3. **Critique de design sur les captures** (skill `design:design-critique`).
   - Écrans examinés : tableau de bord directeur, comptabilité, accueil parent mobile, tiroir mobile.
   - Détail : section 3.

---

## 1. Synthèse

**Verdict général : l'application est saine et utilisable. Rien n'est bloquant.**
- Aucun débordement horizontal de page, aucun écran vide ni en erreur, aucune image sans texte alternatif, aucune icône de direction à l'envers, sur les 454 états balayés.
- L'identité visuelle est cohérente : thème vert et or, titres calligraphiques, menus par rôle clairs.

Les défauts se concentrent dans trois zones.

1. **Le tiroir du menu sur mobile.**
   - Le bas du menu est coupé quand le compte a deux écoles : la carte de statistiques est inaccessible.
   - Le nom de l'école passe sous le bouton « × ».
   - Tout le monde le voit sur téléphone : c'est le correctif le plus visible.
2. **Les écrans anciens non migrés vers les composants partagés.**
   - Écrans concernés : finance, activités, personnel, paramètres, cartes d'identité. Ils représentent environ 80 % des écarts.
   - Les fenêtres faites à la main ne se ferment pas avec Échap et ne sont pas annoncées aux lecteurs d'écran.
   - Les champs n'ont pas d'étiquette reliée.
   - Messages et confirmations passent par les `alert()` et `confirm()` du navigateur (52 et 15), y compris pour supprimer des écritures financières.
3. **Le confort sur mobile** :
   - petites cibles tactiles (cases de 16 px, barres de 9 px, icônes de 36 px) ;
   - listes déroulantes trop étroites (mois illisible) ;
   - contraste un peu faible du gris secondaire (4,3:1 au lieu de 4,5:1).

| Gravité | Nombre | Exemples |
|---|---|---|
| Bloquant | 0 | — |
| Majeur | 11 | tiroir rogné, nom sous « × », fenêtres sans Échap, champs sans étiquette, `alert()`/`confirm()` natifs, boutons « enregistrer » rouges |
| Mineur | 14 | cibles 24-44 px, contraste `ink-3`, nom d'école tronqué, tableaux bruts, RTL physique, libellés incohérents |
| Cosmétique | ~6 | devise « درهم » / « د.م », formats de nombres, échelle typographique |

---

## 2. Constats priorisés (fusion des trois volets)

Légende des sources : **A** = balayage, **B** = revue du code, **C** = critique des captures.

### Majeurs

| # | Constat | Impact utilisateur | Où | Source | Correction proposée |
|---|---|---|---|---|---|
| 1 | Tiroir mobile : le bas du menu est coupé (contenu de 893 px dans un écran de 844 px, `overflow-hidden`) | Carte de statistiques inaccessible ; sur un petit téléphone, « خروج » peut disparaître | `src/ui/SideNav.tsx:37`, `src/ui/AppShell.tsx:38` | A (confirmé à l'œil) | Retirer `overflow-hidden` du `<nav>` et laisser défiler l'`aside` |
| 2 | Tiroir mobile : le nom de l'école passe sous le bouton « × » | Nom illisible, bouton difficile à viser | `src/shell/AppFrame.tsx:154` (`pt-16` en conflit avec `pt-6`) | A, C (confirmé à l'œil) | Réserver la place du bouton fermer (marge en fin de ligne) ou le sortir de la zone du logo |
| 3 | 12 fenêtres refaites à la main au lieu de `Modal` (recette, salaire, dépense, activité, personnel, compte, badge…) | Pas de fermeture par Échap, pas de `role="dialog"`, focus non piégé | `finance/IncomeModal.tsx:39`, `ExpenseModal.tsx:39`, `SalaryModal.tsx:51`, `activities/ActivityFormModal.tsx:50`, `staff/StaffFormModal.tsx:64`, `settings/UserFormModal.tsx:68`… | A, B (confirmé) | Passer sur `src/ui/Modal.tsx` sans changer le contenu |
| 4 | 732 champs (44 composants) avec un `<label>` non relié | Lecteur d'écran muet ; un clic sur l'étiquette ne donne pas le focus | mêmes fenêtres et `settings/GeneralSettingsSection.tsx:91` | A, B (confirmé) | Utiliser `FormField` (`src/ui/Form.tsx:31`), qui relie l'étiquette au champ |
| 5 | 52 `alert()` et 15 `confirm()` natifs, y compris pour les suppressions financières ; le composant `Toast` existe mais n'est jamais affiché | Fenêtres grises du navigateur hors charte ; sur mobile, risque de valider par erreur | transversal | B | Brancher `Toast` (succès et erreurs) et un `ConfirmDialog` de la charte pour les suppressions |
| 6 | Boutons « × » et « poubelle » sans nom accessible | Annoncés « bouton » sans plus | `ActivityFormModal.tsx:57`, `UserFormModal.tsx:70`, `StaffBadgeModal`, `GeneralSettingsSection` | A, B | `aria-label` (« إغلاق », « حذف ») |
| 7 | Cibles tactiles sous 24 px à 390 px : cases des cartes d'identité (16 px), barres de la carte du hifz (9 px), curseur d'échelle (6 px), liens e-mail et téléphone (19,5 px) | Difficile à toucher au doigt | `src/screens/IdCardsScreen.tsx:120,197`, `src/ui/HifzMap.tsx:79`, `staff/StaffList.tsx:155` | A (confirmé pour les cartes) | Zone tactile de 44 px autour (padding ou étiquette cliquable) sans changer le dessin |
| 8 | Listes déroulantes trop étroites à 390 px : le mois « يوليوز » est illisible, « الصند… » est coupé, sans `title` | Valeur choisie invisible | `src/ui/Select.tsx:416`, grilles à 3 colonnes de `SalaryModal` et `GeneralSettingsSection` | A (confirmé à l'œil) | 1 colonne sous `sm`, et `title` sur la valeur tronquée |
| 9 | Contraste très faible : bandeau de la fenêtre compte (2,53:1), compte archivé (2,92:1), montants dorés « قيد الانتظار » (3,2:1) | Texte peu lisible | `settings/UserFormModal.tsx:70`, `finance/SalariesSection.tsx` | A (probable) | Utiliser les jetons de texte sur fond sombre et un or plus foncé pour le texte |
| 10 | Bouton « enregistrer » d'une dépense en rouge (couleur réservée au danger) | Fait croire à une suppression | `finance/ExpenseModal.tsx:166` | B | Variante primaire de `Button` |
| 11 | « تنزيل نسخة احتياطية » et surtout « استرجاع نسخة » en haut du tableau de bord | Action rare et risquée (restauration) placée au premier plan de l'écran le plus consulté | tableau de bord directeur | C | Déplacer vers Paramètres, section « النسخ الاحتياطي » ; garder une confirmation forte |

### Mineurs

| # | Constat | Où | Source | Correction proposée |
|---|---|---|---|---|
| 12 | Gris secondaire `text-ink-3` à 4,27-4,41:1 sur fond sable (~20 composants : pied de page, listes, fiche élève) | `src/index.css:38` | A | Foncer le jeton d'environ 6 % ; un seul changement suffit |
| 13 | Nom de l'école tronqué sans `title` dans la barre du haut à 390 px | `src/shell/AppFrame.tsx:174` | A, C | `title` avec le nom complet ; nom court si l'école en a un |
| 14 | Cibles de 24 à 44 px : icônes de 36 px des cartes d'élève, pastilles de filtre de 32 px, « × » des fenêtres de 40 px | `src/ui/Button.tsx` (`IconButton sm`), `src/ui/Modal.tsx` | A | Taille par défaut 44 px sur mobile |
| 15 | 11 fichiers en `<table>` brut, sans mode cartes sur mobile | finance, présence, notes… | B | `DataTable` (déjà utilisé ailleurs) |
| 16 | Environ 126 propriétés physiques au lieu des propriétés logiques RTL (`ml-`/`mr-`, `text-left`/`text-right`, bordures) | transversal | B | Remplacement mécanique (`ms-`/`me-`, `text-start`/`text-end`) |
| 17 | Gris `ink*` et `sand-500…950` non redéfinis par les thèmes (31 jetons sur 86 seulement) ; le badge du personnel force le bleu nuit | `src/theme/palettes.ts`, `StaffBadgeModal.tsx:39` | B | Faire dériver ces jetons de la palette ; laisser le badge suivre le thème |
| 18 | Deux classes pointent vers des jetons inexistants : `text-primary-2`, `border-sand-150` | `ActivityWorkspace.tsx:705`, `IdCardsScreen.tsx:117` | B | Remplacer par des jetons qui existent |
| 19 | 879 tailles `text-[Npx]` réparties sur 23 valeurs ; 25 combinaisons de styles de titres | transversal | B | Échelle `--text-*` en 6 à 7 pas, et un composant `SectionHeader` |
| 20 | Graphique de présence de la semaine : 3 cases vides sans message quand il n'y a pas encore de données | tableau de bord | C | État vide explicite (« لم يُسجَّل حضور هذا الأسبوع بعد ») |
| 21 | Le bouton principal de Comptabilité est « طباعة التقرير المالي الختامي », alors que l'action fréquente est d'ajouter une recette ou une dépense | comptabilité | C | Bouton d'impression en secondaire ; mettre en avant l'ajout selon le sous-onglet |
| 22 | Dates au format ISO (`2026-10-01`) dans l'accueil parent et les tableaux | transversal | C | Format lisible (« 1 أكتوبر 2026 ») ; ISO seulement dans les exports |
| 23 | Requête Firestore en 409 (conflit) à la connexion d'un directeur | `src/session/` (écriture `lastLogin`) | A | À investiguer ; c'est sans effet visible |
| 24 | Libellés incohérents : 7 verbes pour « ajouter », « حفظ التغييرات » et « حفظ التعديلات », « درهم » ×11 et « د.م » ×47 | transversal | B | Glossaire court, puis remplacement |

### Cosmétiques
- Nombres formatés différemment : « 3 200 » avec séparateur, « 1320 » sans (en-têtes de la comptabilité). Utiliser un seul formateur `Intl.NumberFormat`.
- La devise est placée avant ou après le montant selon les blocs.
- `dir="ltr"` sur des textes qui mêlent arabe et latin (« annour • لست عضواً ») : l'ordre est correct à l'œil, à vérifier.

---

## 3. Critique de design (captures)

### Tableau de bord directeur (1 440 px)
- **Première impression :** riche et identitaire. La « خريطة الحفظ » sur fond vert sombre attire l'œil en premier, ce qui est juste : c'est la vue propre à une école coranique.
- **Hiérarchie :** le bloc « تحتاج إجراء » (documents manquants, élève sans halaqa, présence non saisie) est la meilleure idée de l'écran, mais il arrive en 3ᵉ position. Le placer juste sous les chiffres clés, voire au-dessus de la carte, quand il contient des alertes.
- **Carte du hifz :** environ 300 px de haut, même quand tous les élèves sont regroupés ; beaucoup de vide. Hauteur adaptative ou repliable.
- **Sauvegarde et restauration** au premier plan : voir le constat 11.
- **Points forts :** chiffres clés lisibles, barres de progression des enseignants (hifz et tajwid), filtres par halaqa.

### Comptabilité (1 440 px)
- Très complète et claire : solde net en rouge avec « عجز مالية الجمعية », sous-onglets, tableaux triables.
- La densité est forte (4 blocs l'un sous l'autre). La recherche et le filtre d'année sont en haut à gauche, loin des tableaux qu'ils filtrent.
- Actions de ligne (crayon, poubelle) en 16 px : petites et peu visibles.

### Accueil parent (390 px)
- **C'est l'écran le plus réussi.** Une carte par enfant, des sections lisibles (hifz, dernier examen, présence, cotisation du mois), une action principale (« ملف الطالب ») et deux secondaires.
- La barre de 60 segments est très fine sur mobile. Le texte « 5 / 60 حزباً » compense, mais un anneau ou une barre continue serait plus lisible.
- Dates ISO : voir le constat 22.

### Tiroir mobile (390 px)
- Bonne organisation par sections (التعليم, المالية, الإدارة), avec la carte « ملخص أبنائك » en bas.
- Défauts confirmés : nom de l'école sous « × » et bas coupé (constats 1 et 2).

---

## 4. Plan de correction proposé (en attente d'accord)

Les lots sont ordonnés par rapport gain/risque. Aucun ne change les couleurs ni la mise en page générale.

| Lot | Contenu | Constats | Taille | Risque |
|---|---|---|---|---|
| **L1 : mobile, rapide** | Tiroir (défilement, bouton « × »), listes déroulantes à 390 px, `title` sur les textes coupés, jeton `ink-3`, cibles sous 24 px, `aria-label` des boutons icône | 1, 2, 6, 7, 8, 12, 13 | ~1 jour | faible |
| **L2 : fenêtres** | Les 12 fenêtres passent sur `Modal` (Échap, focus, `role="dialog"`), avec un test e2e par fenêtre | 3, 9, 10 | ~2-3 jours | moyen (finance) |
| **L3 : formulaires** | `FormField` partout dans ces fenêtres (étiquettes reliées, erreurs de champ) | 4 | ~2 jours | faible |
| **L4 : retours utilisateur** | `Toast` + `ConfirmDialog` à la place des `alert()`/`confirm()` | 5 | ~2 jours | moyen |
| **L5 : hiérarchie** | Sauvegarde déplacée dans Paramètres, « تحتاج إجراء » remonté, bouton principal de Comptabilité, état vide de la présence, dates lisibles | 11, 20, 21, 22 | ~1-2 jours | faible, mais à valider à l'œil par toi |
| **L6 : système** | RTL logique, tableaux en `DataTable`, échelle typographique, jetons thématisés, libellés et devise | 14-19, 24, cosmétiques | ~5-8 jours, étalable | faible à moyen |

**Recommandation :** L1 tout de suite, car c'est le plus visible sur téléphone, puis L2 et L3 ensemble. L4 à L6 au fil des semaines.

---

## Annexes

- **Annexe A** : résultats bruts du balayage (couverture, volumes, constats, faux positifs).
- **Annexe B** : revue détaillée du design system sur le code (inventaire, constats, plan en 9 lots).
- Captures et JSON : générés à la demande par `AUDIT_DIR=<dossier> npm run audit:ux` (non versionnés).


---

# Annexe A : balayage automatique


Branche `audit/ux-ui-ar`, aucun fichier de `src/` modifié. Données fictives, émulateurs (`demo-quran-school`) seulement.
Spec : `tests/e2e/audit-ux.spec.ts` ; script : `AUDIT_DIR=<dossier> npm run audit:ux`
(dans le conteneur : `flock /home/user/.emulators.lock scripts/dev/without-proxy.sh npm run audit:ux`).
Sorties dans ce dossier : `<rôle>/<écran>-<largeur>.png`, `constats.json` (3491 constats bruts, un par état),
`constats-dedupe.json` (194 composants uniques avec la liste des écrans), `couverture.json` (454 états).

### 1. Couverture

454 états audités et capturés (écrans, sous-onglets, fenêtres, filtres ouverts, cadre), **0 état inaccessible** (aucun échec de capture ni de sonde).
Un « état » = un écran ou une fenêtre à une largeur donnée. Les deux largeurs ont exactement les mêmes états (mobile : navigation par le tiroir).

| Rôle (compte) | États à 1 440 px (capturés / total) | États à 390 px (capturés / total) | Onglets du menu |
|---|---|---|---|
| directeur | 49 / 49 | 49 / 49 | 12 : activities, attendance, classes, dashboard, finance, grades, id-cards-lab, notifications, payments, settings, students, teachers |
| administratif | 43 / 43 | 43 / 43 | 11 : activities, attendance, classes, dashboard, finance, grades, id-cards-lab, notifications, payments, students, teachers |
| enseignant | 25 / 25 | 25 / 25 | 8 : activities, attendance, classes, grades, id-cards-lab, notifications, students, teacher-dashboard |
| parent | 14 / 14 | 14 / 14 | 8 : activities, attendance, classes, grades, home, notifications, payments, students |
| eleve | 12 / 12 | 12 / 12 | 7 : activities, attendance, classes, grades, home, notifications, students |
| encadrant | 25 / 25 | 25 / 25 | 8 : activities, attendance, classes, dashboard, grades, id-cards-lab, notifications, students |
| entretien | 12 / 12 | 12 / 12 | 5 : activities, classes, grades, notifications, students |
| directeur-annour | 45 / 45 | 45 / 45 | 12 : activities, attendance, classes, dashboard, finance, grades, id-cards-lab, notifications, payments, settings, students, teachers |
| connexion | 2 / 2 | 2 / 2 | 0 : - |

Chaque rôle : onglets, sous-onglets (finance, paramètres), fenêtres de saisie ouvertes puis annulées (élève, modifier élève, classe, examen, paiement, relevé mensuel,
recette / salaire / dépense, activité, personnel, badge, compte, carte d'élève), fiche élève, détail d'activité, liste déroulante de filtre ouverte,
barre du haut, menu latéral (1 440) ou tiroir (390), profil, cloche, sélecteur d'école ouvert et page de choix d'école (comptes multi-écoles / super-admin).
`connexion` : écran de connexion et état « identifiants refusés » aux deux largeurs. `directeur-annour` = école peu garnie (listes presque vides : 2 élèves, 1 halaqa, 0 paiement/examen/présence).
`encadrant` et `entretien` ont été ajoutés aux cinq rôles demandés (même procédure).

### Non couvert
- Écran « mot de passe imposé » (comptes migrés) : franchi par `loginAs`, non capturé (ne se produit qu'à la première connexion).
- Scanner caméra (`open-scanner`, demande de permission), fenêtres d'impression (`printWindow`), PDF/export : volontairement non ouverts.
- Toute action d'écriture (enregistrer, archiver, supprimer, confirmations `confirm()`), états de chargement, toasts, survol et focus clavier, contraste des états `:hover`/`:focus`.
- Pagination au-delà de la page 1, liste d'élèves avec plus de 8 lignes, rôles `مدرس` d'annour, rôle `أخرى`, aperçu par rôle du super-admin, création d'école.
- Interface en français (hors périmètre demandé).
- Limite d'environnement : Google Fonts est inaccessible depuis Chromium du conteneur (certificat du proxy) ; les polices Reem Kufi, IBM Plex Sans Arabic et Amiri ont été installées localement dans `~/.fonts` pour que les largeurs de texte soient celles de la production.
  Les erreurs réseau « fonts.googleapis.com » du JSON sont donc du bruit d'environnement.
- Les contrôles de chevauchement par `elementFromPoint` et le test des icônes directionnelles n'ont rien remonté de réel (voir faux positifs).

### 2. Volumétrie

| Type de constat | Bruts | Uniques (dédoublonnés) |
|---|---|---|
| contraste-insuffisant | 1286 | 21 |
| cible-tactile-inf-44 | 943 | 78 |
| champ-sans-label | 732 | 44 |
| cible-tactile-inf-24 | 172 | 7 |
| texte-tronque | 159 | 14 |
| fenetre-sans-role-dialog | 44 | 5 |
| fenetre-echap-sans-effet | 44 | 7 |
| bouton-sans-nom | 36 | 5 |
| rtl-direction-ltr | 24 | 4 |
| console-erreur | 17 | 3 |
| requete-echouee | 10 | 1 |
| debordement-parent | 9 | 2 |
| chevauchement-interactifs | 8 | 1 |
| reponse-http-erreur | 7 | 2 |

Aucun constat de : débordement horizontal de la page (`scrollWidth > innerWidth` : jamais, 454 états), écran vide, texte d'erreur (« خطأ », « undefined », « NaN »…), image sans `alt`, bouton flottant recouvrant un bouton, icône directionnelle à l'envers, `pageerror`.

### 3. Constats par gravité (vérification : « confirmé visuellement », « probable », « faux positif »)

Gravité : bloquant = empêche une tâche ; majeur = tâche gênée ou inaccessible à une catégorie d'utilisateurs ; mineur = gêne ; cosmétique.
Chemins de capture relatifs à ce dossier. **Bloquant : 0.**

### MAJEUR

| # | Constat | Type | Écran / rôle / largeur | Capture | Vérification | Cause probable |
|---|---|---|---|---|---|---|
| M1 | Tiroir mobile : le bas du menu est rogné (nav 893 px de contenu dans 844 px, carte de statistiques coupée, non atteignable car `overflow-hidden`) ; sur téléphone plus court, « خروج » ou la carte peuvent disparaître | texte-tronque | tiroir, directeur et administratif (comptes à 2 écoles), 390 | `directeur/tiroir-390.png` | **confirmé visuellement** | `src/ui/SideNav.tsx:37` (`overflow-hidden` sur le `<nav>`) dans un `<aside overflow-y-auto>` de `src/ui/AppShell.tsx:38` ; `src/shell/AppFrame.tsx:154` |
| M2 | Tiroir mobile : le nom de l'école (long) passe sous le bouton « × » de fermeture (chevauchement bouton de marque / bouton fermer, 1 600 px²) | chevauchement | tiroir, tous rôles à 2 écoles, 390 | `directeur/tiroir-390.png` | **confirmé visuellement** | `pt-16` passé par `AppFrame.tsx:154` est en conflit avec `pt-6` de `SideNav.tsx:37` ; bouton fermer `AppShell.tsx:39` en `absolute top-4 end-4` |
| M3 | Étiquettes non reliées aux champs (`<label>` sans `htmlFor`, ni champ imbriqué) : 732 champs dans 44 composants (recette, salaire, dépense, activité, personnel, compte, paramètres généraux, cartes d'identité) ; placeholder seul comme nom pour beaucoup | champ-sans-label | fenêtres de saisie et paramètres, directeur/administratif, 1 440 et 390 | `directeur/finance--fenetre-income-form-1440.png`, `directeur/settings--general-390.png` | **confirmé** (code + sonde) | `src/components/finance/IncomeModal.tsx:58`, `…/ExpenseModal.tsx`, `…/SalaryModal.tsx`, `src/components/activities/ActivityFormModal.tsx:67`, `src/components/settings/GeneralSettingsSection.tsx:91` ; modèle correct : `src/ui/Form.tsx:31` (`FormField`) |
| M4 | 7 fenêtres n'ont ni `role="dialog"`/`aria-modal`, ni titre associé, et **Échap ne les ferme pas** (fermeture au bouton seulement) : recette, salaire, dépense, activité, personnel, compte (+ badge) | fenetre-sans-role-dialog / fenetre-echap-sans-effet | finance, activités, personnel, paramètres, directeur/administratif, 1 440 et 390 | `directeur/finance--fenetre-income-form-1440.png`, `directeur/finance--expenses--fenetre-expense-form-1440.png` | **confirmé** (sonde + fermeture testée) | `fixed inset-0 z-50` écrits à la main : `finance/IncomeModal.tsx:39`, `ExpenseModal.tsx:39`, `SalaryModal.tsx:51`, `activities/ActivityFormModal.tsx:50`, `staff/StaffFormModal.tsx:64`, `settings/UserFormModal.tsx:68`, `staff/StaffBadgeModal.tsx:22` ; au lieu de `src/ui/Modal.tsx` |
| M5 | Boutons icône « × » sans nom accessible : fenêtres activité, personnel, compte, badge ; réglage « supprimer une tarification » (paramètres) | bouton-sans-nom | idem M4 + `settings` | `directeur/settings-390.png` | **confirmé** (code) | `ActivityFormModal.tsx:57`, `StaffFormModal.tsx`, `UserFormModal.tsx:70`, `StaffBadgeModal.tsx`, `GeneralSettingsSection.tsx` (poubelle) : ajouter `aria-label` |
| M6 | Cibles tactiles < 24 px à 390 : barres du « خريطة الحفظ » (60 boutons de 9×236 px), cases à cocher de 16 px des cartes d'identité (40 cases), curseur d'échelle de 6 px, liens e-mail/téléphone de 19,5 px dans les cartes du personnel | cible-tactile-inf-24 | dashboard (3 rôles), id-cards-lab (5 rôles), teachers, 390 | `directeur/dashboard-390.png`, `directeur/id-cards-lab-390.png` | id-cards : **confirmé visuellement** ; hizb : **probable** (zone défilante voulue, 9 px reste inatteignable au doigt) | `src/ui/HifzMap.tsx:79`, `src/screens/IdCardsScreen.tsx:120,197`, `src/components/staff/StaffList.tsx:155` |
| M7 | Texte coupé illisible dans de petites listes déroulantes à 390 : mois « يوليوز » / « غشت » (paramètres, 20 px utiles) ; valeurs de formulaire salaire / compte / dépense (« الصند… », « أستاذ / محفظ ال… ») sans `title` | texte-tronque | settings, finance salaires, fenêtre compte, 390 | `directeur/settings-390.png`, `directeur/finance--salaries--fenetre-salary-form-390.png` | **confirmé visuellement** | `src/ui/Select.tsx:416` (`truncate`, pas de `title`) ; grille 3 colonnes trop étroite dans `finance/SalaryModal.tsx` et `settings/GeneralSettingsSection.tsx` |
| M8 | Contraste très faible : `text-ink-3` sur le bandeau sombre de la fenêtre compte (2,53:1), texte d'un compte archivé `opacity-75` (2,92:1), `text-gold-600` des montants « قيد الانتظار » (3,2:1) | contraste | fenêtre compte, comptabilité-salaires, 1 440 | `directeur/settings--users--fenetre-user-form-1440.png` | **probable** (calcul sur fond opaque) | `src/components/settings/UserFormModal.tsx:70` ; `src/components/finance/SalariesSection.tsx` ; tokens `src/index.css:36-39` |

### MINEUR

| # | Constat | Type | Où | Capture | Vérification | Cause probable |
|---|---|---|---|---|---|---|
| m1 | Contraste `text-ink-3` (#6B7080) sur fonds sable : 4,27 à 4,41:1 (< 4,5) ; ~20 composants dont le pied de page (4,27), listes, tableaux du relevé mensuel, fiche élève, badges | contraste | transversal, 1 440 et 390 | `directeur/students--fiche-eleve-1440.png` | **probable** (valeur du jeton) | `src/index.css:38` : `--color-ink-3` ; foncer d'environ 6 % suffit |
| m2 | Nom de l'école tronqué (ellipse) dans la barre du haut à 390 sur **tous** les écrans, sans `title` ; idem page de choix d'école | texte-tronque | tous les écrans à 390 ; `choix-ecole` | `eleve/students-390.png`, `directeur/choix-ecole-390.png` | **confirmé visuellement** (voulu par UI-05, mais nom ambigu entre écoles « … (بيانات تجريبية) ») | `src/shell/AppFrame.tsx:174` ; `src/school/SchoolPicker.tsx` |
| m3 | Cibles tactiles entre 24 et 44 px à 390 : actions de carte d'élève 36×36 (modifier, archiver, détails, supprimer, réinitialiser), pastilles de filtre 32 px, boutons de note 36 px, fermeture de fenêtre 40 px, « كشف شهري » 32 px (78 composants, 943 occurrences brutes) | cible-tactile-inf-44 | students, grades, settings--users, attendance, toutes fenêtres, 390 | `directeur/students-390.png` | **probable** | `IconButton size="sm"` de `src/ui/Button.tsx` (36 px) ; `src/ui/Modal.tsx` (`w-10 h-10`) |
| m4 | Texte tronqué avec ellipse mais `title` présent : horaires « من الإثنين إلى السبت (الدوام ال… » dans la carte du personnel | texte-tronque | teachers, 1 440 et 390 | `directeur/teachers-1440.png` | **confirmé visuellement** (texte récupérable au survol seulement) | `src/components/staff/StaffList.tsx` |
| m5 | Requête Firestore `commit` en 409 (Conflict) à la connexion du directeur d'annour | reponse-http-erreur | directeur-annour, connexion | — | **probable** (écriture de `lastLogin` concurrente) ; à investiguer | `src/firebase.ts` / `src/session/` |

### COSMÉTIQUE
- `rtl-direction-ltr` sur le champ « REC-… » du paiement (`text-align: end`) et le libellé « annour • لست عضواً » du choix d'école : direction `ltr` sur un texte mêlant arabe et latin, **à vérifier** (ordre des mots correct à l'œil sur `directeur/choix-ecole-390.png`).

### 4. Faux positifs écartés
| Constat brut | Raison |
|---|---|
| `debordement-parent` : `teachers` (4 px de chaque côté de la rangée de puces) | rien de visible sur `directeur/teachers-1440.png` : anneau de focus/marge négative |
| `debordement-parent` : bandeau « ملخص رصد اليوم » à 390 (0→390 contre 16→374) | **faux positif confirmé** : bandeau pleine largeur voulu (`directeur/attendance-390.png`) |
| `texte-tronque` : `line-clamp` du programme d'activité (parent, élève) | **faux positif confirmé** : « عرض المزيد » donne accès au texte (`parent/activities-390.png`) |
| `contraste` sur l'aperçu de carte d'identité (textes de 7 à 7,5 px, 2,43:1) | aperçu réduit de la carte imprimable, non lisible à l'écran par conception (`directeur/id-cards-lab-390.png`) |
| `texte-tronque` du cachet pointillé de la carte (66 > 40 px) | décor de la carte (`pointer-events-none`) |
| `rtl-direction-ltr` sur champs de codes (RIB, `REC-{YEAR}-{NO}`) | champs de codes volontairement LTR |
| `chevauchement` œil « إظهار كلمة المرور » dans le champ mot de passe (1 936 px²) | bouton intégré au champ : conception normale (filtré dans la version finale de la sonde) |
| `chevauchement` / `element-recouvert` de `details` fermé (champ « تعديل يدوي لصيغة الجدول ») | contenu non rendu d'un `<details>` fermé (filtré) |
| `element-recouvert` du tiroir (fond cliquable), du dossier enseignant ouvert | voile de fenêtre ou page sous une fenêtre (sonde recentrée sur la fenêtre) |
| `console-erreur` Google Fonts (`ERR_CERT_AUTHORITY_INVALID`) ; 400 de `signInWithPassword` | bruit d'environnement ; refus de connexion attendu |

### 5. Vérification visuelle
Captures relues : `directeur/tiroir-390`, `directeur/teachers-1440`, `directeur/attendance-390`, `directeur/dashboard-390`, `directeur/settings-390`,
`directeur/finance--salaries--fenetre-salary-form-390`, `parent/activities-390`, `directeur/choix-ecole-390`, `directeur/id-cards-lab-390`,
`directeur/finance--expenses--fenetre-expense-form-1440`, `eleve/students-390` : 11 captures, 14 constats vérifiés
(8 confirmés, 2 probables, 4 faux positifs). Les constats M3, M4, M5 et m1 sont confirmés par le code ; les autres constats ne sont pas tous relus à l'œil.

---

# Annexe B : revue du design system (code)


Revue en lecture seule du dépôt `/home/user/wt-audit-ux` (aucun fichier du dépôt modifié, aucun émulateur ni serveur lancé).
Méthode : skill `design:design-system` en mode audit, lecture de `src/index.css`, `src/theme/*`, `src/ui/*`, des décisions D83 à D94 et de `tests/unit/themes.test.ts`, puis comptages par `rg` / `grep -c` et par petits scripts de lecture (scratchpad, hors dépôt).
Périmètre des comptages : `src/**/*.tsx|ts`, **hors** `src/print/` (impression, bleu nuit volontaire) et `src/theme/`, sauf mention contraire. Les numéros de ligne sont ceux du dépôt à la date de la revue.

Remarque : `CLAUDE.md` et la consigne parlent d'un `App.tsx` de 8 500 lignes ; il en fait 163 (D52 : logique dans `src/app/`). Le code des écrans est réparti : `src/screens` (≈ 40 fichiers), `src/components` (≈ 37), `src/ui` (26 fichiers, 2 182 lignes), `src/shell`.

---

### 1. Synthèse

| | |
|---|---|
| Fichiers `.tsx` revus | 118 (≈ 31 100 lignes `.ts`/`.tsx`) |
| Composants partagés (`src/ui`) | 26 fichiers, ≈ 45 composants exportés |
| Constats | 3 majeurs, 8 mineurs, 6 cosmétiques |
| Note indicative | **72 / 100** (système et jetons solides, adoption inégale) |

**Le constat central** : le design system est bon, mais son adoption est coupée en deux. Les écrans migrés (accueil famille, élèves, présences, paiements, notes, tableau de bord, classes) passent par `Button`, `Select`, `Modal`, `KpiTile`, `PageHeader`, `DataTable`. Un périmètre de **16 fichiers (≈ 6 000 lignes)** n'a jamais été migré : activités, finance, personnel, Paramètres (général, comptes), cartes d'identité, matrice des droits. Sur 1 007 « marqueurs d'ancien style » (`font-bold`, `text-sm/base/lg`, `sand-*`, `<input>` brut, `alert()`, `pr-`/`pl-`, `rounded-[10px]`…) comptés hors `ui/`, impression et thème, **80 % tombent dans ces 16 fichiers**. Presque tous les écarts ci-dessous en découlent ; un seul chantier de migration les résorbe.

**Ce qui va bien, côté jetons** : aucune classe de palette Tailwind brute (`bg-blue-600`, `text-gray-500`… : **0 occurrence**), 8 couleurs hexadécimales seulement dans les écrans hors impression, aucune valeur d'espacement arbitraire notable (7 occurrences sur ≈ 10 000 classes).

---

### 2. Inventaire de l'existant

### 2.1 Jetons

| Catégorie | Définition | Remarque |
|---|---|---|
| Couleurs | 86 variables `--color-*` dans `@theme` (`src/index.css:15-130`) : fonds/surfaces (`app`, `surface`, `surface-2`, `sunken`, `quiet`), texte `ink` à 4 niveaux, filets `line*` (4), `night*` (12, barre latérale), échelles `primary` 50-950, `gold` 50-950 + 3 accents, `danger`, `success`, `sand` 50-950 | Valeurs du bleu nuit dans `@theme` ; 5 thèmes redéfinissent **31 variables** sous `[data-theme]` (`src/theme/themes.css`, généré par `palettes.ts`, D84) |
| Thèmes | `bleu-nuit`, `emeraude` (défaut, D88), `sauge`, `foret`, `olive`, par école | Contrastes ≥ 4,5:1 testés pour les nuances thématiques (`tests/unit/themes.test.ts`) |
| Typographie | `--font-sans` (IBM Plex Sans Arabic), `--font-display` (Reem Kufi, h1 seulement, UI-15), `--font-quran` (Amiri), `--font-mono` (mappé sur IBM Plex Sans Arabic) | **Aucune échelle de tailles** : pas de `--text-*` dans `@theme` (0 occurrence) |
| Rayons | `--radius-md` 8, `lg` 10, `xl` 12, `2xl` 18, `3xl` 22 | + `rounded` nu (4 px) et `full` |
| Ombres | `--shadow-toast`, `--shadow-pop` (thématisées) | Ombres Tailwind par défaut non redéfinies |
| Espacement | Échelle Tailwind native | Respectée (7 valeurs arbitraires) |
| Mouvement | `fadeIn`, `scaleIn`, `rise` ; `prefers-reduced-motion` géré pour `.hifz-dot` seulement | |
| Focus | `:focus-visible` global : contour or 2 px, décalage 2 px (`index.css`) | Bon filet de sécurité pour tous les boutons et liens |

### 2.2 Composants partagés (`src/ui/`) et adoption

| Composant | Variantes / états | Usages | Remarque |
|---|---|---|---|
| `Button` / `IconButton` | 8 variantes (primary, outline, danger, danger-solid, success, ghost, gold, on-dark) × 3 tailles ; disabled ; icône ; `block` | 72 / 16 | Pas d'état `loading` ; cibles 44/36/32 px |
| `Input`, `Textarea`, `FormField`, `CheckboxRow`, `SearchInput`, `fieldClass` | focus, disabled ; `FormField` associe libellé, aide, erreur | 29 / 4 / 60 | `error` de `FormField` **jamais utilisé** (0), `aria-invalid` 0 |
| `Select` (D83) | combobox APG, recherche > 10 options, portail, clavier, RTL/LTR effectif | 65 dans 30 fichiers | **Aucun `<select>` natif restant** (garde-fou `uiGuards.test.ts`) |
| `Modal` | 4 tailles, tons, `Esc`, focus initial et restitution, `role="dialog"`, `aria-labelledby`, pied d'actions, `onSubmit` | 9 | Seulement 9 fenêtres sur 21 (voir M1) |
| `Card`, `CardHeader`, `Divider` | `as`, `padded`, niveaux h2/h3 | 20 / 10 | |
| `PageHeader` | titre h1 Reem Kufi, description, actions | 16 | Titres d'écran cohérents sur tous les écrans de premier niveau |
| `KpiGrid` / `KpiTile` | tons de l'indication, 2 tailles | 24 (6 fichiers) | |
| `Pill`, `CountBadge` | 8 tons | 46 / 1 | |
| `ActionAlert`, `TextAction` | 5 tons | 14 | |
| `EmptyState` | icône, titre, action | 20 | |
| `DataTable` (+ `Table`, `Th`, `Td`, `Tr`, `TableWrap`) | tableau ≥ 768 px, **cartes** en dessous, lignes cliquables, sélection | 2 (+ primitives dans `PaymentsScreen`) | Très bon composant, trop peu employé |
| `Pagination` + `usePagination` | flèches suivant le sens effectif, mobile compact, résumé | 3 listes | Bien fait |
| `SegmentedControl`, `FilterChips`, `DropdownMenu`, `ActionMenu` | | 11 | |
| `Toast` | | **0** | Composant mort (voir M2) |
| Divers | `InitialAvatar`, `Emblem`, `GeometricPattern`, `HifzMap`, `HifzBar`, `QrCode` local, `Ltr`, `SideNav`, `Topbar`, `AppShell` | | |

### 2.3 Points bien conçus (à conserver)

1. **Thématisation propre** : variables CSS par `[data-theme]`, fichier généré, test qui échoue s'il est périmé, garde-fou qui interdit 18 couleurs de la charte codées en dur, `theme-color` suivant la barre latérale, pas de flash au démarrage (D84).
2. **`Select` maison** complet (clavier, portail, recherche insensible aux voyelles, `Échap` ne ferme pas la fenêtre parente).
3. **`Pagination`** : flèches inversées selon le sens de lecture *effectif* (`useDirection`), bouton à 40 px sur mobile, `aria-current`.
4. **`DataTable`** : bascule tableau / cartes, actions toujours visibles (D89).
5. **`Modal`** : focus restitué, `Esc`, étiquettes ARIA, pied d'actions cohérent.
6. **`formatMoney` / `formatNumber` / `formatPercent`** (`src/utils/format.ts`) : un seul format de montant ; garde-fou contre `toLocaleString()` nu et contre « درهم » dans 4 familles d'écrans.
7. **Focus visible global** et `Button` avec états hover / disabled homogènes.
8. **Graphiques et légendes** (`PaymentsScreen.tsx:86-95`, `Bars.tsx`) branchés sur `var(--color-*)`.
9. **Aperçu des cartes d'élève** (`src/print/cards/StudentCards.tsx`) désormais sans hexadécimal ni `data-theme` en dur (D91).
10. **Chiffres latins** quasi partout, aucun chiffre arabe-indien dans le code source.

---

### 3. Couverture des jetons (format du skill)

| Catégorie | Défini | Valeurs en dur trouvées |
|---|---|---|
| Couleurs (hex dans les écrans, hors impression/thème) | 86 jetons | **8 hex** dans 7 fichiers ; **0** classe de palette brute ; 2 classes sur jetons inexistants |
| Couleurs non thématisées (bleutées) | | `ink*` : 911 `text-ink` + 361 `text-ink-2` + 291 `text-ink-3` ; `sand-500…950` |
| Espacement | échelle Tailwind | 7 valeurs arbitraires (`px-[22px]`, `gap-[18px]`, `mt-[18px]`, `p-[3px]`…) |
| Rayons | 5 jetons | **129** `rounded-[10px]` (= `rounded-lg`, 66 autres usages) ; 7 autres arbitraires |
| Typographie | 3 familles, **0 échelle** | **879** `text-[Npx]` sur **23 valeurs** + 83 classes d'échelle Tailwind (`text-sm`…) dans 18 fichiers |
| Ombres | 2 jetons | 8 ombres Tailwind par défaut ou arbitraires |

### Complétude des composants

| Composant | États | Variantes | Docs | Note |
|---|---|---|---|---|
| Button | hover, disabled, focus global ; pas de `loading` | 8 | commentaire d'en-tête | 8/10 |
| Input / Textarea | focus, disabled ; **pas d'état erreur** | 1 | commentaire | 6/10 |
| Select | tous | `field` / `bare`, 2 tailles | très complète | 10/10 |
| Modal | `Esc`, focus initial ; **pas de piégeage du focus** (Tab sort de la fenêtre) | 4 tailles, 2 tons | commentaire | 8/10 |
| DataTable | tableau + cartes, sélection | 1 | bonne | 9/10 |
| Pagination | complet | 1 | bonne | 9/10 |
| Pill / ActionAlert / EmptyState / KpiTile | statiques | tons | brève | 7/10 |
| Toast | aucun usage | | | 2/10 |
| Absents du système | **ConfirmDialog**, **Toast branché**, **Spinner / Skeleton**, **Tabs**, **Switch** | | | |

---

### 4. Constats par gravité

Légende : volume = nombre d'occurrences (hors impression et thème sauf mention). « Correction » est proposée, **non appliquée**.

### MAJEURS

#### M1. Douze fenêtres modales reconstruites à la main, sans les garanties de `Modal`
- **Constat** : 12 fenêtres refont `fixed inset-0 … bg-night/55 backdrop-blur` au lieu de `<Modal>` (9 seulement l'utilisent). Elles n'ont **ni `role="dialog"`, ni `aria-modal`, ni `aria-labelledby`, ni fermeture par `Échap`, ni focus initial/restitué** (0 occurrence de `Escape` ou `role="dialog"` dans chacune). Elles divergent aussi en visuel : marges verticales `my-6` ou `my-8`, hauteur max `90vh`, `92vh` ou aucune, titre en `h3` (alors que `Modal` produit un `h2`), animations `animate-fadeIn`/`scaleIn` présentes ou non, `dir="rtl"` posé de trois façons différentes.
- **Impact utilisateur** : au clavier ou au lecteur d'écran, on ne peut pas fermer la fenêtre avec `Échap`, le focus reste derrière le voile (la touche Tab navigue dans la page cachée), le lecteur d'écran n'annonce pas une boîte de dialogue. À l'écran, les fenêtres Finance, Personnel, Activités, Comptes n'ont pas exactement les mêmes marges ni la même hauteur que celles des élèves ou des paiements.
- **Volume** : 12 fenêtres, ≈ 2 900 lignes.
- **Exemples** : `src/components/finance/ExpenseModal.tsx:39`, `src/components/finance/IncomeModal.tsx:39`, `src/components/finance/SalaryModal.tsx:51`, `src/components/staff/StaffFormModal.tsx:64`, `src/components/settings/UserFormModal.tsx:68`, `src/components/activities/ActivityFormModal.tsx:50` (+ `ParticipantModal.tsx:51`, `ActivityExpenseModal.tsx:40`, `StaffDirectoryModal.tsx:20`, `StaffBadgeModal.tsx:22`, `PrintReportModal.tsx:35`, `ActivityPrintModal.tsx:33`).
- **Correction** : migrer vers `<Modal title icon size footer onSubmit>` (le pied d'actions et `onSubmit` existent déjà). Pour les deux aperçus d'impression, ajouter à `Modal` une taille `xl` sans corps scrollable ou une prop `print`. Ajouter à `Modal` le piégeage du focus (Tab / Maj+Tab). Garde-fou : test qui interdit `fixed inset-0` hors `src/ui/` (exceptions `AppShell`, feuille d'impression).

#### M2. Retours à l'utilisateur par `alert()` / `confirm()` natifs ; composant `Toast` mort ; pas d'état d'erreur de champ
- **Constat** : **52 `alert()` et 15 `confirm()`** servent de validation, de succès, d'erreur et de confirmation de suppression. `src/ui/Toast.tsx` est exporté (`ui/index.ts:29`) mais **jamais rendu** (0 usage). Le champ `error` de `FormField` n'est jamais passé (0), `aria-invalid` n'existe nulle part. Quatre messages contiennent des émojis (`⚠️`, `✅`). Les suppressions utilisent trois textes différents (« هل أنت متأكد من حذف… »).
- **Impact utilisateur** : une boîte grise du navigateur, hors charte et hors thème, qui bloque l'écran ; en mode français, c'est le texte traduit par la couche DOM sur une boîte non stylable ; le message « champ requis » n'est pas rattaché au champ fautif (le lecteur d'écran n'annonce rien). Sur mobile, ces boîtes sont particulièrement brutales. Le risque principal : une **suppression financière** (dépense, salaire, activité) confirmée par une ligne de texte sans contexte.
- **Volume** : 67 appels dans 19 fichiers (`useAdminActions.ts` 13, `useFinanceForms.tsx` 6, `usePrintActions.ts` 6, `useExportBackupActions.ts` 6, `useStaffState.tsx` 5, `useActivitiesHandlers.ts` 5…).
- **Exemples** : `src/components/finance/useFinanceForms.tsx:192` (validation par `alert`), `src/components/finance/ExpensesSection.tsx:171` (suppression par `confirm`), `src/components/activities/ActivityWorkspace.tsx:121`, `src/components/activities/useActivitiesHandlers.ts:385` (succès avec émoji).
- **Correction** : (1) brancher `Toast` (état global ou contexte `useToast`, région `aria-live`, variante erreur) ; (2) créer `ConfirmDialog` sur `Modal size="sm"` (titre, conséquence, bouton `danger-solid`) et le fournir par un hook `useConfirm()` ; (3) activer l'état erreur de `Input` / `Select` (`aria-invalid`, bordure `danger`, message via `FormField error`) ; (4) garde-fou `uiGuards.test.ts` interdisant `alert(` et `confirm(` dans `src/`. Les chaînes passent déjà par `fr.ts` : les reprendre telles quelles.

#### M3. Champs, libellés, boutons et cartes recopiés en classes littérales dans le périmètre non migré
- **Constat** : au lieu de `Input` / `FormField` / `Button` / `Card`, les fichiers non migrés recopient la chaîne de classes :
  - **83** copies de la classe du champ (`min-h-11 px-3 rounded-[10px] border border-line-strong bg-white …`, identique à `fieldClass`), dont 18 dans `GeneralSettingsSection.tsx`, 15 dans `StaffFormModal.tsx` ;
  - **108** copies du libellé `block text-[13.5px] font-semibold text-ink-2 mb-1.5` (126 `<label>` hors `ui/` pour 60 `FormField`) ;
  - ≈ **25** boutons primaires reconstruits (31 lignes `bg-primary … text-white`, dont quelques pastilles non cliquables) (`inline-flex … bg-primary hover:bg-primary-hover text-white …`) et **8** boutons « contour » recopiés, plus des boutons dangereux sans la variante (`bg-danger-700 hover:bg-danger-800 px-5 py-2.5 rounded-xl`) qui divergent de `danger-solid` ;
  - **27** cartes `bg-surface rounded-2xl/3xl border p-N` au lieu de `Card` (marges internes `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6`, `p-8`, `p-12` selon la carte).
- **Impact utilisateur** : le même geste (enregistrer, supprimer) a un poids visuel, une hauteur et un survol différents d'un écran à l'autre ; une correction du design system (focus, état erreur, hauteur tactile) **ne se propage pas** à ces fichiers ; chaque nouveau champ ajoute 200 caractères de classes à maintenir.
- **Volume** : ≈ 83 + 108 + 33 + 27 ≈ 250 blocs ; 16 fichiers.
- **Exemples** : `src/components/finance/ExpenseModal.tsx:55-63` (libellé + champ copiés) et `:164-171` (bouton `bg-danger-800 … shadow-md` pour « حفظ النفقة », comme `ActivityExpenseModal.tsx:167` : les deux seuls « enregistrer » rouges de l'application) ; `src/screens/IdCardsScreen.tsx:256` ; `src/components/finance/IncomeModal.tsx:167`.
- **Correction** : remplacer par `FormField` + `Input`/`Textarea`/`Select`, `Button variant="primary"` (« enregistrer » ne doit jamais être `danger`), `Card`. Ajouter à `Button` une prop `loading` (remplace `جاري الحفظ...` fabriqué à la main, `UserFormModal.tsx:432`).

### MINEURS

#### m1. Tableaux : 11 fichiers en `<table>` brut, 9 variantes de remplissage, pas de mode cartes sur mobile
- **Volume** : 67 `<th>` bruts dans 11 fichiers contre 2 `DataTable` (+ 2 `TableWrap` dans `PaymentsScreen`) ; au moins 9 combinaisons de classes d'en-tête (`p-2.5 border border-sand-400` ×11, `p-3` ×16, `p-2 border-l border-line` ×7, `p-3.5` ×6, `bg-sand-100 … font-bold` ×5…). Les lignes vides sont rendues à la main (`<td colSpan={9} …>`) au lieu de `EmptyState`. 3 listes seulement sont paginées (élèves, attestations, historique de présence) ; le registre des paiements, les tableaux de finance et la liste du personnel affichent tout.
- **Impact** : à 390 px les tableaux de Finance et du Personnel débordent (le garde-fou `min-width: 40rem` de `index.css` force un défilement horizontal dans la carte, ce que D89/UI-06 a supprimé ailleurs) ; entre écrans, l'en-tête n'a ni la même teinte ni le même poids (`font-bold` ou `font-semibold`).
- **Exemples** : `src/components/finance/RevenuesSection.tsx` (10 `<th>`), `src/components/finance/SalariesSection.tsx:134`, `src/components/finance/ExpensesSection.tsx:120`, `src/components/staff/StaffList.tsx`.
- **Correction** : `DataTable` pour Revenus, Dépenses, Salaires, Liste du personnel ; `Table/Th/Td` pour les aperçus d'impression ; `EmptyState` dans la ligne vide ; `Pagination` au-delà d'une vingtaine de lignes (registre des paiements en premier).

#### m2. Jetons non thématisés et reste de « bleu nuit »
- **Constat** :
  - **`ink`, `ink-2`, `ink-3`** (`#1A1F2B`, `#4A5060`, `#6B7080`, teinte 222-226°, bleu-gris froid) et **`sand-500…950`** ne sont **redéfinis par aucun thème** (31 jetons sur 86 le sont). Ils couvrent le texte de presque tout l'interface (911 + 361 + 291 usages) : en émeraude, le texte reste légèrement bleuté. Effet faible, mais c'est la source principale du « bleu résiduel » restant.
  - `src/components/staff/StaffBadgeModal.tsx:39` : `data-theme="bleu-nuit"` en dur **à l'écran** (la carte du personnel reste bleu nuit dans un écran vert ; D84 l'avait prévu, D91 a rendu les cartes d'élève thématiques, d'où une incohérence entre les deux cartes).
  - Aperçus d'impression à l'écran : `bg-sand-900` / `border-sand-900` / `bg-sand-800` (`ActivityPrintModal.tsx:38,57,72,109,354,355,405`, `PrintReportModal.tsx:194`) : le **bandeau d'outils** de ces fenêtres (hors feuille) est bleu-noir. `tests/unit/themes.test.ts` les excuse (exception d'impression) mais seule la feuille devrait l'être, pas la barre d'outils. L'exception `UsersSection.tsx` du test est périmée (le fichier n'utilise plus `sand-800/900`).
  - Le garde-fou ne cherche que **18 couleurs précises** : `#5C4A1E`, `#CFD2C4`, `#B9BDAF` passent.
- **Impact** : très faible visuellement (gris froid à la place d'un gris chaud) ; plus gênant pour les écoles en `olive` ou `sauge`, où le texte et le noir des barres d'outils tirent vers le bleu.
- **Correction** : ajouter `ink`, `ink-2`, `ink-3`, `sand-500…900` à `TOKENS` dans `palettes.ts` (même transposition OKLCH, chroma réduite) ou, plus simple, rendre ces gris neutres (chroma ≈ 0,02) pour tous les thèmes ; passer le bandeau d'outils des aperçus en `bg-night`; retirer `data-theme` de `StaffBadgeModal` (ou le justifier par un commentaire) ; remplacer la liste de 18 hex par un motif général `#[0-9a-f]{6}` avec exceptions explicites.

#### m3. Couleurs en dur et classes sur jetons inexistants
- **Hex dans les écrans** (8 occurrences, 7 fichiers) : `#5C4A1E` ×3 (`ActionAlert.tsx:9`, `MonthlyReportModal.tsx:205`, `ClassManagement.tsx:282`) ; `#CFD2C4` (`EmptyState.tsx:7`) ; `#B9BDAF` (`Button.tsx:14`) ; `#F8F8F3` (`HifzBar.tsx:11`, = `surface`) ; `#1A1F2B` et `#ffffff` (`QrCode.tsx:23,28`, volontaire : un QR doit rester noir sur blanc).
- **Jetons inexistants** (la classe est ignorée sans erreur) : `text-primary-2` (`ActivityWorkspace.tsx:705`, le titre prend la couleur héritée) ; `border-sand-150` (`IdCardsScreen.tsx:117`, la bordure retombe sur le filet par défaut).
- **Ombre** : `shadow-[0_0_10px_var(--color-gold)]` (`AttendanceScreen.tsx:205`, ligne du scanner, thématisée, OK).
- **Correction** : créer `--color-gold-ink` (= `#5C4A1E`) ou utiliser `gold-900`, `--color-line-dashed`, `--color-line-hover` ; corriger les 2 classes ; ajouter un test qui extrait toutes les classes `bg|text|border-<famille>-<n>` et vérifie l'existence de `--color-…` dans `index.css` (le script de vérification utilisé pour cette revue tient en 10 lignes).

#### m4. Typographie hors échelle et titres de sections hétérogènes
- **Volume** : **879** tailles `text-[Npx]` sur **23 valeurs** distinctes (`13px` ×227, `14px` ×157, `13.5px` ×153, `12.5px` ×146, `11.5px` ×94, `14.5px`, `15px`, `20px`…, jusqu'à `text-[9px]`) ; 83 classes d'échelle Tailwind dans 18 fichiers (`text-sm` ×35, `text-base` ×14, `text-2xl` ×12…) ; `font-bold` ×378 contre `font-semibold` ×300 alors que la charte (UI-15) retient 600 ; `font-mono` ×77 (la famille « mono » est en fait IBM Plex, le nom induit en erreur) ; `font-serif` ×4 (`PrintReportModal.tsx:67`).
- **Titres** : 76 balises `h1`-`h4` en **25 combinaisons** taille/graisse. `CardHeader` (22 px) n'est utilisé que 10 fois ; à côté, **10 `h2` écrits à la main à 20 px Reem Kufi** (`ClassManagement.tsx:258`, `GradesScreen.tsx:73`, `StudentsScreen.tsx:195`, `PaymentsScreen.tsx:159`, `AttendanceScreen.tsx:247`…) et 12 `h3` à `text-base font-bold`, 10 à `text-sm font-bold`, 4 à `15px/600`. 16 `h2`/`h3` portent encore `font-display` (corrigés après coup par une règle CSS en fin de `index.css`, qui devait disparaître). Dans les pages migrées, le titre de carte fait donc 20 px, dans `CardHeader` 22 px, dans le Personnel 16 px gras.
- **Impact** : la hiérarchie visuelle change d'un écran à l'autre ; le texte de 11,5 px (94 usages, concentrés dans `RevenuesSection`, `StaffList`, `UserFormModal`) est difficile à lire pour un public qui comprend des parents et des enseignants plus âgés.
- **Correction** : déclarer l'échelle dans `@theme` (`--text-caption: 12.5px`, `--text-body-sm: 13.5px`, `--text-body: 14px`, `--text-lead: 16px`, `--text-title-sm: 18px`, `--text-title: 22px`, `--text-display: 32/44px`) et remplacer par `text-caption`, etc. ; plancher à 12 px pour le texte lisible ; `CardHeader` partout pour les titres de sections ; `font-semibold` (600) partout sauf chiffres ; renommer `font-mono` en `font-num` ou le supprimer ; retirer la règle `h2.font-display` quand plus aucun `h2` ne porte `font-display`.

#### m5. Composants dupliqués à côté de ceux du système (badges, cartes de chiffres, états vides, onglets)
- **Badges** : `Pill` utilisé 46 fois, mais ≥ 19 badges recréés (`rounded-full px-2.5 py-1 text-[11.5px] bg-danger-100 …`) : `RevenuesSection.tsx:334`, `UsersSection.tsx:51,340`, `useActivitiesData.tsx:234` (`badgeClass` en chaîne de classes), `GeneralSettingsSection`.
- **Cartes de chiffres** : `KpiTile` 24 fois (6 fichiers) mais ≈ 11 cartes « chiffre + icône » écrites à la main dans `ExpensesSection.tsx:38-70`, `SalariesSection.tsx:41-67`, `FinanceReportSection.tsx:69-117`, `ActivityWorkspace.tsx:609-629` avec des chiffres en `text-2xl` / `text-3xl font-bold` (le `KpiTile` fait 28 ou 38 px) et des couleurs de montant variables.
- **États vides** : `EmptyState` 20 fois, mais ≥ 5 reconstitués (`border-dashed` maison) : `ActivityWorkspace.tsx:235,322,503`, `WeeklyAttendance.tsx:74`, `SalariesSection.tsx:134`.
- **Chargements** : un seul motif (`RefreshCw animate-spin`, 4 usages) ; aucun squelette ; pas de composant. Libellés de chargement de trois formes (voir m7).
- **Onglets** : `SettingsTabs`, `StaffCategoryTabs` et les onglets de Finance/Activités sont trois implémentations distinctes (`role="tablist"` seulement dans `SettingsTabs`).
- **Correction** : `Pill` avec `tone` pour les badges de statut ; `KpiTile size="md"` + prop `icon` ; `EmptyState` (ajouter une taille `compact`) ; nouveau `Tabs` (ARIA complet) et `Spinner` / `Skeleton`.

#### m6. RTL : propriétés physiques, `dir="rtl"` en dur, flèches non inversées
Le français est désormais une vraie option (D93) : la mise en page passe en LTR via `src/i18n-test/fr.css`, qui **corrige par des rustines** les écarts.
- **Volume** : **50** marges/remplissages/positions physiques (`right-3` ×12, `pr-10` ×10, `pl-3` ×7, `pr-9` ×5, `left-6`/`right-6` ×4, `ml-1` ×2, `mr-auto` ×1…), **56** `text-left`/`text-right` (35 + 21, dont 22 dans `PrintReportModal.tsx` et 8 dans `ActivityPrintModal.tsx`), **≈ 20** `border-l`/`border-r` (14 dans `StaffDirectoryModal.tsx:47-66`), 28 fichiers avec `dir="rtl"` ou `direction: rtl` en dur (contournés par `html[lang="fr"] [dir="rtl"] { direction: ltr }`). À comparer aux **61 usages logiques** (`ms-`, `pe-`, `start-`, `text-start`…) : la majorité du code est déjà bonne.
- **Icônes de direction** : `Pagination` est correct. `TeacherDashboardScreen.tsx:175` : `ChevronLeft` fixe (en LTR, le chevron pointe vers l'arrière). `LogOut` et `Undo2` sont retournés par `-scale-x-100` (`AppFrame.tsx:98`, `Topbar.tsx:115`, `RolePreviewControl.tsx:44`, `RolePreviewBanner.tsx:21`) puis ré-annulés par `fr.css` : deux couches pour un seul effet.
- **Impact** : en français, l'icône d'un champ de recherche reste à droite et le texte s'aligne à gauche (`right-3` + `pr-10` : l'espace réservé est à droite, mais la saisie commence à gauche), le chevron d'une ligne d'enseignant pointe vers l'arrière, la colonne de séparation du répertoire du personnel est du mauvais côté. Peu visible en arabe, c'est la langue d'usage principale.
- **Exemples** : `GeneralSettingsSection.tsx:130-165` (6 champs `right-3` + `pr-10`), `UserFormModal.tsx:133-147`, `UsersSection.tsx:161-174`, `IdCardsScreen.tsx:94-102`, `ActivityWorkspace.tsx:275-281`.
- **Correction** : `right-3` → `end-3`, `pr-10` → `pe-10`, `pl-3` → `ps-3`, `text-right` → `text-start` (sauf montants LTR), `border-l` → `border-s` ; utiliser le composant `SearchInput` (déjà logique) ; remplacer les chevrons directionnels par une icône qui lit `useDirection` (comme `Pagination`) ; supprimer ensuite les rustines de `fr.css` correspondantes. Garde-fou : test sur `(?<![-\w])(ml|mr|pl|pr|left|right)-\d` hors `print/` et impression.

#### m7. États interactifs : cibles tactiles, noms accessibles, focus des champs, contraste
- **Boutons icône sans nom accessible** : **8** boutons n'ont ni `aria-label` ni `title` (tous des boutons de fermeture ou d'effacement) : `StaffDirectoryModal.tsx:27`, `StaffBadgeModal.tsx:29`, `UserFormModal.tsx:75`, `UsersSection.tsx:172` (effacer la recherche), `StaffFormModal.tsx:81`, `ParticipantModal.tsx:58`, `ActivityFormModal.tsx:57`, `ActivityExpenseModal.tsx:47`. 18 autres n'ont qu'un `title` (au lieu de `aria-label`, ce que fait `IconButton`).
- **Cibles trop petites** : **46** boutons de moins de ≈ 28 px de côté sans `min-h` (icône `w-3.5` dans `p-1`/`p-1.5`/`p-0.5`) et 22 de 32-36 px (au lieu des 44 px de la charte, ou 36 px pour `IconButton size="sm"`). Exemples : actions de ligne « modifier / supprimer » `SalariesSection.tsx:187,196`, `RevenuesSection.tsx:186,195`, `ExpensesSection.tsx:160,169` ; `PermissionMatrixEditor.tsx:163-219` (cases de la matrice en `p-1.5`) ; `ActivityWorkspace.tsx:408-427` (`p-1`) ; `UsersSection.tsx:424` (`p-0.5`). Ce sont les actions de **suppression** qui sont les plus petites.
- **Focus des champs** : les 83 champs maison retirent le contour global (`focus:outline-none`) et le remplacent par `border-primary` + `ring-primary/15` : un anneau à 15 % d'opacité, quasi invisible ; seul le changement de couleur de bordure (≈ 3:1) signale le focus. Le composant `Input` a le même réglage. Les boutons gardent le contour or global.
- **Disabled** : 28 `disabled:opacity-*`, mais les boutons maison n'ont pas tous la variante désactivée (`ExpenseModal.tsx:166` n'en a pas).
- **Contraste** : `text-ink-4` / `text-sand-400` (`#9A9E92`) = **2,57:1** sur `surface` pour du texte (`ActivityWorkspace.tsx:92`, `PermissionMatrixEditor.tsx:368`, `SalariesSection.tsx:66`, `UserFormModal.tsx:378`) ; `text-ink-3` sur `bg-sunken` = 3,99:1 (19 usages de `bg-sunken`).
- **Mouvement** : `animate-fadeIn` / `animate-scaleIn` (9) n'ont pas de repli `prefers-reduced-motion`.
- **Correction** : `IconButton` partout pour les actions de ligne (44 px sur mobile, 36 px au minimum sur bureau) ; ring de focus 3 px à 35 % ou `focus-visible:outline` global conservé sur les champs ; texte `ink-3` au minimum ; remplacer `ink-4` par `ink-3` pour le texte (garder `ink-4` pour les icônes décoratives) ; étendre le bloc `prefers-reduced-motion` aux deux animations.

#### m8. Libellés, chiffres, devises et ponctuation incohérents
- **« Enregistrer »** (18 boutons d'envoi de formulaire) : « حفظ التغييرات » (`ClassManagement.tsx:374`, `StaffFormModal.tsx:470`, `ProfileModal.tsx:45`) / « حفظ التعديلات » (`ParticipantModal.tsx:318`, `ActivityFormModal.tsx:276`, `ActivityExpenseModal.tsx:165`, `StudentFormModal.tsx:35`) / un verbe spécifique à chaque fenêtre (« حفظ النفقة », « حفظ أجر المستفيد », « حفظ السجل المالي », « حفظ الحساب », « حفظ الدفعة ») / « حفظ جميع إعدادات المؤسسة والمطبوعات » (`GeneralSettingsSection.tsx:514`) / « حفظ التغييرات وتسجيل المتابعة اليومية » (`TeacherStudentFileModal.tsx:137`).
- **Création** : « إنشاء الحلقة », « إنشاء النشاط », « تسجيل الكادر », « تسجيل المصروف », « تأكيد التسجيل », « إتمام التسجيل والبدء », « تسجيل وإصدار الشهادة » : sept verbes pour « ajouter ».
- **Annuler / fermer** : « إلغاء » ×5, « إغلاق », « إغلاق الكشف » ; « حذف » seul ou « حذف / أرشفة ».
- **Chargement** : « جاري… » ×5 (`UserFormModal.tsx:432`, `LoginScreen.tsx:109`, `SessionCheckingScreen.tsx:13`) contre « جارٍ… » ×2 (`RolePreviewControl.tsx:37`, `Topbar.tsx:25`) ; points de suspension : `...` ×48 contre `…` ×8.
- **Montants et chiffres** : le format est unifié (109 appels à `formatNumber`/`formatMoney`), sauf `DashboardScreen.tsx:69` (`toLocaleString("en-US")` : « 1,320 » au lieu de « 1 320 ») et `ActionNeeded.tsx:45` (`{sum} درهم`) ; « درهم » ×11 contre « د.م » ×47 (le garde-fou ne couvre que 4 familles d'écrans) ; **chiffres arabes-indiens** produits par `toLocaleDateString("ar-EG")` dans `useSettingsState.tsx:93-95` (dernière synchronisation) ; `toLocaleDateString('ar-MA')` sans `-u-nu-latn` (`ActivityPrintModal.tsx:113,396`, `PrintReportModal.tsx:104`) : correct aujourd'hui dans Chromium mais non explicite, contrairement aux 5 autres appels.
- **Ponctuation** : virgule arabe « ، » utilisée partout (79) ; 4 émojis dans les textes (`useAttendanceActions.ts:92` « ⚠️ », `useActivitiesHandlers.ts:385`, `useStaffState.tsx:396,404`).
- **Marqueur de champ obligatoire** : `<span className="text-danger-500">*</span>` ×14, `*</label>` ×20, ` *` ×3 : trois écritures, et `FormField` n'a pas de prop `required`.
- **Correction** : un petit glossaire de verbes (enregistrer = « حفظ », créer = « إضافة », confirmer = « تأكيد », annuler = « إلغاء », fermer = « إغلاق ») appliqué aux 18 boutons ; `FormField required` qui ajoute l'astérisque et `aria-required` ; remplacer `...` par `…`, « جاري » par « جارٍ » (ou l'inverse, mais un seul) ; étendre `uiGuards.test.ts` (devise, `toLocaleString`, locales sans `nu-latn`). Chaque changement de chaîne touche `src/i18n-test/fr.ts` (test de couverture à 100 %).

### COSMÉTIQUES

| # | Constat | Volume / exemples | Correction |
|---|---|---|---|
| c1 | Rayons quasi doublons : `rounded-[10px]` (129) = `rounded-lg` (66) ; `rounded-xl` (12 px, 153) tout proche ; valeurs perdues `[2px]`, `[3px]`, `[14px]`, `t-[4px]` | `Button.tsx:18-20`, `Form.tsx:10` | Un seul alias (`rounded-lg`), remplacer les 129 par recherche/remplacement, supprimer les 4 valeurs perdues |
| c2 | Ombres hors jetons : `shadow-md` (`ExpenseModal.tsx:168`), `shadow-lg` (`StaffBadgeModal.tsx:39`), `shadow-inner` (`UsersSection.tsx:220`), `shadow-2xs`, `shadow` | 8 | `shadow-pop` / `shadow-toast` ou supprimer |
| c3 | Icônes : `strokeWidth` 1,75 (125) ou 1,5 (9) ou 2 (6) ou 2,5 (1) ; 54 icônes courantes sans `strokeWidth` (donc 2) dans les fichiers non migrés ; tailles `w-[18px]` ×19 entre `w-4` et `w-5` | | Fixer 1,75 par défaut (wrapper d'icône ou réglage global `lucide`) ; choisir 16/20 px |
| c4 | Transitions : `transition` (69), `transition-colors` (66), `transition-all` (19) | | Retenir `transition-colors` |
| c5 | Doublons de neutres : `bg-sand-50` (69) ≈ `surface`, `bg-sand-100` (41) ≈ `surface-2`, `border-sand-400` (49, dont 48 dans `ActivityPrintModal`) ≈ `line-strong` : deux familles de neutres | | Garder `surface/line/ink` ; réserver `sand-*` à l'impression |
| c6 | `index.css` : commentaires de défilement en anglais, règle de transition `h2.font-display` provisoire, `select { background-color:#fff }` devenu inutile (plus de `<select>` natif), bloc `print` écrit en dur en `#0f172a` (impression, tolérable) | `index.css:158-215`, fin de fichier | Nettoyage |
| c7 | `fieldClass` en `bg-white` (195 `bg-white` au total) au lieu d'un jeton `--color-field` : un thème ne peut pas teinter les champs | `Form.tsx:9` | Jeton `--color-field` (= `#fff` par défaut) |
| c8 | Commentaires obsolètes : `PageHeader.tsx` (« alignées en bas à gauche »), `Modal.tsx` (« en-tête Reem Kufi » alors que l'en-tête est en IBM Plex) | | Mettre à jour |

---

### 5. Plan de correction en lots

Principe : chaque lot est un commit atomique (message en français), `npm run lint`, `npm test`, `npm run build` verts ; chaque lot ajoute son garde-fou dans `tests/unit/uiGuards.test.ts` pour ne pas régresser. Toute chaîne ajoutée ou modifiée doit passer par `src/i18n-test/fr.ts` (couverture 100 %). Les tests e2e s'appuient sur des repères `data-*` (D54) : les conserver lors des migrations. Aucun changement de `firestore.rules`, de données ni de valeurs de rôles.

| Lot | Contenu | Constats | Taille | Risque |
|---|---|---|---|---|
| **L0. Garde-fous et corrections instantanées** | Test des classes sur jetons inexistants ; 2 classes à corriger ; élargir le garde-fou des hex ; supprimer l'exception périmée de `themes.test.ts` ; jetons `gold-ink`, `line-dashed`, `line-hover` ; commentaires obsolètes | m3, c6, c8 | **S** (½ jour) | Très faible |
| **L1. Briques manquantes** | `Toast` branché (contexte + région `aria-live`), `ConfirmDialog` + `useConfirm`, état erreur de `Input`/`Select`/`FormField` (+ prop `required`), `Button loading`, `Tabs`, `Spinner`/`Skeleton`, piégeage du focus dans `Modal`, échelle `--text-*` dans `@theme`, repli `prefers-reduced-motion` | M2 (base), M1 (focus), m4 (échelle), m5 | **M** (2-3 jours) | Faible (ajouts, pas de remplacement) ; le piégeage du focus de `Modal` touche 9 fenêtres existantes : tester `Select` à l'intérieur |
| **L2. Migration des 12 fenêtres vers `Modal`** | Finance (3), Activités (3 + 2 aperçus), Personnel (3), Comptes (1) ; harmonisation des pieds d'actions et des boutons d'envoi (bouton `primary`, jamais `danger` pour enregistrer) ; libellés d'enregistrement selon le glossaire | M1, M3 (champs et boutons des fenêtres), m8 | **L** (4-6 jours ; 12 fichiers, ≈ 2 900 lignes) | **Moyen** : tests e2e de ces fenêtres, formulaires contrôlés, impression qui s'appuie sur `fixed inset-0` (conserver), `dir="rtl"` |
| **L3. Remplacement de `alert()` / `confirm()`** | 52 `alert` → `Toast` ou erreur de champ ; 15 `confirm` → `ConfirmDialog` avec conséquence en clair ; suppression des émojis ; garde-fou | M2 | **M** (2-3 jours ; 19 fichiers, surtout des hooks) | Moyen : certains `alert` interrompent un flux synchrone (`confirm` renvoie un booléen) ; les tests e2e utilisent peut-être `page.on('dialog')` à adapter |
| **L4. Migration des écrans restants (champs, cartes, badges, KPI, états vides)** | Par domaine, dans l'ordre : Finance (4 sections), Personnel, Activités, Paramètres (Général, Comptes), cartes d'identité, matrice des droits : `FormField`/`Input`, `Card`/`CardHeader`, `Pill`, `KpiTile`, `EmptyState`, `IconButton` (44 px) ; tailles de texte vers l'échelle ; `font-semibold` | M3, m4, m5, m7 (cibles et noms accessibles) | **L à XL** (8-12 jours, 16 fichiers ; à faire en 4 commits par domaine) | Moyen : gros fichiers (`ActivityWorkspace` 723 lignes), mise en page des finances à revérifier à 390 et 1 440 px ; captures avant/après (`capture:screens`) |
| **L5. Tableaux** | Revenus, Dépenses, Salaires, Personnel → `DataTable` (mode cartes) ; aperçus d'impression → `Table/Th/Td` ; `Pagination` du registre des paiements et des tableaux de finance | m1 | **M** (3-4 jours) | Moyen : `DataTable` impose `columns` / `card`, actions en ligne, tris de `PaymentsScreen` à conserver |
| **L6. RTL logique** | Propriétés physiques → logiques (50 + 56 + 20) ; chevrons dépendants du sens (`useDirection`) ; suppression des rustines de `fr.css` correspondantes ; garde-fou | m6 | **S à M** (1-2 jours, mécanique) | Faible en arabe (équivalent) ; vérifier en français à 390 et 1 440 px |
| **L7. Jetons : neutres thématisés et nettoyage** | `ink`, `sand-500+` dans la transposition de thème (ou neutres) ; barre d'outils des aperçus en `night` ; décision `StaffBadgeModal` ; jeton `--color-field` ; unification `rounded-lg`, ombres, `transition-colors`, trait des icônes ; contraste `ink-4` | m2, m7 (contraste), c1-c5, c7 | **M** (2 jours) | Faible à moyen : le changement de teinte du texte touche tout l'écran → comparer les 5 thèmes (`tests/e2e/themes-captures.spec.ts`) et refaire le test de contraste |
| **L8. Glossaire et formats** | Verbes d'action, « جارٍ », `…`, « د.م » partout (étendre le garde-fou à tous les écrans), `ar-EG` → `ar-MA-u-nu-latn`, `toLocaleString("en-US")` → `formatNumber` | m8 | **S** (1 jour) ; **à valider avec le propriétaire** pour les termes | Faible ; attention à `fr.ts` |

**Ordre conseillé** : L0, L1, puis L2 et L3 (fort gain d'accessibilité), L4, L5, L6 en parallèle de L4 sur d'autres fichiers (éviter les conflits sur les mêmes fichiers : faire L6 *pendant* la migration de chaque fichier plutôt que séparément), L7, L8.

**Estimation totale** : ≈ 25 à 35 jours-personne ; le gain de cohérence est concentré dans L1 à L4 (≈ 80 % des écarts). Si le temps manque, faire **L0 + L1 + L2 + L3** (≈ 10 jours) : ils règlent les trois constats majeurs sans toucher à la mise en page.

### Actions prioritaires (format du skill)
1. Migrer les 12 fenêtres maison vers `Modal` et ajouter le piégeage du focus (M1).
2. Remplacer les 67 `alert()` / `confirm()` par `Toast` et `ConfirmDialog`, brancher l'état d'erreur des champs (M2).
3. Migrer le périmètre des 16 fichiers vers `FormField`, `Input`, `Button`, `Card`, `DataTable`, `IconButton` (M3, m1, m5, m7), puis poser les garde-fous qui interdisent le retour des anciens motifs.

---

### 6. Annexe : méthode et limites

- **Comptages** : `rg -o`/`rg -c` sur `src/**/*.tsx|ts` ; les scripts de lecture (extraction des balises `<button>`, des titres, des libellés d'envoi, écart `@theme`/thème émeraude) sont dans le scratchpad, hors dépôt. Les volumes de « petites cibles » viennent d'une analyse des classes (taille déduite de `p-*`, `w-*`, `h-*`, `min-h-*`), pas d'une mesure dans le navigateur : à confirmer par captures.
- **Non vérifié** : rendu réel, contraste des thèmes autres qu'émeraude et bleu nuit, comportement au clavier des fenêtres maison (déduit du code : aucune écoute de `Escape`, aucun `role="dialog"`).
- **Hors périmètre** : `src/print/` (impression et reçus, bleu nuit volontaire, D88/D91), logique métier, règles Firestore, performances.
- **Faux positifs écartés** : les `bg-black/20` de `src/print/cards/StudentCards.tsx` (voile neutre), `QrCode` en noir sur blanc (nécessaire à la lecture), les `text-left` des champs latins (identifiant, montants, voulus d'après `fr.css`), les quatre coins du scanner (`AttendanceScreen.tsx:206-209`, symétriques), le `-scale-x-100` du `LogOut` (intentionnel et corrigé en LTR).
