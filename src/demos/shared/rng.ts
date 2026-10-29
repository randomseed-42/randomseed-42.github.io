// Deterministic RNG so the synthetic data is identical on every visit.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof mulberry32>

export function normal(rng: Rng, mean = 0, sd = 1) {
  const u = 1 - rng()
  const v = rng()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Weighted choice: weights need not sum to 1. */
export function weighted<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function round(x: number, dp = 2) {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function hexId(rng: Rng, len: number) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(rng() * 16).toString(16)
  return s
}
