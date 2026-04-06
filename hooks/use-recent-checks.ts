"use client";

import type { StoredCheck } from "@/lib/storage/recent-checks";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { RECENT_CHECKS_KEY, pushRecentCheck } from "@/lib/storage/recent-checks";

export function useRecentChecks() {
  const storage = useLocalStorage<StoredCheck[]>(RECENT_CHECKS_KEY, []);

  function addRecentCheck(check: StoredCheck) {
    storage.setValue((currentValue) => pushRecentCheck(currentValue, check));
  }

  function clearChecks() {
    storage.clearValue();
  }

  return {
    recentChecks: storage.value,
    isReady: storage.isReady,
    addRecentCheck,
    clearRecentChecks: clearChecks,
  } as const;
}
