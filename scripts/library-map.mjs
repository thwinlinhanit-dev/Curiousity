// Build content/library/links.json — the bidirectional map between dataset
// items and curriculum lessons (spec: docs/superpowers/specs/2026-11-19-library-integration-design.md).
//
// Rules are declared per dataset here (never guessed at runtime). Confidence:
//   exact   normalised-title equality
//   strong  token Jaccard >= 0.6 with >= 2 shared tokens
//   weak    >= 0.45 — written to links-report.txt only, never into the UI data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const OUT = path.join(ROOT, "content/library");

const read = (p, fb) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")); } catch { return fb; } };

const norm = (s) => String(s ?? "")
  .toLowerCase()
  .replace(/[’'`´]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\b(the|a|an|of|and|in|to|for|with|on|its|their)\b/g, " ")
  .replace(/\s+/g, " ").trim();

const STOP = new Set(["the", "a", "an", "of", "and", "in", "to", "for", "with", "on", "its", "their", "how", "what", "why", "is", "are"]);
// crude plural stemming so "laws" meets "law" and "layers" meets "layer"
const stem = (w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
const toks = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)).map(stem));

// idf-weighted overlap: rare shared words (thermodynamics, karenina) carry the
// match; common ones (rules, types) do not. 1.0 = one side subsumes the other.
let IDF = new Map();
let DF = new Map();
function score(a, b) {
  let inter = 0, wa = 0, wb = 0, shared = 0;
  for (const t of a) { const w = IDF.get(t) ?? 1; wa += w; if (b.has(t)) { inter += w; shared++; } }
  for (const t of b) wb += IDF.get(t) ?? 1;
  const max = Math.max(wa, wb), min = Math.max(Math.min(wa, wb), 1e-9);
  const balance = inter / max;
  const subsum = inter / min; // 1 = the shorter side is fully covered
  // a single shared word may carry a match only when it is rare enough
  const rareOne = shared === 1 && Math.min(a.size, b.size) === 1
    && (DF.get([...a].find((t) => b.has(t)) ?? "") ?? 99) <= 8;
  return { j: Math.max(balance, subsum >= 0.999 && (Math.min(a.size, b.size) >= 2 || rareOne) ? 0.73 : balance), shared };
}
function buildIdf(topics) {
  DF = new Map();
  for (const t of topics) for (const w of toks(t.title)) DF.set(w, (DF.get(w) ?? 0) + 1);
  IDF = new Map([...DF].map(([w, n]) => [w, 1 / Math.log2(2 + n)]));
}

// ------------------------------------------------------------------ rules
// each: dataset → { ladders(item) → string[] , title(item) }
const DATASET_RULES = {
  // 19 hand-curated labs: each explorer/activity points at the lessons it
  // lets you play with. Curated because lab names ("Book Cart", "Gas in a
  // Box") never title-match lesson names.
  "science-lab": {
    hubByIndex: {
      0: ["chem.matter-classification", "astro.supernovae"],
      1: ["chem.fission-fusion", "astrophys.fusion-tunneling"],
      2: ["phys1.newtons-third-law", "phys1.free-fall", "phys1.acceleration"],
      3: ["phys2.first-law", "phys2.entropy", "phys2.heat-engines"],
      4: ["phys1.kinetic-friction", "phys1.newtons-third-law"],
      5: ["phys1.orbiting-satellites", "astro.orbits-escape"],
      6: ["rocket.rocket-equation", "mech.rocket-equation"],
      7: ["pre.projectile-motion", "mech.projectile-optimization"],
      8: ["phys1.pendulum-period", "mech.driven-resonance"],
      9: ["sciexp.circuits", "physsci.series-parallel-intro"],
      10: ["em.rl-circuits", "em.rc-discharging"],
      11: ["exam.convex-lens", "modern.lensmaker"],
      12: ["phys2.ideal-gas-law", "chem.gas-pressure"],
      13: ["chem.matter-classification"],
      14: ["chem.balancing-equations", "chem.conservation-of-mass"],
      15: ["chem.atomic-models", "chem.average-atomic-mass"],
      16: ["astro.solar-system-formation", "earthsci.solar-system-scale"],
      17: ["lifesci.predator-prey", "de.predator-prey-pendulum"],
      18: ["g5.volume-unit-cubes"],
    },
    title: (it) => it.title,
  },
  trades: { ladders: () => ["physics", "chemistry", "robotics", "inventors"], title: (it) => it.title },
  timeline: {
    ladders: (it) => ({ egypt: ["egypt"], greece: ["scripts"], rome: ["scripts", "civics"], bible: ["scripts"], world: ["geog"], east: ["geog", "egypt"] }[String(it.meta.place)] ?? []),
    title: (it) => it.title,
  },
  infographics: {
    ladders: (it) => {
      const tags = it.meta.tags ?? [];
      if (tags.includes("Reader’s Maps") || tags.includes("Reader's Maps") || tags.includes("Books")) return ["greatbooks"];
      if (tags.includes("History")) return ["egypt", "scripts", "civics"];
      if (tags.includes("Language")) return ["vocab", "writing"];
      if (tags.includes("Science")) return ["physics", "chemistry", "bio"];
      if (tags.includes("Finance")) return ["economics"];
      return [];
    },
    title: (it) => {
      const t = String(it.title);
      const m = t.match(/^(.*?):?\s*A Reader.?s Map$/i);
      return (m ? m[1] : t).trim() || it.title;
    },
  },
  memory: { ladders: () => null /* all ladders */, title: (it) => it.title },
  // curated hub: the corpus has no periodic-table lesson of its own (that gap
  // is what Phase 2 fills); every element points at the classification lesson.
  elements: { hub: ["chem.matter-classification"], title: () => "Elements, Compounds and Mixtures" },
  debate: {
    ladders: (it) => ({ civics: ["civics"], economics: ["economics"], science: ["bio", "physics"], ethics: ["etiquette", "logic"], history: ["egypt", "civics"], school: ["etiquette", "writing"] }[String(it.meta.category)] ?? []),
    title: (it) => String(it.meta.resolution ?? it.title),
  },
  greatbooks: { ladders: () => ["greatbooks"], title: (it) => it.title },
  // harvard: essay titles do not correspond to lesson titles; no rule beats
  // confident nonsense, so it stays a pure browser.
  papers: { ladders: () => ["civics"], title: (it) => (it.subtitle && it.subtitle !== it.title ? it.subtitle : it.title) },
  // recipes stay a browser: dish names do not correspond to technique lessons.
  // music becomes its own ladder in Phase 3; resources/credits/garden stay browsers.
};

function main() {
  const graph = read("content/graph.json", { topics: [] });
  if (!graph.topics.length) { console.error("library-map: content/graph.json missing — run publish first"); process.exit(1); }
  buildIdf(graph.topics);

  const topicsByLadder = new Map();
  for (const t of graph.topics) {
    if (!topicsByLadder.has(t.ladder)) topicsByLadder.set(t.ladder, []);
    topicsByLadder.get(t.ladder).push(t);
  }
  const href = (t) => `?s=${encodeURIComponent(t.ladder)}&c=${encodeURIComponent(t.course)}&t=${encodeURIComponent(t.slug || String(t.id).split(".").slice(1).join("."))}`;

  const byTopic = {};
  const byItem = {};
  const weak = [];
  const stats = { items: 0, linkedItems: 0, linkedTopics: 0, exact: 0, strong: 0, weak: 0 };
  const perDataset = {};

  for (const [id, rule] of Object.entries(DATASET_RULES)) {
    const doc = read(`content/data/${id}.json`, null);
    if (!doc) { console.warn(`  skip ${id}: no file`); continue; }
    const items = doc.items ?? [];
    perDataset[id] = { items: items.length, links: 0 };

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      stats.items++;
      const key = `${id}:${String(it.meta?.slug ?? it.meta?.id ?? i)}`;
      const title = rule.title(it);
      const at = toks(title);
      if (!at.size) continue;

      const hub = (rule.hubByIndex && rule.hubByIndex[i]) || rule.hub;
      const pool = hub
        ? graph.topics.filter((t) => hub.includes(t.id))
        : (() => {
            if (!rule.ladders) return graph.topics;
            const k = rule.ladders(it);
            if (!k) return graph.topics;
            return Array.isArray(k) ? k.flatMap((l) => topicsByLadder.get(l) ?? []) : topicsByLadder.get(k) ?? [];
          })();

      // curated hubs link directly; otherwise exact pass first, then strong
      const cands = [];
      if (hub) { for (const t of pool) cands.push({ t, conf: "exact", j: 1 }); }
      else for (const t of pool) {
        const n = norm(t.title);
        if (n && n === norm(title)) { cands.push({ t, conf: "exact", j: 1 }); continue; }
        const s = score(at, toks(t.title));
        if (s.j >= 0.45) cands.push({ t, conf: s.j >= 0.72 ? "strong" : "weak", j: Math.round(s.j * 100) / 100 });
      }
      cands.sort((x, y) => y.j - x.j);
      const keep = cands.filter((c) => c.conf !== "weak").slice(0, 6);
      for (const c of cands.filter((c) => c.conf === "weak").slice(0, 2)) {
        if (!keep.length) weak.push(`${id} "${title}" → weak ${c.j} ${c.t.id}`);
      }

      if (!keep.length) continue;
      stats.linkedItems++;
      perDataset[id].links += keep.length;
      byItem[key] = { dataset: id, index: i, title: it.title, lessons: keep.map((c) => ({ topicId: c.t.id, title: c.t.title, ladder: c.t.ladder, course: c.t.course, href: href(c.t) })) };
      for (const c of keep) {
        (byTopic[c.t.id] ??= []).push({ dataset: id, key, title: it.title, confidence: c.conf });
        stats[c.conf]++;
      }
    }
  }

  stats.linkedTopics = Object.keys(byTopic).length;
  // de-duplicate repeated dataset items pointing at the same topic (e.g. two
  // arrangements of one song): keep the first per dataset.
  for (const rows of Object.values(byTopic)) {
    const seen = new Set();
    for (let i = rows.length - 1; i >= 0; i--) {
      const k = `${rows[i].dataset}|${rows[i].title}`;
      if (seen.has(k)) rows.splice(i, 1); else seen.add(k);
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  const out = { generated: new Date().toISOString().slice(0, 10), stats, byTopic, byItem };
  fs.writeFileSync(path.join(OUT, "links.json"), JSON.stringify(out));
  fs.writeFileSync(path.join(OUT, "links-report.txt"),
    `library links report\nitems ${stats.items} · linked items ${stats.linkedItems} · linked topics ${stats.linkedTopics}\nexact ${stats.exact} · strong ${stats.strong} · weak(dropped) ${stats.weak}\n\nper dataset:\n${Object.entries(perDataset).map(([k, v]) => `  ${k.padEnd(12)} items ${String(v.items).padStart(4)} · links ${v.links}`).join("\n")}\n\nweak matches that were dropped:\n${weak.join("\n")}\n`);

  console.log(`library-map: ${stats.linkedItems}/${stats.items} items linked → ${stats.linkedTopics} lessons (${stats.exact} exact, ${stats.strong} strong)`);
  console.log(Object.entries(perDataset).map(([k, v]) => `${k} ${v.links}`).join(" · "));
}

main();
