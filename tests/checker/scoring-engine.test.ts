import assert from "node:assert/strict";
import test from "node:test";

import { calculateFairValue, calculatePriceScore, calculateProfitabilityScore, calculateRiskScore } from "@/lib/checker/scoring";
import type { NormalizedOffer } from "@/types/checker";

function makeOffer(overrides: Partial<NormalizedOffer> = {}): NormalizedOffer {
  return {
    title: "Oferta testowa",
    askingPrice: 2350,
    cpuModel: "AMD Ryzen 5 5600",
    gpuModel: "AMD Radeon RX 6700 XT",
    ramGb: 16,
    ramType: "DDR4",
    storage: [{ type: "NVME", sizeGb: 1000, knownModel: true }],
    motherboardTier: "mid",
    psuQuality: "decent",
    psuKnownModel: true,
    caseTier: "airflow",
    coolerTier: "basic_tower",
    hasWarrantyInfo: true,
    hasReturnOption: true,
    hasInteriorPhotos: true,
    hasHealthProof: true,
    hasBenchmarks: true,
    listingQuality: "good",
    suspiciousUrgency: false,
    titleDescriptionMismatch: false,
    gamingBaitStyle: false,
    detectedRedFlags: [],
    ...overrides,
  };
}

test("good deal stays profitable with low risk", () => {
  const offer = makeOffer();
  const fairValue = calculateFairValue(offer);
  const profitability = calculateProfitabilityScore(offer);
  const risk = calculateRiskScore(offer);

  assert.ok(fairValue && fairValue >= 2300, "fair value should be close to the parts value");
  assert.equal(calculatePriceScore(offer.askingPrice, fairValue), profitability.subscores.priceScore);
  assert.equal(profitability.label, "Bierz");
  assert.equal(risk.label, "Niskie");
  assert.ok(profitability.score >= 80);
  assert.ok(risk.score < 25);
});

test("technically sensible but overpriced offer scores low on profitability", () => {
  const offer = makeOffer({
    askingPrice: 3200,
  });
  const profitability = calculateProfitabilityScore(offer);
  const risk = calculateRiskScore(offer);

  assert.ok(profitability.priceRatio && profitability.priceRatio > 1.25);
  assert.equal(profitability.label, "Raczej nie");
  assert.ok(profitability.score < 55);
  assert.equal(risk.label, "Niskie");
});

test("suspiciously cheap high-end offer can be profitable but high risk", () => {
  const offer = makeOffer({
    askingPrice: 1780,
    cpuModel: "AMD Ryzen 5 9600",
    gpuModel: "NVIDIA GeForce RTX 4070",
    ramGb: 32,
    ramType: "DDR5",
    motherboardTier: "good",
    psuQuality: "basic",
    psuKnownModel: false,
    caseTier: "basic",
    coolerTier: "good_tower",
    hasWarrantyInfo: false,
    hasReturnOption: false,
    hasInteriorPhotos: false,
    hasHealthProof: false,
    hasBenchmarks: false,
    listingQuality: "poor",
    suspiciousUrgency: true,
    gamingBaitStyle: true,
  });

  const profitability = calculateProfitabilityScore(offer);
  const risk = calculateRiskScore(offer);

  assert.equal(profitability.label, "Bierz");
  assert.ok(profitability.score >= 80);
  assert.equal(risk.label, "Wysokie");
  assert.ok(risk.score >= 55);
  assert.ok(risk.breakdown.some((item) => item.key === "suspiciously_cheap"));
});

test("weak gaming bait gets low profitability and high risk", () => {
  const offer = makeOffer({
    askingPrice: 2399,
    cpuModel: "AMD Ryzen 5 3600",
    gpuModel: "NVIDIA GeForce GTX 1660 SUPER",
    ramGb: 16,
    ramType: "DDR4",
    storage: [{ type: "SATA_SSD", sizeGb: 512, knownModel: false }],
    motherboardTier: "basic",
    psuQuality: "unknown",
    psuKnownModel: false,
    caseTier: "premium",
    coolerTier: "aio",
    hasWarrantyInfo: false,
    hasReturnOption: false,
    hasInteriorPhotos: false,
    hasHealthProof: false,
    hasBenchmarks: false,
    listingQuality: "poor",
    suspiciousUrgency: true,
    gamingBaitStyle: true,
    detectedRedFlags: ["Sprzedający używa mocno marketingowego opisu bez konkretów."],
  });

  const profitability = calculateProfitabilityScore(offer);
  const risk = calculateRiskScore(offer);

  assert.ok(profitability.score < 55);
  assert.ok(["Raczej nie", "Odpuść"].includes(profitability.label));
  assert.equal(risk.label, "Wysokie");
  assert.ok(risk.score >= 55);
  assert.ok(profitability.breakdown.some((item) => item.key === "weak_gpu_for_price"));
});
