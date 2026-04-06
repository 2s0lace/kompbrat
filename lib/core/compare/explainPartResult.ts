import type { PartComparisonResult } from "@/lib/core/types";

export function explainPartResult(result: PartComparisonResult<any>) {
  if (!result.winner) {
    return {
      summary: result.reasons[0] ?? "Brak wyniku.",
      reasons: result.reasons,
      tradeoffs: result.tradeoffs,
    };
  }

  return {
    summary: `${result.winner.name} wygrywa w tym profilu użycia.`,
    reasons: result.reasons,
    tradeoffs: result.tradeoffs,
  };
}
