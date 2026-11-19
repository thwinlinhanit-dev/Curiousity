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

if (fs.existsSync(contentSrc)) {
  copyDir(contentSrc, contentDst);
  console.log("content published to public/content");
} else {
  console.warn("publish-content: content/ not found, skipping");
}
