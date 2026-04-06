export type IntentType = "compare_parts" | "recommend_build";
export type PartType = "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "case";
export type UsagePurpose = "gaming" | "productivity" | "mixed";
export type MarketCondition = "new" | "used" | "mixed";
export type TargetResolution = "1080p" | "1440p" | "4k";

export type Priorities = {
  value: number;
  longevity: number;
  efficiency: number;
  gaming: number;
  productivity: number;
  rayTracing: number;
  streaming: number;
};

export type IntentConstraints = {
  mustHaveNvenc?: boolean;
  mustHaveDlss?: boolean;
  preferUpgradePath?: boolean;
  lowNoise?: boolean;
};

export type ParsedIntent = {
  intentType: IntentType;
  partType: "cpu" | "gpu" | null;
  candidates: string[];
  purpose: UsagePurpose;
  condition: MarketCondition | null;
  budgetPln: number | null;
  workloadProfile: string | null;
  targetResolution: TargetResolution | null;
  targetFps: number | null;
  priorities: Priorities;
  constraints: IntentConstraints;
};

export type WorkloadProfile = {
  id:
    | "esports_competitive"
    | "shooter_high_fps"
    | "aaa_visual"
    | "story_visual"
    | "mixed_gaming"
    | "gaming_plus_streaming"
    | "gaming_plus_productivity"
    | "creator_light"
    | "creator_heavy";
  label: string;
  defaultResolution: TargetResolution;
  defaultTargetFps: number;
  cpuWeight: number;
  gpuWeight: number;
  ramWeight: number;
  storageWeight: number;
  rayTracingWeight: number;
  streamingWeight: number;
  productivityWeight: number;
  longevityWeight: number;
};

export type BudgetProfile = {
  id: string;
  minBudget: number;
  maxBudget: number;
  label: "entry-level" | "budget value" | "solid midrange" | "strong build";
  preferredRamGb: number;
  minimumRamGb: number;
  preferredStorageGb: number;
  minimumStorageGb: number;
};

export type BasePartRecord = {
  id: string;
  name: string;
  aliases: string[];
  newPricePln: number | null;
  usedPricePln: number | null;
  source: string;
  sourceUrl: string;
  updatedAt: string;
};

export type CpuRecord = BasePartRecord & {
  type: "cpu";
  cores: number;
  threads: number;
  socket: string;
  igpu: boolean;
  powerW: number;
  singleThreadScore: number;
  multiThreadScore: number;
  gamingTierScore: number;
  efficiencyScore: number;
  platformScore: number;
};

export type GpuRecord = BasePartRecord & {
  type: "gpu";
  vendor: "AMD" | "NVIDIA" | "Intel";
  vramGb: number;
  raster1080p: number;
  raster1440p: number;
  raster4k: number;
  rtScore: number;
  powerW: number;
  dlss: boolean;
  fsr: boolean;
  nvenc: boolean;
  cuda: boolean;
  av1Encode: boolean;
};

export type MotherboardRecord = BasePartRecord & {
  type: "motherboard";
  socket: string;
  ramType: "DDR4" | "DDR5";
  formFactor: "mATX" | "ATX";
  chipsetTier: number;
  platformLongevity: number;
};

export type RamRecord = BasePartRecord & {
  type: "ram";
  capacityGb: number;
  sticks: number;
  ramType: "DDR4" | "DDR5";
  speedMhz: number;
};

export type StorageRecord = BasePartRecord & {
  type: "storage";
  capacityGb: number;
  storageType: "SATA_SSD" | "NVME";
  tierScore: number;
};

export type PsuRecord = BasePartRecord & {
  type: "psu";
  wattage: number;
  efficiencyBadge: "80+ Bronze" | "80+ Gold";
  qualityScore: number;
};

export type CaseRecord = BasePartRecord & {
  type: "case";
  maxGpuLengthMm: number;
  supportedFormFactors: Array<"mATX" | "ATX">;
  airflowScore: number;
};

export type PartRecord = CpuRecord | GpuRecord | MotherboardRecord | RamRecord | StorageRecord | PsuRecord | CaseRecord;

export type ScoredPart<T extends PartRecord> = {
  item: T;
  score: number;
  price: number;
  reasons: string[];
  tradeoffs: string[];
};

export type PartComparisonResult<T extends CpuRecord | GpuRecord> = {
  partType: "cpu" | "gpu";
  winner: T | null;
  ranking: Array<ScoredPart<T>>;
  reasons: string[];
  tradeoffs: string[];
  intent: ParsedIntent;
};

export type BuildPartSelection = {
  cpu: CpuRecord;
  gpu: GpuRecord;
  motherboard: MotherboardRecord;
  ram: RamRecord;
  storage: StorageRecord;
  psu: PsuRecord;
  case: CaseRecord;
};

export type BuildValidationIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export type BuildValidationResult = {
  valid: boolean;
  issues: BuildValidationIssue[];
  totalPrice: number;
  estimatedPowerDraw: number;
  psuHeadroomW: number;
};

export type BuildRecommendationResult = {
  intent: ParsedIntent;
  inferredWorkloadProfile: WorkloadProfile;
  suggestedPriorities: Priorities;
  missingRequiredData: string[];
  feasible: boolean;
  strengthLabel: BudgetProfile["label"] | null;
  build: BuildPartSelection | null;
  totalPrice: number | null;
  validation: BuildValidationResult | null;
  reasons: string[];
  tradeoffs: string[];
  nextSteps: string[];
  marketNote?: string;
};

export type PartFinderResult = {
  matched: boolean;
  normalizedName: string | null;
  vendor?: string | null;
  series?: string | null;
  family?: string | null;
  confidence: number;
  rawMatch: string | null;
};
