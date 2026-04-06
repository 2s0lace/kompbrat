import { cpuDb, getCpuPrice } from "@/lib/core/db/cpuDb";
import type { CpuRecord, Priorities, ScoredPart } from "@/lib/core/types";
import { normalizeInverseMetric, normalizeMetric, valueIndex } from "@/lib/core/scoring/common";
import { weightedScore } from "@/lib/core/utils/weightedScore";

export function scoreCpu(cpu: CpuRecord, priorities: Priorities, condition: "new" | "used" = "used"): ScoredPart<CpuRecord> {
  const price = getCpuPrice(cpu, condition) ?? Number.POSITIVE_INFINITY;
  const pricePool = cpuDb.map((entry) => getCpuPrice(entry, condition) ?? 0).filter(Boolean) as number[];
  const multiPool = cpuDb.map((entry) => entry.multiThreadScore);
  const singlePool = cpuDb.map((entry) => entry.singleThreadScore);
  const valuePool = cpuDb.map((entry) => valueIndex(entry.gamingTierScore * 0.6 + entry.multiThreadScore * 0.4, getCpuPrice(entry, condition) ?? 1));

  const gamingScore = normalizeMetric(cpu.gamingTierScore, Math.min(...singlePool), Math.max(...singlePool));
  const productivityScore = normalizeMetric(cpu.multiThreadScore, Math.min(...multiPool), Math.max(...multiPool));
  const efficiencyScore = cpu.efficiencyScore;
  const platformScore = cpu.platformScore;
  const valueScore = normalizeMetric(
    valueIndex(cpu.gamingTierScore * 0.6 + cpu.multiThreadScore * 0.4, price),
    Math.min(...valuePool),
    Math.max(...valuePool),
  );
  const priceComfort = normalizeInverseMetric(price, Math.min(...pricePool), Math.max(...pricePool));

  const score = weightedScore([
    { value: gamingScore, weight: priorities.gaming },
    { value: productivityScore, weight: priorities.productivity },
    { value: efficiencyScore, weight: priorities.efficiency },
    { value: platformScore, weight: priorities.longevity },
    { value: valueScore, weight: priorities.value },
  ]);

  const reasons = [
    `${cpu.name} ma sensowny balans gry/praca dla tego profilu.`,
    `Platforma ${cpu.socket} daje ocenę ${platformScore.toFixed(0)}/100 pod kątem dalszego życia platformy.`,
  ];

  const tradeoffs = [
    price === Number.POSITIVE_INFINITY ? "Brak sensownej ceny w wybranym rynku." : `Cena CPU w tym rynku to około ${Math.round(price)} zł.`,
    priceComfort < 35 ? "To nie jest najtańsza opcja w swojej klasie." : "Koszt procesora dobrze wpisuje się w build value.",
  ];

  return {
    item: cpu,
    score,
    price,
    reasons,
    tradeoffs,
  };
}
