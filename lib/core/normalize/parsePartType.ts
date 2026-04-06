import type { PartType } from "@/lib/core/types";
import { normalizeText } from "@/lib/core/utils/normalize";

export function parsePartType(input: string): PartType | null {
  const text = normalizeText(input);

  if (/(rtx|gtx|rx\s?\d|arc\s?b|gpu|grafik|karta)/i.test(text)) {
    return "gpu";
  }

  if (/(ryzen|core\s*i|i3\s?\d|i5\s?\d|i7\s?\d|xeon|cpu|procesor)/i.test(text)) {
    return "cpu";
  }

  return null;
}
