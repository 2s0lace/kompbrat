import type { CaseTier, CoolerTier, MotherboardTier, PsuQuality } from "@/types/checker";

export const SCORING_WEIGHTS = {
  price: 0.7,
  balance: 0.2,
  confidence: 0.1,
} as const;

export const PRICE_SCORE_STEPS = [
  { maxRatio: 0.85, score: 100 },
  { maxRatio: 0.95, score: 92 },
  { maxRatio: 1.0, score: 85 },
  { maxRatio: 1.05, score: 75 },
  { maxRatio: 1.1, score: 65 },
  { maxRatio: 1.15, score: 55 },
  { maxRatio: 1.2, score: 45 },
  { maxRatio: 1.25, score: 35 },
  { maxRatio: 1.3, score: 25 },
  { maxRatio: 1.4, score: 15 },
  { maxRatio: 1.5, score: 8 },
] as const;

export const RAM_VALUE_BY_SIZE = {
  DDR3: { 8: 40, 16: 80, 32: 140, 64: 220 },
  DDR4: { 8: 50, 16: 100, 32: 190, 64: 320 },
  DDR5: { 8: 90, 16: 200, 32: 360, 64: 650 },
} as const;

export const STORAGE_VALUE_BY_TYPE = {
  HDD: {
    500: 30,
    1000: 55,
    2000: 90,
  },
  SATA_SSD: {
    240: 35,
    480: 60,
    1000: 110,
    2000: 170,
  },
  NVME: {
    250: 45,
    500: 80,
    1000: 170,
    2000: 290,
  },
} as const;

export const MOTHERBOARD_TIER_VALUES: Record<MotherboardTier, number> = {
  unknown: 0,
  very_basic: 120,
  basic: 220,
  mid: 360,
  good: 520,
};

export const PSU_QUALITY_VALUES: Record<PsuQuality, number> = {
  unknown: 0,
  bad: 50,
  basic: 110,
  decent: 180,
  good: 260,
};

export const CASE_TIER_VALUES: Record<CaseTier, number> = {
  unknown: 80,
  basic: 120,
  airflow: 180,
  premium: 260,
};

export const COOLER_TIER_VALUES: Record<CoolerTier, number> = {
  unknown: 0,
  stock: 0,
  basic_tower: 70,
  good_tower: 140,
  aio: 180,
};

export const FALLBACK_GPU_VALUE_BY_TIER = {
  0: 50,
  1: 120,
  2: 240,
  3: 430,
  4: 700,
  5: 1050,
  6: 1650,
  7: 2450,
  8: 3600,
} as const;

export const FALLBACK_CPU_VALUE_BY_TIER = {
  0: 50,
  1: 120,
  2: 220,
  3: 360,
  4: 520,
  5: 760,
  6: 1150,
} as const;

export const BALANCE_PENALTIES = {
  lowRamAtPrice: 25,
  noSsd: 15,
  tinySsdAtHigherPrice: 10,
  cpuGpuMismatch: 20,
  weakGpuForPrice: 15,
  oldPlatformAtHighPrice: 10,
  gamingBaitWeakConfig: 10,
  noGpuForGamingBait: 18,
} as const;

export const CONFIDENCE_PENALTIES = {
  missingPsuModel: 25,
  missingMotherboardInfo: 15,
  missingStorageInfo: 10,
  weakRamDetail: 10,
  poorListing: 10,
  missingInteriorPhotos: 10,
  missingHealthProof: 10,
  missingWarrantyInfo: 10,
} as const;

export const RISK_POINTS = {
  missingPsuModel: 20,
  missingMotherboardModel: 10,
  missingStorageModel: 8,
  missingHealthProof: 8,
  missingInteriorPhotos: 10,
  missingBenchmarksAtSuspiciousOffer: 8,
  missingWarranty: 15,
  noReturn: 10,
  urgency: 10,
  poorListing: 15,
  titleDescriptionMismatch: 20,
  unclearPartsBuild: 20,
  suspiciouslyCheap: 20,
  overpricedPoorListing: 15,
  oldGamingBait: 15,
  tooWeakPsu: 15,
} as const;

export const FAIR_VALUE_RANGE_MARGIN = {
  high: 0.08,
  medium: 0.12,
  low: 0.18,
} as const;

