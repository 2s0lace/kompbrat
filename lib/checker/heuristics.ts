import type { CheckerHeuristics, GpuValueCheck, ParsedOffer, PsuAssessment } from "@/types/checker";
import type { SearchResult } from "@/types/search";
import type { BudgetGuideline } from "@/lib/value-guidelines";
import { textMatchesAnyTier } from "@/lib/value-guidelines";

const suspiciousTerms = ["brak gwarancji", "bez zwrotu", "po koparce", "artefakty", "do sprawdzenia", "nie testowałem"];
const vagueMarketingTerms = ["mega mocny", "petarda", "ultra gaming", "topowy", "igła", "jak nowy"];

export function extractHeuristics(input: {
  parsed: ParsedOffer;
  price?: number;
  estimatedMarketValue?: number;
  estimatedMarketValueConfidence?: "high" | "medium" | "low";
  valuationNote?: string;
  guideline?: BudgetGuideline | null;
  searchResults?: SearchResult[];
  psuAssessment?: PsuAssessment;
  gpuValueCheck?: GpuValueCheck | null;
}) {
  const redFlags: string[] = [];
  const notes: string[] = [];
  const text = input.parsed.normalizedText;
  const effectivePrice = input.price ?? input.parsed.price;
  const searchResults = input.searchResults ?? [];
  const suspiciouslyLowPrice =
    typeof effectivePrice === "number" &&
    typeof input.estimatedMarketValue === "number" &&
    effectivePrice <= Math.round(input.estimatedMarketValue * 0.62);

  suspiciousTerms.forEach((term) => {
    if (text.includes(term)) {
      redFlags.push(`Opis zawiera frazę ostrzegawczą: "${term}".`);
    }
  });

  if (!effectivePrice) {
    redFlags.push("Brakuje sensownej ceny, więc ocena jest mniej pewna.");
  }

  const gpu = input.parsed.detectedParts.find((part) => part.type === "GPU");
  const cpu = input.parsed.detectedParts.find((part) => part.type === "CPU");
  const ram = input.parsed.detectedParts.find((part) => part.type === "RAM");
  const storagePart = input.parsed.detectedParts.find((part) => part.type === "DYSK");
  const hasDetectedCpu = input.parsed.detectedParts.some((part) => part.type === "CPU" && part.confidence !== "low");
  const hasDetectedGpu = input.parsed.detectedParts.some((part) => part.type === "GPU" && part.confidence !== "low");

  if (!input.parsed.detectedParts.some((part) => part.type === "PSU")) {
    redFlags.push("Brak modelu zasilacza. To nadal jedna z najczęstszych min w gotowych zestawach.");
  }

  if (input.psuAssessment?.status === "too_weak") {
    redFlags.push("Moc zasilacza wygląda zbyt słabo względem wykrytego CPU i GPU.");
  }

  if (input.psuAssessment?.status === "borderline") {
    notes.push("Zasilacz wygląda na konfigurację na styk, więc zapas mocy nie daje dużego komfortu.");
  }

  if (input.psuAssessment?.warning) {
    redFlags.push(input.psuAssessment.warning);
  }

  if (input.gpuValueCheck) {
    redFlags.push(...input.gpuValueCheck.redFlags);
    notes.push(...input.gpuValueCheck.notes);

    if (input.gpuValueCheck.gpu_position_for_price === "too_weak") {
      redFlags.push("Największy problem tej oferty to po prostu zbyt słabe GPU względem ceny całego używanego PC.");
    }

    if (input.gpuValueCheck.gpu_position_for_price === "borderline") {
      notes.push("GPU jest co najwyżej na granicy sensu dla tej ceny, więc reszta platformy musi naprawdę bronić ofertę.");
    }
  }

  const storage = storagePart?.name.toLowerCase() ?? "";
  if (storage.includes("120") || storage.includes("128") || storage.includes("240") || storage.includes("250")) {
    redFlags.push("Dysk jest bardzo mały jak na obecne realia.");
  }

  if (vagueMarketingTerms.some((term) => text.includes(term)) && input.parsed.detectedParts.length < 4) {
    redFlags.push("Opis jest bardziej marketingowy niż techniczny, a konkretów nadal jest mało.");
  }

  if (input.parsed.detectedParts.filter((part) => part.type !== "CENA").length < 3) {
    redFlags.push("Za mało twardych konkretów w specyfikacji, żeby spokojnie zaufać tej ofercie.");
  }

  if (!hasDetectedCpu) {
    notes.push("Brakuje jasnego modelu procesora.");
  }

  if (!hasDetectedGpu) {
    notes.push("Brakuje jasnego modelu karty graficznej.");
  }

  const lowConfidenceParts = input.parsed.detectedParts.filter(
    (part) => part.type !== "CENA" && part.confidence === "low",
  );

  if (lowConfidenceParts.length > 0) {
    notes.push("Część wykrytych komponentów ma niską pewność, więc wycena jest bardziej orientacyjna niż twarda.");
  }

  if (input.guideline) {
    if (gpu && textMatchesAnyTier(gpu.name, input.guideline.gpuRules.bannedTier)) {
      redFlags.push("Wykryte GPU wygląda słabo jak na ten budżet i wpada w tier, którego lepiej już nie brać jako głównego wyboru.");
    }

    if (
      gpu &&
      !textMatchesAnyTier(gpu.name, [
        ...input.guideline.gpuRules.minimumTier,
        ...input.guideline.gpuRules.preferredTier,
        ...(input.guideline.gpuRules.acceptableTier ?? []),
      ])
    ) {
      notes.push("GPU nie wygląda jak oczywisty fit do sensownego tieru dla tego budżetu, więc trzeba mocniej pilnować ceny całości.");
    }

    if (cpu && textMatchesAnyTier(cpu.name, input.guideline.cpuRules.bannedTier ?? [])) {
      redFlags.push("Wykryty CPU wygląda zbyt słabo albo zbyt stary jak na ten bracket budżetowy.");
    }

    if (ram) {
      const ramGb = Number(ram.name.match(/(\d+)/)?.[1] ?? 0);
      if (ramGb > 0 && ramGb < input.guideline.minimumStandards.ramGb) {
        redFlags.push(`RAM wypada poniżej sensownego minimum ${input.guideline.minimumStandards.ramGb} GB dla tego budżetu.`);
      }
    }

    if (storagePart) {
      const storageMatch = storagePart.name.match(/(\d+)\s*(TB|GB)/i);
      const storageGb = storageMatch ? Number(storageMatch[1]) * (storageMatch[2].toUpperCase() === "TB" ? 1000 : 1) : 0;
      if (storageGb > 0 && storageGb < input.guideline.minimumStandards.storageGb) {
        redFlags.push(`Dysk wypada poniżej sensownego minimum ${input.guideline.minimumStandards.storageGb} GB dla tego budżetu.`);
      }
    }

    const filledPricingNotes = input.guideline.pricingNotes.filter(Boolean);
    if (filledPricingNotes.length > 0) {
      notes.push(`Guardrail budżetowy: ${filledPricingNotes[0]}.`);
    }

    if (input.guideline.budgetSplitNote) {
      notes.push(input.guideline.budgetSplitNote);
    }
  }

  if (typeof effectivePrice === "number" && typeof input.estimatedMarketValue === "number") {
    const ratio = input.estimatedMarketValue / Math.max(effectivePrice, 1);

    if (ratio >= 1.35) {
      notes.push(`Na papierze cena wygląda bardzo mocno względem podanych części. Szacunkowa wartość zestawu to okolice ${input.estimatedMarketValue} zł.`);
    } else if (ratio <= 0.8) {
      notes.push(`Cena wygląda wysoko względem tego, co da się wyciągnąć z podanej specyfikacji. Szacunkowa wartość zestawu to okolice ${input.estimatedMarketValue} zł.`);
    }
  }

  if (input.estimatedMarketValueConfidence === "low") {
    notes.push("Traktuj tę wycenę jako ostrożny floor, a nie precyzyjną wartość rynkową.");
  }

  if (input.valuationNote) {
    notes.push("Estimator musiał skorygować wycenę, bo surowy wynik był niewiarygodny względem wykrytych podzespołów.");
  }

  if (searchResults.length > 0) {
    notes.push("Dodałem szybki kontekst z wyszukiwarki, ale przy ofertach używanych dalej najważniejszy jest stan sprzętu i uczciwość sprzedawcy.");
  }

  if (suspiciouslyLowPrice) {
    redFlags.push("Cena jest podejrzanie niska względem wartości podanych części. Możliwy scam albo ukryty problem ze sprzętem.");
    redFlags.push("Przy takiej cenie celuj w odbiór osobisty i nie opieraj się tylko na opisie.");
    redFlags.push("Poproś o benchmarki, zdjęcia podzespołów i screeny z temperatur oraz SMART dysku.");
    redFlags.push("Nie wpłacaj zaliczki, jeśli sprzedawca nie daje twardych dowodów, że sprzęt faktycznie istnieje i działa.");
  }

  return {
    redFlags: Array.from(new Set(redFlags)),
    notes: Array.from(new Set(notes)),
    suspiciouslyLowPrice,
  } satisfies CheckerHeuristics;
}
