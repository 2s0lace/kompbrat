import type { SearchCatalogOptions, SearchResult, SearchTopic, TavilyExtractResponse, TavilySearchResult, TavilyUsage } from "@/types/search";

const TAVILY_API_URL = "https://api.tavily.com";
const TAVILY_CACHE_TTL_MS = 1000 * 60 * 60;
const tavilySearchCache = new Map<string, { expiresAt: number; results: TavilySearchResult[]; usage?: TavilyUsage }>();

function getTavilyApiKey() {
  return process.env.TAVILY_API_KEY;
}

function getCacheKey(query: string, topic: SearchTopic, maxResults: number) {
  return `${topic}:${maxResults}:${query.trim().toLowerCase()}`;
}

function getCachedSearch(key: string) {
  const cached = tavilySearchCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    tavilySearchCache.delete(key);
    return null;
  }

  return cached;
}

export async function tavilySearch(query: string, options?: SearchCatalogOptions): Promise<TavilySearchResult[]> {
  const apiKey = getTavilyApiKey();
  const topic = options?.topic ?? "general";
  const maxResults = options?.maxResults ?? 3;
  const useCache = options?.useCache ?? true;
  const cacheKey = getCacheKey(query, topic, maxResults);

  if (!apiKey) {
    return [];
  }

  if (useCache) {
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      return cached.results;
    }
  }

  const res = await fetch(`${TAVILY_API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      topic,
      auto_parameters: false,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
      include_usage: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const data = (await res.json()) as { results?: Array<Record<string, unknown>>; usage?: TavilyUsage };

  const mapped = (data.results ?? []).map((result) => ({
    title: typeof result.title === "string" ? result.title : "Brak tytułu",
    url: typeof result.url === "string" ? result.url : "",
    content: typeof result.content === "string" ? result.content : undefined,
    snippet: typeof result.content === "string" ? result.content : undefined,
  }));

  if (useCache) {
    tavilySearchCache.set(cacheKey, {
      expiresAt: Date.now() + TAVILY_CACHE_TTL_MS,
      results: mapped,
      usage: data.usage,
    });
  }

  return mapped;
}

export async function tavilyExtract(urls: string[]): Promise<TavilyExtractResponse | null> {
  const apiKey = getTavilyApiKey();

  if (!apiKey || urls.length === 0) {
    return null;
  }

  const res = await fetch(`${TAVILY_API_URL}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      urls,
      extract_depth: "advanced",
      include_images: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily extract failed: ${res.status}`);
  }

  return (await res.json()) as TavilyExtractResponse;
}

export async function searchWithTavily(query: string, options?: SearchCatalogOptions): Promise<SearchResult[]> {
  const results = await tavilySearch(query, options);

  return results
    .filter((result) => result.url)
    .map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet ?? result.content ?? "",
      source: "tavily",
    }));
}
