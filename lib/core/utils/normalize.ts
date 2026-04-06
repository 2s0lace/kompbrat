export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[()\[\],]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactToken(input: string) {
  return normalizeText(input).replace(/[^a-z0-9+]/g, "");
}

export function slugify(input: string) {
  return normalizeText(input).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
