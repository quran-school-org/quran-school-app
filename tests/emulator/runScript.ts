/**
 * Lance un script TypeScript du dépôt avec tsx, sans passer par `npx` ni par
 * un shell : même comportement sous Linux (CI) et Windows.
 */
import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from "node:child_process";
import { createRequire } from "node:module";

const TSX_CLI = createRequire(import.meta.url).resolve("tsx/cli");

export function runScript(args: string[], options: SpawnSyncOptionsWithStringEncoding) {
  return spawnSync(process.execPath, [TSX_CLI, ...args], options);
}

/** Les droits POSIX (mode 600) n'existent pas sous Windows. */
export const POSIX_MODES = process.platform !== "win32";
