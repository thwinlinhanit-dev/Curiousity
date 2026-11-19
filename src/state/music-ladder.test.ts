// The music ladder mirrors https://teddyrookbook.com/music/ : 97 interactive
// chapters (piano basics, reading music, guitar, ukulele, banjo, the suite)
// plus 60 playable songs. Bundles and generator coverage are the contract.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const C = path.resolve(here, "../../content");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(C, p), "utf8"));

const graph = read("graph.json") as {
  courses: { key: string; ladder: string }[];
  topics: { id: string; course: string; ladder: string; prereqs: string[] }[];
};
const catalog = read("catalog.json") as { ladders: { key: string; topics: number }[] };
const musicTopics = graph.topics.filter((t) => t.ladder === "music");
const CHAPTER_COURSES = ["pb", "rm", "gtr", "uke", "bjo", "cfs"];
const SONG_COURSES = ["beginner", "intermediate", "advanced"];

const bundleFor = (t: { id: string; course: string }) =>
  read(`music/topics/${t.course}/${t.id.split(".").slice(1).join(".")}.json`) as {
    title: string;
    lesson: { blocks: Record<string, unknown>[] };
  };

// generator ids exported by the vendored bundle (read the source, don't eval)
const genSrc = fs.readFileSync(path.resolve(here, "../../public/vendor/gen/music/music.js"), "utf8");

describe("music ladder", () => {
  it("mirrors the site: 97 chapters + 60 songs", () => {
    expect(musicTopics.length).toBe(157);
    expect(musicTopics.filter((t) => CHAPTER_COURSES.includes(t.course))).toHaveLength(97);
    expect(musicTopics.filter((t) => SONG_COURSES.includes(t.course))).toHaveLength(60);
    expect(catalog.ladders.find((l) => l.key === "music")?.topics).toBe(157);
  });

  it("chapters carry the interactive page; songs embed the player", () => {
    for (const t of musicTopics.filter((x) => CHAPTER_COURSES.includes(x.course))) {
      const b = bundleFor(t);
      expect(b.lesson.blocks[0].t, t.id).toBe("chapter");
      expect(String(b.lesson.blocks[0].html)).toMatch(/<div|<p/);
    }
    for (const t of musicTopics.filter((x) => SONG_COURSES.includes(x.course))) {
      const blocks = bundleFor(t).lesson.blocks;
      expect(blocks.some((x) => x.name === "music-player"), t.id).toBe(true);
      expect(bundleFor(t).title.length).toBeGreaterThan(1);
    }
  });

  it("prereq chains follow the site order and never dangle", () => {
    const ids = new Set(musicTopics.map((t) => t.id));
    for (const t of musicTopics) for (const p of t.prereqs) expect(ids.has(p), `${t.id} → ${p}`).toBe(true);
    const byId = Object.fromEntries(musicTopics.map((t) => [t.id, t]));
    const firstPb = musicTopics.find((t) => t.course === "pb" && t.prereqs.length === 0)!;
    expect(firstPb.id).toBe("pb.meet-the-keyboard");
    expect(byId["pb.c-position"].prereqs[0]).toMatch(/^pb\./);
    expect(byId["sng.fur-elise"].prereqs[0]).toBe("pb.meet-the-keyboard");
  });

  it("generators register a bank per chapter and per song", () => {
    expect(genSrc).toContain("ML.gen(b.id, chapterGen(b.id))");
    expect(genSrc).toContain("ML.gen('sng.' + s.slug, songGen(s))");
    expect(genSrc).toContain("meet-the-keyboard");
    expect(genSrc).toContain("fur-elise");
    expect(genSrc).not.toContain("mus.");
  });
});
