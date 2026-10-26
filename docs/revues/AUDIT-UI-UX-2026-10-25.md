# Audit UI/UX — 25 octobre 2026 (thème émeraude et or)

- **Périmètre** : l'application `quran-school-app` après D88 (thème « الزمردي والذهبي » par défaut, logo
  soleil levant sur un livre ouvert), tous rôles : directeur, administratif, enseignant, parent, élève.
- **Matière** : captures fraîches sur données fictives (1 440 px « bureau » et 390 px « mobile »), dossier
  `scratchpad/audit-captures/` de la session ; les chemins de preuve ci-dessous sont relatifs à ce dossier.
  Lecture du code (`src/screens`, `src/ui`, `src/shell`, `src/components`) pour confirmer les causes, et de
  `docs/DECISIONS.md` (D83, D84, D86, D87, D88) pour ne pas reproposer ce qui est fait ou décidé.
- **Grille** : critères du skill `frontend-design` (hiérarchie, typographie, sobriété, rédaction de
  l'interface, plancher de qualité mobile / contraste / focus / cibles), plus l'usage réel par rôle, la
  lisibilité arabe RTL et la cohérence avec le thème émeraude.
- **Hors périmètre** : le choix du thème et du logo (décidés, D88), la charte bleu nuit des documents
  imprimés (décidée, D88). Aucun fichier de code modifié.

## 1. Synthèse

L'application a désormais une vraie identité : la barre latérale émeraude, l'or réservé aux accents, la
carte du hifz et le fond sable forment un ensemble cohérent et sérieux, et les bases (focus visible global,
listes maison, pagination, états vides rédigés) sont solides. Le problème principal n'est plus visuel mais
d'**adaptation par rôle** : parents, élèves et enseignants voient des écrans pensés pour le bureau (titres,
descriptions, filtres, exports, aperçu de carte imprimable), et sur téléphone les tâches du quotidien sont
enfouies sous des en-têtes, des chiffres et des tableaux qui débordent. Les trois changements qui
apporteraient le plus :
1. **Une page d'accueil « parent »** qui répond en un écran à « mon enfant était-il là, où en est-il, suis-je à
   jour ? » (UI-01, UI-02, UI-03).
2. **Une saisie des présences rapide sur téléphone** pour l'enseignant : sa halaqa et la séance du jour par
   défaut, la liste en premier, un « tous présents » (UI-04, UI-16).
3. **Un passage mobile systématique** : barre du haut sur une ligne, tableaux transformés en cartes (UI-05,
   UI-06).

## 2. Constats

Légende de l'effort : **S** = moins d'une demi-journée, **M** = une à deux journées, **L** = plus.

### Priorité haute

#### UI-01 — Le parent arrive sur un écran d'administration, pas sur « mes enfants »
- **Rôle / écran** : parent (et élève), « متابعة أبنائي » (`students`), premier onglet du menu.
- **Preuves** : `parent/students-bureau.png`, `parent/students-mobile.png`, `eleve/students-mobile.png`.
- **Constat** : l'écran est celui du bureau, filtré : bloc « قائمة طلاب النادي » (« liste des élèves du club »),
  « تم العثور على 2 طالب », recherche « بحث باسم الطالب أو ولي الأمر » (le parent se cherche lui-même), colonne
  « الأوراق الإدارية » (cases « بطاقة / عقد / صور »), fiche détaillée (date d'inscription, hizb, sourate), puis
  l'aperçu recto verso de la carte officielle sur toute la largeur. À 390 px le tableau déborde (colonne
  « أحـ » coupée). Pour l'élève, la recherche porte sur une liste d'un seul élément.
- **Pourquoi ça gêne** : le parent cherche trois informations (présence récente, progrès du hifz, cotisation
  du mois) ; aucune n'est en haut, la présence est même absente (UI-02), le paiement est sur un autre onglet.
- **Proposition** : pour `ولي أمر` et `طالب`, un écran « ملخص » par enfant : une carte par enfant avec la
  halaqa et le محفظ, le hizb atteint (réutiliser la frise `HifzProgress`), le dernier examen (note et
  mention), les absences des 30 derniers jours, et l'état de la cotisation du mois (« مدفوع » / « غير
  مدفوع »). Supprimer pour ces rôles la recherche, le compteur, la colonne des papiers administratifs et
  l'aperçu de carte (voir UI-17).
- **Effort** : M.
- **Fichiers** : `src/screens/StudentsScreen.tsx` (lignes 36-38 : `family` déjà calculé), nouveau
  `src/screens/FamilyHomeScreen.tsx` (ou équivalent), `src/shell/navModel.tsx`.

#### UI-02 — « متابعة الحضور » est une impasse pour le parent (et pour l'administratif)
- **Rôle / écran** : parent, élève, administratif ; onglet présences.
- **Preuves** : `parent/attendance-mobile.png`, `administratif/attendance-mobile.png`.
- **Constat** : l'entrée du menu existe (« متابعة الحضور ») mais mène à un état vide « لا تتوفر شاشة الحضور
  لهذا الحساب ». `src/App.tsx:136` n'affiche `AttendanceScreen` qu'au `مدير` et au `مدرس`. Or
  `firestore.rules` (ligne 207) autorise déjà la lecture des présences par la famille (`familyOwnsDoc`) et par
  le personnel éducatif.
- **Pourquoi ça gêne** : la présence est l'information que le parent consulte le plus ; un onglet qui dit
  « non disponible » donne l'impression d'une application inachevée. L'administratif, qui répond aux parents
  au téléphone, ne peut pas vérifier une absence.
- **Proposition** : écran en lecture seule : par enfant, la liste des séances avec « حاضر / متأخر / غائب » et
  la date, du plus récent au plus ancien. Si ce n'est pas faisable tout de suite, retirer l'entrée du menu
  pour ces rôles plutôt que mener à une impasse.
- **Effort** : M (lecture seule) ; S (retrait du menu).
- **Fichiers** : `src/App.tsx`, `src/screens/AttendanceUnavailable.tsx`, `src/shell/navModel.tsx`,
  `src/firebase.ts` (abonnement filtré par élève).

#### UI-03 — Le parent lit « لم يتم تعيين معلم » alors qu'un محفظ est affecté
- **Rôle / écran** : parent (et élève), « الحلقات ».
- **Preuves** : `parent/classes-mobile.png` (« لم يتم تعيين معلم » sur les deux halaqas) comparé à
  `enseignant/classes-mobile.png` (même halaqa, محفظ affiché).
- **Constat** : `ClassManagement.tsx:249` affiche `teacher?.fullName || "لم يتم تعيين معلم"` ; la famille ne
  lit pas la collection `teachers` (`useSchoolSync.ts:144`), donc le repli s'affiche. L'information est
  fausse, pas seulement absente. Le parent voit aussi les onglets « الأرشيف » et la description « إضافة فصول
  دراسية جديدة، تعيين المحفظين… », et une halaqa où son enfant n'est pas inscrit.
- **Pourquoi ça gêne** : un parent conclut que la halaqa de son enfant n'a pas d'enseignant.
- **Proposition** : dénormaliser le nom affiché du محفظ dans la halaqa (champ public, pas la fiche du
  personnel), ou masquer la ligne quand l'enseignant n'est pas lisible. Pour la famille, n'afficher que la
  halaqa de ses enfants, sans onglets d'archive.
- **Effort** : S (masquer) ; M (nom dénormalisé, avec écriture par les Functions ou le bureau).
- **Fichiers** : `src/components/ClassManagement.tsx`, `src/data/useSchoolSync.ts`, `firestore.rules` (si
  champ ajouté, avec tests dans `tests/emulator`).

#### UI-04 — Faire l'appel sur téléphone demande de faire défiler 1 100 px et d'écarter les autres halaqas
- **Rôle / écran** : enseignant (et directeur), « الحضور والغياب », mobile.
- **Preuves** : `enseignant/attendance-mobile.png`, `directeur/attendance-bureau.png`.
- **Constat** : avant le premier élève viennent la barre du haut, le titre, la recherche, le choix de halaqa,
  la date, quatre chiffres (حاضر / متأخر / غائب / غير مرصود) et le bloc « جهاز المسح السريع » ; le premier
  élève apparaît vers 1 150 px. Le filtre par défaut est « الكل (جميع الحلقات والطلاب) » : l'enseignant voit
  les 10 élèves, dont ceux d'une halaqa qui n'est pas la sienne. Il n'y a pas d'action « tous présents » ;
  chaque élève demande un appui, et chaque ligne répète « الحالة المرصودة: ».
- **Pourquoi ça gêne** : l'appel se fait en début de séance, debout, avec un téléphone ; c'est la saisie la
  plus fréquente de l'application.
- **Proposition** : pour le `مدرس`, présélectionner sa halaqa (celle de la séance du jour si elle existe) ;
  remonter la liste juste sous les filtres ; replier le bloc du scanner en un bouton « المسح بالكاميرا » dans
  l'en-tête ; ajouter « تسجيل الجميع حاضرين » (puis on corrige les absents) ; retirer le libellé répété ;
  réduire les quatre chiffres à une ligne de résumé collante (« 3 حاضر · 1 غائب · 1 غير مرصود »).
- **Effort** : M.
- **Fichiers** : `src/screens/AttendanceScreen.tsx` (ligne 30 : `selectedClassId === "all"`),
  `src/app/state/useUiState.ts`.

#### UI-05 — Sur téléphone, la barre du haut prend deux à trois lignes
- **Rôle / écran** : tous, toutes les pages, 390 px.
- **Preuves** : `directeur/students-mobile.png` (trois lignes : nom de l'école, sélecteur d'école + cloche,
  avatar + sortie ≈ 190 px), `enseignant/teacher-dashboard-mobile.png` et `parent/payments-mobile.png` (deux
  lignes ≈ 135 px).
- **Constat** : le nom de l'école avec « (بيانات تجريبية) », le sélecteur d'école, la cloche, l'avatar et
  « خروج » sont empilés. Le bouton de sortie, rouge, est aussi visible que la cloche.
- **Pourquoi ça gêne** : 16 à 22 % de la hauteur d'un écran de 844 px avant tout contenu, sur chaque page.
- **Proposition** : une seule ligne de 56 px : menu, nom de l'école (tronqué), cloche, avatar. Le sélecteur
  d'école et « خروج » passent dans le tiroir du menu ou dans le menu de l'avatar.
- **Effort** : M.
- **Fichiers** : `src/ui/Topbar.tsx`, `src/ui/AppShell.tsx`, `src/shell/AppFrame.tsx`.

#### UI-06 — Les tableaux débordent à 390 px au lieu de passer en cartes
- **Rôle / écran** : directeur, administratif, enseignant, parent ; élèves, comptes, comptabilité.
- **Preuves** : `directeur/students-mobile.png` et `enseignant/students-mobile.png` (colonnes coupées,
  « أحـ » tronqué, actions invisibles), `parent/students-mobile.png`, `directeur/settings-users-mobile.png`
  (noms sur trois lignes, actions hors écran), `directeur/students-bureau.png` (même à 1 440 px, la colonne
  des actions est rognée à gauche).
- **Constat** : D87 a passé en cartes la liste du tableau de bord de l'enseignant ; les autres tableaux
  restent en défilement horizontal, sans indice visuel qu'il faut faire glisser.
- **Pourquoi ça gêne** : sur téléphone, les actions (modifier, archiver) et des données (téléphone du parent)
  sont invisibles sans geste caché.
- **Proposition** : variante « cartes » de `DataTable` sous `md` (nom en titre, deux ou trois champs clés,
  actions en bas), comme le tableau de bord enseignant ; l'appliquer d'abord aux élèves et aux comptes.
  Corriger la largeur de la colonne d'actions à 1 440 px.
- **Effort** : M.
- **Fichiers** : `src/ui/DataTable.tsx`, `src/screens/StudentsScreen.tsx`,
  `src/components/settings/UsersSection.tsx`.

### Priorité moyenne

#### UI-07 — Titres et descriptions écrits pour le bureau, montrés à tous les rôles
- **Rôle / écran** : enseignant, parent, élève ; élèves, halaqas, paiements, examens.
- **Preuves** : `enseignant/students-mobile.png` (menu « طلاب حلقاتي », titre « إدارة ملفات الطلاب والوثائق
  الإدارية », bouton « إضافة طالب جديد »), `parent/classes-mobile.png` et `enseignant/classes-mobile.png`
  (« إضافة فصول دراسية جديدة، تعيين المحفظين المشرفين… »), `parent/payments-mobile.png` (« …ومشاركة التنبيهات
  مع أولياء الأمور » lu par un parent), `parent/grades-mobile.png` (« …التي يشرف عليها معلمو الحلقات »).
- **Constat** : `PageHeader` reçoit un texte fixe ; seuls quelques écrans varient selon le rôle
  (`StudentsScreen.tsx:37-38`).
- **Pourquoi ça gêne** : le texte décrit des actions que l'utilisateur ne peut pas faire, et le titre ne
  correspond pas à l'entrée du menu qu'il vient de toucher.
- **Proposition** : titre = libellé du menu pour le rôle (`navModel.tsx` les calcule déjà) ; description
  par rôle, à la deuxième personne, sur ce que l'utilisateur peut faire (« نتائج أبنائك وشهاداتهم »).
  Supprimer la description quand elle n'apporte rien.
- **Effort** : S.
- **Fichiers** : `src/screens/*Screen.tsx`, `src/components/ClassManagement.tsx` (ligne 190),
  `src/screens/PaymentsScreen.tsx` (ligne 47), `src/screens/GradesScreen.tsx` (ligne 34).

#### UI-08 — Les paiements s'ouvrent sur une liste vide
- **Rôle / écran** : directeur, administratif, parent ; « الرسوم والمدفوعات ».
- **Preuves** : `directeur/payments-bureau.png` (770 درهم encaissés, « سجل المعاملات والمدفوعات (0 سجل
  مطابق) », « لا نتائج »), `parent/payments-mobile.png` (140 درهم payés, même liste vide).
- **Constat** : le filtre « شهر الرصد » vaut le mois courant par défaut (`useUiState.ts:207-212`) ; en
  début de mois, ou pour un parent qui a payé les mois précédents, la liste est vide alors que les chiffres
  au-dessus disent le contraire. L'état vide parle de « معايير التصفية » sans proposer de les retirer.
- **Pourquoi ça gêne** : on croit qu'un paiement a été perdu ; le parent ne voit pas ses reçus.
- **Proposition** : pour le parent, pas de filtre de mois : la liste de ses paiements, du plus récent au
  plus ancien. Pour le bureau, garder le mois courant mais, s'il est vide, un état vide qui guide
  (« لا مدفوعات مسجلة لشهر أكتوبر » + bouton « عرض كل الأشهر » et « إضافة دفعة »).
- **Effort** : S.
- **Fichiers** : `src/screens/PaymentsScreen.tsx`, `src/app/state/useUiState.ts`.

#### UI-09 — Champs de date et de mois natifs, hors langue et hors charte
- **Rôle / écran** : directeur, administratif, enseignant, parent ; paiements, présences, fiche élève.
- **Preuves** : `directeur/payments-bureau.png` et `parent/payments-mobile.png` (« octobre 2026 » en
  français dans une interface arabe), `enseignant/attendance-mobile.png` (« 25/10/2026 » et icône
  calendrier du système), `directeur/fenetre-eleve-bureau.png`.
- **Constat** : D83 a remplacé tous les `<select>` mais pas les `<input type="date|month">`
  (`PaymentsScreen.tsx:102`), qui suivent la langue du navigateur, pas celle de l'application.
- **Pourquoi ça gêne** : un mois en français, ou en anglais sur un autre téléphone, dans un écran arabe ;
  le calendrier du système ne connaît pas les mois marocains (« غشت », « يوليوز ») utilisés partout ailleurs.
- **Proposition** : pour le mois, deux `Select` de la charte (mois en arabe marocain + année), comme dans la
  fenêtre de paiement ; pour la date du jour des présences, des boutons « اليوم / الحصة السابقة » plus un
  sélecteur ; garder le natif seulement pour la date de naissance.
- **Effort** : M.
- **Fichiers** : `src/screens/PaymentsScreen.tsx`, `src/screens/AttendanceScreen.tsx`,
  `src/screens/modals/StudentFormModal.tsx`, `src/ui/Form.tsx`.

#### UI-10 — Montants, devise et pourcentages écrits de quatre façons
- **Rôle / écran** : directeur, parent ; paiements, comptabilité, personnel, tableau de bord.
- **Preuves** : `directeur/finance-bureau.png` (« 1,320 د.م » en haut, « 1.320 د.م » dans la carte sombre
  juste en dessous), `directeur/teachers-bureau.png` (« 2.500 د.م »), `directeur/payments-bureau.png`
  (« 770 درهم »), `directeur/dashboard-bureau.png` (« هذا الأسبوع %0 » et « 0% » sur le même bloc).
- **Constat** : devise tantôt « درهم », tantôt « د.م » ; séparateur des milliers « , » ou « . » ; appels à
  `toLocaleString()` sans locale (`ActivityWorkspace.tsx`, `ActivityPrintModal.tsx`…) mêlés à des locales
  explicites ; `${n}%` dans un texte RTL s'affiche « %92 » (`WeeklyAttendance.tsx:42`).
- **Pourquoi ça gêne** : la trésorière compare des chiffres entre écrans ; « 1.320 » se lit 1,32 pour
  certains utilisateurs ; la même somme semble différente.
- **Proposition** : un seul utilitaire `formatMoney(n)` / `formatPercent(n)` (chiffres latins, espace fine
  pour les milliers, « د.م » partout ou « درهم » partout, pourcentage dans un `bdi dir="ltr"`) ; garde-fou
  dans `tests/unit/uiGuards.test.ts` contre `toLocaleString()` sans argument.
- **Effort** : S à M.
- **Fichiers** : nouveau `src/utils/format.ts`, `src/components/finance/*`, `src/components/activities/*`,
  `src/components/staff/*`, `src/screens/PaymentsScreen.tsx`, `src/screens/dashboard/WeeklyAttendance.tsx`.

#### UI-11 — Fenêtre d'examen pré-remplie à 18/20, 18/20 et « ممتاز »
- **Rôle / écran** : directeur, enseignant ; « رصد نتيجة اختبار وشهادة ».
- **Preuves** : `directeur/fenetre-examen-bureau.png`.
- **Constat** : `useUiState.ts:198-200` initialise les deux notes à 18 et la mention à « ممتاز » ;
  `useGradePaymentActions.ts:61` les remet à 18 à chaque ouverture. Le bouton dit « تسجيل واصدار الشهادة »
  (hamza manquante : « إصدار »).
- **Pourquoi ça gêne** : un enseignant pressé peut enregistrer, et imprimer une attestation, avec des notes
  qu'il n'a pas saisies. La mention n'est pas déduite des notes, d'où des incohérences possibles (16/20 et
  « ممتاز »).
- **Proposition** : champs vides et obligatoires ; mention proposée automatiquement à partir des notes
  (modifiable) ; corriger « إصدار ».
- **Effort** : S.
- **Fichiers** : `src/app/state/useUiState.ts`, `src/app/actions/useGradePaymentActions.ts`,
  `src/screens/modals/GradeFormModal.tsx`.

#### UI-12 — « إضافة دفعة مالية جديدة » s'ouvre sur « غير مدفوع »
- **Rôle / écran** : directeur, administratif ; fenêtre de paiement.
- **Preuves** : `directeur/fenetre-paiement-bureau.png`.
- **Constat** : le titre annonce une « دفعة » (un versement) et le bouton principal de l'écran dit « إضافة
  سجل دفع جديد », mais l'état par défaut est « غير مدفوع » (`useUiState.ts:221`,
  `useGradePaymentActions.ts:139`).
- **Pourquoi ça gêne** : le cas courant au guichet est « le parent vient de payer » ; laisser la valeur par
  défaut crée une dette au lieu d'un encaissement, sans reçu.
- **Proposition** : par défaut « مدفوع » quand on ouvre depuis « إضافة » ; si le besoin est aussi de créer
  une échéance, deux actions nommées : « تسجيل دفعة » et « إضافة مستحق ». Bouton final « حفظ الدفعة ».
- **Effort** : S.
- **Fichiers** : `src/app/actions/useGradePaymentActions.ts`, `src/screens/modals/PaymentFormModal.tsx`,
  `src/screens/PaymentsScreen.tsx`.

#### UI-13 — Restes de bleu nuit et de gris bleuté dans l'interface émeraude
- **Rôle / écran** : tous (aperçu de carte), directeur (comptes).
- **Preuves** : `directeur/students-bureau.png`, `parent/students-bureau.png`, `eleve/students-mobile.png`
  (cadre et titres bleu marine de la carte, au milieu d'un écran vert),
  `directeur/settings-users-mobile.png` (en-tête de tableau et bascule « cartes / tableau » presque noirs).
- **Constat** : `OfficialCardFront` / `OfficialCardBack` posent `data-theme="bleu-nuit"` en dur, avec une
  ombre `rgba(16,36,70,…)` et un motif `#1B3A6B` (`src/print/cards/StudentCards.tsx`, lignes 69-73 et
  126-130) ; D88 garde la charte bleue pour l'**imprimé**, mais l'aperçu est affiché dans l'application.
  `UsersSection.tsx` utilise `bg-sand-900` / `border-sand-800` (`#1A1F2B`, `#2A3040`), jetons non thématisés.
  Même jetons dans `SalariesSection.tsx`, `PermissionMatrixEditor.tsx`, `StaffBadgeModal.tsx`,
  `StaffDirectoryModal.tsx`.
- **Pourquoi ça gêne** : deux identités visuelles sur la même page ; une école qui choisit un autre thème
  verra toujours du bleu.
- **Proposition** : laisser la charte bleue à l'impression, mais afficher l'aperçu avec le thème actif (ou
  le libeller « معاينة الطباعة » et le réduire, voir UI-17). Remplacer `sand-800/900` par `night` /
  `night-2` et ajouter ces jetons à la liste interdite de `tests/unit/themes.test.ts`.
- **Effort** : S.
- **Fichiers** : `src/print/cards/StudentCards.tsx`, `src/components/settings/UsersSection.tsx`, les quatre
  autres fichiers cités, `tests/unit/themes.test.ts`.

#### UI-14 — Avatars « prédéfinis » : photos d'inconnus chargées depuis Unsplash
- **Rôle / écran** : directeur, administratif ; « تسجيل طالب جديد في النادي ».
- **Preuves** : `directeur/fenetre-eleve-bureau.png` (six portraits sous « أو اختر من الرمزيات المسبقة
  للأطفال بالنادي »).
- **Constat** : `StudentFormModal.tsx:10-17` pointe vers six photos `images.unsplash.com` de personnes
  réelles, plutôt adultes, présentées comme avatars d'enfants. Le champ voisin demande une « URL » de photo.
- **Pourquoi ça gêne** : un élève peut se retrouver avec le visage d'un inconnu sur sa carte officielle ;
  l'image dépend d'un service tiers. « URL » est du jargon pour un secrétariat.
- **Proposition** : remplacer les photos par l'avatar à initiales déjà présent (`InitialAvatar`) en
  couleur du thème, ou par deux silhouettes neutres (garçon / fille) servies localement ; retirer le champ
  « URL » (garder dépôt de fichier et appareil photo).
- **Effort** : S.
- **Fichiers** : `src/screens/modals/StudentFormModal.tsx`, `src/ui/InitialAvatar.tsx`.

#### UI-15 — La police d'affichage est partout, et se lit mal en petit
- **Rôle / écran** : tous ; titres de cartes et de sections.
- **Preuves** : `directeur/dashboard-bureau.png` (« الحضور هذا الأسبوع » rendu sans espace visible entre les
  mots), `enseignant/grades-mobile.png` (« قائمة شهادات الاختبار المعتمدة » serré), `parent/notifications-mobile.png`
  (titre de page sur deux lignes à deux tailles apparentes).
- **Constat** : `src/index.css:149` applique Reem Kufi à `h1, h2, h3` ; chaque carte a donc un titre
  décoratif de même voix que le titre de page. À 15-18 px, l'espace entre mots de la police est très faible.
- **Pourquoi ça gêne** : tout est « titre », rien ne domine ; en petit, la lecture ralentit (surtout pour
  des parents peu à l'aise avec l'écrit).
- **Proposition** : réserver Reem Kufi au `h1` de page, au nom de l'école et à la carte du hifz ; titres de
  cartes en IBM Plex Sans Arabic 600 ; si Reem Kufi reste en `h2`, `word-spacing: 0.12em`.
- **Effort** : S.
- **Fichiers** : `src/index.css`, `src/ui/Card.tsx`, `src/ui/PageHeader.tsx`.

#### UI-16 — Le tableau de bord de l'enseignant ne propose pas la tâche du jour
- **Rôle / écran** : enseignant, « لوحة المحفّظ ».
- **Preuves** : `enseignant/teacher-dashboard-bureau.png`, `enseignant/teacher-dashboard-mobile.png`.
- **Constat** : accueil, carte « التخصص الحالي », quatre chiffres, halaqa, puis la liste des élèves avec le
  même bouton « متابعة الحفظ والتجويد » répété sur chaque ligne. Rien n'indique la séance du jour ni ne mène à
  l'appel. À 1 440 px, la colonne des noms est si étroite que « طارق السوسي » passe sur deux lignes.
- **Pourquoi ça gêne** : l'enseignant ouvre l'application pour deux gestes (appel, suivi du hifz) ; il
  doit passer par le menu.
- **Proposition** : en tête, une carte « حصة اليوم » (halaqa, horaire, état de l'appel) avec « تسجيل الحضور »
  en bouton principal ; rendre la ligne de l'élève entièrement cliquable vers le suivi du hifz au lieu du
  bouton répété ; retirer « التخصص الحالي ».
- **Effort** : M.
- **Fichiers** : `src/screens/TeacherDashboardScreen.tsx`.

#### UI-17 — L'aperçu recto verso de la carte occupe la moitié de l'écran « élèves »
- **Rôle / écran** : tous ; bas de l'écran élèves.
- **Preuves** : `directeur/students-bureau.png` (≈ 1 050 px sur 2 470), `parent/students-mobile.png` et
  `eleve/students-mobile.png` (≈ 60 % de la page à 390 px).
- **Constat** : `StudentCard` rend en permanence les deux faces de 390 × 550 px sous la fiche, avec le
  bouton « طباعة وتصدير بطاقة الطالب ».
- **Pourquoi ça gêne** : la carte s'imprime une fois par an ; elle repousse tout le reste et alourdit la
  page sur téléphone.
- **Proposition** : un bouton « بطاقة الطالب » dans la fiche, qui ouvre l'aperçu dans une fenêtre (ou
  renvoie à « بطاقات الهوية ») ; rien pour la famille si elle n'a pas le droit d'imprimer.
- **Effort** : S.
- **Fichiers** : `src/components/StudentCard.tsx`, `src/screens/StudentsScreen.tsx`.

### Priorité basse

#### UI-18 — Personnel : chiffres et filtres en double, cartes creuses, actions de même poids
- **Rôle / écran** : directeur, « العاملون والمدرّسون ».
- **Preuves** : `directeur/teachers-bureau.png`, `directeur/teachers-mobile.png`.
- **Constat** : sept chiffres (إجمالي، أعضاء المكتب، محفظون…) puis huit puces de filtre avec les mêmes
  nombres ; à 390 px, les chiffres prennent ≈ 500 px avec une case vide. Les cartes ont des hauteurs
  imposées avec de grands vides ; chaque carte porte quatre actions (« شارة العمل »، « تعديل »، « أرشفة »
  en ambre, corbeille), l'archivage aussi visible que la modification.
- **Proposition** : supprimer la rangée de chiffres (les puces portent déjà les nombres) ; cartes à hauteur
  naturelle ; « تعديل » en action principale, le reste dans un menu « ⋯ ».
- **Effort** : S.
- **Fichiers** : `src/components/TeacherManagement.tsx`, `src/components/staff/StaffList.tsx`.

#### UI-19 — Comptabilité : le total des recettes est affiché deux fois
- **Rôle / écran** : directeur, « المحاسبة ».
- **Preuves** : `directeur/finance-bureau.png`, `directeur/finance-mobile.png`.
- **Constat** : « إجمالي المداخيل 1,320 » dans la rangée du haut, puis « مجموع الإيرادات الكلي 1.320 » dans
  une carte sombre mise en avant, quatre blocs plus bas ; trois cartes de détail identiques à icône ronde
  entre les deux.
- **Proposition** : garder le total en haut ; transformer les trois cartes en une ligne de répartition
  (« رسوم 770 · تبرعات 500 · أنشطة 50 ») ; supprimer la carte sombre.
- **Effort** : S.
- **Fichiers** : `src/components/FinanceManagement.tsx`, `src/components/finance/*`.

#### UI-20 — Présence de la semaine : jours sans séance et « 0 % » alarmant
- **Rôle / écran** : directeur, tableau de bord.
- **Preuves** : `directeur/dashboard-bureau.png`, `directeur/dashboard-mobile.png` (à 390 px, les cases
  débordent à gauche et « الجمعة » est coupé).
- **Constat** : sept cases pour sept jours alors que les halaqas ont lieu trois jours ; un dimanche matin,
  les absences automatiques font afficher « هذا الأسبوع 0% » contre 92 % la semaine passée.
- **Proposition** : n'afficher que les jours où une halaqa a lieu ; ne compter une séance qu'une fois
  terminée (ou afficher « الحصة جارية ») ; à 390 px, barres horizontales par jour.
- **Effort** : S.
- **Fichiers** : `src/screens/dashboard/WeeklyAttendance.tsx`.

#### UI-21 — Filtres et recherche pour des listes de un ou deux éléments
- **Rôle / écran** : parent, élève ; examens, élèves.
- **Preuves** : `parent/grades-mobile.png` (recherche + trois listes « جميع الحلقات / التقديرات / الفترات »
  pour 2 résultats, puis un grand bloc décoratif « شهادة حفظ وتميز تجويدي »), `eleve/students-mobile.png`.
- **Proposition** : masquer recherche et filtres sous 8 éléments (seuil de la pagination D83) ; retirer le
  bloc décoratif pour la famille, ou le remplacer par le dernier certificat de l'enfant.
- **Effort** : S.
- **Fichiers** : `src/screens/GradesScreen.tsx`, `src/screens/StudentsScreen.tsx`.

#### UI-22 — Notifications : la seule action visible est destructive
- **Rôle / écran** : directeur, « الإشعارات ».
- **Preuves** : `directeur/notifications-bureau.png`.
- **Constat** : un bouton rouge « مسح جميع التنبيهات » en tête (avec confirmation depuis D83), mais pas de
  « تعليم الكل كمقروء » ; chaque notification dit « جديد • انقر لتعليم كمقروء ».
- **Proposition** : « تعليم الكل كمقروء » en action principale ; « مسح الكل » en action secondaire
  discrète ; pastille « جديد » seule, la ligne entière cliquable.
- **Effort** : S.
- **Fichiers** : `src/screens/NotificationsScreen.tsx`.

#### UI-23 — Le sélecteur de langue de test masque du contenu
- **Rôle / écran** : tous, builds de test seulement (absent de la production, `src/main.tsx:19-23`).
- **Preuves** : `enseignant/teacher-dashboard-mobile.png` (couvre « 5 / 20 طلاب »),
  `directeur/attendance-bureau.png` (couvre un bouton « غائب »), `parent/classes-mobile.png`.
- **Constat** : pastille « TEST AR FR » fixe en bas à gauche (`src/i18n-test/fr.css:8-11`), au-dessus des
  boutons d'action côté gauche en RTL.
- **Proposition** : la réduire à un bouton rond repliable, ou la placer dans le menu de l'avatar ; à défaut,
  `pointer-events` et opacité réduite hors survol.
- **Effort** : S.
- **Fichiers** : `src/i18n-test/fr.css`, `src/i18n-test/switcher.ts`.

## 3. Ce qui marche bien (à garder)

- **Connexion** (`connexion/connexion-*.png`) : sobre, une seule action, aide sous le champ « اسم
  المستخدم » qui prévient l'erreur la plus courante (nom complet ou téléphone), verset en Amiri sur le
  panneau émeraude. C'est la page la plus aboutie.
- **Application du thème émeraude** : barre latérale, élément actif, boutons primaires, carte du hifz et
  états des présences sont cohérents ; l'or reste un accent (point actif, chiffre du hizb le plus avancé,
  barre du tajwid) et n'est pas utilisé comme couleur de texte sur fond sable, donc pas de problème de
  contraste or sur vert ou sur sable relevé.
- **Carte du hifz** (`directeur/dashboard-bureau.png`) : vraie visualisation porteuse d'information, propre
  au domaine, avec la liste des élèves du hizb choisi. C'est le bon « élément fort » du tableau de bord.
- **Bloc « تحتاج إجراء »** : deux alertes rédigées du point de vue de l'utilisateur, avec un lien d'action
  explicite (« مراجعة الملفات »، « تنظيم الحلقات »).
- **Boutons de présence** (`directeur/attendance-bureau.png`) : trois choix avec icône et texte, cibles
  d'environ 44 px, état « غائب » plein et sans ambiguïté.
- **Plancher technique** : `:focus-visible` global (`src/index.css:152`), liste déroulante maison
  accessible au clavier (D83), pagination, numéros de téléphone isolés en `bdi dir="ltr"` (ils s'affichent
  dans le bon ordre), états vides rédigés avec une phrase d'explication.
- **Choix d'école** (`directeur/choix-ecole-superadmin-mobile.png`) et **sélecteur de thème**
  (`directeur/settings-bureau.png`) : clairs, vignettes parlantes, état choisi évident.

## 4. Suivi

### Lot « parcours famille, élèves et tableaux » (D89, branche `fix/audit-ui-famille`)

- **UI-01** : corrigé (D89). Onglet « ملخص » pour `ولي أمر` et `طالب`, une carte par enfant ; recherche, compteur, papiers et aperçu de carte retirés de l'écran famille.
- **UI-02** : corrigé (D89). Présences en lecture seule pour la famille, `إداري` et `مؤطر` ; entrée du menu retirée pour les rôles qui ne peuvent pas lire les présences. Règles inchangées.
- **UI-03** : corrigé (D89), option « masquer la ligne » (pas de nom dénormalisé, règles inchangées) ; la famille ne voit que les halaqas de ses enfants.
- **UI-06** : corrigé (D89) pour les élèves et les comptes ; `DataTable` a une variante cartes sous `md` pour les autres tableaux (à brancher par leurs propriétaires : comptabilité, paiements, personnel). Colonne d'actions de 1 440 px corrigée.
- **UI-07** : corrigé (D89) pour élèves, halaqas, examens côté famille, présences familles et accueil famille ; paiements et examens du bureau reportés (autres lots) ; `navLabel` (`src/shell/navModel.tsx`) donne le libellé du menu pour tous les onglets.
- **UI-13** : corrigé (D89) pour `UsersSection.tsx` seulement ; reporté : `SalariesSection.tsx`, `PermissionMatrixEditor.tsx`, `StaffBadgeModal.tsx`, `StaffDirectoryModal.tsx`, `StudentCards.tsx` et l'ajout de `sand-800/900` au garde-fou de `themes.test.ts` (autre lot).
- **UI-17** : corrigé (D89). Bouton « بطاقة الطالب » dans la fiche, aperçu dans une fenêtre.
- **UI-21** : corrigé (D89) pour les élèves, les halaqas et les examens ; bloc décoratif retiré pour la famille.
