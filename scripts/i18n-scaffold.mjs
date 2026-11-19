// Offline translation scaffold: extract every translatable string from the
// ingested lessons into key files. A translator (human or LLM, offline) fills
// content/i18n/<lang>/topics/<slug>.json; TopicPage uses it when present.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const SRC = path.join(ROOT, "content/topics");
const OUT = path.join(ROOT, "content/i18n/keys");
fs.mkdirSync(OUT, { recursive: true });

let topics = 0, strings = 0;
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith(".json"))) {
  const b = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const items = [
    { key: "title", source: b.title },
    { key: "short", source: b.short },
    { key: "trouble", source: b.trouble },
  ];
  b.lesson.blocks.forEach((blk, i) => {
    for (const k of ["html", "text", "q", "title", "a", "cap"]) {
      if (typeof blk[k] === "string" && blk[k].trim()) items.push({ key: `block.${i}.${k}`, source: blk[k] });
    }
    if (Array.isArray(blk.steps)) blk.steps.forEach((s, j) => items.push({ key: `block.${i}.step.${j}`, source: s }));
  });
  fs.writeFileSync(path.join(OUT, f), JSON.stringify(items, null, 2));
  topics++; strings += items.length;
}
fs.writeFileSync(path.join(ROOT, "content/i18n/manifest.json"), JSON.stringify({ topics, strings, note: "Fill content/i18n/<lang>/topics/<slug>.json as { key: translation }." }, null, 2));
console.log(`i18n scaffold: ${topics} topics, ${strings} strings`);
