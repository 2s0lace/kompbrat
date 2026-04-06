import assert from "node:assert/strict";
import test from "node:test";

import { recommendBuild } from "@/lib/core/build/recommendBuild";
import { parseIntent } from "@/lib/openai/parseIntent";

test("recommend build: esports without budget returns inferred profile and missing budget", async () => {
  const intent = await parseIntent("komp do strzelanek esportowych");
  const result = recommendBuild(intent, "komp do strzelanek esportowych");

  assert.equal(result.feasible, false);
  assert.deepEqual(result.missingRequiredData, ["budget"]);
  assert.equal(result.inferredWorkloadProfile.id, "shooter_high_fps");
});

test("recommend build: pc do AAA w 1440p za 4000", async () => {
  const intent = await parseIntent("pc do AAA w 1440p za 4000");
  const result = recommendBuild(intent, "pc do AAA w 1440p za 4000");

  assert.equal(result.feasible, true);
  assert.ok(result.build);
  assert.ok(result.totalPrice && result.totalPrice <= 4000);
  assert.equal(result.inferredWorkloadProfile.id, "aaa_visual");
});

test("recommend build: zestaw do grania i streamowania za 3500 used", async () => {
  const intent = await parseIntent("zestaw do grania i streamowania za 3500 used");
  const result = recommendBuild(intent, "zestaw do grania i streamowania za 3500 used");

  assert.equal(result.feasible, true);
  assert.ok(result.build?.gpu.nvenc);
  assert.ok(result.totalPrice && result.totalPrice <= 3500);
});

test("recommend build: komputer do gier single player, cisza i opłacalność", async () => {
  const intent = await parseIntent("komputer do gier single player, cisza i opłacalność");
  const result = recommendBuild(intent, "komputer do gier single player, cisza i opłacalność");

  assert.equal(result.feasible, false);
  assert.deepEqual(result.missingRequiredData, ["budget"]);
  assert.equal(result.intent.constraints.lowNoise, true);
});
