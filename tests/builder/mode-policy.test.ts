import assert from "node:assert/strict";
import test from "node:test";

import { buildCandidateBaskets } from "@/lib/builder/basket-builder";
import { getBuilderCandidatePool } from "@/lib/builder/candidate-pool";
import { chooseBasketByPolicy } from "@/lib/builder/policy";
import type { ScoredBuildBasket } from "@/lib/builder/types";
import { getBudgetGuideline } from "@/lib/value-guidelines";

function makeBasket(mode: "new" | "mixed" | "used", score: number, estimatedTotal: number): ScoredBuildBasket {
  return {
    id: `${mode}-${score}`,
    title: `${mode} basket`,
    marketMode: mode,
    useCase: "gaming 1080p",
    gpu: {
      kind: "gpu",
      id: `${mode}-gpu`,
      name: mode === "used" ? "AMD Radeon RX 6700 XT" : "NVIDIA GeForce RTX 4060",
      marketMode: mode === "mixed" ? "used" : mode,
      minBudget: 1500,
      fallbackPrice: 1200,
      performanceScore: mode === "new" ? 60 : 74,
      valueScore: mode === "new" ? 58 : 76,
      riskPenalty: mode === "used" ? 8 : 3,
      powerDrawWatts: 230,
      priority: 1,
      useCaseTags: ["gaming"],
    },
    cpu: {
      kind: "cpu",
      id: `${mode}-cpu`,
      name: "AMD Ryzen 5 5600",
      platform: "am4",
      minBudget: 1500,
      fallbackPrice: 420,
      gamingScore: 74,
      productivityScore: 66,
      valueScore: 80,
      upgradeScore: 54,
      riskPenalty: 2,
      priority: 1,
    },
    parts: [
      { key: `${mode}-cpu`, type: "CPU", name: "AMD Ryzen 5 5600", estimatedPrice: 420, componentType: "cpu", condition: mode === "used" ? "used" : "new" },
      {
        key: `${mode}-gpu`,
        type: "GPU",
        name: mode === "used" ? "AMD Radeon RX 6700 XT" : "NVIDIA GeForce RTX 4060",
        estimatedPrice: 1200,
        componentType: "gpu",
        condition: mode === "mixed" || mode === "used" ? "used" : "new",
      },
      { key: `${mode}-board`, type: "MOTHERBOARD", name: "B550", estimatedPrice: 320, componentType: "motherboard", condition: mode === "used" ? "used" : "new" },
      { key: `${mode}-ram`, type: "RAM", name: "16 GB DDR4 3600", estimatedPrice: 150, componentType: "ram", condition: mode === "used" ? "used" : "new" },
      { key: `${mode}-ssd`, type: "STORAGE", name: "1 TB NVMe Gen4", estimatedPrice: 240, componentType: "storage", condition: mode === "used" ? "used" : "new" },
      { key: `${mode}-psu`, type: "PSU", name: "650 W 80+ Gold", estimatedPrice: 260, componentType: "psu", condition: mode === "used" ? "used" : "new" },
      { key: `${mode}-case`, type: "CASE", name: "Przewiewna obudowa ATX", estimatedPrice: 180, componentType: "case", condition: mode === "used" ? "used" : "new" },
    ],
    estimatedTotal,
    notes: [],
    warnings: [],
    priceConfidence: "medium",
    score,
    breakdown: {
      gpuValue: score,
      cpuAdequacy: score,
      memoryStorage: score,
      platformQuality: score,
      upgradePath: score,
      riskPenalty: 10,
      total: score,
    },
    reasons: [`${mode} score ${score}`],
  };
}

test("selected new stays new even when mixed scores better", () => {
  const decision = chooseBasketByPolicy({
    budget: 2000,
    requestedMode: "new",
    scoredBaskets: [makeBasket("new", 54, 1980), makeBasket("mixed", 62, 2010), makeBasket("used", 58, 1960)],
  });

  assert.ok(decision);
  assert.equal(decision?.feasibleInSelectedMode, true);
  assert.equal(decision?.actualModeUsed, "new");
  assert.equal(decision?.recommendedMode, "new");
  assert.equal(decision?.status, "success");
});

test("medium budget mixed succeeds when it is already sensible", () => {
  const decision = chooseBasketByPolicy({
    budget: 3500,
    requestedMode: "mixed",
    scoredBaskets: [makeBasket("mixed", 66, 3420), makeBasket("new", 60, 3480), makeBasket("used", 61, 3390)],
  });

  assert.ok(decision);
  assert.equal(decision?.feasibleInSelectedMode, true);
  assert.equal(decision?.actualModeUsed, "mixed");
  assert.equal(decision?.status, "success");
});

test("high budget new succeeds when a strong full-new basket exists", () => {
  const decision = chooseBasketByPolicy({
    budget: 7000,
    requestedMode: "new",
    scoredBaskets: [makeBasket("new", 72, 6880), makeBasket("mixed", 69, 6810), makeBasket("used", 64, 6700)],
  });

  assert.ok(decision);
  assert.equal(decision?.feasibleInSelectedMode, true);
  assert.equal(decision?.actualModeUsed, "new");
  assert.equal(decision?.status, "success");
});

test("selected used stays used even when mixed would score better", () => {
  const decision = chooseBasketByPolicy({
    budget: 4000,
    requestedMode: "used",
    scoredBaskets: [makeBasket("used", 50, 3920), makeBasket("mixed", 64, 3980), makeBasket("new", 60, 4010)],
  });

  assert.ok(decision);
  assert.equal(decision?.feasibleInSelectedMode, true);
  assert.equal(decision?.actualModeUsed, "used");
  assert.equal(decision?.recommendedMode, "used");
  assert.equal(decision?.status, "success");
});

test("when nothing sensible exists the policy returns no decision and route can show a clear failure", () => {
  const decision = chooseBasketByPolicy({
    budget: 1500,
    requestedMode: "mixed",
    scoredBaskets: [],
  });

  assert.equal(decision, null);
});

test("when selected market has no basket, policy does not silently switch to another market", () => {
  const decision = chooseBasketByPolicy({
    budget: 2200,
    requestedMode: "new",
    scoredBaskets: [makeBasket("mixed", 63, 2150), makeBasket("used", 61, 2100)],
  });

  assert.equal(decision, null);
});

test("when strict thresholds fail but selected market has a basket, policy still returns it as compromise build", () => {
  const decision = chooseBasketByPolicy({
    budget: 1800,
    requestedMode: "new",
    scoredBaskets: [makeBasket("new", 50, 1890), makeBasket("mixed", 49, 1860), makeBasket("used", 47, 1810)],
  });

  assert.ok(decision);
  assert.equal(decision?.feasibleInSelectedMode, true);
  assert.equal(decision?.recommendedMode, "new");
  assert.equal(decision?.actualModeUsed, "new");
  assert.match(`${decision?.modeMessage ?? ""} ${decision?.policyReason ?? ""}`, /kompromis|Da się złożyć|new/i);
});

test("low budget mixed can still produce a compromise gaming build", () => {
  const pool = getBuilderCandidatePool({
    budget: 1800,
    useCase: "gaming 1080p",
    marketMode: "mixed",
    category: "gaming",
    guideline: null,
  });

  const baskets = buildCandidateBaskets({
    pool,
    priceSnapshots: [],
  });

  assert.ok(baskets.length > 0);
  assert.ok(baskets.some((basket) => basket.estimatedTotal <= 1800 * 1.12));
  assert.ok(
    baskets.some((basket) =>
      basket.parts.some((part) => part.componentType === "storage" && /500 GB|1 TB/i.test(part.name)),
    ),
  );
});

test("4000 budget can produce a new gaming build", () => {
  const budget = 4000;
  const guideline = getBudgetGuideline({
    budget,
    category: "gaming",
    marketPreference: "new",
  });

  const pool = getBuilderCandidatePool({
    budget,
    useCase: "gaming 1080p",
    marketMode: "new",
    category: "gaming",
    guideline,
  });

  const baskets = buildCandidateBaskets({
    pool,
    priceSnapshots: [],
  });

  const decision = chooseBasketByPolicy({
    budget,
    requestedMode: "new",
    scoredBaskets: baskets.map((basket) => ({
      ...basket,
      score: 70,
      breakdown: {
        gpuValue: 70,
        cpuAdequacy: 70,
        memoryStorage: 70,
        platformQuality: 70,
        upgradePath: 70,
        riskPenalty: 10,
        total: 70,
      },
      reasons: [],
    })),
  });

  assert.ok(guideline);
  assert.equal(guideline?.marketPreference, "new");
  assert.ok(baskets.length > 0);
  assert.ok(decision);
  assert.equal(decision?.recommendedMode, "new");
  assert.ok((decision?.recommendedBasket.estimatedTotal ?? Infinity) <= budget);
});

test("1000 budget can still produce a used gaming build", () => {
  const pool = getBuilderCandidatePool({
    budget: 1000,
    useCase: "gaming 1080p",
    marketMode: "used",
    category: "gaming",
    guideline: getBudgetGuideline({
      budget: 1000,
      category: "gaming",
      marketPreference: "used",
    }),
  });

  const baskets = buildCandidateBaskets({
    pool,
    priceSnapshots: [],
  });

  assert.ok(baskets.length > 0);
  assert.ok(baskets.some((basket) => basket.estimatedTotal <= 1120));
});

test("1500 budget can still produce a used gaming build", () => {
  const pool = getBuilderCandidatePool({
    budget: 1500,
    useCase: "gaming 1080p",
    marketMode: "used",
    category: "gaming",
    guideline: getBudgetGuideline({
      budget: 1500,
      category: "gaming",
      marketPreference: "used",
    }),
  });

  const baskets = buildCandidateBaskets({
    pool,
    priceSnapshots: [],
  });

  assert.ok(baskets.length > 0);
  assert.ok(baskets.some((basket) => basket.estimatedTotal <= 1680));
});

test("new and used pools stay fully separated", () => {
  const newPool = getBuilderCandidatePool({
    budget: 4000,
    useCase: "gaming 1080p",
    marketMode: "new",
    category: "gaming",
    guideline: getBudgetGuideline({
      budget: 4000,
      category: "gaming",
      marketPreference: "new",
    }),
  });

  const usedPool = getBuilderCandidatePool({
    budget: 3000,
    useCase: "gaming 1080p",
    marketMode: "used",
    category: "gaming",
    guideline: getBudgetGuideline({
      budget: 3000,
      category: "gaming",
      marketPreference: "used",
    }),
  });

  assert.ok(newPool.gpus.every((gpu) => gpu.marketMode === "new"));
  assert.ok(usedPool.gpus.every((gpu) => gpu.marketMode === "used"));
});
