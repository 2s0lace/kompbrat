import type { CheckerInput, CheckerResult } from "@/types/checker";

export type StoredCheck = CheckerInput & {
  id: string;
  createdAt: string;
  result: CheckerResult;
};

export const RECENT_CHECKS_KEY = "kompbrat-recent-checks";
export const RECENT_CHECKS_LIMIT = 8;

export function normalizeRecentChecks(checks: StoredCheck[]) {
  return checks
    .filter((check) => check.description.trim().length > 0)
    .slice(0, RECENT_CHECKS_LIMIT);
}

export function pushRecentCheck(checks: StoredCheck[], check: StoredCheck) {
  return normalizeRecentChecks([check, ...checks.filter((item) => item.description !== check.description)]);
}

export function clearRecentChecks() {
  return [] as StoredCheck[];
}
