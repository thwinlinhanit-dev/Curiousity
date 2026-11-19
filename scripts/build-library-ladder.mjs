// Build the `library` ladder: memory lists, element facts and timeline
// ordering become ordinary lessons (mem.*, el.*, tl.*) so the existing
// progress engine, review queue and save codes cover them unchanged.
// Spec: docs/superpowers/specs/2026-11-19-library-integration-design.md (Phase 2).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const C = path.join(ROOT, "content");

const read = (p) => JSON.parse(fs.readFileSync(path.join(C, p), "utf8"));
const write = (p, obj) => {
  const full = path.join(C, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(obj));
};

const LADDER = { key: "library", slug: "library", title: "Library Drills", short: "Library", order: 21, color: "#6b3fa0" };
const COURSES = [
  { key: "mem", title: "Memory lists", short: "Memory", unit: { key: "lists", title: "Lists worth knowing" } },
  { key: "el", title: "The elements", short: "Elements", unit: { key: "reading", title: "Reading the periodic table" } },
  { key: "tl", title: "Timeline ordering", short: "Timeline", unit: { key: "eras", title: "What came first?" } },
];

const ERA_TITLES = {
  first: "The first civilizations", archaic: "The archaic world", bronze: "The Bronze Age",
  classical: "The classical world", hellenistic: "The Hellenistic age", empire: "Empires and faiths",
  late: "The late medieval world", after: "The modern era",
};

function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function main() {
  const graph = read("graph.json");
  const catalog = read("catalog.json");

  const taken = new Set(graph.courses.map((c) => c.key));
  for (const c of COURSES) if (taken.has(c.key)) { console.error(`course key ${c.key} already used`); process.exit(1); }

  const topics = [];

  // ---- memory lists --------------------------------------------------------
  const mem = read("data/memory.json");
  for (const list of mem.items ?? []) {
    const slug = String(list.meta?.slug ?? "");
    if (!slug) continue;
    const id = `mem.${slug}`;
    const n = (list.items ?? []).length;
    topics.push({
      id, slug, course: "mem", unit: "lists", ladder: LADDER.key,
      title: list.title, short: `Recall ${n} items — ${String(list.subtitle ?? "").replace(/^.*·\s*/, "") || "from memory"}.`,
      prereqs: [], xp: 2, url: `/library/memory/${slug}/`,
    });
    write(`library/topics/mem/${slug}.json`, {
      id, slug, ladder: LADDER.key, course: "mem", unit: "lists",
      title: list.title, short: topics[topics.length - 1].short,
      courseTitle: "Memory lists", unitTitle: "Lists worth knowing",
      trouble: "Rereading feels like knowing; it is not. Recall, then check.",
      viz: [], figureArchetype: "none",
      lesson: {
        blocks: [
          { t: "p", html: esc(list.body) },
          { t: "key", html: `<b>How to hold it:</b> ${esc(list.meta?.technique ?? "chunk the list, then recall one item at a time.")}` },
          { t: "note", html: `This list has ${n} items. Answer below, then check — the practice button generates fresh questions from the list itself.` },
        ],
        sources: [{ name: "The Teddy Rook corpus — memory lists" }],
      },
      practice: null,
    });
  }

  // ---- element facets ------------------------------------------------------
  const facets = [
    { slug: "symbol-from-name", title: "Symbol from Name", short: "Given the element's name, give its symbol.", hint: "Symbols are one or two letters; the first is capital. Many come from Latin: sodium is Na, potassium K, iron Fe." },
    { slug: "name-from-symbol", title: "Name from Symbol", short: "Given a symbol, name the element.", hint: "Say the symbol out loud — most are just the first letters of the name; the surprises are the Latin ones." },
    { slug: "atomic-number", title: "Atomic Number", short: "Find the element's number of protons.", hint: "The atomic number is the element's identity: hydrogen 1, carbon 6, gold 79. In the table it is the small whole number." },
    { slug: "atomic-mass", title: "Atomic Mass", short: "Read the atomic mass of an element.", hint: "Mass sits under the symbol and is usually about twice the number for light elements." },
    { slug: "category", title: "Element Categories", short: "Metals, nonmetals, metalloids — which is which?", hint: "Metals fill the left and middle, nonmetals top right, and the metalloids form the staircase between them." },
    { slug: "block", title: "s, p, d and f Blocks", short: "Which block does an element sit in?", hint: "Two columns on the left are s, six to the right are p, the middle ten are d, the bottom fourteen are f." },
    { slug: "state", title: "Solid, Liquid or Gas", short: "An element's state at room temperature.", hint: "Only bromine and mercury are liquid at room temperature; a handful are gases; everything else is solid." },
    { slug: "electron-config", title: "Electron Configuration", short: "Read and match configurations.", hint: "Shells fill in order: 2, 8, 8… The configuration spells out the position in the table." },
  ];
  for (const f of facets) {
    const id = `el.${f.slug}`;
    topics.push({
      id, slug: f.slug, course: "el", unit: "reading", ladder: LADDER.key,
      title: f.title, short: f.short, prereqs: [], xp: 2, url: `/library/elements/${f.slug}/`,
    });
    write(`library/topics/el/${f.slug}.json`, {
      id, slug: f.slug, ladder: LADDER.key, course: "el", unit: "reading",
      title: f.title, short: f.short, courseTitle: "The elements", unitTitle: "Reading the periodic table",
      trouble: "Confusing the symbol's language (Latin names) with the English name.",
      viz: [], figureArchetype: "none",
      lesson: {
        blocks: [
          { t: "p", html: `The periodic table is a map you can read. This drill works on ${f.short.toLowerCase().replace(/\.$/, "")}.` },
          { t: "key", html: `<b>Tip:</b> ${esc(f.hint)}` },
          { t: "note", html: "Questions are generated from the published element data — the same numbers the Periodic table dataset shows." },
        ],
        sources: [{ name: "The Teddy Rook corpus — elements" }],
      },
      practice: null,
    });
  }

  // ---- timeline eras -------------------------------------------------------
  const tl = read("data/timeline.json");
  const byEra = {};
  for (const it of tl.items ?? []) {
    const era = String(it.meta?.era ?? "after");
    (byEra[era] ??= []).push(it);
  }
  for (const [era, events] of Object.entries(byEra)) {
    if (events.length < 4) continue;
    const slug = era;
    const id = `tl.${slug}`;
    const title = `Ordering: ${ERA_TITLES[era] ?? era}`;
    topics.push({
      id, slug, course: "tl", unit: "eras", ladder: LADDER.key,
      title, short: `Which came first? ${events.length} events from ${ERA_TITLES[era] ?? era}.`,
      prereqs: [], xp: 2, url: `/library/timeline/${slug}/`,
    });
    write(`library/topics/tl/${slug}.json`, {
      id, slug, ladder: LADDER.key, course: "tl", unit: "eras",
      title, short: topics[topics.length - 1].short,
      courseTitle: "Timeline ordering", unitTitle: "What came first?",
      trouble: "Judging 'which came first' by how famous something is.",
      viz: [], figureArchetype: "none",
      lesson: {
        blocks: [
          { t: "p", html: `Ordering is the skill behind every timeline: not dates by heart, but <b>before and after</b>. This drill pairs events from ${esc(ERA_TITLES[era] ?? era)} and asks which came first.` },
          { t: "key", html: "<b>Tip:</b> anchor on one event you are sure of, then place the other against it." },
          { t: "note", html: 'You can browse every event in the <a href="?data=timeline">Timeline dataset</a>.' },
        ],
        sources: [{ name: "The Teddy Rook corpus — timeline" }],
      },
      practice: null,
    });
  }

  // ---- courses, catalog, graph --------------------------------------------
  for (const c of COURSES) {
    const ct = topics.filter((t) => t.course === c.key);
    write(`library/courses/${c.key}.json`, {
      key: c.key, ladder: LADDER.key, title: c.title, short: c.short, after: [],
      units: [c.unit], topics: ct.map((t) => ({ id: t.id, slug: t.slug, unit: c.unit.key, title: t.title, short: t.short, prereqs: [], viz: [] })),
    });
    graph.courses.push({ key: c.key, slug: c.slug ?? c.key, title: c.title, short: c.short, after: [], ladder: LADDER.key });
  }
  graph.topics = graph.topics.filter((t) => t.ladder !== LADDER.key);
  graph.topics.push(...topics);
  graph.partial = true;
  write("graph.json", graph);

  catalog.ladders = catalog.ladders.filter((l) => l.key !== LADDER.key);
  catalog.ladders.push({
    ...LADDER, courses: COURSES.length, topics: topics.length,
    courseKeys: COURSES.map((c) => c.key), viz: "",
  });
  write("catalog.json", catalog);

  console.log(`library ladder: ${topics.length} lessons (mem ${topics.filter((t) => t.course === "mem").length}, el ${facets.length}, tl ${topics.filter((t) => t.course === "tl").length})`);
}

main();
