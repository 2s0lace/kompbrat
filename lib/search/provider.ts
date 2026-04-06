import type { BuilderMarketMode, MarketQueryDefinition } from "@/lib/builder/types";
import { searchWithBrave } from "@/lib/search/brave";
import { searchWithTavily, tavilyExtract } from "@/lib/search/tavily";
import { DEFAULT_SEARCH_PROVIDER } from "@/lib/utils/constants";
import type { GpuMarketContext, SearchCatalogOptions, SearchResult } from "@/types/search";

function normalize(text: string) {
  return text.toLowerCase();
}

function looksLikeRecentProduct(text: string) {
  return /(rtx\s?50\d{2}|5060|5070|5080|5090|arc\s?b5\d{2}|b580|b570|ryzen\s?\d\s?9\d{3}|9600|9700|9800|rx\s?90\d{2}|9060|9070)/i.test(text);
}

function mentionsFreshMarketNeed(text: string) {
  return /(aktualn|obecnie|teraz|dzis|dzisiaj|today|current|cena|ceny|dostęp|dostep|availability|porównaj rynek|porownaj rynek|premier|launch|news|leak|wyciek)/i.test(
    text,
  );
}

export async function searchCatalog(query: string, options?: SearchCatalogOptions) {
  if (!options?.force && !options?.freshnessRequired) {
    return [];
  }

  if (DEFAULT_SEARCH_PROVIDER === "tavily") {
    return searchWithTavily(query, {
      topic: options?.topic ?? "general",
      maxResults: options?.maxResults ?? 3,
      useCache: options?.useCache ?? true,
      freshnessRequired: options?.freshnessRequired,
      force: options?.force,
      reason: options?.reason,
    });
  }

  return searchWithBrave(query);
}

function annotateResults(results: SearchResult[], definition: MarketQueryDefinition) {
  return results
    .filter((result) => result.url)
    .map((result) => ({
      ...result,
      key: definition.key,
      componentType: definition.componentType,
      query: definition.query,
    }));
}

export function summarizeGpuMarketContext(context: GpuMarketContext) {
  return {
    mode: context.mode,
    queries: context.queries,
    topSearchResults: context.searchResults.slice(0, 6).map((result) => ({
      key: result.key,
      title: result.title,
      url: result.url,
      snippet: result.snippet.slice(0, 220),
    })),
    extractedHighlights:
      context.extracted?.results?.slice(0, 4).map((result) => ({
        url: result.url,
        highlight: result.raw_content?.replace(/\s+/g, " ").slice(0, 320) ?? "",
      })) ?? [],
  };
}

export async function getGpuMarketContext(
  budget: number,
  useCase: string,
  options?: {
    marketMode?: BuilderMarketMode;
    queryDefinitions?: MarketQueryDefinition[];
    enabled?: boolean;
  },
): Promise<GpuMarketContext> {
  const queryDefinitions = options?.queryDefinitions ?? [];
  const queries = queryDefinitions.map((entry) => entry.query);

  if (!options?.enabled) {
    return {
      mode: options?.marketMode,
      queries: [],
      queryRuns: [],
      searchResults: [],
      extracted: null,
    };
  }

  console.info(
    "[builder-search-queries]",
    JSON.stringify(
      {
        budget,
        useCase,
        marketMode: options?.marketMode ?? "new",
        enabled: options?.enabled ?? false,
        queries: queryDefinitions.map((entry) => ({
          key: entry.key,
          componentType: entry.componentType,
          query: entry.query,
        })),
      },
      null,
      2,
    ),
  );

  if (queryDefinitions.length === 0) {
    return {
      mode: options?.marketMode,
      queries: [],
      queryRuns: [],
      searchResults: [],
      extracted: null,
    };
  }

  const queryRuns = await Promise.all(
    queryDefinitions.map(async (definition) => ({
      ...definition,
      results: annotateResults(
        await searchCatalog(definition.query, {
          freshnessRequired: true,
          topic: "general",
          maxResults: 3,
          useCache: true,
          reason: "fresh-prices",
        }),
        definition,
      ),
    })),
  );

  const flatResults = queryRuns.flatMap((entry) => entry.results).slice(0, 20);
  const uniqueUrls = Array.from(new Set(flatResults.map((result) => result.url))).slice(0, 3);
  const extracted = DEFAULT_SEARCH_PROVIDER === "tavily" && process.env.TAVILY_API_KEY && uniqueUrls.length > 0 ? await tavilyExtract(uniqueUrls) : null;

  console.info(
    "[builder-extracted-context]",
    JSON.stringify(
      {
        urls: uniqueUrls,
        extractedResults: extracted?.results?.map((item) => ({
          url: item.url,
          raw_content: item.raw_content?.slice(0, 400),
        })),
      },
      null,
      2,
    ),
  );

  return {
    mode: options?.marketMode,
    queries,
    queryRuns,
    searchResults: flatResults,
    extracted,
  };
}

export function shouldUseSearchForBuilder(input: {
  prompt: string;
  budget: number;
  useCase: string;
}) {
  const text = normalize(`${input.prompt} ${input.useCase}`);

  if (mentionsFreshMarketNeed(text)) {
    return true;
  }

  if (looksLikeRecentProduct(text) && /(czy to ma sens|verify|zweryfikuj|sprawdź nazwę|sprawdz nazwe)/i.test(text)) {
    return true;
  }

  return false;
}

export function shouldUseSearchForDealChecker(input: {
  title?: string;
  description?: string;
  url?: string;
  valuationConfidence?: "high" | "medium" | "low";
  detectedParts?: Array<{ name: string; confidence?: "high" | "medium" | "low" }>;
}) {
  const text = normalize(`${input.title ?? ""} ${input.description ?? ""}`);

  if (mentionsFreshMarketNeed(text)) {
    return true;
  }

  if (input.valuationConfidence === "low") {
    return true;
  }

  if (input.detectedParts?.some((part) => looksLikeRecentProduct(part.name) && part.confidence !== "high")) {
    return true;
  }

  if (input.url && looksLikeRecentProduct(text)) {
    return true;
  }

  return false;
}
