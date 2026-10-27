# Politique de sécurité / Security policy

Cette application gère des données réelles d'écoles coraniques : élèves mineurs,
familles, paiements, salaires. Merci de nous aider à les protéger.

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique.** Utilisez le signalement privé de GitHub :
onglet **Security** du dépôt, puis **Report a vulnerability**.

Indiquez :
- l'écran, la règle Firestore ou la Cloud Function concernée ;
- les étapes pour reproduire (sur les émulateurs, jamais sur une instance réelle) ;
- l'impact estimé.

Nous répondons sous 7 jours.

## Règles pour les tests

- Testez **uniquement** en local, sur les émulateurs Firebase et le projet
  `demo-quran-school` (`npm run emulators`, `npm run seed:emulator`). Toutes les
  données de démonstration sont fictives.
- N'essayez **jamais** de vous connecter à une instance réelle ni d'y lire des
  données. Les données des écoles sont protégées par la loi marocaine 09-08.

## English

Please report vulnerabilities privately with GitHub's **Report a vulnerability**
button (Security tab), never in a public issue. Test only against the local
Firebase emulators (project `demo-quran-school`, fictitious data), never against
a live deployment.
