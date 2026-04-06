import type { PreprocessedText } from "@/types/checker";

export function normalizeForSearch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactForSearch(text: string) {
  return normalizeForSearch(text).replace(/\s+/g, "");
}

export function preprocessText(text: string): PreprocessedText {
  const raw = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  return {
    raw,
    normalized: normalizeForSearch(raw),
    compact: compactForSearch(raw),
  };
}

export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
