// Tier B datasets -> normalised browsers. Run after ingest-corpus.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const OUT = path.resolve(ROOT, "content/data");
fs.mkdirSync(OUT, { recursive: true });
const read = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));
const readYaml = (p) => YAML.parse(read(p));
const exists = (p) => fs.existsSync(p);
const put = (key, data) => {
  fs.writeFileSync(path.join(OUT, `${key}.json`), JSON.stringify(data, null, 2));
  console.log(`  ${key.padEnd(14)} ${data.items.length} items`);
};

const license = "CC BY-NC 4.0 — Teddy Rook; credit + link back required";

// Periodic table
{
  const d = readJson(path.join(REPO, "data/elements/elements.json"));
  put("elements", {
    title: "Periodic table", subtitle: "118 elements", description: "Explore the elements with atomic number, mass, category and electron configuration.",
    source: "data/elements/elements.json", license,
    items: d.elements.map((e) => ({ title: `${e.symbol} · ${e.name}`, subtitle: `Z = ${e.z} · ${e.category || ""}`, body: `Mass ${e.weight ?? "—"} · configuration ${e.config ?? "—"}`, meta: e })),
  });
}

// Memory lists
{
  const dir = path.join(REPO, "data/memory/lists");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  const items = [];
  for (const f of files) {
    const l = readYaml(path.join(dir, f));
    const fields = (l.fields ?? []).map((x) => x.key);
    const main = l.main || fields[0];
    items.push({
      title: l.title || f, subtitle: `${(l.items ?? []).length} items · ${l.group || "memory"}`,
      body: l.intro || "", meta: { slug: l.slug, technique: l.technique, fields, show: l.show, prompts: l.prompts },
      items: (l.items ?? []).map((it) => ({ title: String(it[main] ?? ""), subtitle: fields.filter((k) => k !== main).map((k) => `${k}: ${it[k]}`).join(" · ").slice(0, 120), meta: it })),
    });
  }
  put("memory", { title: "Memory lists", subtitle: `${items.length} lists`, description: "Flashcard lists with sources and memorisation techniques.", source: "data/memory/lists/*.yaml", license, items });
}

// Meal prep
{
  const files = fs.readdirSync(path.join(REPO, "data/meals/recipes")).filter((f) => f.endsWith(".json"));
  const items = [];
  for (const f of files) {
    const d = readJson(path.join(REPO, "data/meals/recipes", f));
    for (const r of d.recipes ?? []) items.push({ title: r.name, subtitle: `${r.meal || "recipe"} · ${r.serving_size || ""}`, body: r.summary || "",
      meta: { id: r.id, tags: r.tags, times: r.times, ingredients: r.ingredients, steps: r.steps ?? [], equipment: r.equipment ?? [], safety: r.safety ?? [], allergens: r.allergens ?? [], diet: r.diet ?? [], swaps: r.swaps ?? [], guides: r.guides ?? [], servings: r.serving_size ?? "" } });
  }
  const main = readJson(path.join(REPO, "data/meals/recipes.json"));
  for (const r of main.recipes ?? []) items.push({ title: r.name, subtitle: `${r.meal || "recipe"}`, body: r.summary || "", meta: r });
  put("recipes", { title: "Meal prep", subtitle: `${items.length} recipes`, description: "Recipes, scaling and kitchen guides.", source: "data/meals/recipes*.json", license, items });
}

// Music
{
  const dir = path.join(REPO, "data/music/songs");
  const items = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")).map((f) => {
    const s = readYaml(path.join(dir, f));
    return { title: s.title || s.slug, subtitle: `${s.composer || "traditional"} · ${s.key || ""} ${s.time || ""}`, body: `Level ${s.level ?? "—"} · skills: ${(s.skills ?? []).join(", ")}`, meta: s };
  });
  put("music", { title: "Music library", subtitle: `${items.length} songs`, description: "Public-domain songs in notation and tab, with key, time and difficulty.", source: "data/music/songs/*.yaml", license, items });
}

// Trades
{
  const items = [];
  for (const f of ["cars", "construction", "electrical", "hvac", "plumbing"]) {
    const p = path.join(REPO, "data/trades", `${f}.json`);
    if (!exists(p)) continue;
    const d = readJson(p);
    for (const l of d.lessons ?? []) items.push({ title: l.title || l.name || l.slug, subtitle: `${d.course?.title || f} · ${l.time || ""}`, body: (l.intro || l.summary || "").slice(0, 400), meta: { course: f, systems: d.systems, sources: d.sources } });
  }
  put("trades", { title: "The trades", subtitle: `${items.length} lessons`, description: "How things work and how to fix them, with system maps and safety notes.", source: "data/trades/*.json", license, items });
}

// Debate
{
  const dir = path.join(REPO, "data/debate");
  const items = [];
  for (const f of fs.readdirSync(path.join(dir, "topics")).filter((x) => x.endsWith(".json"))) {
    const t = readJson(path.join(dir, "topics", f));
    items.push({ title: t.title || t.resolution, subtitle: `${t.kind || "resolution"} · ${t.level || "all"}`, body: (t.summary || t.background || "").slice(0, 500), meta: t });
  }
  const glossary = exists(path.join(dir, "glossary.json")) ? readJson(path.join(dir, "glossary.json")) : { terms: [] };
  for (const g of glossary.terms ?? []) items.push({ title: g.term || g.name, subtitle: "glossary", body: g.definition || g.text || "", meta: g });
  put("debate", { title: "Debate", subtitle: `${items.length} items`, description: "Resolutions, formats, chapters and a glossary of debate terms.", source: "data/debate/", license, items });
}

// Great books
{
  const r = readYaml(path.join(REPO, "data/greatbooks/rungs.yaml"));
  const items = (r.rungs ?? []).map((x) => ({ title: x.title, subtitle: `${x.author || ""} · ${x.work || ""}`, body: (x.short || "").slice(0, 400), meta: x }));
  put("greatbooks", { title: "Great Books", subtitle: `${items.length} rungs`, description: "The 60-volume Great Books of the Western World as a reading ladder.", source: "data/greatbooks/rungs.yaml", license, items });
}

// Federalist / Anti-Federalist
{
  const items = [];
  for (const [folder, prefix] of [["fed", "Federalist"], ["af", "Anti-Federalist"]]) {
    const dir = path.join(REPO, "data/papers", folder);
    if (!exists(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const p = readJson(path.join(dir, f));
      const paragraphs = Array.isArray(p.p) ? p.p : [];
      items.push({ title: p.title || p.name || `No. ${p.n ?? f}`, subtitle: prefix,
        body: paragraphs.join("\n\n") || String(p.text || p.body || ""), meta: { n: p.n, sal: p.sal, sig: p.sig, notes: p.notes, words: p.words, paragraphs } });
    }
  }
  put("papers", { title: "Founding papers", subtitle: `${items.length} papers`, description: "The Federalist, Anti-Federalist writings and the ratification debate.", source: "data/papers/", license, items });
}

// Harvard Classics (metadata only — respect quotation limits)
{
  const g = readJson(path.join(REPO, "data/harvard/guide.json"));
  const items = (g.days ?? []).map((d) => ({ title: d.title || d.slug || String(d.day), subtitle: `Day ${d.day ?? ""} · ${d.minutes || ""} min`, body: (d.readings ?? []).join(" · ").slice(0, 240), meta: d }));
  put("harvard", { title: "Harvard Classics Daily", subtitle: `${items.length} days`, description: "A 366-day reading plan through the Harvard Classics (metadata only).", source: "data/harvard/guide.json", license, items });
}

// Garden
{
  const d = readJson(path.join(REPO, "data/garden/crops.json"));
  put("garden", { title: "Food garden", subtitle: `${d.crops?.length ?? 0} crops`, description: "Crops, zones, harvests and rotation with sourced data.", source: "data/garden/crops.json", license,
    items: (d.crops ?? []).map((c) => ({ title: c.n || c.name, subtitle: `${c.fam || ""} · ${c.t || ""}`, body: `Harvest ${c.h || ""} · calories ${c.cal || ""}`, meta: c })) });
}

// Science Lab index
{
  const d = readYaml(path.join(REPO, "data/science_lab.yaml"));
  const list = Array.isArray(d) ? d : (d.simulations ?? d.labs ?? []);
  put("science-lab", { title: "Science Lab", subtitle: `${list.length} simulations`, description: "Real physics, chemistry and biology simulations with missions and equations.", source: "data/science_lab.yaml", license,
    items: list.map((s) => ({ title: s.title, subtitle: s.topic || s.kind, body: (s.text || "").slice(0, 300), meta: s })) });
}

// Reference datasets (Tier C)
const refs = [
  ["timeline", "Timeline", "data/timeline.yaml", (d) => (d.events ?? []).map((e) => ({ title: e.title || e.name, subtitle: `${e.year || e.date || ""}`, body: (e.text || e.summary || "").slice(0, 400), meta: e }))],
  ["infographics", "Infographics", "data/infographics.yaml", (d) => (Array.isArray(d) ? d : (d.items ?? [])).map((e) => ({ title: e.title || e.name, subtitle: e.category || "", body: e.description || e.summary || e.text || "", meta: e }))],
  ["resources", "Resources", "data/resources.yaml", (d) => (Array.isArray(d) ? d : (d.groups ?? d.items ?? [])).flatMap((g) => (g.items ?? [g]).map((e) => ({ title: e.title || e.name, subtitle: g.title || g.name || "", body: e.note || e.text || e.description || "", meta: e })))],
  ["videos", "Videos", "data/videos.yaml", (d) => Object.entries(d).map(([id, e]) => ({ title: e.title || e.name || id, subtitle: e.topic || e.date || "", body: e.description || (e.chapters ?? []).map((c) => c.title || c).join(" · "), meta: { ...e, youtube: id } }))],
  ["credits", "Credits & licences", "data/credits.yaml", (d) => [...(d.site ?? []), ...(d.sections ?? []), ...(d.more ?? [])].flatMap((g) => (g.items ?? []).map((e) => ({ title: e.name || e.title, subtitle: e.licence || e.license || "", body: e.what || "", meta: e })))],
  ["asl", "Sign language", "data/asl.yaml", (d) => (d.path ?? d.paths ?? d.items ?? []).map((e) => ({ title: e.title || e.name, subtitle: e.kind || "", body: (e.text || e.summary || "").slice(0, 400), meta: e }))],
];
for (const [key, name, rel, fn] of refs) {
  const p = path.join(REPO, rel);
  if (!exists(p)) continue;
  try {
    const d = rel.endsWith(".json") ? readJson(p) : readYaml(p);
    const items = fn(d).filter((x) => x.title);
    put(key, { title: name, subtitle: `${items.length} items`, description: "Reference data from the Teddy Rook Book corpus.", source: rel, license, items });
  } catch (e) { console.log(`  skip ${key}: ${String(e).slice(0, 80)}`); }
}

console.log(`Datasets written to ${OUT}`);
