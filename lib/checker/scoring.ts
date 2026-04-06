import { findCatalogComponentByCanonical, findCatalogComponentById } from "@/lib/checker/component-catalog";
import { parseFromDescription, parseFromTitle } from "@/lib/checker/parse-offer";
import {
  BALANCE_PENALTIES,
  CASE_TIER_VALUES,
  CONFIDENCE_PENALTIES,
  COOLER_TIER_VALUES,
  FAIR_VALUE_RANGE_MARGIN,
  FALLBACK_CPU_VALUE_BY_TIER,
  FALLBACK_GPU_VALUE_BY_TIER,
  MOTHERBOARD_TIER_VALUES,
  PRICE_SCORE_STEPS,
  PSU_QUALITY_VALUES,
  RAM_VALUE_BY_SIZE,
  RISK_POINTS,
  SCORING_WEIGHTS,
  STORAGE_VALUE_BY_TYPE,
} from "@/lib/checker/scoring-config";
import type {
  CaseTier,
  CheckerHeuristics,
  DetectionConfidence,
  GpuValueCheck,
  ListingQuality,
  MarketValueEstimate,
  MotherboardTier,
  NormalizedOffer,
  OfferScoringResult,
  ParsedOffer,
  PsuAssessment,
  PsuQuality,
  RiskLabel,
  ScoreBreakdownItem,
  ProfitabilityLabel,
  CoolerTier,
} from "@/types/checker";

const KNOWN_PSU_BRANDS = [
  "corsair",
  "be quiet",
  "bequiet",
  "seasonic",
  "fsp",
  "chieftec",
  "xpg",
  "cooler master",
  "msi",
  "gigabyte",
  "thermaltake",
  "silverstone",
  "fractal",
  "antec",
  "silentiumpc",
  "endorfy",
  "xilence",
  "evga",
];

const KNOWN_STORAGE_SIGNALS = [
  "samsung",
  "crucial",
  "kingston",
  "wd",
  "western digital",
  "lexar",
  "p3",
  "p5",
  "sn570",
  "sn580",
  "sn770",
  "980 pro",
  "970 evo",
  "nm620",
  "nv2",
  "kc3000",
];

type TierPattern = {
  tier: number;
  patterns: string[];
};

const GPU_TIER_PATTERNS: TierPattern[] = [
  { tier: 8, patterns: ["rtx 4080 super", "rtx 5070 ti", "rx 9070 xt", "rx 7900 gre"] },
  { tier: 7, patterns: ["rtx 4070 ti", "rtx 4070 super", "rtx 5070", "rx 7800 xt", "rx 9070"] },
  { tier: 6, patterns: ["rtx 4070", "rtx 3080 ti", "rtx 3080", "rx 6800 xt", "rx 6800"] },
  { tier: 5, patterns: ["rtx 3070 ti", "rtx 3070", "rtx 4060 ti", "rtx 4060", "rtx 3060 ti", "rx 7700 xt", "rx 6750 xt", "rx 6700 xt", "arc b580"] },
  { tier: 4, patterns: ["rtx 3060", "rtx 2070 super", "rtx 2070", "rtx 2060 super", "rtx 2060", "rx 7600", "rx 6700", "rx 6650 xt", "rx 6600 xt", "rx 6600", "rx 5700 xt", "rx 5700", "arc a770", "arc b570"] },
  { tier: 3, patterns: ["gtx 1660 ti", "gtx 1660 super", "gtx 1660", "gtx 1650 super", "rx 5600 xt", "rx 5500 xt"] },
  { tier: 2, patterns: ["gtx 1650", "gtx 1060 6gb", "gtx 1060 3gb", "rx 580", "rx 570"] },
  { tier: 1, patterns: ["gtx 1050 ti", "gtx 1050", "gtx 960", "gtx 950", "gtx 750 ti", "gt 1030", "rx 560", "rx 550"] },
];

const CPU_TIER_PATTERNS: TierPattern[] = [
  { tier: 6, patterns: ["9800x3d", "7800x3d", "14700", "14600k"] },
  { tier: 5, patterns: ["7700", "9700", "9600x", "9600", "7600", "7500f", "14400", "14400f", "13400", "13400f", "12600k"] },
  { tier: 4, patterns: ["5700x", "5600x", "5600", "8600g", "12400", "12400f"] },
  { tier: 3, patterns: ["5600g", "3600", "10400f"] },
  { tier: 2, patterns: ["2600", "1600", "9400f", "8400"] },
  { tier: 1, patterns: ["i5-7400", "i3", "ryzen 3"] },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function findTier(text: string | null | undefined, patterns: TierPattern[]) {
  const normalized = normalize(text ?? "");

  if (!normalized) {
    return 0;
  }

  for (const entry of patterns) {
    if (entry.patterns.some((pattern) => normalized.includes(pattern))) {
      return entry.tier;
    }
  }

  return 0;
}

function toConfidenceScore(knownSignals: number) {
  if (knownSignals >= 6) {
    return "high" as const;
  }

  if (knownSignals >= 3) {
    return "medium" as const;
  }

  return "low" as const;
}

function resolveRamValue(ramGb: number | null | undefined, ramType: NormalizedOffer["ramType"]) {
  if (!ramGb) {
    return 0;
  }

  const type = ramType ?? "DDR4";
  const valueTable = RAM_VALUE_BY_SIZE[type];

  if (ramGb >= 64) {
    return valueTable[64];
  }

  if (ramGb >= 32) {
    return valueTable[32];
  }

  if (ramGb >= 16) {
    return valueTable[16];
  }

  return valueTable[8] ?? 40;
}

function resolveStorageValue(storage: NormalizedOffer["storage"]) {
  if (!storage || storage.length === 0) {
    return 0;
  }

  return storage.reduce((sum, item) => {
    const table = STORAGE_VALUE_BY_TYPE[item.type] as Partial<Record<240 | 250 | 480 | 500 | 1000 | 2000, number>>;

    if (item.sizeGb >= 1900) {
      return sum + (table[2000] ?? 0);
    }

    if (item.sizeGb >= 900) {
      return sum + (table[1000] ?? 0);
    }

    if (item.sizeGb >= 450) {
      return sum + (table[480] ?? table[500] ?? 0);
    }

    return sum + (table[240] ?? table[250] ?? 0);
  }, 0);
}

function findCatalogUsedValue(model: string | null | undefined) {
  if (!model) {
    return null;
  }

  const exact = findCatalogComponentByCanonical(model);
  if (exact?.valuation) {
    return exact.valuation.usedValue ?? exact.valuation.newValue ?? null;
  }

  return null;
}

function getCatalogWholeBuildFloor(model: string | null | undefined) {
  if (!model) {
    return 0;
  }

  const exact = findCatalogComponentByCanonical(model);
  return exact?.valuation?.wholeBuildFloor ?? 0;
}

export function getGpuTier(model?: string | null) {
  return findTier(model, GPU_TIER_PATTERNS);
}

export function getCpuTier(model?: string | null) {
  return findTier(model, CPU_TIER_PATTERNS);
}

export function isCpuGpuMismatch(input: { cpuModel?: string | null; gpuModel?: string | null }) {
  const cpuTier = getCpuTier(input.cpuModel);
  const gpuTier = getGpuTier(input.gpuModel);

  if (!cpuTier || !gpuTier) {
    return false;
  }

  return Math.abs(gpuTier - cpuTier) >= 3;
}

export function normalizeGpuValue(model?: string | null) {
  const catalogValue = findCatalogUsedValue(model);
  if (typeof catalogValue === "number") {
    return catalogValue;
  }

  const tier = getGpuTier(model);
  return FALLBACK_GPU_VALUE_BY_TIER[tier as keyof typeof FALLBACK_GPU_VALUE_BY_TIER] ?? 0;
}

export function normalizeCpuValue(model?: string | null) {
  const catalogValue = findCatalogUsedValue(model);
  if (typeof catalogValue === "number") {
    return catalogValue;
  }

  const tier = getCpuTier(model);
  return FALLBACK_CPU_VALUE_BY_TIER[tier as keyof typeof FALLBACK_CPU_VALUE_BY_TIER] ?? 0;
}

export function getMotherboardValue(tier: MotherboardTier | undefined) {
  return MOTHERBOARD_TIER_VALUES[tier ?? "unknown"];
}

export function getPsuValue(quality: PsuQuality | undefined) {
  return PSU_QUALITY_VALUES[quality ?? "unknown"];
}

function getCaseValue(tier: CaseTier | undefined) {
  return CASE_TIER_VALUES[tier ?? "unknown"];
}

function getCoolerValue(tier: CoolerTier | undefined) {
  return COOLER_TIER_VALUES[tier ?? "unknown"];
}

function inferMotherboardTier(parsed: ParsedOffer): MotherboardTier {
  const motherboard = parsed.detectedParts.find((part) => part.type === "PŁYTA");
  const text = normalize(motherboard?.name ?? parsed.normalizedText);

  if (!text || text === normalize(parsed.normalizedText)) {
    if (!/b450|b550|b650|x570|x670|h610|b660|b760|z690|z790|a620|a320/.test(text)) {
      return "unknown";
    }
  }

  if (/x670|z790|z690/.test(text)) {
    return "good";
  }

  if (/b650|b760|b660|b550|x570/.test(text)) {
    return "mid";
  }

  if (/b450|h610|a620|b460|b560|h510/.test(text)) {
    return "basic";
  }

  if (/a320|h410/.test(text)) {
    return "very_basic";
  }

  return motherboard ? "basic" : "unknown";
}

function inferPsuModelKnown(parsed: ParsedOffer) {
  const text = normalize(parsed.preprocessed.combined.raw);
  return KNOWN_PSU_BRANDS.some((brand) => text.includes(normalize(brand)));
}

function inferPsuQuality(parsed: ParsedOffer): PsuQuality {
  const psu = parsed.detectedParts.find((part) => part.type === "PSU");
  const wattage = psu?.attributes?.wattage ?? 0;
  const efficiency = normalize(psu?.attributes?.efficiency ?? "");
  const hasKnownBrand = inferPsuModelKnown(parsed);

  if (!psu) {
    return "unknown";
  }

  if (wattage < 500) {
    return "bad";
  }

  if ((efficiency.includes("gold") || efficiency.includes("platinum")) && wattage >= 650 && hasKnownBrand) {
    return "good";
  }

  if ((efficiency.includes("bronze") || efficiency.includes("gold")) && wattage >= 550) {
    return "decent";
  }

  if (wattage >= 550) {
    return "basic";
  }

  return "bad";
}

function inferCaseTier(parsed: ParsedOffer): CaseTier {
  const text = normalize(parsed.preprocessed.combined.raw);

  if (/lian li|hyte|nzxt h|fractal north|torrent|premium case/.test(text)) {
    return "premium";
  }

  if (/airflow|mesh|pop air|front mesh|lancool|montech air/.test(text)) {
    return "airflow";
  }

  if (/obudowa|case|rgb|argb|szklo|szkło/.test(text)) {
    return "basic";
  }

  return "unknown";
}

function inferCoolerTier(parsed: ParsedOffer): CoolerTier {
  const text = normalize(parsed.preprocessed.combined.raw);

  if (/aio|liquid freezer|wodne|water cooling|cooler master liquid|navis|240|280|360/.test(text) && /aio|wodne|liquid|freezer|navis/.test(text)) {
    return "aio";
  }

  if (/peerless assassin|fortis|fuma|dark rock|ak620|phantom spirit/.test(text)) {
    return "good_tower";
  }

  if (/fera|ak400|spartan|basic tower|tower/.test(text)) {
    return "basic_tower";
  }

  if (/stock|box|wraith stealth|wraith spire/.test(text)) {
    return "stock";
  }

  return "unknown";
}

function inferStorage(parsed: ParsedOffer): NormalizedOffer["storage"] {
  const storage = parsed.detectedParts.find((part) => part.type === "DYSK");
  const rawText = normalize(parsed.preprocessed.combined.raw);

  if (!storage?.attributes?.storageGb) {
    return [];
  }

  return [
    {
      type:
        storage.attributes.storageKind === "HDD"
          ? "HDD"
          : storage.attributes.storageKind === "SSD" && storage.attributes.storageInterface !== "PCIe" && storage.attributes.storageInterface !== "Gen3" && storage.attributes.storageInterface !== "Gen4"
            ? "SATA_SSD"
            : "NVME",
      sizeGb: storage.attributes.storageGb,
      knownModel: KNOWN_STORAGE_SIGNALS.some((signal) => rawText.includes(normalize(signal))),
    },
  ];
}

function inferListingQuality(parsed: ParsedOffer): ListingQuality {
  const infoSignals = parsed.detectedParts.filter((part) => part.type !== "CENA" && part.confidence !== "low").length;
  const rawLength = parsed.preprocessed.description.raw.trim().length + parsed.preprocessed.title.raw.trim().length;

  if (infoSignals >= 5 && rawLength >= 140) {
    return "good";
  }

  if (infoSignals >= 3 && rawLength >= 70) {
    return "ok";
  }

  return "poor";
}

function inferTitleDescriptionMismatch(title?: string, description?: string) {
  if (!title || !description) {
    return false;
  }

  const titleParts = parseFromTitle(title);
  const descriptionParts = parseFromDescription(description);

  const titleCpu = titleParts.find((part) => part.type === "CPU" && part.confidence !== "low")?.name;
  const descriptionCpu = descriptionParts.find((part) => part.type === "CPU" && part.confidence !== "low")?.name;
  const titleGpu = titleParts.find((part) => part.type === "GPU" && part.confidence !== "low")?.name;
  const descriptionGpu = descriptionParts.find((part) => part.type === "GPU" && part.confidence !== "low")?.name;

  return Boolean((titleCpu && descriptionCpu && titleCpu !== descriptionCpu) || (titleGpu && descriptionGpu && titleGpu !== descriptionGpu));
}

export function buildNormalizedOfferForScoring(input: {
  parsed: ParsedOffer;
  title?: string;
  description?: string;
  url?: string;
  detectedRedFlags?: string[];
}): NormalizedOffer {
  const cpu = input.parsed.detectedParts.find((part) => part.type === "CPU");
  const gpu = input.parsed.detectedParts.find((part) => part.type === "GPU");
  const ram = input.parsed.detectedParts.find((part) => part.type === "RAM");
  const combinedText = normalize(input.parsed.preprocessed.combined.raw);

  return {
    title: input.title,
    askingPrice: input.parsed.price ?? null,
    cpuModel: cpu?.name ?? null,
    gpuModel: gpu?.name ?? null,
    ramGb: ram?.attributes?.ramGb ?? null,
    ramType: (ram?.attributes?.memoryType as "DDR3" | "DDR4" | "DDR5" | undefined) ?? null,
    storage: inferStorage(input.parsed),
    motherboardTier: inferMotherboardTier(input.parsed),
    psuQuality: inferPsuQuality(input.parsed),
    psuKnownModel: inferPsuModelKnown(input.parsed),
    caseTier: inferCaseTier(input.parsed),
    coolerTier: inferCoolerTier(input.parsed),
    hasWarrantyInfo: input.parsed.signals?.hasWarrantyInfo ?? /gwaranc|paragon|faktura|dowod zakupu|dowód zakupu/.test(combinedText),
    hasReturnOption: /zwrot|14 dni|14dni|odstapieni|odstąpi/.test(combinedText),
    hasInteriorPhotos: /zdjecia wn[eę]trza|zdj[eę]cie wn[eę]trza|foto wn[eę]trza|w srodku|w środku|interior/.test(combinedText),
    hasHealthProof: /smart|crystaldisk|temperatur|hwinfo|stan dysku|health/.test(combinedText),
    hasBenchmarks: /3dmark|cinebench|furmark|benchmark|testy fps|superposition|occt/.test(combinedText),
    listingQuality: inferListingQuality(input.parsed),
    suspiciousUrgency: /pilnie|na juz|na już|tylko dzis|tylko dziś|ostatnia cena|sprzedam szybko/.test(combinedText),
    titleDescriptionMismatch: inferTitleDescriptionMismatch(input.title, input.description),
    gamingBaitStyle: /gaming|fortnite|gta|warzone|cs2|valorant|do gier|ultra gaming|petarda/.test(combinedText),
    detectedRedFlags: input.detectedRedFlags ?? [],
  };
}

export function calculateFairValue(input: NormalizedOffer) {
  const gpuValue = normalizeGpuValue(input.gpuModel);
  const cpuValue = normalizeCpuValue(input.cpuModel);
  const ramValue = resolveRamValue(input.ramGb, input.ramType);
  const storageValue = resolveStorageValue(input.storage);
  const motherboardValue = getMotherboardValue(input.motherboardTier);
  const psuValue = getPsuValue(input.psuQuality);
  const caseValue = getCaseValue(input.caseTier);
  const coolerValue = getCoolerValue(input.coolerTier);

  const rawFairValue = gpuValue + cpuValue + ramValue + storageValue + motherboardValue + psuValue + caseValue + coolerValue;
  if (!rawFairValue) {
    return null;
  }

  const wholeBuildFloor = Math.max(getCatalogWholeBuildFloor(input.gpuModel), gpuValue > 0 ? gpuValue + 500 : 0);
  return Math.max(Math.round(rawFairValue), wholeBuildFloor || 0);
}

export function calculatePriceScore(askingPrice: number | null, fairValue: number | null) {
  if (!askingPrice || !Number.isFinite(askingPrice) || !fairValue || !Number.isFinite(fairValue) || fairValue <= 0) {
    return 35;
  }

  const priceRatio = askingPrice / fairValue;

  for (const step of PRICE_SCORE_STEPS) {
    if (priceRatio <= step.maxRatio) {
      return step.score;
    }
  }

  return 3;
}

function isNoSsd(storage: NormalizedOffer["storage"]) {
  if (!storage || storage.length === 0) {
    return true;
  }

  return !storage.some((item) => item.type === "NVME" || item.type === "SATA_SSD");
}

function hasOnlyTinySsd(storage: NormalizedOffer["storage"]) {
  if (!storage || storage.length === 0) {
    return false;
  }

  const ssdSizes = storage
    .filter((item) => item.type === "NVME" || item.type === "SATA_SSD")
    .map((item) => item.sizeGb);

  if (ssdSizes.length === 0) {
    return false;
  }

  return Math.max(...ssdSizes) < 480;
}

function isOldWeakPlatformAtHighPrice(input: NormalizedOffer) {
  const price = input.askingPrice ?? 0;
  const cpuTier = getCpuTier(input.cpuModel);

  if (price < 2500) {
    return false;
  }

  return cpuTier <= 3 && (input.motherboardTier === "very_basic" || input.motherboardTier === "basic") && input.ramType !== "DDR5";
}

export function calculateBalanceScore(input: NormalizedOffer) {
  let score = 100;
  const breakdown: ScoreBreakdownItem[] = [];
  const price = input.askingPrice ?? 0;

  if ((input.ramGb ?? 0) > 0 && (input.ramGb ?? 0) < 16 && price > 1200) {
    score -= BALANCE_PENALTIES.lowRamAtPrice;
    breakdown.push({
      key: "low_ram",
      points: -BALANCE_PENALTIES.lowRamAtPrice,
      description: "8 GB RAM przy tej cenie to po prostu za mało jak na używany gaming PC.",
    });
  }

  if (isNoSsd(input.storage)) {
    score -= BALANCE_PENALTIES.noSsd;
    breakdown.push({
      key: "no_ssd",
      points: -BALANCE_PENALTIES.noSsd,
      description: "Brak sensownego SSD mocno psuje komfort i wartość całego zestawu.",
    });
  } else if (price > 1500 && hasOnlyTinySsd(input.storage)) {
    score -= BALANCE_PENALTIES.tinySsdAtHigherPrice;
    breakdown.push({
      key: "tiny_ssd",
      points: -BALANCE_PENALTIES.tinySsdAtHigherPrice,
      description: "Przy tej cenie bardzo mały SSD wygląda zbyt biednie jak na resztę zestawu.",
    });
  }

  if (isCpuGpuMismatch(input)) {
    score -= BALANCE_PENALTIES.cpuGpuMismatch;
    breakdown.push({
      key: "cpu_gpu_mismatch",
      points: -BALANCE_PENALTIES.cpuGpuMismatch,
      description: "CPU i GPU wyglądają na wyraźnie słabo zbalansowane jak na gamingowy zestaw.",
    });
  }

  const gpuTier = getGpuTier(input.gpuModel);
  if ((price >= 2000 && gpuTier <= 3) || (price >= 3000 && gpuTier <= 5) || (price >= 4000 && gpuTier <= 5)) {
    score -= BALANCE_PENALTIES.weakGpuForPrice;
    breakdown.push({
      key: "weak_gpu_for_price",
      points: -BALANCE_PENALTIES.weakGpuForPrice,
      description: "GPU wygląda za słabo względem ceny całego zestawu.",
    });
  }

  if (isOldWeakPlatformAtHighPrice(input)) {
    score -= BALANCE_PENALTIES.oldPlatformAtHighPrice;
    breakdown.push({
      key: "old_platform",
      points: -BALANCE_PENALTIES.oldPlatformAtHighPrice,
      description: "Przy tej cenie platforma wygląda już zbyt stara albo zbyt słaba.",
    });
  }

  if (input.gamingBaitStyle && !input.gpuModel) {
    score -= BALANCE_PENALTIES.noGpuForGamingBait;
    breakdown.push({
      key: "gaming_bait_no_gpu",
      points: -BALANCE_PENALTIES.noGpuForGamingBait,
      description: "Oferta udaje gamingową, ale nie daje nawet jasnego modelu GPU.",
    });
  } else if (input.gamingBaitStyle && gpuTier <= 2) {
    score -= BALANCE_PENALTIES.gamingBaitWeakConfig;
    breakdown.push({
      key: "gaming_bait_weak_gpu",
      points: -BALANCE_PENALTIES.gamingBaitWeakConfig,
      description: "Marketing gamingowy nie przykrywa bardzo biednej konfiguracji.",
    });
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    breakdown,
  };
}

export function calculateConfidenceScore(input: NormalizedOffer) {
  let score = 100;
  const breakdown: ScoreBreakdownItem[] = [];

  if (!input.psuKnownModel) {
    score -= CONFIDENCE_PENALTIES.missingPsuModel;
    breakdown.push({
      key: "missing_psu_model",
      points: -CONFIDENCE_PENALTIES.missingPsuModel,
      description: "Brak modelu zasilacza mocno obniża pewność oferty.",
    });
  }

  if ((input.motherboardTier ?? "unknown") === "unknown") {
    score -= CONFIDENCE_PENALTIES.missingMotherboardInfo;
    breakdown.push({
      key: "missing_motherboard",
      points: -CONFIDENCE_PENALTIES.missingMotherboardInfo,
      description: "Brak konkretnej informacji o płycie głównej utrudnia ocenę platformy.",
    });
  }

  if (!input.storage || input.storage.length === 0 || input.storage.every((item) => !item.knownModel)) {
    score -= CONFIDENCE_PENALTIES.missingStorageInfo;
    breakdown.push({
      key: "missing_storage_model",
      points: -CONFIDENCE_PENALTIES.missingStorageInfo,
      description: "Brakuje sensownego konkretu o dysku, więc trudniej ocenić realną wartość.",
    });
  }

  if (!input.ramType) {
    score -= CONFIDENCE_PENALTIES.weakRamDetail;
    breakdown.push({
      key: "weak_ram_detail",
      points: -CONFIDENCE_PENALTIES.weakRamDetail,
      description: "Sama pojemność RAM to za mało. Typ pamięci też ma znaczenie.",
    });
  }

  if ((input.listingQuality ?? "poor") === "poor") {
    score -= CONFIDENCE_PENALTIES.poorListing;
    breakdown.push({
      key: "poor_listing",
      points: -CONFIDENCE_PENALTIES.poorListing,
      description: "Opis jest zbyt biedny albo zbyt lakoniczny, żeby spokojnie mu ufać.",
    });
  }

  if (!input.hasInteriorPhotos) {
    score -= CONFIDENCE_PENALTIES.missingInteriorPhotos;
    breakdown.push({
      key: "missing_interior_photos",
      points: -CONFIDENCE_PENALTIES.missingInteriorPhotos,
      description: "Brak zdjęć wnętrza obudowy zostawia za dużo miejsca na niespodzianki.",
    });
  }

  if (!input.hasHealthProof) {
    score -= CONFIDENCE_PENALTIES.missingHealthProof;
    breakdown.push({
      key: "missing_health_proof",
      points: -CONFIDENCE_PENALTIES.missingHealthProof,
      description: "Brakuje twardych dowodów na stan dysku albo temperatury zestawu.",
    });
  }

  if (!input.hasWarrantyInfo) {
    score -= CONFIDENCE_PENALTIES.missingWarrantyInfo;
    breakdown.push({
      key: "missing_warranty_info",
      points: -CONFIDENCE_PENALTIES.missingWarrantyInfo,
      description: "Nie ma jasnej informacji o gwarancji, pochodzeniu albo dowodzie zakupu.",
    });
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    breakdown,
  };
}

export function getProfitabilityLabel(score: number): ProfitabilityLabel {
  if (score >= 80) {
    return "Bierz";
  }

  if (score >= 55) {
    return "Negocjuj";
  }

  if (score >= 30) {
    return "Raczej nie";
  }

  return "Odpuść";
}

export function getRiskLabel(score: number): RiskLabel {
  if (score < 25) {
    return "Niskie";
  }

  if (score < 55) {
    return "Średnie";
  }

  return "Wysokie";
}

function getFairValueRange(fairValue: number | null, confidenceScore: number) {
  if (!fairValue) {
    return null;
  }

  const confidenceTier =
    confidenceScore >= 80 ? "high" : confidenceScore >= 55 ? "medium" : "low";
  const margin = FAIR_VALUE_RANGE_MARGIN[confidenceTier];

  return {
    min: Math.round(fairValue * (1 - margin)),
    max: Math.round(fairValue * (1 + margin)),
  };
}

function buildSummary(input: {
  offer: NormalizedOffer;
  profitabilityLabel: ProfitabilityLabel;
  riskLabel: RiskLabel;
  fairValueRange: { min: number; max: number } | null;
  profitabilityBreakdown: ScoreBreakdownItem[];
  riskBreakdown: ScoreBreakdownItem[];
}) {
  const keyTakeaways = uniqueStrings([
    ...input.profitabilityBreakdown.slice(0, 3).map((item) => item.description),
    ...input.riskBreakdown.slice(0, 2).map((item) => item.description),
  ]).slice(0, 4);

  const nextSteps = uniqueStrings([
    !input.offer.psuKnownModel ? "Poproś o dokładny model zasilacza i zdjęcie jego naklejki." : "",
    !input.offer.hasHealthProof ? "Poproś o SMART dysku, temperatury i krótki test obciążeniowy." : "",
    !input.offer.hasInteriorPhotos ? "Poproś o zdjęcie wnętrza obudowy i przewodów." : "",
    !input.offer.hasBenchmarks && input.riskLabel !== "Niskie" ? "Poproś o benchmarki albo nagranie działania sprzętu." : "",
    input.riskLabel === "Wysokie" ? "Jeśli w ogóle chcesz iść dalej, tylko odbiór osobisty i żadnych zaliczek." : "",
    input.fairValueRange && (input.offer.askingPrice ?? 0) > input.fairValueRange.max
      ? `Jeśli chcesz to brać, negocjuj raczej do ${input.fairValueRange.max} zł.`
      : "",
  ]).slice(0, 4);

  let shortVerdict = "Oferta wygląda przeciętnie i wymaga dopytania o szczegóły.";

  if (input.profitabilityLabel === "Bierz" && input.riskLabel === "Niskie") {
    shortVerdict = "Cena wygląda sensownie, a opis nie świeci dużymi czerwonymi flagami.";
  } else if (input.profitabilityLabel === "Bierz" && input.riskLabel !== "Niskie") {
    shortVerdict = "Na papierze to może być dobry deal, ale ryzyko oferty jest zbyt duże, żeby kupować w ciemno.";
  } else if (input.profitabilityLabel === "Negocjuj") {
    shortVerdict = "Zestaw da się rozważyć, ale cena albo opis dalej proszą się o twardszą weryfikację.";
  } else if (input.profitabilityLabel === "Raczej nie") {
    shortVerdict = "Ten zestaw nie broni się dobrze względem ceny i trzeba mieć mocny powód, żeby się w to pakować.";
  } else if (input.profitabilityLabel === "Odpuść") {
    shortVerdict = "Oferta wygląda słabo i bardziej pachnie przepłaceniem albo chaosem niż sensownym zakupem.";
  }

  return {
    shortVerdict,
    maxReasonablePrice: input.fairValueRange?.max ?? null,
    keyTakeaways,
    nextSteps,
  };
}

export function calculateProfitabilityScore(input: NormalizedOffer) {
  const fairValue = calculateFairValue(input);
  const priceRatio = input.askingPrice && fairValue ? input.askingPrice / fairValue : null;
  const priceScore = calculatePriceScore(input.askingPrice, fairValue);
  const balance = calculateBalanceScore(input);
  const confidence = calculateConfidenceScore(input);

  const profitabilityScore = Math.round(
    priceScore * SCORING_WEIGHTS.price +
      balance.score * SCORING_WEIGHTS.balance +
      confidence.score * SCORING_WEIGHTS.confidence,
  );

  return {
    fairValue,
    fairValueRange: getFairValueRange(fairValue, confidence.score),
    priceRatio,
    score: clamp(profitabilityScore, 0, 100),
    label: getProfitabilityLabel(profitabilityScore),
    profitabilityScore: clamp(profitabilityScore, 0, 100),
    profitabilityLabel: getProfitabilityLabel(profitabilityScore),
    subscores: {
      priceScore,
      balanceScore: balance.score,
      confidenceScore: confidence.score,
    },
    breakdown: [
      {
        key: "price_score",
        points: priceScore,
        description:
          priceRatio === null
            ? "Brak sensownej ceny albo fair value, więc price score jest ostrożny."
            : `Cena to około ${Math.round(priceRatio * 100)}% naszej ostrożnej wartości zestawu.`,
      },
      ...balance.breakdown,
      ...confidence.breakdown,
    ],
  };
}

export function calculateRiskScore(input: NormalizedOffer) {
  let score = 0;
  const breakdown: ScoreBreakdownItem[] = [];
  const fairValue = calculateFairValue(input);
  const priceRatio = input.askingPrice && fairValue ? input.askingPrice / fairValue : null;

  const add = (key: string, points: number, description: string, condition: boolean) => {
    if (!condition) {
      return;
    }

    score += points;
    breakdown.push({ key, points, description });
  };

  add("missing_psu_model", RISK_POINTS.missingPsuModel, "Brak modelu PSU to realne ryzyko miny w gotowym zestawie.", !input.psuKnownModel);
  add("missing_motherboard", RISK_POINTS.missingMotherboardModel, "Brakuje konkretu o płycie głównej.", (input.motherboardTier ?? "unknown") === "unknown");
  add(
    "missing_storage_model",
    RISK_POINTS.missingStorageModel,
    "Brakuje konkretu o dysku, więc trudniej ocenić jego stan i realną wartość.",
    !input.storage || input.storage.length === 0 || input.storage.every((item) => !item.knownModel),
  );
  add("missing_health_proof", RISK_POINTS.missingHealthProof, "Brakuje twardych dowodów na stan sprzętu.", !input.hasHealthProof);
  add("missing_interior_photos", RISK_POINTS.missingInteriorPhotos, "Brak zdjęć wnętrza obudowy.", !input.hasInteriorPhotos);
  add(
    "missing_benchmarks",
    RISK_POINTS.missingBenchmarksAtSuspiciousOffer,
    "Przy tej ofercie brakuje benchmarków albo nagrania działania sprzętu.",
    !input.hasBenchmarks && ((priceRatio !== null && priceRatio <= 0.85) || input.listingQuality === "poor"),
  );
  add("missing_warranty", RISK_POINTS.missingWarranty, "Nie ma jasnej informacji o gwarancji albo dowodzie zakupu.", !input.hasWarrantyInfo);
  add("no_return", RISK_POINTS.noReturn, "Brak opcji zwrotu podbija ryzyko transakcji.", !input.hasReturnOption);
  add("urgency", RISK_POINTS.urgency, "Opis próbuje docisnąć pilną decyzję.", Boolean(input.suspiciousUrgency));
  add("poor_listing", RISK_POINTS.poorListing, "Opis jest za słaby i za mało konkretny.", (input.listingQuality ?? "poor") === "poor");
  add("title_description_mismatch", RISK_POINTS.titleDescriptionMismatch, "Tytuł i opis nie kleją się co do kluczowych części.", Boolean(input.titleDescriptionMismatch));
  add(
    "unclear_parts_build",
    RISK_POINTS.unclearPartsBuild,
    "Za dużo kluczowych części jest niejasnych albo nieopisanych.",
    [input.cpuModel, input.gpuModel, input.storage?.length ? "storage" : null].filter(Boolean).length <= 1,
  );
  add("suspiciously_cheap", RISK_POINTS.suspiciouslyCheap, "Cena jest podejrzanie niska względem ostrożnej wartości zestawu.", priceRatio !== null && priceRatio <= 0.8);
  add(
    "overpriced_poor_listing",
    RISK_POINTS.overpricedPoorListing,
    "Cena jest wysoka, a opis dalej nie daje twardych konkretów.",
    priceRatio !== null && priceRatio >= 1.25 && (input.listingQuality ?? "poor") === "poor",
  );
  add(
    "old_gaming_bait",
    RISK_POINTS.oldGamingBait,
    "To wygląda jak stary albo biedny zestaw sprzedawany agresywnie jako gamingowy.",
    Boolean(input.gamingBaitStyle) && getGpuTier(input.gpuModel) <= 2,
  );
  add("too_weak_psu", RISK_POINTS.tooWeakPsu, "Zasilacz wygląda zbyt słabo albo zbyt niepewnie do reszty zestawu.", input.psuQuality === "bad");

  return {
    score: clamp(Math.round(score), 0, 100),
    label: getRiskLabel(score),
    riskScore: clamp(Math.round(score), 0, 100),
    riskLabel: getRiskLabel(score),
    breakdown,
  };
}

export function estimateOfferMarketValue(parsed: ParsedOffer): MarketValueEstimate {
  const normalized = buildNormalizedOfferForScoring({ parsed });
  const fairValue = calculateFairValue(normalized);
  const gpuReference = normalized.gpuModel ? findCatalogComponentByCanonical(normalized.gpuModel) : null;
  const knownSignals = [
    normalized.cpuModel,
    normalized.gpuModel,
    normalized.ramGb,
    normalized.storage?.length ? "storage" : null,
    normalized.motherboardTier !== "unknown" ? normalized.motherboardTier : null,
    normalized.psuKnownModel ? "psu" : null,
  ].filter(Boolean).length;

  return {
    estimatedMarketValue: fairValue ?? undefined,
    confidence: toConfidenceScore(knownSignals),
    invalid: false,
    invalidReason: undefined,
    detectedGpuTier:
      gpuReference?.valuation?.tier ??
      (normalized.gpuModel ? String(getGpuTier(normalized.gpuModel)) : undefined),
  };
}

export function scoreOffer(input: {
  parsed: ParsedOffer;
  heuristics: CheckerHeuristics;
  valuation: MarketValueEstimate;
  guideline?: unknown;
  gpuValueCheck?: GpuValueCheck | null;
  psuAssessment?: PsuAssessment;
  title?: string;
  description?: string;
  url?: string;
}): OfferScoringResult & {
  score: number;
  valueScore: number;
  estimatedMarketValue?: number;
  estimatedMarketValueConfidence?: DetectionConfidence;
  valuationNote?: string;
} {
  const normalized = buildNormalizedOfferForScoring({
    parsed: input.parsed,
    title: input.title,
    description: input.description,
    url: input.url,
    detectedRedFlags: input.heuristics.redFlags,
  });

  if (input.psuAssessment?.status === "too_weak") {
    normalized.detectedRedFlags = uniqueStrings([...(normalized.detectedRedFlags ?? []), "PSU wygląda za słabo dla tej konfiguracji."]);
    normalized.psuQuality = "bad";
  }

  if (input.gpuValueCheck?.gpu_position_for_price === "too_weak") {
    normalized.detectedRedFlags = uniqueStrings([
      ...(normalized.detectedRedFlags ?? []),
      "GPU jest zbyt słabe względem ceny całego zestawu.",
    ]);
  }

  const profitability = calculateProfitabilityScore(normalized);
  const risk = calculateRiskScore(normalized);
  const decisionSummary = buildSummary({
    offer: normalized,
    profitabilityLabel: profitability.label,
    riskLabel: risk.label,
    fairValueRange: profitability.fairValueRange ?? null,
    profitabilityBreakdown: profitability.breakdown,
    riskBreakdown: risk.breakdown,
  });

  return {
    fairValue: profitability.fairValue,
    fairValueRange: profitability.fairValueRange ?? null,
    priceRatio: profitability.priceRatio,
    profitabilityScore: profitability.score,
    profitabilityLabel: profitability.label,
    riskScore: risk.score,
    riskLabel: risk.label,
    subscores: profitability.subscores,
    profitabilityBreakdown: profitability.breakdown,
    riskBreakdown: risk.breakdown,
    summary: decisionSummary,
    score: profitability.score,
    valueScore: profitability.score,
    estimatedMarketValue: profitability.fairValue ?? undefined,
    estimatedMarketValueConfidence:
      profitability.subscores.confidenceScore >= 80
        ? "high"
        : profitability.subscores.confidenceScore >= 55
          ? "medium"
          : "low",
    valuationNote: undefined,
  };
}
