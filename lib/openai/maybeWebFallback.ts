import { searchCatalog } from "@/lib/search/provider";
import type { PartType } from "@/lib/core/types";

export async function maybeWebFallback(partType: PartType, query: string) {
  const results = await searchCatalog(`${query} ${partType} specs price`, {
    force: true,
    freshnessRequired: true,
    topic: "general",
    maxResults: 3,
    useCache: true,
    reason: "verification",
  });

  if (results.length === 0) {
    return null;
  }

  return {
    query,
    partType,
    results: results.slice(0, 3).map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
    })),
  };
}
