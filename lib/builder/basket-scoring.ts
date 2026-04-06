import type { BuildBasket, BasketScoreBreakdown, BuilderComponentType, ComponentPriceSnapshot, ScoredBuildBasket } from "@/lib/builder/types";
import type { BudgetGuideline } from "@/lib/value-guidelines";
import { textMatchesAnyTier } from "@/lib/value-guidelines";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isWorkUseCase(useCase: string) {
  return /praca|nauka|montaż|montaz|programowanie|office|excel|photoshop|video|premiere|blender|render|cad/i.test(useCase);
}

function needsDedicatedGpuForWork(useCase: string) {
  return /blender|render|3d|video|premiere|davinci|after effects|stable diffusion|ai|cad|cuda|gpu/i.test(useCase);
}

function getPartPrice(basket: BuildBasket, componentType: BuilderComponentType) {
  return basket.parts.find((part) => part.componentType === componentType)?.estimatedPrice ?? 0;
}

function getRamGb(basket: BuildBasket) {
  const match = (basket.parts.find((part) => part.componentType === "ram")?.name ?? "").match(/(\d+)\s?GB/i);
  return match ? Number(match[1]) : 0;
}

function getStorageGb(basket: BuildBasket) {
  const value = basket.parts.find((part) => part.componentType === "storage")?.name ?? "";
  const tbMatch = value.match(/(\d+)\s?TB/i);
  if (tbMatch) {
    return Number(tbMatch[1]) * 1000;
  }

  const gbMatch = value.match(/(\d+)\s?GB/i);
  return gbMatch ? Number(gbMatch[1]) : 0;
}

function getSnapshot(snapshots: ComponentPriceSnapshot[], key: string) {
  return snapshots.find((entry) => entry.key === key);
}

function scoreAllocationDiscipline(basket: BuildBasket, guideline?: BudgetGuideline | null) {
  if (!guideline || guideline.allocationPriorities.length === 0) {
    return 78;
  }

  const gpuSpend = getPartPrice(basket, "gpu");
  const cpuSpend = getPartPrice(basket, "cpu");
  const ramSpend = getPartPrice(basket, "ram");
  const storageSpend = getPartPrice(basket, "storage");
  const caseSpend = getPartPrice(basket, "case");
  const total = Math.max(basket.estimatedTotal, 1);

  let score = 80;

  if (guideline.allocationPriorities.includes("gpu-first")) {
    const gpuShare = gpuSpend / total;
    score += gpuShare >= 0.38 ? 10 : gpuShare >= 0.33 ? 4 : -10;
  }

  if (guideline.allocationPriorities.includes("cpu-first")) {
    const cpuShare = cpuSpend / total;
    score += cpuShare >= 0.18 ? 8 : cpuShare >= 0.14 ? 3 : -8;
  }

  if (guideline.allocationPriorities.includes("ram-ssd-first")) {
    const memoryStorageShare = (ramSpend + storageSpend) / total;
    score += memoryStorageShare >= 0.18 ? 8 : memoryStorageShare >= 0.14 ? 3 : -7;
  }

  if (guideline.allocationPriorities.includes("avoid-overspending-on-case")) {
    const caseShare = caseSpend / total;
    score += caseShare <= 0.1 ? 6 : caseShare <= 0.13 ? 0 : -10;
  }

  if (guideline.allocationPriorities.includes("balanced-platform")) {
    const cpuShare = cpuSpend / total;
    score += cpuShare <= 0.28 ? 4 : -4;
  }

  if (guideline.allocationPriorities.includes("quiet-work-balance")) {
    const caseShare = caseSpend / total;
    score += caseShare >= 0.06 && caseShare <= 0.13 ? 4 : 0;
  }

  return clamp(score, 0, 100);
}

function scoreGpuValue(basket: BuildBasket, snapshots: ComponentPriceSnapshot[]) {
  const workUseCase = isWorkUseCase(basket.useCase);

  if (basket.gpu.integrated) {
    return clamp(workUseCase ? 78 : 5, 0, 100);
  }

  const marketPrice = getPartPrice(basket, "gpu");
  const pricePressure = clamp(basket.gpu.fallbackPrice / Math.max(1, marketPrice), 0.7, 1.2);
  const snapshot = getSnapshot(snapshots, basket.gpu.id);
  const confidenceBonus = snapshot?.confidence === "high" ? 4 : snapshot?.confidence === "medium" ? 2 : 0;
  return clamp((basket.gpu.performanceScore * 0.58 + basket.gpu.valueScore * 0.42) * pricePressure + confidenceBonus, 0, 100);
}

function scoreCpuAdequacy(basket: BuildBasket) {
  const workUseCase = isWorkUseCase(basket.useCase);
  const target = workUseCase ? basket.cpu.productivityScore : basket.cpu.gamingScore;
  const gpuDemand = basket.gpu.performanceScore;
  const mismatchPenalty = workUseCase
    ? basket.gpu.integrated || !needsDedicatedGpuForWork(basket.useCase)
      ? 0
      : Math.max(0, gpuDemand - target - 14) * 1.1
    : Math.max(0, gpuDemand - target - 8) * 1.4;
  const overspendPenalty = Math.max(0, basket.cpu.fallbackPrice - basket.estimatedTotal * (workUseCase ? 0.26 : 0.2)) / 18;
  return clamp(target - mismatchPenalty - overspendPenalty + basket.cpu.valueScore * 0.15, 0, 100);
}

function scoreMemoryStorage(basket: BuildBasket, guideline?: BudgetGuideline | null) {
  const workUseCase = isWorkUseCase(basket.useCase);
  const ramGb = getRamGb(basket);
  const storageGb = getStorageGb(basket);
  const budget = basket.estimatedTotal;
  const minRam = budget < 4000 ? 16 : (guideline?.minimumStandards.ramGb ?? 16);
  const minStorage = budget < 2200 ? 500 : budget < 4000 ? 500 : (guideline?.minimumStandards.storageGb ?? 1000);
  const idealRam = workUseCase ? Math.max(32, minRam) : minRam;
  const ramScore = ramGb >= idealRam ? 96 : ramGb >= minRam ? budget < 4000 ? 88 : 80 : 42;
  const idealStorage = workUseCase ? Math.max(2000, minStorage) : budget < 2200 ? 500 : Math.max(1000, minStorage);
  const storageScore =
    storageGb >= idealStorage ? 95 : storageGb >= minStorage ? budget < 4000 ? 82 : 84 : budget < 2200 ? 55 : 38;
  return clamp(ramScore * 0.48 + storageScore * 0.52, 0, 100);
}

function scorePlatformQuality(basket: BuildBasket, snapshots: ComponentPriceSnapshot[], guideline?: BudgetGuideline | null) {
  const board = basket.parts.find((part) => part.componentType === "motherboard")?.name ?? "";
  const psu = basket.parts.find((part) => part.componentType === "psu")?.name ?? "";
  const boardScore = board.includes("B650") ? 90 : board.includes("A620") ? 74 : board.includes("B760") ? 80 : 74;
  const psuScore = psu.includes("750") ? 90 : psu.includes("650") ? 82 : psu.includes("550") ? 74 : 62;
  const confidenceBonus = basket.parts.reduce((bonus, part) => {
    const confidence = getSnapshot(snapshots, part.key)?.confidence;
    return bonus + (confidence === "high" ? 1 : 0);
  }, 0);
  const allocationDiscipline = scoreAllocationDiscipline(basket, guideline);

  return clamp(boardScore * 0.35 + psuScore * 0.35 + allocationDiscipline * 0.3 + confidenceBonus, 0, 100);
}

function scoreUpgradePath(basket: BuildBasket) {
  const gpuModePenalty = basket.gpu.marketMode === "used" ? 6 : 0;
  return clamp(basket.cpu.upgradeScore - gpuModePenalty, 0, 100);
}

function scoreRiskPenalty(basket: BuildBasket, budget: number, guideline?: BudgetGuideline | null) {
  const budgetPenalty = basket.estimatedTotal > budget ? Math.min(15, (basket.estimatedTotal - budget) / 35) : 0;
  const usedMarketPenalty = basket.marketMode === "used" ? 8 : basket.marketMode === "mixed" ? 4 : 0;
  const olderHighEndPenalty = basket.gpu.marketMode === "used" && basket.gpu.performanceScore >= 80 ? 4 : 0;
  const uncertaintyPenalty = basket.priceConfidence === "low" ? 3 : basket.priceConfidence === "medium" ? 1.5 : 0;
  const bannedTierPenalty =
    guideline && (textMatchesAnyTier(basket.gpu.name, guideline.gpuRules.bannedTier) || textMatchesAnyTier(basket.cpu.name, guideline.cpuRules.bannedTier ?? []))
      ? 14
      : 0;
  const floorPenalty =
    guideline &&
    !isWorkUseCase(basket.useCase) &&
    guideline.gpuRules.minimumTier.some(Boolean) &&
    !textMatchesAnyTier(basket.gpu.name, [
      ...guideline.gpuRules.minimumTier,
      ...guideline.gpuRules.preferredTier,
      ...(guideline.gpuRules.acceptableTier ?? []),
    ])
      ? 10
      : 0;
  const risk =
    basket.gpu.riskPenalty * 0.8 +
    basket.cpu.riskPenalty * 0.35 +
    budgetPenalty +
    usedMarketPenalty +
    olderHighEndPenalty +
    uncertaintyPenalty +
    bannedTierPenalty +
    floorPenalty;
  return clamp(risk, 0, 30);
}

function buildReasons(basket: BuildBasket, breakdown: BasketScoreBreakdown, budget: number, guideline?: BudgetGuideline | null) {
  const workUseCase = isWorkUseCase(basket.useCase);

  const reasons = workUseCase
    ? [
        `CPU, RAM i SSD trzymają tutaj sensowniejszy profil pod pracę niż przypadkowe przepalanie kasy na GPU (${Math.round(breakdown.cpuAdequacy)}/100 i ${Math.round(breakdown.memoryStorage)}/100).`,
        basket.gpu.integrated
          ? `Workflow nie wymusza tu dedykowanego GPU, więc lepiej było dopiąć szybszą i spokojniejszą platformę (${Math.round(breakdown.platformQuality)}/100).`
          : `Dedykowane GPU ma tu sens tylko jako narzędzie workflow, a nie gamingowy odruch (${Math.round(breakdown.gpuValue)}/100).`,
      ]
    : [
        `GPU trzyma sensowny poziom fps za pieniądze i nie wygląda staro na starcie (${Math.round(breakdown.gpuValue)}/100).`,
        `CPU nie robi tu głupiego bottlenecka i nie zjada połowy budżetu (${Math.round(breakdown.cpuAdequacy)}/100).`,
        `Koszyk ma sensowne minimum na RAM, SSD i zasilacz (${Math.round(breakdown.memoryStorage)}/100 oraz ${Math.round(breakdown.platformQuality)}/100).`,
      ];

  if (guideline?.budgetSplitNote) {
    reasons.push(guideline.budgetSplitNote);
  }

  if (basket.estimatedTotal > budget) {
    reasons.push("Ten koszyk lekko wychodzi ponad target i trzeba pilnować ulicznych cen.");
  }

  if (!basket.gpu.integrated && basket.gpu.marketMode === "used") {
    reasons.push("Używana karta daje świetny value, ale wymaga rozsądnego sprawdzenia stanu przed zakupem.");
  }

  return reasons;
}

export function scoreBaskets(input: {
  baskets: BuildBasket[];
  priceSnapshots: ComponentPriceSnapshot[];
  budget: number;
  guideline?: BudgetGuideline | null;
}) {
  return input.baskets
    .map((basket) => {
      const workUseCase = isWorkUseCase(basket.useCase);
      const gpuValue = scoreGpuValue(basket, input.priceSnapshots);
      const cpuAdequacy = scoreCpuAdequacy(basket);
      const memoryStorage = scoreMemoryStorage(basket, input.guideline);
      const platformQuality = scorePlatformQuality(basket, input.priceSnapshots, input.guideline);
      const upgradePath = scoreUpgradePath(basket);
      const riskPenalty = scoreRiskPenalty(basket, input.budget, input.guideline);
      const total = clamp(
        workUseCase
          ? gpuValue * 0.12 + cpuAdequacy * 0.34 + memoryStorage * 0.24 + platformQuality * 0.16 + upgradePath * 0.14 - riskPenalty * 0.06
          : gpuValue * 0.45 + cpuAdequacy * 0.2 + memoryStorage * 0.1 + platformQuality * 0.1 + upgradePath * 0.1 - riskPenalty * 0.05,
        0,
        100,
      );
      const breakdown: BasketScoreBreakdown = {
        gpuValue: Math.round(gpuValue),
        cpuAdequacy: Math.round(cpuAdequacy),
        memoryStorage: Math.round(memoryStorage),
        platformQuality: Math.round(platformQuality),
        upgradePath: Math.round(upgradePath),
        riskPenalty: Math.round(riskPenalty),
        total: Math.round(total),
      };

      return {
        ...basket,
        score: Math.round(total),
        breakdown,
        reasons: buildReasons(basket, breakdown, input.budget, input.guideline),
      } satisfies ScoredBuildBasket;
    })
    .sort((left, right) => right.score - left.score || left.estimatedTotal - right.estimatedTotal);
}
