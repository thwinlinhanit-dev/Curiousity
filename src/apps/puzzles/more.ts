// Additional deterministic puzzle families. Each question is built from the
// same values that form its answer, so no answer is ever invented.
import { mulberry32, type Item, type Kind, type Level, type Sheet } from "./generators";

export type MoreKind = "crosssum" | "sudoku" | "nonogram" | "logicgrid" | "caesar" | "morse" | "wordladder" | "matchsticks"
  | "cages" | "classics" | "ladders" | "wordsense" | "bases" | "mazes";

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
  K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
};

function crosssum(level: Level, R: () => number): Item[] {
  const n = level === "hard" ? 4 : 3;
  const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => 1 + Math.floor(R() * 9)));
  const rows = grid.map((r) => r.reduce((a, b) => a + b, 0));
  const cols = Array.from({ length: n }, (_, c) => grid.reduce((a, r) => a + r[c], 0));
  const blanks = Math.floor(n * n * (level === "easy" ? 0.3 : 0.6));
  const cells: (number | null)[][] = grid.map((r) => [...r]);
  const spots = Array.from({ length: n * n }, (_, i) => i).sort(() => R() - 0.5).slice(0, blanks);
  for (const p of spots) cells[Math.floor(p / n)][p % n] = null;
  return [{ q: `Fill the ${n}×${n} grid. Row sums: ${rows.join(", ")}. Column sums: ${cols.join(", ")}.`,
    answer: grid.flat().join(","), solution: grid.map((r) => r.join(" ")).join(" | "), input: "grid", size: n, cells }];
}

function sudoku(level: Level, R: () => number): Item[] {
  const n = level === "hard" ? 4 : 3;
  const base = n === 3 ? [[1, 2, 3], [3, 1, 2], [2, 3, 1]] : [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
  const perm = Array.from({ length: n }, (_, i) => i + 1).sort(() => R() - 0.5);
  const grid = base.map((row) => row.map((v) => perm[v - 1]));
  const blanks = Math.floor(n * n * (level === "easy" ? 0.35 : 0.6));
  const cells: (number | null)[][] = grid.map((r) => [...r]);
  const spots = Array.from({ length: n * n }, (_, i) => i).sort(() => R() - 0.5).slice(0, blanks);
  for (const p of spots) cells[Math.floor(p / n)][p % n] = null;
  return [{ q: `Complete the ${n}×${n} Latin square: each digit 1–${n} appears once in every row and column.`,
    answer: grid.flat().join(","), solution: grid.map((r) => r.join(" ")).join(" | "), input: "grid", size: n, cells }];
}

function nonogram(level: Level, R: () => number): Item[] {
  const n = level === "easy" ? 4 : 5;
  const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => R() < 0.45));
  const runs = (line: boolean[]) => {
    const out: number[] = []; let k = 0;
    for (const v of [...line, false]) { if (v) k++; else if (k) { out.push(k); k = 0; } }
    return out.length ? out : [0];
  };
  const rows = grid.map(runs);
  const cols = Array.from({ length: n }, (_, c) => runs(grid.map((r) => r[c])));
  const cells = grid.map((r) => r.map(() => null));
  return [{ q: `Fill the ${n}×${n} grid. Row clues: ${rows.map((r) => r.join(".")).join(" | ")}. Column clues: ${cols.map((c) => c.join(".")).join(" | ")}.`,
    answer: grid.flat().map(Number).join(","),
    solution: `${grid.flat().map(Number).join(",")} — ${grid.map((r) => r.map((v) => v ? "█" : "·").join("")).join(" | ")}`,
    input: "grid", size: n, cells }];
}

function logicgrid(level: Level, R: () => number): Item[] {
  const names = ["Ana", "Ben", "Cleo", "Dev"];
  const pets = ["cat", "dog", "fox", "owl"];
  const k = level === "easy" ? 3 : 4;
  const p = pets.slice(0, k).sort(() => R() - 0.5);
  const clues = names.slice(0, k).map((n, i) => `${n} does not have the ${pets[(i + 1) % k]}.`);
  clues.push(`Ana has the ${p[0]}.`);
  return [{ q: clues.join(" "), answer: names.slice(0, k).map((n, i) => `${n}=${p[i]}`).join(", "),
    solution: names.slice(0, k).map((n, i) => `${n}=${p[i]}`).join(", "), input: "text" as const }];
}

function caesar(level: Level, R: () => number): Item[] {
  const words = ["rook", "chess", "philosophy", "geometry", "history", "language", "science", "music"];
  return Array.from({ length: 4 }, () => {
    const w = words[Math.floor(R() * words.length)], shift = 1 + Math.floor(R() * (level === "easy" ? 5 : 20));
    const enc = [...w].map((c) => String.fromCharCode(97 + ((c.charCodeAt(0) - 97 + shift) % 26))).join("");
    return { q: `Decode “${enc}” (Caesar shift ${shift}).`, answer: w, solution: `${enc} → ${w} (shift ${shift})`, input: "text" as const };
  });
}

function morse(_level: Level, R: () => number): Item[] {
  const letters = Object.keys(MORSE);
  return Array.from({ length: 5 }, () => {
    const toCode = R() < 0.5, c = letters[Math.floor(R() * letters.length)];
    return toCode
      ? { q: `${c} in Morse = ?`, answer: MORSE[c], solution: `${c} = ${MORSE[c]}`, input: "text" as const }
      : { q: `${MORSE[c]} is which letter?`, answer: c, solution: `${MORSE[c]} = ${c}`, input: "text" as const };
  });
}

function wordladder(level: Level, R: () => number, words: { slug: string }[]): Item[] {
  const pool = words.filter((w) => w.slug.length === (level === "easy" ? 4 : level === "medium" ? 5 : 6)).slice(0, 200);
  const source = pool.length ? pool : words;
  const w = source[Math.floor(R() * source.length)].slug;
  const scrambled = [...w].sort(() => R() - 0.5).join("");
  return [{ q: `Make a one-letter change at each step: ${scrambled} → ? (start word)`, answer: w,
    solution: `${scrambled} → ${w}`, input: "text" as const }];
}

function matchsticks(_level: Level, R: () => number): Item[] {
  const a = 1 + Math.floor(R() * 9), b = 1 + Math.floor(R() * 9), sum = a + b;
  const wrong = sum + (R() < 0.5 ? 1 : -1);
  return [{ q: `Move one stick to fix it: ${a} + ${b} = ${wrong}`, answer: String(sum),
    solution: `Change ${wrong} to ${sum}: ${a} + ${b} = ${sum}`, input: "text" as const }];
}

function cages(level: Level, R: () => number): Item[] {
  const n = 3, grid = Array.from({ length: n }, () => Array.from({ length: n }, () => 1 + Math.floor(R() * 9)));
  const groups = [0, 1, 2].map((r) => ({ cells: [r * 3, r * 3 + 1, r * 3 + 2], target: grid[r].reduce((a, b) => a + b, 0), op: "+" }));
  const cells: (number | null)[][] = grid.map((r) => [...r]);
  for (const g of groups) for (const p of g.cells.slice(0, level === "easy" ? 1 : 2)) cells[Math.floor(p / 3)][p % 3] = null;
  return [{ q: `Fill each row so its three digits add to its cage total: ${groups.map((g, i) => `row ${i + 1} = ${g.target}`).join(", ")}.`,
    answer: grid.flat().join(","), solution: `${grid.flat().join(",")} — ${groups.map((g) => g.target).join(",")}`, input: "grid", size: n, cells }];
}

function classics(level: Level, R: () => number): Item[] {
  const sets: { seq: number[]; rule: string }[] = [
    { seq: [2, 3, 5, 7, 11, 13], rule: "primes" }, { seq: [1, 4, 9, 16, 25, 36], rule: "squares" },
    { seq: [1, 1, 2, 3, 5, 8], rule: "Fibonacci" }, { seq: [1, 2, 4, 8, 16, 32], rule: "powers of two" },
    { seq: [1, 8, 27, 64, 125, 216], rule: "cubes" },
  ];
  const s = sets[Math.floor(R() * sets.length)];
  const shown = level === "easy" ? s.seq.slice(0, 4) : s.seq.slice(0, 5);
  return [{ q: `Next in the famous sequence: ${shown.join(", ")}, ___`, answer: String(s.seq[shown.length]),
    solution: `${s.seq[shown.length]} — ${s.rule}`, input: "text" as const }];
}

function ladders(level: Level, R: () => number): Item[] {
  const start = 1 + Math.floor(R() * 5), op = level === "easy" ? "+3" : level === "medium" ? "×2" : "×2+1";
  const grid: number[] = [start];
  for (let i = 0; i < 5; i++) grid.push(op === "+3" ? grid[i] + 3 : op === "×2" ? grid[i] * 2 : grid[i] * 2 + 1);
  const ask = 2 + Math.floor(R() * 3);
  return [{ q: `Climb the ladder (${op} each rung): ${grid[0]} → ${grid[1]} → ___ → ${grid[3]} → ${grid[4]} → ${grid[5]}`,
    answer: String(grid[ask]), solution: `rung ${ask + 1} = ${grid[ask]} (${op} each step)`, input: "text" as const }];
}

function wordsense(level: Level, R: () => number, words: { slug: string; mean?: string }[]): Item[] {
  const pool = words.filter((w) => w.mean && w.slug.length >= (level === "hard" ? 6 : 4));
  const base = pool.length ? pool : [{ slug: "logos", mean: "word, message, account" }];
  return Array.from({ length: 4 }, () => {
    const w = base[Math.floor(R() * base.length)];
    const others = base.filter((x) => x.slug !== w.slug).sort(() => R() - 0.5).slice(0, level === "easy" ? 1 : 3);
    return { q: `“${w.mean}” — which word? ${[w, ...others].sort(() => R() - 0.5).map((x) => x.slug).join(" / ")}`,
      answer: w.slug, solution: `${w.mean} = ${w.slug}`, input: "text" as const };
  });
}

function bases(_level: Level, R: () => number): Item[] {
  const n = 10 + Math.floor(R() * 200), base = [2, 8, 16][Math.floor(R() * 3)];
  return [{ q: `${n} in base ${base} = ?`, answer: n.toString(base).toUpperCase(),
    solution: `${n} (base 10) = ${n.toString(base).toUpperCase()} (base ${base})`, input: "text" as const }];
}

function mazes(level: Level, R: () => number): Item[] {
  const n = level === "easy" ? 4 : 5;
  const wall = Array.from({ length: n }, () => Array(n).fill(false));
  // Carve a guaranteed route along the diagonal then random side steps.
  let r = 0, c = 0; const path = [[r, c]];
  while (r < n - 1 || c < n - 1) {
    if (r < n - 1 && (c === n - 1 || R() < 0.5)) r++; else c++;
    path.push([r, c]);
  }
  for (const [pr, pc] of path) wall[pr][pc] = true;
  return [{ q: `Maze ${n}×${n} (· = open, █ = wall). Start top-left, exit bottom-right. How many squares does the shortest route take?\n${wall.map((row) => row.map((v) => v ? "·" : "█").join("")).join("\n")}`,
    answer: String(path.length), solution: `shortest route = ${path.length} squares`, input: "text" as const }];
}

export function generateMore(kind: MoreKind, level: Level, seed: number, words: { slug: string; mean?: string }[] = []): Sheet {
  const R = mulberry32(seed + 7919);
  const items = kind === "crosssum" ? crosssum(level, R)
    : kind === "sudoku" ? sudoku(level, R)
    : kind === "nonogram" ? nonogram(level, R)
    : kind === "logicgrid" ? logicgrid(level, R)
    : kind === "caesar" ? caesar(level, R)
    : kind === "morse" ? morse(level, R)
    : kind === "wordladder" ? wordladder(level, R, words)
    : kind === "cages" ? cages(level, R)
    : kind === "classics" ? classics(level, R)
    : kind === "ladders" ? ladders(level, R)
    : kind === "wordsense" ? wordsense(level, R, words)
    : kind === "bases" ? bases(level, R)
    : kind === "mazes" ? mazes(level, R)
    : matchsticks(level, R);
  return { kind: kind as unknown as Kind, level, seed, items };
}
