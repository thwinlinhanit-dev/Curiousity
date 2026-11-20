// Report visual blocks without a written description.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(root, "public/content/pack");
const missing = []; let visuals = 0;
const walk = (p) => {
  if (!fs.existsSync(p)) return;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (!e.name.endsWith(".json")) continue;
    let pack; try { pack = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
    for (const [slug, b] of Object.entries(pack.topics ?? {})) {
      for (const block of b.blocks ?? b.lesson?.blocks ?? []) {
        if (block.viz || block.t === "viz") { visuals++; if (!block.alt && !block.desc) missing.push(`${b.id ?? slug}: ${block.viz ?? block.t}`); }
      }
    }
  }
};
walk(dir);
console.log(`visual blocks: ${visuals} · without alt text: ${missing.length}`);
missing.slice(0, 20).forEach((m) => console.log(`  ${m}`));
