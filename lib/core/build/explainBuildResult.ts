import { formatPrice } from "@/lib/utils/format-price";
import type { BuildRecommendationResult } from "@/lib/core/types";

export function explainBuildResult(result: BuildRecommendationResult) {
  if (!result.feasible || !result.build || !result.totalPrice) {
    return {
      summary: result.reasons[0] ?? "Nie udało się przygotować buildu.",
      reasons: result.reasons,
      tradeoffs: result.tradeoffs,
      nextSteps: result.nextSteps,
    };
  }

  return {
    summary:
      `To ${result.strengthLabel} pod profil ${result.inferredWorkloadProfile.label.toLowerCase()}. ` +
      `Całość wychodzi około ${formatPrice(result.totalPrice)}.`,
    reasons: result.reasons,
    tradeoffs: result.tradeoffs,
    nextSteps: result.nextSteps,
  };
}
