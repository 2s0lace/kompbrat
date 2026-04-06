import { NextResponse } from "next/server";

import { compareParts } from "@/lib/core/compare/compareParts";
import { explainPartResult } from "@/lib/core/compare/explainPartResult";
import { maybeWebFallback } from "@/lib/openai/maybeWebFallback";
import { parseIntent } from "@/lib/openai/parseIntent";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "Podaj query do porównania części." }, { status: 400 });
  }

  const intent = await parseIntent(query);
  const result = await compareParts(intent);
  const explanation = explainPartResult(result);

  const unresolved =
    intent.partType && result.ranking.length === 0 && intent.candidates.length > 0 ? await maybeWebFallback(intent.partType, intent.candidates[0]) : null;

  return NextResponse.json({
    intent,
    result,
    explanation,
    fallback: unresolved,
  });
}
