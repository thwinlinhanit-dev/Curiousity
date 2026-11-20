// Find absolute upstream links in the published corpus and track regressions.
// The baseline records today's count; --strict fails only if it grows.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.resolve(root, "public/content");
const baselinePath = path.resolve(root, "content/link-baseline.json");
const strict = process.argv.includes("--strict");
const RE = /https?:\/\/(?:www\.)?teddyrookbook\.com\/[^\s"'<>)]+/g;

function walk(p, out = []) {
  if (!fs.existsSync(p)) return out;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) walk(full, out); else if (e.name.endsWith(".json")) out.push(full);
  }
  return out;
}
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

let count = 0; const byFile = {};
for (const file of walk(dir)) {
  let data; try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
  const rel = path.relative(root, file).replace(/\\/g, "/");
  for (const s of strings(data)) {
    const hits = s.match(RE);
    if (hits) { count += hits.length; byFile[rel] = (byFile[rel] ?? 0) + hits.length; }
  }
}
const top = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`absolute upstream links: ${count} across ${Object.keys(byFile).length} files`);
for (const [f, n] of top) console.log(`  ${n.toString().padStart(5)}  ${f}`);

let baseline = 0;
try { baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")).count ?? 0; } catch { /* none yet */ }
if (!fs.existsSync(baselinePath)) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify({ count }, null, 2)}\n`);
  console.log(`baseline written: ${count}`);
}
if (strict && count > baseline) {
  console.error(`link regression: ${count} > baseline ${baseline}`);
  process.exit(1);
}
