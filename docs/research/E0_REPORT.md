# E0 — Corpus ingest & multi-ladder app: COMPLETE ✅

**Date:** 2026-11-18 · **Status:** 20 ladders reachable, physics regression green.

## What changed
- `scripts/ingest-corpus.mjs` replaces the physics-only ingest: reads all 20 ladders from `data/<key>/{courses.yaml,topics/*.json,lessons/*.json}` and emits namespaced bundles `content/<ladder>/courses/*.json`, `content/<ladder>/topics/*.json`, a unified `content/graph.json` and `content/catalog.json`.
- `npm run ingest` now runs the corpus ingest.
- `scripts/copy-vendor.mjs` copies **79 viz kits** and **130 generators** across 20 ladders into namespaced `public/vendor/{viz,gen}/<ladder>/` with per-ladder manifests.
- `src/viz/loadViz.ts` → `loadLadder(ladder)` loads only the active ladder's kits/generators; `loadViz()` kept as physics alias.
- `src/state/progress.ts` → `initProgress(ladder, course)` / `setActiveLadder`, graph fetched lazily (`ensureGraph`) so the bundle stays small.
- `App.tsx` → subject hub with 20 ladder chips, ladder/course URL params (`?s=&c=&t=`), course selector, skill map, topic list; physics labs preserved.
- `TopicPage`, `PracticePanel`, `RepoViz`, `ReviewSession`, `ProgressPanel`, `SkillMap` made ladder-aware.
- i18n overlay lookup generalised (`content/i18n/<lang>/<ladder>/topics/<slug>.json` with legacy fallback).

## Verification
- Ingest: **20 ladders / 130 courses / 5,105 topics / 5,105 lessons**.
- Build: `npm test` 4/4 ✓, `npm run build` clean (96 KB gzip main; three/labs lazy).
- Browser: subject hub shows 20 ladders; one topic from **every ladder** loads with no console errors.
- Physics regression: `?s=physics&c=phys1&t=vertical-launch` still shows the MotionFigure and a real generator problem.
- Cross-subject practice: chemistry `matter-classification` produced *"Classify oxygen gas."*, economics `preferences`, logic `statements`, vocab `bene-mal` etc. all produced real problems.

## Notes
- Three sampled topics (memory, robotics, culinary) have no visual in the source; they correctly show the written-lesson fallback.
- Bundle size is back to 96 KB gzip after moving `graph.json` to a lazy fetch.

## Next: E1 — math (28 courses / 1,350 topics)
