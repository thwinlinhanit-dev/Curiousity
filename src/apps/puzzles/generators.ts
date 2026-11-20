// Deterministic puzzle generators. No runtime model, no invented answers:
// every puzzle is built from a seed and checked against the value it was built from.
export type Level = "easy" | "medium" | "hard";
export type Kind = "sequences" | "magic" | "roman" | "balance" | "codes" | "anagrams";
export type Item = { q: string; answer: string; solution: string; input?: "text" | "grid"; size?: number; cells?: (number | null)[][] };
export type Sheet = { kind: Kind; level: Level; seed: number; items: Item[] };

export const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(R: () => number, xs: T[]) => xs[Math.floor(R() * xs.length)];
const range = (R: () => number, a: number, b: number) => a + Math.floor(R() * (b - a + 1));

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];

function sequences(level: Level, R: () => number): Item[] {
  const n = 5;
  return Array.from({ length: 3 }, () => {
    const start = range(R, 1, 9);
    let terms: number[] = [], rule = "";
    if (level === "easy") {
      const d = range(R, 2, 9);
      terms = Array.from({ length: n + 1 }, (_, i) => start + d * i);
      rule = `add ${d} each time`;
      if (R() < 0.3) { terms = Array.from({ length: n + 1 }, (_, i) => start * 2 ** i); rule = "double each time"; }
    } else if (level === "medium") {
      const m = range(R, 2, 4);
      if (R() < 0.5) { terms = Array.from({ length: n + 1 }, (_, i) => start * m ** i); rule = `multiply by ${m}`; }
      else { terms = Array.from({ length: n + 1 }, (_, i) => (start + i) ** 2); rule = "square numbers, starting at " + start; }
    } else {
      const m = range(R, 2, 3), d = range(R, 1, 5);
      if (R() < 0.5) { terms = Array.from({ length: n + 1 }, (_, i) => start * m ** i + d * ((m ** i - 1) / (m - 1))); rule = `multiply by ${m}, then add ${d}`; }
      else { terms = PRIMES.slice(start % 8, (start % 8) + n + 1); rule = "prime numbers"; }
    }
    const answer = String(terms[n]);
    return { q: `${terms.slice(0, n).join(", ")}, ___`, answer, solution: `${answer} — rule: ${rule}`, input: "text" as const };
  });
}

const LOSHU = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
const DURER = [[16, 3, 2, 13], [5, 10, 11, 8], [9, 6, 7, 12], [4, 15, 14, 1]];
function magic(level: Level, R: () => number): Item[] {
  const size = level === "hard" ? 4 : 3;
  const base = size === 3 ? LOSHU : DURER;
  const rot = range(R, 0, 3), flip = R() < 0.5;
  let grid = base.map((row) => [...row]);
  for (let i = 0; i < rot; i++) grid = grid[0].map((_, c) => grid.map((r) => r[c]).reverse());
  if (flip) grid = grid.map((r) => [...r].reverse());
  const a = range(R, 1, 4), d = range(R, 1, 3);
  grid = grid.map((row) => row.map((v) => a + (v - 1) * d));
  const blanks = level === "easy" ? 3 : level === "medium" ? 5 : 8;
  const cells: (number | null)[][] = grid.map((row) => [...row]);
  const positions = Array.from({ length: size * size }, (_, i) => i).sort(() => R() - 0.5).slice(0, blanks);
  for (const p of positions) cells[Math.floor(p / size)][p % size] = null;
  const sum = size === 3 ? 3 * (a + (5 - 1) * d) : 4 * (a + (8.5 - 1) * d);
  return [{ q: `Fill the ${size}×${size} square. Every row, column and diagonal adds to ${Math.round(sum)}.`,
    answer: grid.flat().join(","), solution: grid.map((r) => r.join(" ")).join(" | "), input: "grid", size, cells }];
}

const ROMAN: [number, string][] = [[1, "I"], [4, "IV"], [5, "V"], [9, "IX"], [10, "X"], [40, "XL"], [50, "L"], [90, "XC"], [100, "C"], [400, "CD"], [500, "D"], [900, "CM"], [1000, "M"]];
function toRoman(n: number) { let s = ""; for (const [v, r] of [...ROMAN].reverse()) while (n >= v) { s += r; n -= v; } return s; }
function roman(level: Level, R: () => number): Item[] {
  const max = level === "easy" ? 39 : level === "medium" ? 399 : 3999;
  return Array.from({ length: 5 }, () => {
    const n = range(R, 1, max), toNum = R() < 0.5;
    return toNum
      ? { q: `${toRoman(n)} = ?`, answer: String(n), solution: `${toRoman(n)} = ${n}`, input: "text" as const }
      : { q: `${n} = ?`, answer: toRoman(n), solution: `${n} = ${toRoman(n)}`, input: "text" as const };
  });
}

const SHAPES = ["circle", "square", "triangle", "star", "hexagon"];
function balance(level: Level, R: () => number): Item[] {
  const count = level === "easy" ? 2 : level === "medium" ? 3 : 4;
  const shapes = SHAPES.slice(0, count);
  const weights = Array.from({ length: count }, () => range(R, 1, 9));
  while (new Set(weights).size < count) for (let i = 0; i < count; i++) weights[i] = range(R, 1, 9);
  const equations: string[] = [];
  if (level === "easy") {
    equations.push(`${shapes[0]} = ${weights[0]}`);
    equations.push(`${shapes[0]} + ${shapes[0]} = ${shapes[1]} + ${weights[0] + weights[0] - weights[1]}`);
  } else {
    for (let i = 0; i < count - 1; i++) {
      const a = shapes[i], b = shapes[i + 1];
      const left = weights[i] + weights[(i + 2) % count];
      const right = weights[i + 1] + (left - weights[i + 1]);
      equations.push(`${a} + ${shapes[(i + 2) % count]} = ${b} + ${(left - weights[i + 1])}`);
      void right;
    }
    equations.push(`${shapes[count - 1]} = ${weights[count - 1]}`);
  }
  return [{ q: equations.join("  ·  ") + "  →  what does each shape weigh?",
    answer: shapes.map((s, i) => `${s}=${weights[i]}`).join(", "),
    solution: shapes.map((s, i) => `${s}=${weights[i]}`).join(", "), input: "text" as const }];
}

function codes(level: Level, R: () => number): Item[] {
  return Array.from({ length: 5 }, () => {
    const n = level === "easy" ? range(R, 1, 31) : level === "medium" ? range(R, 1, 255) : range(R, 1, 4095);
    const toBin = level === "easy" || (level === "hard" && R() < 0.5);
    const ans = toBin ? n.toString(2) : n.toString(16).toUpperCase();
    return { q: `${n} in ${toBin ? "binary" : "hexadecimal"} = ?`, answer: ans, solution: `${n} = ${toBin ? "0b" : "0x"}${ans}`, input: "text" as const };
  });
}

function anagrams(level: Level, R: () => number, words: { slug: string; mean: string }[]): Item[] {
  const pool = words.filter((w) => w.slug.length >= (level === "easy" ? 4 : level === "medium" ? 6 : 8) && w.slug.length <= 11);
  return Array.from({ length: 5 }, () => {
    const w = pick(R, pool.length ? pool : words);
    const letters = [...w.slug].sort(() => R() - 0.5).join("");
    return { q: `Unscramble “${letters}” — clue: ${w.mean}`, answer: w.slug, solution: `${letters} → ${w.slug} (${w.mean})`, input: "text" as const };
  });
}

export function generate(kind: Kind, level: Level, seed: number, words: { slug: string; mean: string }[] = []): Sheet {
  const R = mulberry32(seed);
  const items = kind === "sequences" ? sequences(level, R)
    : kind === "magic" ? magic(level, R)
    : kind === "roman" ? roman(level, R)
    : kind === "balance" ? balance(level, R)
    : kind === "codes" ? codes(level, R)
    : anagrams(level, R, words);
  return { kind, level, seed, items };
}
