// Music lab content: public-domain songs from the Teddy Rook corpus.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const SRC = path.join(REPO, "data/music/songs");
const OUT = path.join(ROOT, "content/music/songs");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.dirname(path.join(ROOT, "content/music/index.json")), { recursive: true });

const index = [];
let n = 0;
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith(".yaml"))) {
  let doc;
  try { doc = YAML.parse(fs.readFileSync(path.join(SRC, f), "utf8")); } catch { continue; }
  if (!doc || doc.draft || !doc.staves) continue; // only fully-notated, public-domain pieces
  const slug = doc.slug || f.replace(/\.yaml$/, "");
  const song = { ...doc, slug, _source: `data/music/songs/${f}` };
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(song, null, 2));
  index.push({
    slug, title: doc.title || slug, composer: doc.composer || "", level: doc.level || "",
    key: doc.key || "", time: doc.time || "", tempo: doc.tempo || 72,
    instrument: doc.instrument || "piano", about: (doc.about || "").slice(0, 300),
    source: doc.source || "", license: "Public-domain score; app content CC BY-NC 4.0 — Teddy Rook",
  });
  n++;
}
index.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
fs.writeFileSync(path.join(ROOT, "content/music/index.json"), JSON.stringify(index, null, 2));
console.log(`Music lab: ${n} playable songs`);
