# Runbook — accueillir une nouvelle école (après la bascule multi-écoles)

> **À EXÉCUTER PAR UN HUMAIN** : le super-admin de la plateforme, puis le
> directeur de la nouvelle école. Aucune commande de ce document n'a été
> lancée par un agent sur un vrai projet. Les seuls essais ont eu lieu sur les
> émulateurs, avec des données fictives.
> Décisions : D25 (super-admin), D27 (paramètres par école), D71 (compte
> super-admin jamais désactivé automatiquement), D72 (import CSV).
> Modèles de messages : `docs/communication/`. Conformité : `docs/conformite/CNDP.md`.
>
> Les libellés de l'interface cités ici sont ceux de la version actuelle. La
> nouvelle interface (`feat/design`) peut les changer, pas le déroulé.

## 0. Prérequis

- [ ] La bascule multi-écoles est faite et vérifiée (`MIGRATION-BASCULE.md` §5).
- [ ] Le compte super-admin dédié existe (claim `superAdmin`, recommandé dans
      `MIGRATION-BASCULE.md` §0.4) et son mot de passe est fort et personnel.
- [ ] Les Cloud Functions déployées contiennent D71 (`fix/revue-durcissement`
      ou plus récent). Sinon, ne PAS retirer le super-admin de l'école au §4.3 :
      son compte serait désactivé.
- [ ] Accord écrit avec l'école (voir `docs/conformite/CNDP.md` §3) : l'école
      est responsable du traitement de ses données, la plateforme est
      sous-traitante. Déclaration ou autorisation CNDP de l'école : à vérifier
      avec elle avant d'y saisir des données d'élèves.
- [ ] Une sauvegarde récente existe (PITR actif ou export de la veille,
      `SAUVEGARDES.md`).

## 1. Fiche d'accueil à remplir avec l'école (avant toute saisie)

| Information | Exemple (fictif) | Où elle va |
|---|---|---|
| Nom officiel de l'école ou de l'association | جمعية النور للتعليم العتيق | `schools/{id}.name`, `settings/system.associationName` |
| Identifiant technique (définitif) | `annour` | identifiant du document `schools/{id}` |
| Logo (PNG/JPEG, de préférence < 300 Ko) | — | `associationLogo` |
| Téléphone, e-mail, adresse | — | `associationPhone`, `associationEmail`, `associationAddress` |
| Nom du directeur et du superviseur général | — | `directorName`, `generalSupervisorName` |
| Cotisation mensuelle de référence | 80 درهم | `subscriptionFee` |
| Tarifs particuliers (mois réduits) | يوليوز 2027 : 50 | `feeOverrides` |
| Année et mois d'ouverture (début de facturation) | 2026 / شتمبر | `openingYear`, `openingMonth` |
| Saison scolaire active | 2026/2027 | `activeAcademicSeason` |
| Format des numéros de reçus | `NUR-{YEAR}-{NO}` | `receiptPrefixFormat` |
| Texte du tampon des reçus | — | `stampText`, `showStampOnReceipts` |
| Âge minimal d'un compte élève | 15 | `studentAccountMinAge` |
| Liste du personnel (nom, fonction, rôle dans l'application, téléphone) | — | fiches `teachers` + comptes |
| Liste des halaqas (nom exact, enseignant, horaire) | حلقة الفرقان | `classes` |
| Liste des élèves (tableur) et des parents à qui ouvrir un compte | — | `students`, comptes famille |

Choix de l'**identifiant technique** : minuscules, chiffres et tirets, 2 à 40
caractères (`^[a-z0-9][a-z0-9-]{1,39}$`). Il est **définitif** (identifiant
du document, présent dans chaque donnée) et visible par les utilisateurs dans
le sélecteur d'école. Pas de nom de personne ni de ville seule.

Correspondance fonction → rôle (valeurs exactes de l'application) :

| Fonction | Rôle |
|---|---|
| Directeur de l'école | `مدير` (un seul de préférence ; il crée les comptes et réinitialise les mots de passe) |
| Secrétaire, trésorier (finances, dossiers, salaires) | `إداري` |
| Superviseur pédagogique (halaqas, affectations) | `مؤطر` |
| Enseignant, mouhaffidh | `مدرس` |
| Bénévole | `متطوع` |
| Entretien | `عامل نظافة / صيانة` |
| Autre | `أخرى` |
| Parent | `ولي أمر` (lié à 30 élèves au plus) |
| Élève (à partir de l'âge minimal) | `طالب` |

## 2. Création de l'école (super-admin)

1. Se connecter avec le compte super-admin.
2. Ouvrir le sélecteur d'école : barre du haut › « كل المدارس… ».
3. Remplir « إنشاء مدرسة جديدة (المشرف العام) » : nom (اسم المدرسة) et
   identifiant (`school-id`), puis « إنشاء المدرسة (وتعييني مديراً لها) ».
   La Cloud Function `createSchool` crée :
   - `schools/{id}` ;
   - `schools/{id}/settings/system`, avec les paramètres par défaut :
     cotisation 100, saison en cours, ouverture au mois courant, reçus
     `REC-{YEAR}-{NO}` ;
   - l'appartenance du super-admin comme `مدير`. Elle est **temporaire** : elle
     sert à créer le vrai directeur (§4).
   Un identifiant déjà pris est refusé (`already-exists`).
4. Choisir la nouvelle école dans le sélecteur.

## 3. Paramètres de l'école

« إعدادات النظام وإدارة المستخدمين » (ou « الإعدادات والمستخدمين ») :
- identité : « اسم الجمعية / المدرسة », superviseur, directeur, téléphone,
  e-mail, adresse, « شعار المؤسسة الرسمي » (logo) ;
- facturation : « رسوم الاشتراك الشهري المرجعية », « سنة الافتتاح الرسمي »,
  « شهر الافتتاح الرسمي ». Aucune cotisation n'est générée pour les mois
  antérieurs. Ajouter les mois réduits dans « تعريفات خاصة لبعض الأشهر » ;
- « الموسم الدراسي النشط » ;
- « صيغة ترقيم الوصولات » : `{YEAR}` et `{NO}` sont remplacés. Choisir un
  préfixe propre à l'école (ex. `NUR-`) pour ne jamais confondre ses reçus
  avec ceux d'une autre école ;
- textes des reçus et du tampon.

Ces paramètres peuvent être saisis par le super-admin à cette étape, ou
laissés au directeur (§4). Seul un `مدير` (ou le super-admin) les modifie.

## 4. Directeur, puis départ du super-admin

### 4.1 Créer le compte du directeur (super-admin)
« إدارة المستخدمين والصلاحيات » › « إضافة مستخدم جديد » :
- « الاسم الكامل » : nom du directeur ;
- « اسم المستخدم (Username) » : unique sur **toute la plateforme**, en
  minuscules latines (ex. `dir_annour`). Un identifiant pris dans une autre
  école est refusé ;
- « كلمة المرور المؤقتة » : 12 caractères aléatoires au moins, générés par un
  gestionnaire de mots de passe (pas un mot de passe réutilisé, pas « 123 ») ;
- rôle : `مدير`.
La Cloud Function `createSchoolUser` crée le compte Auth, `users/{uid}` (avec
`mustChangePassword: true`), l'appartenance et l'entrée du registre
`usernames`. Le directeur devra changer son mot de passe à la première connexion.

### 4.2 Remettre les identifiants au directeur
En personne ou par un canal individuel (§7, modèle
`docs/communication/identifiants.md` › directeur). Ne garder aucune copie du
mot de passe temporaire après la remise.

### 4.3 Retirer le super-admin de l'école
Une fois que le directeur s'est connecté et a changé son mot de passe :
le **directeur** ouvre « إدارة المستخدمين والصلاحيات », trouve le compte du
super-admin et le supprime de l'école. Le super-admin ne doit pas garder
d'accès implicite aux données (D25). Depuis D71, son compte reste actif même
s'il n'appartient plus à aucune école.

Pour une intervention ultérieure (assistance), le directeur rattache de
nouveau le compte du super-admin (création avec « rattacher un compte
existant », `attachExisting`), puis le retire à la fin.

## 5. Personnel, halaqas, élèves, familles (directeur)

Ordre conseillé (les liens se font vers des fiches existantes) :

1. **Fiches du personnel** : « شؤون العاملين والمدرسين ». Le salaire, le
   contrat, la CIN, l'adresse, le contact d'urgence et la date de naissance
   sont enregistrés dans la fiche RH (`staffPrivate`), lisible par le bureau
   seulement.
2. **Comptes du personnel** : « إضافة مستخدم جديد », rôle selon le tableau
   du §1, « ملف العامل / المدرس المرتبط » = sa fiche. Une personne qui exerce
   déjà dans une autre école garde son compte : la rattacher au lieu d'en
   créer un second. Sa réinitialisation de mot de passe relève alors du
   super-admin.
3. **Halaqas** : « الفصول والحلقات الدراسية » (nom exact, enseignant, horaire).
4. **Élèves** : saisie dans « إدارة ملفات الطلاب », ou import CSV (§5.1).
5. **Comptes familles** : parent (`ولي أمر`) lié à ses enfants (« الأبناء
   المرتبطون بهذا الحساب », 30 au plus) ; élève (`طالب`) lié à son dossier,
   s'il a l'âge minimal. Jamais de compte partagé entre deux familles.

### 5.1 Import CSV des élèves (optionnel, par un humain)
Quand l'école arrive avec plusieurs dizaines d'élèves dans un tableur.

1. Préparer le fichier à partir du modèle
   `scripts/admin/templates/eleves-modele.csv` (UTF-8, séparateur `,` ou `;`,
   données de l'école). Colonnes obligatoires : `fullName` et `gender`
   (`ذكر` / `أنثى`). La colonne `className` doit reprendre le nom **exact**
   d'une halaqa déjà créée. Aucune colonne de mot de passe n'est acceptée.
2. Garder le fichier hors du dépôt et le supprimer après l'import : il
   contient des données de mineurs.
3. Simulation (par défaut, aucune écriture) depuis un poste d'administration
   authentifié (`gcloud auth application-default login` par l'humain) :
   ```bash
   export PROJECT=gen-lang-client-0481880143 DB=ai-studio-a6572431-c7db-4071-82bf-a922d18511ec
   npx tsx scripts/admin/import-students.ts --project=$PROJECT --database=$DB \
     --school=<id> --file=/chemin/hors-depot/eleves.csv
   ```
   Lire `scripts/admin/out/import-<id>-<date>/rapport.csv`. Il donne les
   numéros de ligne, les identifiants prévus et les codes d'anomalie
   (`GENRE_INVALIDE`, `DATE_NAISSANCE_INVALIDE`, `HALAQA_INCONNUE`,
   `HALAQA_AMBIGUE`, `DOUBLON_FICHIER`, `DEJA_PRESENT`, …). Corriger le
   fichier et relancer jusqu'à 0 ligne rejetée. Une ligne `DEJA_PRESENT`
   (même nom et même date de naissance) n'est jamais recréée.
4. Application, **avant** d'ouvrir l'école aux utilisateurs (sinon, un élève
   créé dans l'interface au même moment peut prendre le même identifiant) :
   ```bash
   npx tsx scripts/admin/import-students.ts --project=$PROJECT --database=$DB \
     --school=<id> --file=/chemin/hors-depot/eleves.csv --apply --confirm-prod=$PROJECT
   # Ajouter --payments=ui pour créer les cotisations « غير مدفوع » depuis la
   # date d'inscription, comme le fait l'interface (à décider avec l'école).
   ```
5. Supprimer le CSV et le dossier `scripts/admin/out/import-*`.
6. Contrôler dans l'interface : nombre d'élèves, quelques fiches, halaqas.
Retour arrière : chaque élève importé porte `importBatch`. Le directeur peut
supprimer une fiche dans l'interface ; une suppression en masse se fait par
l'Admin SDK, par un humain.

## 6. Ouverture de l'école

- Vérifier les paramètres (§3), en particulier l'ouverture et la cotisation,
  avant la première cotisation enregistrée.
- Rapport IA : chaque école dispose de 300 rapports par jour (limite
  `AI_DAILY_LIMIT_PER_SCHOOL`, `PROXY-IA.md`). Au-delà de trois écoles, revoir
  la limite globale (D66).
- Sauvegardes : l'export quotidien couvre toute la base, nouvelle école comprise.

## 7. Remise des identifiants

- Une remise par personne, en main propre ou par message individuel (jamais
  dans un groupe WhatsApp, jamais par affichage). Modèles en arabe et en
  français : `docs/communication/identifiants.md`.
- Le mot de passe temporaire est changé à la première connexion (obligatoire).
- Un mot de passe oublié : le directeur le réinitialise (« إعادة تعيين كلمة
  المرور »), puis le remet de la même façon. Les sessions ouvertes sont
  fermées. Le compte d'une personne présente dans plusieurs écoles se
  réinitialise par le super-admin.
- Guide court pour le directeur : `docs/communication/guide-directeur.md`.

## 8. Vérifications d'isolation (le jour de l'ouverture)

À faire avec un compte de chaque école. Noter le résultat dans le registre
d'exploitation.

1. **Directeur de la nouvelle école** :
   - le sélecteur ne propose que son école ;
   - les listes (élèves, personnel, finances, notifications) ne montrent que
     ses données ;
   - aucun élève ni aucune fiche de l'autre école n'apparaît dans la recherche.
2. **Directeur de l'école existante** : la nouvelle école n'apparaît pas dans
   son sélecteur et ses chiffres n'ont pas changé.
3. **Enseignant de la nouvelle école** : ses halaqas seulement ; dans la liste
   du personnel, ni salaire ni CIN.
4. **Parent de la nouvelle école** : ses enfants seulement, et leurs cotisations.
5. **Super-admin** (après le §4.3) : la nouvelle école apparaît dans
   « كل المدارس… » avec la mention « لست عضواً », et ses données ne s'ouvrent pas.
6. **Console Firestore** (lecture seule, par l'humain) :
   - `schools/<id>/members` contient exactement les comptes prévus ;
   - chaque `users/<uid>` des nouveaux comptes a `schoolIds: ["<id>"]` (ou
     plusieurs écoles pour les comptes rattachés) ;
   - aucun document n'existe à la racine hors `users`, `usernames`, `schools`
     et `aiQuota`.
7. **Reçu de test** : numéro au format de l'école, nom et logo de la nouvelle
   école ; puis supprimer le paiement de test.
En cas d'écart : suspendre les comptes concernés (« حالة الحساب ») et
examiner avant de continuer. Les règles sont testées
(`tests/emulator/tenant-rules.test.ts` › isolation entre écoles), mais un
écart en prod révèle presque toujours une erreur de saisie (compte rattaché à
la mauvaise école, lien vers le mauvais élève).

## 9. Retirer une école (si l'accueil est abandonné)

Aucune fonction ne supprime une école : c'est volontaire.
1. Export de l'école (`gcloud firestore export … --collection-ids=…`, ou
   export complet) vers `gs://<bucket>/manuel/…`, à remettre à l'école si
   elle le demande (CNDP : droit d'accès, restitution).
2. Le directeur (ou le super-admin) retire tous les membres de l'école :
   suppression dans « إدارة المستخدمين ». Un compte sans autre école est
   désactivé.
3. Suppression des documents `schools/<id>/**` par un humain, à la console
   (supprimer le document avec ses sous-collections), puis des entrées
   `usernames` et des comptes Auth devenus inutiles.
4. Supprimer l'export manuel dès qu'il n'est plus nécessaire.
