/**
 * Outils communs des scripts d'administration (Admin SDK).
 *
 * Garde-fous :
 * - `--project` est OBLIGATOIRE (aucun projet implicite) ;
 * - `--dry-run` est le mode PAR DÉFAUT : il faut `--apply` pour écrire ;
 * - un projet `demo-*` n'est accepté que si les émulateurs sont configurés ;
 * - un vrai projet est refusé si une variable d'émulateur est présente (mélange) ;
 * - écrire sur un vrai projet exige en plus `--confirm-prod=<projectId>` et
 *   `--database` explicite.
 */
import { applicationDefault, deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export interface CommonArgs {
  projectId: string;
  databaseId: string;
  apply: boolean;
  emulator: boolean;
  outDir: string;
  flags: Map<string, string | true>;
}

export function parseFlags(argv: string[]): Map<string, string | true> {
  const flags = new Map<string, string | true>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) throw new Error(`Argument inattendu : ${arg}`);
    const eq = arg.indexOf("=");
    if (eq === -1) flags.set(arg.slice(2), true);
    else flags.set(arg.slice(2, eq), arg.slice(eq + 1));
  }
  return flags;
}

export function parseCommonArgs(argv: string[], env: NodeJS.ProcessEnv = process.env, defaultOutDir = "scripts/admin/out"): CommonArgs {
  const flags = parseFlags(argv);
  const project = flags.get("project");
  if (typeof project !== "string" || !project.trim()) {
    throw new Error("--project=<id> est obligatoire (aucun projet par défaut).");
  }
  const projectId = project.trim();
  const firestoreEmu = env.FIRESTORE_EMULATOR_HOST;
  const authEmu = env.FIREBASE_AUTH_EMULATOR_HOST;
  if (Boolean(firestoreEmu) !== Boolean(authEmu)) {
    throw new Error("FIRESTORE_EMULATOR_HOST et FIREBASE_AUTH_EMULATOR_HOST doivent être définis ensemble.");
  }
  const emulator = Boolean(firestoreEmu && authEmu);
  if (projectId.startsWith("demo-") && !emulator) {
    throw new Error(`Le projet ${projectId} n'existe que sur les émulateurs : lancez le script via \`firebase emulators:exec\`.`);
  }
  if (!projectId.startsWith("demo-") && emulator) {
    throw new Error(`Variables d'émulateur présentes avec un vrai projet (${projectId}) : refus (mélange dangereux).`);
  }
  const apply = flags.has("apply");
  if (apply && flags.has("dry-run")) throw new Error("--apply et --dry-run sont incompatibles.");

  const database = flags.get("database");
  let databaseId: string;
  if (typeof database === "string" && database.trim()) {
    databaseId = database.trim();
  } else if (emulator) {
    databaseId = "(default)";
  } else {
    throw new Error("--database=<id> est obligatoire hors émulateur (la prod utilise une base nommée).");
  }

  if (!emulator && apply && flags.get("confirm-prod") !== projectId) {
    throw new Error(`Écriture sur un vrai projet : ajoutez --confirm-prod=${projectId} après avoir vérifié la sauvegarde.`);
  }
  const out = flags.get("out");
  return {
    projectId,
    databaseId,
    apply,
    emulator,
    outDir: typeof out === "string" && out ? out : defaultOutDir,
    flags,
  };
}

export interface AdminHandles {
  app: App;
  db: Firestore;
  auth: Auth;
  close: () => Promise<void>;
}

export function initAdmin(projectId: string, databaseId: string, emulator: boolean, name = `admin-${Date.now()}`): AdminHandles {
  const app = initializeApp(
    emulator ? { projectId } : { projectId, credential: applicationDefault() },
    name
  );
  const db = databaseId === "(default)" ? getFirestore(app) : getFirestore(app, databaseId);
  const auth = getAuth(app);
  return { app, db, auth, close: () => deleteApp(app) };
}

export function timestamp(d = new Date()): string {
  return d.toISOString().replace(/[:.]/g, "-");
}
