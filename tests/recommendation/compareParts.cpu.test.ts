import assert from "node:assert/strict";
import test from "node:test";

import { compareParts } from "@/lib/core/compare/compareParts";
import { parseIntent } from "@/lib/openai/parseIntent";

test("CPU compare: 12400f vs 5600 do gier", async () => {
  const intent = await parseIntent("12400f vs 5600 do gier");
  const result = await compareParts(intent);

  assert.equal(result.partType, "cpu");
  assert.equal(result.winner?.name, "Intel Core i5-12400F");
  assert.equal(result.ranking.length, 2);
});
