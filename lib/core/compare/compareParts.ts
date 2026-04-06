import { cpuDb } from "@/lib/core/db/cpuDb";
import { gpuDb } from "@/lib/core/db/gpuDb";
import { parsePartType } from "@/lib/core/normalize/parsePartType";
import { scoreCpu } from "@/lib/core/scoring/scoreCpu";
import { scoreGpu } from "@/lib/core/scoring/scoreGpu";
import { findBestAliasMatch } from "@/lib/core/utils/matchCandidates";
import type { CpuRecord, GpuRecord, ParsedIntent, PartComparisonResult, PartType } from "@/lib/core/types";

function resolveCpu(candidate: string) {
  const match = cpuDb
    .map((item) => ({
      item,
      match: findBestAliasMatch(candidate, [item.name, ...item.aliases]),
    }))
    .filter((entry) => entry.match)
    .sort((left, right) => (right.match?.normalized.length ?? 0) - (left.match?.normalized.length ?? 0))[0];

  return match?.item ?? null;
}

function resolveGpu(candidate: string) {
  const match = gpuDb
    .map((item) => ({
      item,
      match: findBestAliasMatch(candidate, [item.name, ...item.aliases]),
    }))
    .filter((entry) => entry.match)
    .sort((left, right) => (right.match?.normalized.length ?? 0) - (left.match?.normalized.length ?? 0))[0];

  return match?.item ?? null;
}

export async function compareParts(intent: ParsedIntent): Promise<PartComparisonResult<CpuRecord | GpuRecord>> {
  const inferredByText: PartType | null = intent.partType ?? parsePartType(intent.candidates.join(" "));
  const cpuMatches = intent.candidates.map(resolveCpu).filter(Boolean);
  const gpuMatches = intent.candidates.map(resolveGpu).filter(Boolean);
  const partType: PartType | null =
    inferredByText ??
    (cpuMatches.length >= 2 ? "cpu" : null) ??
    (gpuMatches.length >= 2 ? "gpu" : null);

  if (!partType || (partType !== "cpu" && partType !== "gpu")) {
    return {
      partType: "cpu",
      winner: null,
      ranking: [],
      reasons: ["Nie udało się jednoznacznie rozpoznać typu części do porównania."],
      tradeoffs: ["Podaj dwie części tego samego typu, np. CPU albo GPU."],
      intent,
    };
  }

  if (partType === "cpu") {
    const ranking = cpuMatches.map((item) => scoreCpu(item as CpuRecord, intent.priorities, intent.condition === "new" ? "new" : "used")).sort((a, b) => b.score - a.score);
    return {
      partType,
      winner: ranking[0]?.item ?? null,
      ranking,
      reasons: ranking[0] ? ranking[0].reasons : ["Brak dopasowanych CPU w lokalnej bazie."],
      tradeoffs: ranking.flatMap((entry) => entry.tradeoffs).slice(0, 4),
      intent,
    };
  }

  const ranking = gpuMatches.map((item) => scoreGpu(item as GpuRecord, intent.priorities, intent.targetResolution ?? "1080p", intent.condition === "new" ? "new" : "used")).sort((a, b) => b.score - a.score);
  return {
    partType,
    winner: ranking[0]?.item ?? null,
    ranking,
    reasons: ranking[0] ? ranking[0].reasons : ["Brak dopasowanych GPU w lokalnej bazie."],
    tradeoffs: ranking.flatMap((entry) => entry.tradeoffs).slice(0, 4),
    intent,
  };
}
