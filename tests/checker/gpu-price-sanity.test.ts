import assert from "node:assert/strict";
import test from "node:test";

import { buildGpuValueCheck } from "@/lib/checker/gpu-price-sanity";
import { parseOffer } from "@/lib/checker/parse-offer";

function runGpuValueCheck(input: { title?: string; description?: string; price: number }) {
  const parsed = parseOffer({
    title: input.title,
    description: input.description ?? "",
    price: input.price,
  });

  return buildGpuValueCheck({
    parsed,
    title: input.title,
    description: input.description,
    price: input.price,
  });
}

test("1499 PLN with GTX 960 is too weak", () => {
  const result = runGpuValueCheck({
    title: "Komputer gaming GTX 960",
    description: "PC do gier, i5, 16 GB RAM, SSD",
    price: 1499,
  });

  assert.ok(result);
  assert.equal(result?.gpu_position_for_price, "too_weak");
});

test("1499 PLN with GTX 1660 Super is at least sensible", () => {
  const result = runGpuValueCheck({
    title: "Komputer gaming GTX 1660 Super",
    description: "Ryzen 5 3600, 16 GB RAM, 1 TB SSD",
    price: 1499,
  });

  assert.ok(result);
  assert.notEqual(result?.gpu_position_for_price, "too_weak");
});

test("2599 PLN with RTX 2060 is too weak for the price", () => {
  const result = runGpuValueCheck({
    title: "Gaming PC RTX 2060",
    description: "Ryzen 5 5600, 16 GB, 1 TB SSD",
    price: 2599,
  });

  assert.ok(result);
  assert.equal(result?.gpu_position_for_price, "too_weak");
  assert.ok(result?.redFlags.some((flag) => flag.includes("GPU wygląda wyraźnie za słabo")));
});

test("1799 PLN with RTX 2060 is acceptable for used gaming PC", () => {
  const result = runGpuValueCheck({
    title: "PC RTX 2060 gaming",
    description: "Ryzen 5 3600, 16 GB RAM, SSD",
    price: 1799,
  });

  assert.ok(result);
  assert.notEqual(result?.gpu_position_for_price, "too_weak");
});

test("missing exact GPU model is treated as a strong red flag", () => {
  const result = runGpuValueCheck({
    title: "Komputer gaming NVIDIA GeForce 8GB",
    description: "Ryzen 5 5600, 16 GB RAM, 1 TB SSD",
    price: 2499,
  });

  assert.ok(result);
  assert.equal(result?.gpu_position_for_price, "too_weak");
  assert.ok(result?.redFlags.some((flag) => flag.includes("Brakuje dokładnego modelu GPU")));
});
