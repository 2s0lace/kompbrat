import type { AffiliateLink } from "@/types/affiliate";
import type { Build } from "@/types/build";

import { buildAllegroLink } from "@/lib/affiliate/allegro";
import { buildCeneoLink } from "@/lib/affiliate/ceneo";

function buildQueryFromBuild(build: Build) {
  return [build.title, build.parts.cpu, build.parts.gpu].filter(Boolean).join(" ");
}

export function createBuildAffiliateLinks(build: Build): AffiliateLink[] {
  const query = buildQueryFromBuild(build);

  return [
    {
      label: "Sprawdź na Ceneo",
      provider: "ceneo",
      url: buildCeneoLink(query, { slug: build.slug, tag: "build-ceneo" }),
      tag: "build-ceneo",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink(query, { slug: build.slug, tag: "build-allegro" }),
      tag: "build-allegro",
    },
  ];
}

export function normalizeAffiliateLinks(links: AffiliateLink[] = []) {
  return links.filter((link) => Boolean(link.label && link.url && link.provider));
}

export function getAffiliateDestination(url: string, provider: string, slug?: string, tag?: string) {
  const destination = new URL(url);

  if (provider === "ceneo" || provider === "allegro" || provider === "sklep" || provider === "olx") {
    destination.searchParams.set("utm_source", provider);
    destination.searchParams.set("utm_medium", "affiliate");

    if (slug) {
      destination.searchParams.set("utm_campaign", slug);
    }

    if (tag) {
      destination.searchParams.set("utm_content", tag);
    }
  }

  return destination.toString();
}
