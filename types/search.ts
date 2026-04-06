import type { BuilderComponentType, BuilderMarketMode } from "@/lib/builder/types";

export type SearchProvider = "brave" | "tavily";
export type SearchTopic = "general" | "news";

export type SearchCatalogOptions = {
  force?: boolean;
  freshnessRequired?: boolean;
  topic?: SearchTopic;
  maxResults?: number;
  useCache?: boolean;
  reason?: "fresh-prices" | "availability" | "market-comparison" | "news" | "verification" | "manual-search";
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  price?: number;
  source: SearchProvider | "mock";
  key?: string;
  componentType?: BuilderComponentType;
  query?: string;
};

export type TavilySearchResult = {
  title: string;
  url: string;
  content?: string;
  snippet?: string;
};

export type TavilyUsage = {
  total_requests?: number;
  search_queries?: number;
};

export type TavilyExtractItem = {
  url: string;
  raw_content?: string;
  favicon?: string;
};

export type TavilyExtractResponse = {
  results?: TavilyExtractItem[];
  failed_results?: Array<{ url: string; error?: string }>;
  response_time?: number;
};

export type MarketQueryRun = {
  key: string;
  label: string;
  componentType: BuilderComponentType;
  query: string;
  referencePrice: number;
  results: SearchResult[];
};

export type GpuMarketContext = {
  mode?: BuilderMarketMode;
  queries: string[];
  queryRuns: MarketQueryRun[];
  searchResults: SearchResult[];
  extracted: TavilyExtractResponse | null;
};
