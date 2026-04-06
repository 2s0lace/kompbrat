import type { RamRecord } from "@/lib/core/types";

const SOURCE = "KOMPBRAT local curated baseline v1";
const SOURCE_URL = "https://kompbrat.local/ram-db";
const UPDATED_AT = "2026-04-06";

export const ramDb: RamRecord[] = [
  { id: "16gb-ddr4-3200", type: "ram", name: "16 GB DDR4 3200 (2x8)", aliases: ["16gb ddr4", "2x8 ddr4"], capacityGb: 16, sticks: 2, ramType: "DDR4", speedMhz: 3200, usedPricePln: 110, newPricePln: 150, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "32gb-ddr4-3200", type: "ram", name: "32 GB DDR4 3200 (2x16)", aliases: ["32gb ddr4", "2x16 ddr4"], capacityGb: 32, sticks: 2, ramType: "DDR4", speedMhz: 3200, usedPricePln: 210, newPricePln: 270, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "16gb-ddr5-6000", type: "ram", name: "16 GB DDR5 6000 (2x8)", aliases: ["16gb ddr5", "2x8 ddr5"], capacityGb: 16, sticks: 2, ramType: "DDR5", speedMhz: 6000, usedPricePln: 170, newPricePln: 240, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "32gb-ddr5-6000", type: "ram", name: "32 GB DDR5 6000 (2x16)", aliases: ["32gb ddr5", "2x16 ddr5"], capacityGb: 32, sticks: 2, ramType: "DDR5", speedMhz: 6000, usedPricePln: 300, newPricePln: 390, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
];

export function getRamPrice(item: RamRecord, condition: "new" | "used") {
  return condition === "used" ? item.usedPricePln : item.newPricePln;
}
