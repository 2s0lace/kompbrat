import type { ScoredBuildBasket } from "@/lib/builder/types";
import type { BuilderPart, BuilderResponse } from "@/types/ai";
import type { Build } from "@/types/build";

import { allBuilds } from "@/lib/builds/data";
import { builderOutputSchema } from "@/lib/validations/builder";

const forbiddenBenchmarkReplacements = [
  {
    pattern: /\bgaming\s*2000\b/gi,
    replacement: "zestaw gamingowy do 2000 zł",
  },
  {
    pattern: /\bgaming\s*3000\b/gi,
    replacement: "zestaw gamingowy do 3000 zł",
  },
  {
    pattern: /\bgaming\s*5000\b/gi,
    replacement: "zestaw gamingowy do 5000 zł",
  },
  {
    pattern: /\bwork\s*2500\b/gi,
    replacement: "zestaw do pracy do 2500 zł",
  },
  {
    pattern: /\bpraca\s*2500\b/gi,
    replacement: "zestaw do pracy do 2500 zł",
  },
  {
    pattern: /\bused\s*best\s*value\b/gi,
    replacement: "używany zestaw z dobrym stosunkiem ceny do wydajności",
  },
  {
    pattern: /\bużywany\s*best\s*value\b/gi,
    replacement: "używany zestaw z dobrym stosunkiem ceny do wydajności",
  },
];

function replaceForbiddenBenchmarkNames(input: string) {
  return forbiddenBenchmarkReplacements.reduce((value, rule) => value.replace(rule.pattern, rule.replacement), input).trim();
}

function sanitizeNarrationText(input: string) {
  return replaceForbiddenBenchmarkNames(input)
    .replace(/\bto jest sweet spot\b/gi, "to jest najmocniejszy balans")
    .replace(/\bsweet spot\b/gi, "mocny balans")
    .replace(/\bwybrałem\b/gi, "polecam")
    .trim();
}

function formatBudgetLabel(price: number) {
  return `${Math.round(price / 100) * 100} zł`;
}

function inferResolutionLabel(useCase: string) {
  const normalized = useCase.toLowerCase();

  if (normalized.includes("1440")) {
    return " pod 1440p";
  }

  if (normalized.includes("1080")) {
    return " pod 1080p";
  }

  return "";
}

function createNaturalBuildNameFromBuild(build: Build) {
  const budgetLabel = formatBudgetLabel(build.price);

  if (build.category === "praca") {
    return `Zestaw do pracy i nauki do ${budgetLabel}`;
  }

  if (build.category === "uzywany") {
    return `Używany zestaw z mocnym GPU do ${budgetLabel}`;
  }

  return `Zestaw gamingowy do ${budgetLabel}${inferResolutionLabel(build.useCase)}`;
}

function createNaturalBuildNameFromBasket(basket: ScoredBuildBasket) {
  const normalizedUseCase = basket.useCase.toLowerCase();

  if (normalizedUseCase.includes("praca") || normalizedUseCase.includes("nauka")) {
    if (basket.gpu.integrated) {
      return `Zestaw do pracy i nauki z szybkim CPU i SSD`;
    }

    return `Zestaw do pracy i nauki z ${basket.cpu.name}`;
  }

  if (normalizedUseCase.includes("1440")) {
    return `Zestaw do grania w 1440p z ${basket.gpu.name}`;
  }

  if (normalizedUseCase.includes("1080")) {
    return `Zestaw do grania w 1080p z ${basket.gpu.name}`;
  }

  if (basket.marketMode === "used") {
    return `Używany zestaw z ${basket.gpu.name}`;
  }

  if (basket.marketMode === "mixed") {
    return `Mieszany zestaw z ${basket.gpu.name}`;
  }

  return `Zestaw do grania z ${basket.gpu.name}`;
}

function sanitizeStringArray(value: string[]) {
  return value.map(sanitizeNarrationText).filter(Boolean);
}

function sanitizeBuildNameForUi(buildName: string, fallbackBuildName: string) {
  const sanitized = sanitizeNarrationText(buildName);
  return sanitized.length > 0 ? sanitized : fallbackBuildName;
}

function normalizePart(value: unknown): BuilderPart | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const part = value as Record<string, unknown>;
  const type = typeof part.type === "string" ? part.type.trim() : "";
  const name = typeof part.name === "string" ? part.name.trim() : "";
  const condition = part.condition === "new" || part.condition === "used" ? part.condition : undefined;

  if (!type || !name) {
    return null;
  }

  return { type, name, condition };
}

function normalizeParts(value: unknown): BuilderPart[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const normalized = normalizePart(item);
      return normalized ? [normalized] : [];
    });
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([type, name]) => {
        if (typeof name !== "string") {
          return [];
        }

        return [
          {
            type: type.toUpperCase(),
            name,
          } satisfies BuilderPart,
        ];
      });
  }

  return [];
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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

export function selectMockBuild(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("praca") || normalized.includes("nauka")) {
    return allBuilds.find((build) => build.slug === "work-2500") ?? allBuilds[0];
  }

  if (normalized.includes("olx") || normalized.includes("allegro") || normalized.includes("uży") || normalized.includes("uzy")) {
    return allBuilds.find((build) => build.slug === "used-best-value") ?? allBuilds[0];
  }

  if (normalized.includes("5000") || normalized.includes("1440")) {
    return allBuilds.find((build) => build.slug === "gaming-5000") ?? allBuilds[0];
  }

  if (normalized.includes("2000")) {
    return allBuilds.find((build) => build.slug === "gaming-2000") ?? allBuilds[0];
  }

  return allBuilds.find((build) => build.slug === "gaming-3000") ?? allBuilds[0];
}

export function buildMockBuilderResponse(prompt: string, build?: Build): BuilderResponse {
  const selectedBuild = build ?? selectMockBuild(prompt);
  const buildName = createNaturalBuildNameFromBuild(selectedBuild);

  return {
    summary: `Przy tym budżecie poszedłbym w zestaw oparty na ${selectedBuild.parts.cpu} i ${selectedBuild.parts.gpu}, bo trzyma najlepszy balans ceny, wydajności i sensownej platformy.`,
    buildName,
    forWho: sanitizeNarrationText(selectedBuild.useCase),
    parts: [
      { type: "CPU", name: selectedBuild.parts.cpu },
      { type: "GPU", name: selectedBuild.parts.gpu },
      { type: "RAM", name: selectedBuild.parts.ram },
      { type: "STORAGE", name: selectedBuild.parts.storage },
      { type: "MOTHERBOARD", name: selectedBuild.parts.motherboard },
      { type: "PSU", name: selectedBuild.parts.psu },
      { type: "CASE", name: selectedBuild.parts.case },
    ],
    notes: [
      sanitizeNarrationText(selectedBuild.shortVerdict),
      sanitizeNarrationText(`Upgrade path: ${selectedBuild.pros[0] ?? "Zostawia sensowną bazę pod późniejsze ulepszenia."}`),
      sanitizeNarrationText(selectedBuild.pros[1] ?? "To jest build nastawiony na praktykę, nie na ozdobniki."),
    ],
    warnings: sanitizeStringArray(selectedBuild.cons.slice(0, 3)),
    selectedMode: selectedBuild.sourceType === "olx-allegro" ? "used" : "new",
    actualModeUsed: selectedBuild.sourceType === "olx-allegro" ? "used" : "new",
    feasibleInSelectedMode: true,
    recommendedFallbackMode: null,
    recommendationMode: selectedBuild.sourceType === "olx-allegro" ? "used" : "new",
  };
}

function estimateCategoryLabel(mode: ScoredBuildBasket["marketMode"]) {
  if (mode === "used") {
    return "używanym albo mieszanym rynku";
  }

  if (mode === "mixed") {
    return "mieszanym rynku";
  }

  return "nowych częściach";
}

export function buildBuilderResponseFromBasket(basket: ScoredBuildBasket): BuilderResponse {
  const parts = basket.parts.map((part) => ({
    type: part.type,
    name: part.name,
    condition: part.condition,
  }));

  return {
    summary: `Najlepszy score ma tutaj koszyk ${basket.cpu.name} + ${basket.gpu.name}. Na dziś to jest po prostu najzdrowszy balans ceny, wydajności i sensownych części dookoła.`,
    buildName: createNaturalBuildNameFromBasket(basket),
    forWho: `Dla osoby, która chce ${basket.useCase.toLowerCase()} i kupować mądrze, a nie tylko złożyć pierwszy kompatybilny zestaw na ${estimateCategoryLabel(basket.marketMode)}.`,
    parts,
    notes: [...basket.reasons.slice(0, 3), ...basket.notes].slice(0, 4),
    warnings: basket.warnings.slice(0, 4),
    selectedMode: basket.marketMode,
    actualModeUsed: basket.marketMode,
    feasibleInSelectedMode: true,
    recommendedFallbackMode: null,
    recommendationMode: basket.marketMode,
  };
}

export function mergeBuilderNarrationWithBasket(input: {
  basket: ScoredBuildBasket;
  narration: BuilderResponse;
  fallback: BuilderResponse;
}) {
  const validated = builderOutputSchema.safeParse({
    ...input.narration,
    parts: input.basket.parts.map((part) => ({
      type: part.type,
      name: part.name,
      condition: part.condition,
    })),
    notes: input.narration.notes.length > 0 ? input.narration.notes : input.fallback.notes,
    warnings: input.narration.warnings.length > 0 ? input.narration.warnings : input.fallback.warnings,
    selectedMode: input.fallback.selectedMode,
    actualModeUsed: input.fallback.actualModeUsed,
    feasibleInSelectedMode: input.fallback.feasibleInSelectedMode,
    recommendedFallbackMode: input.fallback.recommendedFallbackMode,
    modeMessage: input.fallback.modeMessage,
    warningMessage: input.fallback.warningMessage,
    recommendationMode: input.fallback.recommendationMode,
    policyReason: input.narration.policyReason || input.fallback.policyReason,
    alternative: input.narration.alternative || input.fallback.alternative,
  });

  if (!validated.success) {
    return input.fallback;
  }

  return sanitizeBuilderResponseForUi({
    ...validated.data,
    buildName: input.narration.buildName || input.fallback.buildName,
    forWho: input.narration.forWho || input.fallback.forWho,
    parts: input.fallback.parts,
    notes: Array.from(new Set([...validated.data.notes, ...input.basket.reasons])).slice(0, 4),
    warnings: Array.from(new Set([...validated.data.warnings, ...input.basket.warnings])).slice(0, 4),
    selectedMode: input.fallback.selectedMode,
    actualModeUsed: input.fallback.actualModeUsed,
    feasibleInSelectedMode: input.fallback.feasibleInSelectedMode,
    recommendedFallbackMode: input.fallback.recommendedFallbackMode,
    modeMessage: input.fallback.modeMessage,
    warningMessage: input.fallback.warningMessage,
    recommendationMode: input.fallback.recommendationMode,
    policyReason: input.narration.policyReason || input.fallback.policyReason,
    alternative: input.narration.alternative || input.fallback.alternative,
  } satisfies BuilderResponse);
}

export function normalizeBuilderResponse(raw: unknown, fallback: BuilderResponse): BuilderResponse {
  const parsedRaw =
    typeof raw === "string"
      ? safeJsonParse(raw)
      : raw && typeof raw === "object" && "content" in (raw as Record<string, unknown>) && typeof (raw as Record<string, unknown>).content === "string"
        ? safeJsonParse((raw as Record<string, unknown>).content as string)
        : raw;

  if (!parsedRaw || typeof parsedRaw !== "object") {
    return fallback;
  }

  const candidate = parsedRaw as Record<string, unknown>;
  const normalized = {
    summary: typeof candidate.summary === "string" ? candidate.summary : fallback.summary,
    buildName: typeof candidate.buildName === "string" ? candidate.buildName : fallback.buildName,
    forWho: typeof candidate.forWho === "string" ? candidate.forWho : fallback.forWho,
    parts: normalizeParts(candidate.parts),
    notes: normalizeStringArray(candidate.notes),
    warnings: normalizeStringArray(candidate.warnings),
    selectedMode:
      candidate.selectedMode === "new" || candidate.selectedMode === "used" || candidate.selectedMode === "mixed"
        ? candidate.selectedMode
        : fallback.selectedMode,
    actualModeUsed:
      candidate.actualModeUsed === "new" || candidate.actualModeUsed === "used" || candidate.actualModeUsed === "mixed"
        ? candidate.actualModeUsed
        : candidate.actualModeUsed === null
          ? null
          : fallback.actualModeUsed,
    feasibleInSelectedMode:
      typeof candidate.feasibleInSelectedMode === "boolean" ? candidate.feasibleInSelectedMode : fallback.feasibleInSelectedMode,
    recommendedFallbackMode:
      candidate.recommendedFallbackMode === "new" ||
      candidate.recommendedFallbackMode === "used" ||
      candidate.recommendedFallbackMode === "mixed"
        ? candidate.recommendedFallbackMode
        : candidate.recommendedFallbackMode === null
          ? null
          : fallback.recommendedFallbackMode,
    modeMessage: typeof candidate.modeMessage === "string" ? candidate.modeMessage : fallback.modeMessage,
    warningMessage: typeof candidate.warningMessage === "string" ? candidate.warningMessage : fallback.warningMessage,
    recommendationMode:
      candidate.recommendationMode === "new" || candidate.recommendationMode === "used" || candidate.recommendationMode === "mixed"
        ? candidate.recommendationMode
        : fallback.recommendationMode,
    policyReason: typeof candidate.policyReason === "string" ? candidate.policyReason : fallback.policyReason,
    alternative:
      candidate.alternative && typeof candidate.alternative === "object"
        ? {
            buildName:
              typeof (candidate.alternative as Record<string, unknown>).buildName === "string"
                ? ((candidate.alternative as Record<string, unknown>).buildName as string)
                : fallback.alternative?.buildName ?? fallback.buildName,
            recommendationMode:
              (candidate.alternative as Record<string, unknown>).recommendationMode === "new" ||
              (candidate.alternative as Record<string, unknown>).recommendationMode === "used" ||
              (candidate.alternative as Record<string, unknown>).recommendationMode === "mixed"
                ? ((candidate.alternative as Record<string, unknown>).recommendationMode as "new" | "used" | "mixed")
                : fallback.alternative?.recommendationMode ?? fallback.recommendationMode ?? "new",
            summary:
              typeof (candidate.alternative as Record<string, unknown>).summary === "string"
                ? ((candidate.alternative as Record<string, unknown>).summary as string)
                : fallback.alternative?.summary ?? fallback.summary,
          }
        : fallback.alternative,
  };

  const validated = builderOutputSchema.safeParse({
    ...normalized,
    parts: normalized.parts.length > 0 ? normalized.parts : fallback.parts,
    notes: normalized.notes.length > 0 ? normalized.notes : fallback.notes,
    warnings: normalized.warnings.length > 0 ? normalized.warnings : fallback.warnings,
  });

  return validated.success ? sanitizeBuilderResponseForUi(validated.data) : sanitizeBuilderResponseForUi(fallback);
}

export function sanitizeBuilderResponseForUi(response: BuilderResponse): BuilderResponse {
  const fallbackBuildName = response.parts.find((part) => part.type.toUpperCase() === "GPU")?.name
    ? `Zestaw z ${response.parts.find((part) => part.type.toUpperCase() === "GPU")?.name}`
    : "Moja rekomendacja";

  return {
    ...response,
    summary: sanitizeNarrationText(response.summary),
    buildName: sanitizeBuildNameForUi(response.buildName, fallbackBuildName),
    forWho: sanitizeNarrationText(response.forWho),
    notes: sanitizeStringArray(response.notes),
    warnings: sanitizeStringArray(response.warnings),
    modeMessage: response.modeMessage ? sanitizeNarrationText(response.modeMessage) : response.modeMessage,
    warningMessage: response.warningMessage ? sanitizeNarrationText(response.warningMessage) : response.warningMessage,
    policyReason: response.policyReason ? sanitizeNarrationText(response.policyReason) : response.policyReason,
    alternative: response.alternative
      ? {
          ...response.alternative,
          buildName: sanitizeBuildNameForUi(response.alternative.buildName, "Alternatywna opcja"),
          summary: sanitizeNarrationText(response.alternative.summary),
        }
      : response.alternative,
  };
}
