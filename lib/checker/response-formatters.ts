import type { CheckerOutput } from "@/lib/validations/checker";
import type { CheckerResult, DetectedPart } from "@/types/checker";

import { checkerOutputSchema } from "@/lib/validations/checker";

function buildCommentGuardrails(detectedParts: DetectedPart[]) {
  const hasDetectedCpu = detectedParts.some((part) => part.type === "CPU" && part.confidence !== "low");
  const hasDetectedGpu = detectedParts.some((part) => part.type === "GPU" && part.confidence !== "low");
  const bannedPhrases: string[] = [];

  if (hasDetectedCpu) {
    bannedPhrases.push("brakuje jasnego modelu procesora");
  }

  if (hasDetectedGpu) {
    bannedPhrases.push("brakuje jasnego modelu karty graficznej");
    bannedPhrases.push("brakuje jasnego modelu karty");
  }

  return { bannedPhrases };
}

function sanitizeCommentText(value: string, bannedPhrases: string[]) {
  let sanitized = value;

  for (const phrase of bannedPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    sanitized = sanitized.replace(new RegExp(escaped, "gi"), "specyfikacja jest już wykryta w parserze");
  }

  return sanitized
    .replace(/\s+/g, " ")
    .replace(/\s([,.!?:;])/g, "$1")
    .trim();
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    const match = input.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      return null;
    }
  }
}

function normalizeDetectedParts(value: unknown, fallback: DetectedPart[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const typed = item as Record<string, unknown>;
      if (typeof typed.type !== "string" || typeof typed.name !== "string") {
        return null;
      }

      const upperType = typed.type.toUpperCase();
      if (!["CPU", "GPU", "RAM", "DYSK", "PŁYTA", "PSU", "CHŁODZENIE", "CENA"].includes(upperType)) {
        return null;
      }

      return {
        type: upperType as DetectedPart["type"],
        name: typed.name,
        confidence:
          typed.confidence === "high" || typed.confidence === "medium" || typed.confidence === "low"
            ? typed.confidence
            : "low",
        source:
          typed.source === "title" || typed.source === "description" || typed.source === "merged" || typed.source === "explicit"
            ? typed.source
            : "description",
      };
    })
    .filter((item): item is DetectedPart => Boolean(item));

  return normalized.length > 0 ? normalized : fallback;
}

export function buildMockCheckerResponse(fallback: CheckerResult): CheckerResult {
  return fallback;
}

export function normalizeCheckerResponse(raw: unknown, fallback: CheckerResult): CheckerOutput {
  const guardrails = buildCommentGuardrails(fallback.detectedParts);
  const parsed =
    typeof raw === "string"
      ? safeJsonParse(raw)
      : raw && typeof raw === "object" && "content" in (raw as Record<string, unknown>) && typeof (raw as Record<string, unknown>).content === "string"
        ? safeJsonParse((raw as Record<string, unknown>).content as string)
        : raw;

  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const candidate = parsed as Record<string, unknown>;
  const normalized = {
    verdict: fallback.verdict,
    score: fallback.score,
    valueScore: fallback.valueScore,
    riskScore: fallback.riskScore,
    profitabilityScore: fallback.profitabilityScore,
    profitabilityLabel: fallback.profitabilityLabel,
    riskLabel: fallback.riskLabel,
    fairValue: fallback.fairValue,
    fairValueRange: fallback.fairValueRange,
    priceRatio: fallback.priceRatio,
    subscores: fallback.subscores,
    profitabilityBreakdown: fallback.profitabilityBreakdown,
    riskBreakdown: fallback.riskBreakdown,
    decisionSummary: fallback.decisionSummary,
    verdictLabel: fallback.verdictLabel,
    verdictSummary: fallback.verdictSummary,
    estimatedValueMin: fallback.estimatedValueMin,
    estimatedValueMax: fallback.estimatedValueMax,
    sensibleBuyPrice: fallback.sensibleBuyPrice,
    insights: fallback.insights,
    nextSteps: fallback.nextSteps,
    summary:
      typeof candidate.summary === "string"
        ? sanitizeCommentText(candidate.summary, guardrails.bannedPhrases)
        : sanitizeCommentText(fallback.summary, guardrails.bannedPhrases),
    detectedParts: normalizeDetectedParts(candidate.detectedParts, fallback.detectedParts),
    redFlags: Array.isArray(candidate.redFlags)
      ? candidate.redFlags
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => sanitizeCommentText(item, guardrails.bannedPhrases))
      : fallback.redFlags.map((item) => sanitizeCommentText(item, guardrails.bannedPhrases)),
    betterAlternative:
      typeof candidate.betterAlternative === "string"
        ? sanitizeCommentText(candidate.betterAlternative, guardrails.bannedPhrases)
        : sanitizeCommentText(fallback.betterAlternative, guardrails.bannedPhrases),
    estimatedMarketValue: fallback.estimatedMarketValue,
    estimatedMarketValueConfidence: fallback.estimatedMarketValueConfidence,
    valuationNote: fallback.valuationNote,
    psuAssessment: fallback.psuAssessment,
    gpuValueCheck: fallback.gpuValueCheck,
  };

  const validated = checkerOutputSchema.safeParse(normalized);
  return validated.success ? validated.data : fallback;
}
