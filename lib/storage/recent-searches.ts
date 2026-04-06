import type { RecentBuilderQuery } from "@/types/ai";

export const RECENT_SEARCHES_KEY = "kompbrat-recent-searches";
export const RECENT_SEARCHES_LIMIT = 8;

export type StoredSearch = RecentBuilderQuery;

export function normalizeRecentSearches(searches: StoredSearch[]) {
  return searches
    .filter((search) => search.prompt.trim().length > 0)
    .slice(0, RECENT_SEARCHES_LIMIT);
}

export function pushRecentSearch(searches: StoredSearch[], search: StoredSearch) {
  return normalizeRecentSearches([search, ...searches.filter((item) => item.prompt !== search.prompt)]);
}

export function clearRecentSearches() {
  return [] as StoredSearch[];
}
