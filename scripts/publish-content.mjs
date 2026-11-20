// Publish ingest output (content/) into public/content, bundled.
//
// A published static site is limited to a couple of thousand files, and the
// corpus is 11k+ topic bundles — far past that. The app only ever needs one
// course at a time, so this writes one pack per (ladder, course) holding
// `{ index, topics: { <slug>: <bundle> } }`, plus a handful of single-file
// documents. Nothing is copied wholesale any more.
//
// Kept separate from copy-vendor.mjs so `npm run dev` works on a fresh clone
// that does not have the upstream `trb` repo checked out next to this one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const SRC = path.resolve(ROOT, "content");
const DST = path.resolve(ROOT, "public/content");

const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const dirs = (p) => (isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);
const jsons = (p) => (isDir(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name) : []);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data)); };
// Give every visual block a text alternative, derived from the caption that
// follows it in the lesson when the source omitted one.
const withAlt = (b) => {
  if (!b || (!Array.isArray(b.blocks) && !Array.isArray(b.lesson?.blocks))) return b;
  const key = Array.isArray(b.blocks) ? "blocks" : "lesson";
  const source = key === "blocks" ? b.blocks : b.lesson.blocks;
  const blocks = source.map((block, i) => {
    if (!(block.viz || block.t === "viz") || block.alt || block.cap || block.desc) return block;
    const next = source.slice(i + 1).find((x) => x.html)?.html ?? "";
    const cap = next.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
    return { ...block, cap: cap || `Interactive figure: ${block.name ?? block.viz ?? "diagram"}` };
  });
  return key === "blocks" ? { ...b, blocks } : { ...b, lesson: { ...b.lesson, blocks } };
};
const copyFile = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };

function copyDir(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else copyFile(src, dst);
  }
}

// Small lookup of course titles, so the UI can name a course immediately
// instead of waiting for the (≈1.5 MB) skill graph to arrive.
function buildCourseIndex() {
  const catalogPath = path.join(SRC, "catalog.json");
  if (!fs.existsSync(catalogPath)) return;
  const catalog = readJson(catalogPath);
  const courses = {};
  for (const ladder of catalog.ladders ?? []) {
    for (const key of ladder.courseKeys ?? []) {
      const file = path.join(SRC, ladder.key, "courses", `${key}.json`);
      if (!fs.existsSync(file)) continue;
      try {
        const c = readJson(file);
        courses[key] = { title: c.title ?? key, short: c.short ?? c.title ?? key, ladder: ladder.key };
      } catch { /* skip an unreadable course file */ }
    }
  }
  fs.writeFileSync(path.join(SRC, "courses-index.json"), `${JSON.stringify({ courses }, null, 0)}\n`);
  console.log(`courses-index: ${Object.keys(courses).length} courses`);
}

if (!fs.existsSync(SRC)) {
  console.warn("publish-content: content/ not found, skipping");
} else {
  buildCourseIndex();

  fs.rmSync(DST, { recursive: true, force: true });
  fs.mkdirSync(DST, { recursive: true });

  // Single-file documents the app fetches directly.
  for (const f of ["graph.json", "courses-index.json"]) {
    const p = path.join(SRC, f);
    if (fs.existsSync(p)) copyFile(p, path.join(DST, f));
  }

  // Dataset browsers: a few small documents.
  if (isDir(path.join(SRC, "data"))) copyDir(path.join(SRC, "data"), path.join(DST, "data"));

  // Expansion tools: normalised app data and the daily Harvard readings.
  if (isDir(path.join(SRC, "apps"))) copyDir(path.join(SRC, "apps"), path.join(DST, "apps"));
  for (const f of ["search-index.json"]) if (fs.existsSync(path.join(SRC, f))) copyFile(path.join(SRC, f), path.join(DST, f));
  if (isDir(path.join(SRC, "harvard"))) copyDir(path.join(SRC, "harvard"), path.join(DST, "harvard"));
  if (isDir(path.join(SRC, "graph"))) copyDir(path.join(SRC, "graph"), path.join(DST, "graph"));
  if (isDir(path.join(SRC, "open"))) copyDir(path.join(SRC, "open"), path.join(DST, "open"));

  // Library ↔ lesson links.
  const links = path.join(SRC, "library/links.json");
  if (fs.existsSync(links)) copyFile(links, path.join(DST, "library/links.json"));

  // Marble cross-curriculum payloads, keyed by topic id.
  const marble = {};
  const marbleDir = path.join(SRC, "marble/by-topic");
  for (const f of jsons(marbleDir)) {
    try {
      const d = readJson(path.join(marbleDir, f));
      if (d && d.topicId) marble[d.topicId] = d;
    } catch { /* skip an unreadable payload */ }
  }
  if (Object.keys(marble).length) writeJson(path.join(DST, "marble/by-topic.json"), marble);

  // Playable scores, keyed by slug.
  const songs = {};
  const songDir = path.join(SRC, "music/songs");
  for (const f of jsons(songDir)) {
    try { songs[f.replace(/\.json$/, "")] = readJson(path.join(songDir, f)); } catch { /* skip */ }
  }
  if (Object.keys(songs).length) writeJson(path.join(DST, "music/songs.json"), songs);

  // Spanish lesson translations, keyed by ladder/slug and by bare slug.
  const es = {};
  for (const f of jsons(path.join(SRC, "i18n/es/topics"))) {
    try { es[f.replace(/\.json$/, "")] = readJson(path.join(SRC, "i18n/es/topics", f)); } catch { /* skip */ }
  }
  for (const ladder of dirs(path.join(SRC, "i18n/es"))) {
    const d = path.join(SRC, "i18n/es", ladder, "topics");
    for (const f of jsons(d)) {
      try { es[`${ladder}/${f.replace(/\.json$/, "")}`] = readJson(path.join(d, f)); } catch { /* skip */ }
    }
  }
  if (Object.keys(es).length) writeJson(path.join(DST, "i18n/es-topics.json"), es);

  // One pack per course: its index plus every topic bundle that belongs to it.
  const packList = [];
  let packs = 0, topics = 0;
  for (const ladder of dirs(SRC)) {
    const courseDir = path.join(SRC, ladder, "courses");
    if (!isDir(courseDir)) continue;
    const byCourse = new Map();
    const add = (slug, course, bundle) => {
      if (!slug || !course) return;
      if (!byCourse.has(course)) byCourse.set(course, new Map());
      byCourse.get(course).set(slug, withAlt(bundle));
    };
    // Flat topic files first; a course-scoped file for the same slug wins.
    for (const f of jsons(path.join(SRC, ladder, "topics"))) {
      try {
        const b = readJson(path.join(SRC, ladder, "topics", f));
        add(b.slug || f.replace(/\.json$/, ""), b.course, b);
      } catch { /* skip */ }
    }
    for (const sub of dirs(path.join(SRC, ladder, "topics"))) {
      const d = path.join(SRC, ladder, "topics", sub);
      for (const f of jsons(d)) {
        try {
          const b = readJson(path.join(d, f));
          add(b.slug || f.replace(/\.json$/, ""), b.course || sub, b);
        } catch { /* skip */ }
      }
    }
    const written = new Set();
    for (const f of jsons(courseDir)) {
      const key = f.replace(/\.json$/, "");
      let index = null;
      try { index = readJson(path.join(courseDir, f)); } catch { index = null; }
      const map = byCourse.get(key);
      writeJson(path.join(DST, "pack", ladder, `${key}.json`), { index, topics: map ? Object.fromEntries(map) : {} });
      written.add(key);
      packList.push({ ladder, course: key, topics: map ? map.size : 0 });
      packs += 1;
      topics += map ? map.size : 0;
    }
    // A topic whose course has no course file still needs a pack to live in.
    for (const [key, map] of byCourse) {
      if (written.has(key)) continue;
      writeJson(path.join(DST, "pack", ladder, `${key}.json`), { index: null, topics: Object.fromEntries(map) });
      packList.push({ ladder, course: key, topics: map.size });
      packs += 1;
      topics += map.size;
    }
  }
  writeJson(path.join(DST, "pack/index.json"), { packs: packList });

  console.log(`content published: ${packs} course packs, ${topics} topics, ${Object.keys(songs).length} songs, ${Object.keys(marble).length} matched lessons`);
}
