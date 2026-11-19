import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

const graph = JSON.parse(read("content/graph.json")) as {
  topics: { id: string; slug: string; course: string; ladder: string }[];
  courses: { key: string; ladder: string }[];
};
const catalog = JSON.parse(read("content/catalog.json")) as { ladders: { key: string; courseKeys: string[]; topics: number }[] };
const libTopics = graph.topics.filter((t) => t.ladder === "library");

// A stand-in for the engine's seeded rand, enough for the generator files.
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

function loadGens(file: string): Map<string, (R: unknown, ctx: unknown) => { q: string; a: { t: string; choices?: string[]; v?: number }; steps?: string[] }> {
  const gens = new Map<string, any>();
  const ML = { gen: (id: string, fn: any) => gens.set(id, fn) };
  const sandbox = { window: { MathLadder: ML }, Math };
  vm.createContext(sandbox);
  vm.runInContext(read(file), sandbox);
  return gens;
}

describe("library ladder", () => {
  it("is registered in catalog and graph consistently", () => {
    const ladder = catalog.ladders.find((l) => l.key === "library");
    expect(ladder).toBeTruthy();
    expect(ladder!.courseKeys).toEqual(["mem", "el", "tl"]);
    expect(ladder!.topics).toBe(libTopics.length);
    for (const t of libTopics) expect(ladder!.courseKeys).toContain(t.course);
    expect(graph.courses.filter((c) => c.ladder === "library").map((c) => c.key)).toEqual(["mem", "el", "tl"]);
  });

  it("every library topic has a course entry and a lesson bundle on disk", () => {
    for (const t of libTopics) {
      const courseDoc = JSON.parse(read(`content/library/courses/${t.course}.json`)) as { topics: { id: string }[] };
      expect(courseDoc.topics.some((x) => x.id === t.id), `course file for ${t.id}`).toBe(true);
      expect(fs.existsSync(path.join(ROOT, `content/library/topics/${t.course}/${t.slug}.json`)), `bundle for ${t.id}`).toBe(true);
    }
  });

  it("generators cover every library topic and emit checkable problems", () => {
    const gens = new Map<string, any>();
    for (const f of ["memory", "elements", "timeline"])
      for (const [id, fn] of loadGens(`public/vendor/gen/library/${f}.js`)) gens.set(id, fn);
    for (const t of libTopics) expect(gens.has(t.id), `no generator for ${t.id}`).toBe(true);

    for (const [id, fn] of gens) {
      let made = 0;
      for (let seed = 1; seed <= 40 && made < 3; seed++) {
        for (const level of [1, 2, 3]) {
          const p = fn(makeR(seed * 7919 + level), { level });
          if (!p) continue;
          made++;
          expect(typeof p.q, id).toBe("string");
          expect(p.a.t, id).toBe("mc");
          expect(Array.isArray(p.a.choices), id).toBe(true);
          expect(new Set(p.a.choices).size, `${id} choices unique`).toBe(p.a.choices.length);
          expect(p.a.choices.length >= 2 && p.a.choices.length <= 4, `${id} choice count`).toBeTruthy();
          expect(Number.isInteger(p.a.v) && p.a.v >= 0 && p.a.v < p.a.choices.length, `${id} v index`).toBeTruthy();
        }
      }
      expect(made, `generator ${id} produced nothing`).toBeGreaterThan(0);
    }
  });

  it("gen-manifest registers the library ladder", () => {
    const manifest = JSON.parse(read("public/vendor/gen-manifest.json")) as Record<string, string[]>;
    expect(manifest.library).toEqual(["memory.js", "elements.js", "timeline.js"]);
  });
});
