// Ingest the remaining high-value corpus families into content/apps/*.json.
// All data comes from ../trb/data (CC BY-NC 4.0 unless noted in the source).
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const D = path.resolve(root, "../trb/data");
const OUT = path.resolve(root, "content/apps");
fs.mkdirSync(OUT, { recursive: true });

const j = (f) => JSON.parse(fs.readFileSync(path.join(D, f), "utf8"));
const y = (f) => YAML.parse(fs.readFileSync(path.join(D, f), "utf8"));
const put = (name, data) => {
  fs.writeFileSync(path.join(OUT, `${name}.json`), `${JSON.stringify(data, null, 0)}\n`);
  console.log(`${name}: ${JSON.stringify(data).length} bytes`);
};
const META = (title, source, url) => ({ title, source: `Teddy Rook Book — ${source}`, source_url: url, license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required" });

// AP exam maps → exact ladder topics for practice
{
  const dir = path.join(D, "testprep/ap");
  const exams = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")).map((f) => {
    const a = y(`testprep/ap/${f}`);
    return { key: a.key, title: a.title, ladder: a.ladder, blurb: a.blurb ?? "", source_url: a.source_url ?? "",
      units: (a.units ?? []).map((u) => ({ num: u.num, title: u.title, weight: u.weight ?? "", topics: u.topics ?? [] })) };
  });
  put("ap-maps", { ...META("AP exam maps", "Test Prep", "https://teddyrookbook.com/test-prep/"), exams });
}

// Bible in a Year — daily plan, 66/73-book canons
{
  const b = j("bibleyear.json");
  put("bible-year", { ...META("Bible in a Year", "Bible in a Year", "https://teddyrookbook.com/bible-in-a-year/"),
    days: b.days, plans: b.plans, books: b.books, eras: b.eras, stats: b.stats });
}

// Great Books ideas — 60 essays across 6 groups
{
  const i = y("greatbooks/ideas.yaml");
  const pages = {};
  for (const f of fs.readdirSync(path.join(D, "greatbooks/ideas_pages")).filter((x) => x.endsWith(".yaml"))) {
    pages[f.replace(/\.yaml$/, "")] = y(`greatbooks/ideas_pages/${f}`);
  }
  put("ideas", { ...META("The Great Ideas", "Great Books", "https://teddyrookbook.com/great-books/"),
    groups: i.groups, ideas: i.ideas, pages });
}

// Phonics — complete early-reading sequence
{
  const p = j("phonics.json");
  put("phonics", { ...META("Phonics", "Phonics Practice", "https://teddyrookbook.com/homeschool/actual-reading/phonics-practice/"),
    steps: p.steps, pics: p.pics, names: p.names, practice: p.practice });
}

// Family units — 28 multi-subject units with projects
{
  const dir = path.join(D, "family/units");
  const units = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")).map((f) => {
    const u = y(`family/units/${f}`);
    return { key: f.replace(/\.yaml$/, ""), title: u.title || u.name, blurb: u.blurb || u.summary || "",
      parts: u.parts ?? [], projects: u.projects ?? [], ages: u.ages ?? "" };
  });
  put("family-units", { ...META("Family Units", "Homeschool", "https://teddyrookbook.com/homeschool/"), units });
}

// US citizenship test — both question sets
{
  const qs = ["2008", "2025"].map((v) => {
    const d = j(`civics/uscis/${v}.json`);
    const list = Array.isArray(d) ? d : (d.questions ?? []);
    return { version: v, questions: list };
  });
  put("citizenship", { ...META("US Citizenship Test", "Civics", "https://teddyrookbook.com/american-history/citizenship-test/"), sets: qs });
}

// Business cases — 40 real company stories
{
  const c = y("business_cases.yaml");
  put("cases", { ...META("Business Cases", "Business", "https://teddyrookbook.com/business/cases/"),
    cases: c.cases ?? (Array.isArray(c) ? c : []), libraries: c.libraries ?? [] });
}

// Meal extras — catalog, from-scratch, garden map, guides
{
  const catalog = j("meals/catalog.json");
  const scratch = j("meals/scratch.json");
  const gardenMap = j("meals/garden-map.json");
  put("meal-extras", { ...META("Meal Prep extras", "Meal Prep", "https://teddyrookbook.com/meal-prep/"),
    catalog: catalog.items ?? catalog.catalog ?? [], scratch: scratch.recipes ?? [], garden: gardenMap.items ?? [] });
}

// Homeschool book shelf — public-domain textbook lessons (exclude withheld hs_hannah)
{
  const books = [];
  for (const f of fs.readdirSync(D).filter((x) => /^(hs_|rays_).*\.yaml$/.test(x) && x !== "hs_hannah.yaml")) {
    try {
      const b = y(f);
      const lessons = b.lessons ?? [];
      books.push({ key: f.replace(/\.yaml$/, ""), title: b.title || b.name || f, author: b.author ?? "",
        lessons: lessons.length, units: (b.units ?? []).map((u) => u.title || u.name || String(u)).slice(0, 40) });
    } catch { /* skip unparsable aliases */ }
  }
  put("hs-books", { ...META("Classic Schoolbooks", "Homeschool", "https://teddyrookbook.com/homeschool/"), books });
}

// Science units — 42 chapters with live simulation hooks
{
  const files = fs.readdirSync(path.join(D, "science_units")).filter((f) => f.endsWith(".yaml"));
  const units = files.map((f) => ({ key: f.replace(/\.yaml$/, ""), ...y(`science_units/${f}`) }));
  put("science-units", { ...META("Science units", "Science Lab", "https://teddyrookbook.com/science-lab/"), units });
}

// Competition problems — reproduce originals freely; link to official IMO/Putnam
{
  const problems = [];
  const walk = (dir, kind) => {
    if (!fs.existsSync(path.join(D, "comp", dir))) return;
    for (const f of fs.readdirSync(path.join(D, "comp", dir), { withFileTypes: true })) {
      const rel = `comp/${dir}/${f.name}`;
      if (f.isDirectory()) { walk(`${dir}/${f.name}`, kind); continue; }
      if (!f.name.endsWith(".yaml")) continue;
      try {
        const p = y(rel);
        const list = Array.isArray(p) ? p : (p.problems ?? []);
        for (const item of list) problems.push({ kind, source: rel, title: item.title || item.name || kind,
          problem: kind === "original" ? (item.problem ?? "") : "", hint: item.hint ?? "",
          solution: kind === "original" ? (item.solution ?? "") : "", original: kind === "original" });
      } catch { /* skip */ }
    }
  };
  for (const k of ["original", "imo", "putnam", "schweitzer", "common-test", "tokyo-tech"]) walk(k, k);
  put("competition", { ...META("Competition problems", "Math competitions", "https://teddyrookbook.com/math/competitions/"), problems });
}

// Harvard Classics full daily readings, one file per day, fetched on demand.
{
  const dir = path.resolve(root, "content/harvard");
  fs.mkdirSync(dir, { recursive: true });
  const daysDir = path.join(D, "harvard/days");
  let n = 0;
  if (fs.existsSync(daysDir)) for (const f of fs.readdirSync(daysDir).filter((x) => x.endsWith(".json"))) {
    const d = j(`harvard/days/${f}`);
    const text = (d.readings ?? []).flatMap((r) => (r.text ?? []).map((p) => p.t ?? "")).filter(Boolean).join("\n\n");
    if (!text) continue;
    fs.writeFileSync(path.join(dir, f), `${JSON.stringify({ date: f.replace(/\.json$/, ""), title: d.title ?? "", words: d.words ?? 0, minutes: d.minutes ?? 0, text }, null, 0)}\n`);
    n++;
  }
  console.log(`harvard days: ${n}`);
}
