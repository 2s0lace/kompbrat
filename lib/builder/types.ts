import type { BudgetGuideline, BuildCategory } from "@/lib/value-guidelines";

export type BuilderMarketMode = "new" | "used" | "mixed";

export type BuilderComponentType = "gpu" | "cpu" | "motherboard" | "ram" | "storage" | "psu" | "case" | "cooler" | "build";

export type PriceConfidence = "high" | "medium" | "low";

export type BuilderGpuCandidate = {
  kind: "gpu";
  id: string;
  name: string;
  marketMode: "new" | "used";
  integrated?: boolean;
  minBudget: number;
  maxBudget?: number;
  fallbackPrice: number;
  performanceScore: number;
  valueScore: number;
  riskPenalty: number;
  powerDrawWatts: number;
  vramGb?: number;
  priority: number;
  useCaseTags: string[];
};

export type BuilderCpuCandidate = {
  kind: "cpu";
  id: string;
  name: string;
  platform: "am4" | "am5" | "lga1700";
  hasIntegratedGpu?: boolean;
  minBudget: number;
  maxBudget?: number;
  fallbackPrice: number;
  gamingScore: number;
  productivityScore: number;
  valueScore: number;
  upgradeScore: number;
  riskPenalty: number;
  priority: number;
};

export type BuilderCandidatePool = {
  marketMode: BuilderMarketMode;
  targetBudget: number;
  useCase: string;
  category?: BuildCategory;
  guideline?: BudgetGuideline | null;
  gpus: BuilderGpuCandidate[];
  cpus: BuilderCpuCandidate[];
};

export type MarketQueryDefinition = {
  key: string;
  label: string;
  componentType: BuilderComponentType;
  query: string;
  referencePrice: number;
};

export type BuilderPartEstimate = {
  key: string;
  type: string;
  name: string;
  condition?: "new" | "used";
  estimatedPrice: number;
  componentType: BuilderComponentType;
};

export type ComponentPriceSnapshot = {
  key: string;
  label: string;
  componentType: BuilderComponentType;
  query: string;
  prices: number[];
  medianPrice: number | null;
  trimmedMeanPrice: number | null;
  bestGuessPrice: number;
  sampleCount: number;
  confidence: PriceConfidence;
  sourceUrls: string[];
};

export type BuildBasket = {
  id: string;
  title: string;
  marketMode: BuilderMarketMode;
  useCase: string;
  gpu: BuilderGpuCandidate;
  cpu: BuilderCpuCandidate;
  parts: BuilderPartEstimate[];
  estimatedTotal: number;
  notes: string[];
  warnings: string[];
  priceConfidence: PriceConfidence;
};

export type BasketScoreBreakdown = {
  gpuValue: number;
  cpuAdequacy: number;
  memoryStorage: number;
  platformQuality: number;
  upgradePath: number;
  riskPenalty: number;
  total: number;
};

export type ScoredBuildBasket = BuildBasket & {
  score: number;
  breakdown: BasketScoreBreakdown;
  reasons: string[];
};

export type BuilderPolicyDecision = {
  status: "success" | "not_feasible_in_selected_mode" | "not_recommended_in_selected_mode";
  selectedMode: BuilderMarketMode;
  actualModeUsed: BuilderMarketMode;
  feasibleInSelectedMode: boolean;
  recommendedFallbackMode?: BuilderMarketMode | null;
  modeMessage?: string;
  warningMessage?: string;
  recommendedMode: BuilderMarketMode;
  recommendedBasket: ScoredBuildBasket;
  alternativeBasket?: ScoredBuildBasket;
  policyReason: string;
  alternativeReason?: string;
  modeScores: Partial<Record<BuilderMarketMode, number>>;
};
