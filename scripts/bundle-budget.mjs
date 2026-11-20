// Fail the build if the initial JS bundle grows past the free-project budget.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(root, "dist/assets");
if (!fs.existsSync(dir)) { console.log("bundle budget: no dist yet"); process.exit(0); }
const limit = Number(process.env.BUNDLE_BUDGET_KB ?? 800);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => ({ f, kb: Math.round(fs.statSync(path.join(dir, f)).size / 1024) }));
// The main bundle is the largest non-three, non-lazy chunk; app tools are lazy.
const main = files.filter((x) => !x.f.includes("three")).sort((a, b) => b.kb - a.kb)[0];
if (!main) { console.log("bundle budget: no JS found"); process.exit(0); }
console.log(`bundle budget: main chunk ${main.f} = ${main.kb} KB (limit ${limit} KB)`);
if (main.kb > limit) { console.error("bundle budget exceeded"); process.exit(1); }
