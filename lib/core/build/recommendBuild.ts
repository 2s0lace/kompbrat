import { caseDb } from "@/lib/core/db/caseDb";
import { cpuDb } from "@/lib/core/db/cpuDb";
import { gpuDb } from "@/lib/core/db/gpuDb";
import { motherboardDb } from "@/lib/core/db/motherboardDb";
import { psuDb } from "@/lib/core/db/psuDb";
import { ramDb } from "@/lib/core/db/ramDb";
import { storageDb } from "@/lib/core/db/storageDb";
import { inferBuildPriorities } from "@/lib/core/build/inferBuildPriorities";
import { inferWorkloadProfile } from "@/lib/core/build/inferWorkloadProfile";
import { validateBuild } from "@/lib/core/build/validateBuild";
import { getBudgetProfile } from "@/lib/core/profiles/budgetProfiles";
import { scoreBuild } from "@/lib/core/scoring/scoreBuild";
import { scoreCpu } from "@/lib/core/scoring/scoreCpu";
import { scoreGpu } from "@/lib/core/scoring/scoreGpu";
import type {
  BuildPartSelection,
  BuildRecommendationResult,
  BudgetProfile,
  CaseRecord,
  CpuRecord,
  GpuRecord,
  MarketCondition,
  MotherboardRecord,
  ParsedIntent,
  Priorities,
  PsuRecord,
  RamRecord,
  StorageRecord,
} from "@/lib/core/types";

function getMarketPrice(value: { newPricePln: number | null; usedPricePln: number | null }, condition: MarketCondition) {
  if (condition === "new") {
    return value.newPricePln;
  }

  if (condition === "used") {
    return value.usedPricePln;
  }

  const candidates = [value.usedPricePln, value.newPricePln].filter((entry): entry is number => typeof entry === "number");
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function resolveCondition(condition: MarketCondition | null) {
  return condition ?? "mixed";
}

function getRamTarget(profile: BudgetProfile, priorities: Priorities) {
  if (profile.preferredRamGb >= 32 || priorities.productivity >= 0.55 || priorities.streaming >= 0.55) {
    return 32;
  }

  return 16;
}

function chooseMotherboard(cpu: CpuRecord, condition: MarketCondition, priorities: Priorities) {
  const compatible = motherboardDb
    .filter((board) => board.socket === cpu.socket)
    .map((board) => ({ board, price: getMarketPrice(board, condition) }))
    .filter((entry): entry is { board: MotherboardRecord; price: number } => typeof entry.price === "number");

  if (compatible.length === 0) {
    return null;
  }

  return compatible
    .sort((left, right) => {
      const leftScore = left.board.platformLongevity * priorities.longevity + left.board.chipsetTier * 0.4 - left.price * 0.05;
      const rightScore = right.board.platformLongevity * priorities.longevity + right.board.chipsetTier * 0.4 - right.price * 0.05;
      return rightScore - leftScore;
    })[0];
}

function chooseRam(board: MotherboardRecord, condition: MarketCondition, targetRamGb: number) {
  const compatible = ramDb
    .filter((ram) => ram.ramType === board.ramType && ram.capacityGb >= targetRamGb)
    .map((ram) => ({ ram, price: getMarketPrice(ram, condition) }))
    .filter((entry): entry is { ram: RamRecord; price: number } => typeof entry.price === "number")
    .sort((left, right) => left.price - right.price);

  if (compatible[0]) {
    return compatible[0];
  }

  return (
    ramDb
      .filter((ram) => ram.ramType === board.ramType)
      .map((ram) => ({ ram, price: getMarketPrice(ram, condition) }))
      .filter((entry): entry is { ram: RamRecord; price: number } => typeof entry.price === "number")
      .sort((left, right) => left.price - right.price)[0] ?? null
  );
}

function chooseStorage(condition: MarketCondition, budgetProfile: BudgetProfile, remainingBudget: number) {
  const preferred = storageDb
    .map((storage) => ({ storage, price: getMarketPrice(storage, condition) }))
    .filter((entry): entry is { storage: StorageRecord; price: number } => typeof entry.price === "number")
    .filter((entry) => entry.storage.capacityGb >= budgetProfile.minimumStorageGb)
    .sort((left, right) => {
      const leftScore = left.storage.tierScore + left.storage.capacityGb * 0.02 - left.price * 0.08;
      const rightScore = right.storage.tierScore + right.storage.capacityGb * 0.02 - right.price * 0.08;
      return rightScore - leftScore;
    });

  return preferred.find((entry) => entry.price <= remainingBudget) ?? preferred[preferred.length - 1] ?? null;
}

function choosePsu(condition: MarketCondition, requiredWattage: number) {
  return (
    psuDb
      .map((psu) => ({ psu, price: getMarketPrice(psu, condition) }))
      .filter((entry): entry is { psu: PsuRecord; price: number } => typeof entry.price === "number")
      .filter((entry) => entry.psu.wattage >= requiredWattage)
      .sort((left, right) => left.price - right.price)[0] ?? null
  );
}

function chooseCase(condition: MarketCondition, board: MotherboardRecord, gpu: GpuRecord) {
  return (
    caseDb
      .map((pcCase) => ({ pcCase, price: getMarketPrice(pcCase, condition) }))
      .filter((entry): entry is { pcCase: CaseRecord; price: number } => typeof entry.price === "number")
      .filter((entry) => entry.pcCase.supportedFormFactors.includes(board.formFactor) && entry.pcCase.maxGpuLengthMm >= (gpu.powerW >= 280 ? 320 : 300))
      .sort((left, right) => left.price - right.price)[0] ?? null
  );
}

function rankCpus(intent: ParsedIntent, condition: MarketCondition) {
  return cpuDb
    .map((cpu) => scoreCpu(cpu, intent.priorities, condition === "new" ? "new" : "used"))
    .filter((entry) => Number.isFinite(entry.price))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function rankGpus(intent: ParsedIntent, condition: MarketCondition) {
  return gpuDb
    .map((gpu) => scoreGpu(gpu, intent.priorities, intent.targetResolution ?? "1080p", condition === "new" ? "new" : "used"))
    .filter((entry) => Number.isFinite(entry.price))
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}

function buildMarketNote(condition: MarketCondition, feasible: boolean) {
  if (condition === "new") {
    return feasible
      ? "To jest najlepszy logiczny build na nowych częściach dla tego budżetu. Used może czasem dać lepszy value, ale tutaj trzymam się trybu New."
      : "W trybie New nie udało się złożyć sensownego kompletu w tym budżecie bez zbyt mocnych kompromisów.";
  }

  if (condition === "used") {
    return feasible
      ? "To jest build oparty wyłącznie o używane części, zgodnie z wybranym trybem."
      : "W trybie Used nie udało się złożyć sensownego kompletu w tym budżecie i pod ten profil.";
  }

  return feasible ? "Tryb Mixed pozwolił dobrać najbardziej logiczny miks nowych i używanych części." : "Nawet w trybie Mixed ten budżet nie pozwolił złożyć sensownego builda.";
}

export function recommendBuild(intent: ParsedIntent, rawText?: string): BuildRecommendationResult {
  const inferredWorkloadProfile = inferWorkloadProfile({
    purpose: intent.purpose,
    workloadProfile: intent.workloadProfile,
    targetResolution: intent.targetResolution,
    constraints: intent.constraints,
    rawText,
  });
  const suggestedPriorities = inferBuildPriorities(inferredWorkloadProfile, intent);
  const enrichedIntent: ParsedIntent = { ...intent, priorities: suggestedPriorities };
  const condition = resolveCondition(intent.condition);

  if (!intent.budgetPln) {
    return {
      intent: enrichedIntent,
      inferredWorkloadProfile,
      suggestedPriorities,
      missingRequiredData: ["budget"],
      feasible: false,
      strengthLabel: null,
      build: null,
      totalPrice: null,
      validation: null,
      reasons: ["Da się dobrać profil użycia i priorytety, ale bez budżetu nie ma sensu zgadywać konkretnego buildu."],
      tradeoffs: ["Najpierw trzeba znać budżet i rynek części."],
      nextSteps: ["Podaj budżet w PLN.", "Jeśli chcesz, dopisz też rynek: new / used / mixed."],
      marketNote: buildMarketNote(condition, false),
    };
  }

  const budgetProfile = getBudgetProfile(intent.budgetPln);
  const cpuRanking = rankCpus(enrichedIntent, condition);
  const gpuRanking = rankGpus(enrichedIntent, condition);
  let best: {
    build: BuildPartSelection;
    totalPrice: number;
    validation: ReturnType<typeof validateBuild>;
    combinedScore: number;
  } | null = null;

  for (const scoredGpu of gpuRanking) {
    for (const scoredCpu of cpuRanking) {
      const boardChoice = chooseMotherboard(scoredCpu.item, condition, suggestedPriorities);
      if (!boardChoice) {
        continue;
      }

      const ramChoice = chooseRam(boardChoice.board, condition, getRamTarget(budgetProfile, suggestedPriorities));
      if (!ramChoice) {
        continue;
      }

      const storageChoice = chooseStorage(condition, budgetProfile, intent.budgetPln);
      if (!storageChoice) {
        continue;
      }

      const requiredWattage = Math.ceil((scoredCpu.item.powerW + scoredGpu.item.powerW + 160) / 50) * 50;
      const psuChoice = choosePsu(condition, requiredWattage);
      if (!psuChoice) {
        continue;
      }

      const caseChoice = chooseCase(condition, boardChoice.board, scoredGpu.item);
      if (!caseChoice) {
        continue;
      }

      const totalPrice =
        scoredCpu.price +
        scoredGpu.price +
        boardChoice.price +
        ramChoice.price +
        storageChoice.price +
        psuChoice.price +
        caseChoice.price;

      const build: BuildPartSelection = {
        cpu: scoredCpu.item,
        gpu: scoredGpu.item,
        motherboard: boardChoice.board,
        ram: ramChoice.ram,
        storage: storageChoice.storage,
        psu: psuChoice.psu,
        case: caseChoice.pcCase,
      };
      const validation = validateBuild(build, intent.budgetPln, totalPrice);

      if (!validation.valid) {
        continue;
      }

      const supportScore = scoreBuild({
        build,
        totalPrice,
        budget: intent.budgetPln,
        priorities: suggestedPriorities,
        profile: inferredWorkloadProfile,
      });
      const combinedScore = scoredGpu.score * 0.52 + scoredCpu.score * 0.28 + supportScore * 0.2;

      if (!best || combinedScore > best.combinedScore) {
        best = {
          build,
          totalPrice,
          validation,
          combinedScore,
        };
      }
    }
  }

  if (!best) {
    return {
      intent: enrichedIntent,
      inferredWorkloadProfile,
      suggestedPriorities,
      missingRequiredData: [],
      feasible: false,
      strengthLabel: null,
      build: null,
      totalPrice: null,
      validation: null,
      reasons: ["W tym budżecie i trybie rynku nie udało się spiąć kompletnego, sensownego buildu bez oczywistych red flagów."],
      tradeoffs: ["To nie znaczy, że część pojedynczych części jest zła. Problemem jest budżet względem całego zestawu."],
      nextSteps: ["Podnieś budżet albo poluzuj rynek części.", "Jeśli chcesz zostać przy tym budżecie, spróbuj trybu Mixed lub Used."],
      marketNote: buildMarketNote(condition, false),
    };
  }

  return {
    intent: enrichedIntent,
    inferredWorkloadProfile,
    suggestedPriorities,
    missingRequiredData: [],
    feasible: true,
    strengthLabel: budgetProfile.label,
    build: best.build,
    totalPrice: best.totalPrice,
    validation: best.validation,
    reasons: [
      "Najwięcej budżetu poszło w GPU, bo to najbardziej wpływa na realną wydajność w grach.",
      `${best.build.cpu.name} jest logicznie sparowany z ${best.build.gpu.name}.`,
      `${best.build.ram.capacityGb} GB RAM i ${best.build.storage.name} to tutaj świadomy kompromis lub sensowny standard dla budżetu.`,
    ],
    tradeoffs: [
      `${best.build.motherboard.name} to bardziej baza value niż premium platforma.`,
      `${best.build.case.name} i PSU są dobrane rozsądnie, ale bez przepalania budżetu na dodatki.`,
    ],
    nextSteps: [
      "Jeśli chcesz jeszcze bardziej docisnąć FPS, najpierw rozważ zmianę GPU, nie platformy.",
      "Przy tym budżecie warto pilnować promocji lub sensownych używek tylko wtedy, gdy wybierzesz tryb Mixed albo Used.",
    ],
    marketNote: buildMarketNote(condition, true),
  };
}
