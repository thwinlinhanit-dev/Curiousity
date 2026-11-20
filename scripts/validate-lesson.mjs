#!/usr/bin/env node
// Lightweight lesson validator: `npx curiousity-validate lesson.json`.
// Implements the checks in schema/lesson.schema.json without a runtime dep.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.resolve(here, "../schema/example-lesson.json");
let data;
try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(1); }
const errors = [];
const req = (k, ok) => { if (!ok) errors.push(`missing or invalid "${k}"`); };
req("id", typeof data.id === "string" && /^[a-z0-9]+[a-z0-9.-]*$/.test(data.id));
req("title", typeof data.title === "string" && data.title.length >= 3);
req("course", typeof data.course === "string" && data.course.length > 0);
req("ladder", typeof data.ladder === "string" && data.ladder.length > 0);
req("blocks", Array.isArray(data.blocks) && data.blocks.length > 0);
req("sources", Array.isArray(data.sources) && data.sources.length > 0);
(data.blocks ?? []).forEach((b, i) => {
  if (!b || typeof b.t !== "string" || !b.t) errors.push(`block ${i}: missing "t"`);
  if (b && (b.viz || b.t === "viz") && typeof b.alt !== "string") errors.push(`block ${i}: visual block needs "alt" text`);
  if (b && typeof b.html === "string") {
    const dollars = (b.html.match(/(?<!\\)\$/g) ?? []).length;
    if (dollars % 2) errors.push(`block ${i}: unbalanced $…$`);
    if (b.html.includes("\\role{")) errors.push(`block ${i}: unrendered \\role{}`);
    if (b.html.includes('"t":"try"')) errors.push(`block ${i}: empty try stub`);
  }
});
if (errors.length) { console.error(`${file}: ${errors.length} problem(s)`); errors.forEach((e) => console.error(`  - ${e}`)); process.exit(1); }
console.log(`${file}: valid lesson (${data.blocks.length} blocks, ${data.sources.length} sources)`);
