import { NextResponse } from "next/server";

import { getModelConfig } from "@/lib/ai/model";
import { buildCheckerUserPrompt, prompts } from "@/lib/ai/prompts";
import { extractHeuristics } from "@/lib/checker/heuristics";
import { buildGpuValueCheck } from "@/lib/checker/gpu-price-sanity";
import { buildCheckerReasoning } from "@/lib/checker/insight-engine";
import { parseOffer } from "@/lib/checker/parse-offer";
import { buildPsuAssessment } from "@/lib/checker/psu-recommendation";
import { buildMockCheckerResponse, normalizeCheckerResponse } from "@/lib/checker/response-formatters";
import { estimateOfferMarketValue, scoreOffer } from "@/lib/checker/scoring";
import { getVerdict } from "@/lib/checker/verdict";
import { searchCatalog, shouldUseSearchForDealChecker } from "@/lib/search/provider";
import { checkerSchema } from "@/lib/validations/checker";
import { getBudgetGuideline, guidelineSummaryForModel, inferGuidelineCategory, inferGuidelineMarketPreference } from "@/lib/value-guidelines";
import type { SearchResult } from "@/types/search";

function hasSearchProviderConfig() {
  return Boolean(process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY || process.env.TAVILY_API_KEY);
}

function buildSearchQuery(input: {
  title: string;
  description: string;
  detectedParts: Array<{ type: string; name: string }>;
  price?: number;
}) {
  const topParts = input.detectedParts
    .filter((part) => part.type !== "CENA")
    .slice(0, 3)
    .map((part) => part.name);

  return [input.title, ...topParts, typeof input.price === "number" ? `${input.price} zł` : "", input.description.slice(0, 80)]
    .filter(Boolean)
    .join(" ");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny JSON na wejściu." }, { status: 400 });
  }

  const parsed = checkerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const parsedOffer = parseOffer({
    title: parsed.data.title,
    description: parsed.data.description,
    price: parsed.data.price,
  });
  const gpuValueCheck = buildGpuValueCheck({
    parsed: parsedOffer,
    title: parsed.data.title,
    description: parsed.data.description,
    price: parsed.data.price,
  });
  const psuAssessment = buildPsuAssessment(parsedOffer);
  const effectivePrice = parsedOffer.price;
  const valuation = estimateOfferMarketValue(parsedOffer);
  const guidelineCategory = inferGuidelineCategory({
    title: parsed.data.title,
    description: parsed.data.description,
  });
  const guidelineMarketPreference = inferGuidelineMarketPreference({
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url || undefined,
  });
  const guidelineBudget = effectivePrice ?? valuation.estimatedMarketValue ?? 3000;
  const guideline = getBudgetGuideline({
    budget: guidelineBudget,
    category: guidelineCategory,
    marketPreference: guidelineMarketPreference,
  });
  let searchResults: SearchResult[] = [];
  const shouldUseFreshSearch = shouldUseSearchForDealChecker({
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url || undefined,
    valuationConfidence: valuation.confidence,
    detectedParts: parsedOffer.detectedParts,
  });

  if (hasSearchProviderConfig() && shouldUseFreshSearch && parsedOffer.detectedParts.length > 0) {
    try {
      searchResults = await searchCatalog(
        buildSearchQuery({
          title: parsed.data.title,
          description: parsed.data.description,
          detectedParts: parsedOffer.detectedParts,
          price: effectivePrice,
        }),
        {
          freshnessRequired: true,
          topic: "general",
          maxResults: 3,
          useCache: true,
          reason: "verification",
        },
      );
    } catch (error) {
      console.error("Search provider failed for deal-checker:", error);
      searchResults = [];
    }
  }

  const heuristics = extractHeuristics({
    parsed: parsedOffer,
    price: effectivePrice,
    estimatedMarketValue: valuation.estimatedMarketValue,
    estimatedMarketValueConfidence: valuation.confidence,
    valuationNote: valuation.invalidReason,
    guideline,
    searchResults,
    psuAssessment,
    gpuValueCheck: gpuValueCheck ?? undefined,
  });
  const scoring = scoreOffer({
    parsed: parsedOffer,
    heuristics,
    valuation,
    guideline,
    gpuValueCheck: gpuValueCheck ?? undefined,
    psuAssessment,
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url || undefined,
  });
  const verdict = getVerdict({
    valueScore: scoring.valueScore,
    riskScore: scoring.riskScore,
    suspiciouslyLowPrice: heuristics.suspiciouslyLowPrice,
  });
  const reasoning = buildCheckerReasoning({
    parsed: parsedOffer,
    scoring,
    heuristics,
    psuAssessment,
    gpuValueCheck: gpuValueCheck ?? undefined,
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url || undefined,
  });
  const summary = reasoning.verdictSummary;
  const betterAlternative = reasoning.nextSteps[0] ?? verdict.betterAlternative;

  const fallback = buildMockCheckerResponse({
    verdict: verdict.verdict,
    score: scoring.score,
    valueScore: scoring.valueScore,
    riskScore: scoring.riskScore,
    profitabilityScore: scoring.profitabilityScore,
    profitabilityLabel: scoring.profitabilityLabel,
    riskLabel: scoring.riskLabel,
    fairValue: scoring.fairValue,
    fairValueRange: scoring.fairValueRange,
    priceRatio: scoring.priceRatio,
    subscores: scoring.subscores,
    profitabilityBreakdown: scoring.profitabilityBreakdown,
    riskBreakdown: scoring.riskBreakdown,
    decisionSummary: {
      shortVerdict: reasoning.verdictSummary,
      maxReasonablePrice: reasoning.sensibleBuyPrice,
      keyTakeaways: reasoning.keyTakeaways,
      nextSteps: reasoning.nextSteps,
    },
    verdictLabel: reasoning.verdictLabel,
    verdictSummary: reasoning.verdictSummary,
    estimatedValueMin: reasoning.estimatedValueMin,
    estimatedValueMax: reasoning.estimatedValueMax,
    sensibleBuyPrice: reasoning.sensibleBuyPrice,
    insights: reasoning.insights,
    nextSteps: reasoning.nextSteps,
    summary,
    detectedParts: parsedOffer.detectedParts,
    redFlags: reasoning.insights.red_flags.map((item) => item.text),
    betterAlternative,
    estimatedMarketValue: scoring.estimatedMarketValue,
    estimatedMarketValueConfidence: scoring.estimatedMarketValueConfidence,
    valuationNote: scoring.valuationNote,
    psuAssessment,
    gpuValueCheck: gpuValueCheck ?? undefined,
  });

  const modelConfig = getModelConfig();

  if (!modelConfig.apiKey) {
    return NextResponse.json(fallback);
  }

  try {
    const response = await fetch(modelConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: prompts.checker,
          },
          {
            role: "user",
            content: buildCheckerUserPrompt({
              title: parsed.data.title,
              description: parsed.data.description,
              price: effectivePrice,
              url: parsed.data.url || undefined,
              verdict: fallback.verdict,
              valueScore: fallback.valueScore,
              riskScore: fallback.riskScore,
              estimatedMarketValue: fallback.estimatedMarketValue,
              estimatedMarketValueConfidence: fallback.estimatedMarketValueConfidence,
              valuationNote: fallback.valuationNote,
              detectedParts: parsedOffer.detectedParts,
              redFlags: reasoning.insights.red_flags.map((item) => item.text),
              notes: [
                ...reasoning.insights.minuses.map((item) => item.text),
                ...reasoning.insights.to_verify.map((item) => item.text),
                ...reasoning.insights.positives.map((item) => item.text),
              ],
              psuAssessment,
              gpuValueCheck: gpuValueCheck ?? undefined,
              guideline: guidelineSummaryForModel(guideline),
              searchContext: searchResults.map((result) => `${result.title} | ${result.price ?? "brak ceny"} | ${result.snippet}`),
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kompbrat_checker_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["verdict", "score", "valueScore", "riskScore", "summary", "detectedParts", "redFlags", "betterAlternative"],
              properties: {
                verdict: {
                  type: "string",
                  enum: ["dobra okazja", "średnia", "nieopłacalna", "podejrzanie dobra"],
                },
                score: {
                  type: "number",
                },
                valueScore: {
                  type: "number",
                },
                riskScore: {
                  type: "number",
                },
                summary: {
                  type: "string",
                },
                detectedParts: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "name"],
                    properties: {
                      type: {
                        type: "string",
                        enum: ["CPU", "GPU", "RAM", "DYSK", "PŁYTA", "PSU", "CENA"],
                      },
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
                redFlags: {
                  type: "array",
                  items: { type: "string" },
                },
                betterAlternative: {
                  type: "string",
                },
                estimatedMarketValue: {
                  type: "number",
                },
                gpuValueCheck: {
                  type: "object",
                  additionalProperties: false,
                  required: ["gpu_found", "price_bracket", "gpu_position_for_price", "explanation", "redFlags", "notes"],
                  properties: {
                    gpu_found: { type: "string" },
                    price_bracket: { type: "string" },
                    gpu_position_for_price: {
                      type: "string",
                      enum: ["too_weak", "borderline", "ok", "strong"],
                    },
                    explanation: { type: "string" },
                    redFlags: {
                      type: "array",
                      items: { type: "string" },
                    },
                    notes: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI deal-checker error:", response.status, errorText);
      return NextResponse.json(fallback);
    }

    const completion = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          refusal?: string | null;
        };
      }>;
    };

    const content = completion.choices?.[0]?.message?.content;

    if (!content || completion.choices?.[0]?.message?.refusal) {
      return NextResponse.json(fallback);
    }

    const normalized = normalizeCheckerResponse(content, fallback);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Deal-checker unexpected error:", error);
    return NextResponse.json(fallback);
  }
}
