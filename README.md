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
npm test             # unit tests (figure contract)
```

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
