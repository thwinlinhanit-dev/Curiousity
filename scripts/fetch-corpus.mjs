// The corpus (content/) is not carried in the working tree.
//
// A published site is capped at 2,000 files, and the corpus alone is 11k+ of
// them, so it travels as the archive of the commit pinned below and is
// unpacked here before anything publishes, tests or bundles it.
//
// If the tree already has content/, this does nothing — an author checkout that
// still carries it keeps working unchanged.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const SRC = path.resolve(ROOT, "content");
const MARK = path.join(SRC, "catalog.json");

const OWNER = "thwinlinhanit-dev";
const REPO = "Curiousity";
// The last commit that carries content/ in the tree. Commits are immutable, so
// this keeps resolving even after the corpus leaves later commits.
const REF = "2da1050796138971a22c37885611af169af8a455";

const cstr = (buf, start, len) => {
  const slice = buf.subarray(start, start + len);
  const z = slice.indexOf(0);
  return (z === -1 ? slice : slice.subarray(0, z)).toString("utf8");
};

// "path=content/x.json" records that precede long names in a pax archive.
function paxPath(data) {
  const text = data.toString("utf8");
  let i = 0, found = null;
  while (i < text.length) {
    const sp = text.indexOf(" ", i);
    if (sp === -1) break;
    const len = parseInt(text.slice(i, sp), 10);
    if (!len) break;
    const record = text.slice(sp + 1, i + len - 1);
    const eq = record.indexOf("=");
    if (eq > -1 && record.slice(0, eq) === "path") found = record.slice(eq + 1);
    i += len;
  }
  return found;
}

// Minimal ustar reader: regular files under <top>/content/ are written back to
// the repository, everything else in the archive is ignored.
function extract(buf) {
  let off = 0, top = null, files = 0, pax = null, longName = null;
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    let name = cstr(header, 0, 100);
    const sizeField = cstr(header, 124, 12).trim();
    const size = sizeField ? parseInt(sizeField, 8) : 0;
    const type = String.fromCharCode(header[156]);
    const prefix = cstr(header, 345, 155);
    if (prefix) name = `${prefix}/${name}`;
    const dataStart = off + 512;
    const data = buf.subarray(dataStart, dataStart + size);

    if (type === "x") pax = paxPath(data);
    else if (type === "g") { /* global pax block: nothing we need */ }
    else if (type === "L") longName = cstr(data, 0, data.length);
    else {
      const full = pax || longName || name;
      pax = null;
      longName = null;
      if (!top && full.includes("/")) top = full.split("/")[0];
      const isFile = type === "0" || type === "\0" || type === "7";
      if (isFile && top && full.startsWith(`${top}/content/`)) {
        const dest = path.join(ROOT, full.slice(top.length + 1));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, data);
        files += 1;
      }
    }

    off = dataStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

if (fs.existsSync(MARK)) {
  console.log("corpus: content/ already present");
} else {
  const url = `https://codeload.github.com/${OWNER}/${REPO}/tar.gz/${REF}`;
  console.log(`corpus: fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`corpus: download failed (${res.status}) — ${url}`);
  const tar = zlib.gunzipSync(Buffer.from(await res.arrayBuffer()));
  const files = extract(tar);
  if (!fs.existsSync(MARK)) throw new Error(`corpus: archive ${REF.slice(0, 7)} carried no content/catalog.json`);
  console.log(`corpus: restored ${files} files from ${REF.slice(0, 7)}`);
}
