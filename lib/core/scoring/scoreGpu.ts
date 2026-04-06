import { getGpuPrice, gpuDb } from "@/lib/core/db/gpuDb";
import type { GpuRecord, Priorities, ScoredPart, TargetResolution } from "@/lib/core/types";
import { normalizeInverseMetric, normalizeMetric, valueIndex } from "@/lib/core/scoring/common";
import { weightedScore } from "@/lib/core/utils/weightedScore";

function getRasterMetric(gpu: GpuRecord, resolution: TargetResolution) {
  if (resolution === "4k") return gpu.raster4k;
  if (resolution === "1440p") return gpu.raster1440p;
  return gpu.raster1080p;
}

export function scoreGpu(gpu: GpuRecord, priorities: Priorities, resolution: TargetResolution = "1080p", condition: "new" | "used" = "used"): ScoredPart<GpuRecord> {
  const price = getGpuPrice(gpu, condition) ?? Number.POSITIVE_INFINITY;
  const pricePool = gpuDb.map((entry) => getGpuPrice(entry, condition) ?? 0).filter(Boolean) as number[];
  const rasterPool = gpuDb.map((entry) => getRasterMetric(entry, resolution));
  const rtPool = gpuDb.map((entry) => entry.rtScore);
  const powerPool = gpuDb.map((entry) => entry.powerW);
  const valuePool = gpuDb.map((entry) => valueIndex(getRasterMetric(entry, resolution), getGpuPrice(entry, condition) ?? 1));

  const rasterScore = normalizeMetric(getRasterMetric(gpu, resolution), Math.min(...rasterPool), Math.max(...rasterPool));
  const rtScore = normalizeMetric(gpu.rtScore, Math.min(...rtPool), Math.max(...rtPool));
  const vramLongevity = normalizeMetric(gpu.vramGb, 8, 16);
  const efficiencyScore = normalizeInverseMetric(gpu.powerW, Math.min(...powerPool), Math.max(...powerPool));
  const valueScore = normalizeMetric(valueIndex(getRasterMetric(gpu, resolution), price), Math.min(...valuePool), Math.max(...valuePool));
  const featureScore = (gpu.nvenc ? 35 : 0) + (gpu.av1Encode ? 20 : 0) + (gpu.dlss ? 20 : 0) + (gpu.cuda ? 10 : 0);

  const score = weightedScore([
    { value: rasterScore, weight: priorities.gaming },
    { value: rtScore, weight: priorities.rayTracing },
    { value: vramLongevity, weight: priorities.longevity },
    { value: efficiencyScore, weight: priorities.efficiency },
    { value: valueScore, weight: priorities.value },
    { value: featureScore, weight: priorities.streaming + priorities.productivity * 0.15 },
  ]);

  const reasons = [
    `${gpu.name} dobrze wpisuje się w ${resolution} przy tym profilu użycia.`,
    `Ma ${gpu.vramGb} GB VRAM i wynik raster ${getRasterMetric(gpu, resolution)} w lokalnej bazie.`
  ];

  const tradeoffs = [
    price === Number.POSITIVE_INFINITY ? "Brak sensownej ceny w wybranym rynku." : `Cena GPU w tym rynku to około ${Math.round(price)} zł.`,
    gpu.nvenc ? "Ma sensowne feature'y pod streaming i zapis wideo." : "Feature set pod streaming jest bardziej podstawowy.",
  ];

  return {
    item: gpu,
    score,
    price,
    reasons,
    tradeoffs,
  };
}
