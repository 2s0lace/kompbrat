import { withTracking } from "@/lib/affiliate/tracking";

export function buildAllegroLink(query: string, options?: { slug?: string; tag?: string }) {
  const url = new URL("https://allegro.pl/listing");
  url.searchParams.set("string", query);

  return withTracking(url, { provider: "allegro", slug: options?.slug, tag: options?.tag });
}
