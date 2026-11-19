// Publish ingest output (content/) into public/content so Vite can serve it.
// Kept separate from copy-vendor.mjs so `npm run dev` works on a fresh clone
// that does not have the upstream `trb` repo checked out next to this one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const contentSrc = path.resolve(ROOT, "content");
const contentDst = path.resolve(ROOT, "public/content");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

// Small lookup of course titles, so the UI can name a course immediately
// instead of waiting for the (≈1.5 MB) skill graph to arrive.
function buildCourseIndex() {
  const catalogPath = path.join(contentSrc, "catalog.json");
  if (!fs.existsSync(catalogPath)) return;
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const courses = {};
  for (const ladder of catalog.ladders ?? []) {
    for (const key of ladder.courseKeys ?? []) {
      const file = path.join(contentSrc, ladder.key, "courses", `${key}.json`);
      if (!fs.existsSync(file)) continue;
      try {
        const c = JSON.parse(fs.readFileSync(file, "utf8"));
        courses[key] = { title: c.title ?? key, short: c.short ?? c.title ?? key, ladder: ladder.key };
      } catch { /* skip an unreadable course file */ }
    }
  }
  fs.writeFileSync(path.join(contentSrc, "courses-index.json"), `${JSON.stringify({ courses }, null, 0)}\n`);
  console.log(`courses-index: ${Object.keys(courses).length} courses`);
}

if (fs.existsSync(contentSrc)) {
  buildCourseIndex();
  copyDir(contentSrc, contentDst);
  console.log("content published to public/content");
} else {
  console.warn("publish-content: content/ not found, skipping");
}
