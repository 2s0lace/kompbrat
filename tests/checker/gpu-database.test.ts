import assert from "node:assert/strict";
import test from "node:test";

import { findGpuInText, getGpuMeta, getGpuTierHint, isDesktopGamingGpu, normalizeGpuName } from "@/lib/checker/gpu-database";

test("normalizes common NVIDIA and AMD aliases", () => {
  assert.equal(normalizeGpuName("gtx1060 6gb"), "GTX 1060 6 GB");
  assert.equal(normalizeGpuName("rtx2060super"), "RTX 2060 Super");
  assert.equal(normalizeGpuName("rx 580 2048sp"), "RX 580 2048SP");
  assert.equal(normalizeGpuName("4070ti super"), "RTX 4070 Ti Super");
});

test("detects branded marketplace GPU text and keeps exact VRAM variant", () => {
  const result = findGpuInText("ASUS GeForce RTX 3060 TUF GAMING OC 12GB");

  assert.equal(result.matched, true);
  assert.equal(result.normalizedName, "RTX 3060 12 GB");
  assert.equal(result.vendor, "NVIDIA");
  assert.ok(result.confidence >= 0.9);
});

test("does not confuse 1660 Super with 1060", () => {
  const result = findGpuInText("sprzedam pc z 1660s i ryzen 5 3600");

  assert.equal(result.matched, true);
  assert.equal(result.normalizedName, "GTX 1660 Super");
});

test("returns null for vague GPU wording", () => {
  assert.equal(normalizeGpuName("NVIDIA GeForce 4GB graphics"), null);
  assert.equal(findGpuInText("gaming gpu 8gb").matched, false);
});

test("returns metadata and desktop/tier helpers", () => {
  const meta = getGpuMeta("RTX 4060 Ti 16GB");

  assert.ok(meta);
  assert.equal(meta?.normalizedName, "RTX 4060 Ti 16 GB");
  assert.equal(meta?.vendor, "NVIDIA");
  assert.equal(isDesktopGamingGpu("RTX 4060 Ti 16GB"), true);
  assert.ok(getGpuTierHint("RTX 4060 Ti 16GB"));
});
