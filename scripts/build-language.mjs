// Normalise the Jerome language-lab data: tap-any-word passages and every form
// of the 345 most common NT Greek and Latin words.
// Source: trb/data/jerome/*.json (Greek NT CC BY 4.0; some language data non-commercial).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.resolve(root, "../trb/data/jerome");
const dst = path.resolve(root, "content/apps/language.json");
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), "utf8"));

const passages = read("passages.json").passages.map((p) => ({
  n: p.n, ref: p.ref, book: p.book, ctx: p.ctx ?? "",
  gk: p.gk ?? [], la: p.la ?? [], en: p.en ?? "",
}));
const forms = {};
for (const [lang, file] of [["greek", "forms_greek.json"], ["latin", "forms_latin.json"]]) {
  forms[lang] = {};
  for (const [slug, f] of Object.entries(read(file))) {
    const asText = (v) => Array.isArray(v) ? v.map(asText).join(" ") : (v == null ? "" : String(v));
    forms[lang][slug] = {
      w: f.w, pron: f.pron, pos: f.pos, mean: f.mean,
      notes: (f.notes ?? []).map(asText),
      tables: (f.tables ?? []).map((t) => ({
        title: asText(t.title), head: (t.head ?? []).map(asText),
        rows: (t.rows ?? []).map(asText),
      })),
    };
  }
}
const out = {
  source: "Teddy Rook Book — Greek and Latin with Jerome",
  source_url: "https://teddyrookbook.com/languages/",
  license: "Greek NT CC BY 4.0; Teddy Rook CC BY-NC 4.0; attribute + link back required",
  passages, forms,
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`language: ${passages.length} passages, ${Object.keys(forms.greek).length} Greek + ${Object.keys(forms.latin).length} Latin forms, ${(fs.statSync(dst).size / 1024 / 1024).toFixed(2)} MB`);
