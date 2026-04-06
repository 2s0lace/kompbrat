import type { BuildBasket, BuilderGpuCandidate } from "@/lib/builder/types";
import type { BudgetGuideline, BuildCategory } from "@/lib/value-guidelines";
import { textMatchesAnyTier } from "@/lib/value-guidelines";

const GPU_FLOOR_RULES = [
  {
    maxBudget: 2200,
    allowed: ["gtx 1660 super", "rtx 2060", "radeon rx 6600", "radeon rx 6600 xt"],
  },
  {
    minBudget: 2800,
    banned: ["gtx 1660", "gtx 1660 super", "rtx 2060", "rtx 3050"],
  },
  {
    minBudget: 4000,
    banned: ["rtx 4060", "rtx 3060", "arc b570"],
  },
];

function normalize(text: string) {
  return text.toLowerCase();
}

function isWorkCategory(category?: BuildCategory, useCase?: string) {
  return category === "work" || /praca|nauka|montaż|montaz|programowanie|office|excel|photoshop|video|premiere|blender|render|cad/i.test(useCase ?? "");
}

function getEstimatedRamGb(basket: BuildBasket) {
  const ram = basket.parts.find((part) => part.componentType === "ram")?.name ?? "";
  const match = ram.match(/(\d+)\s?GB/i);
  return match ? Number(match[1]) : 0;
}

function getEstimatedStorageGb(basket: BuildBasket) {
  const storage = basket.parts.find((part) => part.componentType === "storage")?.name ?? "";
  const tbMatch = storage.match(/(\d+)\s?TB/i);
  if (tbMatch) {
    return Number(tbMatch[1]) * 1000;
  }

  const gbMatch = storage.match(/(\d+)\s?GB/i);
  return gbMatch ? Number(gbMatch[1]) : 0;
}

function getEstimatedPsuWattage(basket: BuildBasket) {
  const psu = basket.parts.find((part) => part.componentType === "psu")?.name ?? "";
  const match = psu.match(/(\d+)\s?W/i);
  return match ? Number(match[1]) : 0;
}

export function isGpuHardBanned(gpu: BuilderGpuCandidate, budget: number, guideline?: BudgetGuideline | null, category?: BuildCategory) {
  const name = normalize(gpu.name);

  if (isWorkCategory(category) && gpu.integrated) {
    return false;
  }

  if (guideline && textMatchesAnyTier(gpu.name, guideline.gpuRules.bannedTier)) {
    return true;
  }

  return GPU_FLOOR_RULES.some((rule) => {
    if (typeof rule.minBudget === "number" && budget < rule.minBudget) {
      return false;
    }

    if (typeof rule.maxBudget === "number" && budget > rule.maxBudget) {
      return false;
    }

    return (rule.banned ?? []).some((entry) => name.includes(entry));
  });
}

export function gpuMeetsFloor(gpu: BuilderGpuCandidate, budget: number, guideline?: BudgetGuideline | null, category?: BuildCategory) {
  const name = normalize(gpu.name);

  if (isWorkCategory(category)) {
    return true;
  }

  if (guideline?.gpuRules.minimumTier.some(Boolean)) {
    return (
      textMatchesAnyTier(gpu.name, guideline.gpuRules.minimumTier) ||
      textMatchesAnyTier(gpu.name, guideline.gpuRules.preferredTier) ||
      textMatchesAnyTier(gpu.name, guideline.gpuRules.acceptableTier ?? [])
    );
  }

  const floorRule = GPU_FLOOR_RULES.find((rule) => typeof rule.maxBudget === "number" && budget <= rule.maxBudget && rule.allowed);

  if (!floorRule?.allowed) {
    return true;
  }

  return floorRule.allowed.some((entry) => name.includes(entry));
}

export function getBasketSanityWarnings(basket: BuildBasket, budget: number, guideline?: BudgetGuideline | null, category?: BuildCategory) {
  const warnings: string[] = [];
  const ramGb = getEstimatedRamGb(basket);
  const storageGb = getEstimatedStorageGb(basket);
  const psuWattage = getEstimatedPsuWattage(basket);
  const ramFloor = budget < 4000 ? 16 : (guideline?.minimumStandards.ramGb ?? 16);
  const storageFloor = budget < 2200 ? 500 : budget < 4000 ? 500 : (guideline?.minimumStandards.storageGb ?? 1000);
  const workCategory = isWorkCategory(category, basket.useCase);

  if (ramFloor > 0 && ramGb < ramFloor) {
    warnings.push(`Za ten budżet ${ramFloor} GB RAM to sensowne minimum.`);
  }

  if (storageFloor > 0 && storageGb < storageFloor) {
    warnings.push(
      budget < 4000
        ? `${storageFloor >= 1000 ? `${Math.round(storageFloor / 1000)} TB` : `${storageFloor} GB`} SSD to tutaj bardziej normalne minimum niż luksus, więc mniejszy dysk traktuj jako świadomy kompromis.`
        : `Przy tym budżecie nie schodziłbym poniżej ${storageFloor >= 1000 ? `${Math.round(storageFloor / 1000)} TB` : `${storageFloor} GB`} SSD.`,
    );
  }

  if (!basket.gpu.integrated && basket.gpu.powerDrawWatts >= 300 && psuWattage < 750) {
    warnings.push("Ta karta zasługuje na lepszy zasilacz, minimum sensowne 750 W.");
  }

  if (guideline?.minimumStandards.psuNote) {
    warnings.push(guideline.minimumStandards.psuNote);
  }

  if (!basket.gpu.integrated && basket.gpu.marketMode === "used") {
    warnings.push("Używane GPU trzeba sprawdzić pod kątem temperatur, kultury pracy i historii kopania.");
  }

  if (workCategory && !basket.gpu.integrated && !/blender|render|3d|video|premiere|davinci|after effects|stable diffusion|ai|cad|cuda|gpu/i.test(basket.useCase)) {
    warnings.push("W tym use case dedykowane GPU ma sens tylko wtedy, gdy naprawdę wykorzystasz je w workflow.");
  }

  return warnings;
}

export function isBasketSane(basket: BuildBasket, budget: number, guideline?: BudgetGuideline | null, category?: BuildCategory) {
  const workCategory = isWorkCategory(category, basket.useCase);

  if (isGpuHardBanned(basket.gpu, budget, guideline, workCategory ? "work" : "gaming")) {
    return false;
  }

  if (!workCategory && budget >= 4000 && (budget >= 3000 || guideline) && !gpuMeetsFloor(basket.gpu, budget, guideline, "gaming")) {
    return false;
  }

  if (budget >= 4000 || (guideline && budget >= 4000)) {
    const storageGb = getEstimatedStorageGb(basket);
    const ramGb = getEstimatedRamGb(basket);
    const minStorage = guideline?.minimumStandards.storageGb ?? 1000;
    const minRam = guideline?.minimumStandards.ramGb ?? 16;

    if (storageGb < minStorage || ramGb < minRam) {
      return false;
    }
  }

  if (!workCategory) {
    const storageGb = getEstimatedStorageGb(basket);
    const ramGb = getEstimatedRamGb(basket);

    if (ramGb > 0 && ramGb < 16 && budget >= 1800) {
      return false;
    }

    if (storageGb > 0 && storageGb < 500 && budget >= 1800) {
      return false;
    }
  }

  return true;
}
