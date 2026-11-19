// Phase 0 ingest: Teddy Rook Book physics data -> static content bundles.
// Reads the real repo (../trb) and emits content/ for the app. No network at runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const OUT = path.resolve(ROOT, "content");

const read = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));

// --- minimal course metadata from courses.yaml (avoids a YAML dependency) ---
function parseCourses(text) {
  const courses = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("- key:")) {
      if (cur) courses.push(cur);
      cur = { key: line.slice(6).trim(), number: courses.length + 1 };
    } else if (cur && line.startsWith("slug:")) cur.slug = line.slice(5).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("title:")) cur.title = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("short:")) cur.short = line.slice(6).trim().replace(/^["']|["']$/g, "");
    else if (cur && line.startsWith("after:")) cur.after = line.slice(6).trim().replace(/[\[\]]/g, "").split(",").map(s=>s.trim()).filter(Boolean);
  }
  if (cur) courses.push(cur);
  return courses;
}

const courses = parseCourses(read(path.join(REPO, "data/physics/courses.yaml")));
const courseMap = Object.fromEntries(courses.map(c => [c.key, c]));

const graph = {
  partial: true, // keep cross-ladder prerequisites (math) that this graph doesn't define
  courses: courses.map((c) => ({ key: c.key, slug: c.slug, title: c.title, after: c.after || [], ladder: "physics" })),
  topics: [],
};

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "TeddyRookBookClub/TeddyRookBook @ main (shallow)",
  license: "Lessons CC BY-NC 4.0; engine MIT; attribute Teddy Rook with link",
  courses: [],
  totals: { courses: 0, topics: 0, lessons: 0, vizInstances: 0 },
};

const topicsDir = path.join(REPO, "data/physics/topics");
const lessonsDir = path.join(REPO, "data/physics/lessons");
const topicFiles = fs.readdirSync(topicsDir).filter(f => f.endsWith(".json"));
let allTopics = 0, allLessons = 0, allViz = 0;

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "courses"), { recursive: true });
fs.mkdirSync(path.join(OUT, "topics"), { recursive: true });

for (const file of topicFiles) {
  const key = file.replace(/\.json$/, "");
  const topicData = readJson(path.join(topicsDir, file));
  const lessonData = readJson(path.join(lessonsDir, file));
  const course = courseMap[key] || { key, title: topicData.course || key };

  const topics = topicData.topics || [];
  const units = topicData.units || [];
  allTopics += topics.length;
  allLessons += Object.keys(lessonData).length;

  // count viz instances and collect block-type histogram
  let vizCount = 0;
  const blockTypes = {};
  for (const [id, lesson] of Object.entries(lessonData)) {
    for (const b of lesson.blocks || []) {
      blockTypes[b.t] = (blockTypes[b.t] || 0) + 1;
      if (b.t === "viz") vizCount++;
    }
  }
  allViz += vizCount;

  // write per-topic bundle (validated shape for the app)
  for (const t of topics) {
    const lesson = lessonData[t.id];
    if (!lesson) continue;
    const unit = units.find(u => u.key === t.unit) || { key: t.unit, title: t.unit };
    const bundle = {
      id: t.id, slug: t.slug, course: key, courseTitle: course.title,
      unit: unit.key, unitTitle: unit.title,
      title: t.title, short: t.short, trouble: t.trouble || "",
      prereqs: t.prereqs || [], xp: t.xp || 1, viz: t.viz || [],
      figureArchetype: inferArchetype(t, lesson),
      lesson: { blocks: lesson.blocks || [], sources: lesson.sources || [] },
      license: "CC BY-NC 4.0 — Teddy Rook; link back required",
    };
    fs.writeFileSync(path.join(OUT, "topics", `${t.slug}.json`), JSON.stringify(bundle, null, 2));

    graph.topics.push({
      id: t.id, course: key, unit: t.unit, title: t.title, short: t.short || "",
      prereqs: t.prereqs || [], xp: t.xp || 1, url: `/physics/${course.slug || key}/${t.slug}/`,
    });
  }

  // write course index
  fs.writeFileSync(path.join(OUT, "courses", `${key}.json`), JSON.stringify({
    key, title: course.title, slug: course.slug, after: course.after || [],
    units, topics: topics.map(t => ({ id: t.id, slug: t.slug, unit: t.unit, title: t.title, prereqs: t.prereqs || [], viz: t.viz || [] })),
  }, null, 2));

  manifest.courses.push({ key, title: course.title, short: course.short || course.title, slug: course.slug, topics: topics.length, lessons: Object.keys(lessonData).length, vizInstances: vizCount, blockTypes });
}

manifest.totals = { courses: topicFiles.length, topics: allTopics, lessons: allLessons, vizInstances: allViz };
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(OUT, "graph.json"), JSON.stringify(graph, null, 2));

function inferArchetype(topic, lesson) {
  const id = topic.id;
  const viz = (topic.viz || []).join(" ");
  const txt = JSON.stringify(lesson.blocks || []).slice(0, 4000);
  if (/projectile|free-fall|vertical-launch|kinematic|velocity|acceleration|position|motion-graph/.test(id) || /ph-motion|ph-projectile/.test(viz)) return "MotionFigure";
  if (/circuit|current|voltage|resistan|electric-field|capacitor/.test(id) || /ph-circuit/.test(viz)) return "CircuitFigure";
  if (/wave|sound|interference|oscillation|shm|pendulum/.test(id) || /ph-wave|ph-shm/.test(viz)) return "WaveFigure";
  if (/optics|lens|mirror|refraction/.test(id) || /ph-optics/.test(viz)) return "OpticsFigure";
  if (/field|gravitation|magnetic/.test(id)) return "FieldFigure";
  if (/rotation|torque|angular/.test(id)) return "BodyFigure";
  if (/energy|work|power/.test(id)) return "EnergyFigure";
  return "GeneralFigure";
}

console.log("INGEST COMPLETE");
console.log("courses:", manifest.totals.courses, "topics:", manifest.totals.topics, "lessons:", manifest.totals.lessons, "viz instances:", manifest.totals.vizInstances);
console.log("\nPer course:");
for (const c of manifest.courses) console.log(`  ${c.key.padEnd(10)} ${String(c.topics).padStart(4)} topics  ${String(c.vizInstances).padStart(4)} viz`);
const p1 = manifest.courses.find(c => c.key === "phys1");
console.log("\nphys1 block types:", p1 ? JSON.stringify(p1.blockTypes) : "n/a");
