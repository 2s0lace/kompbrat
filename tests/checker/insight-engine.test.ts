import assert from "node:assert/strict";
import test from "node:test";

import { extractHeuristics } from "@/lib/checker/heuristics";
import { buildCheckerReasoning } from "@/lib/checker/insight-engine";
import { parseOffer } from "@/lib/checker/parse-offer";
import { buildPsuAssessment } from "@/lib/checker/psu-recommendation";
import { estimateOfferMarketValue, scoreOffer } from "@/lib/checker/scoring";
import { buildGpuValueCheck } from "@/lib/checker/gpu-price-sanity";

function buildReasoning(input: { title?: string; description: string; price?: number }) {
  const parsed = parseOffer(input);
  const valuation = estimateOfferMarketValue(parsed);
  const gpuValueCheck = buildGpuValueCheck({
    parsed,
    title: input.title,
    description: input.description,
    price: input.price,
  });
  const psuAssessment = buildPsuAssessment(parsed);
  const heuristics = extractHeuristics({
    parsed,
    price: input.price,
    estimatedMarketValue: valuation.estimatedMarketValue,
    estimatedMarketValueConfidence: valuation.confidence,
    valuationNote: valuation.invalidReason,
    psuAssessment,
    gpuValueCheck,
  });
  const scoring = scoreOffer({
    parsed,
    heuristics,
    valuation,
    psuAssessment,
    gpuValueCheck,
    title: input.title,
    description: input.description,
  });

  return buildCheckerReasoning({
    parsed,
    scoring,
    heuristics,
    psuAssessment,
    gpuValueCheck,
    title: input.title,
    description: input.description,
  });
}

test("criticizes whole-PC valuation when GPU itself is acceptable", () => {
  const reasoning = buildReasoning({
    title: "PC i5-12400F RTX 3060",
    price: 2999,
    description: "Procesor: Intel Core i5-12400F\nKarta graficzna: GeForce RTX 3060 12GB\nRAM: 16 GB DDR4\nPłyta: B660\nDysk SSD: 1 TB NVMe\nZasilacz: 650W",
  });

  assert.ok(reasoning.insights.red_flags.some((item) => item.reason_code === "overall_overpriced"));
  assert.ok(reasoning.insights.positives.some((item) => item.reason_code === "gpu_sensible"));
  assert.ok(reasoning.insights.red_flags.every((item) => item.reason_code !== "gpu_too_weak_for_price"));
  assert.match(reasoning.verdictSummary, /cena|zbyt drogo/i);
});

test("treats 1 TB NVMe as sensible and exact model as separate verification point", () => {
  const reasoning = buildReasoning({
    title: "PC Ryzen 5 5600 RX 6700 XT",
    price: 2399,
    description: "Procesor: Ryzen 5 5600\nGPU: RX 6700 XT 12GB\nRAM: 16 GB DDR4\nDysk: 1 TB NVMe\nPłyta: B550\nZasilacz: 650W",
  });

  assert.ok(reasoning.insights.positives.some((item) => item.reason_code === "storage_nvme_ok"));
  assert.ok(reasoning.insights.to_verify.some((item) => item.reason_code === "storage_exact_model_missing"));
  assert.ok(reasoning.insights.to_verify.every((item) => item.reason_code !== "storage_type_missing"));
});

test("treats 1 TB generic disk wording as vague instead of assuming NVMe", () => {
  const reasoning = buildReasoning({
    title: "PC Ryzen 5 5600 RTX 3060",
    price: 2299,
    description: "Procesor: Ryzen 5 5600\nGPU: RTX 3060 12GB\nRAM: 16 GB DDR4\nDysk: 1 TB dysk\nPłyta: B550\nZasilacz: 650W",
  });

  assert.ok(reasoning.insights.to_verify.some((item) => item.reason_code === "storage_type_missing" || item.reason_code === "storage_capacity_only"));
  assert.ok(reasoning.insights.positives.every((item) => item.reason_code !== "storage_nvme_ok"));
});

test("16 GB RAM is acceptable, not a severe problem by default", () => {
  const reasoning = buildReasoning({
    title: "PC i5-12400F RTX 3060",
    price: 2499,
    description: "CPU: i5-12400F\nGPU: RTX 3060 12GB\nRAM: 16 GB (2x8) DDR4 3200\nSSD: 1 TB NVMe\nPłyta: B660\nZasilacz: 650W",
  });

  assert.ok(reasoning.insights.positives.some((item) => item.reason_code === "ram_16_ok"));
  assert.ok(reasoning.insights.red_flags.every((item) => item.reason_code !== "ram_too_low"));
});

test("low-confidence component data becomes verification, not hard accusation", () => {
  const reasoning = buildReasoning({
    title: "Komputer gamingowy RTX",
    price: 1999,
    description: "Mocny komputer do gier, procesor i7, grafika RTX, 16 GB RAM, 1 TB dysk, działa świetnie.",
  });

  assert.ok(reasoning.insights.to_verify.some((item) => /GPU|karty/i.test(item.text) || item.reason_code === "gpu_low_confidence" || item.reason_code === "gpu_missing"));
  assert.ok(reasoning.insights.red_flags.every((item) => item.reason_code !== "cpu_outdated_for_price"));
});
