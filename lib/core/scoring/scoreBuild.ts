import type { BuildPartSelection, Priorities, WorkloadProfile } from "@/lib/core/types";
import { weightedScore } from "@/lib/core/utils/weightedScore";

export function scoreBuild(input: {
  build: BuildPartSelection;
  totalPrice: number;
  budget: number;
  priorities: Priorities;
  profile: WorkloadProfile;
}) {
  const budgetFit = Math.max(0, 100 - Math.max(0, ((input.totalPrice - input.budget) / Math.max(input.budget, 1)) * 250));
  const storageScore = input.build.storage.capacityGb >= 1000 ? 85 : 65;
  const ramScore = input.build.ram.capacityGb >= 32 ? 88 : 68;
  const psuScore = input.build.psu.qualityScore;
  const boardScore = (input.build.motherboard.chipsetTier + input.build.motherboard.platformLongevity) / 2;

  return weightedScore([
    { value: budgetFit, weight: 0.22 },
    { value: storageScore, weight: input.profile.storageWeight },
    { value: ramScore, weight: input.profile.ramWeight },
    { value: psuScore, weight: 0.08 },
    { value: boardScore, weight: 0.1 + input.priorities.longevity * 0.1 },
  ]);
}
