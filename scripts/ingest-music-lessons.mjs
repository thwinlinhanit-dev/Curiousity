// Ingest the Teddy Rook music curriculum pages (trb/content/music/**.html)
// into content/music/lessons/<course>/<slug>.json: frontmatter + body HTML
// with the interactive data-ml widgets intact.
//
// The chapter HTML is rendered by src/components/MusicChapter.tsx, which loads
// the vendored lessons engine (public/vendor/music/lessons/) and mounts every
// [data-ml] widget in the page: playable keyboards, staff drills, checklists.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const SRC = path.join(REPO, "content/music");
const OUT = path.join(ROOT, "content/music/lessons");

// course dir → { key, title, short, icon }
const COURSES = {
  "piano-basics": { key: "pb", title: "Piano basics", short: "Piano", icon: "🎹" },
  "reading-music": { key: "rm", title: "Reading music", short: "Reading", icon: "📖" },
  guitar: { key: "gtr", title: "Guitar", short: "Guitar", icon: "🎸" },
  ukulele: { key: "uke", title: "Ukulele", short: "Ukulele", icon: "🌺" },
  banjo: { key: "bjo", title: "Banjo", short: "Banjo", icon: "🪕" },
  "continued-fraction-suite": { key: "cfs", title: "The Continued-Fraction Suite", short: "Suite", icon: "🎼" },
};

function parsePage(raw) {
  const text = String(raw).replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = {};
  if (m) {
    let listKey = null;
    for (const line of m[1].split("\n")) {
      const li = line.match(/^\s+-\s+(.*)$/);
      if (li && listKey) {
        const inline = li[1].match(/^\{\s*slug:\s*([\w-]+)\s*(?:,\s*why:\s*"(.*)"\s*)?\}$/);
        (fm[listKey] ??= []).push(inline ? { slug: inline[1], why: inline[2] || "" } : li[1].replace(/^"|"$/g, ""));
        continue;
      }
      const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
      if (!kv) { if (line.trim() && !line.startsWith(" ")) listKey = null; continue; }
      let v = kv[2].trim();
      if (!v) { listKey = kv[1]; fm[listKey] = []; continue; }
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("“") && v.endsWith("”"))) v = v.slice(1, -1);
      fm[kv[1]] = v;
      listKey = null;
    }
  }
  const body = (m ? text.slice(m[0].length) : text).trim();
  return { fm, body };
}

// Remember bullets become the practice bank: each is a checkable statement.
function rememberBullets(html) {
  const out = [];
  const re = /<div class="ml-sum">([\s\S]*?)<\/div>\s*(?:<|$)/g;
  let m;
  while ((m = re.exec(html))) {
    for (const li of m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const t = li[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (t.length > 12) out.push(t);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) { console.error("ingest-music-lessons: no " + SRC); process.exit(1); }
  fs.rmSync(OUT, { recursive: true, force: true });
  const manifest = [];
  for (const [dir, meta] of Object.entries(COURSES)) {
    const base = path.join(SRC, dir);
    if (!fs.existsSync(base)) continue;
    const files = fs.readdirSync(base).filter((f) => f.endsWith(".html") && !f.startsWith("_"));
    const rows = [];
    for (const f of files) {
      const { fm, body } = parsePage(fs.readFileSync(path.join(base, f), "utf8"));
      const slug = f.replace(/\.html$/, "");
      const rec = {
        course: meta.key, slug,
        title: fm.title || slug,
        pill: fm.pill || "",
        description: fm.description || "",
        lead: fm.lead || "",
        weight: Number(fm.weight || rows.length + 1),
        icon: fm.icon || meta.icon,
        songs: (Array.isArray(fm.songs) ? fm.songs : []).filter((x) => x && x.slug),
        remember: rememberBullets(body),
        html: body,
      };
      fs.mkdirSync(path.join(OUT, meta.key), { recursive: true });
      fs.writeFileSync(path.join(OUT, meta.key, `${slug}.json`), JSON.stringify(rec));
      rows.push(rec);
      manifest.push({ id: `${meta.key}.${slug}`, course: meta.key, slug, title: rec.title, weight: rec.weight, remember: rec.remember.length, songs: rec.songs.length });
    }
    rows.sort((a, b) => a.weight - b.weight);
    fs.writeFileSync(path.join(OUT, `${meta.key}.json`), JSON.stringify({ ...meta, topics: rows.map((r) => r.slug) }, null, 1));
  }
  const withR = manifest.filter((m) => m.remember > 0).length;
  console.log(`music lessons: ${manifest.length} chapters · ${withR} with a Remember bank`);
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
}

main();
