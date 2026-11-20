// Aqueduct Switches: the clicked cell is in both its row and column, so it is
// toggled twice and stays unchanged. The move vectors span only rank 6 of 16,
// meaning a uniformly random board is almost never solvable. Scrambling from
// the solved state with legal moves guarantees a solution exists.
export type Grid = boolean[][];

export const SOLVED: Grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => true));

export function flip(g: Grid, r: number, c: number): Grid {
  return g.map((row, i) => row.map((v, j) => (i === r || j === c) && !(i === r && j === c) ? !v : v));
}

export function scramble(moves = 8, random: () => number = Math.random): Grid {
  let g = SOLVED.map((row) => [...row]);
  for (let k = 0; k < moves; k++) g = flip(g, Math.floor(random() * 4), Math.floor(random() * 4));
  return g;
}

export const isSolved = (g: Grid) => g.every((row) => row.every(Boolean));

// Breadth-first search over the 16 cells — used by the regression test to
// prove every generated board can reach SOLVED.
export function solvable(g: Grid): boolean {
  const key = (x: Grid) => x.flat().map(Number).join("");
  const target = key(SOLVED);
  const seen = new Set<string>([key(g)]);
  const queue: Grid[] = [g];
  while (queue.length) {
    const cur = queue.shift()!;
    if (key(cur) === target) return true;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const next = flip(cur, r, c), k = key(next);
      if (!seen.has(k)) { seen.add(k); queue.push(next); }
    }
  }
  return false;
}
