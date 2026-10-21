#!/usr/bin/env bash
# Ré-analyse rapide (lecture seule) d'une version du dépôt quran-school-app.
# Usage : bash reanalyse.sh /chemin/vers/quran-school-app [/chemin/vers/design]
# Compare la sortie avec la section "Empreinte de référence" du rapport (version analysée le 21/10/2026).
set -u
R="${1:?chemin du dépôt}"; D="${2:-$R/design}"
S="$R/src"
h() { printf '\n=== %s\n' "$1"; }

h "1. Taille des fichiers source (lignes)"
find "$S" "$R/server.ts" -type f \( -name '*.ts' -o -name '*.tsx' \) -exec wc -l {} + 2>/dev/null | sort -n

h "2. Dépendances"
grep -A30 '"dependencies"' "$R/package.json" | sed -n '1,30p'

h "3. Config Firebase : projet, base nommée, rewrites, alias CLI"
grep -rhoE 'getFirestore\([^)]*\)|firestoreDatabaseId"[^,]*|projectId[^,]*' "$S" "$R"/firebase-applet-config.json 2>/dev/null | sort -u
cat "$R/firebase.json" "$R/.firebaserc" 2>/dev/null

h "4. Collections utilisées par le code"
grep -rhoE '(saveToFirestore|deleteFromFirestore|subscribeToCollection<[A-Za-z]+>|bootstrapCollectionIfEmpty|collection\(db,)\s*\(?"[A-Za-z]+"' "$S" \
  | grep -oE '"[A-Za-z]+"' | sort | uniq -c | sort -rn

h "5. Règles Firestore : blocs match et conditions ouvertes"
grep -nE 'match /|allow ' "$R/firestore.rules"
echo "--- conditions 'if true' :"; grep -n 'if true' "$R/firestore.rules"
echo "--- vérification de rôle/appartenance (get/exists/token) :"; grep -nE 'get\(|exists\(|request\.auth\.token' "$R/firestore.rules" || echo "(aucune)"

h "6. Mots de passe et identifiants codés en dur"
grep -rnE 'password: (existing[^|]*\|\| )?"[^"]+"|"FajrAcademy|admin_alfajr|@alfajr\.local|_secure_fajr' "$S" | cut -c1-160

h "7. Flux de connexion (comparaison de mot de passe côté client ?)"
grep -rnE 'matchPassword|signInWithEmailAndPassword|createUserWithEmailAndPassword|logoutFromFirebaseAuth\(' "$S" | cut -c1-160

h "8. Clés localStorage"
grep -rhoE '"alfajr_[a-z_]+"' "$S" | sort | uniq -c

h "9. IDs de documents fixes / déterministes (collisions multi-écoles)"
grep -rhoE 'id: (`[a-z_]*\$\{[^`]*`|"[a-z0-9_]+")|doc\(db, "[a-zA-Z]+", "[a-z0-9_]+"\)' "$S" | sort | uniq -c | sort -rn | head -30

h "10. Multi-tenant déjà amorcé ?"
out=$(grep -rniE 'schoolId|tenant|schools/' "$S" "$R/firestore.rules" | head -20); echo "${out:-(rien)}"

h "11. Écrans (activeTab) et rôles"
grep -rhoE 'activeTab === "[a-z-]+"' "$S" | sort -u | tr '\n' ' '; echo
grep -hoE 'UserRole = [^;]+' "$S/types.ts"

h "12. Logique métier codée en dur pour l'école actuelle"
echo "occurrences 'الفجر' :"; grep -rc 'الفجر' "$S" "$R/server.ts" "$R/index.html" "$R/metadata.json" | grep -v ':0$'
grep -rnE 'isMonthBeforeJuly2026 = |return 70;|2026 - birthYear|طنجة' "$S" | cut -c1-140

h "13. Endpoint serveur / IA"
grep -nE 'app\.(get|post)\(|model: ' "$R/server.ts"
grep -rn '/api/' "$S" | cut -c1-140

h "14. Maquette design : fichiers et pages référencées"
ls "$D" 2>/dev/null
grep -rhoE 'href="[A-Za-z]+\.dc\.html"' "$D" 2>/dev/null | sort | uniq -c
