export type CheckerVerdict = "dobra okazja" | "średnia" | "nieopłacalna" | "podejrzanie dobra";

export type DetectedPartType = "CPU" | "GPU" | "RAM" | "DYSK" | "PŁYTA" | "PSU" | "CHŁODZENIE" | "CENA";
export type DetectionConfidence = "high" | "medium" | "low";
export type DetectionSource = "title" | "description" | "merged" | "explicit";
export type DetectionMethod = "label" | "scan";

export type DetectedPartAttributes = {
  vendor?: string;
  family?: string;
  series?: string;
  model?: string;
  suffix?: string;
  platform?: string;
  chipset?: string;
  memoryType?: "DDR3" | "DDR4" | "DDR5";
  ramGb?: number;
  ramSticks?: number;
  ramPerStickGb?: number;
  ramSpeedMhz?: number;
  storageGb?: number;
  storageKind?: "NVMe" | "SSD" | "HDD";
  storageInterface?: "Gen4" | "Gen3" | "SATA" | "PCIe";
  wattage?: number;
  efficiency?: "80+ Bronze" | "80+ Silver" | "80+ Gold" | "80+ Platinum";
  vramGb?: number;
};

export type DetectedPart = {
  type: DetectedPartType;
  name: string;
  confidence: DetectionConfidence;
  source: DetectionSource;
  canonicalId?: string;
  rawMatch?: string;
  attributes?: DetectedPartAttributes;
  debug?: {
    method: DetectionMethod;
    label?: string;
    matchedLine?: string;
    pattern?: string;
  };
};

export type PreprocessedText = {
  raw: string;
  normalized: string;
  compact: string;
};

export type ParsedOffer = {
  detectedParts: DetectedPart[];
  normalizedText: string;
  titleText: string;
  descriptionText: string;
  preprocessed: {
    title: PreprocessedText;
    description: PreprocessedText;
    combined: PreprocessedText;
  };
  price?: number;
  signals?: {
    hasWarrantyInfo?: boolean;
  };
};

export type CheckerInput = {
  title?: string;
  description: string;
  price?: number;
  url?: string;
};

export type CheckerHeuristics = {
  redFlags: string[];
  notes: string[];
  suspiciouslyLowPrice: boolean;
};

export type NormalizedStorage = {
  type: "HDD" | "SATA_SSD" | "NVME";
  sizeGb: number;
  knownModel?: boolean;
};

export type MotherboardTier = "unknown" | "very_basic" | "basic" | "mid" | "good";
export type PsuQuality = "unknown" | "bad" | "basic" | "decent" | "good";
export type CaseTier = "unknown" | "basic" | "airflow" | "premium";
export type CoolerTier = "unknown" | "stock" | "basic_tower" | "good_tower" | "aio";
export type ListingQuality = "poor" | "ok" | "good";

export type NormalizedOffer = {
  title?: string;
  askingPrice: number | null;
  cpuModel?: string | null;
  gpuModel?: string | null;
  ramGb?: number | null;
  ramType?: "DDR3" | "DDR4" | "DDR5" | null;
  storage?: NormalizedStorage[];
  motherboardTier?: MotherboardTier;
  psuQuality?: PsuQuality;
  psuKnownModel?: boolean;
  caseTier?: CaseTier;
  coolerTier?: CoolerTier;
  hasWarrantyInfo?: boolean;
  hasReturnOption?: boolean;
  hasInteriorPhotos?: boolean;
  hasHealthProof?: boolean;
  hasBenchmarks?: boolean;
  listingQuality?: ListingQuality;
  suspiciousUrgency?: boolean;
  titleDescriptionMismatch?: boolean;
  gamingBaitStyle?: boolean;
  detectedRedFlags?: string[];
};

export type ScoreBreakdownItem = {
  key: string;
  points: number;
  description: string;
};

export type ProfitabilityLabel = "Bierz" | "Negocjuj" | "Raczej nie" | "Odpuść";
export type RiskLabel = "Niskie" | "Średnie" | "Wysokie";

export type CheckerInsight = {
  text: string;
  reason_code: string;
};

export type CheckerInsights = {
  red_flags: CheckerInsight[];
  minuses: CheckerInsight[];
  to_verify: CheckerInsight[];
  positives: CheckerInsight[];
};

export type OfferScoringSummary = {
  shortVerdict: string;
  maxReasonablePrice?: number | null;
  keyTakeaways: string[];
  nextSteps: string[];
};

export type OfferScoringResult = {
  fairValue: number | null;
  fairValueRange?: { min: number; max: number } | null;
  priceRatio: number | null;
  profitabilityScore: number;
  profitabilityLabel: ProfitabilityLabel;
  riskScore: number;
  riskLabel: RiskLabel;
  subscores: {
    priceScore: number;
    balanceScore: number;
    confidenceScore: number;
  };
  profitabilityBreakdown: ScoreBreakdownItem[];
  riskBreakdown: ScoreBreakdownItem[];
  summary: OfferScoringSummary;
  verdictLabel?: ProfitabilityLabel;
  verdictSummary?: string;
  estimatedValueMin?: number | null;
  estimatedValueMax?: number | null;
  sensibleBuyPrice?: number | null;
  insights?: CheckerInsights;
  nextSteps?: string[];
};

export type MarketValueEstimate = {
  estimatedMarketValue?: number;
  confidence: DetectionConfidence;
  invalid: boolean;
  invalidReason?: string;
  detectedGpuTier?: string;
};

export type PsuAssessmentStatus = "ok" | "borderline" | "too_weak" | "unknown";
export type GpuPositionForPrice = "too_weak" | "borderline" | "ok" | "strong";

export type PsuRecommendation = {
  recommendedWattage?: number;
  minimumSuggestedWattage?: number;
  note: string;
  confidence: DetectionConfidence;
};

export type PsuAssessment = {
  recommendedWattage?: number;
  minimumSuggestedWattage?: number;
  offeredWattage?: number;
  status: PsuAssessmentStatus;
  summary: string;
  warning?: string;
  note: string;
  confidence: DetectionConfidence;
};

export type GpuValueCheck = {
  gpu_found: string;
  price_bracket: string;
  gpu_position_for_price: GpuPositionForPrice;
  explanation: string;
  redFlags: string[];
  notes: string[];
};

export type CheckerResult = {
  verdict: CheckerVerdict;
  score: number;
  valueScore: number;
  riskScore: number;
  profitabilityScore?: number;
  profitabilityLabel?: ProfitabilityLabel;
  riskLabel?: RiskLabel;
  fairValue?: number | null;
  fairValueRange?: { min: number; max: number } | null;
  priceRatio?: number | null;
  subscores?: {
    priceScore: number;
    balanceScore: number;
    confidenceScore: number;
  };
  profitabilityBreakdown?: ScoreBreakdownItem[];
  riskBreakdown?: ScoreBreakdownItem[];
  decisionSummary?: OfferScoringSummary;
  verdictLabel?: ProfitabilityLabel;
  verdictSummary?: string;
  estimatedValueMin?: number | null;
  estimatedValueMax?: number | null;
  sensibleBuyPrice?: number | null;
  insights?: CheckerInsights;
  nextSteps?: string[];
  summary: string;
  detectedParts: DetectedPart[];
  redFlags: string[];
  betterAlternative: string;
  estimatedMarketValue?: number;
  estimatedMarketValueConfidence?: DetectionConfidence;
  valuationNote?: string;
  psuAssessment?: PsuAssessment;
  gpuValueCheck?: GpuValueCheck;
};
