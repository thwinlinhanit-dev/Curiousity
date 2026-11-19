// Build the `music` ladder from the playable scores (content/music/index.json
// — the 20 songs with real sheet JSON), plus its practice generators.
// Spec: docs/superpowers/specs/2026-11-19-library-integration-design.md (Phase 3).
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
  fs.writeFileSync(full, typeof obj === "string" ? obj : JSON.stringify(obj));
};

const LEVELS = [
  { level: "beginner", course: "beginner", title: "Beginner pieces", short: "Beginner" },
  { level: "intermediate", course: "intermediate", title: "Intermediate pieces", short: "Intermediate" },
  { level: "advanced", course: "advanced", title: "Advanced pieces", short: "Advanced" },
];

const CHORD_NOTES = {
  C: "C E G", G: "G B D", D: "D F# A", A: "A C# E", E: "E G# B", F: "F A C",
  Bb: "Bb D F", "B♭": "Bb D F", Eb: "Eb G Bb", Am: "A C E", Em: "E G B", Dm: "D F A",
  G7: "G B D F", C7: "C E G Bb", F7: "F A C Eb", B7: "B D# F# A", E7: "E G# B D",
  Am7: "A C E G", Em7: "E G B D", Fmaj7: "F A C E", Dm7: "D F A C", Gmaj7: "G B D F#",
};

function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function main() {
  const graph = read("graph.json");
  const catalog = read("catalog.json");
  // idempotent: drop the previous music pass before rebuilding
  graph.courses = graph.courses.filter((c) => c.ladder !== "music");
  graph.topics = graph.topics.filter((t) => t.ladder !== "music");
  const index = read("music/index.json");
  const dataset = read("data/music.json");
  const dsBySlug = Object.fromEntries((dataset.items ?? []).map((x) => [x.meta.slug, x]));

  const taken = new Set(graph.courses.map((c) => c.key));
  for (const l of LEVELS) if (taken.has(l.course)) { console.error(`course key ${l.course} already used by another ladder`); process.exit(1); }

  const order = ["beginner", "intermediate", "advanced"];

  // --- skills → introducer (first song at or before each song's level) ------
  const skillsOf = (slug) => {
    const it = dsBySlug[slug];
    const s = it?.meta?.skills;
    return Array.isArray(s) ? s.map(String) : [];
  };
  const sorted = index.slice().sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level) || String(a.slug).localeCompare(String(b.slug)));
  const introducer = {};
  for (const song of sorted) for (const sk of skillsOf(song.slug)) if (!introducer[sk]) introducer[sk] = song.slug;
  write("music/skill-order.json", introducer);

  // --- topics ---------------------------------------------------------------
  const topics = [];
  for (const song of index) {
    const ds = dsBySlug[song.slug];
    const m = ds?.meta ?? {};
    const id = `mus.${song.slug}`;
    const prereqs = [...new Set(skillsOf(song.slug).map((sk) => introducer[sk]).filter((s) => s && s !== song.slug))].map((slug) => `mus.${slug}`);
    const course = LEVELS.find((l) => l.level === song.level)?.course ?? "beginner";
    const bars = String(m.chords ?? "").split("|").map((x) => x.trim()).filter(Boolean);
    topics.push({
      id, slug: song.slug, course, unit: song.level, ladder: "music",
      title: song.title, short: `${song.composer.slice(0, 40)} · ${song.key} ${song.time} · listen, then play it.`,
      prereqs, xp: 2, url: `/music/${course}/${song.slug}/`,
    });
    const blocks = [
      { t: "p", html: esc(song.about || m.about || "") },
      { t: "key", html: `<b>What to notice:</b> ${esc(m.work || `This piece is in ${song.key}, in ${song.time}, at about ♩ = ${song.tempo}.`)}` },
      { t: "viz", name: "music-player", opts: { slug: song.slug }, cap: "Play it: the score scrolls, the keys light up, and “wait for me” lets you practise one hand at a time." },
    ];
    if (bars.length) blocks.push({ t: "table", head: ["Bar", "Chords"], rows: bars.slice(0, 16).map((b, i) => [String(i + 1), esc(b)]) });
    const sk = skillsOf(song.slug);
    if (sk.length) blocks.push({ t: "list", items: sk });
    blocks.push({ t: "try", html: `Play through it once with the right hand only, then add the left. Which chord change made you stop?` });
    write(`music/topics/${course}/${song.slug}.json`, {
      id, slug: song.slug, ladder: "music", course, unit: song.level,
      title: song.title, short: topics[topics.length - 1].short,
      courseTitle: LEVELS.find((l) => l.course === course)?.title ?? course,
      unitTitle: song.level, trouble: "Reading notes one at a time instead of in chunks.",
      viz: ["music-player"], figureArchetype: "music",
      lesson: { blocks, sources: [{ name: song.source || "Teddy Rook corpus — music" }] },
      practice: null,
    });
  }

  // --- courses, catalog, graph ----------------------------------------------
  for (const l of LEVELS) {
    const ct = topics.filter((t) => t.course === l.course);
    if (!ct.length) continue;
    write(`music/courses/${l.course}.json`, {
      key: l.course, ladder: "music", title: l.title, short: l.short, after: [],
      units: [{ key: l.level, title: l.title }],
      topics: ct.map((t) => ({ id: t.id, slug: t.slug, unit: l.level, title: t.title, short: t.short, prereqs: t.prereqs, viz: ["music-player"] })),
    });
    graph.courses.push({ key: l.course, slug: l.course, title: l.title, short: l.short, after: [], ladder: "music" });
  }
  graph.topics = graph.topics.filter((t) => t.ladder !== "music");
  graph.topics.push(...topics);
  write("graph.json", graph);

  catalog.ladders = catalog.ladders.filter((l) => l.key !== "music");
  catalog.ladders.push({
    key: "music", slug: "music", title: "Music Ladder", short: "Music", order: 22, color: "#2e6fb7", viz: "",
    courses: LEVELS.filter((l) => topics.some((t) => t.course === l.course)).length,
    topics: topics.length,
    courseKeys: LEVELS.filter((l) => topics.some((t) => t.course === l.course)).map((l) => l.course),
  });
  write("catalog.json", catalog);

  // --- generators -------------------------------------------------------------
  const genData = topics.map((t) => {
    const song = index.find((s) => s.slug === t.slug);
    const m = dsBySlug[t.slug]?.meta ?? {};
    return {
      slug: t.slug, title: t.title, key: String(song.key), time: String(song.time),
      tempo: Number(song.tempo), chords: String(m.chords ?? ""),
      chordNotes: Object.fromEntries(Object.entries(CHORD_NOTES).filter(([k]) => new RegExp(`\\b${k.replace(/[♯♭+]/g, (c) => c === "♭" ? "b" : "\\\\$&")}\\b`).test(String(m.chords ?? "")))),
    };
  });

  const DST = path.join(ROOT, "public/vendor/gen/music");
  fs.mkdirSync(DST, { recursive: true });
  fs.writeFileSync(path.join(DST, "music.js"), `(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var SONGS = ${JSON.stringify(genData.map((s) => ({ slug: s.slug, title: s.title, key: s.key, time: s.time, tempo: s.tempo, chords: s.chords })))};
  var NOTES = ${JSON.stringify(CHORD_NOTES)};
  function barsOf(s) {
    var out = [];
    String(s.chords || '').split('|').forEach(function (part) {
      part.trim().split(/\\s+/).forEach(function (tok) { if (tok) out.push(tok.replace(/:\\d+$/, '')); });
    });
    return out;
  }
  function mc(R, right, pool) {
    var vals = [], seen = {};
    pool.forEach(function (v) { if (v && v !== right && !seen[v]) { seen[v] = 1; vals.push(v); } });
    if (vals.length < 2) return null;
    return { t: 'mc', choices: [right].concat(R.shuffle(vals).slice(0, 3)), v: 0 };
  }
  SONGS.forEach(function (song) {
    function attempt(kind, R, ctx) {
      var others = SONGS.filter(function (s) { return s.slug !== song.slug; });
      if (kind === 'key') {
        var ka = mc(R, song.key, others.map(function (s) { return s.key; }));
        if (!ka) return null;
        return { q: 'What <b>key</b> is <b>' + song.title + '</b> in?', a: ka,
          steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
      }
      if (kind === 'time') {
        return { q: 'What <b>time signature</b> does <b>' + song.title + '</b> use?',
          a: mc(R, song.time, others.map(function (s) { return s.time; })),
          steps: ['<b>' + song.title + '</b> is in ' + song.time + '.'] };
      }
      if (kind === 'tempo') {
        var pool = others.map(function (s) { return String(s.tempo); });
        return { q: 'Suggested <b>tempo</b> for <b>' + song.title + '</b>? (♩ = …)',
          a: mc(R, String(song.tempo), pool),
          steps: ['Try ♩ = ' + song.tempo + ' to start.'] };
      }
      if (kind === 'nextchord') {
        var i = R.int(0, bars.length - 2);
        var here = bars[i], next = bars[i + 1];
        if (!here || !next || here === next) return null;
        return { q: 'In <b>' + song.title + '</b>\\'s chords, what follows <b>' + here + '</b>?',
          a: mc(R, next, bars),
          steps: ['The progression there is: ' + bars.slice(Math.max(0, i - 2), i + 3).join(' → ') + '.'] };
      }
      var chord = R.pick(bars.filter(function (c) { return NOTES[c]; }));
      if (!chord) return null;
      var right = NOTES[chord];
      var notePool = Object.keys(NOTES).map(function (k) { return NOTES[k]; });
      var na = mc(R, right, notePool);
      if (!na) return null;
      return { q: 'Which notes spell the <b>' + chord + '</b> chord?', a: na,
        steps: [chord + ' = ' + right + '.'] };
      return null;
    }
    ML.gen('mus.' + song.slug, function (R, ctx) {
      var bars = barsOf(song);
      var kinds = ['key', 'time', 'tempo'];
      if (bars.length >= 4) kinds.push('nextchord', 'chordnotes');
      var order = R.shuffle(kinds);
      for (var i = 0; i < order.length; i++) {
        var p = attempt(order[i], R, ctx);
        if (p) return p;
      }
      // always-answerable fallback: true/false about the key
      var others = SONGS.filter(function (s) { return s.slug !== song.slug && s.key !== song.key; });
      var lie = others.length ? R.pick(others).key : 'D minor';
      var claim = R.pick([song.key, lie]);
      return { q: '<b>True or false?</b> <b>' + song.title + '</b> is in ' + claim + '.',
        a: { t: 'tf', v: claim === song.key },
        steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
    });
  });
})(window.MathLadder);
`);

  const manifestPath = path.join(ROOT, "public/vendor/gen-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.music = ["music.js"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`music ladder: ${topics.length} songs (${LEVELS.map((l) => `${l.course} ${topics.filter((t) => t.course === l.course).length}`).join(", ")}), ${Object.keys(introducer).length} skills mapped`);
}

main();
