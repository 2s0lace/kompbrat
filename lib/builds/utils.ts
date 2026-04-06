import { allBuilds } from "@/lib/builds/data";
import { normalizeAffiliateLinks } from "@/lib/affiliate/links";
import type { Build, BuildCategory, BuildLink, BuildParts, BuildSourceType } from "@/types/build";

export function getBuildBySlug(slug: string) {
  return allBuilds.find((build) => build.slug === slug);
}

export function getFeaturedBuilds(limit = 4) {
  return allBuilds.slice(0, limit);
}

export function getBuildCategoryLabel(category: BuildCategory) {
  const labels: Record<BuildCategory, string> = {
    gaming: "gaming",
    praca: "praca",
    uzywany: "używany",
    nowy: "nowy",
  };

  return labels[category];
}

export function getBuildSourceTypeLabel(sourceType: BuildSourceType) {
  return sourceType === "olx-allegro" ? "OLX / Allegro" : "sklep";
}

export function getBuildExternalLinks(build: Build): BuildLink[] {
  return normalizeAffiliateLinks([...(build.affiliateLinks ?? []), ...(build.sourceLinks ?? [])]);
}

export function getBuildPartsEntries(parts: BuildParts) {
  return [
    { label: "CPU", value: parts.cpu },
    { label: "GPU", value: parts.gpu },
    { label: "RAM", value: parts.ram },
    { label: "Dysk", value: parts.storage },
    { label: "Płyta główna", value: parts.motherboard },
    { label: "Zasilacz", value: parts.psu },
    { label: "Obudowa", value: parts.case },
  ];
}
