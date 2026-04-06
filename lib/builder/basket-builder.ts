import type { BuildBasket, BuilderCandidatePool, BuilderCpuCandidate, BuilderGpuCandidate, BuilderPartEstimate, ComponentPriceSnapshot, PriceConfidence } from "@/lib/builder/types";
import { getBasketSanityWarnings, isBasketSane } from "@/lib/builder/sanity-rules";
import { getSnapshotPrice } from "@/lib/builder/price-aggregation";

function isWorkUseCase(useCase: string) {
  return /praca|nauka|montaż|montaz|programowanie|office|excel|photoshop|video|premiere|blender|render|cad/i.test(useCase);
}

function needsDedicatedGpuForWork(useCase: string) {
  return /blender|render|3d|video|premiere|davinci|after effects|stable diffusion|ai|cad|cuda|gpu/i.test(useCase);
}

function isCpuGpuPairViable(cpu: BuilderCpuCandidate, gpu: BuilderGpuCandidate, budget: number, useCase: string, category = "gaming") {
  const workUseCase = category === "work" || isWorkUseCase(useCase);

  if (gpu.integrated && !cpu.hasIntegratedGpu) {
    return false;
  }

  if (!workUseCase && gpu.integrated) {
    return false;
  }

  if (cpu.platform === "am5" && budget < 2900 && !cpu.hasIntegratedGpu) {
    return false;
  }

  if (workUseCase && gpu.integrated) {
    return cpu.productivityScore >= 56;
  }

  const cpuScore = workUseCase ? Math.max(cpu.productivityScore, cpu.gamingScore * 0.85) : Math.max(cpu.gamingScore, cpu.productivityScore * 0.9);
  const allowedGap = workUseCase ? 24 : 18;
  const gap = gpu.performanceScore - cpuScore;

  if (gap > allowedGap) {
    return false;
  }

  if (cpu.fallbackPrice > budget * (workUseCase ? 0.4 : 0.38)) {
    return false;
  }

  return true;
}

function getPlatformMotherboard(cpu: BuilderCpuCandidate, budget: number, marketMode: "new" | "used" | "mixed") {
  if (cpu.platform === "am4") {
    if (budget < 2600) {
      return { key: "b450-board", name: "B450", fallbackPrice: marketMode === "new" ? 320 : 180 };
    }

    return { key: "b550-board", name: "B550", fallbackPrice: marketMode === "new" ? 430 : 260 };
  }

  if (cpu.platform === "am5") {
    if (budget < 3700) {
      return { key: "a620-board", name: "A620", fallbackPrice: marketMode === "new" ? 390 : 320 };
    }

    return { key: "b650-board", name: "B650", fallbackPrice: 620 };
  }

  if (budget < 2800) {
    return { key: "h610-board", name: "H610", fallbackPrice: marketMode === "new" ? 330 : 220 };
  }

  return { key: "b760-board", name: "B760", fallbackPrice: marketMode === "new" ? 520 : 340 };
}

function getRamChoice(cpu: BuilderCpuCandidate, budget: number, useCase: string, category = "gaming", marketMode: "new" | "used" | "mixed" = "new") {
  const workUseCase = category === "work" || isWorkUseCase(useCase);
  const heavyWork = workUseCase && /video|premiere|blender|render|after effects|cad|vm|docker|android/i.test(useCase);

  if (cpu.platform === "am5") {
    if (budget >= 6500 || heavyWork) {
      return { key: "ram-32-ddr5", name: "32 GB DDR5 6000", fallbackPrice: 420 };
    }

    return { key: "ram-16-ddr5", name: "16 GB DDR5 6000", fallbackPrice: 260 };
  }

  if (budget >= 4500 || heavyWork) {
    return { key: "ram-32-ddr4", name: "32 GB DDR4 3600", fallbackPrice: marketMode === "new" ? 290 : 220 };
  }

  return { key: "ram-16-ddr4", name: "16 GB DDR4 3600", fallbackPrice: marketMode === "new" ? 170 : 120 };
}

function getStorageChoice(budget: number, useCase: string, category = "gaming", marketMode: "new" | "used" | "mixed" = "new") {
  const workUseCase = category === "work" || isWorkUseCase(useCase);
  const heavyWork = workUseCase && /video|premiere|blender|render|after effects|cad|vm|docker|android/i.test(useCase);

  if (budget >= 5500 || heavyWork) {
    return { key: "ssd-2tb-gen4", name: "2 TB NVMe Gen4", fallbackPrice: 430 };
  }

  if (budget < 1900) {
    return { key: "ssd-500-sata", name: "500 GB SSD", fallbackPrice: marketMode === "new" ? 130 : 80 };
  }

  if (budget < 2600) {
    return { key: "ssd-500-nvme", name: "500 GB NVMe", fallbackPrice: marketMode === "new" ? 170 : 110 };
  }

  return { key: "ssd-1tb-gen4", name: "1 TB NVMe Gen4", fallbackPrice: marketMode === "new" ? 260 : 180 };
}

function getPsuChoice(gpu: BuilderGpuCandidate, marketMode: "new" | "used" | "mixed") {
  if (gpu.integrated) {
    return { key: "psu-550-bronze", name: "550 W 80+ Bronze", fallbackPrice: marketMode === "new" ? 220 : 140 };
  }

  if (gpu.powerDrawWatts >= 280) {
    return { key: "psu-750-gold", name: "750 W 80+ Gold", fallbackPrice: marketMode === "new" ? 420 : 280 };
  }

  if (gpu.powerDrawWatts <= 180) {
    return { key: "psu-550-bronze", name: "550 W 80+ Bronze", fallbackPrice: marketMode === "new" ? 220 : 140 };
  }

  return { key: "psu-650-bronze", name: "650 W 80+ Bronze", fallbackPrice: marketMode === "new" ? 260 : 180 };
}

function getCaseChoice(useCase: string, category = "gaming", budget = 3500, marketMode: "new" | "used" | "mixed" = "new") {
  const workUseCase = category === "work" || isWorkUseCase(useCase);

  if (workUseCase) {
    if (budget < 2600) {
      return { key: "case-basic", name: "Prosta obudowa ATX", fallbackPrice: marketMode === "new" ? 170 : 100 };
    }

    return { key: "case-quiet", name: "Cicha obudowa ATX", fallbackPrice: marketMode === "new" ? 280 : 170 };
  }

  if (budget < 2600) {
    return { key: "case-basic-airflow", name: "Podstawowa obudowa z airflow", fallbackPrice: marketMode === "new" ? 160 : 100 };
  }

  return { key: "case-airflow", name: "Przewiewna obudowa ATX", fallbackPrice: marketMode === "new" ? 240 : 140 };
}

function toConfidence(confidences: PriceConfidence[]): PriceConfidence {
  if (confidences.every((entry) => entry === "high")) {
    return "high";
  }

  if (confidences.some((entry) => entry === "medium" || entry === "high")) {
    return "medium";
  }

  return "low";
}

function buildPartEstimate(
  type: string,
  key: string,
  name: string,
  componentType: BuilderPartEstimate["componentType"],
  estimatedPrice: number,
  condition?: BuilderPartEstimate["condition"],
) {
  return {
    key,
    type,
    name,
    condition,
    estimatedPrice,
    componentType,
  } satisfies BuilderPartEstimate;
}

function buildBasketNotes(cpu: BuilderCpuCandidate, gpu: BuilderGpuCandidate, useCase: string, category = "gaming") {
  const workUseCase = category === "work" || isWorkUseCase(useCase);

  if (workUseCase) {
    return [
      gpu.integrated
        ? "Tu liczy się szybki CPU, RAM i SSD, a dokładanie dedykowanego GPU nie daje sensownego zwrotu bez konkretnego workflow."
        : "Dedykowane GPU ma tu sens tylko dlatego, że workflow realnie może z niego skorzystać.",
      cpu.platform === "am5"
        ? "AM5 daje lepszy upgrade path na przyszłość, ale dalej pilnujemy, żeby nie przepalić budżetu na samą platformę."
        : "Ta platforma jest value-first i nie udaje, że starsza baza jest równie rozwojowa jak AM5.",
    ];
  }

  return [
    gpu.marketMode === "used"
      ? "Mocna używana karta daje tu wyraźnie lepszy fps za złotówkę niż bezpieczny full-new odpowiednik."
      : "To jest zestaw oparty o świeższe części i sensowny balans wydajności, ceny i spokoju na starcie.",
    cpu.platform === "am5"
      ? "AM5 zostawia najlepszy upgrade path, ale tylko dlatego ma tu sens, że nie rozwaliła klasy GPU."
      : "Platforma jest budżetowo uczciwa i nie przepala kasy na płytę albo RAM kosztem karty.",
  ];
}

export function buildCandidateBaskets(input: {
  pool: BuilderCandidatePool;
  priceSnapshots: ComponentPriceSnapshot[];
}) {
  const { pool, priceSnapshots } = input;
  const baskets: BuildBasket[] = [];
  const category = pool.category ?? (isWorkUseCase(pool.useCase) ? "work" : "gaming");

  for (const gpu of pool.gpus) {
    for (const cpu of pool.cpus) {
      if (!isCpuGpuPairViable(cpu, gpu, pool.targetBudget, pool.useCase, category)) {
        continue;
      }

      const supportMarketMode = pool.marketMode === "mixed" && pool.targetBudget <= 2200 ? "used" : pool.marketMode;
      const board = getPlatformMotherboard(cpu, pool.targetBudget, supportMarketMode);
      const ram = getRamChoice(cpu, pool.targetBudget, pool.useCase, category, supportMarketMode);
      const storage = getStorageChoice(pool.targetBudget, pool.useCase, category, supportMarketMode);
      const psu = getPsuChoice(gpu, supportMarketMode);
      const pcCase = getCaseChoice(pool.useCase, category, pool.targetBudget, supportMarketMode);
      const defaultCondition = pool.marketMode === "used" ? "used" : "new";
      const mixedGpuCondition = gpu.marketMode === "used" ? "used" : "new";
      const supportCondition = pool.marketMode === "used" ? "used" : supportMarketMode === "used" ? "used" : "new";
      const parts = [
        buildPartEstimate("CPU", cpu.id, cpu.name, "cpu", getSnapshotPrice(priceSnapshots, cpu.id, cpu.fallbackPrice), defaultCondition),
        buildPartEstimate(
          "GPU",
          gpu.id,
          gpu.name,
          "gpu",
          getSnapshotPrice(priceSnapshots, gpu.id, gpu.fallbackPrice),
          pool.marketMode === "mixed" ? mixedGpuCondition : defaultCondition,
        ),
        buildPartEstimate(
          "MOTHERBOARD",
          board.key,
          board.name,
          "motherboard",
          getSnapshotPrice(priceSnapshots, board.key, board.fallbackPrice),
          supportCondition,
        ),
        buildPartEstimate("RAM", ram.key, ram.name, "ram", getSnapshotPrice(priceSnapshots, ram.key, ram.fallbackPrice), supportCondition),
        buildPartEstimate(
          "STORAGE",
          storage.key,
          storage.name,
          "storage",
          getSnapshotPrice(priceSnapshots, storage.key, storage.fallbackPrice),
          supportCondition,
        ),
        buildPartEstimate("PSU", psu.key, psu.name, "psu", getSnapshotPrice(priceSnapshots, psu.key, psu.fallbackPrice), supportCondition),
        buildPartEstimate("CASE", pcCase.key, pcCase.name, "case", getSnapshotPrice(priceSnapshots, pcCase.key, pcCase.fallbackPrice), supportCondition),
      ];
      const estimatedTotal = parts.reduce((sum, part) => sum + part.estimatedPrice, 0);
      const snapshotConfidences = parts.map((part) => priceSnapshots.find((entry) => entry.key === part.key)?.confidence ?? "low");
      const notes = buildBasketNotes(cpu, gpu, pool.useCase, category);
      const warnings = getBasketSanityWarnings(
        {
          id: `${gpu.id}-${cpu.id}`,
          title: `${gpu.name} + ${cpu.name}`,
          marketMode: pool.marketMode,
          useCase: pool.useCase,
          gpu,
          cpu,
          parts,
          estimatedTotal,
          notes,
          warnings: [],
          priceConfidence: toConfidence(snapshotConfidences),
        },
        pool.targetBudget,
        pool.guideline,
        category,
      );

      const basket: BuildBasket = {
        id: `${gpu.id}-${cpu.id}`,
        title: `${gpu.name} + ${cpu.name}`,
        marketMode: pool.marketMode,
        useCase: pool.useCase,
        gpu,
        cpu,
        parts,
        estimatedTotal,
        notes,
        warnings,
        priceConfidence: toConfidence(snapshotConfidences),
      };

      if (isBasketSane(basket, pool.targetBudget, pool.guideline, category)) {
        baskets.push(basket);
      }
    }
  }

  const filtered = baskets.filter((basket) => basket.estimatedTotal <= pool.targetBudget * 1.12);
  const finalBaskets = filtered.length > 0 ? filtered : baskets.sort((left, right) => left.estimatedTotal - right.estimatedTotal).slice(0, 8);

  return finalBaskets.slice(0, 12);
}
