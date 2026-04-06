import assert from "node:assert/strict";
import test from "node:test";

import { compareParts } from "@/lib/core/compare/compareParts";
import { parseIntent } from "@/lib/openai/parseIntent";

test("GPU compare: rx 6800 xt vs rtx 3080 do 1440p", async () => {
  const intent = await parseIntent("rx 6800 xt vs rtx 3080 do 1440p");
  const result = await compareParts(intent);

  assert.equal(result.partType, "gpu");
  assert.equal(result.winner?.name, "AMD Radeon RX 6800 XT 16 GB");
});

test("GPU compare: ray tracing favors 3080", async () => {
  const intent = await parseIntent("rx 6800 xt vs rtx 3080 co lepsze do ray tracingu");
  const result = await compareParts(intent);

  assert.equal(result.winner?.name, "NVIDIA GeForce RTX 3080 10 GB");
});

test("GPU compare: streaming favors NVIDIA features", async () => {
  const intent = await parseIntent("rx 6800 xt vs rtx 3080 co lepsze do streamingu");
  const result = await compareParts(intent);

  assert.equal(result.winner?.name, "NVIDIA GeForce RTX 3080 10 GB");
});
