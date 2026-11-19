// Match the app's own corpus to the Marble Skill Taxonomy and emit one small
// data file per matched lesson under content/marble/by-topic/<topicId>.json.
//
// Runtime cost is zero for unmatched lessons: the app only fetches the file
// for the lesson being viewed. Nothing from Marble is merged into content/<ladder>/,
// so the app's corpus licence is untouched (ODbL share-alike stays contained).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const SLIM = path.join(ROOT, ".cache/marble/slim.json");
const OUT = path.join(ROOT, "content/marble");
const BY_TOPIC = path.join(OUT, "by-topic");

// Which Marble subjects a given app ladder is allowed to match against. A
// narrow allowlist is what keeps "Fractions" from matching a music topic.
const SUBJECT_FOR_LADDER = {
  math: ["Mathematics"],
  physics: ["Science"],
  chemistry: ["Science"],
  earth: ["Science"],
  bio: ["Science"],
  lifesci: ["Science"],
  hsbio: ["Science"],
  biology: ["Science"],
  writing: ["English"],
  vocab: ["English"],
  greatbooks: ["English"],
  literature: ["English"],
  geog: ["Geography"],
  humangeo: ["Geography"],
  worldgeo: ["Geography"],
  civics: ["History", "Personal & Social Development"],
  gov: ["History", "Personal & Social Development"],
  history: ["History"],
  egypt: ["History"],
  etiquette: ["Personal & Social Development"],
  life: ["Personal & Social Development"],
  health: ["Personal & Social Development"],
  memory: ["Learning to Learn"],
  logic: ["Mathematics", "Learning to Learn"],
  art: ["Art & Design"],
  music: ["Music"],
  hand: ["Design & Technology"],
  econ: ["Economics"],
};

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|of|and|in|to|for|with|your|you|its)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(["the", "a", "an", "of", "and", "in", "to", "for", "with", "using", "use", "how", "what", "why", "is", "are"]);
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// Upstream prompts are written for a parent: "Can {{name}} pluck a rubber band…".
// The app shows them to the learner, so fill the placeholder in.
const learnerText = (x) => (x ? String(x).replace(/\{\{\s*name\s*\}\}/gi, "you") : null);

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}

// ---- app corpus -------------------------------------------------------------
function appTopics() {
  const catalog = readJSON(path.join(ROOT, "content/catalog.json"), { ladders: [] });
  const out = [];
  for (const ladder of catalog.ladders ?? []) {
    for (const course of ladder.courseKeys ?? []) {
      const file = path.join(ROOT, "content", ladder.key, "courses", `${course}.json`);
      const doc = readJSON(file, null);
      if (!doc) continue;
      for (const t of doc.topics ?? []) {
        out.push({ id: t.id, title: t.title ?? t.slug, slug: t.slug ?? String(t.id).split(".").slice(1).join("."), course, ladder: ladder.key, prereqs: t.prereqs ?? [] });
      }
    }
  }
  return out;
}

// ---- Marble ----------------------------------------------------------------
function main() {
  if (!fs.existsSync(SLIM)) {
    console.error("marble-map: run `node scripts/marble-import.mjs` first");
    process.exit(1);
  }
  const slim = readJSON(SLIM, null);
  const marble = new Map(slim.topics.map((t) => [t.id, t]));
  const app = appTopics();

  // Index Marble topics by normalised name and by token signature.
  const byName = new Map();
  for (const t of slim.topics) {
    const k = norm(t.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(t);
  }

  const depsByTopic = new Map();
  const depsByPrereq = new Map();
  for (const d of slim.deps) {
    if (!depsByTopic.has(d.topic)) depsByTopic.set(d.topic, []);
    depsByTopic.get(d.topic).push(d);
    if (!depsByPrereq.has(d.prereq)) depsByPrereq.set(d.prereq, []);
    depsByPrereq.get(d.prereq).push(d);
  }

  const clusterFor = (subject, domain) =>
    slim.clusters.find((c) => c.subject === subject && c.domain === domain) ?? null;

  const map = {};
  const report = { exact: 0, fuzzy: 0, unmatched: 0, byLadder: {} };
  const samples = [];

  for (const t of app) {
    const allowed = SUBJECT_FOR_LADDER[t.ladder];
    if (!allowed) { report.unmatched++; continue; }
    const pool = slim.topics.filter((m) => allowed.includes(m.subject));
    const key = norm(t.title);
    let hit = byName.get(key)?.filter((m) => allowed.includes(m.subject))[0] ?? null;
    let confidence = hit ? 1 : 0;
    let how = "exact";

    if (!hit) {
      const at = tokens(t.title);
      let best = null, bestScore = 0;
      for (const m of pool) {
        const s = jaccard(at, tokens(m.name));
        if (s > bestScore) { bestScore = s; best = m; }
      }
      if (best && bestScore >= 0.85 && at.size >= 2) { hit = best; confidence = Math.round(bestScore * 100) / 100; how = "fuzzy"; }
    }

    report.byLadder[t.ladder] ??= { matched: 0, total: 0 };
    report.byLadder[t.ladder].total++;
    if (!hit) { report.unmatched++; continue; }
    report.byLadder[t.ladder].matched++;
    report[how]++;

    const r = slim.research[hit.id] ?? {};
    const prereqRows = (depsByTopic.get(hit.id) ?? []).map((d) => {
      const pm = marble.get(d.prereq);
      return {
        id: d.prereq,
        name: pm?.name ?? d.prereq,
        strength: d.strength,
        reason: d.reason,
        appId: null, // filled in a second pass
      };
    });
    const nextRows = (depsByPrereq.get(hit.id) ?? []).slice(0, 8).map((d) => ({
      id: d.topic,
      name: marble.get(d.topic)?.name ?? d.topic,
      strength: d.strength,
    }));
    const cluster = clusterFor(hit.subject, hit.domain);

    map[t.id] = {
      marble: hit.id,
      name: hit.name,
      subject: hit.subject,
      domain: hit.domain,
      confidence,
      how,
      standards: hit.standards.length,
    };

    const payload = {
      attribution: slim.source.attribution,
      licence: slim.source.licence,
      topicId: t.id,
      marble: {
        id: hit.id,
        name: hit.name,
        subject: hit.subject,
        domain: hit.domain,
        ages: hit.ageStart != null && hit.ageEnd != null ? [hit.ageStart, hit.ageEnd] : null,
        description: learnerText(hit.description),
        prompt: learnerText(hit.prompt),
      },
      cluster: cluster ? { summary: cluster.summary } : null,
      standards: hit.standards,
      misconceptions: r.mis ?? [],
      representations: r.reps ?? [],
      authoredAnswer: learnerText(r.correct),
      probe: learnerText(r.poe),
      wrongAnswers: (r.wrong ?? []).map((w) => ({
        wrong: w.wrong,
        revealedBy: w.looks || w.pattern,
        fix: w.fix,
        reteach: w.reteach,
      })),
      before: prereqRows,
      after: nextRows,
      match: { how, confidence },
    };
    fs.mkdirSync(BY_TOPIC, { recursive: true });
    fs.writeFileSync(path.join(BY_TOPIC, `${t.id}.json`), JSON.stringify(payload));
  }

  // Second pass: point prerequisites at app lessons where the Marble prerequisite
  // itself matched one, so "Before this" can link straight into the app.
  const appById = new Map(app.map((t) => [t.id, t]));
  const hrefFor = (appId) => {
    const t = appById.get(appId);
    return t ? `?s=${encodeURIComponent(t.ladder)}&c=${encodeURIComponent(t.course)}&t=${encodeURIComponent(t.slug)}` : null;
  };
  const appIdForMarble = new Map(Object.entries(map).map(([appId, m]) => [m.marble, appId]));
  let linked = 0;
  for (const [appId, m] of Object.entries(map)) {
    const file = path.join(BY_TOPIC, `${appId}.json`);
    const doc = readJSON(file, null);
    if (!doc) continue;
    for (const row of doc.before ?? []) {
      const target = appIdForMarble.get(row.id);
      if (target) { row.appId = target; row.href = hrefFor(target); linked++; }
    }
    fs.writeFileSync(file, JSON.stringify(doc));
  }

  fs.writeFileSync(path.join(OUT, "map.json"), JSON.stringify({
    source: slim.source,
    generated: new Date().toISOString().slice(0, 10),
    stats: {
      appTopics: app.length,
      matched: Object.keys(map).length,
      exact: report.exact,
      fuzzy: report.fuzzy,
      prereqLinks: linked,
      byLadder: report.byLadder,
    },
    topics: map,
  }, null, 1));

  // Small committed index so the UI can badge and filter matched lessons
  // without fetching anything (95 ids ≈ 2 KB).
  fs.writeFileSync(path.join(OUT, "matched.json"), JSON.stringify({
    count: Object.keys(map).length,
    ids: Object.keys(map).sort(),
  }));

  const matched = Object.keys(map).length;
  console.log(`marble-map: ${matched}/${app.length} app lessons matched (${report.exact} exact, ${report.fuzzy} fuzzy), ${linked} prerequisite links resolved to app lessons`);
  console.log("by ladder:", Object.entries(report.byLadder).filter(([, v]) => v.matched).map(([k, v]) => `${k} ${v.matched}/${v.total}`).join(", "));
  for (const [id, m] of Object.entries(map).slice(0, 12)) {
    samples.push(`${m.confidence} ${id} → ${m.marble} "${m.name}"`);
  }
  console.log("samples:\n  " + samples.join("\n  "));
}

main();
