import { withTracking } from "@/lib/affiliate/tracking";

export function buildCeneoLink(query: string, options?: { slug?: string; tag?: string }) {
  const url = new URL("https://www.ceneo.pl/");
  url.searchParams.set("q", query);

  return withTracking(url, { provider: "ceneo", slug: options?.slug, tag: options?.tag });
}
