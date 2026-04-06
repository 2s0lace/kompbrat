export type AffiliateProvider = "ceneo" | "allegro" | "sklep" | "olx" | "external";

export type AffiliateLink = {
  label: string;
  provider: AffiliateProvider;
  url: string;
  tag?: string;
};
