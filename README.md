# Curiousity — Physics Figures

An interactive STEM learning app that teaches by taking figures apart. Lessons are
backed by a 22-subject / 5,321-topic content corpus, with real practice generators,
answer checking and one shared progress engine (spaced review).

**Free and open-source software (MIT) with a non-commercial, open-licensed corpus
(CC BY-NC 4.0).** It is not "fully open" content: the lessons forbid commercial
reuse. See [LICENSING.md](LICENSING.md). Free forever: no accounts, no ads, no
tracking, no paid tier. Progress stays on your device until you export it.

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
npm test             # unit tests, content contract, data integrity
npm run coverage     # generator coverage report -> content/coverage-report.json
npm run links        # fail if absolute upstream links regress past baseline
```

**Generator coverage:** 5,255 of 5,321 topics (98.8%) have a working generator;
0 throw at level 1. The remaining topics are music scores, which are played in
the Music Lab rather than generated as problems.

`build` publishes content and refreshes vendored assets first. The vendored
assets are committed, so a clone without the upstream `../trb` repo still builds.

## The corpus lives outside the tree

`content/` is not committed. A published site is capped at 2,000 files and the
corpus alone is 11k+ of them, so `scripts/fetch-corpus.mjs` restores it from the
commit pinned inside that script before dev, test and build — a fresh clone
needs no extra steps, and an author checkout that still has `content/` is left
alone. `scripts/publish-content.mjs` then bundles it into `public/content/`:
one pack per course (`{ index, topics: { <slug>: <bundle> } }`) plus a handful of
single-file documents, which is what the app fetches at runtime.

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


## Licences

See [LICENSING.md](LICENSING.md) for the terms of each part: the application code
(licence still to be chosen), the non-commercial lesson corpus, the Marble data
under ODbL and CC BY-SA, and the vendored engine. The app's About page is at `?about`.

## Content contract

`npm test` runs a content contract over every topic bundle: JSON parses, id and
title are present, there is at least one block with text, sources are listed, no
empty `try` stubs, no unbalanced `$` maths spans, and no leftover `\role{…}`
markup. In report mode it prints counts and writes `content-contract-report.json`
without failing. `npm run contract` runs it in strict mode against
`src/state/content-contract.baseline.json`, where each check's allowance is set.
