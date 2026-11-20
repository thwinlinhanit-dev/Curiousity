// Build a compact inverted-ish search index from the published course packs.
// Each entry carries the topic title, its location and a short text excerpt.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const packDir = path.join(root, "public/content/pack");
const out = path.join(root, "content/search-index.json");
const text = (v, o = []) => {
  if (typeof v === "string") o.push(v);
  else if (Array.isArray(v)) v.forEach((x) => text(x, o));
  else if (v && typeof v === "object") {
    if (typeof v.p === "string") o.push(v.p);
    Object.values(v).forEach((x) => text(x, o));
  }
  return o;
};

const entries = [];
if (fs.existsSync(packDir)) for (const ladder of fs.readdirSync(packDir)) {
  const dir = path.join(packDir, ladder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const course = f.replace(/\.json$/, "");
    let pack; try { pack = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
    for (const [slug, bundle] of Object.entries(pack.topics ?? {})) {
      const b = bundle;
      const title = b.title || slug;
      const excerpt = text(b.lesson ?? b.blocks ?? b).join(" ").replace(/\s+/g, " ").slice(0, 500);
      entries.push({ id: `${course}.${slug}`, title, ladder, course, slug, excerpt });
    }
  }
}
fs.writeFileSync(out, `${JSON.stringify({ generated: new Date().toISOString(), entries }, null, 0)}\n`);
console.log(`search index: ${entries.length} topics, ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
