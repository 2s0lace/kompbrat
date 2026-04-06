import { buildNormalizedOfferForScoring, getCpuTier, getGpuTier, isCpuGpuMismatch } from "@/lib/checker/scoring";
import type {
  CheckerHeuristics,
  CheckerInsight,
  CheckerInsights,
  DetectionConfidence,
  GpuValueCheck,
  OfferScoringResult,
  ParsedOffer,
  PsuAssessment,
} from "@/types/checker";

type InsightBucketName = keyof CheckerInsights;

type InsightDraft = {
  bucket: InsightBucketName;
  reason_code: string;
  text: string;
};

type CheckerReasoningResult = {
  verdictLabel: NonNullable<OfferScoringResult["verdictLabel"]>;
  verdictSummary: string;
  estimatedValueMin: number | null;
  estimatedValueMax: number | null;
  sensibleBuyPrice: number | null;
  insights: CheckerInsights;
  nextSteps: string[];
  keyTakeaways: string[];
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("pl-PL").format(Math.round(value))} zł`;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function createBuckets(): CheckerInsights {
  return {
    red_flags: [],
    minuses: [],
    to_verify: [],
    positives: [],
  };
}

function pushInsight(buckets: CheckerInsights, draft: InsightDraft | null | undefined) {
  if (!draft?.text.trim()) {
    return;
  }

  const bucket = buckets[draft.bucket];
  const duplicate = bucket.some((item) => item.reason_code === draft.reason_code || item.text === draft.text);
  if (duplicate) {
    return;
  }

  bucket.push({
    reason_code: draft.reason_code,
    text: draft.text.trim(),
  });
}

function confidenceAtLeast(confidence: DetectionConfidence | undefined, minimum: DetectionConfidence) {
  const rank: Record<DetectionConfidence, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return confidence ? rank[confidence] >= rank[minimum] : false;
}

function getPart(parsed: ParsedOffer, type: "CPU" | "GPU" | "RAM" | "DYSK" | "PŁYTA" | "PSU" | "CHŁODZENIE") {
  return parsed.detectedParts.find((part) => part.type === type);
}

function classifyStorage(rawStorage: string) {
  const normalized = normalize(rawStorage);

  return {
    hasType: /nvme|m\.2|m2|ssd|hdd|sata|pcie|gen3|gen4/.test(normalized),
    isNvme: /nvme|m\.2|m2|pcie|gen3|gen4/.test(normalized),
    isSsdOnly: /\bssd\b/.test(normalized) && !/nvme|m\.2|m2|pcie|gen3|gen4|sata/.test(normalized),
    isHdd: /\bhdd\b/.test(normalized),
    isGenericDisk: /\bdysk\b|\bdrive\b/.test(normalized) && !/ssd|hdd|nvme|m\.2|m2|sata|pcie|gen3|gen4/.test(normalized),
  };
}

function storageSizeGbFromPart(storagePart: ParsedOffer["detectedParts"][number] | undefined) {
  return storagePart?.attributes?.storageGb ?? 0;
}

function hasKnownPsuBrand(parsed: ParsedOffer) {
  const psu = getPart(parsed, "PSU");
  const raw = normalize(psu?.rawMatch ?? "");

  return /corsair|be quiet|bequiet|seasonic|fsp|chieftec|xpg|cooler master|msi|gigabyte|thermaltake|silverstone|fractal|antec|silentiumpc|endorfy|evga/.test(
    raw,
  );
}

function buildValuationInsight(input: {
  askingPrice: number | null;
  estimatedValueMin: number | null;
  estimatedValueMax: number | null;
  gpuValueCheck?: GpuValueCheck | null;
  profitabilityLabel: NonNullable<OfferScoringResult["verdictLabel"]>;
  suspiciouslyLowPrice: boolean;
}): InsightDraft[] {
  const insights: InsightDraft[] = [];

  if (typeof input.askingPrice === "number" && typeof input.estimatedValueMax === "number" && input.askingPrice > input.estimatedValueMax) {
    const gpuPosition = input.gpuValueCheck?.gpu_position_for_price;
    const text =
      gpuPosition === "ok" || gpuPosition === "strong"
        ? `Podzespoły są w większości sensowne, ale cena całego zestawu wypada zbyt wysoko względem rynku używanego. Problemem tej oferty nie jest sam GPU, tylko ogólna wycena całego PC.`
        : `Cena całego zestawu wypada zbyt wysoko względem tego, co faktycznie widać w specyfikacji.`;

    insights.push({
      bucket: "red_flags",
      reason_code: "overall_overpriced",
      text,
    });
  } else if (
    typeof input.askingPrice === "number" &&
    typeof input.estimatedValueMin === "number" &&
    typeof input.estimatedValueMax === "number" &&
    input.askingPrice >= input.estimatedValueMin &&
    input.askingPrice <= input.estimatedValueMax
  ) {
    insights.push({
      bucket: "positives",
      reason_code: "valuation_in_range",
      text: `Cena całości mieści się mniej więcej w sensownym zakresie ${formatCurrency(input.estimatedValueMin)}–${formatCurrency(
        input.estimatedValueMax,
      )}.`,
    });
  }

  if (input.suspiciouslyLowPrice && typeof input.askingPrice === "number") {
    insights.push({
      bucket: "red_flags",
      reason_code: "suspiciously_low_price",
      text: `Cena ${formatCurrency(input.askingPrice)} wygląda podejrzanie nisko względem tej klasy części, więc bardziej rośnie ryzyko oferty niż sama atrakcyjność zakupu.`,
    });
  }

  return insights;
}

function buildCpuInsights(input: {
  parsed: ParsedOffer;
  askingPrice: number | null;
  gpuModel?: string | null;
}) {
  const cpu = getPart(input.parsed, "CPU");
  const insights: InsightDraft[] = [];

  if (!cpu) {
    insights.push({
      bucket: typeof input.askingPrice === "number" && input.askingPrice >= 2200 ? "red_flags" : "to_verify",
      reason_code: "cpu_missing",
      text: "Nie podano jasno modelu procesora, więc przy tej ofercie brakuje ważnego punktu odniesienia do uczciwej oceny zestawu.",
    });
    return insights;
  }

  if (!confidenceAtLeast(cpu.confidence, "medium")) {
    insights.push({
      bucket: "to_verify",
      reason_code: "cpu_low_confidence",
      text: "Model procesora jest wykryty z niską pewnością, więc warto go potwierdzić przed zakupem.",
    });
    return insights;
  }

  const cpuTier = getCpuTier(cpu.name);
  const gpuTier = getGpuTier(input.gpuModel);
  const price = input.askingPrice ?? 0;

  if (cpuTier <= 2 && price >= 2200) {
    insights.push({
      bucket: "red_flags",
      reason_code: "cpu_outdated_for_price",
      text: `Procesor wygląda już na dość stary albo niski klasowo jak na cenę całego zestawu, więc trudno traktować go jako mocny punkt tej oferty.`,
    });
    return insights;
  }

  if (cpuTier <= 3 && price >= 3200) {
    insights.push({
      bucket: "minuses",
      reason_code: "cpu_not_strong_for_price",
      text: "Sam procesor jest jeszcze użytkowy, ale przy tej cenie nie jest mocnym argumentem za zakupem.",
    });
  } else if (cpuTier >= 4) {
    insights.push({
      bucket: "positives",
      reason_code: "cpu_sensible",
      text: "Procesor wygląda sensownie do tej klasy zestawu i sam z siebie nie psuje propozycji.",
    });
  }

  if (gpuTier > 0 && isCpuGpuMismatch({ cpuModel: cpu.name, gpuModel: input.gpuModel })) {
    insights.push({
      bucket: price >= 3500 ? "red_flags" : "minuses",
      reason_code: "cpu_gpu_mismatch",
      text: "CPU i GPU nie wyglądają tu na idealnie zbalansowaną parę pod granie, więc warto uważać, czy cena nie zakłada zbyt dużo po stronie wydajności.",
    });
  }

  return insights;
}

function buildGpuInsights(input: {
  parsed: ParsedOffer;
  askingPrice: number | null;
  gpuValueCheck?: GpuValueCheck | null;
  priceRatio: number | null;
}) {
  const gpu = getPart(input.parsed, "GPU");
  const insights: InsightDraft[] = [];

  if (!gpu) {
    insights.push({
      bucket: typeof input.askingPrice === "number" && input.askingPrice >= 1600 ? "red_flags" : "to_verify",
      reason_code: "gpu_missing",
      text: "Nie podano dokładnego modelu karty graficznej, a przy gamingowym desktopie to jest kluczowa informacja.",
    });
    return insights;
  }

  if (!confidenceAtLeast(gpu.confidence, "medium")) {
    insights.push({
      bucket: "to_verify",
      reason_code: "gpu_low_confidence",
      text: "Model GPU jest wykryty z niską pewnością, więc bez jego potwierdzenia trudno uczciwie ocenić wartość całego zestawu.",
    });
    return insights;
  }

  if (input.gpuValueCheck?.gpu_position_for_price === "too_weak") {
    insights.push({
      bucket: "red_flags",
      reason_code: "gpu_too_weak_for_price",
      text: "Największy problem tej oferty wygląda na relację GPU do ceny całego PC: ta karta jest za nisko względem poziomu, którego zwykle oczekuje się za taką kwotę.",
    });
    return insights;
  }

  if (input.gpuValueCheck?.gpu_position_for_price === "borderline") {
    insights.push({
      bucket: "positives",
      reason_code: "gpu_sensible",
      text: "Karta sama w sobie nadal wygląda akceptowalnie dla używanego grania, więc nie ona jest tu największym problemem.",
    });
    insights.push({
      bucket: "minuses",
      reason_code: "gpu_borderline_for_price",
      text: "GPU samo w sobie jest jeszcze akceptowalne, ale przy tej cenie nie daje już szczególnie mocnego argumentu za zakupem.",
    });
  }

  if (input.gpuValueCheck?.gpu_position_for_price === "ok" || input.gpuValueCheck?.gpu_position_for_price === "strong") {
    insights.push({
      bucket: "positives",
      reason_code: "gpu_sensible",
      text: "Karta sama w sobie wygląda sensownie jak na klasę tego używanego zestawu.",
    });
  }

  if ((input.gpuValueCheck?.gpu_position_for_price === "ok" || input.gpuValueCheck?.gpu_position_for_price === "strong") && input.priceRatio && input.priceRatio > 1.15) {
    insights.push({
      bucket: "minuses",
      reason_code: "valuation_not_gpu",
      text: "Problemem tej oferty nie jest sam GPU, tylko ogólna wycena całego zestawu.",
    });
  }

  return insights;
}

function buildRamInsights(input: { parsed: ParsedOffer; askingPrice: number | null }) {
  const ram = getPart(input.parsed, "RAM");
  const insights: InsightDraft[] = [];

  if (!ram) {
    insights.push({
      bucket: "to_verify",
      reason_code: "ram_missing",
      text: "Brakuje jasnej informacji o pamięci RAM, więc warto potwierdzić pojemność i typ modułów.",
    });
    return insights;
  }

  const ramGb = ram.attributes?.ramGb ?? 0;

  if (!confidenceAtLeast(ram.confidence, "medium")) {
    insights.push({
      bucket: "to_verify",
      reason_code: "ram_low_confidence",
      text: "Pamięć RAM jest wykryta z niską pewnością, więc warto potwierdzić pojemność i układ kości.",
    });
    return insights;
  }

  if (ramGb > 0 && ramGb < 16) {
    insights.push({
      bucket: (input.askingPrice ?? 0) >= 1800 ? "red_flags" : "minuses",
      reason_code: "ram_too_low",
      text: `${ramGb} GB RAM to już słaby punkt takiego zestawu do grania.`,
    });
    return insights;
  }

  if (ramGb === 16) {
    if ((input.askingPrice ?? 0) >= 3500) {
      insights.push({
        bucket: "minuses",
        reason_code: "ram_only_16_for_price",
        text: "16 GB RAM nadal wystarcza do grania, ale przy tej cenie 32 GB wyglądałoby lepiej.",
      });
    } else {
      insights.push({
        bucket: "positives",
        reason_code: "ram_16_ok",
        text: "16 GB RAM nadal jest normalnym, akceptowalnym punktem wyjścia do grania.",
      });
    }
    return insights;
  }

  if (ramGb >= 32) {
    insights.push({
      bucket: "positives",
      reason_code: "ram_32_positive",
      text: "32 GB RAM to realny plus dla takiego zestawu i daje trochę więcej komfortu na przyszłość.",
    });
  }

  return insights;
}

function buildStorageInsights(input: { parsed: ParsedOffer; askingPrice: number | null }) {
  const storage = getPart(input.parsed, "DYSK");
  const insights: InsightDraft[] = [];
  const fullRaw = input.parsed.preprocessed.combined.raw;
  const storageLine = storage?.debug?.matchedLine ?? storage?.rawMatch ?? storage?.name ?? "";
  const raw = storage?.rawMatch ?? storage?.name ?? fullRaw;
  const storageClass = classifyStorage(raw);
  const storageLineClass = classifyStorage(storageLine || fullRaw);
  const sizeGb = storageSizeGbFromPart(storage);
  const genericDiskMention = /\b(240|250|256|480|500|512|960|1000|1024|1|2|4)\s*(gb|tb)\s*(?:dysk|drive)\b/i.test(fullRaw);
  const knownModel = Boolean(storage?.attributes?.storageKind) && normalize(input.parsed.preprocessed.combined.raw).match(/\b(samsung|crucial|kingston|wd|western digital|lexar|p3|p5|sn570|sn580|sn770|980 pro|970 evo|nm620|nv2|kc3000)\b/);

  if (!storage) {
    if (genericDiskMention || storageClass.isGenericDisk) {
      insights.push({
        bucket: "to_verify",
        reason_code: "storage_capacity_only",
        text: "Podano pojemność dysku, ale bez informacji czy to HDD, SATA SSD czy NVMe, więc opis jest zbyt ogólny.",
      });
    } else {
      insights.push({
        bucket: "to_verify",
        reason_code: "storage_missing",
        text: "Brakuje sensownej informacji o dysku, więc warto dopytać o pojemność i typ nośnika.",
      });
    }
    return insights;
  }

  if (genericDiskMention || storageLineClass.isGenericDisk) {
    insights.push({
      bucket: "to_verify",
      reason_code: "storage_capacity_only",
      text: "Podano pojemność dysku, ale bez informacji czy to HDD, SATA SSD czy NVMe, więc opis jest zbyt ogólny.",
    });
    return insights;
  }

  if (!confidenceAtLeast(storage.confidence, "medium")) {
    insights.push({
      bucket: "to_verify",
      reason_code: "storage_low_confidence",
      text: "Dysk jest wykryty z niską pewnością, więc warto potwierdzić pojemność i typ nośnika.",
    });
    return insights;
  }

  if (storageClass.isGenericDisk) {
    insights.push({
      bucket: "to_verify",
      reason_code: "storage_type_missing",
      text: "Podano pojemność dysku, ale bez informacji czy to HDD, SATA SSD czy NVMe, więc opis jest zbyt ogólny.",
    });
    return insights;
  }

  if (storageClass.isNvme && sizeGb >= 1000) {
    insights.push({
      bucket: "positives",
      reason_code: "storage_nvme_ok",
      text: `Podano ${sizeGb >= 1000 ? `${Math.round(sizeGb / 1000)} TB` : `${sizeGb} GB`} NVMe, więc podstawowy format dysku wygląda sensownie.`,
    });
  } else if (storageClass.isSsdOnly) {
    insights.push({
      bucket: "to_verify",
      reason_code: "storage_interface_missing",
      text: "Podano SSD, ale bez informacji czy to SATA czy NVMe, więc trudno dokładniej ocenić klasę dysku.",
    });
  } else if (storageClass.isHdd) {
    insights.push({
      bucket: "minuses",
      reason_code: "storage_hdd_only",
      text: "Dysk wygląda raczej na HDD, więc przy gamingowym PC nie jest to atrakcyjny punkt zestawu.",
    });
  }

  if (sizeGb > 0 && sizeGb < 500 && (input.askingPrice ?? 0) >= 1600) {
    insights.push({
      bucket: "minuses",
      reason_code: "storage_small_for_price",
      text: "Pojemność dysku wygląda skromnie jak na tę cenę całego zestawu.",
    });
  }

  if (!knownModel && storageClass.hasType) {
    insights.push({
      bucket: "to_verify",
      reason_code: "storage_exact_model_missing",
      text: "Podano pojemność i typ dysku, ale bez dokładnego modelu, więc trudniej ocenić jego realną jakość.",
    });
  }

  return insights;
}

function buildPsuInsights(input: { parsed: ParsedOffer; askingPrice: number | null; psuAssessment?: PsuAssessment }) {
  const psu = getPart(input.parsed, "PSU");
  const insights: InsightDraft[] = [];
  const knownBrand = hasKnownPsuBrand(input.parsed);

  if (!psu) {
    insights.push({
      bucket: (input.askingPrice ?? 0) >= 2200 ? "red_flags" : "to_verify",
      reason_code: "psu_missing",
      text: "Nie podano dokładnego modelu zasilacza, więc trudno ocenić jego realną jakość i bezpieczeństwo.",
    });
    return insights;
  }

  if (input.psuAssessment?.status === "too_weak") {
    insights.push({
      bucket: "red_flags",
      reason_code: "psu_too_weak",
      text: input.psuAssessment.summary,
    });
  } else if (input.psuAssessment?.status === "borderline") {
    insights.push({
      bucket: "minuses",
      reason_code: "psu_borderline",
      text: input.psuAssessment.summary,
    });
  }

  if (!knownBrand) {
    insights.push({
      bucket: (input.askingPrice ?? 0) >= 2500 ? "red_flags" : "to_verify",
      reason_code: "psu_model_missing",
      text: `Podano ${psu.name}, ale bez marki i modelu zasilacza, więc nie da się uczciwie ocenić jakości tego elementu.`,
    });
  } else {
    insights.push({
      bucket: "positives",
      reason_code: "psu_known",
      text: "Zasilacz jest opisany konkretniej niż zwykłe samo hasło z mocą, więc daje trochę więcej zaufania do zestawu.",
    });
  }

  return insights;
}

function buildMotherboardInsights(input: { parsed: ParsedOffer; motherboardTier?: ReturnType<typeof buildNormalizedOfferForScoring>["motherboardTier"]; askingPrice: number | null }) {
  const board = getPart(input.parsed, "PŁYTA");
  const insights: InsightDraft[] = [];

  if (!board) {
    insights.push({
      bucket: "to_verify",
      reason_code: "motherboard_missing",
      text: "Brakuje konkretu o płycie głównej, więc warto dopytać o model albo przynajmniej chipset.",
    });
    return insights;
  }

  if (!confidenceAtLeast(board.confidence, "medium")) {
    insights.push({
      bucket: "to_verify",
      reason_code: "motherboard_low_confidence",
      text: "Model płyty głównej jest wykryty z niską pewnością, więc warto go potwierdzić.",
    });
    return insights;
  }

  if (input.motherboardTier === "good" || input.motherboardTier === "mid") {
    insights.push({
      bucket: "positives",
      reason_code: "motherboard_sensible",
      text: "Płyta wygląda sensownie do platformy i nie wygląda na przypadkową najtańszą bazę.",
    });
    return insights;
  }

  if (input.motherboardTier === "basic" || input.motherboardTier === "very_basic") {
    insights.push({
      bucket: "minuses",
      reason_code: "motherboard_basic",
      text: "Płyta wygląda na raczej budżetową bazę, a nie mocny punkt zestawu.",
    });
  }

  return insights;
}

function buildEvidenceInsights(input: {
  parsed: ParsedOffer;
  hasWarrantyInfo?: boolean;
  hasInteriorPhotos?: boolean;
  hasHealthProof?: boolean;
  hasBenchmarks?: boolean;
  suspiciousUrgency?: boolean;
  titleDescriptionMismatch?: boolean;
  listingQuality?: string;
  gamingBaitStyle?: boolean;
  askingPrice: number | null;
  gpuValueCheck?: GpuValueCheck | null;
}) {
  const insights: InsightDraft[] = [];

  if (input.titleDescriptionMismatch) {
    insights.push({
      bucket: "red_flags",
      reason_code: "title_description_mismatch",
      text: "Tytuł i opis nie składają się w jedną spójną historię o kluczowych częściach, więc oferta wymaga ostrożności.",
    });
  }

  if (input.suspiciousUrgency) {
    insights.push({
      bucket: "minuses",
      reason_code: "suspicious_urgency",
      text: "Opis próbuje pchać szybką decyzję, co samo w sobie nie pomaga w zaufaniu do oferty.",
    });
  }

  if ((input.listingQuality ?? "poor") === "poor") {
    insights.push({
      bucket: "minuses",
      reason_code: "poor_listing_quality",
      text: "Opis jest raczej skromny i mało techniczny, więc sam z siebie nie buduje dużego zaufania.",
    });
  }

  if (!input.hasInteriorPhotos) {
    insights.push({
      bucket: "to_verify",
      reason_code: "missing_interior_photos",
      text: "Warto poprosić o zdjęcie wnętrza obudowy i przewodów, bo to ułatwia ocenę stanu zestawu.",
    });
  }

  if (!input.hasHealthProof) {
    insights.push({
      bucket: "to_verify",
      reason_code: "missing_health_proof",
      text: "Warto poprosić o SMART dysku oraz temperatury CPU i GPU pod obciążeniem.",
    });
  }

  if (!input.hasBenchmarks && (input.gpuValueCheck?.gpu_position_for_price === "too_weak" || (input.askingPrice ?? 0) >= 2500)) {
    insights.push({
      bucket: "to_verify",
      reason_code: "missing_benchmarks",
      text: "Warto poprosić o krótki benchmark albo test obciążeniowy, żeby zobaczyć jak ten zestaw działa w praktyce.",
    });
  }

  if (!input.hasWarrantyInfo) {
    insights.push({
      bucket: "to_verify",
      reason_code: "missing_warranty_or_origin",
      text: "Warto dopytać o pochodzenie sprzętu, dowód zakupu i ewentualną gwarancję.",
    });
  }

  if (input.gamingBaitStyle && input.gpuValueCheck?.gpu_position_for_price === "too_weak") {
    insights.push({
      bucket: "red_flags",
      reason_code: "gaming_bait_weak_build",
      text: "Oferta jest opisana mocno gamingowo, ale poziom GPU nie broni tego przekazu przy tej cenie.",
    });
  }

  return insights;
}

function buildNextSteps(insights: CheckerInsights, sensibleBuyPrice: number | null) {
  const steps: string[] = [];
  const hasReason = (code: string) =>
    Object.values(insights).some((bucket) => bucket.some((item) => item.reason_code === code));

  if (typeof sensibleBuyPrice === "number" && hasReason("overall_overpriced")) {
    steps.push(`Jeśli chcesz to brać, negocjuj raczej do około ${formatCurrency(sensibleBuyPrice)}.`);
  }

  if (hasReason("psu_missing") || hasReason("psu_model_missing")) {
    steps.push("Poproś o dokładny model zasilacza i zdjęcie jego naklejki.");
  }

  if (hasReason("storage_type_missing") || hasReason("storage_exact_model_missing") || hasReason("storage_missing")) {
    steps.push("Poproś o dokładny model dysku i screen z jego parametrami.");
  }

  if (hasReason("missing_health_proof")) {
    steps.push("Poproś o SMART dysku oraz temperatury CPU i GPU pod obciążeniem.");
  }

  if (hasReason("missing_interior_photos")) {
    steps.push("Poproś o zdjęcie wnętrza obudowy i przewodów.");
  }

  if (hasReason("missing_benchmarks")) {
    steps.push("Poproś o krótki benchmark albo film z działania sprzętu.");
  }

  if (hasReason("suspiciously_low_price")) {
    steps.push("Przy takiej cenie trzymaj się odbioru osobistego i nie wpłacaj zaliczki.");
  }

  if (steps.length === 0) {
    steps.push("Przed zakupem warto jeszcze sprawdzić temperatury, kulturę pracy i stan dysku.");
  }

  return steps.slice(0, 5);
}

function buildVerdictSummary(input: {
  profitabilityLabel: NonNullable<OfferScoringResult["verdictLabel"]>;
  riskLabel: OfferScoringResult["riskLabel"];
  askingPrice: number | null;
  estimatedValueMin: number | null;
  estimatedValueMax: number | null;
  insights: CheckerInsights;
}) {
  const hasRedFlag = input.insights.red_flags.length > 0;
  const hasStrongValuationProblem = input.insights.red_flags.some((item) => item.reason_code === "overall_overpriced");
  const hasSuspiciousPrice = input.insights.red_flags.some((item) => item.reason_code === "suspiciously_low_price");
  const hasGpuPriceProblem = input.insights.red_flags.some((item) => item.reason_code === "gpu_too_weak_for_price");

  if (hasStrongValuationProblem && typeof input.askingPrice === "number" && typeof input.estimatedValueMax === "number") {
    return `Za ${formatCurrency(input.askingPrice)} ten zestaw wypada zbyt drogo względem sensownego zakresu ${formatCurrency(
      input.estimatedValueMin ?? input.estimatedValueMax,
    )}–${formatCurrency(input.estimatedValueMax)}.`;
  }

  if (hasSuspiciousPrice && typeof input.askingPrice === "number") {
    return `Cena ${formatCurrency(input.askingPrice)} wygląda bardzo atrakcyjnie, ale ryzyko oferty jest na tyle wysokie, że bez twardej weryfikacji lepiej nie kupować w ciemno.`;
  }

  if (hasGpuPriceProblem) {
    return "Największy problem tej oferty to relacja GPU do ceny całego zestawu, a nie pojedynczy detal w specyfikacji.";
  }

  if (input.profitabilityLabel === "Bierz" && input.riskLabel === "Niskie") {
    return "Całość wygląda dość sensownie jak na rynek używany: konfiguracja broni się, a cena nie odjeżdża od realiów.";
  }

  if (input.profitabilityLabel === "Negocjuj") {
    return "To nie jest zła oferta, ale cena albo opis proszą się jeszcze o doprecyzowanie i negocjację.";
  }

  if (input.profitabilityLabel === "Raczej nie" || hasRedFlag) {
    return "Da się tu wskazać pojedyncze plusy, ale całość nie składa się w szczególnie przekonujący zakup.";
  }

  return "Oferta nie wygląda przekonująco, bo cena i poziom zaufania do opisu nie układają się w sensowny zakup.";
}

export function buildCheckerReasoning(input: {
  parsed: ParsedOffer;
  scoring: OfferScoringResult;
  heuristics: CheckerHeuristics;
  psuAssessment?: PsuAssessment;
  gpuValueCheck?: GpuValueCheck | null;
  title?: string;
  description?: string;
  url?: string;
}): CheckerReasoningResult {
  const normalized = buildNormalizedOfferForScoring({
    parsed: input.parsed,
    title: input.title,
    description: input.description,
    url: input.url,
    detectedRedFlags: input.heuristics.redFlags,
  });
  const insights = createBuckets();
  const estimatedValueMin = input.scoring.fairValueRange?.min ?? null;
  const estimatedValueMax = input.scoring.fairValueRange?.max ?? null;
  const sensibleBuyPrice = input.scoring.summary.maxReasonablePrice ?? estimatedValueMax;

  [
    ...buildValuationInsight({
      askingPrice: normalized.askingPrice,
      estimatedValueMin,
      estimatedValueMax,
      gpuValueCheck: input.gpuValueCheck,
      profitabilityLabel: input.scoring.profitabilityLabel ?? "Negocjuj",
      suspiciouslyLowPrice: input.heuristics.suspiciouslyLowPrice,
    }),
    ...buildCpuInsights({
      parsed: input.parsed,
      askingPrice: normalized.askingPrice,
      gpuModel: normalized.gpuModel,
    }),
    ...buildGpuInsights({
      parsed: input.parsed,
      askingPrice: normalized.askingPrice,
      gpuValueCheck: input.gpuValueCheck,
      priceRatio: input.scoring.priceRatio ?? null,
    }),
    ...buildRamInsights({
      parsed: input.parsed,
      askingPrice: normalized.askingPrice,
    }),
    ...buildStorageInsights({
      parsed: input.parsed,
      askingPrice: normalized.askingPrice,
    }),
    ...buildPsuInsights({
      parsed: input.parsed,
      askingPrice: normalized.askingPrice,
      psuAssessment: input.psuAssessment,
    }),
    ...buildMotherboardInsights({
      parsed: input.parsed,
      motherboardTier: normalized.motherboardTier,
      askingPrice: normalized.askingPrice,
    }),
    ...buildEvidenceInsights({
      parsed: input.parsed,
      hasWarrantyInfo: normalized.hasWarrantyInfo,
      hasInteriorPhotos: normalized.hasInteriorPhotos,
      hasHealthProof: normalized.hasHealthProof,
      hasBenchmarks: normalized.hasBenchmarks,
      suspiciousUrgency: normalized.suspiciousUrgency,
      titleDescriptionMismatch: normalized.titleDescriptionMismatch,
      listingQuality: normalized.listingQuality,
      gamingBaitStyle: normalized.gamingBaitStyle,
      askingPrice: normalized.askingPrice,
      gpuValueCheck: input.gpuValueCheck,
    }),
  ].forEach((draft) => pushInsight(insights, draft));

  const keyTakeaways = uniqueStrings([
    ...insights.red_flags.map((item) => item.text),
    ...insights.minuses.map((item) => item.text),
    ...insights.positives.map((item) => item.text),
  ]).slice(0, 4);

  const nextSteps = buildNextSteps(insights, sensibleBuyPrice ?? null);
  const verdictLabel = input.scoring.profitabilityLabel ?? "Negocjuj";
  const verdictSummary = buildVerdictSummary({
    profitabilityLabel: verdictLabel,
    riskLabel: input.scoring.riskLabel ?? "Średnie",
    askingPrice: normalized.askingPrice,
    estimatedValueMin,
    estimatedValueMax,
    insights,
  });

  return {
    verdictLabel,
    verdictSummary,
    estimatedValueMin,
    estimatedValueMax,
    sensibleBuyPrice: sensibleBuyPrice ?? null,
    insights,
    nextSteps,
    keyTakeaways,
  };
}
