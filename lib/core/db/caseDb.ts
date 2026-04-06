import type { CaseRecord } from "@/lib/core/types";

const SOURCE = "KOMPBRAT local curated baseline v1";
const SOURCE_URL = "https://kompbrat.local/case-db";
const UPDATED_AT = "2026-04-06";

export const caseDb: CaseRecord[] = [
  { id: "case-basic-matx", type: "case", name: "Basic mATX airflow", aliases: ["basic matx case"], maxGpuLengthMm: 320, supportedFormFactors: ["mATX"], airflowScore: 50, usedPricePln: 80, newPricePln: 140, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
  { id: "case-airflow-atx", type: "case", name: "Airflow ATX", aliases: ["airflow atx case"], maxGpuLengthMm: 360, supportedFormFactors: ["mATX", "ATX"], airflowScore: 72, usedPricePln: 120, newPricePln: 190, source: SOURCE, sourceUrl: SOURCE_URL, updatedAt: UPDATED_AT },
];

export function getCasePrice(item: CaseRecord, condition: "new" | "used") {
  return condition === "used" ? item.usedPricePln : item.newPricePln;
}
