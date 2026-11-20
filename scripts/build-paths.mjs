// Normalise the curated reading paths.
// Source: trb/data/paths.yaml (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.resolve(root, "../trb/data/paths.yaml");
const dst = path.resolve(root, "content/apps/reading-paths.json");

const pathsData = YAML.parse(fs.readFileSync(src, "utf8"));
const titleOf = (slug) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const paths = (Array.isArray(pathsData) ? pathsData : pathsData.paths ?? []).map((p) => ({
  id: p.id, title: p.title, blurb: p.blurb,
  steps: (p.steps ?? []).map((s, i) => ({
    n: i + 1, book: s.book, title: s.title || titleOf(s.book), note: s.note || "",
    free: !!s.free, url: s.url || `https://teddyrookbook.com/books/${s.book}/`,
  })),
  extra: (p.extra ?? []).map(([label, url]) => ({ label, url: url.startsWith("/") ? `https://teddyrookbook.com${url}` : url })),
}));
const out = {
  source: "Teddy Rook Book — Reading Paths",
  source_url: "https://teddyrookbook.com/books/paths/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  paths,
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`reading paths: ${paths.length}, steps: ${paths.reduce((n, p) => n + p.steps.length, 0)}`);
