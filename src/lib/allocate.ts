export function allocateCounts<T extends string | number>(
  weights: Record<T, number>,
  total: number,
  order: readonly T[],
): Record<T, number> {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error("Count must be a non-negative integer.");
  }

  const counts = {} as Record<T, number>;
  for (const key of order) counts[key] = 0;
  if (total === 0) return counts;

  const rows = order.map((key, index) => {
    const weight = Math.max(0, weights[key] ?? 0);
    return { key, index, weight };
  });
  const weightSum = rows.reduce((sum, row) => sum + row.weight, 0);
  if (weightSum === 0) return counts;

  const ranked = rows.map((row) => {
    const exact = (row.weight / weightSum) * total;
    const floor = Math.floor(exact);
    return { ...row, floor, frac: exact - floor };
  });

  for (const row of ranked) counts[row.key] = row.floor;
  let remaining = total - ranked.reduce((sum, row) => sum + row.floor, 0);
  const byRemainder = [...ranked].sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const row of byRemainder) {
    if (remaining <= 0) break;
    counts[row.key] = (counts[row.key] ?? 0) + 1;
    remaining -= 1;
  }
  return counts;
}
