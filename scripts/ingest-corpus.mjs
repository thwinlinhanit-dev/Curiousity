// Generalised ingest: every Teddy Rook ladder -> namespaced static bundles.
// Keeps the physics pipeline as its first (regression) adapter.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const OUT = path.resolve(ROOT, "content");
const read = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(p);

function parseCourses(text) {
  const out = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("- key:")) { if (cur) out.push(cur); cur = { key: line.slice(6).trim() }; }
    else if (cur && line.startsWith("slug:")) cur.slug = line.slice(5).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("title:")) cur.title = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("short:")) cur.short = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("band:")) cur.band = line.slice(5).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("grade:")) cur.grade = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("after:")) cur.after = line.slice(6).trim().replace(/[\[\]]/g, "").split(",").map(s => s.trim()).filter(Boolean);
  }
  if (cur) out.push(cur);
  return out;
}

function parseLadders(text) {
  const out = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("- key:")) { if (cur) out.push(cur); cur = { key: line.slice(6).trim() }; }
    else if (cur && line.startsWith("slug:")) cur.slug = line.slice(5).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("title:")) cur.title = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("short:")) cur.short = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("viz:")) cur.viz = line.slice(4).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("order:")) cur.order = Number(line.slice(6).trim());
    else if (cur && line.startsWith("color:")) cur.color = line.slice(6).trim().replace(/^["']|["']$/g, "");
  }
  if (cur) out.push(cur);
  return out;
}

function archetype(vizNames, lesson) {
  const s = (vizNames.join(" ") + " " + JSON.stringify(lesson.blocks).slice(0, 1500)).toLowerCase();
  if (/ph-motion|ph-graph|ph-projectile|ph-vectors|function|graph/.test(s)) return "MotionFigure";
  if (/ph-wave|ph-interference|ph-doppler|oscillator|wave/.test(s)) return "WaveFigure";
  if (/ph-circuit|circuit|efield|magnetism|induction/.test(s)) return "FieldFigure";
  if (/ph-rays|refraction|optics/.test(s)) return "OpticsFigure";
  if (/ph-energy|ph-pv|ph-thermal|energy|gas/.test(s)) return "EnergyFigure";
  if (/ph-collision|collision|momentum/.test(s)) return "CollisionFigure";
  if (/ph-orbit|orbit|cosmic/.test(s)) return "MotionFigure";
  if (/flashcard|memory|vocab/.test(s)) return "PracticeFigure";
  return "GeneralFigure";
}

const ladders = parseLadders(read(path.join(REPO, "data/ladders.yaml")))
  .filter((l) => exists(path.join(REPO, "data", l.key)));

const graph = { partial: true, courses: [], topics: [] };
const catalog = { generatedAt: new Date().toISOString(), source: "TeddyRookBookClub/TeddyRookBook", ladders: [] };
let totalTopics = 0, totalCourses = 0, totalLessons = 0;

for (const ladder of ladders) {
  const dataDir = path.join(REPO, "data", ladder.key);
  if (!exists(path.join(dataDir, "courses.yaml"))) continue;
  const courses = parseCourses(read(path.join(dataDir, "courses.yaml")));
  const topicsDir = path.join(dataDir, "topics"), lessonsDir = path.join(dataDir, "lessons");
  if (!exists(topicsDir) || !exists(lessonsDir)) continue;

  const ladderOut = path.join(OUT, ladder.key);
  fs.mkdirSync(path.join(ladderOut, "courses"), { recursive: true });
  fs.mkdirSync(path.join(ladderOut, "topics"), { recursive: true });
  const courseTopicDirs = new Set();

  const genIds = new Set();
  const genDir = path.join(REPO, "static", ladder.key, "gen");
  if (fs.existsSync(genDir)) for (const gf of fs.readdirSync(genDir).filter((x) => x.endsWith(".js"))) {
    const s = read(path.join(genDir, gf));
    for (const m of s.matchAll(/(?:G|ML\.gen)\(\s*'([^']+)'/g)) genIds.add(m[1]);
  }

  const allTopics = [], unitsAll = [];
  for (const file of fs.readdirSync(topicsDir).filter((f) => f.endsWith(".json"))) {
    const key = file.replace(/\.json$/, "");
    const tdata = readJson(path.join(topicsDir, file));
    const lessonFile = path.join(lessonsDir, file);
    const lessonData = exists(lessonFile) ? readJson(lessonFile) : {};
    unitsAll.push(...(tdata.units || []).map((u) => ({ ...u, course: key })));
    for (const t of tdata.topics || []) {
      const lesson = lessonData[t.id] || { blocks: [], sources: [] };
      const vizNames = (lesson.blocks || []).filter((b) => b.t === "viz").map((b) => b.name).filter(Boolean);

      // If the source has no generator, derive an honest self-check from the
      // lesson's own worked example (never invent an answer).
      let practice = null;
      if (!genIds.has(t.id)) {
        const ex = (lesson.blocks || []).find((b) => b.t === "ex" && b.q && b.a);
        const tryB = (lesson.blocks || []).find((b) => b.t === "try" && b.q && b.a);
        practice = ex
          ? { kind: "worked-example", q: ex.q, a: ex.a, steps: ex.steps || [], title: ex.title || "Worked example" }
          : tryB
            ? { kind: "worked-example", q: tryB.q, a: tryB.a, steps: tryB.steps || [], title: "Try it" }
            : { kind: "reflection", q: "In one sentence, what is the main idea of this lesson?", a: t.short || t.title, steps: [] };
      }
      const bundle = {
        id: t.id, slug: t.slug, ladder: ladder.key, course: key,
        unit: t.unit, title: t.title, short: t.short || "", trouble: t.trouble || "",
        prereqs: t.prereqs || [], xp: t.xp || 1, viz: t.viz || [],
        figureArchetype: vizNames.length || (t.viz || []).length ? archetype([...vizNames, ...(t.viz || [])], lesson) : "LessonFigure",
        practice,
        lesson: {
          blocks: lesson.blocks || [],
          sources: (lesson.sources && lesson.sources.length) ? lesson.sources : [{ name: `Teddy Rook Book — ${ladder.title || ladder.key} · ${courses.find((c) => c.key === key)?.title || key}` }],
        },
        license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
      };
      if (!courseTopicDirs.has(key)) { fs.mkdirSync(path.join(ladderOut, "topics", key), { recursive: true }); courseTopicDirs.add(key); }
      fs.writeFileSync(path.join(ladderOut, "topics", key, `${t.slug}.json`), JSON.stringify(bundle, null, 2));
      // Flat fallback for deep links without a course param (may collide; namespaced path wins).
      const flat = path.join(ladderOut, "topics", `${t.slug}.json`);
      if (!exists(flat)) fs.writeFileSync(flat, JSON.stringify(bundle, null, 2));
      allTopics.push({ id: t.id, slug: t.slug, course: key, unit: t.unit, title: t.title, short: t.short || "", prereqs: t.prereqs || [], viz: t.viz || [] });
      graph.topics.push({
        id: t.id, slug: t.slug, course: key, unit: t.unit, ladder: ladder.key, title: t.title,
        short: t.short || "", prereqs: t.prereqs || [], xp: t.xp || 1,
        url: `/${ladder.slug || ladder.key}/${courses.find((c) => c.key === key)?.slug || key}/${t.slug}/`,
      });
      totalTopics++;
    }
    totalLessons += Object.keys(lessonData).length;
  }
  for (const c of courses) {
    graph.courses.push({ key: c.key, slug: c.slug, title: c.title, short: c.short || c.title, after: c.after || [], ladder: ladder.key });
    fs.writeFileSync(path.join(ladderOut, "courses", `${c.key}.json`), JSON.stringify({
      key: c.key, ladder: ladder.key, title: c.title, short: c.short || c.title,
      after: c.after || [], units: unitsAll.filter((u) => u.course === c.key).map(({ course, ...u }) => u),
      topics: allTopics.filter((t) => t.course === c.key),
    }, null, 2));
  }
  totalCourses += courses.length;
  catalog.ladders.push({
    key: ladder.key, slug: ladder.slug || ladder.key, title: ladder.title || ladder.key,
    short: ladder.short || ladder.key, viz: ladder.viz || "", order: ladder.order || 99,
    color: ladder.color || "#666", courses: courses.length, topics: allTopics.length,
    courseKeys: courses.map((c) => c.key),
  });
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2));
fs.writeFileSync(path.join(OUT, "graph.json"), JSON.stringify(graph, null, 2));
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ladders: catalog.ladders.length, courses: totalCourses, topics: totalTopics, lessons: totalLessons }, null, 2));
console.log(`Corpus ingest: ${catalog.ladders.length} ladders, ${totalCourses} courses, ${totalTopics} topics, ${totalLessons} lessons`);
console.log(catalog.ladders.map((l) => `  ${l.key.padEnd(11)} ${String(l.courses).padStart(3)} courses ${String(l.topics).padStart(5)} topics`).join("\n"));
