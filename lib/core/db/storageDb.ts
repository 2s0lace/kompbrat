import type { StorageRecord } from "@/lib/core/types";

const SOURCE = "KOMPBRAT local curated baseline v1";
const SOURCE_URL = "https://kompbrat.local/storage-db";
const UPDATED_AT = "2026-04-06";

export const storageDb: StorageRecord[] = [
  { id: "500gb-sata-ssd", type: "storage", name: "500 GB SATA SSD", aliases: ["500gb ssd", "500 sata ssd"], capacityGb: 500, storageType: "SATA_SSD", tierScore: 48, usedPricePln: 70, newPricePln: 110, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "500gb-nvme", type: "storage", name: "500 GB NVMe SSD", aliases: ["500gb nvme", "500 nvme"], capacityGb: 500, storageType: "NVME", tierScore: 64, usedPricePln: 95, newPricePln: 140, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "1tb-sata-ssd", type: "storage", name: "1 TB SATA SSD", aliases: ["1tb ssd", "1tb sata ssd"], capacityGb: 1000, storageType: "SATA_SSD", tierScore: 58, usedPricePln: 140, newPricePln: 190, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "1tb-nvme", type: "storage", name: "1 TB NVMe SSD", aliases: ["1tb nvme", "1 tb nvme"], capacityGb: 1000, storageType: "NVME", tierScore: 78, usedPricePln: 170, newPricePln: 230, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
];

export function getStoragePrice(item: StorageRecord, condition: "new" | "used") {
  return condition === "used" ? item.usedPricePln : item.newPricePln;
}
