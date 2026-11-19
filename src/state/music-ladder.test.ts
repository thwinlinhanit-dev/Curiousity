import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

const graph = JSON.parse(read("content/graph.json")) as { topics: { id: string; slug: string; course: string; ladder: string; prereqs: string[] }[] };
const catalog = JSON.parse(read("content/catalog.json")) as { ladders: { key: string; courseKeys: string[]; topics: number }[] };
const index = JSON.parse(read("content/music/index.json")) as { slug: string; level: string }[];
const musicTopics = graph.topics.filter((t) => t.ladder === "music");

function makeR(seed: number) {
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  return {
    pick: (a: unknown[]) => a[Math.floor(rnd() * a.length)],
    int: (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1)),
    shuffle: <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; },
    sample: <T,>(a: T[], k: number) => makeR(seed ^ 0x9e3779b9).shuffle(a).slice(0, k),
  };
}

describe("music ladder", () => {
  it("covers exactly the playable scores", () => {
    expect(musicTopics.length).toBe(index.length);
    expect(new Set(musicTopics.map((t) => t.slug))).toEqual(new Set(index.map((s) => s.slug)));
    const ladder = catalog.ladders.find((l) => l.key === "music");
    expect(ladder?.courseKeys).toEqual(["beginner", "intermediate", "advanced"]);
    expect(ladder?.topics).toBe(index.length);
  });

  it("every song has a bundle with the player as its figure", () => {
    for (const t of musicTopics) {
      const b = JSON.parse(read(`content/music/topics/${t.course}/${t.slug}.json`)) as { lesson: { blocks: { t: string; name?: string }[] } };
      expect(b.lesson.blocks.some((x) => x.t === "viz" && x.name === "music-player"), t.id).toBe(true);
    }
  });

  it("prerequisite edges are acyclic and point at real songs", () => {
    const byId = new Map(musicTopics.map((t) => [t.id, t]));
    for (const t of musicTopics) for (const p of t.prereqs) expect(byId.has(p), `${t.id} prereq ${p}`).toBe(true);
    const seen = new Set<string>();
    const visit = (id: string, chain: string[]) => {
      if (chain.includes(id)) throw new Error(`cycle: ${chain.join(" → ")}`);
      if (seen.has(id)) return;
      for (const p of byId.get(id)!.prereqs) visit(p, [...chain, id]);
      seen.add(id);
    };
    for (const t of musicTopics) visit(t.id, []);
  });

  it("generators produce checkable problems for every song", () => {
    const gens = new Map<string, any>();
    const ML = { gen: (id: string, fn: any) => gens.set(id, fn) };
    const sandbox = { window: { MathLadder: ML }, Math };
    vm.createContext(sandbox);
    vm.runInContext(read("public/vendor/gen/music/music.js"), sandbox);
    for (const t of musicTopics) expect(gens.has(t.id), t.id).toBe(true);
    for (const [id, fn] of gens) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = fn(makeR(seed * 104729), { level: (seed % 3) + 1 });
        expect(p, `${id} seed ${seed} produced nothing`).toBeTruthy();
        expect(typeof p.q, id).toBe("string");
        if (p.a.t === "mc") {
          expect(p.a.choices.length >= 2, id).toBe(true);
          expect(p.a.choices[p.a.v], id).toBeTruthy();
        } else {
          expect(p.a.t, id).toBe("tf");
          expect(typeof p.a.v, id).toBe("boolean");
        }
      }
    }
  });
});
