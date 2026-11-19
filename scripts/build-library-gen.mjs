// Emit the practice generators for the `library` ladder into
// public/vendor/gen/library/{memory,elements,timeline}.js and register them in
// public/vendor/gen-manifest.json. The data is baked in at build time, so the
// runtime never needs content/data/*.json for practice.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const C = path.join(ROOT, "content");
const DST = path.join(ROOT, "public/vendor/gen/library");
const read = (p) => JSON.parse(fs.readFileSync(path.join(C, p), "utf8"));

const FIELD_LABEL = {
  n: "number", book: "book", name: "name", con: "constellation", mag: "magnitude",
  find: "clue", season: "season", testament: "testament", section: "section",
  amendment: "amendment", article: "article", planet: "planet", star: "star",
  ocean: "ocean", continent: "continent", capital: "capital", country: "country",
};
const labelOf = (f) => FIELD_LABEL[f] ?? String(f).replace(/_/g, " ");

function main() {
  fs.mkdirSync(DST, { recursive: true });

  // ---------------------------------------------------------------- memory
  const mem = read("data/memory.json");
  const lists = {};
  for (const it of mem.items ?? []) {
    const slug = String(it.meta?.slug ?? "");
    const prompts = (it.meta?.prompts ?? []).filter((p) => p && p.ask && Array.isArray(p.from) && p.from.length);
    const fields = it.meta?.fields ?? [];
    const rows = (it.items ?? []).map((r) => {
      const m = r.meta ?? {};
      const out = {};
      for (const f of new Set([...fields, ...prompts.flatMap((p) => [p.ask, ...p.from])])) {
        if (m[f] !== undefined && m[f] !== null) out[f] = String(m[f]);
      }
      return out;
    }).filter((r) => Object.keys(r).length > 1);
    if (!slug || !prompts.length || rows.length < 4) continue;
    const usable = prompts
      .map((p) => ({ ask: p.ask, from: p.from[0] }))
      .filter((p) => {
        const good = rows.filter((r) => r[p.ask] && r[p.ask].length <= 90 && r[p.from]);
        const distinct = new Set(good.map((r) => r[p.ask]));
        return good.length >= 4 && distinct.size >= 3;
      });
    if (!usable.length) continue;
    lists[slug] = { title: it.title, rows, prompts: usable };
  }

  fs.writeFileSync(path.join(DST, "memory.js"), `(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var LISTS = ${JSON.stringify(lists)};
  var LABEL = ${JSON.stringify(FIELD_LABEL)};
  function label(f) { return LABEL[f] || String(f).replace(/_/g, ' '); }
  Object.keys(LISTS).forEach(function (slug) {
    var L = LISTS[slug];
    ML.gen('mem.' + slug, function (R, ctx) {
      var pr = R.pick(L.prompts);
      var ok = L.rows.filter(function (r) { var v = r[pr.ask]; return v && v.length <= 90 && r[pr.from]; });
      var row = R.pick(ok);
      var right = row[pr.ask];
      var vals = [], seen = { };
      for (var i = 0; i < L.rows.length; i++) {
        var v = L.rows[i][pr.ask];
        if (v && v !== right && !seen[v]) { seen[v] = 1; vals.push(v); }
      }
      var want = (ctx.level || 1) === 1 ? 2 : 3;
      if (vals.length < want) return null;
      var wrongs = R.shuffle(vals).slice(0, want);
      var fromVal = String(row[pr.from] || '');
      if (fromVal.length > 90) fromVal = fromVal.slice(0, 88).replace(/\s+\S*$/, '') + '…';
      var fromTxt = pr.from === 'n' ? label(pr.from) + ' ' + fromVal : label(pr.from) + ': ' + fromVal;
      return {
        q: 'In <b>' + L.title + '</b>: which ' + label(pr.ask) + ' matches ' + fromTxt + '?',
        a: { t: 'mc', choices: [right].concat(wrongs), v: 0 },
        steps: ['The ' + label(pr.ask) + ' is: ' + right + '.']
      };
    });
  });
})(window.MathLadder);
`);

  // -------------------------------------------------------------- elements
  const els = (read("data/elements.json").items ?? []).map((x) => {
    const m = x.meta ?? {};
    return {
      z: String(m.z ?? ""), symbol: String(m.symbol ?? ""), name: String(m.name ?? ""),
      category: String(m.category ?? ""), block: String(m.block ?? ""), state: String(m.state ?? ""),
      weight: String(m.weight?.text ?? m.weight?.value ?? ""), config: String(typeof m.config === "string" ? m.config : (m.config?.full ?? m.config?.short ?? "")),
    };
  }).filter((e) => e.z && e.name && e.symbol);

  const facets = [
    { slug: "symbol-from-name", field: "symbol", clue: "name", ask: "symbol", wrongField: "symbol",
      q: (e) => 'What is the chemical <b>symbol</b> of <b>' + e.name + '</b>?' },
    { slug: "name-from-symbol", field: "name", clue: "symbol", ask: "name", wrongField: "name",
      q: (e) => 'Which element has the symbol <b>' + e.symbol + '</b>?' },
    { slug: "atomic-number", field: "z", clue: "name", ask: "atomic number", wrongField: "z",
      q: (e) => 'What is the <b>atomic number</b> of <b>' + e.name + '</b> (' + e.symbol + ')?' },
    { slug: "atomic-mass", field: "weight", clue: "name", ask: "atomic mass", wrongField: "weight",
      q: (e) => 'Which is the <b>atomic mass</b> of <b>' + e.name + '</b>?' },
    { slug: "category", field: "category", clue: "name", ask: "category", wrongField: "category",
      q: (e) => 'Which <b>category</b> does <b>' + e.name + '</b> belong to?' },
    { slug: "block", field: "block", clue: "name", ask: "block", wrongField: "block",
      q: (e) => 'In which <b>block</b> of the periodic table does <b>' + e.name + '</b> sit?' },
    { slug: "state", field: "state", clue: "name", ask: "state at room temperature", wrongField: "state",
      q: (e) => 'What is <b>' + e.name + '</b> at room temperature?' },
    { slug: "electron-config", field: "config", clue: "name", ask: "electron configuration", wrongField: "config",
      q: (e) => 'Which is the <b>electron configuration</b> of <b>' + e.name + '</b>?' },
  ];

  fs.writeFileSync(path.join(DST, "elements.js"), `(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var ELS = ${JSON.stringify(els)};
  var FACETS = ${JSON.stringify(facets.map((f) => ({ slug: f.slug, field: f.field, clue: f.clue })))};
  FACETS.forEach(function (f) {
    ML.gen('el.' + f.slug, function (R, ctx) {
      var e = R.pick(ELS);
      var right = e[f.field];
      if (!right) return null;
      var vals = [], seen = {};
      for (var i = 0; i < ELS.length; i++) {
        var v = ELS[i][f.field];
        if (v && v !== right && !seen[v]) { seen[v] = 1; vals.push(v); }
      }
      var want = (ctx.level || 1) === 1 ? 2 : 3;
      if (!vals.length) return null;
      var wrongs = R.shuffle(vals).slice(0, want);
      var qtxt;
      switch (f.slug) {
        case 'symbol-from-name': qtxt = 'What is the chemical <b>symbol</b> of <b>' + e.name + '</b>?'; break;
        case 'name-from-symbol': qtxt = 'Which element has the symbol <b>' + e.symbol + '</b>?'; break;
        case 'atomic-number': qtxt = 'What is the <b>atomic number</b> of <b>' + e.name + '</b> (' + e.symbol + ')?'; break;
        case 'atomic-mass': qtxt = 'Which is the <b>atomic mass</b> of <b>' + e.name + '</b>?'; break;
        case 'category': qtxt = 'Which <b>category</b> does <b>' + e.name + '</b> belong to?'; break;
        case 'block': qtxt = 'In which <b>block</b> of the periodic table does <b>' + e.name + '</b> sit?'; break;
        case 'state': qtxt = 'What is <b>' + e.name + '</b> at room temperature?'; break;
        default: qtxt = 'Which is the <b>electron configuration</b> of <b>' + e.name + '</b>?';
      }
      return {
        q: qtxt,
        a: { t: 'mc', choices: [right].concat(wrongs), v: 0 },
        steps: ['<b>' + e.name + '</b> (' + e.symbol + '): ' + right + '.']
      };
    });
  });
})(window.MathLadder);
`);

  // --------------------------------------------------------------- timeline
  const tl = read("data/timeline.json");
  const byEra = {};
  for (const it of tl.items ?? []) {
    const m = it.meta ?? {};
    if (m.year == null) continue;
    (byEra[String(m.era ?? "after")] ??= []).push({ title: String(m.title ?? it.title ?? ""), year: Number(m.year), when: String(m.when ?? "") });
  }
  const eras = Object.fromEntries(Object.entries(byEra).filter(([, v]) => v.length >= 4));

  fs.writeFileSync(path.join(DST, "timeline.js"), `(function (ML) {
  'use strict';
  if (!ML || !ML.gen) return;
  var ERAS = ${JSON.stringify(eras)};
  var ERA_TITLES = ${JSON.stringify({
    first: "the first civilizations", archaic: "the archaic world", bronze: "the Bronze Age",
    classical: "the classical world", hellenistic: "the Hellenistic age", empire: "empires and faiths",
    late: "the late medieval world", after: "the modern era",
  })};
  Object.keys(ERA_TITLES).forEach(function (era) {
    var rows = ERAS[era]; if (!rows || rows.length < 4) return;
    ML.gen('tl.' + era, function (R, ctx) {
      var pair = R.sample(R.shuffle(rows.slice()), 2);
      if (!pair || pair.length < 2) return null;
      var a = pair[0], b = pair[1];
      if (a.year === b.year) return null;
      var latest = (ctx.level || 1) >= 3;
      var first = a.year < b.year ? a : b;
      var last = a.year < b.year ? b : a;
      var pick = latest ? last : first;
      var other = latest ? first : last;
      return {
        q: 'Which happened <b>' + (latest ? "latest" : "first") + '</b>, <b>' + a.title + '</b> or <b>' + b.title + '</b>?',
        a: { t: 'mc', choices: [a.title, b.title], v: pick === a ? 0 : 1 },
        steps: ['<b>' + pick.title + '</b> — ' + pick.when + ', before <b>' + other.title + '</b> (' + other.when + ').']
      };
    });
  });
})(window.MathLadder);
`);

  // ------------------------------------------------------------- manifest
  const manifestPath = path.join(ROOT, "public/vendor/gen-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.library = ["memory.js", "elements.js", "timeline.js"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const sizes = ["memory.js", "elements.js", "timeline.js"].map((f) => `${f} ${(fs.statSync(path.join(DST, f)).size / 1024).toFixed(0)} KB`);
  console.log(`library generators: ${Object.keys(lists).length} memory lists, ${facets.length} element facets, ${Object.keys(eras).length} eras — ${sizes.join(", ")}`);
}

main();
