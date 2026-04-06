"use client";

import type { RecentBuilderQuery } from "@/types/ai";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { pushRecentSearch, RECENT_SEARCHES_KEY, type StoredSearch } from "@/lib/storage/recent-searches";

export function useRecentBuilds() {
  const storage = useLocalStorage<StoredSearch[]>(RECENT_SEARCHES_KEY, []);

  function addRecentBuild(query: RecentBuilderQuery) {
    storage.setValue((currentValue) => pushRecentSearch(currentValue, query));
  }

  function clearRecentBuilds() {
    storage.clearValue();
  }

  return {
    recentBuilds: storage.value,
    isReady: storage.isReady,
    addRecentBuild,
    clearRecentBuilds,
  } as const;
}
