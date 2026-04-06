import { NextResponse } from "next/server";

import { buildCandidateBaskets } from "@/lib/builder/basket-builder";
import { BUILDER_BUDGET_LIMIT_MESSAGE, extractBudgetFromText, isBudgetAboveBuilderLimit } from "@/lib/builder/budget-guardrails";
import { chooseBasketByPolicy } from "@/lib/builder/policy";
import { scoreBaskets } from "@/lib/builder/basket-scoring";
import { buildMarketQueryDefinitions, getBuilderCandidatePool, resolveMarketModeFromPrompt } from "@/lib/builder/candidate-pool";
import { aggregateMarketPriceSnapshots } from "@/lib/builder/price-aggregation";
import { getModelConfig } from "@/lib/ai/model";
import { buildBuilderUserPrompt, prompts } from "@/lib/ai/prompts";
import {
  buildBuilderResponseFromBasket,
  mergeBuilderNarrationWithBasket,
  normalizeBuilderResponse,
  sanitizeBuilderResponseForUi,
} from "@/lib/ai/response-formatters";
import { getGpuMarketContext, shouldUseSearchForBuilder, summarizeGpuMarketContext } from "@/lib/search/provider";
import { builderSchema } from "@/lib/validations/builder";
import { getBudgetGuideline, guidelineSummaryForModel, inferGuidelineCategory } from "@/lib/value-guidelines";
import type { GpuMarketContext } from "@/types/search";
import type { BuilderMarketMode, MarketQueryDefinition } from "@/lib/builder/types";
import type { BuilderResponse } from "@/types/ai";

function getLatestPrompt(payload: { prompt?: string; messages?: Array<{ role: string; content: string }> }) {
  if (payload.prompt) {
    return payload.prompt;
  }

  return [...(payload.messages ?? [])].reverse().find((message) => message.role === "user")?.content ?? "";
}

function extractUseCaseFromText(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("praca") || normalized.includes("nauka") || normalized.includes("montaż") || normalized.includes("montaz")) {
    return "praca i nauka";
  }

  if (normalized.includes("1440")) {
    return "gaming 1440p";
  }

  if (normalized.includes("1080")) {
    return "gaming 1080p";
  }

  if (normalized.includes("gier") || normalized.includes("gaming")) {
    return "gaming";
  }

  return "komputer ogólnego zastosowania";
}

function extractRecommendedGpu(parts: Array<{ type: string; name: string }>) {
  return parts.find((part) => part.type.toUpperCase().includes("GPU"))?.name ?? "brak";
}

function dedupeQueryDefinitions(definitions: MarketQueryDefinition[]) {
  const seen = new Set<string>();

  return definitions.filter((definition) => {
    const key = `${definition.key}:${definition.query}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildResponseFromPolicy(policy: NonNullable<ReturnType<typeof chooseBasketByPolicy>>) {
  const recommended = buildBuilderResponseFromBasket(policy.recommendedBasket);
  const alternative = policy.alternativeBasket ? buildBuilderResponseFromBasket(policy.alternativeBasket) : undefined;

  return {
    ...recommended,
    selectedMode: policy.selectedMode,
    actualModeUsed: policy.actualModeUsed,
    feasibleInSelectedMode: policy.feasibleInSelectedMode,
    recommendedFallbackMode: policy.recommendedFallbackMode ?? null,
    modeMessage: policy.modeMessage,
    warningMessage: policy.warningMessage,
    recommendationMode: policy.recommendedMode,
    policyReason: policy.policyReason,
    alternative: alternative
      ? {
          buildName: alternative.buildName,
          recommendationMode: policy.alternativeBasket?.marketMode ?? "new",
          summary: policy.alternativeReason ?? alternative.summary,
        }
      : undefined,
  };
}

function buildNoFeasibleBuilderResponse(selectedMode: BuilderMarketMode, suggestedMode?: BuilderMarketMode | null): BuilderResponse {
  const selectedLabel = selectedMode === "new" ? "New" : selectedMode === "used" ? "Used" : "Mixed";
  const suggestedLabel = suggestedMode === "new" ? "New" : suggestedMode === "used" ? "Used" : suggestedMode === "mixed" ? "Mixed" : null;

  return sanitizeBuilderResponseForUi({
    summary: `W trybie ${selectedLabel} nie udało się złożyć kompletnego zestawu, który realnie mieści się w budżecie i trzyma podstawowy sens użytkowy.`,
    buildName: "Brak sensownego zestawu na teraz",
    forWho: "Dla osoby, która woli uczciwy komunikat zamiast wciskanego na siłę słabego koszyka.",
    parts: [
      {
        type: "STATUS",
        name: "Brak sensownej konfiguracji w obecnym budżecie i przy wybranym trybie.",
      },
    ],
    notes: [
      "Gdy build jest możliwy z kompromisami, builder powinien go zwrócić. Tutaj problemem jest już realny brak kompletnej konfiguracji w wybranym rynku.",
      suggestedLabel
        ? `Jeśli chcesz, najbliższą alternatywą poza tym constraintem będzie tryb ${suggestedLabel}.`
        : "Najrozsądniej będzie podnieść budżet albo poluzować część oczekiwań.",
      "Nie zwracam udawanego sukcesu tylko dlatego, że jakiś techniczny koszyk da się złożyć.",
    ],
    warnings: ["Wybrany tryb rynku jest traktowany jako twardy constraint, więc nie podmieniam go po cichu na inny."],
    selectedMode,
    actualModeUsed: null,
    feasibleInSelectedMode: false,
    recommendedFallbackMode: suggestedMode ?? null,
    modeMessage: `W trybie ${selectedLabel} nie dało się złożyć kompletnego zestawu w tym budżecie.`,
    warningMessage: suggestedLabel
      ? `Mogę zasugerować ${suggestedLabel} jako osobną alternatywę, ale nie podmieniam wybranego rynku automatycznie.`
      : "Najrozsądniej będzie podnieść budżet albo odpuścić część wymagań.",
    recommendationMode: selectedMode,
    policyReason: "Wybrany rynek jest twardym constraintem. Skoro nie udało się złożyć kompletnego zestawu w tym trybie, nie zamieniam go automatycznie na inny.",
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny JSON na wejściu." }, { status: 400 });
  }

  const parsed = builderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prompt = getLatestPrompt(parsed.data).trim();
  if (!prompt) {
    return NextResponse.json({ error: "Brakuje treści zapytania użytkownika." }, { status: 400 });
  }

  const budget = parsed.data.budget ?? extractBudgetFromText(prompt) ?? 3500;

  if (isBudgetAboveBuilderLimit(budget)) {
    return NextResponse.json(
      {
        code: "BUDGET_LIMIT_EXCEEDED",
        message: BUILDER_BUDGET_LIMIT_MESSAGE,
      },
      { status: 422 },
    );
  }

  const useCase = parsed.data.useCase ?? extractUseCaseFromText(prompt);
  const category = inferGuidelineCategory({ useCase });
  const selectedMode = resolveMarketModeFromPrompt(prompt, parsed.data.marketMode, "new");
  const shouldUseFreshSearch = shouldUseSearchForBuilder({
    prompt,
    budget,
    useCase,
  });
  const analyzedModes: BuilderMarketMode[] = ["new", "used", "mixed"];
  const poolsByMode = new Map<BuilderMarketMode, ReturnType<typeof getBuilderCandidatePool>>();
  const guidelinesByMode = new Map(
    analyzedModes.map((mode) => [
      mode,
      getBudgetGuideline({
        budget,
        category,
        marketPreference: mode,
      }),
    ]),
  );

  for (const mode of analyzedModes) {
    const guideline = guidelinesByMode.get(mode) ?? null;
    const pool = getBuilderCandidatePool({
      budget,
      useCase,
      marketMode: mode,
      category,
      guideline,
    });
    poolsByMode.set(mode, pool);
  }

  console.info(
    "[builder-candidate-gpus]",
    JSON.stringify(
      analyzedModes.map((mode) => ({
        mode,
        gpus: (poolsByMode.get(mode)?.gpus ?? []).map((gpu) => ({
          id: gpu.id,
          name: gpu.name,
          sourceMode: gpu.marketMode,
          fallbackPrice: gpu.fallbackPrice,
        })),
      })),
      null,
      2,
    ),
  );
  console.info(
    "[builder-candidate-cpus]",
    JSON.stringify(
      analyzedModes.map((mode) => ({
        mode,
        cpus: (poolsByMode.get(mode)?.cpus ?? []).map((cpu) => ({
          id: cpu.id,
          name: cpu.name,
          platform: cpu.platform,
          fallbackPrice: cpu.fallbackPrice,
        })),
      })),
      null,
      2,
    ),
  );

  const queryDefinitions = dedupeQueryDefinitions(
    analyzedModes.flatMap((mode) => buildMarketQueryDefinitions(poolsByMode.get(mode)!)),
  );

  let marketContext: GpuMarketContext = {
    mode: selectedMode,
    queries: queryDefinitions.map((entry) => entry.query),
    queryRuns: [],
    searchResults: [],
    extracted: null,
  };

  try {
    marketContext = await getGpuMarketContext(budget, useCase, {
      marketMode: selectedMode,
      queryDefinitions,
      enabled: shouldUseFreshSearch,
    });
  } catch (error) {
    console.error("Builder market context failed:", error);
  }

  const priceSnapshots = aggregateMarketPriceSnapshots({
    context: marketContext,
    queryDefinitions,
  });

  console.info(
    "[builder-market-medians]",
    JSON.stringify(
      priceSnapshots.map((snapshot) => ({
        key: snapshot.key,
        componentType: snapshot.componentType,
        medianPrice: snapshot.medianPrice,
        trimmedMeanPrice: snapshot.trimmedMeanPrice,
        bestGuessPrice: snapshot.bestGuessPrice,
        sampleCount: snapshot.sampleCount,
        confidence: snapshot.confidence,
      })),
      null,
      2,
    ),
  );

  const scoredByMode = analyzedModes.flatMap((mode) => {
    const pool = poolsByMode.get(mode);
    if (!pool) {
      return [];
    }
    const guideline = guidelinesByMode.get(mode) ?? null;

    const baskets = buildCandidateBaskets({
      pool,
      priceSnapshots,
    });

    return scoreBaskets({
      baskets,
      priceSnapshots,
      budget,
      guideline,
    });
  }).sort((left, right) => right.score - left.score || left.estimatedTotal - right.estimatedTotal);

  console.info(
    "[builder-baskets]",
    JSON.stringify(
      scoredByMode.slice(0, 8).map((basket) => ({
        id: basket.id,
        marketMode: basket.marketMode,
        title: basket.title,
        score: basket.score,
        estimatedTotal: basket.estimatedTotal,
        gpu: basket.gpu.name,
        cpu: basket.cpu.name,
        breakdown: basket.breakdown,
      })),
      null,
      2,
    ),
  );

  const policyDecision = chooseBasketByPolicy({
    budget,
    requestedMode: selectedMode,
    scoredBaskets: scoredByMode,
  });

  if (!policyDecision) {
    const suggestedMode =
      scoredByMode.find((basket) => basket.marketMode !== selectedMode && basket.estimatedTotal <= budget * 1.12)?.marketMode ?? null;
    const fallback = buildNoFeasibleBuilderResponse(selectedMode, suggestedMode);
    console.info("[builder-final-gpu]", extractRecommendedGpu(fallback.parts));
    return NextResponse.json(
      {
        code: "NO_FEASIBLE_BUILD",
        message: fallback.modeMessage,
        response: fallback,
      },
      { status: 422 },
    );
  }

  const winner = policyDecision.recommendedBasket;
  const selectedGuideline = guidelinesByMode.get(policyDecision.recommendedMode) ?? guidelinesByMode.get(selectedMode) ?? null;
  const runnerUps = scoredByMode
    .filter((basket) => basket.id !== winner.id)
    .slice(0, 3);
  const fallback = sanitizeBuilderResponseForUi(buildResponseFromPolicy(policyDecision));

  console.info(
    "[builder-final-winner]",
    JSON.stringify(
      {
        requestedMode: selectedMode,
        selectedMode: policyDecision.selectedMode,
        actualModeUsed: policyDecision.actualModeUsed,
        modeScores: policyDecision.modeScores,
        feasibleInSelectedMode: policyDecision.feasibleInSelectedMode,
        recommendedFallbackMode: policyDecision.recommendedFallbackMode,
        id: winner.id,
        score: winner.score,
        estimatedTotal: winner.estimatedTotal,
        gpu: winner.gpu.name,
        cpu: winner.cpu.name,
        why: winner.reasons,
        policyReason: policyDecision.policyReason,
        alternative: policyDecision.alternativeBasket
          ? {
              id: policyDecision.alternativeBasket.id,
              mode: policyDecision.alternativeBasket.marketMode,
              gpu: policyDecision.alternativeBasket.gpu.name,
              cpu: policyDecision.alternativeBasket.cpu.name,
              score: policyDecision.alternativeBasket.score,
            }
          : null,
      },
      null,
      2,
    ),
  );

  const modelConfig = getModelConfig();
  if (!modelConfig.apiKey) {
    console.info("[builder-final-gpu]", extractRecommendedGpu(fallback.parts));
    return NextResponse.json(fallback);
  }

  try {
    const openAIResponse = await fetch(modelConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: prompts.builder,
          },
          {
            role: "user",
            content: buildBuilderUserPrompt({
              prompt,
              budget,
              useCase,
              marketMode: policyDecision.recommendedMode,
              selectedMode: policyDecision.selectedMode,
              feasibleInSelectedMode: policyDecision.feasibleInSelectedMode,
              modeMessage: policyDecision.modeMessage,
              marketContext: summarizeGpuMarketContext(marketContext),
              priceSnapshots,
              winningBasket: winner,
              runnerUps,
              policyReason: policyDecision.policyReason,
              guideline: guidelineSummaryForModel(selectedGuideline),
              alternative: fallback.alternative,
              modeScores: policyDecision.modeScores,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kompbrat_builder_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["summary", "buildName", "forWho", "parts", "notes", "warnings"],
              properties: {
                summary: { type: "string" },
                buildName: { type: "string" },
                forWho: { type: "string" },
                parts: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "name"],
                    properties: {
                      type: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
                notes: {
                  type: "array",
                  items: { type: "string" },
                },
                warnings: {
                  type: "array",
                  items: { type: "string" },
                },
                selectedMode: {
                  type: "string",
                  enum: ["new", "used", "mixed"],
                },
                actualModeUsed: {
                  type: ["string", "null"],
                  enum: ["new", "used", "mixed", null],
                },
                feasibleInSelectedMode: {
                  type: "boolean",
                },
                recommendedFallbackMode: {
                  type: ["string", "null"],
                  enum: ["new", "used", "mixed", null],
                },
                modeMessage: {
                  type: "string",
                },
                warningMessage: {
                  type: "string",
                },
                recommendationMode: {
                  type: "string",
                  enum: ["new", "used", "mixed"],
                },
                policyReason: {
                  type: "string",
                },
                alternative: {
                  type: "object",
                  additionalProperties: false,
                  required: ["buildName", "recommendationMode", "summary"],
                  properties: {
                    buildName: { type: "string" },
                    recommendationMode: {
                      type: "string",
                      enum: ["new", "used", "mixed"],
                    },
                    summary: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI chat route error:", openAIResponse.status, errorText);
      console.info("[builder-final-gpu]", extractRecommendedGpu(fallback.parts));
      return NextResponse.json(fallback);
    }

    const completion = (await openAIResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          refusal?: string | null;
        };
      }>;
    };

    const content = completion.choices?.[0]?.message?.content;

    if (!content || completion.choices?.[0]?.message?.refusal) {
      console.info("[builder-final-gpu]", extractRecommendedGpu(fallback.parts));
      return NextResponse.json(fallback);
    }

    const normalized = normalizeBuilderResponse(content, fallback);
    const merged = sanitizeBuilderResponseForUi(
      mergeBuilderNarrationWithBasket({
        basket: winner,
        narration: normalized,
        fallback,
      }),
    );

    console.info("[builder-final-gpu]", extractRecommendedGpu(merged.parts));
    return NextResponse.json(merged);
  } catch (error) {
    console.error("OpenAI chat route unexpected error:", error);
    console.info("[builder-final-gpu]", extractRecommendedGpu(fallback.parts));
    return NextResponse.json(fallback);
  }
}
