export const MAX_BUILDER_BUDGET = 10_000;

export const BUILDER_BUDGET_LIMIT_MESSAGE =
  "Na ten moment KOMPBRAT ogarnia zestawy do 10 000 zł. Przy wyższych budżetach rekomendacje jeszcze dopracowujemy.";

export function extractBudgetFromText(prompt: string) {
  const match = prompt.match(/(\d[\d\s]{2,5})\s?(zł|zl|pln)/i) ?? prompt.match(/\b(\d{4,5})\b/);

  if (!match?.[1]) {
    return undefined;
  }

  const parsedBudget = Number(match[1].replace(/[^\d]/g, ""));
  return Number.isFinite(parsedBudget) && parsedBudget >= 1000 && parsedBudget <= 100_000 ? parsedBudget : undefined;
}

export function isBudgetAboveBuilderLimit(budget?: number) {
  return typeof budget === "number" && budget > MAX_BUILDER_BUDGET;
}
