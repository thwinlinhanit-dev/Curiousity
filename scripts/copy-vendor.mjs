// Copy the repo's proven viz toolkit + generators into public/vendor.
// Also publish ingest content into public/content for runtime fetch.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const REPO = path.resolve(ROOT, "..", "trb");
const DST = path.resolve(ROOT, "public/vendor");
const VIZ = path.join(DST, "viz");

// The upstream source repo (`../trb`) is only present in the authoring checkout.
// public/vendor is committed, so a clean clone or CI checkout builds without it.
const HAS_REPO = fs.existsSync(REPO);
if (!HAS_REPO) {
  console.log(`vendor: ${REPO} not found — keeping the committed public/vendor/ as-is`);
}

fs.mkdirSync(DST, { recursive: true });
fs.mkdirSync(VIZ, { recursive: true });

// Music kit: parser, SVG staff renderer, synth, keyboard and player.
const musicKit = path.join(REPO, "static/music/kit");
if (HAS_REPO && fs.existsSync(musicKit)) {
  const mDst = path.join(DST, "music");
  fs.mkdirSync(mDst, { recursive: true });
  for (const f of ["audio.js", "song.js", "staff.js", "keyboard.js", "player.js", "kit.css"]) {
    if (fs.existsSync(path.join(musicKit, f))) {
      fs.copyFileSync(path.join(musicKit, f), path.join(mDst, f));
      if (f === "keyboard.js") {
        // Upstream labels duplicate the aria-label text; hide the visual spans from a11y.
        const p = path.join(mDst, f);
        let s = fs.readFileSync(p, "utf8");
        s = s.replace("'<span class=\"mk-lab\">'", "'<span class=\"mk-lab\" aria-hidden=\"true\">'")
             .replace("'<span class=\"mk-mid\">middle C</span>'", "'<span class=\"mk-mid\" aria-hidden=\"true\">middle C</span>'");
        fs.writeFileSync(p, s);
      }
      console.log("vendor: music/" + f);
    }
  }
}

const axePath = path.resolve(ROOT, "node_modules/axe-core/axe.min.js");
if (fs.existsSync(axePath)) {
  fs.copyFileSync(axePath, path.join(DST, "axe.min.js"));
  console.log("vendor: axe.min.js");
}

const files = [
  ["static/homeschool/calc/cas.js", "cas.js"],
  ["static/math/core/engine.js", "engine.js"],
  ["static/math/core/gen.js", "gen.js"],
  ["static/math/core/tex.js", "tex.js"],
  ["static/math/core/check.js", "check.js"],
  ["static/math/core/core.css", "core.css"],
  ["static/math/viz/core.js", "core.js"],
  ["static/math/viz/viz.css", "viz.css"],
  ["static/math/viz/basic.js", "viz/math-basic.js"],
  ["static/physics/viz/physics.css", "physics.css"],

];
if (HAS_REPO) {
  for (const [src, name] of files) {
    const srcPath = path.join(REPO, src);
    if (!fs.existsSync(srcPath)) { console.warn("vendor: skipped missing", src); continue; }
    const dst = path.join(DST, name);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(srcPath, dst);
    console.log("vendor:", name, fs.statSync(dst).size, "bytes");
  }
}

// All ladder visual kits and generators, namespaced by ladder to avoid filename collisions.
const catalogPath = path.resolve(ROOT, "content/catalog.json");
const catalog = fs.existsSync(catalogPath)
  ? JSON.parse(fs.readFileSync(catalogPath, "utf8"))
  : { ladders: [] };
const vizManifest = {}, genManifest = {}, vizCssManifest = {};
let vizTotal = 0, genTotal = 0;
for (const ladder of catalog.ladders) {
  const key = ladder.key;
  // viz kits
  const vSrc = path.join(REPO, "static", key, "viz");
  const vDst = path.join(VIZ, key);
  const vNames = [], cssNames = [];
  if (fs.existsSync(vSrc)) {
    fs.mkdirSync(vDst, { recursive: true });
    for (const f of fs.readdirSync(vSrc)) {
      if (f.endsWith(".js")) {
        fs.copyFileSync(path.join(vSrc, f), path.join(vDst, f));
        vNames.push(f);
      } else if (f.endsWith(".css")) {
        // The kit's JS emits SVG elements with class names whose fills/strokes
        // live in these stylesheets. Without them, rects fall back to black.
        fs.copyFileSync(path.join(vSrc, f), path.join(vDst, f));
        cssNames.push(f);
      }
    }
  }
  vizManifest[key] = vNames; vizTotal += vNames.length;
  vizCssManifest[key] = cssNames;
  // generators
  const gSrc = path.join(REPO, "static", key, "gen");
  const gDst = path.join(DST, "gen", key);
  const gNames = [];
  if (fs.existsSync(gSrc)) {
    fs.mkdirSync(gDst, { recursive: true });
    for (const f of fs.readdirSync(gSrc).filter((x) => x.endsWith(".js"))) {
      fs.copyFileSync(path.join(gSrc, f), path.join(gDst, f));
      gNames.push(f);
    }
  }
  genManifest[key] = gNames; genTotal += gNames.length;
}
fs.writeFileSync(path.join(DST, "viz-manifest.json"), JSON.stringify(vizManifest, null, 2));
fs.writeFileSync(path.join(DST, "gen-manifest.json"), JSON.stringify(genManifest, null, 2));
fs.writeFileSync(path.join(DST, "viz-css-manifest.json"), JSON.stringify(vizCssManifest, null, 2));
console.log(`viz kits: ${vizTotal} across ${Object.keys(vizManifest).length} ladders`);
console.log(`generators: ${genTotal} across ${Object.keys(genManifest).length} ladders`);

// Publish ingest output for runtime fetch.
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}
const contentSrc = path.resolve(ROOT, "content");
const contentDst = path.resolve(ROOT, "public/content");
if (fs.existsSync(contentSrc)) {
  copyDir(contentSrc, contentDst);
  console.log("content published to public/content");
}
