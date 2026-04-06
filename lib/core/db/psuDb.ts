import type { PsuRecord } from "@/lib/core/types";

const SOURCE = "KOMPBRAT local curated baseline v1";
const SOURCE_URL = "https://kompbrat.local/psu-db";
const UPDATED_AT = "2026-04-06";

export const psuDb: PsuRecord[] = [
  { id: "psu-550-bronze", type: "psu", name: "550 W 80+ Bronze", aliases: ["550 bronze"], wattage: 550, efficiencyBadge: "80+ Bronze", qualityScore: 58, usedPricePln: 130, newPricePln: 210, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "psu-650-bronze", type: "psu", name: "650 W 80+ Bronze", aliases: ["650 bronze"], wattage: 650, efficiencyBadge: "80+ Bronze", qualityScore: 64, usedPricePln: 160, newPricePln: 250, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "psu-750-gold", type: "psu", name: "750 W 80+ Gold", aliases: ["750 gold"], wattage: 750, efficiencyBadge: "80+ Gold", qualityScore: 80, usedPricePln: 260, newPricePln: 390, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
];

export function getPsuPrice(item: PsuRecord, condition: "new" | "used") {
  return condition === "used" ? item.usedPricePln : item.newPricePln;
}
