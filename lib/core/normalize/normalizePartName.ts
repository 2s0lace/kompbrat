import { textualAliasMap } from "@/lib/core/normalize/aliases";
import { normalizeText } from "@/lib/core/utils/normalize";

export function normalizePartName(input: string) {
  let normalized = normalizeText(input);

  for (const [alias, replacement] of Object.entries(textualAliasMap)) {
    normalized = normalized.replace(new RegExp(`\\b${alias}\\b`, "g"), replacement);
  }

  return normalized;
}
