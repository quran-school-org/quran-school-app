/** Ton de pastille par niveau de tajwīd (seuls les niveaux du modèle existent). */
import type { PillTone } from "../../ui";
export function tajweedTone(level?: string): PillTone {
  if (level === "ممتاز") return "primary";
  if (level === "متوسط") return "neutral";
  return "warn";
}
