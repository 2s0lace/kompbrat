export function weightedScore(entries: Array<{ value: number; weight: number }>) {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedTotal = entries.reduce((sum, entry) => sum + entry.value * Math.max(0, entry.weight), 0);
  return weightedTotal / totalWeight;
}
