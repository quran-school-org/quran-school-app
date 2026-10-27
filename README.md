# quran-school-app

Application web de gestion d'écoles coraniques (كتاتيب) : élèves, halaqat, présence,
hifz, examens et attestations, cotisations, comptabilité, personnel, activités.
Elle gère plusieurs écoles et sert ses écrans selon le rôle (directeur, administration,
enseignant, parent, élève…). Interface en arabe (RTL), avec une couche de traduction
française en test.

**Stack** : React 19, Vite 6, Tailwind 4, Firebase (Firestore, Auth, Cloud Functions 2nd gen, Hosting).

## Démarrer (données fictives, aucune connexion à un service réel)

Prérequis : Node 22, Java 21.

```bash
npm ci && npm ci --prefix functions
npm run emulators        # dans un terminal
npm run seed:emulator    # dans un autre : écoles et comptes de démonstration
npm run dev              # http://localhost:3000
```

Le projet Firebase par défaut est `demo-quran-school` : le préfixe `demo-` garantit
qu'aucun service Google réel n'est appelé.

## Tests

```bash
npm run check        # lint, tests unitaires, build
npm run test:rules   # règles Firestore et Cloud Functions sur émulateurs
npm run test:e2e     # Playwright sur émulateurs
```

## Documentation

- `CLAUDE.md` : guide de travail (architecture, conventions, interdits).
- `docs/DECISIONS.md` : décisions et retours arrière.
- `docs/runbooks/` : procédures d'exploitation, exécutées par les mainteneurs.

## Sécurité

Voir [SECURITY.md](SECURITY.md). Les vulnérabilités se signalent en privé, jamais dans une issue.

## Licence

[MIT](LICENSE).
