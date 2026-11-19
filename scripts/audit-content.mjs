// Exhaustive content audit for every topic in the corpus.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = (p) => fs.existsSync(p);
const catalog = readJson(path.join(ROOT, "content/catalog.json"));
const ARCHETYPES = new Set(["MotionFigure","WaveFigure","CircuitFigure","FieldFigure","OpticsFigure","EnergyFigure","CollisionFigure","FunctionFigure","ParticleFigure","DataFigure","GlobeFigure","LessonFigure","PracticeFigure","GeneralFigure"]);

const report = { generatedAt: new Date().toISOString(), totals: { ladders: 0, topics: 0, bundlesMissing: 0, emptyLessons: 0, noSources: 0, noGenerator: 0, noViz: 0, badArchetype: 0, duplicateSlugs: 0 }, ladders: [], issues: [] };
const allSlugs = new Map();

for (const L of catalog.ladders) {
  const row = { key: L.key, topics: 0, bundlesMissing: 0, emptyLessons: 0, noSources: 0, noGenerator: 0, noViz: 0, lessonFigures: 0, selfChecks: 0, archetypes: {} };
  const genIds = new Set();
  const genDir = path.join(REPO, "static", L.key, "gen");
  if (fs.existsSync(genDir)) for (const f of fs.readdirSync(genDir).filter((x) => x.endsWith(".js"))) {
    const s = fs.readFileSync(path.join(genDir, f), "utf8");
    for (const m of s.matchAll(/(?:G|ML\.gen)\(\s*'([^']+)'/g)) genIds.add(m[1]);
  }
  for (const ckey of L.courseKeys) {
    const cp = path.join(ROOT, "content", L.key, "courses", `${ckey}.json`);
    if (!exists(cp)) { report.issues.push({ ladder: L.key, course: ckey, issue: "course index missing" }); continue; }
    const course = readJson(cp);
    for (const t of course.topics) {
      row.topics++; report.totals.topics++;
      const bp = path.join(ROOT, "content", L.key, "topics", ckey, `${t.slug}.json`);
      if (!exists(bp)) { row.bundlesMissing++; report.totals.bundlesMissing++; report.issues.push({ ladder: L.key, course: ckey, slug: t.slug, issue: "bundle missing" }); continue; }
      const b = readJson(bp);
      const blocks = b.lesson?.blocks ?? [];
      if (!blocks.length) { row.emptyLessons++; report.totals.emptyLessons++; report.issues.push({ id: b.id, issue: "empty lesson" }); }
      if (!(b.lesson?.sources ?? []).length) { row.noSources++; report.totals.noSources++; }
      if (!/CC BY-NC/.test(b.license ?? "")) report.issues.push({ id: b.id, issue: "license missing" });
      if (!ARCHETYPES.has(b.figureArchetype)) { report.issues.push({ id: b.id, issue: "bad archetype " + b.figureArchetype }); }
      row.archetypes[b.figureArchetype] = (row.archetypes[b.figureArchetype] ?? 0) + 1;
      if (!blocks.some((x) => x.t === "viz")) { row.noViz++; report.totals.noViz++; }
      if (!genIds.has(b.id) && !b.practice) { row.noGenerator++; report.totals.noGenerator++; if (report.issues.length < 2000) report.issues.push({ id: b.id, issue: "no generator" }); }
      if (b.figureArchetype === "LessonFigure") row.lessonFigures++;
      if (b.practice) row.selfChecks++;
      const key = `${L.key}/${ckey}/${t.slug}`;
      if (allSlugs.has(key)) { report.totals.duplicateSlugs++; report.issues.push({ id: b.id, issue: "duplicate slug with " + allSlugs.get(key) }); }
      else allSlugs.set(key, b.id);
    }
  }
  report.totals.ladders++;
  report.ladders.push(row);
}

fs.writeFileSync(path.join(ROOT, "content/audit.json"), JSON.stringify(report, null, 2));
console.log(`Audit: ${report.totals.ladders} ladders, ${report.totals.topics} topics`);
console.log(`missing bundles ${report.totals.bundlesMissing} | empty lessons ${report.totals.emptyLessons} | no sources ${report.totals.noSources} | no generator ${report.totals.noGenerator} | no viz ${report.totals.noViz} | duplicate slugs ${report.totals.duplicateSlugs}`);
console.log(report.ladders.map((r) => `${r.key.padEnd(11)} ${String(r.topics).padStart(5)} topics  gen-missing ${String(r.noGenerator).padStart(4)}  no-viz ${String(r.noViz).padStart(4)}`).join("\n"));
