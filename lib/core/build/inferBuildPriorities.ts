import type { ParsedIntent, Priorities, WorkloadProfile } from "@/lib/core/types";

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function inferBuildPriorities(profile: WorkloadProfile, intent: ParsedIntent): Priorities {
  const priorities: Priorities = {
    value: clampUnit(0.5 + profile.gpuWeight * 0.25),
    longevity: clampUnit(0.35 + profile.longevityWeight * 0.7 + (intent.constraints.preferUpgradePath ? 0.2 : 0)),
    efficiency: clampUnit(0.2 + (intent.constraints.lowNoise ? 0.25 : 0)),
    gaming: clampUnit(0.45 + profile.gpuWeight * 0.55),
    productivity: clampUnit(0.1 + profile.productivityWeight * 1.2),
    rayTracing: clampUnit(0.05 + profile.rayTracingWeight * 1.2 + (intent.constraints.mustHaveDlss ? 0.2 : 0)),
    streaming: clampUnit(0.05 + profile.streamingWeight * 1.2 + (intent.constraints.mustHaveNvenc ? 0.25 : 0)),
  };

  return {
    ...priorities,
    ...intent.priorities,
  };
}
