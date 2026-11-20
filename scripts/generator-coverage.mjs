// Generator coverage report: load every vendored generator in Node, then try
// makeProblem on every topic in every published course pack.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(import.meta.url);
globalThis.window = globalThis;

require(path.join(root, "public/vendor/gen.js"));
for (const f of ["cas.js", "tex.js", "check.js"]) {
  try { require(path.join(root, "public/vendor", f)); } catch { /* optional in some builds */ }
}
const ML = globalThis.MathLadder;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/vendor/gen-manifest.json"), "utf8"));
let loaded = 0;
// Visual kits define the helpers (PM.*, WHEEL, ...) some generators call.
try {
  const viz = JSON.parse(fs.readFileSync(path.join(root, "public/vendor/viz-manifest.json"), "utf8"));
  for (const [ladder, files] of Object.entries(viz)) for (const f of files) {
    try { require(path.join(root, "public/vendor/viz", ladder, f)); } catch { /* DOM-only kit */ }
  }
} catch { /* no viz manifest */ }
for (const [ladder, files] of Object.entries(manifest)) {
  for (const f of files) {
    try { require(path.join(root, "public/vendor/gen", ladder, f)); loaded++; } catch { /* a broken kit is reported by its topics */ }
  }
}

const packDir = path.join(root, "public/content/pack");
const ids = [];
if (fs.existsSync(packDir)) for (const ladder of fs.readdirSync(packDir)) {
  const dir = path.join(packDir, ladder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const course = f.replace(/\.json$/, "");
      const pack = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const slug of Object.keys(pack.topics ?? {})) ids.push(`${course}.${slug}`);
    } catch { /* skip malformed pack */ }
  }
}

let missing = 0, thrown = 0;
const failures = [];
for (const id of ids) {
  if (!ML.hasGen(id)) { missing++; failures.push({ id, why: "no generator" }); continue; }
  try { ML.makeProblem(id, 42, { level: 1 }); } catch (e) { thrown++; failures.push({ id, why: String(e).slice(0, 160) }); }
}
const report = {
  generated: new Date().toISOString(), generatorsLoaded: loaded, topics: ids.length,
  withGenerator: ids.length - missing, missing, throwing: thrown,
  coverage: ids.length ? Math.round(((ids.length - missing) / ids.length) * 1000) / 10 : 0,
  failures: failures.slice(0, 200),
};
const out = path.join(root, "content/coverage-report.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`generators loaded: ${loaded}`);
console.log(`topics: ${report.topics} · with generator: ${report.withGenerator} (${report.coverage}%) · throwing: ${thrown}`);
if (failures.length) console.log(failures.slice(0, 10).map((f) => `  ${f.id}: ${f.why}`).join("\n"));
