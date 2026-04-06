import type { AffiliateLink } from "@/types/affiliate";

export type BuildCategory = "gaming" | "praca" | "uzywany" | "nowy";

export type BuildSourceType = "olx-allegro" | "sklep";

export type BuildLink = AffiliateLink;

export type BuildParts = {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  case: string;
};

export type Build = {
  slug: string;
  title: string;
  price: number;
  category: BuildCategory;
  sourceType: BuildSourceType;
  useCase: string;
  shortVerdict: string;
  description: string;
  parts: BuildParts;
  pros: string[];
  cons: string[];
  affiliateLinks?: BuildLink[];
  sourceLinks?: BuildLink[];
  badgeLabel?: string;
};
