import { NextResponse } from "next/server";

import { searchCatalog } from "@/lib/search/provider";
import { searchSchema } from "@/lib/validations/search";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = searchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const isNewsQuery = /(news|premiera|launch|wyciek|leak)/i.test(parsed.data.query);
  const results = await searchCatalog(parsed.data.query, {
    force: true,
    freshnessRequired: true,
    topic: isNewsQuery ? "news" : "general",
    maxResults: 3,
    useCache: true,
    reason: "manual-search",
  });

  return NextResponse.json({ results });
}
