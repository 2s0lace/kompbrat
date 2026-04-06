import { compactToken, normalizeText } from "@/lib/core/utils/normalize";

export function createExactishRegex(alias: string) {
  const normalized = normalizeText(alias);
  const token = compactToken(alias);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");

  return {
    normalized,
    token,
    regex: new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i"),
  };
}

export function findBestAliasMatch(text: string, aliases: string[]) {
  const normalizedText = normalizeText(text);
  const compactText = compactToken(text);

  const candidates = aliases
    .map((alias) => createExactishRegex(alias))
    .filter(({ normalized, token, regex }) => {
      if (regex.test(normalizedText)) {
        return true;
      }

      return token.length >= 4 && compactText.includes(token);
    })
    .sort((left, right) => right.normalized.length - left.normalized.length);

  return candidates[0] ?? null;
}
