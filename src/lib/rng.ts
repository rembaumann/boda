export type Rng = () => number;

export function unitInterval(rng: Rng): number {
  const value = rng();
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1 - Number.EPSILON;
  return value;
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sequenceRng(values: readonly number[]): Rng {
  let index = 0;
  return () => {
    const next = values[Math.min(index, Math.max(values.length - 1, 0))] ?? 0;
    index += 1;
    return next;
  };
}
