import { builderSystemPrompt } from "@/lib/ai/builder-system-prompt";
import { checkerSystemPrompt } from "@/lib/ai/checker-system-prompt";
import type { ComponentPriceSnapshot, ScoredBuildBasket } from "@/lib/builder/types";
import type { BudgetGuideline } from "@/lib/value-guidelines";
import type { GpuValueCheck, PsuAssessment } from "@/types/checker";

export const prompts = {
  builder: builderSystemPrompt,
  checker: checkerSystemPrompt,
};

function serializeBasket(basket: ScoredBuildBasket) {
  return {
    id: basket.id,
    title: basket.title,
    score: basket.score,
    estimatedTotal: basket.estimatedTotal,
    marketMode: basket.marketMode,
    breakdown: basket.breakdown,
    reasons: basket.reasons,
    notes: basket.notes,
    warnings: basket.warnings,
    parts: basket.parts.map((part) => ({
      type: part.type,
      name: part.name,
      estimatedPrice: part.estimatedPrice,
    })),
  };
}

function serializeSnapshots(snapshots: ComponentPriceSnapshot[]) {
  return snapshots.map((snapshot) => ({
    key: snapshot.key,
    label: snapshot.label,
    componentType: snapshot.componentType,
    medianPrice: snapshot.medianPrice,
    trimmedMeanPrice: snapshot.trimmedMeanPrice,
    bestGuessPrice: snapshot.bestGuessPrice,
    sampleCount: snapshot.sampleCount,
    confidence: snapshot.confidence,
  }));
}

export function buildBuilderUserPrompt(input: {
  prompt: string;
  budget?: number;
  useCase: string;
  marketMode: string;
  selectedMode: "new" | "used" | "mixed";
  feasibleInSelectedMode: boolean;
  modeMessage?: string;
  marketContext: unknown;
  priceSnapshots: ComponentPriceSnapshot[];
  winningBasket: ScoredBuildBasket;
  runnerUps: ScoredBuildBasket[];
  policyReason: string;
  guideline?: ReturnType<typeof serializeGuideline>;
  alternative?: {
    buildName: string;
    recommendationMode: "new" | "used" | "mixed";
    summary: string;
  };
  modeScores: Partial<Record<"new" | "used" | "mixed", number>>;
}) {
  return `
Masz już policzone koszyki KOMPBRAT. Nie projektuj nowego buildu od zera.

Brief użytkownika:
- budżet: ${typeof input.budget === "number" ? `${input.budget} zł` : "brak pewnego budżetu"}
- zastosowanie: ${input.useCase}
- tryb rynku: ${input.marketMode}
- prompt użytkownika: ${input.prompt}

Policy layer:
- wybrany przez użytkownika tryb: ${input.selectedMode}
- czy wybrany tryb się obronił: ${input.feasibleInSelectedMode ? "tak" : "nie"}
- komunikat trybu: ${input.modeMessage ?? "brak"}
- powód wyboru: ${input.policyReason}
- score per tryb: ${JSON.stringify(input.modeScores)}
- alternatywa: ${JSON.stringify(input.alternative ?? null)}

Guideline guardrails:
${JSON.stringify(input.guideline ?? null, null, 2)}

Market context z wyszukiwarki:
${JSON.stringify(input.marketContext, null, 2)}

Mediany / trimmed mean per część:
${JSON.stringify(serializeSnapshots(input.priceSnapshots), null, 2)}

Zwycięski koszyk:
${JSON.stringify(serializeBasket(input.winningBasket), null, 2)}

Runner-upy do porównania:
${JSON.stringify(input.runnerUps.map(serializeBasket), null, 2)}

Zwróć tylko JSON w wymaganym formacie i przepisz parts ze zwycięskiego koszyka.
Jeśli jest alternatywa, wpisz ją zwięźle w polu alternative.
`.trim();
}

export function buildCheckerUserPrompt(input: {
  title: string;
  description: string;
  price?: number;
  url?: string;
  verdict: string;
  valueScore: number;
  riskScore: number;
  estimatedMarketValue?: number;
  estimatedMarketValueConfidence?: "high" | "medium" | "low";
  valuationNote?: string;
  detectedParts: Array<{ type: string; name: string; confidence: string; source: string }>;
  redFlags: string[];
  notes: string[];
  psuAssessment?: PsuAssessment;
  gpuValueCheck?: GpuValueCheck | null;
  guideline?: ReturnType<typeof serializeGuideline>;
  searchContext?: string[];
}) {
  const hasDetectedCpu = input.detectedParts.some((part) => part.type === "CPU" && part.confidence !== "low");
  const hasDetectedGpu = input.detectedParts.some((part) => part.type === "GPU" && part.confidence !== "low");
  const bannedPhrases: string[] = [];

  if (hasDetectedCpu) {
    bannedPhrases.push("brakuje jasnego modelu procesora");
  }

  if (hasDetectedGpu) {
    bannedPhrases.push("brakuje jasnego modelu karty graficznej");
    bannedPhrases.push("brakuje jasnego modelu karty");
  }

  return `
Tytuł: ${input.title}
Cena: ${typeof input.price === "number" ? `${input.price} zł` : "brak pewnej ceny"}
URL: ${input.url || "brak"}
Opis:
${input.description}

Wykryte części heurystycznie:
${JSON.stringify(input.detectedParts, null, 2)}

Policzony wynik checkera:
- verdict: ${input.verdict}
- value score: ${input.valueScore}/100
- risk score: ${input.riskScore}/100
- szacowana wartość zestawu: ${typeof input.estimatedMarketValue === "number" ? `${input.estimatedMarketValue} zł` : "brak pewnej wyceny"}
- pewność wyceny: ${input.estimatedMarketValueConfidence ?? "brak"}
- uwaga estimatora: ${input.valuationNote ?? "brak"}

Wstępne red flagi heurystyczne:
${JSON.stringify(input.redFlags, null, 2)}

Notatki heurystyczne:
${JSON.stringify(input.notes, null, 2)}

Ocena PSU policzona w kodzie:
${JSON.stringify(input.psuAssessment ?? null, null, 2)}

GPU sanity check policzony w kodzie:
${JSON.stringify(input.gpuValueCheck ?? null, null, 2)}

Guideline guardrails:
${JSON.stringify(input.guideline ?? null, null, 2)}

Kontekst z wyszukiwarki:
${JSON.stringify(input.searchContext ?? [], null, 2)}

Guardrails komentarza:
- piszesz komentarz na podstawie detectedParts, redFlags i notes, nie na podstawie samego surowego opisu
- redFlags traktuj jako twarde czerwone flagi, notes jako mieszankę minusów, rzeczy do sprawdzenia i plusów z policzonego reasoningu
- jeśli CPU lub GPU są wykryte z confidence medium/high, nie pisz, że ich brakuje
- zakazane frazy dla tego case'u: ${JSON.stringify(bannedPhrases)}
- jeśli zestaw jest stary, ale kompletny, komentuj go jako starszy budżetowy zestaw, a nie jako niepełny
- jeśli problemem jest cena całego zestawu, krytykuj wycenę całego PC, a nie zmyślony problem z CPU albo GPU
- jeśli coś wynika z niskiej pewności parsera, opisz to jako rzecz do sprawdzenia, a nie twardą wadę
- dla starych budżetowych zestawów akcentuj: starszy sprzęt, lżejsze granie, cena i stan, model zasilacza
- jeśli oferta jest podejrzanie tania, podbij ryzyko scamu zamiast pisać, że zestaw jest niepełny
- jeśli jest policzona ocena PSU, traktuj ją jako źródło prawdy i nie wymyślaj własnej liczby watów
- możesz ją opisać po ludzku, ale nie zmieniaj jej logiki
- jeśli gpuValueCheck mówi, że GPU jest za słabe dla ceny całego używanego gamingowego PC, traktuj to jako twardy sygnał ostrzegawczy
- nie próbuj bronić słabego GPU obudową, RGB, chłodzeniem, Windowsem ani "gratisami"
- oceniasz cały desktop gamingowy używany, ale GPU ma priorytet jako filtr anty-przepłaceniowy

Few-shot examples:
1. Stary, ale kompletny budżetowy zestaw
Input:
- detectedParts: CPU Ryzen 5 1600, GPU GTX 1060 6GB, RAM 16 GB, SSD 512 GB
- verdict: średnia
- valueScore: 58
- riskScore: 34
Good summary:
"To już starszy zestaw, ale nie wygląda na niepełny. Nada się do lżejszego grania i starszych tytułów, a tutaj naprawdę kluczowe są cena, stan i konkretny model zasilacza."

2. Oferta niepełna i chaotyczna
Input:
- detectedParts: RAM 16 GB, SSD 512 GB
- verdict: średnia
- valueScore: 41
- riskScore: 61
Good summary:
"Opis jest chaotyczny i nadal brakuje twardych konkretów o CPU i GPU, więc trudno uczciwie wycenić całość. Tu bardziej niż marketing liczą się dokładne modele podzespołów."

3. Bardzo dobra i podejrzanie tania okazja
Input:
- detectedParts: Ryzen 5 9600, RTX 4070, 32 GB DDR5, B650, 1 TB SSD
- verdict: podejrzanie dobra
- valueScore: 96
- riskScore: 88
Good summary:
"Na papierze wygląda to jak świetna okazja, bo części są dużo mocniejsze niż sugeruje cena. Problem w tym, że taka różnica pachnie scamem albo ukrytym problemem, więc bez odbioru osobistego, benchmarków i zdjęć bym nie ryzykował."

4. Oferta przepłacona
Input:
- detectedParts: Ryzen 5 3600, GTX 1660 SUPER, 16 GB RAM, 500 GB SSD
- verdict: nieopłacalna
- valueScore: 24
- riskScore: 28
Good summary:
"Sam zestaw jest spójny, ale cena po prostu odjechała od realnej wartości tych części. To nie wygląda na tragedię techniczną, tylko na zwykłe przepłacenie za starszą platformę."

5. Sensowna średnia oferta
Input:
- detectedParts: i5-12400F, RTX 3060, 16 GB RAM, 1 TB NVMe, B660
- verdict: dobra okazja
- valueScore: 71
- riskScore: 36
Good summary:
"To wygląda na sensowną, dość uczciwie wycenioną ofertę bez wielkiego wow, ale też bez oczywistej miny na starcie. Taki zestaw ma sens, jeśli stan sprzętu i zasilacz faktycznie się zgadzają."

Nie zmieniaj policzonego werdyktu i score'ów bez bardzo mocnego powodu.
Masz głównie doprecyzować summary i betterAlternative po polsku.
`.trim();
}

function serializeGuideline(guideline: BudgetGuideline | null | undefined) {
  if (!guideline) {
    return null;
  }

  return {
    marketPreference: guideline.marketPreference,
    realisticRange: guideline.realisticRange,
    summary: guideline.summary,
    budgetSplitNote: guideline.budgetSplitNote,
    allocationPriorities: guideline.allocationPriorities,
    gpuRules: guideline.gpuRules,
    cpuRules: guideline.cpuRules,
    minimumStandards: guideline.minimumStandards,
    pricingNotes: guideline.pricingNotes.filter(Boolean),
    goodExamples: guideline.goodExamples.filter(Boolean),
    badExamples: guideline.badExamples.filter(Boolean),
    llmInstructions: guideline.llmInstructions.filter(Boolean),
  };
}
