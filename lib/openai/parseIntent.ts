import type { ParsedIntent, Priorities, UsagePurpose } from "@/lib/core/types";
import { normalizePartName } from "@/lib/core/normalize/normalizePartName";
import { parsePartType } from "@/lib/core/normalize/parsePartType";
import { requestStructuredJson } from "@/lib/openai/client";

const DEFAULT_PRIORITIES: Priorities = {
  value: 0.5,
  longevity: 0.35,
  efficiency: 0.2,
  gaming: 0.7,
  productivity: 0.2,
  rayTracing: 0.1,
  streaming: 0.1,
};

const PARSE_INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intentType", "partType", "candidates", "purpose", "condition", "budgetPln", "workloadProfile", "targetResolution", "targetFps", "priorities", "constraints"],
  properties: {
    intentType: { type: "string", enum: ["compare_parts", "recommend_build"] },
    partType: { type: ["string", "null"], enum: ["cpu", "gpu", null] },
    candidates: { type: "array", items: { type: "string" } },
    purpose: { type: "string", enum: ["gaming", "productivity", "mixed"] },
    condition: { type: ["string", "null"], enum: ["new", "used", "mixed", null] },
    budgetPln: { type: ["number", "null"] },
    workloadProfile: { type: ["string", "null"] },
    targetResolution: { type: ["string", "null"], enum: ["1080p", "1440p", "4k", null] },
    targetFps: { type: ["number", "null"] },
    priorities: {
      type: "object",
      additionalProperties: false,
      required: ["value", "longevity", "efficiency", "gaming", "productivity", "rayTracing", "streaming"],
      properties: {
        value: { type: "number" },
        longevity: { type: "number" },
        efficiency: { type: "number" },
        gaming: { type: "number" },
        productivity: { type: "number" },
        rayTracing: { type: "number" },
        streaming: { type: "number" },
      },
    },
    constraints: {
      type: "object",
      additionalProperties: false,
      properties: {
        mustHaveNvenc: { type: "boolean" },
        mustHaveDlss: { type: "boolean" },
        preferUpgradePath: { type: "boolean" },
        lowNoise: { type: "boolean" },
      },
    },
  },
};

function extractBudget(text: string) {
  const explicit = text.match(/(?:za|do|budzet|budżet)\s*(\d{3,5})(?!p)\s*(?:zl|zł|pln)?\b/i);
  if (explicit) {
    return Number(explicit[1]);
  }

  const withCurrency = text.match(/(\d{3,5})(?!p)\s*(?:zl|zł|pln)\b/i);
  if (withCurrency) {
    return Number(withCurrency[1]);
  }

  return null;
}

function extractResolution(text: string) {
  if (/4k/i.test(text)) return "4k";
  if (/1440/i.test(text)) return "1440p";
  if (/1080/i.test(text)) return "1080p";
  return null;
}

function extractFps(text: string) {
  const match = text.match(/(\d{2,3})\s*fps/i);
  return match ? Number(match[1]) : null;
}

function inferPurpose(text: string): UsagePurpose {
  const gaming = /(gry|grania|gaming|single player|aaa|esports|competitive|fps|shoot)/i.test(text);
  const productivity = /(montaż|montaz|praca|render|stream|creator|produkt)/i.test(text);

  if (gaming && productivity) return "mixed";
  if (productivity) return "productivity";
  return "gaming";
}

function inferCondition(text: string) {
  if (/\bmixed\b|\bmix\b|miks/i.test(text)) return "mixed" as const;
  if (/used|uzywan|olx|poleasing/i.test(text)) return "used" as const;
  if (/new|nowy|nowe|sklep/i.test(text)) return "new" as const;
  return null;
}

function inferWorkloadProfile(text: string) {
  if (/(stream|obs)/i.test(text)) return "gaming_plus_streaming";
  if (/(montaż|montaz|render|creator)/i.test(text)) return "gaming_plus_productivity";
  if (/(esport|competitive|strzelank|shooter)/i.test(text)) {
    return /(240|360|high fps|wysokie fps)/i.test(text) ? "esports_competitive" : "shooter_high_fps";
  }
  if (/(aaa|single player|fabular|story)/i.test(text)) return "aaa_visual";
  return "mixed_gaming";
}

function sanitizeCandidate(input: string) {
  return input
    .replace(/\b(co lepsze|which is better).*/i, "")
    .replace(/\b(do|pod|za|w)\b.*$/i, "")
    .trim();
}

function inferCandidates(text: string) {
  const vsMatch = text.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s+(?:do|pod|za|w|co)\b|$)/i);
  if (vsMatch) {
    return [sanitizeCandidate(vsMatch[1]), sanitizeCandidate(vsMatch[2])].filter(Boolean);
  }

  return [];
}

function inferPriorities(text: string): Priorities {
  return {
    value: /opłacal|oplacal|value|budżet|budzet/i.test(text) ? 0.85 : DEFAULT_PRIORITIES.value,
    longevity: /na lata|upgrade|upgrade path|przyszło|przyszlo/i.test(text) ? 0.8 : DEFAULT_PRIORITIES.longevity,
    efficiency: /cisza|cichy|low noise|wydajnosc energetyczna|prąd|prad/i.test(text) ? 0.65 : DEFAULT_PRIORITIES.efficiency,
    gaming: /gry|gaming|fps|1440|1080|4k|aaa|esports/i.test(text) ? 0.9 : DEFAULT_PRIORITIES.gaming,
    productivity: /montaż|montaz|render|praca|creator/i.test(text) ? 0.65 : DEFAULT_PRIORITIES.productivity,
    rayTracing: /ray tracing|tracingu|\brt\b/i.test(text) ? 0.85 : DEFAULT_PRIORITIES.rayTracing,
    streaming: /stream|nvenc|obs/i.test(text) ? 0.85 : DEFAULT_PRIORITIES.streaming,
  };
}

function buildLocalIntent(userText: string): ParsedIntent {
  const normalized = normalizePartName(userText);
  const candidates = inferCandidates(normalized);
  const partType = candidates.length >= 2 ? parsePartType(candidates.join(" ")) : null;

  return {
    intentType: candidates.length >= 2 ? "compare_parts" : "recommend_build",
    partType: partType === "cpu" || partType === "gpu" ? partType : null,
    candidates,
    purpose: inferPurpose(normalized),
    condition: inferCondition(normalized),
    budgetPln: extractBudget(normalized),
    workloadProfile: inferWorkloadProfile(normalized),
    targetResolution: extractResolution(normalized),
    targetFps: extractFps(normalized),
    priorities: inferPriorities(normalized),
    constraints: {
      mustHaveNvenc: /nvenc/i.test(normalized),
      mustHaveDlss: /dlss/i.test(normalized),
      preferUpgradePath: /upgrade|na lata|am5/i.test(normalized),
      lowNoise: /cisza|cichy|low noise/i.test(normalized),
    },
  };
}

export async function parseIntent(userText: string): Promise<ParsedIntent> {
  const local = buildLocalIntent(userText);
  const remote = await requestStructuredJson<ParsedIntent>({
    system:
      "Parse the user's PC hardware intent into strict JSON. Do not invent benchmark data. Do not explain. If exact SKU is missing, keep candidates empty or generic partType only.",
    user: userText,
    schemaName: "kompbrat_intent",
    schema: PARSE_INTENT_SCHEMA,
  });

  if (!remote) {
    return local;
  }

  return {
    ...local,
    ...remote,
    priorities: {
      ...local.priorities,
      ...remote.priorities,
    },
    constraints: {
      ...local.constraints,
      ...remote.constraints,
    },
    candidates: remote.candidates?.length ? remote.candidates : local.candidates,
  };
}
