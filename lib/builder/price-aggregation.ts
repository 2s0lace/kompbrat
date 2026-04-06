import type { ComponentPriceSnapshot, MarketQueryDefinition } from "@/lib/builder/types";
import type { GpuMarketContext, SearchResult, TavilyExtractItem } from "@/types/search";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}

function trimmedMean(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const trimCount = sorted.length >= 5 ? Math.floor(sorted.length * 0.2) : 0;
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount || sorted.length);
  const finalValues = trimmed.length > 0 ? trimmed : sorted;
  const sum = finalValues.reduce((accumulator, value) => accumulator + value, 0);

  return Math.round(sum / finalValues.length);
}

function extractPrices(text: string) {
  const prices: number[] = [];
  const normalized = text.replace(/\u00a0/g, " ");
  const matches = normalized.match(/\b\d{2,5}(?:[\s.]\d{3})?(?:,\d{2})?\s?(?:zł|zl|pln)\b/gi) ?? [];

  for (const match of matches) {
    const value = Number(match.replace(/[^\d]/g, ""));
    if (Number.isFinite(value) && value >= 50 && value <= 20000) {
      prices.push(value);
    }
  }

  return prices;
}

function filterRelevantPrices(prices: number[], referencePrice: number) {
  const min = Math.round(referencePrice * 0.45);
  const max = Math.round(referencePrice * 1.8);

  return prices.filter((price) => price >= min && price <= max);
}

function collectTextSamples(result: SearchResult, extracted: TavilyExtractItem | undefined) {
  return [result.title, result.snippet, extracted?.raw_content ?? ""].filter(Boolean).join(" \n ");
}

function getConfidence(sampleCount: number): ComponentPriceSnapshot["confidence"] {
  if (sampleCount >= 6) {
    return "high";
  }

  if (sampleCount >= 3) {
    return "medium";
  }

  return "low";
}

export function aggregateMarketPriceSnapshots(input: {
  context: GpuMarketContext;
  queryDefinitions: MarketQueryDefinition[];
}) {
  const extractedByUrl = new Map<string, TavilyExtractItem>();

  for (const item of input.context.extracted?.results ?? []) {
    extractedByUrl.set(item.url, item);
  }

  return input.queryDefinitions.map((definition) => {
    const run = input.context.queryRuns?.find((entry) => entry.key === definition.key);
    const allPrices = (run?.results ?? []).flatMap((result) => {
      const sampleText = collectTextSamples(result, extractedByUrl.get(result.url));
      return extractPrices(sampleText);
    });
    const filteredPrices = filterRelevantPrices(allPrices, definition.referencePrice);
    const medianPrice = median(filteredPrices);
    const trimmedMeanPrice = trimmedMean(filteredPrices);
    const bestGuessPrice = trimmedMeanPrice ?? medianPrice ?? definition.referencePrice;
    const sourceUrls = Array.from(new Set((run?.results ?? []).map((result) => result.url).filter(Boolean))).slice(0, 5);

    return {
      key: definition.key,
      label: definition.label,
      componentType: definition.componentType,
      query: definition.query,
      prices: filteredPrices,
      medianPrice,
      trimmedMeanPrice,
      bestGuessPrice: clamp(bestGuessPrice, Math.round(definition.referencePrice * 0.6), Math.round(definition.referencePrice * 1.5)),
      sampleCount: filteredPrices.length,
      confidence: getConfidence(filteredPrices.length),
      sourceUrls,
    } satisfies ComponentPriceSnapshot;
  });
}

export function getSnapshotPrice(snapshots: ComponentPriceSnapshot[], key: string, fallbackPrice: number) {
  const snapshot = snapshots.find((entry) => entry.key === key);
  return snapshot?.bestGuessPrice ?? fallbackPrice;
}
