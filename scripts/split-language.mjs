// Split the 949 KB language bundle so the lab only fetches what a tab needs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.resolve(root, "content/apps");
const src = JSON.parse(fs.readFileSync(path.join(dir, "language.json"), "utf8"));
const meta = { source: src.source, source_url: src.source_url, license: src.license };

fs.writeFileSync(path.join(dir, "language-passages.json"), `${JSON.stringify({ ...meta, passages: src.passages }, null, 0)}\n`);
fs.writeFileSync(path.join(dir, "lang-greek.json"), `${JSON.stringify({ ...meta, forms: src.forms.greek }, null, 0)}\n`);
fs.writeFileSync(path.join(dir, "lang-latin.json"), `${JSON.stringify({ ...meta, forms: src.forms.latin }, null, 0)}\n`);
console.log("split language: passages", src.passages.length, "forms", Object.keys(src.forms.greek).length + Object.keys(src.forms.latin).length);
