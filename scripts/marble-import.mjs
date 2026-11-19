// Import the Marble Skill Taxonomy (withmarbleapp/os-taxonomy, v1) and emit a
// slim, app-shaped projection under content/marble/.
//
// Why a projection: the upstream teaching-research file is ~31 MB of authoring
// prose. The app only needs, per topic: misconceptions, key representations,
// authored wrong answers (distractors), the reteach link and the "why this
// comes first" reasons. That is ~1/10th of the bytes.
//
// Licence: the database is ODbL 1.0, the authored text is CC BY-SA 4.0. This
// importer stores a *separate* namespace (content/marble/) and never merges
// upstream records into content/<ladder>/, so the app's own corpus keeps its
// licence and attribution is a single footer line.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const OUT = path.join(ROOT, ".cache/marble");
const CACHE = path.join(ROOT, ".cache/marble");
const RAW = "https://raw.githubusercontent.com/withmarbleapp/os-taxonomy/main/data";

const FILES = ["manifest.json", "topics.json", "dependencies.json", "clusters.json", "teaching-research.json"];

function cachePath(name) { return path.join(CACHE, name); }

async function load(name) {
  const local = cachePath(name);
  if (fs.existsSync(local) && fs.statSync(local).size > 0) {
    try {
      const raw = fs.readFileSync(local, "utf8");
      const parsed = JSON.parse(raw);
      console.log(`  cache  ${name} (${(raw.length / 1048576).toFixed(1)} MB)`);
      return parsed;
    } catch {
      console.warn(`  cache  ${name} is incomplete, refetching`);
    }
  }
  console.log(`  fetch  ${RAW}/${name}`);
  const res = await fetch(`${RAW}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const text = await res.text();
  const parsed = JSON.parse(text);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(local, text);
  return parsed;
}

const uniq = (xs) => [...new Set(xs)];
const str = (v, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  return (async () => {
    console.log("Marble taxonomy import");
    const loaded = [];
    for (const f of FILES) loaded.push(await load(f));
    const [man, topicsJson, depsJson, clustersJson, researchJson] = loaded;

    const topics = (topicsJson.topics ?? []).map((t) => ({
      id: t.id,
      name: str(t.name, 120),
      subject: t.subject,
      domain: t.domain,
      type: t.type,
      ageStart: t.ageRangeStart ?? null,
      ageEnd: t.ageRangeEnd ?? null,
      centrality: typeof t.centrality === "number" ? Math.round(t.centrality * 1e4) / 1e4 : null,
      description: str(t.description, 320),
      evidence: uniq((t.evidence ?? []).map((e) => str(e, 220))).filter(Boolean).slice(0, 4),
      prompt: str(t.assessmentPrompt, 320).replace(/\{\{\s*name\s*\}\}/gi, "you") || null,
      // Standard IDs only. The upstream standards *text* is third-party licensed,
      // so we deliberately do not copy it.
      standards: uniq((t.standards ?? []).filter((s) => typeof s === "string")),
    }));

    const deps = (depsJson.dependencies ?? []).map((d) => ({
      topic: d.topicId,
      prereq: d.prerequisiteId,
      strength: d.strength === "soft" ? "soft" : "hard",
      reason: str(d.reason, 240),
    }));

    const clusters = (clustersJson.clusters ?? []).map((c) => ({
      subject: c.subject,
      domain: c.domain,
      ageStart: c.ageRangeStart ?? null,
      summary: str(c.summary, 600),
    }));

    // Slim research: keep only learner-facing, actionable fields.
    // Teacher-facing prose (bestPractices, activity scripts) is dropped: it is
    // 3+ MB and does not appear in the app.
    const research = {};
    for (const r of researchJson.records ?? []) {
      const p = r.pedagogy ?? {};
      const a = r.assess ?? {};
      const rec = {};
      const misconceptions = uniq((p.commonMisconceptions ?? []).map((m) => str(m, 260))).filter(Boolean);
      if (misconceptions.length) rec.mis = misconceptions.slice(0, 5);
      const reps = uniq((p.keyRepresentations ?? []).map((m) => str(m, 160))).filter(Boolean);
      if (reps.length) rec.reps = reps.slice(0, 6);
      const practices = uniq((p.bestPractices ?? []).map((m) => str(m, 220))).filter(Boolean);
      if (practices.length) rec.practice = practices.slice(0, 2);
      const wrong = (a.errorPatterns ?? [])
        .filter((e) => e && (e.distractor || e.pattern))
        .map((e) => ({
          wrong: str(e.distractor, 200) || null,
          pattern: str(e.pattern, 240),
          looks: str(e.revealedBy, 220),
          fix: str(e.nextMove, 260),
          reteach: e.reteachPrerequisiteId ?? null,
        }));
      if (wrong.length) rec.wrong = wrong.slice(0, 6);
      if (a.correctAnswer) rec.correct = str(a.correctAnswer, 420);
      if (a.method) rec.method = a.method;
      if (a.poeTask) rec.poe = str(a.poeTask, 320);
      if (Object.keys(rec).length) research[r.topicId] = rec;
    }

    const out = {
      source: {
        name: "Marble Skill Taxonomy",
        version: man?.taxonomyVersion ?? "v1",
        url: "https://github.com/withmarbleapp/os-taxonomy",
        attribution: "Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com",
        licence: "ODbL 1.0 (database) · CC BY-SA 4.0 (content)",
        importedAt: new Date().toISOString().slice(0, 10),
      },
      topics,
      deps,
      clusters,
      research,
    };

    const file = path.join(OUT, "slim.json");
    const json = JSON.stringify(out);
    fs.writeFileSync(file, json);
    const sha = crypto.createHash("sha256").update(json).digest("hex").slice(0, 16);

    console.log(`  topics ${topics.length} · deps ${deps.length} · clusters ${clusters.length} · research ${Object.keys(research).length}`);
    console.log(`  wrote .cache/marble/slim.json  ${(json.length / 1048576).toFixed(2)} MB  sha256:${sha}`);
    console.log(`  upstream manifest counts: ${JSON.stringify(man?.counts?.topics ?? "?")} topics`);
  })();
}

main().catch((e) => {
  console.error("marble-import failed:", e.message);
  process.exit(1);
});
