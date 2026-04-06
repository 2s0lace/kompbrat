import type { BuilderCandidatePool, BuilderCpuCandidate, BuilderGpuCandidate, BuilderMarketMode, MarketQueryDefinition } from "@/lib/builder/types";
import { isGpuHardBanned } from "@/lib/builder/sanity-rules";
import type { BudgetGuideline, BuildCategory } from "@/lib/value-guidelines";
import { textMatchesAnyTier } from "@/lib/value-guidelines";

function isWorkUseCase(useCase: string) {
  return /praca|nauka|montaż|montaz|programowanie|office|excel|photoshop|video|premiere|blender|render|cad/i.test(useCase);
}

function needsDedicatedGpuForWork(useCase: string) {
  return /blender|render|3d|video|premiere|davinci|after effects|stable diffusion|ai|cad|cuda|gpu/i.test(useCase);
}

const GPU_CANDIDATES: BuilderGpuCandidate[] = [
  {
    kind: "gpu",
    id: "igpu-work",
    name: "Zintegrowana grafika",
    marketMode: "new",
    integrated: true,
    minBudget: 1000,
    maxBudget: 6500,
    fallbackPrice: 0,
    performanceScore: 12,
    valueScore: 92,
    riskPenalty: 3,
    powerDrawWatts: 35,
    priority: 28,
    useCaseTags: ["work", "office", "quiet"],
  },
  {
    kind: "gpu",
    id: "gtx-1060-6gb-used",
    name: "GeForce GTX 1060 6 GB",
    marketMode: "used",
    minBudget: 800,
    maxBudget: 1300,
    fallbackPrice: 250,
    performanceScore: 30,
    valueScore: 42,
    riskPenalty: 24,
    powerDrawWatts: 120,
    vramGb: 6,
    priority: 14,
    useCaseTags: ["gaming", "budget", "entry"],
  },
  {
    kind: "gpu",
    id: "rx-580-8gb-used",
    name: "Radeon RX 580 8 GB",
    marketMode: "used",
    minBudget: 800,
    maxBudget: 1200,
    fallbackPrice: 220,
    performanceScore: 28,
    valueScore: 40,
    riskPenalty: 24,
    powerDrawWatts: 185,
    vramGb: 8,
    priority: 12,
    useCaseTags: ["gaming", "budget", "entry"],
  },
  {
    kind: "gpu",
    id: "gtx-1660-super-used",
    name: "GeForce GTX 1660 Super 6 GB",
    marketMode: "used",
    minBudget: 1000,
    maxBudget: 1700,
    fallbackPrice: 650,
    performanceScore: 40,
    valueScore: 48,
    riskPenalty: 22,
    powerDrawWatts: 125,
    vramGb: 6,
    priority: 28,
    useCaseTags: ["gaming", "budget"],
  },
  {
    kind: "gpu",
    id: "rtx-2060-used",
    name: "GeForce RTX 2060 6 GB",
    marketMode: "used",
    minBudget: 1300,
    maxBudget: 1900,
    fallbackPrice: 780,
    performanceScore: 46,
    valueScore: 53,
    riskPenalty: 20,
    powerDrawWatts: 160,
    vramGb: 6,
    priority: 34,
    useCaseTags: ["gaming", "budget"],
  },
  {
    kind: "gpu",
    id: "rx-6600-new",
    name: "Radeon RX 6600 8 GB",
    marketMode: "new",
    minBudget: 1500,
    maxBudget: 2200,
    fallbackPrice: 980,
    performanceScore: 50,
    valueScore: 66,
    riskPenalty: 8,
    powerDrawWatts: 132,
    vramGb: 8,
    priority: 40,
    useCaseTags: ["gaming", "budget", "1080p"],
  },
  {
    kind: "gpu",
    id: "rx-6600-xt-used",
    name: "Radeon RX 6600 XT 8 GB",
    marketMode: "used",
    minBudget: 1600,
    maxBudget: 2400,
    fallbackPrice: 980,
    performanceScore: 56,
    valueScore: 68,
    riskPenalty: 16,
    powerDrawWatts: 160,
    vramGb: 8,
    priority: 42,
    useCaseTags: ["gaming", "1080p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rtx-3060-used",
    name: "GeForce RTX 3060 12 GB",
    marketMode: "used",
    minBudget: 1800,
    maxBudget: 2500,
    fallbackPrice: 1050,
    performanceScore: 58,
    valueScore: 65,
    riskPenalty: 16,
    powerDrawWatts: 170,
    vramGb: 12,
    priority: 43,
    useCaseTags: ["gaming", "1080p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rx-6700-xt-used",
    name: "Radeon RX 6700 XT 12 GB",
    marketMode: "used",
    minBudget: 2200,
    maxBudget: 3000,
    fallbackPrice: 1280,
    performanceScore: 68,
    valueScore: 78,
    riskPenalty: 16,
    powerDrawWatts: 230,
    vramGb: 12,
    priority: 49,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rtx-3060-ti-used",
    name: "GeForce RTX 3060 Ti 8 GB",
    marketMode: "used",
    minBudget: 2200,
    maxBudget: 3000,
    fallbackPrice: 1320,
    performanceScore: 67,
    valueScore: 74,
    riskPenalty: 16,
    powerDrawWatts: 200,
    vramGb: 8,
    priority: 47,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "arc-b570-new",
    name: "Intel Arc B570 10 GB",
    marketMode: "new",
    minBudget: 2500,
    maxBudget: 3400,
    fallbackPrice: 1280,
    performanceScore: 62,
    valueScore: 74,
    riskPenalty: 10,
    powerDrawWatts: 180,
    vramGb: 10,
    priority: 50,
    useCaseTags: ["gaming", "value", "1080p"],
  },
  {
    kind: "gpu",
    id: "arc-b580-12gb-new",
    name: "Intel Arc B580 12 GB",
    marketMode: "new",
    minBudget: 2700,
    maxBudget: 3900,
    fallbackPrice: 1490,
    performanceScore: 69,
    valueScore: 80,
    riskPenalty: 10,
    powerDrawWatts: 190,
    vramGb: 12,
    priority: 58,
    useCaseTags: ["gaming", "value", "1440p", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-5060-8gb-new",
    name: "GeForce RTX 5060 8 GB",
    marketMode: "new",
    minBudget: 2800,
    maxBudget: 3900,
    fallbackPrice: 1590,
    performanceScore: 73,
    valueScore: 74,
    riskPenalty: 8,
    powerDrawWatts: 170,
    vramGb: 8,
    priority: 56,
    useCaseTags: ["gaming", "1080p", "1440p"],
  },
  {
    kind: "gpu",
    id: "rtx-3080-used",
    name: "GeForce RTX 3080 10 GB",
    marketMode: "used",
    minBudget: 2800,
    maxBudget: 4200,
    fallbackPrice: 1600,
    performanceScore: 84,
    valueScore: 84,
    riskPenalty: 19,
    powerDrawWatts: 320,
    vramGb: 10,
    priority: 66,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rx-6750-xt-used",
    name: "Radeon RX 6750 XT 12 GB",
    marketMode: "used",
    minBudget: 2500,
    maxBudget: 3600,
    fallbackPrice: 1280,
    performanceScore: 72,
    valueScore: 79,
    riskPenalty: 16,
    powerDrawWatts: 250,
    vramGb: 12,
    priority: 52,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rx-7700-xt-used",
    name: "Radeon RX 7700 XT 12 GB",
    marketMode: "used",
    minBudget: 3000,
    maxBudget: 4300,
    fallbackPrice: 1680,
    performanceScore: 81,
    valueScore: 79,
    riskPenalty: 16,
    powerDrawWatts: 245,
    vramGb: 12,
    priority: 60,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rx-6800-xt-used",
    name: "Radeon RX 6800 XT 16 GB",
    marketMode: "used",
    minBudget: 3000,
    maxBudget: 4500,
    fallbackPrice: 1720,
    performanceScore: 86,
    valueScore: 84,
    riskPenalty: 17,
    powerDrawWatts: 300,
    vramGb: 16,
    priority: 67,
    useCaseTags: ["gaming", "1440p", "used-value"],
  },
  {
    kind: "gpu",
    id: "rx-9060-xt-8gb-new",
    name: "Radeon RX 9060 XT 8 GB",
    marketMode: "new",
    minBudget: 3200,
    maxBudget: 4300,
    fallbackPrice: 1690,
    performanceScore: 75,
    valueScore: 75,
    riskPenalty: 8,
    powerDrawWatts: 182,
    vramGb: 8,
    priority: 57,
    useCaseTags: ["gaming", "1080p", "1440p"],
  },
  {
    kind: "gpu",
    id: "rx-9060-xt-16gb-new",
    name: "Radeon RX 9060 XT 16 GB",
    marketMode: "new",
    minBudget: 3400,
    maxBudget: 5000,
    fallbackPrice: 1990,
    performanceScore: 81,
    valueScore: 80,
    riskPenalty: 8,
    powerDrawWatts: 190,
    vramGb: 16,
    priority: 61,
    useCaseTags: ["gaming", "1440p", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-5060-ti-8gb-new",
    name: "GeForce RTX 5060 Ti 8 GB",
    marketMode: "new",
    minBudget: 3500,
    maxBudget: 4700,
    fallbackPrice: 1890,
    performanceScore: 79,
    valueScore: 77,
    riskPenalty: 8,
    powerDrawWatts: 180,
    vramGb: 8,
    priority: 59,
    useCaseTags: ["gaming", "1440p"],
  },
  {
    kind: "gpu",
    id: "rtx-5060-ti-16gb-new",
    name: "GeForce RTX 5060 Ti 16 GB",
    marketMode: "new",
    minBudget: 3800,
    maxBudget: 5200,
    fallbackPrice: 2150,
    performanceScore: 82,
    valueScore: 78,
    riskPenalty: 8,
    powerDrawWatts: 180,
    vramGb: 16,
    priority: 60,
    useCaseTags: ["gaming", "1440p", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-4070-super-used",
    name: "GeForce RTX 4070 Super 12 GB",
    marketMode: "used",
    minBudget: 3900,
    maxBudget: 5000,
    fallbackPrice: 2350,
    performanceScore: 92,
    valueScore: 82,
    riskPenalty: 18,
    powerDrawWatts: 220,
    vramGb: 12,
    priority: 68,
    useCaseTags: ["gaming", "1440p", "used-value", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-4070-ti-used",
    name: "GeForce RTX 4070 Ti 12 GB",
    marketMode: "used",
    minBudget: 4200,
    maxBudget: 5200,
    fallbackPrice: 2700,
    performanceScore: 96,
    valueScore: 78,
    riskPenalty: 19,
    powerDrawWatts: 285,
    vramGb: 12,
    priority: 69,
    useCaseTags: ["gaming", "1440p", "used-value", "creator"],
  },
  {
    kind: "gpu",
    id: "rx-7800-xt-used",
    name: "Radeon RX 7800 XT 16 GB",
    marketMode: "used",
    minBudget: 4200,
    maxBudget: 5200,
    fallbackPrice: 2400,
    performanceScore: 91,
    valueScore: 81,
    riskPenalty: 17,
    powerDrawWatts: 263,
    vramGb: 16,
    priority: 67,
    useCaseTags: ["gaming", "1440p", "used-value", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-5070-new",
    name: "GeForce RTX 5070 12 GB",
    marketMode: "new",
    minBudget: 4800,
    maxBudget: 7000,
    fallbackPrice: 2790,
    performanceScore: 95,
    valueScore: 83,
    riskPenalty: 8,
    powerDrawWatts: 250,
    vramGb: 12,
    priority: 70,
    useCaseTags: ["gaming", "1440p", "creator"],
  },
  {
    kind: "gpu",
    id: "rx-9070-new",
    name: "Radeon RX 9070 16 GB",
    marketMode: "new",
    minBudget: 4800,
    maxBudget: 7000,
    fallbackPrice: 2850,
    performanceScore: 96,
    valueScore: 84,
    riskPenalty: 8,
    powerDrawWatts: 255,
    vramGb: 16,
    priority: 71,
    useCaseTags: ["gaming", "1440p", "creator"],
  },
  {
    kind: "gpu",
    id: "rx-9070-xt-new",
    name: "Radeon RX 9070 XT 16 GB",
    marketMode: "new",
    minBudget: 6500,
    maxBudget: 8500,
    fallbackPrice: 3390,
    performanceScore: 100,
    valueScore: 82,
    riskPenalty: 8,
    powerDrawWatts: 304,
    vramGb: 16,
    priority: 73,
    useCaseTags: ["gaming", "1440p", "high-end", "creator"],
  },
  {
    kind: "gpu",
    id: "rtx-5070-ti-new",
    name: "GeForce RTX 5070 Ti 16 GB",
    marketMode: "new",
    minBudget: 7600,
    maxBudget: 9000,
    fallbackPrice: 3890,
    performanceScore: 103,
    valueScore: 80,
    riskPenalty: 8,
    powerDrawWatts: 300,
    vramGb: 16,
    priority: 74,
    useCaseTags: ["gaming", "1440p", "high-end", "creator"],
  },
];

const CPU_CANDIDATES: BuilderCpuCandidate[] = [
  {
    kind: "cpu",
    id: "ryzen-5-3600",
    name: "AMD Ryzen 5 3600",
    platform: "am4",
    minBudget: 900,
    maxBudget: 2000,
    fallbackPrice: 250,
    gamingScore: 58,
    productivityScore: 52,
    valueScore: 84,
    upgradeScore: 45,
    riskPenalty: 10,
    priority: 42,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-10400f",
    name: "Intel Core i5-10400F",
    platform: "lga1700",
    minBudget: 1000,
    maxBudget: 1900,
    fallbackPrice: 330,
    gamingScore: 57,
    productivityScore: 50,
    valueScore: 78,
    upgradeScore: 42,
    riskPenalty: 10,
    priority: 38,
  },
  {
    kind: "cpu",
    id: "ryzen-5-5600g",
    name: "AMD Ryzen 5 5600G",
    platform: "am4",
    hasIntegratedGpu: true,
    minBudget: 1600,
    maxBudget: 2800,
    fallbackPrice: 460,
    gamingScore: 56,
    productivityScore: 58,
    valueScore: 80,
    upgradeScore: 52,
    riskPenalty: 7,
    priority: 46,
  },
  {
    kind: "cpu",
    id: "ryzen-5-5600",
    name: "AMD Ryzen 5 5600",
    platform: "am4",
    minBudget: 1800,
    maxBudget: 3400,
    fallbackPrice: 420,
    gamingScore: 64,
    productivityScore: 58,
    valueScore: 82,
    upgradeScore: 52,
    riskPenalty: 8,
    priority: 48,
  },
  {
    kind: "cpu",
    id: "ryzen-5-5600x",
    name: "AMD Ryzen 5 5600X",
    platform: "am4",
    minBudget: 2200,
    maxBudget: 3800,
    fallbackPrice: 520,
    gamingScore: 68,
    productivityScore: 61,
    valueScore: 78,
    upgradeScore: 52,
    riskPenalty: 8,
    priority: 50,
  },
  {
    kind: "cpu",
    id: "ryzen-7-5700x",
    name: "AMD Ryzen 7 5700X",
    platform: "am4",
    minBudget: 2400,
    maxBudget: 4800,
    fallbackPrice: 650,
    gamingScore: 74,
    productivityScore: 76,
    valueScore: 80,
    upgradeScore: 55,
    riskPenalty: 8,
    priority: 55,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-12400",
    name: "Intel Core i5-12400",
    platform: "lga1700",
    hasIntegratedGpu: true,
    minBudget: 1800,
    maxBudget: 4200,
    fallbackPrice: 620,
    gamingScore: 70,
    productivityScore: 64,
    valueScore: 78,
    upgradeScore: 56,
    riskPenalty: 7,
    priority: 52,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-12400f",
    name: "Intel Core i5-12400F",
    platform: "lga1700",
    minBudget: 2000,
    maxBudget: 4200,
    fallbackPrice: 560,
    gamingScore: 69,
    productivityScore: 62,
    valueScore: 79,
    upgradeScore: 56,
    riskPenalty: 7,
    priority: 54,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-12600k",
    name: "Intel Core i5-12600K",
    platform: "lga1700",
    hasIntegratedGpu: true,
    minBudget: 3200,
    maxBudget: 5000,
    fallbackPrice: 990,
    gamingScore: 80,
    productivityScore: 78,
    valueScore: 72,
    upgradeScore: 58,
    riskPenalty: 7,
    priority: 52,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-13400f",
    name: "Intel Core i5-13400F",
    platform: "lga1700",
    minBudget: 3200,
    maxBudget: 5200,
    fallbackPrice: 860,
    gamingScore: 76,
    productivityScore: 73,
    valueScore: 70,
    upgradeScore: 58,
    riskPenalty: 7,
    priority: 51,
  },
  {
    kind: "cpu",
    id: "intel-core-i5-14400f",
    name: "Intel Core i5-14400F",
    platform: "lga1700",
    minBudget: 4200,
    maxBudget: 6500,
    fallbackPrice: 980,
    gamingScore: 79,
    productivityScore: 76,
    valueScore: 69,
    upgradeScore: 58,
    riskPenalty: 7,
    priority: 50,
  },
  {
    kind: "cpu",
    id: "ryzen-5-7500f",
    name: "AMD Ryzen 5 7500F",
    platform: "am5",
    minBudget: 3000,
    maxBudget: 6000,
    fallbackPrice: 720,
    gamingScore: 82,
    productivityScore: 70,
    valueScore: 84,
    upgradeScore: 84,
    riskPenalty: 6,
    priority: 60,
  },
  {
    kind: "cpu",
    id: "ryzen-5-7600",
    name: "AMD Ryzen 5 7600",
    platform: "am5",
    hasIntegratedGpu: true,
    minBudget: 4500,
    maxBudget: 7500,
    fallbackPrice: 980,
    gamingScore: 86,
    productivityScore: 74,
    valueScore: 77,
    upgradeScore: 86,
    riskPenalty: 6,
    priority: 58,
  },
  {
    kind: "cpu",
    id: "ryzen-5-8600g",
    name: "AMD Ryzen 5 8600G",
    platform: "am5",
    hasIntegratedGpu: true,
    minBudget: 1800,
    maxBudget: 3800,
    fallbackPrice: 780,
    gamingScore: 62,
    productivityScore: 72,
    valueScore: 76,
    upgradeScore: 80,
    riskPenalty: 6,
    priority: 56,
  },
  {
    kind: "cpu",
    id: "ryzen-7-7700",
    name: "AMD Ryzen 7 7700",
    platform: "am5",
    hasIntegratedGpu: true,
    minBudget: 3200,
    maxBudget: 8000,
    fallbackPrice: 1250,
    gamingScore: 88,
    productivityScore: 88,
    valueScore: 72,
    upgradeScore: 88,
    riskPenalty: 6,
    priority: 54,
  },
  {
    kind: "cpu",
    id: "ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    platform: "am5",
    hasIntegratedGpu: true,
    minBudget: 5800,
    maxBudget: 9000,
    fallbackPrice: 1750,
    gamingScore: 100,
    productivityScore: 80,
    valueScore: 60,
    upgradeScore: 88,
    riskPenalty: 6,
    priority: 48,
  },
  {
    kind: "cpu",
    id: "ryzen-7-9800x3d",
    name: "AMD Ryzen 7 9800X3D",
    platform: "am5",
    hasIntegratedGpu: true,
    minBudget: 7600,
    maxBudget: 10000,
    fallbackPrice: 2390,
    gamingScore: 104,
    productivityScore: 86,
    valueScore: 52,
    upgradeScore: 90,
    riskPenalty: 6,
    priority: 42,
  },
];

function scoreGpuCandidate(candidate: BuilderGpuCandidate, budget: number, useCase: string, category: BuildCategory, guideline?: BudgetGuideline | null) {
  const workUseCase = category === "work" || isWorkUseCase(useCase);
  const gpuHeavyWork = workUseCase && needsDedicatedGpuForWork(useCase);
  const budgetCenter = candidate.fallbackPrice + (workUseCase ? 1200 : 1350);
  const budgetDistance = Math.abs(budget - budgetCenter);
  const distancePenalty = Math.min(18, Math.round(budgetDistance / 180));
  const preferredBonus = guideline && textMatchesAnyTier(candidate.name, guideline.gpuRules.preferredTier) ? 14 : 0;
  const acceptableBonus = guideline && textMatchesAnyTier(candidate.name, guideline.gpuRules.acceptableTier ?? []) ? 7 : 0;
  const minimumBonus = guideline && textMatchesAnyTier(candidate.name, guideline.gpuRules.minimumTier) ? 8 : 0;
  const bannedPenalty = guideline && textMatchesAnyTier(candidate.name, guideline.gpuRules.bannedTier) ? 60 : 0;
  const popularGpuBonus = !candidate.integrated && /GeForce RTX|GeForce GTX|Radeon RX/i.test(candidate.name) ? 3 : 0;
  const arcValuePenalty = !workUseCase && /Intel Arc/i.test(candidate.name) ? 4 : 0;

  let workloadAdjustment = 0;

  if (workUseCase) {
    if (candidate.integrated) {
      workloadAdjustment += gpuHeavyWork ? -8 : 28;
    } else {
      workloadAdjustment += gpuHeavyWork ? 12 : Math.max(-18, -Math.round(candidate.fallbackPrice / 140));
    }
  } else if (candidate.integrated) {
    workloadAdjustment -= 60;
  } else {
    workloadAdjustment += candidate.useCaseTags.some((tag) => ["gaming", "1440p", "1080p"].includes(tag)) ? 6 : 0;
  }

  return (
    candidate.priority +
    preferredBonus +
    acceptableBonus +
    minimumBonus +
    popularGpuBonus +
    workloadAdjustment -
    bannedPenalty -
    distancePenalty -
    arcValuePenalty -
    candidate.riskPenalty * 0.25
  );
}

function scoreCpuCandidate(candidate: BuilderCpuCandidate, budget: number, useCase: string, category: BuildCategory, guideline?: BudgetGuideline | null) {
  const workUseCase = category === "work" || isWorkUseCase(useCase);
  const base = workUseCase ? candidate.productivityScore : candidate.gamingScore;
  const budgetDistance = Math.abs(budget - (candidate.fallbackPrice + (workUseCase ? 1500 : 1800)));
  const preferredBonus = guideline && textMatchesAnyTier(candidate.name, guideline.cpuRules.preferredTier) ? 10 : 0;
  const minimumBonus = guideline && textMatchesAnyTier(candidate.name, guideline.cpuRules.minimumTier) ? 6 : 0;
  const bannedPenalty = guideline && textMatchesAnyTier(candidate.name, guideline.cpuRules.bannedTier ?? []) ? 45 : 0;
  const integratedBonus = workUseCase && candidate.hasIntegratedGpu && !needsDedicatedGpuForWork(useCase) ? 10 : 0;
  const lowBudgetAffordabilityBonus = !workUseCase && budget <= 2200 ? Math.max(0, (600 - candidate.fallbackPrice) / 28) : 0;
  return (
    candidate.priority +
    preferredBonus +
    minimumBonus +
    integratedBonus +
    lowBudgetAffordabilityBonus +
    base * 0.08 -
    bannedPenalty -
    Math.min(16, Math.round(budgetDistance / 220))
  );
}

export function resolveMarketModeFromPrompt(prompt: string, explicitMode?: BuilderMarketMode, defaultMode: BuilderMarketMode = "new") {
  if (explicitMode) {
    return explicitMode;
  }

  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("mixed") ||
    normalized.includes("miesz") ||
    normalized.includes("używki albo nowe") ||
    normalized.includes("uzywki albo nowe") ||
    normalized.includes("maksymalna opłacalność") ||
    normalized.includes("najlepszy value")
  ) {
    return "mixed";
  }

  if (
    normalized.includes("używany") ||
    normalized.includes("uzywany") ||
    normalized.includes("olx") ||
    normalized.includes("allegro") ||
    normalized.includes("z drugiej ręki")
  ) {
    return "used";
  }

  return defaultMode;
}

export function getBuilderCandidatePool(input: {
  budget: number;
  useCase: string;
  marketMode: BuilderMarketMode;
  category?: BuildCategory;
  guideline?: BudgetGuideline | null;
}): BuilderCandidatePool {
  const { budget, useCase, marketMode, guideline } = input;
  const category = input.category ?? (isWorkUseCase(useCase) ? "work" : "gaming");
  const workUseCase = category === "work";

  const gpus = GPU_CANDIDATES.filter((candidate) => {
    if (candidate.integrated && !workUseCase) {
      return false;
    }

    if (marketMode === "new" && candidate.marketMode !== "new") {
      return false;
    }

    if (marketMode === "used" && candidate.marketMode !== "used") {
      return false;
    }

    if (candidate.minBudget > budget + 450) {
      return false;
    }

    if (typeof candidate.maxBudget === "number" && candidate.maxBudget < budget - 500) {
      return false;
    }

    if (isGpuHardBanned(candidate, budget, guideline, category)) {
      return false;
    }

    if (guideline && textMatchesAnyTier(candidate.name, guideline.gpuRules.bannedTier)) {
      return false;
    }

    return true;
  })
    .sort((left, right) => scoreGpuCandidate(right, budget, useCase, category, guideline) - scoreGpuCandidate(left, budget, useCase, category, guideline))
    .slice(0, workUseCase ? 5 : budget <= 2200 ? 10 : 7);

  const cpus = CPU_CANDIDATES.filter((candidate) => {
    if (candidate.minBudget > budget + 600) {
      return false;
    }

    if (typeof candidate.maxBudget === "number" && candidate.maxBudget < budget - 600) {
      return false;
    }

    if (guideline && textMatchesAnyTier(candidate.name, guideline.cpuRules.bannedTier ?? [])) {
      return false;
    }

    return true;
  })
    .sort((left, right) => scoreCpuCandidate(right, budget, useCase, category, guideline) - scoreCpuCandidate(left, budget, useCase, category, guideline))
    .slice(0, workUseCase ? 5 : budget <= 2200 ? 7 : 4);

  return {
    marketMode,
    targetBudget: budget,
    useCase,
    category,
    guideline,
    gpus,
    cpus,
  };
}

function gpuQuery(candidate: BuilderGpuCandidate) {
  if (candidate.integrated) {
    return "";
  }

  const modePrefix = candidate.marketMode === "used" ? "używana" : "nowa";
  return `${modePrefix} ${candidate.name} cena Polska`;
}

function cpuQuery(candidate: BuilderCpuCandidate) {
  return `${candidate.name} cena Polska`;
}

export function buildMarketQueryDefinitions(pool: BuilderCandidatePool): MarketQueryDefinition[] {
  const queries: MarketQueryDefinition[] = [];

  for (const gpu of pool.gpus.slice(0, 4)) {
    if (gpu.integrated) {
      continue;
    }

    queries.push({
      key: gpu.id,
      label: gpu.name,
      componentType: "gpu",
      query: gpuQuery(gpu),
      referencePrice: gpu.fallbackPrice,
    });
  }

  for (const cpu of pool.cpus.slice(0, 4)) {
    queries.push({
      key: cpu.id,
      label: cpu.name,
      componentType: "cpu",
      query: cpuQuery(cpu),
      referencePrice: cpu.fallbackPrice,
    });
  }

  const sharedQueries: MarketQueryDefinition[] = [
    {
      key: "ram-16-ddr4",
      label: "16 GB DDR4 3600",
      componentType: "ram",
      query: "16 GB DDR4 3600 cena Polska",
      referencePrice: 170,
    },
    {
      key: "ram-32-ddr4",
      label: "32 GB DDR4 3600",
      componentType: "ram",
      query: "32 GB DDR4 3600 cena Polska",
      referencePrice: 290,
    },
    {
      key: "ram-16-ddr5",
      label: "16 GB DDR5 6000",
      componentType: "ram",
      query: "16 GB DDR5 6000 cena Polska",
      referencePrice: 260,
    },
    {
      key: "ram-32-ddr5",
      label: "32 GB DDR5 6000",
      componentType: "ram",
      query: "32 GB DDR5 6000 cena Polska",
      referencePrice: 420,
    },
    {
      key: "ssd-1tb-gen4",
      label: "1 TB NVMe Gen4",
      componentType: "storage",
      query: "1 TB NVMe Gen4 cena Polska",
      referencePrice: 260,
    },
    {
      key: "ssd-2tb-gen4",
      label: "2 TB NVMe Gen4",
      componentType: "storage",
      query: "2 TB NVMe Gen4 cena Polska",
      referencePrice: 430,
    },
    {
      key: "b550-board",
      label: "B550 motherboard",
      componentType: "motherboard",
      query: "B550 motherboard cena Polska",
      referencePrice: 430,
    },
    {
      key: "a620-board",
      label: "A620 motherboard",
      componentType: "motherboard",
      query: "A620 motherboard cena Polska",
      referencePrice: 420,
    },
    {
      key: "b650-board",
      label: "B650 motherboard",
      componentType: "motherboard",
      query: "B650 motherboard cena Polska",
      referencePrice: 620,
    },
    {
      key: "b760-board",
      label: "B760 motherboard",
      componentType: "motherboard",
      query: "B760 motherboard cena Polska",
      referencePrice: 520,
    },
    {
      key: "psu-550-bronze",
      label: "550 W 80+ Bronze",
      componentType: "psu",
      query: "550 W 80+ Bronze cena Polska",
      referencePrice: 220,
    },
    {
      key: "psu-650-gold",
      label: "650 W 80+ Gold",
      componentType: "psu",
      query: "650 W 80+ Gold cena Polska",
      referencePrice: 320,
    },
    {
      key: "psu-750-gold",
      label: "750 W 80+ Gold",
      componentType: "psu",
      query: "750 W 80+ Gold cena Polska",
      referencePrice: 420,
    },
    {
      key: "case-airflow",
      label: "Przewiewna obudowa ATX",
      componentType: "case",
      query: "przewiewna obudowa ATX cena Polska",
      referencePrice: 240,
    },
    {
      key: "case-quiet",
      label: "Cicha obudowa ATX",
      componentType: "case",
      query: "cicha obudowa ATX cena Polska",
      referencePrice: 280,
    },
  ];

  return [...queries, ...sharedQueries];
}
