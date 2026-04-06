export function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMetric(value: number, min: number, max: number) {
  if (max <= min) {
    return 0;
  }

  return clampScore(((value - min) / (max - min)) * 100);
}

export function normalizeInverseMetric(value: number, min: number, max: number) {
  return 100 - normalizeMetric(value, min, max);
}

export function valueIndex(performance: number, price: number) {
  if (price <= 0) {
    return 0;
  }

  return performance / price;
}
