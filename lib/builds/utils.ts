import { allBuilds } from "@/lib/builds/data";
import { normalizeAffiliateLinks } from "@/lib/affiliate/links";
import type { Build, BuildCategory, BuildLink, BuildSourceType } from "@/types/build";

const buildCategoryLabels: Record<BuildCategory, string> = {
  work: "Praca",
  gaming: "Gaming",
};

const buildSourceTypeLabels: Record<BuildSourceType, string> = {
  new: "Nowy",
  mixed: "Mixed",
  used: "Używany",
};

const buildSourceTypeVariants: Record<BuildSourceType, "success" | "accent" | "warning"> = {
  new: "success",
  mixed: "accent",
  used: "warning",
};

export function getBuildById(id: string) {
  return allBuilds.find((build) => build.id === id);
}

export function getBuildBySlug(slug: string) {
  return getBuildById(slug);
}

export function getFeaturedBuilds(limit = 4) {
  const featuredBuilds = allBuilds.filter((build) => build.featured);
  return (featuredBuilds.length > 0 ? featuredBuilds : allBuilds).slice(0, limit);
}

export function getBuildHref(build: Build) {
  return `/builds/${build.id}`;
}

export function getBuildCategoryLabel(category: BuildCategory) {
  return buildCategoryLabels[category];
}

export function getBuildSourceTypeLabel(sourceType: BuildSourceType) {
  return buildSourceTypeLabels[sourceType];
}

export function getBuildSourceTypeBadgeVariant(sourceType: BuildSourceType) {
  return buildSourceTypeVariants[sourceType];
}

export function getBuildExternalLinks(build: Build): BuildLink[] {
  return normalizeAffiliateLinks([...(build.affiliateLinks ?? []), ...(build.sourceLinks ?? [])]);
}

export function getHighlightedSpecs(build: Build, limit = 5) {
  return build.specs.slice(0, limit);
}

function getSpecValue(build: Build, labels: string[]) {
  const match = build.specs.find((spec) => labels.includes(spec.label));
  return match?.value ?? "Brak danych";
}

export function getBuildBuilderParts(build: Build) {
  return {
    cpu: getSpecValue(build, ["Procesor"]),
    gpu: getSpecValue(build, ["Grafika", "Karta graficzna"]),
    ram: getSpecValue(build, ["Pamięć RAM"]),
    storage: getSpecValue(build, ["Dysk SSD"]),
    motherboard: getSpecValue(build, ["Płyta główna"]),
    psu: getSpecValue(build, ["Zasilacz"]),
    case: getSpecValue(build, ["Obudowa"]),
  };
}
