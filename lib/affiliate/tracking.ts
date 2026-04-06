import type { AffiliateLink, AffiliateProvider } from "@/types/affiliate";

type TrackingParams = {
  provider: AffiliateProvider;
  slug?: string;
  tag?: string;
};

type AffiliateClickEvent = {
  destination: string;
  provider: AffiliateProvider;
  label?: string;
  slug?: string;
  tag?: string;
};

export function withTracking(url: URL, params: TrackingParams) {
  url.searchParams.set("utm_source", params.provider);
  url.searchParams.set("utm_medium", "affiliate");

  if (params.slug) {
    url.searchParams.set("utm_campaign", params.slug);
  }

  if (params.tag) {
    url.searchParams.set("utm_content", params.tag);
  }

  return url.toString();
}

export function buildAffiliateRedirectHref(link: AffiliateLink, options?: { slug?: string }) {
  const redirectUrl = new URL("/api/affiliate/redirect", "http://kompbrat.local");
  redirectUrl.searchParams.set("url", link.url);
  redirectUrl.searchParams.set("provider", link.provider);
  redirectUrl.searchParams.set("label", link.label);

  if (link.tag) {
    redirectUrl.searchParams.set("tag", link.tag);
  }

  if (options?.slug) {
    redirectUrl.searchParams.set("slug", options.slug);
  }

  return `${redirectUrl.pathname}?${redirectUrl.searchParams.toString()}`;
}

export function trackAffiliateClick(event: AffiliateClickEvent) {
  console.info("[affiliate-click]", {
    timestamp: new Date().toISOString(),
    provider: event.provider,
    slug: event.slug ?? null,
    label: event.label ?? null,
    tag: event.tag ?? null,
    destination: event.destination,
  });
}
