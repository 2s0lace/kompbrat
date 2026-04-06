import assert from "node:assert/strict";
import test from "node:test";

import { buildPsuAssessment, compareOfferPsuToRecommendation, getRecommendedPsu } from "@/lib/checker/psu-recommendation";
import { parseOffer } from "@/lib/checker/parse-offer";

test("RTX 5070 + Ryzen 7 7700 recommends 650W", () => {
  const recommendation = getRecommendedPsu("AMD Ryzen 7 7700", "NVIDIA GeForce RTX 5070", {
    cpuConfidence: "high",
    gpuConfidence: "high",
  });

  assert.equal(recommendation.recommendedWattage, 650);
  assert.equal(recommendation.minimumSuggestedWattage, 650);
  assert.equal(recommendation.confidence, "high");
});

test("RTX 5070 + Ryzen 7 7700 with 650W is ok", () => {
  const comparison = compareOfferPsuToRecommendation(650, {
    recommendedWattage: 650,
    minimumSuggestedWattage: 650,
    confidence: "high",
  });

  assert.equal(comparison.status, "ok");
});

test("RTX 5070 + Ryzen 7 7700 with 500W is too weak", () => {
  const comparison = compareOfferPsuToRecommendation(500, {
    recommendedWattage: 650,
    minimumSuggestedWattage: 650,
    confidence: "high",
  });

  assert.equal(comparison.status, "too_weak");
});

test("RTX 4070 + Ryzen 5 9600 with 650W is ok", () => {
  const recommendation = getRecommendedPsu("AMD Ryzen 5 9600", "NVIDIA GeForce RTX 4070", {
    cpuConfidence: "high",
    gpuConfidence: "high",
  });
  const comparison = compareOfferPsuToRecommendation(650, recommendation);

  assert.equal(recommendation.recommendedWattage, 650);
  assert.equal(comparison.status, "ok");
});

test("RTX 4080 SUPER + 7800X3D with 650W is borderline or worse by rule", () => {
  const recommendation = getRecommendedPsu("AMD Ryzen 7 7800X3D", "NVIDIA GeForce RTX 4080 SUPER", {
    cpuConfidence: "high",
    gpuConfidence: "high",
  });
  const comparison = compareOfferPsuToRecommendation(650, recommendation);

  assert.equal(recommendation.recommendedWattage, 850);
  assert.equal(recommendation.minimumSuggestedWattage, 750);
  assert.equal(comparison.status, "too_weak");
});

test("PSU warning appears when only wattage is present without brand/model", () => {
  const parsed = parseOffer({
    title: "PC RTX 5070 Ryzen 7 7700",
    description: "NVIDIA GeForce RTX 5070, AMD Ryzen 7 7700, 32GB DDR5, 1TB NVMe, zasilacz 650W",
  });
  const assessment = buildPsuAssessment(parsed);

  assert.equal(assessment.status, "ok");
  assert.ok(assessment.warning?.includes("brakuje marki albo modelu zasilacza"));
});
