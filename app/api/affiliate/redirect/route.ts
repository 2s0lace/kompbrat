import { NextResponse } from "next/server";

import { getAffiliateDestination } from "@/lib/affiliate/links";
import { trackAffiliateClick } from "@/lib/affiliate/tracking";
import type { AffiliateProvider } from "@/types/affiliate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const url = searchParams.get("url");
  const slug = searchParams.get("slug") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const label = searchParams.get("label") ?? undefined;

  if (!provider || !url) {
    return NextResponse.json({ error: "Missing provider or url." }, { status: 400 });
  }

  try {
    const destination = getAffiliateDestination(url, provider, slug, tag);

    trackAffiliateClick({
      destination,
      provider: provider as AffiliateProvider,
      slug,
      tag,
      label,
    });

    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.json({ error: "Niepoprawny link afiliacyjny." }, { status: 400 });
  }
}
