// Normalise the 345 most common NT Greek and Latin words into a daily-puzzle
// deck. Source: trb/data/jerome/vocab.json (CC BY-NC 4.0, Teddy Rook Book).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.resolve(root, "../trb/data/jerome/vocab.json");
const dst = path.resolve(root, "content/apps/words.json");

const vocab = JSON.parse(fs.readFileSync(src, "utf8"));
const pack = (list, lang) => list
  .filter((w) => /^[a-z]{3,9}$/.test(w.slug) && w.mean)
  .map((w) => ({ w: w.w, slug: w.slug, pron: w.pron, mean: w.mean, rank: w.rank, lang }));

const out = {
  title: "Daily Greek & Latin word puzzle",
  source: "Teddy Rook Book — Greek and Latin with Jerome study companion",
  source_url: "https://teddyrookbook.com/languages/",
  license: "CC BY-NC 4.0 — Teddy Rook; credit + link back required",
  greek: pack(vocab.greek, "greek"),
  latin: pack(vocab.latin, "latin"),
};
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, `${JSON.stringify(out)}\n`);
console.log(`words: ${out.greek.length} Greek, ${out.latin.length} Latin`);
