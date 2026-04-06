import type { ParsedIntent, WorkloadProfile } from "@/lib/core/types";
import { workloadProfiles } from "@/lib/core/profiles/workloadProfiles";
import { normalizePartName } from "@/lib/core/normalize/normalizePartName";

export function inferWorkloadProfile(intent: Pick<ParsedIntent, "purpose" | "workloadProfile" | "targetResolution" | "constraints"> & { rawText?: string | null }): WorkloadProfile {
  if (intent.workloadProfile && intent.workloadProfile in workloadProfiles) {
    return workloadProfiles[intent.workloadProfile as keyof typeof workloadProfiles];
  }

  const text = normalizePartName(intent.rawText ?? "");

  if (/(stream|obs|transmis)/i.test(text)) {
    return workloadProfiles.gaming_plus_streaming;
  }

  if (/(montaż|montaz|premiere|davinci|render|creator)/i.test(text)) {
    return intent.purpose === "mixed" ? workloadProfiles.gaming_plus_productivity : workloadProfiles.creator_light;
  }

  if (/(esports|competitive|ranked|turniej|shooter|strzelank)/i.test(text)) {
    return /(240|360|high fps|wysokie fps)/i.test(text) ? workloadProfiles.esports_competitive : workloadProfiles.shooter_high_fps;
  }

  if (/(aaa|single player|story|fabular|wizual|1440|4k)/i.test(text)) {
    return /(single player|story|fabular)/i.test(text) ? workloadProfiles.story_visual : workloadProfiles.aaa_visual;
  }

  if (intent.purpose === "productivity") {
    return workloadProfiles.creator_light;
  }

  if (intent.purpose === "mixed") {
    return workloadProfiles.gaming_plus_productivity;
  }

  return workloadProfiles.mixed_gaming;
}
