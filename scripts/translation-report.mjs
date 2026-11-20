// Translation completeness by ladder; locales under 80% are hidden in the app.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const esDir = path.join(root, "content/i18n/es/topics");
const graph = JSON.parse(fs.readFileSync(path.join(root, "content/graph.json"), "utf8"));
const translated = new Set(fs.existsSync(esDir) ? fs.readdirSync(esDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : []);
const total = graph.topics?.length ?? 0;
const pct = total ? Math.round((translated.size / total) * 1000) / 10 : 0;
console.log(`Spanish topic translations: ${translated.size}/${total} (${pct}%) — ${pct >= 80 ? "visible" : "hidden (below 80% gate)"}`);
