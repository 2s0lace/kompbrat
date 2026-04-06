import type { MotherboardRecord } from "@/lib/core/types";

const SOURCE = "KOMPBRAT local curated baseline v1";
const SOURCE_URL = "https://kompbrat.local/mobo-db";
const UPDATED_AT = "2026-04-06";

export const motherboardDb: MotherboardRecord[] = [
  { id: "h610m-ddr4-basic", type: "motherboard", name: "H610M DDR4 basic", aliases: ["h610", "h610m"], socket: "LGA1700", ramType: "DDR4", formFactor: "mATX", chipsetTier: 48, platformLongevity: 60, usedPricePln: 180, newPricePln: 290, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "b660m-ddr4", type: "motherboard", name: "B660M DDR4", aliases: ["b660", "b660m"], socket: "LGA1700", ramType: "DDR4", formFactor: "mATX", chipsetTier: 62, platformLongevity: 68, usedPricePln: 280, newPricePln: 420, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "b450m-basic", type: "motherboard", name: "B450M basic", aliases: ["b450", "b450m"], socket: "AM4", ramType: "DDR4", formFactor: "mATX", chipsetTier: 46, platformLongevity: 42, usedPricePln: 170, newPricePln: 270, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "b550m", type: "motherboard", name: "B550M", aliases: ["b550", "b550m"], socket: "AM4", ramType: "DDR4", formFactor: "mATX", chipsetTier: 64, platformLongevity: 50, usedPricePln: 250, newPricePln: 390, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "a620m", type: "motherboard", name: "A620M", aliases: ["a620", "a620m"], socket: "AM5", ramType: "DDR5", formFactor: "mATX", chipsetTier: 58, platformLongevity: 86, usedPricePln: 330, newPricePln: 460, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "b650m", type: "motherboard", name: "B650M", aliases: ["b650", "b650m"], socket: "AM5", ramType: "DDR5", formFactor: "mATX", chipsetTier: 72, platformLongevity: 92, usedPricePln: 480, newPricePln: 620, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
];

export function getMotherboardPrice(item: MotherboardRecord, condition: "new" | "used") {
  return condition === "used" ? item.usedPricePln : item.newPricePln;
}
