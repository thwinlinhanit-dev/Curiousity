// Build the `music` ladder from the Teddy Rook music curriculum
// (trb/content/music — ingested by scripts/ingest-music-lessons.mjs) and the
// playable songs (scripts/ingest-music.mjs). Spec:
// docs/superpowers/specs/2026-11-19-library-integration-design.md (Phase 3),
// revised to mirror https://teddyrookbook.com/music/ .
//
// Courses: pb piano basics · rm reading music · gtr/uke/bjo instruments ·
// cfs suite · sng songs. Chapters render as interactive pages (data-ml
// widgets from the vendored lessons engine); songs embed the player.
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

const COURSES = {
  pb: { title: "Piano basics", short: "Piano basics" },
  rm: { title: "Reading music", short: "Reading" },
  gtr: { title: "Guitar", short: "Guitar" },
  uke: { title: "Ukulele", short: "Ukulele" },
  bjo: { title: "Banjo", short: "Banjo" },
  cfs: { title: "The Continued-Fraction Suite", short: "Suite" },
  sng: { title: "Songs", short: "Songs" },
};
const LEVEL_COURSES = ["beginner", "intermediate", "advanced"];

function main() {
  const graph = read("graph.json");
  const catalog = read("catalog.json");
  // idempotent: drop the previous music pass
  graph.courses = graph.courses.filter((c) => c.ladder !== "music");
  graph.topics = graph.topics.filter((t) => t.ladder !== "music");

  const lessonsManifest = read("music/lessons/manifest.json");
  const songIndex = read("music/index.json");
  const topics = [];
  const byCourse = {};
  fs.rmSync(path.join(C, "music/topics"), { recursive: true, force: true });

  // --- chapters -------------------------------------------------------------
  for (const meta of Object.entries(COURSES).filter(([k]) => k !== "sng")) {
    const [key, courseMeta] = meta;
    const doc = read(`music/lessons/${key}.json`);
    const rows = doc.topics.map((slug) => read(`music/lessons/${key}/${slug}.json`));
    rows.sort((a, b) => a.weight - b.weight);
    byCourse[key] = rows;
    rows.forEach((r, i) => {
      const id = `${key}.${r.slug}`;
      const prereqs = i > 0 ? [`${key}.${rows[i - 1].slug}`] : [];
      topics.push({
        id, slug: r.slug, course: key, unit: r.pill || courseMeta.title, ladder: "music",
        title: r.title, short: r.description || r.lead || courseMeta.title,
        prereqs, xp: 1, url: `/music/${key}/${r.slug}/`,
      });
      const blocks = [
        { t: "chapter", html: r.html, meta: { pill: r.pill, lead: r.lead, icon: r.icon } },
      ];
      write(`music/topics/${key}/${r.slug}.json`, {
        id, slug: r.slug, ladder: "music", course: key, unit: r.pill || "course",
        title: r.title, short: r.short, courseTitle: courseMeta.title, unitTitle: r.pill || courseMeta.title,
        trouble: "", viz: [], figureArchetype: "chapter",
        lesson: { blocks, sources: [{ name: "Teddy Rook Book — Music" }] },
        practice: null,
      });
    });
  }

  // --- songs ----------------------------------------------------------------
  const songBySlug = Object.fromEntries(songIndex.map((s) => [s.slug, s]));
  const levelTopics = { beginner: [], intermediate: [], advanced: [] };
  songIndex.forEach((song, i) => {
    const id = `sng.${song.slug}`;
    const level = LEVEL_COURSES.includes(song.level) ? song.level : "beginner";
    const prev = i > 0 ? `sng.${songIndex[i - 1].slug}` : null;
    const introCourse = { guitar: "gtr", ukulele: "uke", banjo: "bjo" }[song.instrument];
    const prereqs = [];
    if (introCourse && byCourse[introCourse]?.[0]) prereqs.push(`${introCourse}.${byCourse[introCourse][0].slug}`);
    else if (song.instrument === "piano" && byCourse.pb?.[0]) prereqs.push(`pb.${byCourse.pb[0].slug}`);
    topics.push({
      id, slug: song.slug, course: level, unit: "songs", ladder: "music",
      title: song.title, short: `${song.composer.slice(0, 40)} · ${song.key} ${song.time} · play it with every note lit.`,
      prereqs, xp: 2, url: `/music/${level}/${song.slug}/`,
    });
    levelTopics[level].push(song.slug);
    const dsSong = (() => { try { return read(`music/songs/${song.slug}.json`); } catch { return null; } })();
    const aboutFull = (dsSong?.about ?? song.about ?? "").replace(/</g, "&lt;");
    const blocks = [
      { t: "p", html: aboutFull },
      { t: "viz", name: "music-player", opts: { slug: song.slug }, cap: "Play it: the score scrolls, the keys or strings light up as each note sounds." },
    ];
    if (dsSong?.work) blocks.push({ t: "key", html: `<b>The piece:</b> ${String(dsSong.work).replace(/</g, "&lt;")}` });
    write(`music/topics/${level}/${song.slug}.json`, {
      id, slug: song.slug, ladder: "music", course: level, unit: "songs",
      title: song.title, short: topics[topics.length - 1].short,
      courseTitle: COURSES[level]?.title ?? level, unitTitle: "Songs",
      trouble: "", viz: ["music-player"], figureArchetype: "music",
      lesson: { blocks, sources: [{ name: song.source || "Teddy Rook Book — Music" }] },
      practice: null,
    });
  });

  // --- courses --------------------------------------------------------------
  const courseKeys = [...Object.keys(COURSES).filter((k) => k !== "sng"), ...LEVEL_COURSES];
  for (const key of courseKeys) {
    const ct = topics.filter((t) => t.course === key);
    const meta = COURSES[key] ?? { title: `${key} songs`, short: key[0].toUpperCase() + key.slice(1) };
    write(`music/courses/${key}.json`, {
      key, ladder: "music", title: meta.title, short: meta.short, after: [],
      units: [{ key, title: meta.title }],
      topics: ct.map((t) => ({ id: t.id, slug: t.slug, unit: t.unit, title: t.title, short: t.short, prereqs: t.prereqs, viz: t.viz ?? [] })),
    });
    graph.courses.push({ key, slug: key, title: meta.title, short: meta.short, after: [], ladder: "music" });
  }
  graph.topics.push(...topics);
  write("graph.json", graph);

  catalog.ladders = catalog.ladders.filter((l) => l.key !== "music");
  catalog.ladders.push({
    key: "music", slug: "music", title: "Music Ladder", short: "Music", order: 22, color: "#2e6fb7", viz: "", icon: "🎹",
    courses: courseKeys.length, topics: topics.length, courseKeys,
  });
  write("catalog.json", catalog);

  // --- generators -----------------------------------------------------------
  buildGenerators(topics, songIndex, lessonsManifest);

  console.log(`music ladder: ${topics.length} lessons (${Object.keys(COURSES).filter((k) => k !== "sng").map((k) => `${k} ${byCourse[k].length}`).join(" ")} · songs ${songIndex.length} in ${LEVEL_COURSES.map((l) => `${l} ${levelTopics[l].length}`).join(" ")})`);
}

function buildGenerators(topics, songIndex, lessonsManifest) {
  // chapter banks from the Remember bullets
  const banks = [];
  for (const row of lessonsManifest) {
    const r = read(`music/lessons/${row.course}/${row.slug}.json`);
    if (r.remember?.length) banks.push({ id: `${r.course}.${r.slug}`, title: r.title, remember: r.remember });
  }
  // song facts
  const songs = songIndex.map((s) => ({
    slug: s.slug, title: s.title, key: String(s.key), time: String(s.time), tempo: Number(s.tempo),
    chords: (() => { try { return String(read(`music/songs/${s.slug}.json`).chords ?? ""); } catch { return ""; } })(),
  }));

  const CHORD_NOTES = {
    C: "C E G", G: "G B D", D: "D F# A", A: "A C# E", E: "E G# B", F: "F A C",
    Bb: "Bb D F", Eb: "Eb G Bb", Am: "A C E", Em: "E G B", Dm: "D F A",
    G7: "G B D F", C7: "C E G Bb", F7: "F A C Eb", B7: "B D# F# A", E7: "E G# B D",
    Am7: "A C E G", Em7: "E G B D", Fmaj7: "F A C E", Dm7: "D F A C", Gmaj7: "G B D F#",
  };

  const DST = path.join(ROOT, "public/vendor/gen/music");
  fs.mkdirSync(DST, { recursive: true });
  fs.writeFileSync(path.join(DST, "music.js"), `(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var BANKS = ${JSON.stringify(banks)};
  var SONGS = ${JSON.stringify(songs)};
  var NOTES = ${JSON.stringify(CHORD_NOTES)};
  var BY_ID = {}; BANKS.forEach(function (b) { BY_ID[b.id] = b; });

  function mc(R, right, pool) {
    var vals = [], seen = {};
    pool.forEach(function (v) { if (v && v !== right && !seen[v]) { seen[v] = 1; vals.push(v); } });
    if (vals.length < 2) return null;
    return { t: 'mc', choices: [right].concat(R.shuffle(vals).slice(0, 3)), v: 0 };
  }

  // Chapter drills: the page's own Remember list, plus true/false against a
  // statement from a different chapter.
  function chapterGen(id) {
    return function (R, ctx) {
      var bank = BY_ID[id];
      if (!bank) return null;
      if ((ctx.level || 1) === 3 || R.pick([0, 1]) === 1) {
        var others = BANKS.filter(function (b) { return b.id !== id; });
        var lie = R.pick(R.pick(others).remember);
        var truth = R.pick(bank.remember);
        var claim = R.pick([truth, lie]);
        return { q: '<b>True or false?</b> ' + claim,
          a: { t: 'tf', v: claim === truth },
          steps: [claim === truth ? 'True — this is one of the things the chapter asks you to keep.'
                                   : 'False — that belongs to another chapter. Here the point is: ' + truth] };
      }
      var right = R.pick(bank.remember);
      var distract = R.pick(R.pick(BANKS.filter(function (b) { return b.id !== id; })).remember);
      var pool = [right, distract].concat(BANKS.slice(0, 30).map(function (b) { return b.remember[0]; }));
      var m = mc(R, right, pool.filter(function (x) { return x && x.length < 220; }));
      if (!m) return { q: '<b>True or false?</b> ' + right, a: { t: 'tf', v: true }, steps: ['True — from the chapter’s own Remember list.'] };
      return { q: 'Which statement does <b>' + bank.title + '</b> ask you to remember?', a: m,
        steps: ['It says: ' + right + '.'] };
    };
  }

  function barsOf(song) {
    var out = [];
    String(song.chords || '').split('|').forEach(function (part) {
      part.trim().split(/\\s+/).forEach(function (tok) { if (tok) out.push(tok.replace(/:\\d+$/, '')); });
    });
    return out;
  }
  function songGen(song) {
    function attempt(kind, R, ctx) {
      var others = SONGS.filter(function (s) { return s.slug !== song.slug; });
      if (kind === 'key') {
        var ka = mc(R, song.key, others.map(function (s) { return s.key; }));
        if (!ka) return null;
        return { q: 'What <b>key</b> is <b>' + song.title + '</b> in?', a: ka, steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
      }
      if (kind === 'time') {
        var ta = mc(R, song.time, others.map(function (s) { return s.time; }));
        if (!ta) return null;
        return { q: 'What <b>time signature</b> does <b>' + song.title + '</b> use?', a: ta, steps: ['<b>' + song.title + '</b> is in ' + song.time + '.'] };
      }
      if (kind === 'tempo') {
        var pa = mc(R, String(song.tempo), others.map(function (s) { return String(s.tempo); }));
        if (!pa) return null;
        return { q: 'Suggested <b>tempo</b> for <b>' + song.title + '</b>? (♩ = …)', a: pa, steps: ['Try ♩ = ' + song.tempo + ' to start.'] };
      }
      var bars = barsOf(song);
      if (kind === 'nextchord' && bars.length >= 4) {
        var i = R.int(0, bars.length - 2);
        var here = bars[i], next = bars[i + 1];
        if (!here || !next || here === next) return null;
        return { q: 'In <b>' + song.title + '</b>\\'s chords, what follows <b>' + here + '</b>?',
          a: mc(R, next, bars), steps: ['The progression there is: ' + bars.slice(Math.max(0, i - 2), i + 3).join(' → ') + '.'] };
      }
      if (kind === 'chordnotes' && bars.length >= 4) {
        var chord = R.pick(bars.filter(function (c) { return NOTES[c]; }));
        if (!chord) return null;
        var na = mc(R, NOTES[chord], Object.keys(NOTES).map(function (k) { return NOTES[k]; }));
        if (!na) return null;
        return { q: 'Which notes spell the <b>' + chord + '</b> chord?', a: na, steps: [chord + ' = ' + NOTES[chord] + '.'] };
      }
      return null;
    }
    return function (R, ctx) {
      var bars = barsOf(song);
      var kinds = ['key', 'time', 'tempo'];
      if (bars.length >= 4) kinds.push('nextchord', 'chordnotes');
      var order = R.shuffle(kinds);
      for (var i = 0; i < order.length; i++) { var p = attempt(order[i], R, ctx); if (p) return p; }
      var others2 = SONGS.filter(function (s) { return s.slug !== song.slug && s.key !== song.key; });
      var lie = others2.length ? R.pick(others2).key : 'D minor';
      var claim = R.pick([song.key, lie]);
      return { q: '<b>True or false?</b> <b>' + song.title + '</b> is in ' + claim + '.',
        a: { t: 'tf', v: claim === song.key }, steps: ['<b>' + song.title + '</b> is in ' + song.key + '.'] };
    };
  }

  BANKS.forEach(function (b) { ML.gen(b.id, chapterGen(b.id)); });
  SONGS.forEach(function (s) { ML.gen('sng.' + s.slug, songGen(s)); });
})(window.MathLadder);
`);

  const manifestPath = path.join(ROOT, "public/vendor/gen-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.music = ["music.js"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`music generators: ${banks.length} chapter banks + ${songs.length} song kinds`);
}

main();
