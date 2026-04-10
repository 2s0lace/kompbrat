import type { AffiliateLink } from "@/types/affiliate";

export type BuildCategory = "work" | "gaming";

export type BuildSourceType = "new" | "mixed" | "used";

export type BuildStatus = "active" | "planned";

export type BuildLink = AffiliateLink;

export type BuildSpec = {
  label: string;
  value: string;
};

export type BuildLegacyParts = {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  case: string;
};

export type Build = {
  id: string;
  category: BuildCategory;
  title: string;
  priceRange: string;
  sourceType: BuildSourceType;
  shortDescription: string;
  description: string;
  whoIsItFor: string;
  whyThisBuild: string[];
  specs: BuildSpec[];
  tags: string[];
  featured?: boolean;
  status?: BuildStatus;
  variant?: string;
  notes?: string[];
  affiliateLinks?: BuildLink[];
  sourceLinks?: BuildLink[];
  slug: string;
  price: number;
  useCase: string;
  shortVerdict: string;
  parts: BuildLegacyParts;
  pros: string[];
  cons: string[];
  badgeLabel?: string;
};

export type LegacyBuildCategory = "gaming" | "praca" | "uzywany" | "nowy";

export type LegacyBuildSourceType = "olx-allegro" | "sklep";

export type LegacyBuildParts = {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  case: string;
};

export type LegacyBuild = {
  slug: string;
  title: string;
  price: number;
  category: LegacyBuildCategory;
  sourceType: LegacyBuildSourceType;
  useCase: string;
  shortVerdict: string;
  description: string;
  parts: LegacyBuildParts;
  pros: string[];
  cons: string[];
  affiliateLinks?: BuildLink[];
  sourceLinks?: BuildLink[];
  badgeLabel?: string;
};
