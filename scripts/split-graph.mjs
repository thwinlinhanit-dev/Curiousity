// Split the 2 MB skill graph into one file per ladder so a learner only needs
// the active subject offline. The full graph.json remains for global search.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.join(root, "content/graph.json");
if (!fs.existsSync(src)) { console.log("split-graph: no graph.json, skipping"); process.exit(0); }
const graph = JSON.parse(fs.readFileSync(src, "utf8"));
const outDir = path.join(root, "content/graph");
fs.mkdirSync(outDir, { recursive: true });
const ladders = [...new Set((graph.topics ?? []).map((t) => t.ladder))];
let files = 0;
for (const ladder of ladders) {
  const courses = (graph.courses ?? []).filter((c) => c.ladder === ladder);
  const courseKeys = new Set(courses.map((c) => c.key));
  const topics = (graph.topics ?? []).filter((t) => t.ladder === ladder);
  fs.writeFileSync(path.join(outDir, `${ladder}.json`), `${JSON.stringify({ ladder, courses, topics }, null, 0)}\n`);
  files++;
}
fs.writeFileSync(path.join(outDir, "index.json"), `${JSON.stringify({ ladders: ladders.map((l) => ({ key: l, topics: (graph.topics ?? []).filter((t) => t.ladder === l).length })) }, null, 0)}\n`);
console.log(`split graph: ${files} ladders`);
