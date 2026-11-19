# Curiousity — Physics Figures

An interactive STEM learning app that teaches by taking figures apart. Lessons are
backed by a 20-subject / 5,105-topic content corpus, with real practice generators,
answer checking and one shared progress engine (spaced review).

## Stack

React 19 · TypeScript · Vite 6 · Zustand · three.js · Vitest

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` publishes `content/` to `public/content/` first (see
`scripts/publish-content.mjs`). On a fresh clone that directory is empty, so the
first run also covers that step.

```bash
npm run build        # type-check + production bundle into dist/
npm test             # unit tests (figure contract, Marble data)
```

`build` publishes content and refreshes vendored assets first. The vendored
assets are committed, so a clone without the upstream `../trb` repo still builds.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/` | App shell, pages, figures, state, styles |
| `content/` | Ingested corpus: catalog, graph, per-ladder courses and topic bundles |
| `public/vendor/` | Vendored figure kits, generators and math engine (classic scripts) |
| `scripts/` | Content ingestion, vendor copying, audits, idea server |
| `.github/workflows/` | CI: type check, tests, content audit, build |

## Routes

| URL | View |
| --- | --- |
| `/` | Subject hub, progress, libraries |
| `/?s=<ladder>&c=<course>` | Course topic list |
| `/?s=<ladder>&c=<course>&t=<topic>` | Lesson, figure and practice |
| `/?data=<dataset>` | Dataset browser (periodic table, memory lists, recipes, …) |
| `/?lab=fbd` / `/?lab=breadboard` | Interactive labs |
| `/?music=<slug>` | Music lab |

## Content

The corpus is ingested from the upstream Teddy Rook data set (`scripts/ingest-*.mjs`).
Content is CC BY-NC 4.0 — credit and link back required.

## Library ↔ lessons (spec: docs/superpowers/specs/2026-11-19-library-integration-design.md)

Three phases, all committed:

1. **Cross-links** — `npm run content:library` (first half) builds
   `content/library/links.json`: dataset items ↔ lessons, exact/strong only.
   Lessons show a "Go deeper" strip; dataset entries show "Lessons this
   connects to"; `?data=<dataset>&item=<key>` deep-links one entry.
2. **Library ladder** — 59 drills (`mem.*` memory lists, `el.*` periodic-table
   facets, `tl.*` timeline ordering) as ordinary lessons on the same progress
   engine; generators baked into `public/vendor/gen/library/`.
3. **Music ladder** — the 20 playable scores as a real subject
   (`?s=music`), courses by level, prereqs from skill tags
   (`content/music/skill-order.json`), the player embedded as the figure,
   key/time/tempo/chord practice in `public/vendor/gen/music/`.

```bash
npm run content:library   # links + library ladder + generators
npm run content:music     # music ladder + refresh links
```

## Cross-curriculum data (Marble Skill Taxonomy)

Matched lessons carry curriculum standards, a "before this" prerequisite chain,
common misconceptions, authored wrong answers and a grown-up summary. The data
comes from the [Marble Skill Taxonomy](https://github.com/withmarbleapp/os-taxonomy)
(ODbL 1.0 database, CC BY-SA 4.0 content).

```bash
npm run content:marble   # import + match, writes content/marble/
```

The import is additive and isolated: it writes `content/marble/by-topic/<topicId>.json`
and never merges upstream records into `content/<ladder>/`, so the app's own corpus
keeps its licence and ODbL share-alike stays inside that one folder. Attribution is
shown in the panel and repeated in every payload. Unmatched lessons fetch nothing.

Current coverage: 95 of 5,105 lessons (K–8 maths, science, Earth science, chemistry,
biology, civics, writing). Raw upstream files are cached in `.cache/marble/` and are
not committed.
