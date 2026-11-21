// Static accessibility gate: enforce the testable rules from the a11y statement.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const css = ["tokens.css", "app.css", "apps.css"].map((f) => fs.readFileSync(path.join(root, "src/styles", f), "utf8")).join("\n");
const problems = [];
const small = css.match(/font-size:\s*(\d+)px/g) ?? [];
for (const s of small) { const n = Number(s.match(/\d+/)[0]); if (n < 12) problems.push(`font-size below 12px: ${s}`); }
for (const f of ["src/components/AppShell.tsx"]) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  if (!src.includes('className="skip-link"')) problems.push(`${f}: missing skip link`);
}
if (!css.includes("--target-min: 44px")) problems.push("missing 44px target token");
if (!css.includes('data-contrast="high"')) problems.push("missing high-contrast preference");
if (!fs.existsSync(path.join(root, "public/docs/accessibility.md"))) problems.push("missing accessibility statement");
if (problems.length) { console.error(`a11y gate: ${problems.length} problem(s)`); problems.forEach((p) => console.error(`  - ${p}`)); process.exit(1); }
console.log("a11y gate: 12px floor, skip links, 44px targets, preferences and statement present");
