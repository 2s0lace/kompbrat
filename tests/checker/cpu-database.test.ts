import assert from "node:assert/strict";
import test from "node:test";

import {
  findCpuInText,
  getCpuFamilyHint,
  getCpuMeta,
  getCpuTierHint,
  isKnownDesktopCpu,
  isWeakOldOfficeCpu,
  isXeonPopularInUsedGaming,
  normalizeCpuName,
} from "@/lib/checker/cpu-database";

test("normalizes common Intel, Xeon and Ryzen aliases", () => {
  assert.equal(normalizeCpuName("i56500"), "Intel Core i5-6500");
  assert.equal(normalizeCpuName("i5 6500t"), "Intel Core i5-6500T");
  assert.equal(normalizeCpuName("xeon2670v3"), "Intel Xeon E5-2670 v3");
  assert.equal(normalizeCpuName("ryzen53600"), "AMD Ryzen 5 3600");
  assert.equal(normalizeCpuName("4650g pro"), "AMD Ryzen 5 PRO 4650G");
});

test("finds exact CPU in messy listing text", () => {
  const result = findCpuInText("Komputer do gier, CPU Xeon e5 2680v3, RTX 2060, 16GB RAM");

  assert.equal(result.matched, true);
  assert.equal(result.normalizedName, "Intel Xeon E5-2680 v3");
  assert.equal(result.vendor, "Intel");
  assert.equal(result.family, "Intel Xeon");
  assert.ok(result.confidence >= 0.9);
});

test("does not hallucinate from vague family-only wording", () => {
  assert.equal(normalizeCpuName("Intel Core i5"), null);
  assert.equal(normalizeCpuName("Ryzen 5"), null);
  assert.equal(findCpuInText("mocny xeon e5 do gier").matched, false);
});

test("returns metadata and helpers", () => {
  const meta = getCpuMeta("AMD Ryzen 5 PRO 4650G");

  assert.ok(meta);
  assert.equal(meta?.socketHint, "AM4");
  assert.equal(getCpuFamilyHint("AMD Ryzen 5 PRO 4650G"), "AMD Ryzen 5 PRO");
  assert.equal(isKnownDesktopCpu("Intel Core i5-6500T"), true);
  assert.equal(isXeonPopularInUsedGaming("Intel Xeon E5-2670 v3"), true);
  assert.equal(isWeakOldOfficeCpu("Intel Celeron G3900"), true);
  assert.ok(getCpuTierHint("Intel Core i7-10700"));
});
