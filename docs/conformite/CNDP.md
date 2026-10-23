# Protection des données personnelles : liste de contrôle (loi marocaine 09-08)

> **CE DOCUMENT N'EST PAS UN AVIS JURIDIQUE.** C'est une liste de contrôle
> technique rédigée par un agent, sans accès au web, à partir de la
> connaissance générale de la loi n° 09-08 relative à la protection des
> personnes physiques à l'égard du traitement des données à caractère
> personnel, et de la Commission nationale de contrôle de la protection des
> données à caractère personnel (CNDP). **Il doit être relu et validé par un
> juriste ou un conseil au fait du droit marocain, et confronté aux textes en
> vigueur et aux formulaires et délibérations de la CNDP.**
>
> Aucun numéro d'article, délai, montant ni nom de formulaire n'est donné
> volontairement : tout ce qui est marqué **[À VÉRIFIER]** doit être confirmé
> sur les textes officiels (loi 09-08, son décret d'application, site de la CNDP).
>
> Périmètre : l'application multi-écoles (`schools/{schoolId}/…`), après la
> bascule. Les différences du Lot 0 sont signalées.

## 1. Données traitées (inventaire tiré du code)

| Catégorie | Personnes | Données | Où (code / base) | Remarques |
|---|---|---|---|---|
| Dossier de l'élève | élèves, **en majorité mineurs** | nom complet, date de naissance, genre, date d'inscription, halaqa, **photo**, pièces fournies (cases), notes libres | `schools/{s}/students` | Les notes libres peuvent contenir des données de santé ou de comportement : consigne à donner (§6) |
| Parents | parents ou tuteurs | nom, téléphone, e-mail | champs `parentName`, `parentPhone`, `parentEmail` de l'élève ; comptes famille | |
| Suivi pédagogique | élèves | présence, notes d'examens, progression (hizb, sourates, tajwid) | `attendance`, `grades`, `dailyProgress` | |
| Finances des familles | parents, élèves | cotisations, montants, dates, reçus | `payments` | Obligations comptables : conservation [À VÉRIFIER] |
| Personnel (fiche publique) | personnel, bénévoles | nom, fonction, catégorie, téléphone, WhatsApp, e-mail, horaires, affectations, photo | `teachers` | Lisible par l'équipe pédagogique |
| Personnel (fiche RH) | personnel | **salaire, type de contrat, numéro de CIN, adresse, contact d'urgence, date de naissance** | `staffPrivate` (bureau seulement, D42) | **Lot 0 : ces champs sont encore dans `teachers`, lisibles par la pédagogie (R-06, D71)** |
| Paie et dépenses | personnel, fournisseurs | salaires versés, dépenses | `salaryPayments`, `expenses`, `otherIncomes` | |
| Comptes d'accès | tous les utilisateurs | identifiant, nom, rôle, école(s), dernière connexion ; e-mail technique et empreinte du mot de passe dans Firebase Auth | `users`, `schools/{s}/members`, `usernames`, Firebase Auth | Aucun mot de passe dans Firestore |
| Journaux techniques | utilisateurs | pseudonyme de l'uid, école, issue, durée ; adresse IP dans les journaux de la plateforme Google | Cloud Logging | Aucune donnée d'élève dans les journaux des Functions |
| Cache local | utilisateurs de l'appareil | copie des données lues | `localStorage` du navigateur (`kuttab:{école}:…`) | Purgé à la déconnexion et à la fin de session (D40) ; risque sur les ordinateurs partagés |
| Sauvegardes | toutes | copie complète de la base | bucket d'exports, PITR | Voir §5 |

**Catégorie sensible.** L'inscription dans une école coranique peut révéler
des convictions religieuses. La loi 09-08 range ces données parmi les données
sensibles, avec un régime renforcé (consentement exprès ou autorisation)
**[À VÉRIFIER]**. Les données de santé éventuelles (notes libres) aussi.
**[À VÉRIFIER : faut-il une autorisation de la CNDP plutôt qu'une simple déclaration pour ce traitement ?]**

**Mineurs.** La majorité des personnes concernées sont des mineurs : le
consentement et l'exercice des droits passent par le représentant légal
**[À VÉRIFIER : règles et âge applicables]**.

## 2. Rôles : responsable du traitement et sous-traitant

- [ ] **Chaque école (association) est responsable du traitement** de ses
      élèves, familles et personnel : elle décide des finalités et des données.
- [ ] **L'exploitant de la plateforme** (propriétaire du projet Firebase) est
      **sous-traitant** pour les écoles qu'il héberge. Pour l'école qui
      exploite elle-même la plateforme (aujourd'hui `alfajr`), il est aussi
      responsable du traitement pour ses propres données. À clarifier par
      écrit : quelle personne morale exploite la plateforme ?
- [ ] **Sous-traitants ultérieurs** à déclarer aux écoles :
      - Google : Firebase Auth, Firestore, Hosting, Cloud Functions, Cloud
        Storage, Cloud Logging, reCAPTCHA Enterprise si App Check est activé
        (aucun service d'IA : rapport IA retiré, D76) ;
      - GitHub : code et déploiement ; rapports des scripts de données
        (artefacts de 1 à 3 jours, chiffrés pour le propriétaire depuis D74).
        Les journaux n'affichent que des compteurs ;
      - `api.qrserver.com` : les QR codes des cartes y envoyaient identifiant,
        nom et catégorie (O-05, D49). Retiré par le nouveau design (QR codes
        générés localement, D61) : vérifier que la version en production
        l'inclut ;
      - Google Fonts : adresse IP des visiteurs.
- [ ] Le super-admin de la plateforme n'a **aucun accès implicite** aux
      données des écoles (D25). Il ne les voit que s'il est rattaché, ce qui
      est temporaire et décidé par l'école (`NOUVELLE-ECOLE.md` §4.3).

## 3. Contrat de sous-traitance (par école)

Clauses à prévoir **[À VÉRIFIER avec un juriste]** :
- [ ] objet, durée, nature et finalités des traitements, catégories de
      données et de personnes (reprendre le §1) ;
- [ ] traitement sur instruction documentée de l'école seulement ;
- [ ] confidentialité des personnes habilitées (super-admin, exploitant) ;
- [ ] mesures de sécurité (§8) et notification des incidents à l'école, avec
      un délai à fixer **[À VÉRIFIER : obligation légale de notification ?]** ;
- [ ] liste des sous-traitants ultérieurs et information préalable de l'école
      en cas de changement ;
- [ ] localisation des données et transferts hors du Maroc (§7) ;
- [ ] aide à l'exercice des droits (§6) ;
- [ ] fin du contrat : restitution (export) puis suppression, avec délai et
      attestation (`NOUVELLE-ECOLE.md` §9) ; les sauvegardes s'effacent dans
      les 45 jours ;
- [ ] droit d'audit de l'école.

## 4. Information et consentement

- [ ] **Fiche d'information des parents**, remise à l'inscription en arabe
      (et en français si utile). Elle indique :
      - le responsable du traitement (l'école) et son contact ;
      - les finalités : scolarité, suivi pédagogique, cotisations, communication ;
      - les destinataires : personnel habilité de l'école, sous-traitants (§2) ;
      - la durée de conservation (§5) et les droits (§6) ;
      - l'hébergement hors du Maroc (§7) ;
      - les mentions obligatoires **[À VÉRIFIER : liste exacte]**.
- [ ] **Consentement écrit du représentant légal**, distinct pour :
      - le traitement des données de l'élève (catégorie sensible, §1) ;
      - la **photo** de l'élève, utilisée pour le dossier, les cartes et les
        badges ; la refuser doit rester possible sans gêner l'inscription ;
      - la **création d'un compte élève** (à partir de l'âge minimal de l'école).
      **[À VÉRIFIER : forme et preuve du consentement exigées.]**
- [ ] **Personnel** : information sur la fiche RH (salaire, CIN), ses
      destinataires (bureau seulement après la bascule) et sa durée de conservation.
- [ ] Conserver la preuve des consentements (papier ou scan, hors application).
- [ ] Le modèle de message aux parents (`docs/communication/identifiants.md`
      §3) rappelle déjà le contact pour exercer les droits.

## 5. Durées de conservation (à fixer par chaque école)

Les valeurs ci-dessous sont des **propositions** à valider **[À VÉRIFIER :
obligations légales, comptables, sociales]**.

| Données | Proposition | Mise en œuvre |
|---|---|---|
| Dossier de l'élève et suivi pédagogique | durée de la scolarité, puis archivage limité (ex. 1 à 3 ans pour les attestations), puis suppression | archivage dans l'interface ; suppression manuelle (voir §6, suppression complète) |
| Photos | jusqu'au départ de l'élève ou au retrait du consentement | effacer le champ `photo` dans la fiche |
| Cotisations et reçus | durée comptable légale **[À VÉRIFIER]** | ne pas supprimer avant ce terme |
| Fiche RH et paie | durée légale sociale et fiscale **[À VÉRIFIER]** | `staffPrivate`, `salaryPayments` |
| Comptes d'accès | suspension au départ ; suppression à la fin de l'année scolaire | « حالة الحساب », retrait de l'école |
| Journaux Cloud Logging | durée par défaut de la plateforme (de l'ordre de 30 jours) **[À VÉRIFIER dans la console]** | réglage du bucket de journaux |
| Sauvegardes | PITR 7 jours ; exports 30 jours (au plus 45) | `SAUVEGARDES.md` |
| Exports manuels (`manuel/…`), CSV d'import, rapports de scripts | supprimés dès la fin de l'opération | runbooks |
| Copie des données réelles dans le projet de dev (répétitions de la bascule, `ops.yml` › `import-firestore`) | supprimée après la dernière répétition | base du dev à vider par un humain ; accès limité (D74) |
| Cache des navigateurs | jusqu'à la déconnexion | purge automatique (D40) |

- [ ] Une revue annuelle (à la rentrée) des élèves partis, des comptes et des archives.
- [ ] Les données des élèves partis sont aujourd'hui seulement **archivées**
      (masquées) : aucune suppression automatique n'existe. Toute suppression
      est une action du directeur ou de l'exploitant.

## 6. Droits des personnes : accès, rectification, opposition, suppression

Point de contact : **le directeur de chaque école** (responsable du
traitement). L'exploitant l'aide techniquement (contrat, §3).
**[À VÉRIFIER : délai de réponse légal, et vérification de l'identité du demandeur.]**

| Droit | Comment, aujourd'hui | Manque |
|---|---|---|
| Information | fiche d'information (§4) | à rédiger |
| Accès | le parent voit dans son compte le dossier, la présence, les notes et les cotisations de ses enfants. Copie complète sur demande : impression de la fiche, ou export par l'exploitant (console, Admin SDK) | aucun export « en un clic » de toutes les données d'une personne |
| Rectification | le directeur ou le personnel habilité corrige la fiche dans l'interface | — |
| Opposition, retrait du consentement | arrêt de l'utilisation concernée : photo effacée, compte suspendu | — |
| Suppression | la suppression d'un élève dans l'interface efface sa fiche, mais **pas** ses présences, notes, progressions ni cotisations (documents séparés). Une suppression complète passe par l'exploitant, sauf les cotisations soumises à conservation légale | outil de suppression complète par élève (Admin SDK, simulation par défaut), à écrire si les demandes sont fréquentes |

Après une suppression, les données subsistent dans les sauvegardes jusqu'à
leur expiration (45 jours au plus) : le dire dans la réponse au demandeur.

Consigne à donner au personnel : les **notes libres** ne contiennent ni
diagnostic médical, ni information familiale sensible, ni jugement sur la
personne. Seulement ce qui est utile au suivi pédagogique.

## 7. Localisation des données et transferts hors du Maroc

- [ ] **Base Firestore** : son emplacement n'est pas connu du dépôt.
      L'exploitant le relève (`gcloud firestore databases describe … --format="value(locationId)"`,
      par un humain) et le note ici. Les Functions sont en `europe-west1`
      (Belgique) ; le bucket de sauvegarde est prévu dans l'UE.
- [ ] **Transfert vers l'étranger** : l'hébergement dans l'UE (et
      éventuellement aux États-Unis pour certains services Google) est un
      transfert hors du Maroc. La loi 09-08 l'encadre (pays assurant une
      protection suffisante, ou autorisation de la CNDP)
      **[À VÉRIFIER : régime applicable, liste des pays reconnus, formalités]**.
- [ ] Vérifier que la version en production génère les QR codes localement
      (D61) : plus d'envoi de noms à `api.qrserver.com` (O-05).

## 8. Sécurité (état au 22/10/2026)

En place (multi-écoles) :
- [x] isolation par école dans les règles Firestore, testée sur émulateurs (D7, D42) ;
- [x] aucun mot de passe en base ; comptes créés seulement par les Cloud
      Functions ; mot de passe changé à la première connexion (D34) ;
- [x] fiches RH réservées au bureau (`staffPrivate`, D42) ;
- [x] échappement HTML des impressions (D37) ;
- [x] en-têtes de sécurité et CSP (D49) ;
- [x] purge du cache à la fin de session (D40) ;
- [x] aucune donnée envoyée à un service d'IA : rapport IA retiré (D76) ;
- [x] App Check préparé (D44) ;
- [x] déploiement par CI sans clé, environnements protégés (D46, D68) ;
- [x] sauvegardes et PITR préparés (D47, D69) ;
- [x] revues de sécurité adversariales (`docs/revues/`).

À faire, ou dépend d'une action humaine :
- [ ] exécuter les runbooks : PITR, sauvegardes, App Check, restriction des
      clés, arrêt du proxy ouvert d'AI Studio (O-01), désactivation de
      l'inscription libre (O-02) ;
- [ ] **Lot 0** : salaires et CIN visibles par la pédagogie jusqu'à la bascule
      (D71). Les mots de passe exposés avant le Lot 0 restent valables jusqu'à
      leur changement (`release/lot0`, D53) ;
- [ ] photos encore stockées dans les documents (D51) ;
- [ ] pas de double authentification pour les directeurs et le super-admin.
      À envisager : Firebase Auth le permet pour les comptes à e-mail réel
      **[À VÉRIFIER]** ;
- [ ] procédure d'incident : qui prévient l'école, les familles et
      éventuellement la CNDP, et dans quel délai **[À VÉRIFIER : obligations]** ;
- [ ] habilitations : liste nominative des personnes ayant un accès
      d'administration (propriétaires GCP, super-admin, relecteurs de la
      prod), revue semestrielle.

## 9. Formalités auprès de la CNDP

À établir avec un juriste. Chaque point est **[À VÉRIFIER]** :
- [ ] **Chaque école** (responsable du traitement) déclare ses traitements à
      la CNDP, ou demande une autorisation pour les données sensibles (§1) et
      les transferts (§7), **avant** d'utiliser l'application ;
- [ ] l'exploitant de la plateforme a-t-il une formalité propre, comme
      sous-traitant ou comme responsable pour sa propre école ?
- [ ] existe-t-il une procédure simplifiée ou une norme de la CNDP pour la
      gestion des élèves, du personnel ou des adhérents d'une association,
      dont ces traitements relèveraient ?
- [ ] le numéro de récépissé ou d'autorisation est-il à mentionner dans la
      fiche d'information des parents ?
- [ ] y a-t-il un délai ou une mise à jour à faire quand les traitements
      changent (nouveau sous-traitant) ?

## 10. Registre des traitements (modèle, une copie par école)

À tenir par l'école, avec l'aide de l'exploitant. Un registre écrit est une
bonne pratique, qu'il soit ou non exigé par la loi **[À VÉRIFIER]**.

| N° | Traitement | Finalité | Personnes | Données | Destinataires | Conservation | Sous-traitants / transfert | Base légale ou consentement | Formalité CNDP |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Gestion des élèves | inscription, dossier, halaqas | élèves (mineurs), parents | §1 « Dossier », « Parents » | personnel habilité | §5 | Google (UE) | consentement du représentant légal [À VÉRIFIER] | [À VÉRIFIER] |
| T2 | Suivi pédagogique | présence, notes, progression | élèves | présence, notes, hizb | enseignants, bureau, parents (leurs enfants) | §5 | Google (UE) | idem | |
| T3 | Cotisations | facturation, reçus | parents, élèves | montants, dates, reçus | bureau, parents (leurs enfants) | durée comptable | Google (UE) | contrat d'inscription [À VÉRIFIER] | |
| T4 | Personnel et paie | gestion RH, salaires | personnel, bénévoles | fiche publique et fiche RH | bureau (RH), pédagogie (fiche publique) | durée sociale et fiscale | Google (UE) | contrat de travail ou engagement [À VÉRIFIER] | |
| T5 | Comptes et sécurité | authentification, droits, traces | utilisateurs | identifiant, rôle, connexions, journaux | directeur, exploitant | §5 | Google (UE) | intérêt légitime ou nécessité [À VÉRIFIER] | |
| T6 | *(supprimé : rapport IA retiré, D76)* | | | | | | | | |
| T7 | Sauvegardes | continuité, restauration | toutes | copie de la base | exploitant | 7 j (PITR), 30 à 45 j (exports) | Google (UE) | sécurité | |
| T8 | Photos et cartes | dossier, badges, cartes | élèves, personnel | photo, nom, catégorie | personnel habilité | jusqu'au départ | Google (UE) ; QR codes locaux (D61) | consentement | |

Tenir aussi :
- [ ] la liste des sous-traitants (§2) et leurs conditions ;
- [ ] le journal des demandes de droits (date, demandeur, réponse) ;
- [ ] le journal des incidents ;
- [ ] les consentements recueillis (§4).
