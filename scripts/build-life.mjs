// Normalise the Being an Adult 101 life-skills guides.
// Source: trb/data/adult/*.json (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.resolve(root, "../trb/data/adult");
const dst = path.resolve(root, "content/apps/life-skills.json");

const text = (v) => typeof v === "string" ? v
  : Array.isArray(v) ? v.map(text).join(" ")
  : v && typeof v === "object" ? [v.title, v.problem, v.fix, ...(Array.isArray(v.body) ? v.body : [])].filter(Boolean).map(text).join(" — ")
  : "";

const areas = [];
const guides = [];
for (const f of ["house", "car", "money", "everyday"]) {
  const doc = JSON.parse(fs.readFileSync(path.join(srcDir, `${f}.json`), "utf8"));
  areas.push({ key: doc.area.key, name: doc.area.name, blurb: doc.area.blurb, intro: doc.area.intro, deeper: doc.area.deeper ?? "" });
  for (const g of doc.guides ?? []) guides.push({
    area: f, key: g.key, name: g.name, time: g.time ?? "", level: g.level ?? "",
    teach_age: g.teach_age ?? "", intro: g.intro ?? "",
    need: g.need ?? [], before: g.before ?? [],
    steps: (g.steps ?? []).map((s) => ({ t: s.t, how: s.how })),
    pro: text(g.pro), how_it_works: text(g.how_it_works), teach: text(g.teach),
    mistakes: (g.mistakes ?? []).map(text), safety: (g.safety ?? []).map(text), tips: (g.tips ?? []).map(text),
    sources: (g.sources ?? []).map((s) => ({ title: s.title || s.url, url: s.url, publisher: s.publisher || "" })),
  });
}
const out = {
  title: "Being an Adult 101",
  source: "Teddy Rook Book — Being an Adult 101",
  source_url: "https://teddyrookbook.com/being-an-adult/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  areas, guides,
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`life skills: ${areas.length} areas, ${guides.length} guides`);
