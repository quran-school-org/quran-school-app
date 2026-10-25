/**
 * Génère src/theme/themes.css (variables CSS par thème, D84) depuis
 * src/theme/palettes.ts. Usage : npx tsx scripts/dev/gen-theme-css.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { themesStylesheet } from "../../src/theme/palettes";

const target = fileURLToPath(new URL("../../src/theme/themes.css", import.meta.url));
writeFileSync(target, themesStylesheet());
console.log(`écrit : ${target}`);
