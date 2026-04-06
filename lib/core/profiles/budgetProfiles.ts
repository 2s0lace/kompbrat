import type { BudgetProfile } from "@/lib/core/types";

export const budgetProfiles: BudgetProfile[] = [
  { id: "entry", minBudget: 0, maxBudget: 2499, label: "entry-level", preferredRamGb: 16, minimumRamGb: 16, preferredStorageGb: 500, minimumStorageGb: 500 },
  { id: "budget-value", minBudget: 2500, maxBudget: 4499, label: "budget value", preferredRamGb: 16, minimumRamGb: 16, preferredStorageGb: 1000, minimumStorageGb: 500 },
  { id: "midrange", minBudget: 4500, maxBudget: 6999, label: "solid midrange", preferredRamGb: 32, minimumRamGb: 16, preferredStorageGb: 1000, minimumStorageGb: 1000 },
  { id: "strong", minBudget: 7000, maxBudget: Number.POSITIVE_INFINITY, label: "strong build", preferredRamGb: 32, minimumRamGb: 32, preferredStorageGb: 1000, minimumStorageGb: 1000 },
];

export function getBudgetProfile(budget: number) {
  return budgetProfiles.find((profile) => budget >= profile.minBudget && budget <= profile.maxBudget) ?? budgetProfiles[0];
}
