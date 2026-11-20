import { describe, expect, it } from "vitest";
import { generate, type Kind, type Level } from "./puzzles/generators";
import { generateMore, type MoreKind } from "./puzzles/more";
import { SOLVED, flip, isSolved, scramble, solvable } from "./puzzles/aqueduct";

const KINDS: Kind[] = ["sequences", "magic", "roman", "balance", "codes", "anagrams"];
const LEVELS: Level[] = ["easy", "medium", "hard"];
const WORDS = [{ slug: "dominus", mean: "lord, master" }, { slug: "sapientia", mean: "wisdom" }, { slug: "discipulus", mean: "pupil" }];

describe("aqueduct puzzle", () => {
  it("every scrambled board is solvable", () => {
    for (let seed = 0; seed < 60; seed++) {
      let n = seed;
      const rnd = () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      expect(solvable(scramble(12, rnd))).toBe(true);
    }
  });
  it("a scramble is not already the solved board", () => {
    let g = scramble(8);
    for (let i = 0; i < 10 && isSolved(g); i++) g = scramble(8);
    expect(isSolved(g)).toBe(false);
  });
  it("the solved board is solvable and flip is an involution", () => {
    expect(solvable(SOLVED)).toBe(true);
    expect(flip(flip(SOLVED, 1, 2), 1, 2)).toEqual(SOLVED);
  });
});

describe("deterministic puzzle generators", () => {
  for (const kind of KINDS) for (const level of LEVELS) {
    it(`${kind}/${level} answers are self-consistent`, () => {
      for (let seed = 0; seed < 12; seed++) {
        const sheet = generate(kind, level, seed + 1, WORDS);
        expect(sheet.items.length).toBeGreaterThan(0);
        for (const item of sheet.items) {
          expect(item.q.length).toBeGreaterThan(0);
          expect(item.answer.length).toBeGreaterThan(0);
          if (item.input === "grid" && item.cells) {
            expect(item.cells.flat().filter((c) => c === null).length).toBeGreaterThan(0);
            for (const n of item.answer.split(",")) expect(item.solution).toContain(n);
          } else {
            expect(item.solution).toContain(item.answer);
          }
        }
      }
    });
  }
  it("is deterministic for a given seed", () => {
    expect(generate("sequences", "hard", 42, WORDS)).toEqual(generate("sequences", "hard", 42, WORDS));
  });
});

const MORE: MoreKind[] = ["crosssum", "sudoku", "nonogram", "logicgrid", "caesar", "morse", "wordladder", "matchsticks",
  "cages", "classics", "ladders", "wordsense", "bases", "mazes"];
describe("additional puzzle families", () => {
  for (const kind of MORE) for (const level of LEVELS) {
    it(`${kind}/${level} answers are self-consistent`, () => {
      for (let seed = 1; seed <= 6; seed++) {
        const sheet = generateMore(kind, level, seed, WORDS);
        expect(sheet.items.length).toBeGreaterThan(0);
        for (const item of sheet.items) {
          expect(item.q.length).toBeGreaterThan(0);
          expect(item.answer.length).toBeGreaterThan(0);
          if (item.input === "grid") {
            for (const n of item.answer.split(",")) expect(item.solution).toContain(n);
          } else {
            expect(item.solution).toContain(item.answer);
          }
        }
      }
    });
  }
});
