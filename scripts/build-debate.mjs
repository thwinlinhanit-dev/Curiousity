// Normalise debate formats for the timer/case-builder app.
// Source: trb/data/debate/formats/*.json (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.resolve(root, "../trb/data/debate/formats");
const dst = path.resolve(root, "content/apps/debate-formats.json");

const formats = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).map((f) => {
  const x = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  return {
    key: x.key, name: x.name, short: x.short, team: x.team, summary: x.summary,
    prep: x.prep ? { seconds: x.prep.seconds, per: x.prep.per, note: x.prep.note } : null,
    speeches: (x.speeches ?? []).map((s) => ({
      short: s.short, name: s.name, side: s.side, seconds: s.seconds,
      kind: s.kind, job: s.job ?? "",
    })),
  };
}).filter((f) => f.speeches.length > 0);

const out = {
  title: "Debate formats",
  source: "Teddy Rook Book — Debate",
  source_url: "https://teddyrookbook.com/debate/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  formats,
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`debate formats: ${formats.length}, speeches: ${formats.reduce((n, f) => n + f.speeches.length, 0)}`);
