# Plan — corrections décidées après l'audit (octobre 2026)

Décisions de Mélik du 24/10/2026, prises sur la page de synthèse de l'audit :
**tout est fait**, sauf A-03 (rattachement d'un compte sans accord) et A-07
(protection de `main`), reportés.

Règles du chantier : une branche et une PR par jalon ; une modification de
`firestore.rules` ou des Functions vient toujours avec ses tests ; tout ce qui
change l'écran est montré d'abord sur l'école **Test** du dev, jamais sur
l'école réelle ; aucune commande vers la prod.

## C1 — Failles de sécurité (avant la bascule)
| Point | Correctif |
|---|---|
| A-01 | notifications de type `مالي` lisibles par le bureau seulement (règle + requête côté client) ; plus de montants ni de noms d'élèves dans les messages |
| A-02 | l'archivage d'une fiche du personnel ne suspend jamais un directeur |
| A-04 | nom et téléphone de son propre profil : texte de 120 et 40 caractères au plus |
| A-05 | exports CSV : cellules commençant par `= + - @` neutralisées |
| A-06 | `ops.yml` : aucun envoi d'artefact si le chiffrement échoue |

Fini quand : les tests de preuve de `tests/emulator/audit-2026-10.test.ts`
sont inversés (ils vérifient que l'abus est refusé), CI verte.

## C2 — Notifications utiles et petits bugs (avant la bascule)
- U-03 : statut « lu » par personne ; plus de notification à chaque
  modification de profil ; destinataires selon le type.
- U-04 : le parent ne voit plus les outils du bureau ; texte
  `@admin_alfajr` retiré ; tableau de l'enseignant lisible sur téléphone ;
  l'enseignant n'écrase plus toute la fiche d'élève en notant le hifz.

Fini quand : captures avant / après par rôle, tests e2e verts.

## C3 — Droits réels (avant ou juste après la bascule, au choix de Mélik)
- D-01 : la matrice « lire / modifier / supprimer » par compte est retirée ;
  les droits viennent du rôle, comme le serveur le fait déjà (D81).
- D-02 : un enseignant n'agit que sur les élèves, présences, notes et suivis
  de **sa** halaqa ; l'archivage d'un élève est réservé au bureau.

Fini quand : règles et tests sur émulateurs ; vérification sur une copie des
données réelles du dev, en lecture seule, qu'aucun enseignant ne perd l'accès à
ses propres élèves (lien enseignant ↔ halaqa présent partout).

## C4 — Comptes par lien d'invitation (U-01, U-02)
Idée de Mélik, retenue : le bureau ne tape plus de mot de passe.
1. Le bureau choisit le rôle et la fiche (ou crée le compte du parent
   directement depuis la fiche de l'élève).
2. L'application produit un **lien d'invitation personnel**, à envoyer sur
   WhatsApp ou à imprimer en QR code.
3. La personne ouvre le lien, choisit son mot de passe, et son compte est actif.

Sécurité du lien : jeton aléatoire à usage unique, valable 72 h, stocké
haché ; il n'ouvre que la création du mot de passe, rien d'autre ; tout
passe par une Cloud Function ; le bureau peut l'annuler ou en refaire un.
Création en lot à la rentrée : un lien par famille d'une halaqa.

Fini quand : parcours complet testé sur émulateurs (création, lien expiré,
lien déjà utilisé, lien annulé) ; décision consignée dans `DECISIONS.md`.

## C5 — Accueils par métier et menus (U-05 à U-08)
- Directeur : « Aujourd'hui » d'abord (appel non fait, impayés du mois,
  dossiers incomplets, comptes à créer) et 4 actions rapides.
- Enseignant : « Faire l'appel » et le hifz en un geste, en cartes sur
  téléphone.
- Parent : une carte par enfant (présence, hizb, dernière note, cotisation).
- Menus réduits par rôle.

Fini quand : maquettes validées par Mélik, puis écrans livrés un par un sur
l'école Test du dev, avec captures.

## Reporté
- A-03 : rattachement d'un compte d'une autre école sans accord.
- A-07 : protection de `main` (dépend du forfait GitHub, voir ci-dessous).

## Questions en suspens
- **GitHub** : le dépôt appartient à l'organisation `quran-school-org`
  (forfait Free). Le Pro du pack étudiant s'applique au **compte personnel**,
  pas à une organisation. Deux options : transférer le dépôt sur un compte
  personnel Pro (les protections de branche deviennent disponibles, mais il
  faut reconfigurer la condition d'accès Google Cloud, qui nomme le dépôt), ou
  passer l'organisation au forfait Team (payant, par utilisateur).
- **Firebase** : les Cloud Functions imposent le forfait Blaze (paiement à
  l'usage, avec une franchise gratuite). Pour deux écoles, la facture devrait
  rester faible ; à vérifier sur la console avec le volume réel, et poser une
  alerte budgétaire (`docs/GUIDE-MISE-EN-PROD.md`). La base est en édition
  « Enterprise », dont la tarification diffère de l'édition standard : à
  vérifier avant la bascule.
