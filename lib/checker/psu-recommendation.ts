import type { DetectionConfidence, ParsedOffer, PsuAssessment, PsuAssessmentStatus, PsuRecommendation } from "@/types/checker";

const PSU_REFERENCE_NOTE =
  "Dobór mocy zasilacza uwzględnia publicznie dostępny ASRock PSU Selection Guide jako jedno ze źródeł referencyjnych. Ostateczna ocena zależy też od jakości zasilacza i pełnej konfiguracji.";

const GPU_WATTAGE_GUIDELINES: Array<{
  match: string[];
  recommendedWattage: number;
  minimumSuggestedWattage: number;
}> = [
  { match: ["NVIDIA GeForce RTX 4080 SUPER"], recommendedWattage: 750, minimumSuggestedWattage: 650 },
  { match: ["NVIDIA GeForce RTX 4070 Ti", "NVIDIA GeForce RTX 5070 Ti", "AMD Radeon RX 9070 XT"], recommendedWattage: 750, minimumSuggestedWattage: 650 },
  { match: ["NVIDIA GeForce RTX 5070", "AMD Radeon RX 9070", "NVIDIA GeForce RTX 4070 SUPER", "AMD Radeon RX 7800 XT"], recommendedWattage: 650, minimumSuggestedWattage: 650 },
  { match: ["NVIDIA GeForce RTX 4070", "AMD Radeon RX 7700 XT", "AMD Radeon RX 6800 XT", "NVIDIA GeForce RTX 3080"], recommendedWattage: 650, minimumSuggestedWattage: 600 },
  { match: ["NVIDIA GeForce RTX 4060 Ti", "NVIDIA GeForce RTX 4060", "NVIDIA GeForce RTX 3070", "NVIDIA GeForce RTX 3060 Ti", "AMD Radeon RX 6750 XT", "AMD Radeon RX 6700 XT", "Intel Arc B580"], recommendedWattage: 650, minimumSuggestedWattage: 550 },
  { match: ["NVIDIA GeForce RTX 3060", "AMD Radeon RX 6700", "AMD Radeon RX 6600 XT", "AMD Radeon RX 6600", "Intel Arc B570"], recommendedWattage: 550, minimumSuggestedWattage: 500 },
  { match: ["NVIDIA GeForce GTX 1660 SUPER", "NVIDIA GeForce GTX 1660"], recommendedWattage: 500, minimumSuggestedWattage: 450 },
];

const HIGHER_DRAW_CPU_MATCHES = [
  "AMD Ryzen 7 7800X3D",
  "Intel Core i7-14700",
  "Intel Core i5-14600K",
  "Intel Core i5-12600K",
];

const PSU_BRAND_PATTERNS = [
  "be quiet",
  "corsair",
  "seasonic",
  "xpg",
  "msi",
  "chieftec",
  "cooler master",
  "thermaltake",
  "nzxt",
  "fractal",
  "gigabyte",
  "asus",
  "silentiumpc",
  "endorfy",
  "silverstone",
  "fsp",
];

function findGpuGuideline(gpuName: string) {
  return GPU_WATTAGE_GUIDELINES.find((entry) => entry.match.includes(gpuName)) ?? null;
}

function normalizeConfidence(confidences: DetectionConfidence[]): DetectionConfidence {
  if (confidences.every((confidence) => confidence === "high")) {
    return "high";
  }

  if (confidences.some((confidence) => confidence === "low")) {
    return "low";
  }

  return "medium";
}

function hasHigherDrawCpu(cpuName: string) {
  return HIGHER_DRAW_CPU_MATCHES.includes(cpuName);
}

function roundRecommendedWattage(value: number) {
  if (value <= 500) {
    return 500;
  }

  if (value <= 550) {
    return 550;
  }

  if (value <= 650) {
    return 650;
  }

  if (value <= 750) {
    return 750;
  }

  return 850;
}

export function getRecommendedPsu(cpuName?: string, gpuName?: string, input?: { cpuConfidence?: DetectionConfidence; gpuConfidence?: DetectionConfidence }): PsuRecommendation {
  if (!cpuName || !gpuName) {
    return {
      note: "Brakuje pewnie wykrytego CPU albo GPU, więc rekomendacja mocy PSU może być tylko bardzo orientacyjna.",
      confidence: "low",
    };
  }

  const gpuGuideline = findGpuGuideline(gpuName);

  if (!gpuGuideline) {
    return {
      note: "CPU i GPU są częściowo wykryte, ale ten model GPU nie ma jeszcze precyzyjnej reguły w lokalnej tabeli PSU.",
      confidence: "low",
    };
  }

  let recommendedWattage = gpuGuideline.recommendedWattage;
  let minimumSuggestedWattage = gpuGuideline.minimumSuggestedWattage;

  if (hasHigherDrawCpu(cpuName)) {
    recommendedWattage += 100;
    minimumSuggestedWattage = Math.max(minimumSuggestedWattage, recommendedWattage - 100);
  }

  recommendedWattage = roundRecommendedWattage(recommendedWattage);
  minimumSuggestedWattage = roundRecommendedWattage(minimumSuggestedWattage);

  return {
    recommendedWattage,
    minimumSuggestedWattage,
    note: `Rekomendacja orientacyjna na podstawie CPU + GPU oraz publicznie dostępnych wytycznych referencyjnych, w tym ASRock PSU Selection Guide. ${PSU_REFERENCE_NOTE}`,
    confidence: normalizeConfidence([input?.cpuConfidence ?? "low", input?.gpuConfidence ?? "low"]),
  };
}

export function compareOfferPsuToRecommendation(
  offerPsuWattage?: number,
  recommendation?: Pick<PsuRecommendation, "recommendedWattage" | "minimumSuggestedWattage" | "confidence">,
): {
  status: PsuAssessmentStatus;
  summary: string;
  warning?: string;
} {
  if (!offerPsuWattage || !recommendation?.recommendedWattage) {
    return {
      status: "unknown",
      summary: "Brakuje twardych danych, żeby pewnie ocenić, czy moc zasilacza jest sensowna dla tej konfiguracji.",
    };
  }

  if (recommendation.confidence === "low") {
    return {
      status: "unknown",
      summary: "CPU albo GPU nie są wykryte dość pewnie, więc rekomendację mocy zasilacza trzeba traktować ostrożnie.",
    };
  }

  if (offerPsuWattage >= recommendation.recommendedWattage) {
    return {
      status: "ok",
      summary: "Moc zasilacza wygląda sensownie dla tej konfiguracji.",
    };
  }

  if (offerPsuWattage >= (recommendation.minimumSuggestedWattage ?? recommendation.recommendedWattage)) {
    return {
      status: "borderline",
      summary: "Moc zasilacza jest na styk. Taki zestaw może działać, ale zapas nie wygląda komfortowo.",
      warning: "Przy tej klasie CPU i GPU lepiej mieć trochę większy margines oraz pewny model zasilacza.",
    };
  }

  return {
    status: "too_weak",
    summary: "Podana moc zasilacza wygląda zbyt słabo jak na tę konfigurację.",
    warning: "Tu warto zakładać wymianę PSU albo bardzo ostrożnie podchodzić do całej oferty.",
  };
}

function detectPsuBrand(text: string) {
  const normalized = text.toLowerCase();
  const psuContextMatches = normalized.match(/(?:zasilacz|psu|power supply).{0,60}/g) ?? [];

  return PSU_BRAND_PATTERNS.find((brand) => psuContextMatches.some((chunk) => chunk.includes(brand))) ?? null;
}

export function buildPsuAssessment(parsed: ParsedOffer): PsuAssessment {
  const cpu = parsed.detectedParts.find((part) => part.type === "CPU");
  const gpu = parsed.detectedParts.find((part) => part.type === "GPU");
  const psu = parsed.detectedParts.find((part) => part.type === "PSU");
  const recommendation = getRecommendedPsu(cpu?.name, gpu?.name, {
    cpuConfidence: cpu?.confidence,
    gpuConfidence: gpu?.confidence,
  });
  const offeredWattage = psu?.attributes?.wattage;
  const comparison = compareOfferPsuToRecommendation(offeredWattage, recommendation);
  const psuBrand = detectPsuBrand(parsed.preprocessed.combined.raw);
  const hasPsuModelContext = Boolean(psuBrand);

  let warning = comparison.warning;

  if (offeredWattage && !hasPsuModelContext) {
    warning = warning
      ? `${warning} Sama moc ${offeredWattage} W może wyglądać okej, ale nadal brakuje marki albo modelu zasilacza.`
      : `Sama moc ${offeredWattage} W może wyglądać okej, ale nadal brakuje marki albo modelu zasilacza.`;
  }

  return {
    recommendedWattage: recommendation.recommendedWattage,
    minimumSuggestedWattage: recommendation.minimumSuggestedWattage,
    offeredWattage,
    status: comparison.status,
    summary: comparison.summary,
    warning,
    note: recommendation.note,
    confidence: recommendation.confidence,
  };
}

export function getPsuReferenceNote() {
  return PSU_REFERENCE_NOTE;
}
