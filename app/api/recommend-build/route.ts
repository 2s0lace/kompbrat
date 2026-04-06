import { NextResponse } from "next/server";

import { explainBuildResult } from "@/lib/core/build/explainBuildResult";
import { recommendBuild } from "@/lib/core/build/recommendBuild";
import { parseIntent } from "@/lib/openai/parseIntent";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "Podaj opis potrzeb do rekomendacji buildu." }, { status: 400 });
  }

  const intent = await parseIntent(query);
  const result = recommendBuild(intent, query);
  const explanation = explainBuildResult(result);

  return NextResponse.json({
    intent,
    result,
    explanation,
  });
}
